import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebase-admin";
import type { SettingsDoc } from "@/lib/types/firestore";

const SETTINGS_COLLECTION = "settings";
const DEFAULT_SETTINGS_ID = "default";

const DEFAULT_SETTINGS: SettingsDoc = {
  settingsId: "default",
  pointsPerUnit: 1000,
  pkrPerUnit: 100,
  minPayoutPoints: 1000,
};

export function calculatePkr(points: number, settings: Pick<SettingsDoc, "pointsPerUnit" | "pkrPerUnit">): number {
  const normalizedPoints = Math.max(0, Number(points) || 0);
  const pointsPerUnit = Math.max(1, Number(settings.pointsPerUnit) || DEFAULT_SETTINGS.pointsPerUnit);
  const pkrPerUnit = Math.max(1, Number(settings.pkrPerUnit) || DEFAULT_SETTINGS.pkrPerUnit);
  return Math.floor((normalizedPoints / pointsPerUnit) * pkrPerUnit);
}

export async function getConversionSettings(): Promise<SettingsDoc> {
  const db = getAdminDb();
  const ref = db.collection(SETTINGS_COLLECTION).doc(DEFAULT_SETTINGS_ID);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    await ref.set({
      ...DEFAULT_SETTINGS,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: "system",
    });

    return DEFAULT_SETTINGS;
  }

  const data = snapshot.data() as Partial<SettingsDoc>;
  return {
    settingsId: "default",
    pointsPerUnit: Number(data.pointsPerUnit ?? DEFAULT_SETTINGS.pointsPerUnit),
    pkrPerUnit: Number(data.pkrPerUnit ?? DEFAULT_SETTINGS.pkrPerUnit),
    minPayoutPoints: Number(data.minPayoutPoints ?? DEFAULT_SETTINGS.minPayoutPoints),
  };
}

export async function updateConversionSettings(input: {
  pointsPerUnit: number;
  pkrPerUnit: number;
  minPayoutPoints?: number;
  updatedBy: string;
}): Promise<SettingsDoc> {
  const pointsPerUnit = Math.max(1, Number(input.pointsPerUnit) || DEFAULT_SETTINGS.pointsPerUnit);
  const pkrPerUnit = Math.max(1, Number(input.pkrPerUnit) || DEFAULT_SETTINGS.pkrPerUnit);
  const minPayoutPoints = Math.max(1, Number(input.minPayoutPoints) || pointsPerUnit);

  const db = getAdminDb();
  const ref = db.collection(SETTINGS_COLLECTION).doc(DEFAULT_SETTINGS_ID);

  await ref.set(
    {
      settingsId: "default",
      pointsPerUnit,
      pkrPerUnit,
      minPayoutPoints,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: input.updatedBy,
    },
    { merge: true },
  );

  return {
    settingsId: "default",
    pointsPerUnit,
    pkrPerUnit,
    minPayoutPoints,
  };
}
