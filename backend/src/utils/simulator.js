const scanInterval = {};
const SCAN_COOLDOWN = 60000;

export const checkCooldown = (uid) => {
  const now = Date.now();
  if (scanInterval[uid] && (now - scanInterval[uid]) < SCAN_COOLDOWN) {
    const remaining = Math.ceil((SCAN_COOLDOWN - (now - scanInterval[uid])) / 1000);
    return { onCooldown: true, remaining };
  }
  scanInterval[uid] = now;
  return { onCooldown: false };
};

export const generateScanPayload = (uid, deviceId = null) => ({
  uid,
  deviceId,
  timestamp: new Date().toISOString(),
});
