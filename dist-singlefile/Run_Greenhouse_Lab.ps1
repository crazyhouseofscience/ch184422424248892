# Windows PowerShell 1-Click Server & Launcher
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
    Start-Process "msedge.exe" -ArgumentList "--allow-file-access-from-files `"$PSScriptRoot\$htmlFile`""
} finally {
    $listener.Stop()
}
