#!/bin/bash
# Generate a secure random secret for CRON_SECRET
# Usage: ./scripts/generate-cron-secret.sh

echo "Generating secure CRON_SECRET..."
echo ""

SECRET=$(openssl rand -base64 32)

echo "CRON_SECRET=$SECRET"
echo ""
echo "Add this to your .env.local file:"
echo "  CRON_SECRET=$SECRET"
echo ""
echo "Also add it to your Vercel environment variables:"
echo "  1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables"
echo "  2. Add: CRON_SECRET = $SECRET"
echo "  3. Apply to: Production, Preview, and Development"

