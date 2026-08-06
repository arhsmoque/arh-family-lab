param(
  [Parameter(Mandatory=$true)][string]$AppId,
  [switch]$Android,
  [switch]$Ios
)
$ErrorActionPreference = 'Stop'
$repo = Resolve-Path (Join-Path $PSScriptRoot '..')
$mobile = Join-Path $repo 'apps/family-hub/mobile'
if (-not (Test-Path $mobile)) { throw "Mobile scaffold not found: $mobile" }
if ($AppId -match 'placeholder|example') { throw 'Provide a final reverse-domain application ID.' }
$configPath = Join-Path $mobile 'capacitor.config.json'
$config = Get-Content $configPath -Raw | ConvertFrom-Json
$config.appId = $AppId
$config | ConvertTo-Json -Depth 10 | Set-Content $configPath -Encoding UTF8
Push-Location $mobile
try {
  npm install
  npm run build:web
  npm run validate
  if ($Android) { npm run native:add:android }
  if ($Ios) { npm run native:add:ios }
  if ($Android -or $Ios) { npm run native:sync }
} finally { Pop-Location }
