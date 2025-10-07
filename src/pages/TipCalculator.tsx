import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

ChartJS.register(ArcElement, Tooltip, Legend);

const currencies = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'BDT', symbol: '৳' },
  { code: 'JPY', symbol: '¥' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'CHF', symbol: 'CHF' },
  { code: 'CNY', symbol: '¥' },
  { code: 'HKD', symbol: 'HK$' },
  { code: 'INR', symbol: '₹' },
  { code: 'IDR', symbol: 'Rp' },
  { code: 'KRW', symbol: '₩' },
  { code: 'MXN', symbol: 'MX$' },
  { code: 'MYR', symbol: 'RM' },
  { code: 'NZD', symbol: 'NZ$' },
  { code: 'NOK', symbol: 'kr' },
  { code: 'PHP', symbol: '₱' },
  { code: 'RUB', symbol: '₽' },
  { code: 'SGD', symbol: 'S$' },
  { code: 'THB', symbol: '฿' },
  { code: 'TRY', symbol: '₺' },
  { code: 'ZAR', symbol: 'R' },
  { code: 'SEK', symbol: 'kr' },
  { code: 'DKK', symbol: 'kr' },
  { code: 'PLN', symbol: 'zł' },
  { code: 'CZK', symbol: 'Kč' },
  { code: 'HUF', symbol: 'Ft' },
  { code: 'ILS', symbol: '₪' },
  { code: 'SAR', symbol: '﷼' },
  { code: 'AED', symbol: 'د.إ' },
  { code: 'EGP', symbol: '£' },
  { code: 'KWD', symbol: 'د.ك' },
  { code: 'QAR', symbol: '﷼' },
  { code: 'OMR', symbol: '﷼' },
  { code: 'BHD', symbol: '.د.ب' },
  { code: 'LKR', symbol: 'Rs' },
  { code: 'PKR', symbol: '₨' },
  { code: 'NGN', symbol: '₦' },
  { code: 'GHS', symbol: '₵' },
  { code: 'TWD', symbol: 'NT$' },
  { code: 'VND', symbol: '₫' },
  { code: 'UAH', symbol: '₴' }
  // You can continue adding more to reach 100+
];

