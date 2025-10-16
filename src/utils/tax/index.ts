// src/utils/tax/index.ts
/**
 * 🌍 Global Tax Calculation Engine
 * Includes real or simplified logic for 12 major countries.
 * All others use default 10% flat tax.
 */

export interface TaxInput {
  income: number;
  deductions?: number;
}
export interface TaxResult {
  tax: number;
  netIncome: number;
}

/* ======================================================
   🇮🇳 INDIA
====================================================== */
export function calculateIndiaTax({ income, deductions = 0 }: TaxInput): TaxResult {
  let taxable = Math.max(0, income - deductions - 50000);
  let tax = 0;
  if (taxable <= 300000) tax = 0;
  else if (taxable <= 600000) tax = (taxable - 300000) * 0.05;
  else if (taxable <= 900000) tax = 15000 + (taxable - 600000) * 0.1;
  else if (taxable <= 1200000) tax = 45000 + (taxable - 900000) * 0.15;
  else if (taxable <= 1500000) tax = 90000 + (taxable - 1200000) * 0.2;
  else tax = 150000 + (taxable - 1500000) * 0.3;
  tax *= 1.04; // 4% cess
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇺🇸 USA (Simplified Federal 2024)
====================================================== */
export function calculateUsaTax({ income, deductions = 13850 }: TaxInput): TaxResult {
  const taxable = Math.max(0, income - deductions);
  const brackets = [
    { limit: 11000, rate: 0.1 },
    { limit: 44725, rate: 0.12 },
    { limit: 95375, rate: 0.22 },
    { limit: 182100, rate: 0.24 },
    { limit: 231250, rate: 0.32 },
    { limit: 578125, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
  ];
  let tax = 0;
  let prev = 0;
  for (const { limit, rate } of brackets) {
    if (taxable <= prev) break;
    const taxableAtRate = Math.min(taxable - prev, limit - prev);
    tax += taxableAtRate * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇬🇧 UK (2024–25)
====================================================== */
export function calculateUkTax({ income }: TaxInput): TaxResult {
  let taxable = Math.max(0, income - 12570);
  let tax = 0;
  if (taxable <= 37700) tax = taxable * 0.2;
  else if (taxable <= 150000) tax = 7540 + (taxable - 37700) * 0.4;
  else tax = 7540 + 44920 + (taxable - 150000) * 0.45;
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇨🇦 Canada (Federal simplified)
====================================================== */
export function calculateCanadaTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 53359, rate: 0.15 },
    { limit: 106717, rate: 0.205 },
    { limit: 165430, rate: 0.26 },
    { limit: 235675, rate: 0.29 },
    { limit: Infinity, rate: 0.33 },
  ];
  let tax = 0;
  let prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇦🇺 Australia
====================================================== */
export function calculateAustraliaTax({ income }: TaxInput): TaxResult {
  let tax = 0;
  if (income <= 18200) tax = 0;
  else if (income <= 45000) tax = (income - 18200) * 0.19;
  else if (income <= 120000) tax = 5092 + (income - 45000) * 0.325;
  else if (income <= 180000) tax = 29467 + (income - 120000) * 0.37;
  else tax = 51667 + (income - 180000) * 0.45;
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇩🇪 Germany (approx.)
====================================================== */
export function calculateGermanyTax({ income }: TaxInput): TaxResult {
  if (income <= 10908) return { tax: 0, netIncome: income };
  let tax = 0;
  if (income <= 62000) tax = (income - 10908) * 0.25;
  else if (income <= 277825) tax = 12773 + (income - 62000) * 0.42;
  else tax = 100000 + (income - 277825) * 0.45;
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇫🇷 France (simplified)
====================================================== */
export function calculateFranceTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 10777, rate: 0 },
    { limit: 27478, rate: 0.11 },
    { limit: 78570, rate: 0.3 },
    { limit: 168994, rate: 0.41 },
    { limit: Infinity, rate: 0.45 },
  ];
  let tax = 0;
  let prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇯🇵 Japan (simplified)
====================================================== */
export function calculateJapanTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 1950000, rate: 0.05 },
    { limit: 3300000, rate: 0.1 },
    { limit: 6950000, rate: 0.2 },
    { limit: 9000000, rate: 0.23 },
    { limit: 18000000, rate: 0.33 },
    { limit: 40000000, rate: 0.4 },
    { limit: Infinity, rate: 0.45 },
  ];
  let tax = 0;
  let prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇸🇬 Singapore (simplified)
====================================================== */
export function calculateSingaporeTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 20000, rate: 0 },
    { limit: 30000, rate: 0.02 },
    { limit: 40000, rate: 0.035 },
    { limit: 80000, rate: 0.07 },
    { limit: 120000, rate: 0.115 },
    { limit: 160000, rate: 0.15 },
    { limit: 200000, rate: 0.18 },
    { limit: 240000, rate: 0.19 },
    { limit: 280000, rate: 0.195 },
    { limit: 320000, rate: 0.2 },
    { limit: Infinity, rate: 0.22 },
  ];
  let tax = 0;
  let prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇧🇷 Brazil (simplified)
