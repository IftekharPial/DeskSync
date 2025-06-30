const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head><title>DailySync Test</title></head>
      <body>
        <h1>🎉 Node.js is Working!</h1>
        <p>This confirms Node.js v24.2.0 is running correctly.</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p>Next step: Fix DailySync dependencies and restart</p>
      </body>
    </html>
  `);
});

server.listen(3000, () => {
  console.log('✅ Test server running on http://localhost:3000');
  console.log('🔧 Node.js v24.2.0 is working correctly');
  console.log('📋 Next: Fix DailySync project dependencies');
});
