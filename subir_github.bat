@echo off
chcp 65001 >nul
echo ===================================================
echo   ENVIANDO PROJETO FESTA FANTASIA PARA O GITHUB
echo ===================================================
echo.

git remote remove origin >nul 2>&1
git remote add origin https://github.com/yuri71717/festa-fantasia.git
git branch -M main

echo Adicionando e commitando alteracoes...
git add .
git commit -m "update: festa fantasia etec" >nul 2>&1

echo.
echo Enviando para: https://github.com/yuri71717/festa-fantasia.git
git push -u origin main

echo.
echo ===================================================
echo   CONCLUIDO COM SUCESSO!
echo ===================================================
pause
