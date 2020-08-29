const { PDFNet } = require('@pdftron/pdfnet-node');
const path = require('path');

const INPUT = path.join(__dirname, 'input', 'Template.docx');

const toContent = paramName => {
  const match = paramName.match(/\[([^\]]+)\]/);;

  return String(match[1]);
};

const main = async () => {
  try {
    const pdfdoc = await PDFNet.PDFDoc.create();
      await pdfdoc.initSecurityHandler();
      if (await PDFNet.Convert.requiresPrinter(INPUT)) {
        console.log("Using PDFNet printer to convert file");
      }
      await PDFNet.Convert.toPdf(pdfdoc, INPUT);

      const searcher = await PDFNet.TextSearch.create();

      const params = new Set();
      let result;

      await searcher.begin(
        pdfdoc, 
        '\\[[^\\]]+\\]', 
        PDFNet.TextSearch.Mode.e_reg_expression
      );

      do {
        result = await searcher.run();

        if(result.code === PDFNet.TextSearch.ResultCode.e_found) {
          console.log(result);
          params.add(toContent(result.out_str));
        }
      } while(result.code === PDFNet.TextSearch.ResultCode.e_found);

      console.log(params);
  } catch (e) {
    console.log(e);
  }
};

PDFNet.runWithCleanup(main)
    .then(() => {
      PDFNet.shutdown();
    });