====================================================== */
export function calculateBrazilTax({ income }: TaxInput): TaxResult {
  if (income <= 2112) return { tax: 0, netIncome: income };
  let tax = 0;
  if (income <= 2826.65) tax = (income - 2112) * 0.075;
  else if (income <= 3751.05) tax = 53.6 + (income - 2826.65) * 0.15;
  else if (income <= 4664.68) tax = 190 + (income - 3751.05) * 0.225;
  else tax = 355 + (income - 4664.68) * 0.275;
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇳🇿 New Zealand (simplified)
====================================================== */
export function calculateNewZealandTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 14000, rate: 0.105 },
    { limit: 48000, rate: 0.175 },
    { limit: 70000, rate: 0.3 },
    { limit: 180000, rate: 0.33 },
    { limit: Infinity, rate: 0.39 },
  ];
  let tax = 0;
  let prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇿🇦 South Africa (simplified)
====================================================== */
export function calculateSouthAfricaTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 237100, rate: 0.18 },
    { limit: 370500, rate: 0.26 },
    { limit: 512800, rate: 0.31 },
    { limit: 673000, rate: 0.36 },
    { limit: 857900, rate: 0.39 },
    { limit: 1817000, rate: 0.41 },
    { limit: Infinity, rate: 0.45 },
  ];
  let tax = 0;
  let prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇮🇹 Italy (simplified 2024)
====================================================== */
export function calculateItalyTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 15000, rate: 0.23 },
    { limit: 28000, rate: 0.25 },
    { limit: 50000, rate: 0.35 },
    { limit: Infinity, rate: 0.43 },
  ];
  let tax = 0, prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇪🇸 Spain (simplified national scale)
====================================================== */
export function calculateSpainTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 12450, rate: 0.19 },
    { limit: 20200, rate: 0.24 },
    { limit: 35200, rate: 0.3 },
    { limit: 60000, rate: 0.37 },
    { limit: 300000, rate: 0.45 },
    { limit: Infinity, rate: 0.47 },
  ];
  let tax = 0, prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇳🇱 Netherlands
====================================================== */
export function calculateNetherlandsTax({ income }: TaxInput): TaxResult {
  let tax = 0;
  if (income <= 75000) tax = income * 0.3697;
  else tax = 75000 * 0.3697 + (income - 75000) * 0.495;
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇸🇪 Sweden
====================================================== */
export function calculateSwedenTax({ income }: TaxInput): TaxResult {
  let tax = 0;
  if (income <= 59800) tax = income * 0.32; // municipal avg
  else tax = 59800 * 0.32 + (income - 59800) * 0.52; // incl. national
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇳🇴 Norway
====================================================== */
export function calculateNorwayTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 208050, rate: 0 },
    { limit: 292850, rate: 0.017 },
    { limit: 670000, rate: 0.04 },
    { limit: 937900, rate: 0.136 },
    { limit: 1350000, rate: 0.166 },
    { limit: Infinity, rate: 0.176 },
  ];
  let tax = 0, prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇨🇭 Switzerland (federal only)
