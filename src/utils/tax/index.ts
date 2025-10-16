// src/utils/tax/index.ts
import { calculateIndiaTax } from './india';
import { calculateUsaTax } from './usa';
import { calculateUkTax } from './uk';
import { calculateCanadaTax } from './canada';
import { calculateAustraliaTax } from './australia';

// Default: flat 10% fallback for countries not implemented yet
export const defaultTax = ({ income }: { income: number }) => {
  const tax = income * 0.1;
  return { tax, netIncome: income - tax };
};

export const TAX_ENGINES: Record<string, Function> = {
  IN: calculateIndiaTax,
  US: calculateUsaTax,
  UK: calculateUkTax,
  CA: calculateCanadaTax,
  AU: calculateAustraliaTax,
};

// Return fallback for any country without defined logic
export function getTaxCalculator(code: string) {
  return TAX_ENGINES[code] || defaultTax;
}
