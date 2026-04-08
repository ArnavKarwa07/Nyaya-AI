@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

if exist "%ROOT%venv\Scripts\python.exe" (
    set "PYTHON_EXE=%ROOT%venv\Scripts\python.exe"
) else if exist "%ROOT%.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%ROOT%.venv\Scripts\python.exe"
) else (
    echo [ERROR] No Python virtual environment found.
    echo Create one at venv or .venv and install backend requirements.
    pause
    exit /b 1
)

start "Nyaya Backend" /d "%ROOT%" cmd /k ""%PYTHON_EXE%" -m uvicorn backend.main:app --reload"
start "Nyaya Frontend" /d "%FRONTEND%" cmd /k "npm run dev"

echo Started backend and frontend in separate windows.
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:3000

endlocal
