@echo off
echo ========================================
echo MYYARD - COMPLETE FIX
echo ========================================
echo.

echo Step 1: Checking .env.local...
if not exist .env.local (
    echo Creating .env.local...
    (
        echo # REMOTE Supabase Configuration
        echo NEXT_PUBLIC_SUPABASE_URL=https://pbyhhzygikyucqogitwj.supabase.co
        echo NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBieWhoenlnaWt5dWNxb2dpdHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1ODE4MTcsImV4cCI6MjA4NjE1NzgxN30.0Oyl0Vf09ceMUEcsrzUtJj1mYTQ-J72sAgmo922DtTE
        echo.
        echo # App Configuration
        echo NEXT_PUBLIC_APP_URL=http://localhost:3000
    ) > .env.local
    echo .env.local created!
) else (
    echo .env.local exists - checking content...
    findstr "pbyhhzygikyucqogitwj" .env.local >nul
    if errorlevel 1 (
        echo WRONG Supabase URL detected! Fixing...
        (
            echo # REMOTE Supabase Configuration
            echo NEXT_PUBLIC_SUPABASE_URL=https://pbyhhzygikyucqogitwj.supabase.co
            echo NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBieWhoenlnaWt5dWNxb2dpdHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1ODE4MTcsImV4cCI6MjA4NjE1NzgxN30.0Oyl0Vf09ceMUEcsrzUtJj1mYTQ-J72sAgmo922DtTE
            echo.
            echo # App Configuration
            echo NEXT_PUBLIC_APP_URL=http://localhost:3000
        ) > .env.local
        echo .env.local fixed!
    ) else (
        echo .env.local is correct!
    )
)

echo.
echo Step 2: Clearing cache...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo Cache cleared!

echo.
echo Step 3: Installing dependencies...
call npm install
echo.

echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Close ALL browser windows
echo 2. Run: npm run dev
echo 3. Open INCOGNITO window
echo 4. Go to: http://localhost:3000
echo.
pause
