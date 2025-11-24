#!/bin/bash
# Test script for transaction email system
# Usage: ./scripts/test-transaction-email.sh

set -e

echo "🧪 Transaction Email System Test"
echo "================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please copy .env.local.example to .env.local and configure it"
    exit 1
fi

# Source environment variables
source .env.local

# Check required variables
echo "📋 Checking environment variables..."
MISSING_VARS=()

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then MISSING_VARS+=("NEXT_PUBLIC_SUPABASE_URL"); fi
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then MISSING_VARS+=("SUPABASE_SERVICE_ROLE_KEY"); fi
if [ -z "$RESEND_API_KEY" ]; then MISSING_VARS+=("RESEND_API_KEY"); fi
if [ -z "$EMAIL_FROM_ADDRESS" ]; then MISSING_VARS+=("EMAIL_FROM_ADDRESS"); fi
if [ -z "$CRON_SECRET" ]; then MISSING_VARS+=("CRON_SECRET"); fi

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '   - %s\n' "${MISSING_VARS[@]}"
    exit 1
fi

echo "✅ All required variables set"
echo ""

# Check if server is running
echo "🔍 Checking if dev server is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Server is running on http://localhost:3000"
else
    echo "❌ Server is not running"
    echo "Please start the dev server with: npm run dev"
    exit 1
fi
echo ""

# Check dry-run mode
if [ "$EMAIL_DRY_RUN" = "true" ]; then
    echo "ℹ️  EMAIL_DRY_RUN is enabled - emails will be logged but not sent"
    echo ""
fi

# Test cron endpoint
echo "🔄 Testing cron endpoint..."
RESPONSE=$(curl -s -X POST "http://localhost:3000/api/cron/transaction-emails?secret=$CRON_SECRET")

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Cron endpoint working"
    echo "Response: $RESPONSE"
else
    echo "❌ Cron endpoint failed"
    echo "Response: $RESPONSE"
    exit 1
fi
echo ""

# Check for recent email logs
echo "📧 Checking recent email activity..."
echo "Check your terminal/console for [Transaction Email] and [EMAIL] logs"
echo ""

echo "✨ Test complete!"
echo ""
echo "Next steps:"
echo "1. Check console logs for email activity"
echo "2. If EMAIL_DRY_RUN=true, check for [EMAIL DRY-RUN] logs"
echo "3. If EMAIL_DRY_RUN=false, check your email inbox"
echo "4. Query transaction_email_log table to see sent emails"
echo ""
echo "To query logs:"
echo "  psql \$DATABASE_URL -c 'SELECT * FROM transaction_email_log ORDER BY sent_at DESC LIMIT 10;'"

