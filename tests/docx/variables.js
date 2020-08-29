const textract = require('textract');
const fs = require('fs');
const path = require('path');

const VARIABLES = /\{[^\}]+\}/ig;

const INPUT = path.join(__dirname, 'input', 'Template.docx');

// NOTE: NO TRIMMING FOR STORAGE / PROCESSING
//   -> Only trimming when ASKING for input
const extractVariables = text =>
  text.match(VARIABLES)
    .map(variable => variable.slice(1, variable.length - 1));

const deduplicate = variables => Array.from(new Set(variables));

textract.fromFileWithPath(INPUT, (err, text) => {
  if(err) {
    throw new Error(err);
  }

  const variables = extractVariables(text);

  console.log(deduplicate(variables));
});
