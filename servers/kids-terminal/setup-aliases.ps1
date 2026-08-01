# setup-aliases.ps1
# Script to install PowerShell aliases for Agy Kids Terminal in your profile.

# Resolve the repo root from this script's own location (servers/kids-terminal/..\..)
# so this works from any clone path — baked into the profile snippet below,
# with $env:ARH_FAMILY_LAB_ROOT preferred at runtime if it's set (e.g. if the
# repo is later moved).
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

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

$AgyConfigPath = if ($env:ARH_FAMILY_LAB_ROOT) { Join-Path $env:ARH_FAMILY_LAB_ROOT "servers/kids-terminal/config.json" } else { "__REPO_ROOT__\servers\kids-terminal\config.json" }

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
                Start-Process "http://localhost:3000/servers/kids-terminal/?portal=parent&pin=$Pin"
            } else {
                Start-Process "http://localhost:3000/servers/kids-terminal/?portal=parent"
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
            Start-Process "http://localhost:3000/servers/kids-terminal/?autologin=$Username&pin=$Pin"
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

# Bake the resolved repo root into the placeholder (literal replace — the
# path contains backslashes and underscores that -replace would mangle as regex).
$FunctionBlock = $FunctionBlock.Replace("__REPO_ROOT__", $RepoRoot)

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