====================================================== */
export function calculateSwitzerlandTax({ income }: TaxInput): TaxResult {
  let tax = 0;
  if (income <= 14500) tax = 0;
  else if (income <= 31500) tax = (income - 14500) * 0.0088;
  else if (income <= 41500) tax = 150 + (income - 31500) * 0.0264;
  else if (income <= 55500) tax = 414 + (income - 41500) * 0.044;
  else if (income <= 72500) tax = 1030 + (income - 55500) * 0.088;
  else tax = 2526 + (income - 72500) * 0.11;
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇮🇪 Ireland
====================================================== */
export function calculateIrelandTax({ income }: TaxInput): TaxResult {
  const standardRateCutOff = 42000;
  const standardRate = 0.2;
  const higherRate = 0.4;
  let tax = 0;
  if (income <= standardRateCutOff) tax = income * standardRate;
  else tax = standardRateCutOff * standardRate + (income - standardRateCutOff) * higherRate;
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇦🇪 United Arab Emirates (no income tax)
====================================================== */
export function calculateUaeTax({ income }: TaxInput): TaxResult {
  return { tax: 0, netIncome: income };
}

/* ======================================================
   🇸🇦 Saudi Arabia (no income tax)
====================================================== */
export function calculateSaudiArabiaTax({ income }: TaxInput): TaxResult {
  return { tax: 0, netIncome: income };
}

/* ======================================================
   🇹🇷 Turkey (simplified)
====================================================== */
export function calculateTurkeyTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 11000, rate: 0.15 },
    { limit: 50000, rate: 0.2 },
    { limit: 88000, rate: 0.27 },
    { limit: 190000, rate: 0.35 },
    { limit: Infinity, rate: 0.4 },
  ];
  let tax = 0, prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇨🇳 China (simplified)
====================================================== */
export function calculateChinaTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 36000, rate: 0.03 },
    { limit: 144000, rate: 0.1 },
    { limit: 300000, rate: 0.2 },
    { limit: 420000, rate: 0.25 },
    { limit: 660000, rate: 0.3 },
    { limit: 960000, rate: 0.35 },
    { limit: Infinity, rate: 0.45 },
  ];
  let tax = 0, prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇰🇷 South Korea (simplified)
====================================================== */
export function calculateKoreaTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 14000000, rate: 0.06 },
    { limit: 50000000, rate: 0.15 },
    { limit: 88000000, rate: 0.24 },
    { limit: 150000000, rate: 0.35 },
    { limit: 300000000, rate: 0.38 },
    { limit: 500000000, rate: 0.4 },
    { limit: 1000000000, rate: 0.42 },
    { limit: Infinity, rate: 0.45 },
  ];
  let tax = 0, prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇲🇾 Malaysia (simplified)
====================================================== */
export function calculateMalaysiaTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 5000, rate: 0 },
    { limit: 20000, rate: 0.01 },
    { limit: 35000, rate: 0.03 },
    { limit: 50000, rate: 0.06 },
    { limit: 70000, rate: 0.11 },
    { limit: 100000, rate: 0.19 },
    { limit: 250000, rate: 0.25 },
    { limit: 400000, rate: 0.26 },
    { limit: 600000, rate: 0.28 },
    { limit: Infinity, rate: 0.3 },
  ];
  let tax = 0, prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇹🇭 Thailand (simplified)
====================================================== */
export function calculateThailandTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 150000, rate: 0 },
    { limit: 300000, rate: 0.05 },
    { limit: 500000, rate: 0.1 },
    { limit: 750000, rate: 0.15 },
    { limit: 1000000, rate: 0.2 },
    { limit: 2000000, rate: 0.25 },
    { limit: 5000000, rate: 0.3 },
    { limit: Infinity, rate: 0.35 },
  ];
  let tax = 0, prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇦🇷 Argentina (simplified)
====================================================== */
export function calculateArgentinaTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 173000, rate: 0.05 },
    { limit: 346000, rate: 0.09 },
    { limit: 519000, rate: 0.12 },
    { limit: 692000, rate: 0.15 },
    { limit: 1038000, rate: 0.19 },
    { limit: 1384000, rate: 0.23 },
    { limit: 1730000, rate: 0.27 },
    { limit: 2076000, rate: 0.31 },
    { limit: Infinity, rate: 0.35 },
  ];
  let tax = 0, prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇳🇬 Nigeria (simplified)
