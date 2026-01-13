/**
 * Test script for all cron job endpoints
 * 
 * Usage:
 *   npx tsx scripts/test-cron-jobs.ts
 * 
 * Make sure the dev server is running on localhost:3000
 * and CRON_SECRET is set in .env.local
 */

import 'dotenv/config';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;

interface CronJobResult {
  name: string;
  endpoint: string;
  success: boolean;
  status: number;
  response?: unknown;
  error?: string;
  duration: number;
}

const CRON_JOBS = [
  { name: 'Daily Summary', endpoint: '/api/cron/daily-summary' },
  { name: 'Send Review Requests', endpoint: '/api/cron/send-review-requests' },
  { name: 'Check Low Stock', endpoint: '/api/cron/check-low-stock' },
  { name: 'Cleanup Sessions', endpoint: '/api/cron/cleanup-sessions' },
  { name: 'Process Subscriptions', endpoint: '/api/cron/process-subscriptions' },
  { name: 'Subscription Reminders', endpoint: '/api/cron/subscription-reminders' },
];

async function testCronJob(job: { name: string; endpoint: string }): Promise<CronJobResult> {
  const start = Date.now();
  const url = `${BASE_URL}${job.endpoint}?secret=${CRON_SECRET}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const duration = Date.now() - start;
    let data: unknown;
    
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }
    
    return {
      name: job.name,
      endpoint: job.endpoint,
      success: response.ok,
      status: response.status,
      response: data,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - start;
    return {
      name: job.name,
      endpoint: job.endpoint,
      success: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
    };
  }
}

async function main() {
  console.log('🔄 Testing Cron Jobs\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`CRON_SECRET: ${CRON_SECRET ? '✓ Set' : '✗ Not set'}\n`);
  
  if (!CRON_SECRET) {
    console.error('❌ CRON_SECRET is not set in environment variables!');
    console.log('   Add CRON_SECRET to your .env.local file');
    process.exit(1);
  }
  
  console.log('─'.repeat(60));
  
  const results: CronJobResult[] = [];
  
  for (const job of CRON_JOBS) {
    process.stdout.write(`Testing ${job.name}... `);
    const result = await testCronJob(job);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ OK (${result.status}) - ${result.duration}ms`);
    } else {
      console.log(`❌ FAILED (${result.status}) - ${result.duration}ms`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
  }
  
  console.log('─'.repeat(60));
  
  // Summary
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n📊 Summary');
  console.log(`   Passed: ${passed}/${results.length}`);
  console.log(`   Failed: ${failed}/${results.length}`);
  
  // Show detailed results for failed jobs
  if (failed > 0) {
    console.log('\n❌ Failed Jobs:');
    for (const result of results.filter(r => !r.success)) {
      console.log(`\n   ${result.name} (${result.endpoint})`);
      console.log(`   Status: ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.response) {
        console.log(`   Response: ${JSON.stringify(result.response, null, 2)}`);
      }
    }
  }
  
  // Show detailed results for successful jobs
  console.log('\n✅ Successful Jobs Details:');
  for (const result of results.filter(r => r.success)) {
    console.log(`\n   ${result.name}`);
    if (typeof result.response === 'object' && result.response !== null) {
      const resp = result.response as Record<string, unknown>;
      // Show key metrics from each job
      if ('ordersCount' in resp) console.log(`      Orders yesterday: ${resp.ordersCount}`);
      if ('revenue' in resp) console.log(`      Revenue: €${((resp.revenue as number) / 100).toFixed(2)}`);
      if ('emailsSent' in resp) console.log(`      Emails sent: ${resp.emailsSent}`);
      if ('reviewRequestsSent' in resp) console.log(`      Review requests: ${resp.reviewRequestsSent}`);
      if ('lowStockProducts' in resp) console.log(`      Low stock products: ${(resp.lowStockProducts as unknown[]).length}`);
      if ('deletedSessions' in resp) console.log(`      Sessions cleaned: ${resp.deletedSessions}`);
      if ('processedCount' in resp) console.log(`      Subscriptions processed: ${resp.processedCount}`);
      if ('remindersSent' in resp) console.log(`      Reminders sent: ${resp.remindersSent}`);
      if ('message' in resp) console.log(`      Message: ${resp.message}`);
    }
  }
  
  console.log('\n');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
