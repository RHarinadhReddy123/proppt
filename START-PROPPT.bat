@echo off
title ProPPT Server
color 0A
echo.
echo  ========================================
echo    ProPPT - AI Presentation Platform
echo  ========================================
echo.
echo  Starting server... Please wait...
echo.

cd /d "%~dp0server"
node index.js

echo.
echo  Server stopped. Press any key to restart...
pause >nul
goto :restart

:restart
node index.js
