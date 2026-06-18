const fs = require('fs');
const xlsx = require('xlsx');

const excelPath = '/home/lily/Downloads/MSNP-III Indicators.xlsx';
const jsonPath = '/home/lily/Coding/iclick/inims/inims-backend/src/database/seeders/data/current-status-seed-data.json';

const workbook = xlsx.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rows = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

const excelMap = {};
rows.forEach(row => {
    let sno = row['सि.नं.'];
    if (sno !== undefined && sno !== "") {
        let code = String(sno).trim();
        excelMap[code] = {
            remarks: row['टिप्पणी - remark for data'],
            dataSource: row['Source']
        };
    }
});

const currentStatusData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
currentStatusData.forEach(item => {
    const code = String(item.code).trim();
    if (excelMap[code]) {
        item.remarks = excelMap[code].remarks;
        item.dataSource = excelMap[code].dataSource;
    }
});

fs.writeFileSync(jsonPath, JSON.stringify(currentStatusData, null, 2));
console.log('Updated current-status-seed-data.json with all data from Excel');
