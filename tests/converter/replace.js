const Mustache = require('mustache');
var pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, 'temp', 'Resume.html');
const OUTPUT = path.join(__dirname, 'output', 'Resume.pdf');

const view = {
  'имя': '1234',
  'Email': 'EMAIL',
  'Date': '12-12-2002'
};

const template = fs.readFileSync(INPUT, 'utf8');

const result = Mustache.render(template, view);

pdf.create(result).toFile(OUTPUT, console.log);