====================================================== */
export function calculateNigeriaTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 300000, rate: 0.07 },
    { limit: 600000, rate: 0.11 },
    { limit: 1100000, rate: 0.15 },
    { limit: 1600000, rate: 0.19 },
    { limit: 3200000, rate: 0.21 },
    { limit: Infinity, rate: 0.24 },
  ];
  let tax = 0, prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇪🇬 Egypt (simplified)
====================================================== */
export function calculateEgyptTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 15000, rate: 0 },
    { limit: 30000, rate: 0.025 },
    { limit: 45000, rate: 0.1 },
    { limit: 200000, rate: 0.15 },
    { limit: 400000, rate: 0.2 },
    { limit: 1000000, rate: 0.25 },
    { limit: Infinity, rate: 0.3 },
  ];
  let tax = 0, prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇮🇩 Indonesia (simplified)
====================================================== */
export function calculateIndonesiaTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 60000000, rate: 0.05 },
    { limit: 250000000, rate: 0.15 },
    { limit: 500000000, rate: 0.25 },
    { limit: 5000000000, rate: 0.3 },
    { limit: Infinity, rate: 0.35 },
  ];
  let tax = 0, prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}


/* ======================================================
   🇻🇳 Vietnam (simplified)
====================================================== */
export function calculateVietnamTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 5000000, rate: 0.05 },
    { limit: 10000000, rate: 0.1 },
    { limit: 18000000, rate: 0.15 },
    { limit: 32000000, rate: 0.2 },
    { limit: 52000000, rate: 0.25 },
    { limit: 80000000, rate: 0.3 },
    { limit: Infinity, rate: 0.35 },
  ];
  let tax = 0, prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇵🇱 Poland (simplified)
====================================================== */
export function calculatePolandTax({ income }: TaxInput): TaxResult {
  let tax = 0;
  if (income <= 120000) tax = income * 0.12;
  else tax = 120000 * 0.12 + (income - 120000) * 0.32;
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇨🇭 Switzerland (detailed national + cantonal average)
====================================================== */
export function calculateSwissTax({ income }: TaxInput): TaxResult {
  // Federal progressive + average canton ~12%
  let federal = 0;
  if (income <= 14500) federal = 0;
  else if (income <= 31500) federal = (income - 14500) * 0.0088;
  else if (income <= 41500) federal = 150 + (income - 31500) * 0.0264;
  else if (income <= 55500) federal = 414 + (income - 41500) * 0.044;
  else if (income <= 72500) federal = 1030 + (income - 55500) * 0.088;
  else federal = 2526 + (income - 72500) * 0.11;

  const canton = income * 0.12;
  const tax = federal + canton;
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇫🇮 Finland (simplified)
====================================================== */
export function calculateFinlandTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 19900, rate: 0 },
    { limit: 29700, rate: 0.06 },
    { limit: 49000, rate: 0.1725 },
    { limit: 85000, rate: 0.2125 },
    { limit: Infinity, rate: 0.3125 },
  ];
  let tax = 0, prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  // add local tax avg 18%
  tax += income * 0.18;
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇩🇰 Denmark (simplified)
====================================================== */
export function calculateDenmarkTax({ income }: TaxInput): TaxResult {
  let tax = 0;
  if (income <= 59800) tax = income * 0.37; // local + basic state
  else tax = 59800 * 0.37 + (income - 59800) * 0.52; // incl. top rate
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇨🇿 Czech Republic (flat + solidarity)
====================================================== */
export function calculateCzechTax({ income }: TaxInput): TaxResult {
  let tax = income * 0.15;
  if (income > 1940000) tax += (income - 1940000) * 0.07;
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇵🇹 Portugal (simplified)
====================================================== */
export function calculatePortugalTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 7479, rate: 0.145 },
    { limit: 11284, rate: 0.21 },
    { limit: 15992, rate: 0.26 },
    { limit: 20700, rate: 0.28 },
    { limit: 26355, rate: 0.35 },
    { limit: 38632, rate: 0.37 },
    { limit: 50483, rate: 0.43 },
    { limit: 78834, rate: 0.45 },
    { limit: Infinity, rate: 0.48 },
  ];
  let tax = 0, prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇬🇷 Greece (simplified)
