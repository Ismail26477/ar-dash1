# Database setup script for PowerShell (Windows)
# This script sets the required environment variable and runs the database setup

Write-Host "Starting database setup..." -ForegroundColor Cyan

$env:NODE_TLS_REJECT_UNAUTHORIZED = 0
node setup-db-postgres.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "Database setup failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Database setup completed successfully" -ForegroundColor Green
pause
