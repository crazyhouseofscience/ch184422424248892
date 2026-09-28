@echo off
title Greenhouse Effect & Climate Change Lab
echo ===================================================
echo Launching Greenhouse Effect & Climate Change Lab...
echo ===================================================

:: Try launching in Edge App Mode (dedicated desktop window)
start "" msedge.exe --app="https://ais-pre-6ic3kypyuhb3jcgcbcab25-95964816912.us-east5.run.app" 2>nul
if %errorlevel% equ 0 exit

:: Try launching in Chrome App Mode
start "" chrome.exe --app="https://ais-pre-6ic3kypyuhb3jcgcbcab25-95964816912.us-east5.run.app" 2>nul
if %errorlevel% equ 0 exit

:: Fallback to default browser
start "" "https://ais-pre-6ic3kypyuhb3jcgcbcab25-95964816912.us-east5.run.app"
exit
