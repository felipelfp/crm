@echo off
color 0A
echo ===================================================
echo        ATUALIZANDO O LUVI CRM - AGUARDE...
echo ===================================================
echo.
echo [1/3] Fechando o servidor antigo...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
echo.
echo [2/3] Compilando a nova correcao visual (Isso pode levar alguns segundos)...
call npm run build --prefix React
echo.
echo [3/3] Iniciando o servidor novo!
echo ===================================================
echo TUDO PRONTO! PODE ATUALIZAR A PAGINA DO NAVEGADOR!
echo ===================================================
node server/index.js
