const fs = require('fs');
const path = require('path');

const SIGNAL_FILE = path.join(__dirname, '../public/__dev-signal');

let clients = [];
let lastSignal = '';

// Watch the signal file written by scripts/watch-app.js after each rebuild.
// When it changes, flush a reload event to all connected SSE clients.
fs.watchFile(SIGNAL_FILE, { interval: 150 }, () => {
  try {
    const signal = fs.readFileSync(SIGNAL_FILE, 'utf8').trim();
    if (signal && signal !== lastSignal) {
      lastSignal = signal;
      const active = clients.splice(0);
      active.forEach((res) => res.write('event: reload\ndata: {}\n\n'));
    }
  } catch (_) {
    // signal file may not exist yet on first start — ignore
  }
});

function devReloadMiddleware(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  res.write(': connected\n\n');
  clients.push(res);
  req.on('close', () => {
    clients = clients.filter((c) => c !== res);
  });
}

module.exports = { devReloadMiddleware };
