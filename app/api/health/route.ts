import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import os from 'os';

export async function GET() {
  const checks: Record<string, unknown> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  };

  // Database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'connected';
  } catch {
    checks.database = 'disconnected';
    checks.status = 'degraded';
  }

  // System metrics (lightweight)
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  checks.memory = {
    usedPercent: Math.round(((totalMem - freeMem) / totalMem) * 100),
    freeMB: Math.round(freeMem / 1024 / 1024),
  };
  checks.uptime = Math.round(os.uptime());
  checks.loadAvg = os.loadavg()[0]?.toFixed(2);

  // Always return 200 so container health checks pass even when DB is temporarily unavailable.
  // Callers should inspect the JSON body for the actual status field.
  return NextResponse.json(checks, {
    status: 200,
    headers: { 'Cache-Control': 'no-cache, no-store' },
  });
}
