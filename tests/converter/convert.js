const CloudConvert = require('cloudconvert');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const INPUT = path.join(__dirname, 'input', 'Resume.docx');
const OUTPUT = path.join(__dirname, 'temp', 'Resume.html');

const cloudConvert = new CloudConvert(fs.readFileSync('./live-key'), false);

// TODO: Extra processing
const processFile = async () => {
    const content = fs.readFileSync(OUTPUT);

    const $ = cheerio.load(content, { decodeEntities: false });

    $('div[title="header"]').remove();

    const text = $('span[lang="ru-RU"]');

    // Removing language tags
    text.each((i, elem) => {
        $(elem).replaceWith($(elem).text());
    });

    // TODO: Minify / Compress
    fs.writeFileSync(OUTPUT, $.html({ decodeEntities: false }));
};

const main = async () => {
  const start = Date.now();

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
            output_format: 'html',
            engine: 'libreoffice',
            embed_images: true
        },
        // Output Task -> Download (Via URL and Stream)
        'export-my-file': {
            operation: 'export/url',
            input: 'convert-my-file'
        }
    }
  });
  
  const uploadTask = job.tasks.filter(task => task.name === 'upload-my-file')[0];
  
  const inputFile = fs.createReadStream(INPUT);
  
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

  console.log(Date.now() - start);
};

main().then(() => processFile());
