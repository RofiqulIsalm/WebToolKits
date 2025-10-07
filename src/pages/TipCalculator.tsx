import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

ChartJS.register(ArcElement, Tooltip, Legend);

// Top 100+ currencies
const currencies = [
  { code: 'USD', symbol: '$' }, { code: 'EUR', symbol: '€' }, { code: 'GBP', symbol: '£' },
  { code: 'BDT', symbol: '৳' }, { code: 'JPY', symbol: '¥' }, { code: 'AUD', symbol: 'A$' },
  { code: 'CAD', symbol: 'C$' }, { code: 'CHF', symbol: 'CHF' }, { code: 'CNY', symbol: '¥' },
  { code: 'HKD', symbol: 'HK$' }, { code: 'INR', symbol: '₹' }, { code: 'IDR', symbol: 'Rp' },
  { code: 'KRW', symbol: '₩' }, { code: 'MXN', symbol: 'MX$' }, { code: 'MYR', symbol: 'RM' },
  { code: 'NZD', symbol: 'NZ$' }, { code: 'NOK', symbol: 'kr' }, { code: 'PHP', symbol: '₱' },
  { code: 'RUB', symbol: '₽' }, { code: 'SGD', symbol: 'S$' }, { code: 'THB', symbol: '฿' },
  { code: 'TRY', symbol: '₺' }, { code: 'ZAR', symbol: 'R' }, { code: 'SEK', symbol: 'kr' },
  { code: 'DKK', symbol: 'kr' }, { code: 'PLN', symbol: 'zł' }, { code: 'CZK', symbol: 'Kč' },
  { code: 'HUF', symbol: 'Ft' }, { code: 'ILS', symbol: '₪' }, { code: 'SAR', symbol: '﷼' },
  { code: 'AED', symbol: 'د.إ' }, { code: 'EGP', symbol: '£' }, { code: 'KWD', symbol: 'د.ك' },
  { code: 'QAR', symbol: '﷼' }, { code: 'OMR', symbol: '﷼' }, { code: 'BHD', symbol: '.د.ب' },
  { code: 'LKR', symbol: 'Rs' }, { code: 'PKR', symbol: '₨' }, { code: 'NGN', symbol: '₦' },
  { code: 'GHS', symbol: '₵' }, { code: 'TWD', symbol: 'NT$' }, { code: 'VND', symbol: '₫' },
  { code: 'UAH', symbol: '₴' }, { code: 'CLP', symbol: '$' }, { code: 'COP', symbol: '$' },
  { code: 'PEN', symbol: 'S/.' }, { code: 'ARS', symbol: '$' }, { code: 'BRL', symbol: 'R$' },
  { code: 'UYU', symbol: '$U' }, { code: 'BOB', symbol: 'Bs.' }, { code: 'PYG', symbol: '₲' },
  { code: 'DOP', symbol: 'RD$' }, { code: 'CRC', symbol: '₡' }, { code: 'NIO', symbol: 'C$' },
  { code: 'GTQ', symbol: 'Q' }, { code: 'HNL', symbol: 'L' }, { code: 'BZD', symbol: 'BZ$' },
  { code: 'JMD', symbol: 'J$' }, { code: 'TTD', symbol: 'TT$' }, { code: 'XCD', symbol: '$' },
  { code: 'FJD', symbol: 'FJ$' }, { code: 'PGK', symbol: 'K' }, { code: 'SHP', symbol: '£' },
  { code: 'LSL', symbol: 'L' }, { code: 'SZL', symbol: 'L' }, { code: 'MUR', symbol: '₨' },
  { code: 'SCR', symbol: '₨' }, { code: 'MAD', symbol: 'د.م.' }, { code: 'DZD', symbol: 'د.ج' },
  { code: 'TND', symbol: 'د.ت' }, { code: 'LYD', symbol: 'ل.د' }, { code: 'SDG', symbol: '£' },
  { code: 'ETB', symbol: 'Br' }, { code: 'GEL', symbol: '₾' }, { code: 'KZT', symbol: '₸' },
  { code: 'UZS', symbol: 'soʻm' }, { code: 'AZN', symbol: '₼' }, { code: 'BYN', symbol: 'Br' },
  { code: 'MDL', symbol: 'L' }, { code: 'MKD', symbol: 'ден' }, { code: 'ALL', symbol: 'L' },
  { code: 'BAM', symbol: 'KM' }, { code: 'HRK', symbol: 'kn' }, { code: 'RON', symbol: 'lei' },
  { code: 'ISK', symbol: 'kr' }, { code: 'BGN', symbol: 'лв' }, { code: 'SLL', symbol: 'Le' },
  { code: 'MZN', symbol: 'MT' }, { code: 'ZMW', symbol: 'ZK' }, { code: 'BWP', symbol: 'P' },
  { code: 'AOA', symbol: 'Kz' }, { code: 'CDF', symbol: 'FC' }, { code: 'GMD', symbol: 'D' },
  { code: 'LRD', symbol: '$' }, { code: 'MWK', symbol: 'MK' }, { code: 'XOF', symbol: 'Fr' },
  { code: 'XAF', symbol: 'Fr' }, { code: 'XPF', symbol: 'Fr' }
];

