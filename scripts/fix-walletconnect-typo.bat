@echo off
REM Fix WalletConnect heartbeat typo (Windows version)

echo Fixing WalletConnect heartbeat typo...

set FILE=node_modules\@walletconnect\heartbeat\dist\index.es.js

if not exist "%FILE%" (
    echo Error: %FILE% not found. Make sure node_modules is installed.
    exit /b 1
)

REM Fix the typo using PowerShell
powershell -Command "(Get-Content '%FILE%') -replace 'toMiliseconds', 'toMilliseconds' | Set-Content '%FILE%'"

echo Typo fixed in %FILE%

REM Create the patch
echo Creating patch file...
npx patch-package @walletconnect/heartbeat

echo Patch created successfully!
echo.
echo IMPORTANT: Add this to your package.json scripts section:
echo   "postinstall": "patch-package"
echo.
echo This ensures the patch is applied after every npm install.
