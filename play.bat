@echo off
rem Watt Watchers launcher — starts a tiny local server and opens the game.
setlocal
cd /d "%~dp0"
set PORT=8080

where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:%PORT%"
  python -m http.server %PORT%
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:%PORT%"
  py -m http.server %PORT%
  goto :eof
)

where node >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:%PORT%"
  node -e "const h=require('http'),f=require('fs'),p=require('path');const m={'.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.css':'text/css'};h.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/')u='/index.html';const fp=p.join(process.cwd(),u);f.readFile(fp,(e,d)=>{if(e){r.writeHead(404);r.end('Not found');}else{r.writeHead(200,{'Content-Type':m[p.extname(fp)]||'application/octet-stream'});r.end(d);}});}).listen(%PORT%,()=>console.log('Watt Watchers on http://localhost:%PORT%'));"
  goto :eof
)

echo Could not find Python or Node. Install one of them, or open this folder
echo with any static file server and visit http://localhost:8080
pause