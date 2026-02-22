@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Easy Step ERP - GitHub Push
echo ========================================
echo.
set /p MSG="Qisa təsvir (commit mesajı): "

if "!MSG!"=="" (
    echo Xəta: Mesaj boş ola bilməz.
    pause
    exit /b 1
)

cd /d "%~dp0"

echo.
echo Git add...
git add -A

echo.
echo Git commit...
git commit -m "!MSG!"

if errorlevel 1 (
    echo.
    echo Xəbərdarlıq: Commit uğursuz - bəlkə dəyişiklik yoxdur.
    pause
    exit /b 1
)

echo.
echo Git push...
git push

echo.
echo ========================================
echo   Tamamlandı
echo ========================================
pause
