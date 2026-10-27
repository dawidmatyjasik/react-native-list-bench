type DeviceSpec = {
  serial: string;
  label: string;
  isPhysical: boolean;
};

export type Device = DeviceSpec & { alias: string };

// The targets used for the article. Physical phones need their adb serial in the environment;
// emulator serials can be overridden the same way.
export const DEVICES: Record<string, DeviceSpec> = {
  s25: {
    serial: process.env.BENCH_S25_SERIAL ?? "",
    label: "Samsung Galaxy S25 (physical)",
    isPhysical: true,
  },
  a21s: {
    serial: process.env.BENCH_A21S_SERIAL ?? "",
    label: "Samsung Galaxy A21s (physical)",
    isPhysical: true,
  },
  "emu-high": {
    serial: process.env.BENCH_EMU_HIGH_SERIAL ?? "emulator-5556",
    label: "Pixel 9 Pro emulator, API 36",
    isPhysical: false,
  },
  "emu-low": {
    serial: process.env.BENCH_EMU_LOW_SERIAL ?? "emulator-5554",
    label: "Low-end emulator, 2 cores, 2 GB, API 30",
    isPhysical: false,
  },
};

export const deviceFor = (alias: string | undefined): Device => {
  const device = alias === undefined ? undefined : DEVICES[alias];
  if (alias === undefined || !device) {
    throw new Error(`Unknown device "${alias}". Known: ${Object.keys(DEVICES).join(", ")}`);
  }
  if (!device.serial) {
    throw new Error(`Set BENCH_${alias.replace(/-/g, "_").toUpperCase()}_SERIAL to the adb serial of the ${device.label}`);
  }
  return { alias, ...device };
};
