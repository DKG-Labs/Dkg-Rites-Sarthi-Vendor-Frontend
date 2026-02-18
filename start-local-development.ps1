# ============================================================
# Start Local Development Environment
# RITES ERC Inspection System with Local MySQL
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RITES ERC - Local Development Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check MySQL Server
Write-Host "[1/5] Checking MySQL Server..." -ForegroundColor Yellow

$mysqlService = Get-Service -Name "MySQL80" -ErrorAction SilentlyContinue

if ($null -eq $mysqlService) {
    Write-Host "ERROR: MySQL Server not found" -ForegroundColor Red
    Write-Host "Please install MySQL Server from: https://dev.mysql.com/downloads/mysql/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

if ($mysqlService.Status -ne "Running") {
    Write-Host "MySQL Server is not running. Starting..." -ForegroundColor Yellow
    try {
        Start-Service -Name "MySQL80"
        Write-Host "MySQL Server started successfully" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Failed to start MySQL Server" -ForegroundColor Red
        Write-Host "Please start it manually from Services" -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "MySQL Server is running" -ForegroundColor Green
}

Write-Host ""

# Step 2: Check if database is initialized
Write-Host "[2/5] Checking database setup..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: Make sure you have run 'local-mysql-setup.sql' in MySQL Workbench!" -ForegroundColor Yellow
Write-Host ""
Write-Host "To setup database:" -ForegroundColor Cyan
Write-Host "  1. Open MySQL Workbench" -ForegroundColor Gray
Write-Host "  2. Connect to localhost:3306 (user: root)" -ForegroundColor Gray
Write-Host "  3. Open file: local-mysql-setup.sql" -ForegroundColor Gray
Write-Host "  4. Click Execute (lightning icon)" -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Have you run local-mysql-setup.sql? (y/n)"
if ($response -ne "y" -and $response -ne "Y") {
    Write-Host ""
    Write-Host "Please run local-mysql-setup.sql first, then run this script again" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 0
}

Write-Host "Database setup confirmed" -ForegroundColor Green
Write-Host ""

# Step 3: Stop Node.js server
Write-Host "[3/5] Stopping Node.js server..." -ForegroundColor Yellow

$processes = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($pid in $processes) {
        Write-Host "Stopping process on port 8080: PID $pid" -ForegroundColor Gray
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Node.js server stopped" -ForegroundColor Green
} else {
    Write-Host "No process found on port 8080" -ForegroundColor Gray
}

Write-Host ""

# Step 4: Navigate to Spring Boot project
Write-Host "[4/5] Navigating to Spring Boot project..." -ForegroundColor Yellow

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

# Step 5: Check Maven
Write-Host "[5/5] Checking Maven installation..." -ForegroundColor Yellow

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

# Start Spring Boot
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Spring Boot Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Database: Local MySQL (localhost:3306)" -ForegroundColor Gray
Write-Host "  Database Name: sarthidb" -ForegroundColor Gray
Write-Host "  Server Port: 8080" -ForegroundColor Gray
Write-Host "  Health Check: http://localhost:8080/actuator/health" -ForegroundColor Gray
Write-Host ""
Write-Host "After Spring Boot starts:" -ForegroundColor Yellow
Write-Host "  1. Open a NEW terminal" -ForegroundColor Gray
Write-Host "  2. cd RITES-ERC-main" -ForegroundColor Gray
Write-Host "  3. npm start" -ForegroundColor Gray
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
    Write-Host "1. MySQL is not running" -ForegroundColor Gray
    Write-Host "2. Database 'sarthidb' not created" -ForegroundColor Gray
    Write-Host "3. Wrong MySQL password in application.properties" -ForegroundColor Gray
    Write-Host "4. Maven dependencies not downloaded" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Try:" -ForegroundColor Yellow
    Write-Host "  1. Run check-mysql-status.bat" -ForegroundColor Gray
    Write-Host "  2. Run local-mysql-setup.sql in MySQL Workbench" -ForegroundColor Gray
    Write-Host "  3. Check MySQL password in application.properties" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

