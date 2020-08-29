const { PDFNet } = require('@pdftron/pdfnet-node');
const path = require('path');

const INPUT = path.join(__dirname, 'input', 'Template2.docx');
const OUTPUT = path.join(__dirname, 'output', 'Template2.pdf');

const DATA = {
  'номер-договора': '10082020/35',
  'дата-договора': '10.08.2020',
  'название-компании-контрагента': 'ТОВАРИСТВО З ОБМЕЖЕНОЮ ВІДПОВІДАЛЬНІСТЮ «ЛУЇ ДРЕЙФУС КОМПАНІ УКРАЇНА»',
  'адрес-компании-контрагента': '01001 Україна, м. Київ, Площа Спортивна, 1-А, БЦ «Гулівер», 15 поверх',
  'ЕДРПОУ-компании-контрагента': '30307207',
  'должность-подписанта-(именительный)': 'Генеральний директор',
  'должность-подписанта-(родительный)': 'Генерального директора',
  'подписант-компании-контрагента-(именительный)': 'Карпенко О. П.',
  'подписант-компании-контрагента-(родительный)': 'Карпенка Олександра Петровича',
  'документ-основание': 'Статуту',
  'цена-подписки-(число)': '5 000,00',
  'цена-подписки-(текст)': 'п\'ять тисяч гривень 00 коп.',
  'банка-компании-контрагента': 'АТ «УкрСиббанк» у м. Києві',
  'код-банка-компании-контрагента': '351005',
  'IBAN-компании-контрагента': 'UA343510050000026001613121200',
  'email-компании-контрагента': 'anna.onofreichuk@ldc.com',
};

const createReplacer = async data => {
  const replacer = await PDFNet.ContentReplacer.create();

  await Promise.all(
    Object.keys(DATA).map(name => replacer.addString(name, DATA[name]))
  );

  return replacer;
};

const processDocument = async (pdfDoc, replacer) => {
  const iterator = await pdfDoc.getPageIterator(1);
  let page = null;
  let hasNext = false;

  do {
    page = await iterator.current();

    await replacer.process(page);

    hasNext = await iterator.hasNext();

    if(hasNext) await iterator.next();
  } while(hasNext);
};

const main = async () => {
  try {
    const pdfdoc = await PDFNet.PDFDoc.create();
    await pdfdoc.initSecurityHandler();
    if (await PDFNet.Convert.requiresPrinter(INPUT)) {
      console.log("Using PDFNet printer to convert file");
    }
    await PDFNet.Convert.toPdf(pdfdoc, INPUT);

    const replacer = await createReplacer(DATA);

    await processDocument(pdfdoc, replacer);

    await pdfdoc.save(OUTPUT, PDFNet.SDFDoc.SaveOptions.e_linearized);
  }
  catch (err) {
    console.log('ERROR');
    console.log(err);
  }
};

PDFNet.runWithCleanup(main)
    .then(() => {
      PDFNet.shutdown();
    });
