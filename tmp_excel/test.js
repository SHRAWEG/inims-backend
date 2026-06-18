const xlsx = require("xlsx");
const workbook = xlsx.readFile("/home/lily/Downloads/MSNP-III Indicators.xlsx");
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rows = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
console.log("Total rows:", rows.length);
const firstFew = rows.slice(0, 15).map(r => ({ sno: r["सि.नं."], code: r["सूचक नं. M&E"], codeResult: r["सूचक नं. Result"], remarks: r["टिप्पणी - remark for data"], src: r["Source"] }));
console.log(firstFew);
