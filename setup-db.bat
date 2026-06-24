@echo off
REM Database setup script for Windows
REM This script sets the required environment variable and runs the database setup

setlocal enabledelayedexpansion
set NODE_TLS_REJECT_UNAUTHORIZED=0

echo Starting database setup...
node setup-db-postgres.js

if errorlevel 1 (
    echo Database setup failed
    exit /b 1
)

echo Database setup completed successfully
pause
