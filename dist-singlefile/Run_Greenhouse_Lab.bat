@echo off
setlocal
title Greenhouse Effect & Climate Change Lab Launcher
cd /d "%~dp0"

echo ========================================================
echo   Greenhouse Effect & Climate Change Lab - Launcher
echo ========================================================
echo.

:: 1. Launch via Windows PowerShell built-in HTTP server (works on 100% of modern Windows PCs)
powershell -ExecutionPolicy Bypass -File "%~dp0Run_Greenhouse_Lab.ps1" 2>nul
if %errorlevel% equ 0 exit

:: 2. Try Python server
python -m http.server 8089 >nul 2>&1
if %errorlevel% equ 0 (
    timeout /t 1 >nul
    start http://localhost:8089/Greenhouse_Effect_Lab_App.html
    exit
)

:: 3. Launch browser with allowed local origins
start "" msedge.exe --allow-file-access-from-files "%~dp0Greenhouse_Effect_Lab_App.html" 2>nul
if %errorlevel% equ 0 exit

start "" chrome.exe --allow-file-access-from-files "%~dp0Greenhouse_Effect_Lab_App.html" 2>nul
if %errorlevel% equ 0 exit

start "" "%~dp0Greenhouse_Effect_Lab_App.html"
exit
