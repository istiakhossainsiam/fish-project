@echo off
title AquaFarm Cloud - Fish Project Management System
echo ========================================================
echo   AquaFarm Cloud - Fish Farming Management System
echo   4 Ponds (20 Acres) - Mymensingh, Bangladesh
echo ========================================================
echo.
echo Starting FastAPI Backend + React UI on http://localhost:8000 ...
cd backend
..\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
pause
