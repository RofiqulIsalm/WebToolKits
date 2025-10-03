import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, RefreshCw } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';



const CurrencyConverter: React.FC = () => {
  const [amount, setAmount] = useState<number>(1);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [result, setResult] = useState<number>(0);
  const [exchangeRates, setExchangeRates] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');

  const allCurrencies = [
   // Filtered options based on search
const filteredFrom = allCurrencies.filter((currency) =>
  currency.toLowerCase().includes(fromSearch.toLowerCase())
);

const filteredTo = allCurrencies.filter((currency) =>
  currency.toLowerCase().includes(toSearch.toLowerCase())
);


  ];


  useEffect(() => {
    fetchExchangeRates();
  }, []);

  useEffect(() => {
    if (exchangeRates[fromCurrency] && exchangeRates[toCurrency]) {
      const rate = exchangeRates[toCurrency] / exchangeRates[fromCurrency];
      setResult(amount * rate);
    }
  }, [amount, fromCurrency, toCurrency, exchangeRates]);

  const fetchExchangeRates = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      setExchangeRates({ USD: 1, ...data.rates });
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      // Fallback rates for demo purposes
      setExchangeRates({
        USD: 1, EUR: 0.85, GBP: 0.73, JPY: 110, AUD: 1.35, CAD: 1.25, CHF: 0.92, 
        CNY: 6.45, INR: 74.5, KRW: 1180, AED: 3.67, AFN: 70, ALL: 92, AMD: 385,
        ANG: 1.79, AOA: 827, ARS: 350, AWG: 1.8, AZN: 1.7, BAM: 1.66, BBD: 2,
        BDT: 110, BGN: 1.66, BHD: 0.38, BIF: 2850, BMD: 1, BND: 1.35, BOB: 6.9,
        BRL: 5.2, BSD: 1, BTN: 83, BWP: 13.5, BYN: 3.3, BZD: 2, CDF: 2700,
        CLP: 950, COP: 4300, CRC: 520, CUP: 24, CVE: 93.5, CZK: 22, DJF: 178,
        DKK: 6.3, DOP: 58, DZD: 135, EGP: 49, ERN: 15, ETB: 120, FJD: 2.2,
        FKP: 0.73, GEL: 2.7, GGP: 0.73, GHS: 15, GIP: 0.73, GMD: 67, GNF: 8600,
        GTQ: 7.8, GYD: 209, HKD: 7.8, HNL: 25, HRK: 6.4, HTG: 132, HUF: 350,
        IDR: 15800, ILS: 3.7, IMP: 0.73, IQD: 1310, IRR: 42000, ISK: 138,
        JEP: 0.73, JMD: 155, JOD: 0.71, KES: 129, KGS: 89, KHR: 4100, KMF: 417,
        KPW: 900, KWD: 0.31, KYD: 0.83, KZT: 450, LAK: 21000, LBP: 89500,
        LKR: 300, LRD: 190, LSL: 18, LYD: 4.8, MAD: 9.8, MDL: 17.8, MGA: 4500,
        MKD: 52, MMK: 2100, MNT: 3450, MOP: 8, MRU: 40, MUR: 46, MVR: 15.4,
        MWK: 1700, MXN: 17, MYR: 4.5, MZN: 64, NAD: 18, NGN: 1550, NIO: 37,
        NOK: 11, NPR: 133, NZD: 1.6, OMR: 0.38, PAB: 1, PEN: 3.7, PGK: 3.9,
        PHP: 58, PKR: 280, PLN: 3.9, PYG: 7300, QAR: 3.64, RON: 4.5, RSD: 99,
        RUB: 95, RWF: 1300, SAR: 3.75, SBD: 8.5, SCR: 13.6, SDG: 601, SEK: 10.4,
        SGD: 1.35, SHP: 0.73, SLE: 22.5, SOS: 571, SRD: 38, SSP: 130, STN: 22,
        SYP: 13000, SZL: 18, THB: 34, TJS: 10.9, TMT: 3.5, TND: 3.1, TOP: 2.3,
        TRY: 30, TTD: 6.8, TVD: 1.5, TWD: 32, TZS: 2500, UAH: 41, UGX: 3700,
        UYU: 43, UZS: 12800, VED: 36, VES: 36, VND: 24500, VUV: 119, WST: 2.7,
        XAF: 590, XCD: 2.7, XDR: 0.75, XOF: 590, XPF: 107, YER: 250, ZAR: 18,
        ZMW: 27, ZWL: 6.4
      });
    } finally {
      setLoading(false);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <>
      <SEOHead
        title={seoData.currencyConverter.title}
        description={seoData.currencyConverter.description}
        canonical="https://calculatorhub.com/currency-converter"
        schemaData={generateCalculatorSchema(
          "Currency Converter",
          seoData.currencyConverter.description,
          "/currency-converter",
          seoData.currencyConverter.keywords
        )}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Currency Converter', url: '/currency-converter' }
        ]}
      />
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Currency Converter', url: '/currency-converter' }
        ]} />
        
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Currency Converter</h1>
        <p className="text-slate-300">Convert between different currencies with live exchange rates</p>
      </div>

      <div className="glow-card rounded-lg p-6 mb-8">
        <div className="currency-card rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">From</label>
              <div className="space-y-3">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter amount"
                />
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full px-4 py-2 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {allCurrencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">To</label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={result.toFixed(2)}
                  readOnly
                  className="w-full px-4 py-2 glow-input rounded-lg bg-slate-800/50"
                />
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full px-4 py-2 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {allCurrencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <button
              onClick={swapCurrencies}
              className="flex items-center space-x-2 px-4 py-2 glow-button text-white rounded-lg transition-all"
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span>Swap</span>
            </button>
          </div>

          {exchangeRates[fromCurrency] && exchangeRates[toCurrency] && (
            <div className="result-green rounded-lg p-4 text-center">
              <p className="text-lg font-semibold text-white">
                {amount} {fromCurrency} = {result.toFixed(2)} {toCurrency}
              </p>
              <p className="text-sm text-slate-300 mt-1">
                1 {fromCurrency} = {(exchangeRates[toCurrency] / exchangeRates[fromCurrency]).toFixed(4)} {toCurrency}
              </p>
            </div>
          )}

          <div className="flex justify-center mt-4">
            <button
              onClick={fetchExchangeRates}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Rates</span>
            </button>
          </div>
        </div>
      </div>

      
      
      <RelatedCalculators 
        currentPath="/currency-converter"   
        category="currency-finance" 
      />
      </div>
    </>
  );  
};

export default CurrencyConverter;