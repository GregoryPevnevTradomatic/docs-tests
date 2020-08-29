const { PDFNet } = require('@pdftron/pdfnet-node');
const DocxTemplater = require('docxtemplater');
const CloudConvert = require('cloudconvert');
const PizZip = require('pizzip');
const https = require('https');
const fs = require('fs');
const path = require('path');

const UNIQUE_ID = Math.round(Date.now() / 1000);

const USER_DATA = require('./data.json');

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

const ALL_DATA = USER_DATA.map(extraParameters);

const TEMPLATE_FILES = fs.readdirSync(path.resolve(__dirname, 'input'));

// const INPUT = path.join(__dirname, 'input', INPUT_FILENAME);
// const TEMP = path.join(__dirname, 'temp', OUTPUT_FILENAME);
// const OUTPUT = path.join(__dirname, 'output', `Template-${UNIQUE_ID}.pdf`);

const CLOUD_KEY = fs.readFileSync(path.join(__dirname, 'credentials', 'live-key'));

const cloudConvert = new CloudConvert(CLOUD_KEY, false);

// NOTE: Could be zipping for storage in Buckets and passing the ZIP to the templates DIRECTLY

// TODO: Using Buffers / Streams instead

// TODO: Using Worker Threads??? (Sync is NOT good)

const renderTemplate = (inputFile, parameters) => {
  const inputPath = path.resolve(__dirname, 'input', inputFile);
  const outputPath = path.resolve(__dirname, 'temp', processFilename(inputFile, parameters));

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

const convertToPdfWithCloud = async () => {
  let job = await cloudConvert.jobs.create({
    tasks: {
        // Input Task -> Upload (Via Stream)
        'upload-my-file': {
            operation: 'import/upload'
        },
        // Conversion Task
        'convert-my-file': {
            operation: 'convert',
            input: 'upload-my-file',
            input_format: 'docx',
            output_format: 'pdf'
        },
        // Output Task -> Download (Via URL and Stream)
        'export-my-file': {
            operation: 'export/url',
            input: 'convert-my-file'
        }
    }
  });
  
  const uploadTask = job.tasks.filter(task => task.name === 'upload-my-file')[0];
  
  const inputFile = fs.createReadStream(TEMP);
  
  await cloudConvert.tasks.upload(uploadTask, inputFile, 'file.docx');
  
  job = await cloudConvert.jobs.wait(job.id);

  console.log(JSON.stringify(job, null, 2));
  
  const exportTask = job.tasks.filter(
      task => task.name === 'export-my-file'
  )[0];
  const file = exportTask.result.files[0];
  
  const writeStream = fs.createWriteStream(OUTPUT);
  
  https.get(file.url, function (response) {
      response.pipe(writeStream);
  });
  
  await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
  });
};

const convertToPdfWithPdfTron = async () => {
  const generatePdf = async () => {
    try {
      const pdfdoc = await PDFNet.PDFDoc.create();
      await pdfdoc.initSecurityHandler();
      if (await PDFNet.Convert.requiresPrinter(TEMP)) {
        console.log("Using PDFNet printer to convert file");
      }
      await PDFNet.Convert.toPdf(pdfdoc, TEMP);
  
      await pdfdoc.save(OUTPUT, PDFNet.SDFDoc.SaveOptions.e_linearized);
    }
    catch (err) {
      console.log('ERROR');
      console.log(err);
    }
  };

  PDFNet.runWithCleanup(generatePdf)
    .then(() => {
      PDFNet.shutdown();
    });
};

// (async function() {
  // await renderTemplate();
  // await convertToPdfWithCloud();
// }());

ALL_DATA.forEach(parameters => {
  TEMPLATE_FILES.forEach(filename => {
    renderTemplate(filename, parameters);
  });
});

// Talk about:
//   1. File format
//   2. Using "-" and "_" interchangably
