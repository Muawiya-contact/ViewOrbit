export const isLocalMode = process.env.NEXT_PUBLIC_LOCAL_MODE === "true";

export const debugLog = (...args: unknown[]) => {
  if (!isLocalMode) return;
  console.log("[ViewOrbit:debug]", ...args);
};
