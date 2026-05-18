import { NextResponse } from "next/server";
import {
  isAzureGroupRoleSyncEnabled,
  isAzureManagerSyncEnabled,
  isAzureSsoConfigured,
} from "@/lib/azure-ad";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    configured: isAzureSsoConfigured(),
    managerSyncEnabled: isAzureManagerSyncEnabled(),
    groupRoleSyncEnabled: isAzureGroupRoleSyncEnabled(),
  });
}
