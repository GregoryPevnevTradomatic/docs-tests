const DocxTemplater = require('docxtemplater');
const PizZip = require('pizzip');
const rimraf = require('rimraf');
const fs = require('fs');
const path = require('path');

const USER_DATA = require('./data.json');

const INPUT_DIRECTORY = path.resolve(__dirname, 'files', 'input');
const OUTPUT_DIRECTORY = path.resolve(__dirname, 'files', 'output');

const alternativeParam1 = param => param.replace(/\-/g, '_');
const alternativeParam2 = param => param.replace(/\-/g, ' ');

const extraParameters = parameters =>
  Object.keys(parameters).reduce(
    (result, param) => ({
      ...result,
      [alternativeParam1(param)]: parameters[param],
      [alternativeParam2(param)]: parameters[param],
    }),
    parameters
  );

const processFilename = (filename, parameters) =>
  Object.keys(parameters).reduce(
    (result, param) => result.replace(new RegExp(`\{${param}\}`, 'g'), parameters[param]),
    filename
  ).replace(/\s+/g, ' ') // No duplicate whitespace
    .replace(/\s/g, '_') // Get rid of whitespace
    .replace(/\//g, '_'); // Formatting filename

const renderTemplate = (inputFile, parameters) => {
  const inputPath = path.join(INPUT_DIRECTORY, inputFile);
  const outputPath = path.join(OUTPUT_DIRECTORY, processFilename(inputFile, parameters));

  const content = fs.readFileSync(inputPath);
  const zip = new PizZip(content);

  try {
    const doc = new DocxTemplater(zip);

    doc.setData(parameters);

    doc.render();

    const buffer = doc.getZip().generate({type: 'nodebuffer'});

    fs.writeFileSync(outputPath, buffer);
  } catch(e) {
    console.log(e);
  }
};

const ALL_DATA = USER_DATA.map(extraParameters);

const TEMPLATE_FILES = fs.readdirSync(INPUT_DIRECTORY);

// Forcefully deletes data
if(fs.existsSync(OUTPUT_DIRECTORY)) rimraf.sync(OUTPUT_DIRECTORY);
fs.mkdirSync(OUTPUT_DIRECTORY);

ALL_DATA.forEach(parameters => {
  TEMPLATE_FILES.forEach(filename => {
    renderTemplate(filename, parameters);
  });
});
