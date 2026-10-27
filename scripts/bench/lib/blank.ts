import { execFile, spawn, type ChildProcess } from "node:child_process";
import { promisify } from "node:util";

import { adb, shell, sleep } from "./adb.ts";

const execFileAsync = promisify(execFile);

export type BlankResult = {
  frames: number;
  worstFrameSeconds: number;
  fps: number;
  meanPct: number;
  p95Pct: number;
  maxPct: number;
  framesOver1Pct: number;
  framesOver10Pct: number;
  series: number[];
};

const REMOTE_VIDEO = "/sdcard/listbench-blank.mp4";

// colors.blank in src/theme/colors.ts. Nothing inside a row uses it, so every pixel of this colour
// inside the list area is space the list has not drawn yet.
const BLANK_RGB = [0xff, 0x00, 0xff];
const TOLERANCE = 10;

// The header sits above the list; skip it and the gesture bar at the bottom.
const LIST_TOP = 0.14;
const LIST_BOTTOM = 0.98;

const ANALYSIS_WIDTH = 135;
const ANALYSIS_FPS = 30;

export const startRecording = async (serial: string, { isFullSize = false } = {}): Promise<ChildProcess> => {
  const size = /(\d+)x(\d+)/.exec(await shell(serial, "wm size"));
  if (!size) {
    throw new Error(`Could not read the screen size of ${serial}`);
  }
  const width = isFullSize ? Number(size[1]) : 540;
  const height = Math.round((width * Number(size[2])) / Number(size[1]) / 2) * 2;
  const bitRate = isFullSize ? 20_000_000 : 8_000_000;
  await shell(serial, `rm -f ${REMOTE_VIDEO}`);
  const recorder = spawn("adb", [
    "-s",
    serial,
    "shell",
    `screenrecord --bit-rate ${bitRate} --size ${width}x${height} ${REMOTE_VIDEO}`,
  ]);
  // screenrecord needs a moment before the first frame is captured.
  await sleep(1000);
  return recorder;
};

export const stopRecording = async (serial: string, recorder: ChildProcess, localPath: string): Promise<void> => {
  await shell(serial, "pkill -INT screenrecord").catch(() => {});
  await new Promise(resolve => {
    recorder.on("exit", resolve);
    setTimeout(resolve, 5000);
  });
  await sleep(1000);
  await adb(serial, ["pull", REMOTE_VIDEO, localPath]);
};

const probeSize = async (videoPath: string) => {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height",
    "-of",
    "csv=p=0",
    videoPath,
  ]);
  const [width, height] = stdout.trim().split(",").map(Number);
  return { width, height };
};

const percentile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];

export const analyzeBlank = async (videoPath: string): Promise<BlankResult> => {
  const source = await probeSize(videoPath);
  const width = ANALYSIS_WIDTH;
  const height = Math.round((width * source.height) / source.width / 2) * 2;
  const frameBytes = width * height * 3;
  const top = Math.floor(height * LIST_TOP);
  const bottom = Math.floor(height * LIST_BOTTOM);
  const areaPixels = (bottom - top) * width;

  const decoder = spawn("ffmpeg", [
    "-v",
    "error",
    "-i",
    videoPath,
    "-vf",
    `fps=${ANALYSIS_FPS},scale=${width}:${height}`,
    "-f",
    "rawvideo",
    "-pix_fmt",
    "rgb24",
    "-",
  ]);

  const fractions: number[] = [];
  let pending = Buffer.alloc(0);
  decoder.stdout.on("data", (chunk: Buffer) => {
    pending = Buffer.concat([pending, chunk]);
    while (pending.length >= frameBytes) {
      const frame = pending.subarray(0, frameBytes);
      pending = pending.subarray(frameBytes);
      let blank = 0;
      for (let y = top; y < bottom; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 3;
          if (
            Math.abs(frame[i] - BLANK_RGB[0]) <= TOLERANCE &&
            Math.abs(frame[i + 1] - BLANK_RGB[1]) <= TOLERANCE &&
            Math.abs(frame[i + 2] - BLANK_RGB[2]) <= TOLERANCE
          ) {
            blank += 1;
          }
        }
      }
      fractions.push(blank / areaPixels);
    }
  });

  await new Promise<void>((resolve, reject) => {
    decoder.on("exit", code => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`))));
  });

  const sorted = [...fractions].sort((a, b) => a - b);
  const toPct = (value: number) => Math.round(value * 10000) / 100;
  const worstFrame = fractions.indexOf(sorted[sorted.length - 1]);
  return {
    frames: fractions.length,
    worstFrameSeconds: worstFrame / ANALYSIS_FPS,
    fps: ANALYSIS_FPS,
    meanPct: toPct(fractions.reduce((sum, value) => sum + value, 0) / Math.max(1, fractions.length)),
    p95Pct: toPct(percentile(sorted, 0.95) ?? 0),
    maxPct: toPct(sorted.at(-1) ?? 0),
    framesOver1Pct: toPct(fractions.filter(value => value > 0.01).length / Math.max(1, fractions.length)),
    framesOver10Pct: toPct(fractions.filter(value => value > 0.1).length / Math.max(1, fractions.length)),
    series: fractions.map(value => Math.round(value * 1000) / 1000),
  };
};

// Saves the frame with the most unrendered area, which is the picture a reader needs to believe
// the number.
export const saveWorstFrame = (videoPath: string, seconds: number, imagePath: string): Promise<unknown> =>
  execFileAsync("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-ss",
    String(seconds),
    "-i",
    videoPath,
    "-frames:v",
    "1",
    "-q:v",
    "4",
    imagePath,
  ]);
