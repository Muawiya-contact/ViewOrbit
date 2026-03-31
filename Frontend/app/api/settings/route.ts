import { NextResponse } from "next/server";
import { getConversionSettings } from "@/lib/server/services/points-service";

export async function GET() {
  try {
    const settings = await getConversionSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[settings] GET failed", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}
