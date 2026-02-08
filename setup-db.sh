#!/bin/bash

echo "🚀 Setting up MyYard Database..."
echo ""

# Database credentials
export PGHOST="db.pbyhhzygikyucqogitwj.supabase.co"
export PGPORT="5432"
export PGDATABASE="postgres"
export PGUSER="postgres"
export PGPASSWORD='Tt@{199&0423%}(#eden!)'

echo "📊 Step 1: Creating database schema..."
psql -f /app/scripts/complete-setup.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully!"
else
    echo "❌ Error creating schema. Check the error above."
    exit 1
fi

echo ""
echo "🗺️ Step 2: Inserting South African locations..."
psql -f /app/scripts/insert-locations.sql

if [ $? -eq 0 ]; then
    echo "✅ Locations inserted successfully!"
else
    echo "❌ Error inserting locations. Check the error above."
    exit 1
fi

echo ""
echo "🎉 Database setup complete!"
echo "✅ All tables created"
echo "✅ 150+ SA locations added"
echo ""
echo "Now run: yarn dev"
echo "Then open: http://localhost:3000"
