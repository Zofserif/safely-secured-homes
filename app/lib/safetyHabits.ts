import type { FormData } from "./types";

const toNullableBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

export const normalizeSafetyHabitAnswers = (data: FormData): FormData => ({
  ...data,
  has_spare_key: toNullableBoolean(data.has_spare_key),
  changed_wifi_default_password: toNullableBoolean(
    data.changed_wifi_default_password
  ),
  sleeps_with_earphones: toNullableBoolean(data.sleeps_with_earphones),
  locks_windows_gate_at_night: toNullableBoolean(data.locks_windows_gate_at_night),
  has_security_cameras: toNullableBoolean(data.has_security_cameras),
  has_smoke_alarm_or_fire_extinguisher: toNullableBoolean(
    data.has_smoke_alarm_or_fire_extinguisher
  ),
  has_first_aid_or_medicine_ready: toNullableBoolean(
    data.has_first_aid_or_medicine_ready
  ),
  knows_local_emergency_contacts: toNullableBoolean(
    data.knows_local_emergency_contacts
  ),
});
