import { api } from "../../../lib/api";
import { clearAuth } from "../../../lib/auth";

export const stopDoctorIntervals = (intervalRef, heartbeatRef) => {
  if (intervalRef?.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
  if (heartbeatRef?.current) {
    clearInterval(heartbeatRef.current);
    heartbeatRef.current = null;
  }
};

export const bootDoctorSession = async ({
  safeSet,
  setErr,
  loadQueue,
  loadAgenda,
  loadShiftStatus,
  loadNotifications,
  loadPreferences,
  intervalRef,
  heartbeatRef,
}) => {
  try {
    await api.doctorCheckin?.();
  } catch (e) {
    safeSet(() => setErr(e.message));
  }

  await Promise.all([
    loadQueue(),
    loadAgenda(),
    loadShiftStatus(),
    loadNotifications(),
    loadPreferences(),
  ]);

  intervalRef.current = setInterval(
    () => {
      loadQueue();
      loadAgenda();
    },
    30 * 60 * 1000
  );

  heartbeatRef.current = setInterval(async () => {
    try {
      await api.doctorHeartbeat?.();
    } catch {
      // Ignore heartbeat failures; the next cycle can recover.
    }
  }, 30000);
};

export const logoutDoctorSession = async ({ intervalRef, heartbeatRef }) => {
  stopDoctorIntervals(intervalRef, heartbeatRef);
  try {
    await api.doctorCheckout?.();
  } catch {
    // Ignore checkout failures during logout.
  }
  clearAuth();
  window.location.replace("/login");
};
