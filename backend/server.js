// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const blessed = require('blessed');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let displayContent = '';
let terminalContent = [];
let currentInput = '';
let terminalVisible = true; // Add this variable to track terminal visibility

// Create a blessed screen
const screen = blessed.screen({
  smartCSR: true,
  title: 'CodeScape'
});

// Create a box for the ASCII art with a border
const box = blessed.box({
  top: 'center',
  left: 0,
  width: '100%', // 640 + 2 for borders
  height: '100%', // 144 + 2 for borders
  content: '',
  tags: true,
  padding: 1,
  // Add these properties to ensure no gaps between characters
  spacing: 1,
  shrink: true,
  border: {
    type: 'line',
    fg: 'blue'
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

// Create a simple terminal box for chatbot-style UI that overlays on top of the ASCII art
const terminalBox = blessed.box({
  top: 5,
  right: 5,
  width: '30%',
  height: '60%',
  tags: true,
  scrollable: true,
  alwaysScroll: true,
  mouse: true,
  label: ' CodeScape Terminal ',
  transparent: false, // Use opaque background for better readability
  border: {
    type: 'line',
    fg: 'green'
  },
  style: {
    fg: 'white',
    bg: '#000a', // Semi-transparent background
    border: {
      fg: 'green',
      bg: 'transparent'
    },
    label: {
      fg: 'green',
      bg: 'black'
    },
    scrollbar: {
      bg: 'green'
    }
  },
  scrollbar: {
    ch: '█'
  },
  shadow: true
});

// Add the boxes to the screen
screen.append(box);
screen.append(terminalBox);

// Handle screen exit
screen.key(['escape', 'q', 'C-c'], function() {
  return process.exit(0);
});

// Add keyboard shortcut to toggle terminal visibility
screen.key(['t'], function() {
  toggleTerminal();
});

// Function to toggle terminal visibility
function toggleTerminal() {
  terminalVisible = !terminalVisible;
  
  if (terminalVisible) {
    terminalBox.show();
  } else {
    terminalBox.hide();
  }
  
  screen.render();
}

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    try {
      const data = JSON.parse(message);
      // Handle different message types
      switch(data.type) {
        case 'ascii':
          // Update ASCII content
          displayContent = data.content;
          displayAsciiArt();
          break;
        case 'input':
          // Update tentative input (speech recognition in progress)
          currentInput = data.content;
          updateTerminal();
          break;
        case 'input_confirm':
          // Confirm the input and add it to history
          const confirmedInput = data.content || currentInput;
          terminalContent.push({ type: 'input', content: confirmedInput });
          currentInput = '';
          updateTerminal();
          break;
        case 'output':
          // Add system output to terminal
          terminalContent.push({ type: 'output', content: data.content });
          updateTerminal();
          break;
        default:
          // For backward compatibility, treat as ASCII content
          displayContent = data.content || message.toString('utf-8');
          displayAsciiArt();
      }
    } catch (e) {
      // If not JSON, assume it's ASCII content (for backward compatibility)
      displayContent = message.toString('utf-8');
      displayAsciiArt();
    }
  });
});

server.listen(8080, function() {
  console.log('Server is listening on port 8080');
  // Initial display
  displayAsciiArt();
  updateTerminal();
});

// Install figlet if it's not already installed
let figlet;
try {
  figlet = require('figlet');
} catch (e) {
  console.log('Figlet not found, installing...');
  require('child_process').execSync('npm install figlet --save');
  figlet = require('figlet');
}

// Function to convert text to ASCII art using figlet
function textToAsciiArt(text, color) {
  try {
    // Use a more readable font with good character width proportions
    const result = figlet.textSync(text, { 
      font: 'Standard',  // Changed to Standard font which is clearer
      width: Math.floor(terminalBox.width * 0.9),
      horizontalLayout: 'default',  // Better word wrapping
      verticalLayout: 'default'
    });
    return `{${color}-fg}${result}{/${color}-fg}`;
  } catch (e) {
    console.error('Figlet error:', e);
    // Fallback to plain text if figlet fails
    return `{${color}-fg}${text}{/${color}-fg`;
  }
}

// Function to display ASCII art using blessed
function displayAsciiArt() {
  // Ensure no whitespace in the content
  const trimmedContent = displayContent.replace(/\s+$/, '');
  
  // Update box content
  box.setContent(trimmedContent);
  
  // Set the cursor position to avoid any auto-spacing
  box.position.autoPadding = false;
  
  // Make sure terminal is on top if visible
  if (terminalVisible) {
    terminalBox.setFront();
  }
  
  // Render the screen
  screen.render();
}

// Function to update terminal display with figlet ASCII art
function updateTerminal() {
  // Skip update if terminal is not visible
  if (!terminalVisible) return;
  
  let content = '';
  
  // Get all interactions to display in terminal (or limit to last several entries)
  const visibleContent = terminalContent.slice(-6); // Show last 6 interactions
  
  // Add past interactions with figlet ASCII art
  visibleContent.forEach(item => {
    if (item.type === 'input') {
      // Display user input with yellow text - show more characters
      // Handle long text by splitting it into multiple lines
      const inputText = splitLongText(item.content, 35);
      content += textToAsciiArt('>  ' + inputText, 'yellow') + '\n\n';
    } else {
      // Display system output with green text
      const outputText = splitLongText(item.content, 35);
      content += textToAsciiArt(outputText, 'green') + '\n\n';
    }
  });
  
  // Add current input if exists
  if (currentInput) {
    // Convert the current input to ASCII art, showing more of the input
    const displayInput = splitLongText(currentInput, 35);
    content += textToAsciiArt('>  ' + displayInput, 'yellow');
  }
  
  // Update terminal content
  terminalBox.setContent(content);
  
  // Scroll to bottom
  terminalBox.setScrollPerc(100);
  
  // Make sure terminal is on top
  terminalBox.setFront();
  
  // Render the screen
  screen.render();
}

// Improved helper function to split text with better line breaks
function splitLongText(text, charsPerLine) {
  if (!text || text.length <= charsPerLine) {
    return text || '';
  }
  
  // For extremely long text, truncate with ellipsis
  //if (text.length > charsPerLine * 4) {
  //  return text.substring(0, charsPerLine * 4) + '...';
  //}
  
  // Split at word boundaries when possible
  const words = text.split(' ');
  let lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    // If adding this word would exceed the line length
    if (currentLine.length + word.length + 1 > charsPerLine) {
      // Add current line to lines array and start a new line
      if (currentLine) {
        lines.push(currentLine);
      }
      // If the word itself is longer than the line length, split it
      if (word.length > charsPerLine) {
        let remainingWord = word;
        while (remainingWord.length > charsPerLine) {
          lines.push(remainingWord.substring(0, charsPerLine));
          remainingWord = remainingWord.substring(charsPerLine);
        }
        currentLine = remainingWord;
      } else {
        currentLine = word;
      }
    } else {
      // Add word to current line
      currentLine = currentLine ? currentLine + ' ' + word : word;
    }
  });
  
  // Add the final line
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.join('\n');
}
