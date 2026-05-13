$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $root

$defaultCertPath = Join-Path $env:USERPROFILE 'certs\glitch-music-codesign.pfx'
$defaultPasswordPath = Join-Path $env:USERPROFILE 'certs\glitch-music-codesign-password.txt'

if (-not $env:CSC_LINK -and (Test-Path $defaultCertPath)) {
  $env:CSC_LINK = $defaultCertPath
}

if (-not $env:CSC_KEY_PASSWORD -and (Test-Path $defaultPasswordPath)) {
  $env:CSC_KEY_PASSWORD = (Get-Content $defaultPasswordPath -Raw).Trim()
}

if (-not $env:CSC_LINK -or -not $env:CSC_KEY_PASSWORD) {
  throw 'Code signing certificate is missing. Set CSC_LINK and CSC_KEY_PASSWORD, or keep the certificate in %USERPROFILE%\certs.'
}

Write-Host 'Building renderer...' -ForegroundColor Cyan
npm run build

Write-Host 'Publishing signed Windows release...' -ForegroundColor Cyan
npx electron-builder --win nsis-web --publish always -c.forceCodeSigning=true

$wslExe = Get-Command wsl.exe -ErrorAction SilentlyContinue
if (-not $wslExe) {
  Write-Warning 'WSL is not installed. Windows release was published, Linux release was skipped.'
  exit 0
}

$wslProjectDir = $env:WSL_PROJECT_DIR
if (-not $wslProjectDir) {
  $wslProjectDir = wsl.exe wslpath -a "$root"
  $wslProjectDir = String($wslProjectDir).Trim()
}

Write-Host "Publishing Linux release from WSL: $wslProjectDir" -ForegroundColor Cyan
$linuxCommand = @"
set -e
cd '$wslProjectDir'
npm run build
npx electron-builder --linux AppImage deb --publish always
"@

wsl.exe bash -lc $linuxCommand

Write-Host 'Signed Windows + Linux release flow finished.' -ForegroundColor Green
