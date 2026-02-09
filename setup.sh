#!/bin/bash

echo "🏘️  MyYard Setup Script"
echo "======================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local..."
    cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://pbyhhzygikyucqogitwj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBieWhoenlnaWt5dWNxb2dpdHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1ODE4MTcsImV4cCI6MjA4NjE1NzgxN30.0Oyl0Vf09ceMUEcsrzUtJj1mYTQ-J72sAgmo922DtTE

NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
    echo "✅ .env.local created!"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Pushing database schema..."
node push-to-remote-supabase.js

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the app:"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000"
