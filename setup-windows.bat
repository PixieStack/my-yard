@echo off
echo ============================================
echo   MYYARD - AUTO DATABASE SETUP
echo ============================================
echo.
echo Installing PostgreSQL client tools...
npm install -g node-pg-migrate
echo.
echo Pushing database to Supabase...
node push-to-supabase.js
echo.
echo Done! Press any key to continue...
pause > nul
