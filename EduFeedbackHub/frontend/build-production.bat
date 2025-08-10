@echo off
echo Building frontend for production...
echo.

echo Installing dependencies...
call npm install

echo.
echo Building production version...
call npm run build

echo.
echo Production build completed!
echo Check the 'dist' folder for your built files.
echo.
pause
