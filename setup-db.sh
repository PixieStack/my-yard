#!/bin/bash

echo "🚀 Setting up MyYard Database..."
echo ""

DB_URL="postgresql://postgres:Tt@{199&0423%}(#eden!)@db.pbyhhzygikyucqogitwj.supabase.co:5432/postgres"

echo "📊 Step 1: Creating database schema..."
psql "$DB_URL" -f /app/scripts/complete-setup.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully!"
else
    echo "❌ Error creating schema. Check the error above."
    exit 1
fi

echo ""
echo "🗺️ Step 2: Inserting South African locations..."
psql "$DB_URL" -f /app/scripts/insert-locations.sql

if [ $? -eq 0 ]; then
    echo "✅ Locations inserted successfully!"
else
    echo "❌ Error inserting locations. Check the error above."
    exit 1
fi

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "Run: yarn dev"
echo "Then open: http://localhost:3000"
