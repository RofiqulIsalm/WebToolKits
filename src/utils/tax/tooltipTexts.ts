// src/utils/tax/tooltipTexts.ts
/**
 * 🌍 Tooltip texts for Global Tax Calculator
 * Each country has short explanations for "Annual Income" and "Deductions"
 */

export const TOOLTIP_TEXTS: Record<
  string,
  { income: string; deductions: string }
> = {
  // Default fallback (global)
  "": {
    income: "Total amount earned in a year before taxes and deductions.",
    deductions:
      "Expenses or investments that reduce taxable income, like health insurance or retirement savings.",
  },

  // 🇮🇳 India
  IN: {
    income:
      "Your total annual income before tax, including salary, business, or rent.",
    deductions:
      "Section 80C, 80D, HRA, and other exemptions allowed under Indian tax law.",
  },

  // 🇺🇸 United States
  US: {
    income:
      "Gross yearly income before federal and state taxes — includes wages, tips, and bonuses.",
    deductions:
      "Standard or itemized deductions like 401(k), mortgage interest, and medical expenses.",
  },

  // 🇬🇧 United Kingdom
  UK: {
    income:
      "Total pre-tax income from salary, business, or savings interest.",
    deductions:
      "Personal allowance and pension contributions reduce taxable income.",
  },

  // 🇨🇦 Canada
  CA: {
    income: "Your total annual earnings before federal and provincial taxes.",
    deductions:
      "RRSP, tuition fees, and charitable donations can reduce taxable income.",
  },

  // 🇦🇺 Australia
  AU: {
    income:
      "Total yearly income before tax — includes salary, wages, and bonuses.",
    deductions:
      "Work-related expenses, charitable gifts, and superannuation contributions.",
  },

  // 🇩🇪 Germany
  DE: {
    income:
      "Your gross annual income including salary, bonuses, and allowances.",
    deductions:
      "Social security, health insurance, and pension contributions are deductible.",
  },

  // 🇫🇷 France
  FR: {
    income:
      "Annual pre-tax income, including wages and business earnings.",
    deductions:
      "Work expenses, charitable donations, and dependents’ allowances.",
  },

  // 🇯🇵 Japan
  JP: {
    income:
      "Your total yearly income before tax, including salary and bonuses.",
    deductions:
      "Employment income deduction, insurance premiums, and dependents’ relief.",
  },

  // 🇸🇬 Singapore
  SG: {
    income:
      "Your total income before tax, including salary, bonuses, and allowances.",
    deductions:
      "CPF contributions, donations, and other personal reliefs.",
  },

  // 🇧🇷 Brazil
  BR: {
    income:
      "Gross annual salary before income tax and social security contributions.",
    deductions:
      "Social contributions, education, and health expenses may reduce taxable income.",
  },

  // 🇳🇿 New Zealand
  NZ: {
    income: "Your total gross annual earnings from all sources.",
    deductions: "Limited personal deductions — mostly business-related expenses.",
  },

  // 🇿🇦 South Africa
  ZA: {
    income:
      "Your yearly income before PAYE and other taxes, including bonuses.",
    deductions:
      "Retirement annuity, medical aid, and charity donations.",
  },

  // 🇮🇹 Italy
  IT: {
    income:
      "Annual gross income including salary and other compensations.",
    deductions:
      "Family allowances, medical expenses, and mortgage interest deductions.",
  },

  // 🇪🇸 Spain
  ES: {
    income:
      "Total annual income before IRPF — includes salary, rent, or dividends.",
    deductions:
      "Social security, home rent, and family deductions.",
  },

  // 🇳🇱 Netherlands
  NL: {
    income:
      "Your total annual income before taxes under Box 1, 2, or 3.",
    deductions:
      "Mortgage interest, study costs, and charitable donations.",
  },

  // 🇸🇪 Sweden
  SE: {
    income:
      "Your gross yearly income before municipal and national taxes.",
    deductions:
      "Job-related expenses and pension contributions.",
  },

  // 🇳🇴 Norway
  NO: {
    income:
      "Your total annual salary before deductions or social contributions.",
    deductions:
      "Personal allowance, union dues, and pension contributions.",
  },

  // 🇨🇭 Switzerland
  CH: {
    income:
      "Total income before taxes and social contributions.",
    deductions:
      "Pension fund, insurance, and dependents deductions apply.",
  },

  // 🇮🇪 Ireland
  IE: {
    income:
      "Your total annual earnings before PAYE deductions.",
    deductions:
      "Pension, tuition, and health insurance are common deductions.",
  },

  // 🇦🇪 UAE
  AE: {
    income: "Total income before tax — note: UAE has no personal income tax.",
    deductions: "No personal income tax — deductions not applicable.",
  },

  // 🇸🇦 Saudi Arabia
  SA: {
    income: "Total income — Saudi Arabia does not levy personal income tax.",
    deductions: "No deductions applicable.",
  },

  // 🇹🇷 Turkey
  TR: {
    income: "Gross yearly income before Turkish income tax.",
    deductions:
      "Insurance premiums, education, and charitable donations may reduce tax.",
  },

  // 🇨🇳 China
  CN: {
    income:
      "Your total gross income before tax — includes wages, bonuses, and allowances.",
    deductions:
      "Standard deduction, housing fund, and education expenses apply.",
  },

  // 🇰🇷 South Korea
  KR: {
    income: "Annual pre-tax income including salary and bonuses.",
    deductions:
      "Pension, insurance premiums, and dependents’ deductions allowed.",
  },

  // 🇲🇾 Malaysia
  MY: {
    income:
      "Gross annual income before taxes and EPF contributions.",
    deductions:
      "Life insurance, EPF, medical expenses, and education reliefs.",
  },

  // 🇹🇭 Thailand
  TH: {
    income:
      "Your total annual income before tax — includes wages and bonuses.",
    deductions:
      "Standard deduction, donations, and social security contributions.",
  },

  // 🇦🇷 Argentina
  AR: {
    income:
      "Total annual earnings before income tax — includes salary, bonuses, and rent.",
    deductions:
      "Social security contributions, family allowances, and donations.",
  },

  // 🇳🇬 Nigeria
  NG: {
    income:
      "Your annual gross income from employment or business before tax.",
    deductions:
      "Pension, NHF, and life assurance premiums reduce taxable income.",
  },

  // 🇪🇬 Egypt
  EG: {
    income:
      "Your total income before taxes — includes wages, rent, or other sources.",
    deductions:
      "Social insurance contributions and family-related exemptions.",
  },

  // 🇮🇩 Indonesia
  ID: {
    income:
      "Total annual income before tax, including wages and bonuses.",
    deductions:
      "Pension contributions and family allowances apply.",
  },

  // 🇻🇳 Vietnam
  VN: {
    income:
      "Gross annual income before PIT — includes salary and allowances.",
    deductions:
      "Personal and dependent deductions under Vietnamese tax law.",
  },

  // 🇵🇱 Poland
  PL: {
    income:
      "Gross income before PIT — includes salary and other sources.",
    deductions:
      "Social security, health insurance, and standard allowance.",
  },

  // 🇫🇮 Finland
  FI: {
    income:
      "Total income before state and municipal tax.",
    deductions:
      "Work expenses and pension contributions reduce tax base.",
  },

  // 🇩🇰 Denmark
  DK: {
    income:
      "Your gross yearly income before labour market and municipal taxes.",
    deductions:
      "Job-related expenses, interest, and pension savings.",
  },

  // 🇨🇿 Czech Republic
  CZ: {
    income:
      "Your total annual salary before tax.",
    deductions:
      "Standard taxpayer and dependent deductions apply.",
  },

  // 🇵🇹 Portugal
  PT: {
    income:
      "Gross annual income before IRS tax.",
    deductions:
      "Health, education, and rent expenses reduce taxable income.",
  },

  // 🇬🇷 Greece
  GR: {
    income:
      "Your yearly income before tax, including wages or self-employment income.",
    deductions:
      "Health insurance, donations, and dependents deductions.",
  },

  // 🇭🇺 Hungary
  HU: {
    income:
      "Total income before flat income tax.",
    deductions: "Flat tax — minimal personal deductions allowed.",
  },

  // 🇲🇽 Mexico
  MX: {
    income:
      "Your total income before tax — includes salary and bonuses.",
    deductions:
      "Health, education, and mortgage interest reduce taxable income.",
  },

  // 🇨🇱 Chile
  CL: {
    income:
      "Total yearly income before taxes — includes wages and business income.",
    deductions:
      "Social contributions, donations, and dependents allowances.",
  },

  // 🇰🇪 Kenya
  KE: {
    income:
      "Your annual salary before PAYE tax and NHIF/NSSF deductions.",
    deductions:
      "Pension, health insurance, and personal reliefs reduce tax.",
  },

  // 🇧🇩 Bangladesh
  BD: {
    income:
      "Your total annual income before taxes — includes salary, rent, and business income.",
    deductions:
      "Allowable deductions like house rent, medical, and approved investments.",
  },

  // 🇵🇰 Pakistan
  PK: {
    income:
      "Gross yearly income before tax, including salary and business income.",
    deductions:
      "Zakat, investments, and donations reduce taxable income.",
  },

  // 🇱🇰 Sri Lanka
  LK: {
    income:
      "Your annual income before tax — includes salary and self-employment income.",
    deductions:
      "Relief for dependents, insurance, and charitable contributions.",
  },
};
