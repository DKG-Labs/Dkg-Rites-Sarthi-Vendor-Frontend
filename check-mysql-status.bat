@echo off
REM ============================================================
REM Check MySQL Server Status
REM RITES ERC Inspection System
REM ============================================================

echo.
echo ========================================
echo MySQL Server Status Check
echo ========================================
echo.

REM Check if MySQL service is running
sc query MySQL80 | find "RUNNING" >nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] MySQL Server is RUNNING
    echo.
    
    REM Try to connect to MySQL
    echo Checking MySQL connection on localhost:3306...
    netstat -an | find "3306" | find "LISTENING" >nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] MySQL is listening on port 3306
        echo.
        echo ========================================
        echo MySQL Server Status: READY
        echo ========================================
        echo.
        echo You can now:
        echo 1. Open MySQL Workbench
        echo 2. Connect to localhost:3306
        echo 3. Run local-mysql-setup.sql
        echo 4. Start Spring Boot backend
        echo.
    ) else (
        echo [WARNING] MySQL service is running but not listening on port 3306
        echo.
        echo Try restarting MySQL service:
        echo   net stop MySQL80
        echo   net start MySQL80
        echo.
    )
) else (
    echo [ERROR] MySQL Server is NOT RUNNING
    echo.
    echo To start MySQL Server, run:
    echo   net start MySQL80
    echo.
    echo Or start it from Services:
    echo   1. Press Win + R
    echo   2. Type: services.msc
    echo   3. Find MySQL80
    echo   4. Right-click and select Start
    echo.
)

pause

