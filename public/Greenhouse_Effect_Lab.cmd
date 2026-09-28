@echo off
setlocal EnableDelayedExpansion
title Greenhouse Effect & Climate Change Lab

:: Target URL
set "APP_URL=https://ais-pre-6ic3kypyuhb3jcgcbcab25-95964816912.us-east5.run.app"

:: 1. Launch via Edge in Dedicated App Mode (no address bar, looks like native software)
start "" msedge.exe --app="%APP_URL%" 2>nul
if !errorlevel! equ 0 exit

:: 2. Launch via Chrome in Dedicated App Mode
start "" chrome.exe --app="%APP_URL%" 2>nul
if !errorlevel! equ 0 exit

:: 3. Launch via default browser
start "" "%APP_URL%"
exit
