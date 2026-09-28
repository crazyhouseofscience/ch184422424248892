export const BAT_FILE_CONTENT = `@echo off
setlocal
title Greenhouse Effect & Climate Change Lab Launcher
cd /d "%~dp0"

echo ========================================================
echo   Greenhouse Effect & Climate Change Lab - Launcher
echo ========================================================
echo.

:: 1. Launch via Windows PowerShell built-in HTTP server
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
`;

export const PS1_FILE_CONTENT = `# Windows PowerShell 1-Click Server & Launcher
Set-Location -Path $PSScriptRoot

$port = 8089
$htmlFile = "Greenhouse_Effect_Lab_App.html"

# Launch a lightweight .NET HttpListener built into Windows
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Start-Process "http://localhost:$port/$htmlFile"
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $reqPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($reqPath)) {
            $reqPath = $htmlFile
        }
        
        $localFilePath = Join-Path $PSScriptRoot $reqPath
        
        if (Test-Path $localFilePath) {
            $bytes = [System.IO.File]::ReadAllBytes($localFilePath)
            if ($reqPath.EndsWith(".html")) {
                $response.ContentType = "text/html; charset=utf-8"
            } elseif ($reqPath.EndsWith(".js")) {
                $response.ContentType = "application/javascript"
            } elseif ($reqPath.EndsWith(".css")) {
                $response.ContentType = "text/css"
            }
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
} catch {
    # If port or permissions denied, launch directly with local file access
    Start-Process "msedge.exe" -ArgumentList "--allow-file-access-from-files \`"$PSScriptRoot\\$htmlFile\`""
} finally {
    $listener.Stop()
}
`;
