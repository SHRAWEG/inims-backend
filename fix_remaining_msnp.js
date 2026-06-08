const fs = require('fs');

const dataPath = 'src/database/seeders/data/msnp-seed-data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const dictionary = {
  "137": "Number of women utilizing institutional delivery services",
  "138": "Proportion of women attending 4 ANC visits",
  "139": "Percentage of children breastfed within 1 hour of birth",
  "140": "Federal level sectoral ministries updating progress of MSNP in thematic committees",
  "141": "Provinces incorporating nutrition and food security programs in annual policies, plans and budgets aligned with MSNP-III",
  "142": "Rural/Urban Municipalities approving integrated MSNP plans as recommended by local level nutrition and food security steering committee",
  "143": "Local levels reporting progress through web-based system (Percentage)",
  "144": "Number of local levels with nutrition facilitators",
  "145": "Integrated nutrition information system is functional",
  "146": "Rural/Urban Municipalities with dashboards updating MSNP implementation status (Percentage)",
  "147": "Nepal Nutrition and Food Security Portal is updated",
  "148": "Integrated Monitoring and Evaluation System is functional",
  "149": "Number of local levels adopting social accountability tools (Social Audit/Community Score Card/Public Expenditure Tracking Survey/Citizen Report Card)",
  "150": "Number of federal sectors incorporating nutrition and food security programs in annual policies, plans and budgets aligned with MSNP-III",
  "151": "Number of provinces incorporating nutrition and food security programs in annual policies, plans and budgets aligned with MSNP-III",
  "152": "Percentage of Rural/Urban Municipalities approving integrated MSNP plans as recommended by local level nutrition and food security steering committee",
  "153": "Number of local levels adopting nutrition-friendly local governance",
  "154": "Capacity building guidelines prepared and approved",
  "155": "Number of Rural/Urban Municipalities with designated human resources and nutrition section/unit overseeing nutrition programs",
  "156": "National budget code established for nutrition budget tracking",
  "157": "Number of social behavior change activities conducted to raise awareness on appropriate nutrition, WASH and menstrual hygiene practices",
  "158": "a) Interpersonal communication",
  "159": "b) Group meetings",
  "160": "c) Street dramas and other community activities",
  "161": "d) Public messages (Radio jingles, television programs)",
  "162": "e) Documentary broadcasting",
  "163": "f) Public debates",
  "164": "Number of nutrition champions mobilized to raise awareness on appropriate diet, WASH and menstrual hygiene",
  "165": "Number of intergenerational dialogues to prevent harmful practices (child marriage, menstrual discrimination and gender-based violence)",
  "166": "Number of community-level awareness programs conducted to reduce child marriage",
  "167": "Number of social behavior change programs conducted with community engagement to promote positive social norms and behaviors",
  "168": "Number of local levels declaring the end of harmful practices like Chhaupadi and Dowry system - Chhaupadi (Karnali and Sudurpashchim)",
  "169": "Chhaupadi",
  "170": "Dowry",
  "171": "Child marriage",
  "172": "Child labor"
};

let count = 0;
for (const indicator of data.indicators) {
  if (dictionary[indicator.code]) {
    indicator.name.en = dictionary[indicator.code];
    count++;
  }
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`Successfully fixed translations for ${count} indicators!`);
