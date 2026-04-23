$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$backendPath = Join-Path $projectRoot "backend"
$serviceName = "SchulmanagerBackend"
$nodeExe = (Get-Command node).Source
$appScript = Join-Path $backendPath "src\server.js"
$nssmExe = "C:\tools\nssm\nssm.exe"

if (-not (Test-Path $nssmExe)) {
  throw "NSSM wurde nicht unter $nssmExe gefunden."
}

& $nssmExe install $serviceName $nodeExe $appScript
& $nssmExe set $serviceName AppDirectory $backendPath
& $nssmExe set $serviceName AppEnvironmentExtra "NODE_ENV=production"
& $nssmExe set $serviceName Start SERVICE_AUTO_START

Write-Host "Dienst $serviceName wurde angelegt."
