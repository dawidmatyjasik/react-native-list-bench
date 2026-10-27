# List Bench

A Software Mansion benchmark app that compares React Native lists under the same rows, data and
gestures: `FlatList`, `FlashList`, `LegendList` and `LegendList` with `recycleItems`, plus a tuned
`FlatList` and a `FlashList` with a capped recycle pool.

It goes with the article "How to measure React Native performance deterministically", which
describes the method: replayed gestures, a fixed start state, a cool phone and frame counts from
`dumpsys gfxinfo`.

## What is in here

- `src/` — the app. One bench screen, driven by a deep link:
  `listbench://bench?list=flashlist&scenario=heavy&count=10000&mode=idle&hints=0`.
  Eight scenarios (`tiny`, `medium`, `heavy`, `variable`, `mixed`, `grid`, `shelves`, `chat`) and
  in-app modes for things a gesture cannot express (`mount`, `jump`, `ticker`, `stream`, `infinite`).
- `.argent/e2e/` — the gestures, as [Argent](https://github.com/software-mansion/argent) e2e tests.
- `scripts/bench/` — the runner (Flashlight + Argent + logcat + screen recordings), the aggregator,
  the charts and the report tables.

## Running it

Android only, because Flashlight is. You need Node 24 or newer (the scripts are TypeScript run
directly by Node), pnpm, a release build, Argent and Flashlight on your `PATH`, and a device on
`adb`.

```bash
pnpm install
pnpm exec expo prebuild --platform android
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a && cd ..
adb install -r android/app/build/outputs/apk/release/app-release.apk

BENCH_S25_SERIAL=<adb serial> node scripts/bench/run.ts --device s25 --suite core --rounds 3
node scripts/bench/aggregate.ts
node scripts/bench/charts.ts && ./scripts/bench/charts-png.sh
node scripts/bench/report.ts s25
node scripts/bench/flashlight-reports.ts

# one demo video per list, nothing measured
BENCH_S25_SERIAL=<adb serial> node scripts/bench/record.ts --device s25 --scenario heavy --flow fling-down
```

Raw runs land in `bench-results/raw` (not committed), Flashlight's own web reports, one per device
and case, in `bench-results/reports` (start at `index.html`), and demo videos in
`bench-results/videos`. A run that already has a result is skipped, so a suite can be stopped and
resumed. Each script lists its options in the comment at its top.
