param(
    [string]$RepoPath = "C:\apps\gestionaleTorneoLocale",
    [string]$ServiceName = "gestionale_torneo",
    [string]$Branch = "master"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Invoke-External {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $false)][string[]]$ArgumentList = @()
    )

    & $FilePath @ArgumentList
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed: $FilePath $($ArgumentList -join ' ')"
    }
}

if (-not (Test-Path $RepoPath)) {
    throw "Repo path non trovato: $RepoPath"
}

$appPath = Join-Path $RepoPath "torneo_app"
$pythonPath = Join-Path $appPath ".venv\Scripts\python.exe"
$pipPath = Join-Path $appPath ".venv\Scripts\pip.exe"
$requirementsPath = Join-Path $appPath "requirements.txt"

if (-not (Test-Path $pythonPath)) {
    throw "Python venv non trovato: $pythonPath"
}

if (-not (Test-Path $pipPath)) {
    throw "Pip venv non trovato: $pipPath"
}

if (-not (Test-Path $requirementsPath)) {
    throw "requirements.txt non trovato: $requirementsPath"
}

Write-Host "Deploy branch '$Branch' in $RepoPath"
Invoke-External -FilePath "git" -ArgumentList @("-C", $RepoPath, "fetch", "origin", $Branch)
Invoke-External -FilePath "git" -ArgumentList @("-C", $RepoPath, "checkout", $Branch)
Invoke-External -FilePath "git" -ArgumentList @("-C", $RepoPath, "pull", "--ff-only", "origin", $Branch)

Write-Host "Install dependencies"
Invoke-External -FilePath $pipPath -ArgumentList @("install", "-r", $requirementsPath)

Write-Host "Run migrations"
Invoke-External -FilePath $pythonPath -ArgumentList @((Join-Path $appPath "manage.py"), "migrate", "--noinput")

Write-Host "Collect static files"
Invoke-External -FilePath $pythonPath -ArgumentList @((Join-Path $appPath "manage.py"), "collectstatic", "--noinput")

Write-Host "Restart service: $ServiceName"
Restart-Service -Name $ServiceName -Force

Get-Service -Name $ServiceName | Select-Object Name, Status, StartType
