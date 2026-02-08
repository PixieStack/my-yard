#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           🏘️  MyYard - Quick Start Guide                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 STEP 1: Setup Database (ONE TIME ONLY)"
echo "   Go to: https://supabase.com/dashboard/project/pbyhhzygikyucqogitwj/sql/new"
echo ""
echo "   Copy and paste these files, then click RUN:"
echo "   1️⃣  /app/scripts/complete-setup.sql"
echo "   2️⃣  /app/scripts/insert-locations.sql"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 STEP 2: Run the App"
echo ""
read -p "   Press ENTER when database is ready..."
echo ""
echo "🚀 Starting MyYard..."
echo ""

cd /app
yarn dev
