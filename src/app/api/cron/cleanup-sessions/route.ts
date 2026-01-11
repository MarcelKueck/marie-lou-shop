import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest, unauthorizedResponse, logCronStart, logCronComplete, logCronError } from '@/lib/cron-auth';
import { cleanupExpiredSessions } from '@/lib/auth';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { lt, sql } from 'drizzle-orm';

const JOB_NAME = 'cleanup-sessions';

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return unauthorizedResponse();
  }

  logCronStart(JOB_NAME);

  try {
    // Count expired sessions before cleanup
    const now = new Date();
    const expiredCount = await db.select({
      count: sql<number>`count(*)`,
    })
    .from(sessions)
    .where(lt(sessions.expiresAt, now));
    
    const countBefore = Number(expiredCount[0]?.count || 0);

    // Run the cleanup
    await cleanupExpiredSessions();

    const result = {
      expiredSessionsRemoved: countBefore,
      cleanedAt: now.toISOString(),
    };

    logCronComplete(JOB_NAME, result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logCronError(JOB_NAME, error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
