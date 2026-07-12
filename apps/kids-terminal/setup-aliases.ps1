# setup-aliases.ps1
# Script to install PowerShell aliases for Agy Kids Terminal in your profile.

$ProfilePath = $PROFILE.CurrentUserAllHosts
if (-not $ProfilePath) {
    $ProfilePath = $PROFILE
}

# Create profile directory and file if they do not exist
$ProfileDir = Split-Path $ProfilePath
if (-not (Test-Path $ProfileDir)) {
    New-Item -ItemType Directory -Force -Path $ProfileDir | Out-Null
}
if (-not (Test-Path $ProfilePath)) {
    New-Item -ItemType File -Force -Path $ProfilePath | Out-Null
}

$FunctionBlock = @'

# ============================================================================
# AGY KIDS TERMINAL CUSTOM ALIASES
# ============================================================================

$AgyConfigPath = "C:/Users/Admin7/arh-family-lab/apps/kids-terminal/config.json"

if (Test-Path $AgyConfigPath) {
    $AgyConfig = Get-Content $AgyConfigPath -Raw | ConvertFrom-Json

    function arh {
        param(
            [Parameter(Position=0, Mandatory=$true)]
            [string]$Action,
            [Parameter(Position=1)]
            [string]$Pin
        )
        if ($Action -eq "kids-terminal") {
            Write-Host "[*] Launching Parent Dev Console..." -ForegroundColor Green
            if ($Pin) {
                Start-Process "http://localhost:3000/apps/kids-terminal/?portal=parent&pin=$Pin"
            } else {
                Start-Process "http://localhost:3000/apps/kids-terminal/?portal=parent"
            }
        } else {
            Write-Host "Usage: arh kids-terminal <pin>" -ForegroundColor Yellow
        }
    }

    # Modular helper function for Cadets
    function Start-CadetTerminal {
        param($Username, $Action, $Pin)
        if ($Action -eq "kids-terminal") {
            Write-Host "[*] Launching Agy Cadet Station for $Username..." -ForegroundColor Cyan
            Start-Process "http://localhost:3000/apps/kids-terminal/?autologin=$Username&pin=$Pin"
        } else {
            Write-Host "Usage: $Username kids-terminal <pin>" -ForegroundColor Yellow
        }
    }

    # Dynamically generate command functions for all Cadets listed in config.json
    $Cadets = $AgyConfig.parent.cadets
    foreach ($user in $Cadets) {
        $ScriptBlock = [scriptblock]::Create("param(`$Action, `$Pin); Start-CadetTerminal -Username '$user' -Action `$Action -Pin `$Pin")
        Set-Item -Path "Function:\$user" -Value $ScriptBlock
    }
}
'@

# Read existing profile content
$ProfileContent = Get-Content $ProfilePath -Raw
if ($null -eq $ProfileContent) { $ProfileContent = "" }

# Check if aliases are already present to avoid duplicates
if ($ProfileContent -match "AGY KIDS TERMINAL CUSTOM ALIASES") {
    Write-Host "[*] Agy Kids Terminal aliases are already present in $ProfilePath." -ForegroundColor Yellow
} else {
    Add-Content -Path $ProfilePath -Value $FunctionBlock
    Write-Host "[+] Successfully added Agy Kids Terminal aliases to $ProfilePath!" -ForegroundColor Green
    Write-Host "[i] Run: . `$PROFILE to reload your profile and activate the new commands!" -ForegroundColor Cyan
}