const TipCalculator: React.FC = () => {
  const [billAmount, setBillAmount] = useState<number>(100);
  const [tipPercentage, setTipPercentage] = useState<number>(15);
  const [numberOfPeople, setNumberOfPeople] = useState<number>(1);
  const [customTip, setCustomTip] = useState<string>('');
  const [currency, setCurrency] = useState(currencies[0]);
  const [searchCurrency, setSearchCurrency] = useState('');

  const [results, setResults] = useState({
    tipAmount: 0,
    totalAmount: 0,
    perPersonAmount: 0,
    perPersonTip: 0
  });

 useEffect(() => {
    // Calculate tip amounts
    const tip = (billAmount * tipPercentage) / 100;
    const total = billAmount + tip;
    const perPerson = total / numberOfPeople;
    const tipPerPerson = tip / numberOfPeople;
  
    // Update results
    setResults({
      tipAmount: tip,
      totalAmount: total,
      perPersonAmount: perPerson,
      perPersonTip: tipPerPerson,
    });
  
    // Auto-select currency if searchCurrency matches code or symbol
    if (searchCurrency) {
      const match = currencies.find(
        (c) =>
          c.code.toLowerCase() === searchCurrency.toLowerCase() ||
          c.symbol === searchCurrency
      );
  
      if (match) {
        setCurrency(match); // <-- This was missing
      }
    }
  }, [billAmount, tipPercentage, numberOfPeople, searchCurrency]);


  //end
  const setPresetTip = (percentage: number) => {
    setTipPercentage(percentage);
    setCustomTip('');
  };

  const handleCustomTip = (value: string) => {
    setCustomTip(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) setTipPercentage(num);
  };

  const filteredCurrencies = currencies.filter(
    (c) => c.code.toLowerCase().includes(searchCurrency.toLowerCase()) || c.symbol.includes(searchCurrency)
  );

  const pieData = {
    labels: ['Bill', 'Tip'],
    datasets: [{ label: 'Amount', data: [billAmount, results.tipAmount], backgroundColor: ['#4ade80', '#3b82f6'], hoverOffset: 10 }]
  };

  return (
    <>
      <SEOHead
        title={seoData.tipCalculator?.title || 'Tip Calculator'}
        description={seoData.tipCalculator?.description || 'Calculate tips and split bills easily.'}
        canonical="https://calculatorhub.site/tip-calculator"
        schemaData={generateCalculatorSchema('Tip Calculator', 'Calculate tips and split bills', '/tip-calculator', ['tip calculator'])}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Tip Calculator', url: '/tip-calculator' }
        ]}
      />
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Tip Calculator', url: '/tip-calculator' }
        ]} />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <DollarSign className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Tip Calculator</h1>
          </div>

          {/* Currency Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">Select Currency</label>
            <input
              type="text"
              value={searchCurrency}
              onChange={(e) => setSearchCurrency(e.target.value)}
              placeholder="Search currency..."
              className="w-full px-4 py-3 mb-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={currency.code}
              onChange={(e) => {
                const selected = currencies.find(c => c.code === e.target.value);
                if (selected) setCurrency(selected);
              }}
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filteredCurrencies.map((c) => (
                <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
              ))}
            </select>
          </div>

          {/* Bill Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">Bill Amount ({currency.symbol})</label>
            <input
              type="number"
              value={billAmount}
              onChange={(e) => setBillAmount(Number(e.target.value))}
              min={0}
              step={0.01}
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              placeholder="Enter bill amount"
            />
          </div>

          {/* Tip Percentage */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-3">Tip Percentage</label>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {[10, 15, 18, 20].map((p) => (
                <button
                  key={p}
                  onClick={() => setPresetTip(p)}
                  className={`py-3 rounded-lg font-semibold transition-all ${tipPercentage === p && customTip === '' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                  {p}%
                </button>
              ))}
            </div>
            <input
              type="number"
              value={customTip}
              onChange={(e) => handleCustomTip(e.target.value)}
              min={0}
              step={0.1}
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Custom tip %"
            />
          </div>

          {/* Number of People */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">Number of People</label>
            <input
              type="number"
              value={numberOfPeople}
              onChange={(e) => setNumberOfPeople(Math.max(1, Number(e.target.value)))}
              min={1}
              className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-6 bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl border border-blue-500/30">
              <p className="text-sm text-slate-400 mb-1">Tip Amount</p>
              <p className="text-4xl font-bold text-white">{currency.symbol}{results.tipAmount.toFixed(2)}</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl border border-green-500/30">
              <p className="text-sm text-slate-400 mb-1">Total Amount</p>
              <p className="text-4xl font-bold text-white">{currency.symbol}{results.totalAmount.toFixed(2)}</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl border border-purple-500/30">
              <p className="text-sm text-slate-400 mb-1">Per Person Total</p>
              <p className="text-4xl font-bold text-white">{currency.symbol}{results.perPersonAmount.toFixed(2)}</p>
            </div>
            <div className="p-6 bg-gradient-to-br from-orange-900/30 to-orange-800/30 rounded-xl border border-orange-500/30">
              <p className="text-sm text-slate-400 mb-1">Per Person Tip</p>
              <p className="text-4xl font-bold text-white">{currency.symbol}{results.perPersonTip.toFixed(2)}</p>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-slate-800 p-6 rounded-xl mb-6">
            <h3 className="text-white font-semibold mb-4">Bill vs Tip</h3>
            <Pie data={pieData} />
          </div>
        </div>

        <AdBanner />
        <RelatedCalculators currentPath="/tip-calculator" />
      </div>
    </>
  );
};

export default TipCalculator;
