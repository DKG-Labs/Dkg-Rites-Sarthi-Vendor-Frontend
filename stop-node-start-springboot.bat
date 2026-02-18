@echo off
REM ============================================================
REM Stop Node.js Server and Start Spring Boot Backend
REM RITES ERC Inspection System
REM ============================================================

echo.
echo ========================================
echo RITES ERC - Backend Migration Script
echo ========================================
echo.

REM Step 1: Stop Node.js server
echo [1/4] Stopping Node.js server...
echo.

REM Find and kill Node.js processes on port 8080
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do (
    echo Found process on port 8080: %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo Node.js server stopped (if it was running)
echo.

REM Step 2: Navigate to Spring Boot project
echo [2/4] Navigating to Spring Boot project...
cd /d "%~dp0..\RITES-SARTHI-BACKEND-main\RITES-SARTHI-BACKEND-main"
echo Current directory: %CD%
echo.

REM Step 3: Check if Maven is available
echo [3/4] Checking Maven installation...
where mvn >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Maven is not installed or not in PATH
    echo Please install Maven from https://maven.apache.org/download.cgi
    echo.
    pause
    exit /b 1
)
echo Maven found!
echo.

REM Step 4: Start Spring Boot
echo [4/4] Starting Spring Boot backend...
echo.
echo ========================================
echo Starting RITES SARTHI Backend
echo ========================================
echo.
echo This will start the Spring Boot server on port 8080
echo Press Ctrl+C to stop the server
echo.

REM Run Spring Boot
mvn spring-boot:run

REM If Maven fails, show error
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo ERROR: Failed to start Spring Boot
    echo ========================================
    echo.
    echo Possible issues:
    echo 1. Maven dependencies not downloaded
    echo 2. Database connection failed
    echo 3. Port 8080 still in use
    echo.
    echo Try running manually:
    echo   cd RITES-SARTHI-BACKEND-main\RITES-SARTHI-BACKEND-main
    echo   mvn clean install
    echo   mvn spring-boot:run
    echo.
    pause
    exit /b 1
)

