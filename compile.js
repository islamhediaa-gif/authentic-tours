const bytenode = require('bytenode');
const fs = require('fs');
const path = require('path');

async function compile() {
  try {
    console.log('Compiling main.js to main.jsc...');
    await bytenode.compileFile({
      filename: './main.js',
      output: './main.jsc'
    });
    console.log('Compilation successful!');
    process.exit(0);
  } catch (err) {
    console.error('Compilation failed:', err);
    process.exit(1);
  }
}

compile();
