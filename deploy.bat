@echo off
REM 🚀 CodeXplain Quick Deployment Script for Windows
REM This script automates the deployment process for CodeXplain

echo 🚀 Starting CodeXplain Deployment...
echo ======================================

REM Check prerequisites
echo [INFO] Checking prerequisites...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed. Please install Git first.
    pause
    exit /b 1
)

echo [SUCCESS] All prerequisites met!

REM Setup environment
echo [INFO] Setting up environment...

if not exist .env (
    if exist env.template (
        copy env.template .env
        echo [WARNING] Created .env from template. Please edit it with your configuration.
    ) else (
        echo [ERROR] env.template not found. Please create .env file manually.
        pause
        exit /b 1
    )
)

echo [SUCCESS] Environment setup complete!

REM Start database services
echo [INFO] Starting database services...
docker-compose up -d

echo [INFO] Waiting for database services to be ready...
timeout /t 10 /nobreak >nul

REM Check if services are running
docker-compose ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Database services started successfully!
) else (
    echo [ERROR] Failed to start database services. Check docker-compose logs.
    pause
    exit /b 1
)

REM Deploy backend
echo [INFO] Deploying backend...
cd backend

REM Create virtual environment if it doesn't exist
if not exist venv (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo [INFO] Installing Python dependencies...
pip install -r requirements.txt

REM Run database migrations
echo [INFO] Running database migrations...
alembic upgrade head

REM Test database connection
echo [INFO] Testing database connection...
python -c "from app.core.database import engine; from sqlalchemy import text; conn = engine.connect(); result = conn.execute(text('SELECT 1')); print('✅ Database connection successful!'); conn.close()"

if %errorlevel% neq 0 (
    echo [ERROR] Database connection failed!
    pause
    exit /b 1
)

echo [SUCCESS] Backend deployment complete!
cd ..

REM Deploy frontend
echo [INFO] Deploying frontend...
cd frontend

REM Install dependencies
echo [INFO] Installing Node.js dependencies...
npm install

echo [SUCCESS] Frontend deployment complete!
cd ..

REM Deploy documentation
echo [INFO] Deploying documentation...
cd docs

REM Install dependencies
echo [INFO] Installing documentation dependencies...
npm install

echo [SUCCESS] Documentation deployment complete!
cd ..

REM Final instructions
echo.
echo [SUCCESS] Deployment complete! 🎉
echo.
echo 📋 Next steps:
echo 1. Edit .env file with your OpenAI API key
echo 2. Start backend: cd backend ^&^& venv\Scripts\activate ^&^& uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
echo 3. Start frontend: cd frontend ^&^& npm run dev
echo 4. Start docs: cd docs ^&^& npm start
echo.
echo 🌐 Access points:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo    Documentation: http://localhost:3001
echo.
echo 📚 For detailed instructions, see: docs\docs\development\deployment.md
echo.
pause
