const fs = require('fs');
const { translate } = require('@vitalets/google-translate-api');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  const dataPath = 'src/database/seeders/data/msnp-seed-data.json';
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  let count = 0;

  for (const indicator of data.indicators) {
    if (parseInt(indicator.code) >= 58 && indicator.name.en === indicator.name.ne) {
      try {
        console.log(`Translating code ${indicator.code}...`);
        const res = await translate(indicator.name.ne, { from: 'ne', to: 'en' });
        indicator.name.en = res.text;
        count++;
        await delay(1500); // 1.5 second delay
      } catch (e) {
        console.error(`Failed to translate code ${indicator.code}:`, e.message);
      }
    }
  }

  if (count > 0) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log(`Successfully translated and saved ${count} indicators.`);
  } else {
    console.log('No indicators needed translation.');
  }
}

run();
