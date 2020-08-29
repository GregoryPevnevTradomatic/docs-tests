const docxConverter = require('docx-pdf');
// const word2pdf = require('word2pdf');
const fs = require('fs');

const INPUT = './input/Resume.docx';
const OUTPUT = './output/Resume.pdf';

// Does NOT work at ALL
const convert = async () => {
  const data = await word2pdf(INPUT)
  fs.writeFileSync(OUTPUT, data);
}

// No styling
const convert2 = () => {
  docxConverter(INPUT, OUTPUT, (err, result) => {
    if (err) console.log(err);
    else console.log(result); // writes to file for us
  });
}

convert2();
