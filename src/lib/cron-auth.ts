import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify that a cron job request is legitimate.
 * 
 * In production on Vercel, cron jobs include an Authorization header with the CRON_SECRET.
 * For local testing, you can pass the secret as a query parameter.
 */
export function verifyCronRequest(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  
  // If no secret is configured, allow in development only
  if (!cronSecret) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('CRON_SECRET not configured - allowing request in development mode');
      return true;
    }
    console.error('CRON_SECRET not configured in production');
    return false;
  }
  
  // Check Authorization header (Vercel cron jobs)
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  
  // Check query parameter (for manual/local testing)
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get('secret');
  if (querySecret === cronSecret) {
    return true;
  }
  
  console.error('Invalid or missing cron authentication');
  return false;
}

/**
 * Standard unauthorized response for cron endpoints
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
}

/**
 * Format a date for logging
 */
export function formatCronLogDate(date: Date = new Date()): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Log cron job start
 */
export function logCronStart(jobName: string): void {
  console.log(`[${formatCronLogDate()}] Cron job started: ${jobName}`);
}

/**
 * Log cron job completion
 */
export function logCronComplete(jobName: string, result?: Record<string, unknown>): void {
  const resultStr = result ? ` - Result: ${JSON.stringify(result)}` : '';
  console.log(`[${formatCronLogDate()}] Cron job completed: ${jobName}${resultStr}`);
}

/**
 * Log cron job error
 */
export function logCronError(jobName: string, error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[${formatCronLogDate()}] Cron job failed: ${jobName} - Error: ${errorMessage}`);
}
