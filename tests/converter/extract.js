const Mustache = require('mustache');
const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, 'temp', 'Resume.html');

const template = fs.readFileSync(INPUT, 'utf8');

const params = Mustache.parse(template)
  .filter(function(v) { return v[0] === 'name' || v[0] === '#' || v[0] === '&' })
  .map(function(v) { return v[1]; });

console.log(params);
