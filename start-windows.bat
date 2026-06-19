@echo off
title LANTERN
color 0A
if exist .env (for /f "tokens=1,2 delims==" %%a in (.env) do (if "%%a"=="TMDB_API_KEY" set TMDB_API_KEY=%%b))
if not exist node_modules (call npm install)
if not exist client\node_modules (cd client && call npm install && cd ..)
if not exist client\build (cd client && call npm run build && cd ..)
npm start
pause