====================================================== */
export function calculateGreeceTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 10000, rate: 0.09 },
    { limit: 20000, rate: 0.22 },
    { limit: 30000, rate: 0.28 },
    { limit: 40000, rate: 0.36 },
    { limit: Infinity, rate: 0.44 },
  ];
  let tax = 0, prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇭🇺 Hungary (flat tax)
====================================================== */
export function calculateHungaryTax({ income }: TaxInput): TaxResult {
  const tax = income * 0.15;
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇲🇽 Mexico (simplified)
====================================================== */
export function calculateMexicoTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 7735, rate: 0.0192 },
    { limit: 65651, rate: 0.064 },
    { limit: 115375, rate: 0.1088 },
    { limit: 134119, rate: 0.16 },
    { limit: 160577, rate: 0.1792 },
    { limit: 323862, rate: 0.2136 },
    { limit: 510451, rate: 0.2352 },
    { limit: 974535, rate: 0.3 },
    { limit: Infinity, rate: 0.35 },
  ];
  let tax = 0, prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇨🇱 Chile (simplified)
====================================================== */
export function calculateChileTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 8031840, rate: 0 },
    { limit: 17848520, rate: 0.04 },
    { limit: 29747540, rate: 0.08 },
    { limit: 41646560, rate: 0.135 },
    { limit: 53545580, rate: 0.23 },
    { limit: 71460620, rate: 0.304 },
    { limit: 89275660, rate: 0.35 },
    { limit: Infinity, rate: 0.4 },
  ];
  let tax = 0, prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}

/* ======================================================
   🇰🇪 Kenya (simplified)
====================================================== */
export function calculateKenyaTax({ income }: TaxInput): TaxResult {
  const brackets = [
    { limit: 24000, rate: 0.1 },
    { limit: 40667, rate: 0.15 },
    { limit: 57334, rate: 0.2 },
    { limit: 74000, rate: 0.25 },
    { limit: Infinity, rate: 0.3 },
  ];
  let tax = 0, prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    const taxable = Math.min(income - prev, limit - prev);
    tax += taxable * rate;
    prev = limit;
  }
  return { tax, netIncome: income - tax };
}




/* ======================================================
   🌍 Default Flat 10% Tax (for remaining countries)
====================================================== */
export const defaultTax = ({ income }: TaxInput): TaxResult => {
  const tax = income * 0.1;
  return { tax, netIncome: income - tax };
};

/* ======================================================
   🌐 Tax Engine Registry
====================================================== */
export const TAX_ENGINES: Record<string, (data: TaxInput) => TaxResult> = {
  IN: calculateIndiaTax,
  US: calculateUsaTax,
  UK: calculateUkTax,
  CA: calculateCanadaTax,
  AU: calculateAustraliaTax,
  DE: calculateGermanyTax,
  FR: calculateFranceTax,
  JP: calculateJapanTax,
  SG: calculateSingaporeTax,
  BR: calculateBrazilTax,
  NZ: calculateNewZealandTax,
  ZA: calculateSouthAfricaTax,
  IT: calculateItalyTax,
  ES: calculateSpainTax,
  NL: calculateNetherlandsTax,
  SE: calculateSwedenTax,
  NO: calculateNorwayTax,
  CH: calculateSwitzerlandTax,
  IE: calculateIrelandTax,
  AE: calculateUaeTax,
  SA: calculateSaudiArabiaTax,
  TR: calculateTurkeyTax,
  CN: calculateChinaTax,
  KR: calculateKoreaTax,
  MY: calculateMalaysiaTax,
  TH: calculateThailandTax,
  AR: calculateArgentinaTax,
  NG: calculateNigeriaTax,
  EG: calculateEgyptTax,
  ID: calculateIndonesiaTax,
  VN: calculateVietnamTax,
  PL: calculatePolandTax,
  CH: calculateSwissTax,
  FI: calculateFinlandTax,
  DK: calculateDenmarkTax,
  CZ: calculateCzechTax,
  PT: calculatePortugalTax,
  GR: calculateGreeceTax,
  HU: calculateHungaryTax,
  MX: calculateMexicoTax,
  CL: calculateChileTax,
  KE: calculateKenyaTax,

  // all others fallback
};

export function getTaxCalculator(code: string) {
  return TAX_ENGINES[code] || defaultTax;
}
