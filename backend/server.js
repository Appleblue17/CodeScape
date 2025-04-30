// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let displayContent = '';

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.clear();
    displayContent = message.toString('utf-8');
  });
});

server.listen(8080, function() {
  console.log('Server is listening on port 8080');
});


// Example ASCII art

// Function to display ASCII art
function displayAsciiArt() {
  // Clear the terminal
  process.stdout.write('\x1Bc');
  // Output the ASCII art
  process.stdout.write(displayContent);
}

// Refresh rate in milliseconds (e.g., 500ms for half a second)
const refreshRate = 2000;

// Set interval to refresh ASCII art
setInterval(displayAsciiArt, refreshRate);
