# ============================================================
# Stop Node.js Server and Start Spring Boot Backend
# RITES ERC Inspection System
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RITES ERC - Backend Migration Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop Node.js server
Write-Host "[1/4] Stopping Node.js server..." -ForegroundColor Yellow
Write-Host ""

# Find and kill processes on port 8080
$processes = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($pid in $processes) {
        Write-Host "Found process on port 8080: PID $pid" -ForegroundColor Gray
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Node.js server stopped successfully" -ForegroundColor Green
} else {
    Write-Host "No process found on port 8080" -ForegroundColor Gray
}

Write-Host ""

# Step 2: Navigate to Spring Boot project
Write-Host "[2/4] Navigating to Spring Boot project..." -ForegroundColor Yellow

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$springBootPath = Join-Path (Split-Path -Parent $scriptPath) "RITES-SARTHI-BACKEND-main\RITES-SARTHI-BACKEND-main"

if (Test-Path $springBootPath) {
    Set-Location $springBootPath
    Write-Host "Current directory: $springBootPath" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "ERROR: Spring Boot project not found at: $springBootPath" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 3: Check if Maven is available
Write-Host "[3/4] Checking Maven installation..." -ForegroundColor Yellow

$mavenCheck = Get-Command mvn -ErrorAction SilentlyContinue

if (-not $mavenCheck) {
    Write-Host "ERROR: Maven is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Maven from https://maven.apache.org/download.cgi" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Maven found: $($mavenCheck.Source)" -ForegroundColor Green
Write-Host ""

# Step 4: Start Spring Boot
Write-Host "[4/4] Starting Spring Boot backend..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting RITES SARTHI Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server will start on: http://localhost:8080" -ForegroundColor Green
Write-Host "Health Check: http://localhost:8080/actuator/health" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Run Spring Boot
try {
    & mvn spring-boot:run
    
    if ($LASTEXITCODE -ne 0) {
        throw "Maven command failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "ERROR: Failed to start Spring Boot" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "1. Maven dependencies not downloaded" -ForegroundColor Gray
    Write-Host "2. Database connection failed" -ForegroundColor Gray
    Write-Host "3. Port 8080 still in use" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Try running manually:" -ForegroundColor Yellow
    Write-Host "  cd RITES-SARTHI-BACKEND-main\RITES-SARTHI-BACKEND-main" -ForegroundColor Gray
    Write-Host "  mvn clean install" -ForegroundColor Gray
    Write-Host "  mvn spring-boot:run" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

