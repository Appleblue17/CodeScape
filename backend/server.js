// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const blessed = require('blessed');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let displayContent = '';

// Create a blessed screen
const screen = blessed.screen({
  smartCSR: true,
  title: 'CodeScape'
});

// Create a box for the ASCII art with a border
const box = blessed.box({
  top: 'center',
  left: 'center',
  width: 642, // 640 + 2 for borders
  height: 146, // 144 + 2 for borders
  content: '',
  tags: true,
  padding: 0,
  // Add these properties to ensure no gaps between characters
  spacing: 0,
  shrink: true,
  border: {
    type: 'blue'
  },
  style: {
    fg: 'white',
    border: {
      fg: 'blue'
    },
    // Add these properties to ensure no gaps between characters
    spacing: 0,
    shrink: true
  }
});

// Add the box to the screen
screen.append(box);

// Handle screen exit
screen.key(['escape', 'q', 'C-c'], function() {
  return process.exit(0);
});

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    displayContent = message.toString('utf-8');
    // Display ASCII art immediately when a message is received
    displayAsciiArt();
  });
});

server.listen(8080, function() {
  console.log('Server is listening on port 8080');
  // Initial display
  displayAsciiArt();
});

// Function to display ASCII art using blessed
function displayAsciiArt() {
  // Ensure no whitespace in the content
  const trimmedContent = displayContent.replace(/\s+$/, '');
  
  // Update box content
  box.setContent(trimmedContent);
  
  // Set the cursor position to avoid any auto-spacing
  box.position.autoPadding = false;
  
  // Render the screen
  screen.render();
}
