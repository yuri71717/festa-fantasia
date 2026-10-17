@echo off
chcp 65001 >nul
echo ===================================================
echo   ENVIANDO PROJETO FESTA FANTASIA PARA O GITHUB
echo ===================================================
echo.
set /p reponame="Digite o nome do repositorio no seu GitHub (ex: festa-fantasia): "
if "%reponame%"=="" set reponame=festa-fantasia

git remote remove origin >nul 2>&1
git remote add origin https://github.com/yuri71717/%reponame%.git
echo.
echo Adicionando e commitando alteracoes...
git add .
git commit -m "update: site festa fantasia etec" >nul 2>&1
echo.
echo Enviando para: https://github.com/yuri71717/%reponame%.git
echo A janela de login do GitHub pode abrir se for o primeiro envio.
echo.
git push -u origin main
echo.
echo ===================================================
echo   CONCLUIDO!
echo ===================================================
pause
