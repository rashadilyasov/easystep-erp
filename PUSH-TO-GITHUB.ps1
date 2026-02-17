# Easy Step ERP - GitHub-a push et
# Istifade: .\PUSH-TO-GITHUB.ps1 -RepoUrl "https://github.com/SIZIN_USERNAME/easystep-erp.git"

param(
    [Parameter(Mandatory=$true)]
    [string]$RepoUrl
)

$gitPath = "C:\Program Files\Git\bin\git.exe"
$projectPath = $PSScriptRoot

Set-Location $projectPath

& $gitPath remote remove origin 2>$null
& $gitPath remote add origin $RepoUrl
& $gitPath push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nUgurla yuklendi! Indi:" -ForegroundColor Green
    Write-Host "1. Vercel.com - Add New Project - Import bu repo"
    Write-Host "2. Railway.app - New Project - Add PostgreSQL, sonra GitHub Repo - api"
    Write-Host "`nRepo URL: $RepoUrl" -ForegroundColor Cyan
} else {
    Write-Host "Push xeta - GitHub token/credentials yoxlanin" -ForegroundColor Red
}
