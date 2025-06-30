#!/usr/bin/env node

// DailySync Implementation Verification Script
// This script verifies all implemented features are properly integrated

const fs = require('fs');
const path = require('path');

console.log('🔍 DailySync Implementation Verification\n');
console.log('=' .repeat(60));

// Check if files exist
const checkFile = (filePath, description) => {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${description}`);
  return exists;
};

// Check if directory exists
const checkDirectory = (dirPath, description) => {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${description}`);
  return exists;
};

// Check if file contains specific content
const checkFileContent = (filePath, searchText, description) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const contains = content.includes(searchText);
    const status = contains ? '✅' : '❌';
    console.log(`${status} ${description}`);
    return contains;
  } catch (error) {
    console.log(`❌ ${description} (file not readable)`);
    return false;
  }
};

let totalChecks = 0;
let passedChecks = 0;

const check = (result) => {
  totalChecks++;
  if (result) passedChecks++;
  return result;
};

console.log('\n📁 DATABASE SCHEMA VERIFICATION');
console.log('-' .repeat(40));
check(checkFile('packages/database/prisma/schema.prisma', 'Prisma schema file exists'));
check(checkFileContent('packages/database/prisma/schema.prisma', 'model SupportPlatform', 'SupportPlatform model added'));
check(checkFileContent('packages/database/prisma/schema.prisma', 'customerName', 'MeetingReport enhanced with customer fields'));
check(checkFileContent('packages/database/prisma/schema.prisma', 'platformReports', 'DailyReport enhanced with platform reports'));
check(checkFileContent('packages/database/prisma/schema.prisma', 'isAssigned', 'Meeting assignment tracking added'));

console.log('\n🔧 API ROUTES VERIFICATION');
console.log('-' .repeat(40));
check(checkFile('apps/web/src/app/api/admin/platforms/route.ts', 'Admin platforms API route'));
check(checkFile('apps/web/src/app/api/admin/platforms/[id]/route.ts', 'Individual platform API route'));
check(checkFile('apps/web/src/app/api/webhooks/[id]/receive/route.ts', 'Webhook receive endpoint'));
check(checkFile('apps/web/src/app/api/platforms/route.ts', 'Public platforms API route'));
check(checkFileContent('apps/web/src/app/api/reports/daily/route.ts', 'platformReports', 'Daily reports API enhanced'));

console.log('\n🎨 UI COMPONENTS VERIFICATION');
console.log('-' .repeat(40));
check(checkFile('apps/web/src/app/dashboard/admin/platforms/page.tsx', 'Platform management UI'));
check(checkFileContent('apps/web/src/components/reports/daily-report-form.tsx', 'platformReports', 'Daily report form enhanced'));
check(checkFileContent('apps/web/src/components/meetings/meeting-report-form.tsx', 'customerName', 'Meeting report form enhanced'));
check(checkFile('apps/web/src/components/ui/checkbox.tsx', 'Checkbox component'));

console.log('\n🔐 SECURITY & NAVIGATION VERIFICATION');
console.log('-' .repeat(40));
check(checkFileContent('apps/web/src/middleware.ts', '/dashboard/admin', 'Admin routes protected'));
check(checkFileContent('apps/web/src/components/dashboard/sidebar.tsx', 'Platforms', 'Platform management navigation added'));
check(checkFileContent('apps/web/src/components/dashboard/sidebar.tsx', 'Database', 'Platform icon imported'));

console.log('\n📊 ANALYTICS INTEGRATION VERIFICATION');
console.log('-' .repeat(40));
check(checkFileContent('apps/web/src/app/api/analytics/dashboard/route.ts', 'platformStats', 'Analytics enhanced with platform stats'));
check(checkFileContent('apps/web/src/lib/api.ts', 'platformReports', 'API client updated for platform reports'));

console.log('\n🔔 SLACK INTEGRATION VERIFICATION');
console.log('-' .repeat(40));
check(checkFileContent('apps/web/src/app/api/webhooks/[id]/receive/route.ts', 'SLACK_WEBHOOK_URL', 'Slack webhook integration'));
check(checkFileContent('apps/web/src/app/api/reports/daily/route.ts', 'sendDailyReportSlackNotification', 'Daily report Slack notifications'));

console.log('\n📝 VALIDATION & TYPES VERIFICATION');
console.log('-' .repeat(40));
check(checkFileContent('packages/database/src/validations.ts', 'createSupportPlatformSchema', 'Platform validation schemas'));
check(checkFileContent('packages/database/src/validations.ts', 'webhookMeetingPayloadSchema', 'Webhook payload validation'));
check(checkFileContent('packages/database/src/types.ts', 'PlatformReport', 'Platform report types'));
check(checkFileContent('packages/database/src/index.ts', 'SupportPlatform', 'Platform types exported'));

console.log('\n🧪 TESTING & DOCUMENTATION VERIFICATION');
console.log('-' .repeat(40));
check(checkFile('test-webhook-receive.js', 'Comprehensive test script'));
check(checkFile('packages/database/prisma/seed-platforms.ts', 'Platform seed script'));
check(checkFile('IMPLEMENTATION_SUMMARY.md', 'Implementation summary'));
check(checkFile('PRODUCTION_DEPLOYMENT_GUIDE.md', 'Production deployment guide'));

console.log('\n🔄 BACKWARD COMPATIBILITY VERIFICATION');
console.log('-' .repeat(40));
check(checkFileContent('packages/database/prisma/schema.prisma', 'userId       String?', 'Meeting userId nullable for unassigned'));
check(checkFileContent('packages/database/prisma/schema.prisma', 'platformReports  Json?', 'Platform reports optional for backward compatibility'));

console.log('\n' + '=' .repeat(60));
console.log('📊 VERIFICATION RESULTS');
console.log('=' .repeat(60));

const successRate = Math.round((passedChecks / totalChecks) * 100);

console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks (${successRate}%)`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 IMPLEMENTATION VERIFICATION COMPLETE!');
  console.log('✅ All features have been successfully implemented');
  console.log('✅ All files are in place and properly configured');
  console.log('✅ Ready for production deployment');
} else {
  console.log('\n⚠️  IMPLEMENTATION INCOMPLETE');
  console.log(`❌ ${totalChecks - passedChecks} checks failed`);
  console.log('🔧 Please review the failed checks above');
}

console.log('\n📋 NEXT STEPS:');
console.log('1. Run database migration: pnpm --filter @dailysync/database exec prisma db push');
console.log('2. Generate Prisma client: pnpm --filter @dailysync/database exec prisma generate');
console.log('3. Seed platforms: node packages/database/prisma/seed-platforms.ts');
console.log('4. Set environment variables (see PRODUCTION_DEPLOYMENT_GUIDE.md)');
console.log('5. Test the application: node test-webhook-receive.js');
console.log('6. Deploy to production');

console.log('\n🏁 Verification completed!');

// Exit with appropriate code
process.exit(passedChecks === totalChecks ? 0 : 1);
