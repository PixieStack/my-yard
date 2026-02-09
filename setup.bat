@echo off
echo ========================================
echo    MYYARD SETUP
echo ========================================
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo Creating .env.local...
    (
        echo NEXT_PUBLIC_SUPABASE_URL=https://pbyhhzygikyucqogitwj.supabase.co
        echo NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBieWhoenlnaWt5dWNxb2dpdHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1ODE4MTcsImV4cCI6MjA4NjE1NzgxN30.0Oyl0Vf09ceMUEcsrzUtJj1mYTQ-J72sAgmo922DtTE
        echo.
        echo NEXT_PUBLIC_APP_URL=http://localhost:3000
    ) > .env.local
    echo .env.local created!
) else (
    echo .env.local already exists
)

echo.
echo Installing dependencies...
call npm install

echo.
echo ========================================
echo   SETUP COMPLETE!
echo ========================================
echo.
echo Database tables should already be created in Supabase.
echo If not, run the SQL files in /scripts folder manually.
echo.
echo To start the app:
echo   npm run dev
echo.
echo Then open in INCOGNITO: http://localhost:3000
echo.
pause