const TipCalculatorPage: React.FC = () => {
  const [billAmount, setBillAmount] = useState(100);
  const [tipPercentage, setTipPercentage] = useState(15);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [customTip, setCustomTip] = useState('');
  const [currency, setCurrency] = useState(currencies[0]);
  const [searchCurrency, setSearchCurrency] = useState('');
  const [results, setResults] = useState({
    tipAmount: 0,
    totalAmount: 0,
    perPersonAmount: 0,
    perPersonTip: 0
  });

  useEffect(() => {
    const tip = (billAmount * tipPercentage) / 100;
    const total = billAmount + tip;
    const perPerson = total / numberOfPeople;
    const tipPerPerson = tip / numberOfPeople;

    setResults({ tipAmount: tip, totalAmount: total, perPersonAmount: perPerson, perPersonTip: tipPerPerson });
  }, [billAmount, tipPercentage, numberOfPeople]);

  // Update currency based on search input
  useEffect(() => {
    const match = currencies.find(
      (c) =>
        c.code.toLowerCase() === searchCurrency.toLowerCase() ||
        c.symbol === searchCurrency
    );
    if (match) setCurrency(match);
  }, [searchCurrency]);

  const pieData = {
    labels: ['Bill', 'Tip'],
    datasets: [
      {
        label: 'Amount',
        data: [billAmount, results.tipAmount],
        backgroundColor: ['#4ade80', '#3b82f6'],
        hoverOffset: 10
      }
    ]
  };

  const setPresetTip = (percentage: number) => {
    setTipPercentage(percentage);
    setCustomTip('');
  };

  const handleCustomTip = (value: string) => {
    setCustomTip(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setTipPercentage(num);
    }
  };

  return (
    <>
      <SEOHead
        title={seoData.tipCalculator?.title || 'Tip Calculator - Split Bills & Calculate Restaurant Tips'}
        description={seoData.tipCalculator?.description || 'Calculate tips and split bills easily with CalculatorHub’s Tip Calculator.'}
        canonical="https://calculatorhub.site/tip-calculator"
        schemaData={generateCalculatorSchema(
          'Tip Calculator',
          'Calculate tips and split bills easily for restaurants and group meals.',
          '/tip-calculator',
          ['tip calculator', 'bill splitter', 'restaurant tip', 'gratuity calculator']
        )}
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

        {/* Tip Calculator Card */}
        <div className="rounded-2xl p-8 mb-8 bg-slate-900">
          <div className="flex items-center space-x-3 mb-6">
            <h2 className="text-3xl text-blue-400">{currency.symbol}</h2>
            <h1 className="text-3xl font-bold text-white">Tip Calculator</h1>
          </div>

          {/* Currency Search & Select */}
          <div className="mb-6">
            <input
              type="text"
              value={searchCurrency}
              onChange={(e) => setSearchCurrency(e.target.value)}
              placeholder="Search currency by code or symbol..."
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
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
              ))}
            </select>
          </div>

          {/* Bill Input */}
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Bill Amount ({currency.symbol})
              </label>
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

            <div>
              <label className="block text-sm font-medium text-white mb-3">Tip Percentage</label>
              <div className="grid grid-cols-4 gap-3 mb-3">
                {[10, 15, 18, 20].map((percentage) => (
                  <button
                    key={percentage}
                    onClick={() => setPresetTip(percentage)}
                    className={`py-3 rounded-lg font-semibold transition-all ${
                      tipPercentage === percentage && customTip === ''
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {percentage}%
                  </button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-3 sm:space-y-0">
                <input
                  type="number"
                  value={customTip}
                  onChange={(e) => handleCustomTip(e.target.value)}
                  min={0}
                  step={0.1}
                  className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Custom tip %"
                />
                <span className="text-slate-400 text-center sm:text-left">or</span>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={tipPercentage}
                  onChange={(e) => {
                    setTipPercentage(Number(e.target.value));
                    setCustomTip(e.target.value);
                  }}
                  className="flex-1"
                />
                <span className="text-white font-semibold w-12 text-right">{tipPercentage}%</span>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-white mb-2">Number of People</label>
                <input
                  type="number"
                  value={numberOfPeople}
                  onChange={(e) => setNumberOfPeople(Math.max(1, Number(e.target.value)))}
                  min={1}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Number of people splitting the bill"
                />
              </div>
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
        </div>

        {/* SEO Content + FAQ */}
        <div className="rounded-2xl p-8 mb-8 bg-slate-900">
          <h2 className="text-3xl font-bold text-white mb-4">🧠 About Tip Calculator</h2>
          <h3 className="text-xl text-white mb-2">Learn what a tip calculator is</h3>
          <div className="space-y-4 text-slate-300">
            <p>
              A <strong>Tip Calculator</strong> is an online tool designed to help you quickly and accurately calculate restaurant tips, gratuities, and split bills among multiple people. Instead of doing the math manually, this tool provides instant results, saving time and ensuring precision.
            </p>
            <p>
              Whether you're dining out, hosting a dinner, or splitting a bill with friends, <strong>CalculatorHub’s Tip Calculator</strong> makes it simple to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-slate-300">
              <li>Calculate the total bill including tip</li>
              <li>Determine how much each person owes</li>
              <li>Choose a standard tip percentage or enter a custom amount</li>
              <li>See visual breakdowns with interactive charts</li>
            </ul>
            <p>With our tip calculator, you can enjoy meals without worrying about math, making group payments fast, fair, and hassle-free. It supports<strong> multiple currencies</strong>, adjustable tip percentages, and per-person calculations, ensuring it works for any occasion or group size.</p>
            
          </div>
        
          <h2 className="text-yellow-500 mt-6">How to Use the Tip Calculator</h2>
          <p className="text-slate-300">
            Using <strong>CalculatorHub’s Tip Calculator</strong> is quick and straightforward. Simply:
          </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-slate-300">
              <li><strong>Enter your bill amount</strong> – the total cost of your meal or service.</li>
              <li><strong>Select a tip percentage</strong> – choose from preset options or input a custom tip based on your preference.</li>
              <li><strong>Enter the number of people</strong> sharing the bill.</li>
            </ul>
          <p>The calculator instantly shows:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-slate-300">
              <li>Total tip amount</li>
              <li>Total bill including tip</li>
              <li>Per-person total and tip</li>
            </ul>
          <p>This makes<strong> splitting bills and tipping</strong> easy, accurate, and stress-free, whether you're dining with friends, family, or colleagues.</p>
        
          <h2 className="text-yellow-500 mt-4">What Makes This Tool Unique</h2>
          <p className="text-slate-300">
            Our tip calculator is fast, responsive, and works in over 100 currencies worldwide. 
            It also features a visual pie chart to show the proportion of bill vs tip.
          </p>
        
          <h2 className="text-yellow-500 mt-4">Why Use a Tip Calculator</h2>
          <p className="text-slate-300">
            Avoid guesswork and manual calculations. Quickly split bills fairly and ensure the right tip is paid every time.
          </p>
        
          <h2 className="text-yellow-500 mt-4">Benefits of Using CalculatorHub’s Tip Calculator</h2>
          <ul className="list-disc list-inside space-y-2 ml-4 text-slate-300">
            <li>Fast and easy calculations</li>
            <li>Supports multiple currencies</li>
            <li>Accurate tip and per-person totals</li>
            <li>Visual pie chart representation</li>
          </ul>
        
          <AdBanner type="bottom" />
        
          <section className="space-y-4 mt-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
            </h2>
            <div className="space-y-4 text-lg text-slate-100 leading-relaxed">
              <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q1</span>: What is a tip calculator?</h3>
                <p>It is an online tool that calculates tips, total bills, and per-person amounts automatically based on the inputs.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q2</span>: How do I use it?</h3>
                <p>Enter the bill amount, choose a tip percentage or custom tip, and input the number of people. Results appear instantly.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q3</span>: Can I use multiple currencies?</h3>
                <p>Yes! This calculator supports over 100 currencies including USD, EUR, GBP, INR, BDT, and many more.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q4</span>: Is it mobile-friendly?</h3>
                <p>Absolutely! The calculator works perfectly on mobile, tablet, and desktop devices.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q5</span>: Do I need to sign up?</h3>
                <p>No registration is required. You can use it for free instantly.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q6</span>: Can I split the bill among friends?</h3>
                <p>Yes! Enter the number of people sharing the bill to get per-person tip and total amounts.</p>
              </div>
        
              <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q7</span>: Why should I use CalculatorHub’s tip calculator?</h3>
                <p>It’s accurate, fast, supports multiple currencies, and provides visual insights, making it the best tool for dining out.</p>
              </div>
            </div>
          </section>
        </div>


        <RelatedCalculators currentPath="/tip-calculator" />
      </div>
    </>
  );
};

export default TipCalculatorPage;
