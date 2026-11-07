@echo off
chcp 65001 > nul
echo ========================================================
echo   Sincronizando Synapse Studio Pro con GitHub y Vercel
echo ========================================================
echo.
cd /d "%~dp0"
echo Compilando para produccion...
call npm run build
if %errorlevel% neq 0 (
    echo Error durante la compilacion. Revisa los mensajes anteriores.
    pause
    exit /b %errorlevel%
)
echo.
echo Subiendo cambios a GitHub (rama main)...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo Ocurrio un error al hacer git push. Verifica tu conexion o credenciales.
    pause
    exit /b %errorlevel%
)
echo.
echo ========================================================
echo   EXITO: Cambios subidos a GitHub.
echo   Vercel detectara el cambio y actualizara tu web en:
echo   https://mindmap-chi-nine.vercel.app
echo ========================================================
echo.
pause
