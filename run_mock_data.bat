@echo off
echo ============================================================
echo Running Mock Data SQL Script
echo ============================================================
echo.
echo Please enter your MySQL root password when prompted
echo.

mysql -u root -p -e "source add_mock_approved_rm_data.sql"

echo.
echo ============================================================
echo Mock data script completed!
echo ============================================================
pause

