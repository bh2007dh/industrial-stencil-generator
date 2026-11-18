@echo off
title Push Industrial Stencil Generator to GitHub
cd /d "%~dp0"

echo ==============================================================
echo   STEP 1: Create a New Repository on GitHub
echo   Opening https://github.com/new in your browser...
echo   (Leave "Add a README file" UNCHECKED, then click Create)
echo ==============================================================
start "" "https://github.com/new"
echo.

set /p REPO_URL="STEP 2: Paste your GitHub Repository URL here (e.g. https://github.com/username/repo.git): "

if "%REPO_URL%"=="" (
  echo No URL entered. Exiting.
  pause
  exit /b 1
)

git remote remove origin 2>nul
git remote add origin "%REPO_URL%"
git branch -M main

echo.
echo Pushing code to %REPO_URL% ...
git push -u origin main

echo.
echo ==============================================================
echo   Done! Next: Go to your GitHub repo -> Settings -> Pages
echo   and set Source to "Deploy from a branch" -> "main" -> "/ (root)"
echo ==============================================================
pause
