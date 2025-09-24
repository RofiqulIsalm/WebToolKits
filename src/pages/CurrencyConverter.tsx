import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import AdBanner from '../components/AdBanner';

const CurrencyConverter: React.FC = () => {
  const [amount, setAmount] = useState<number>(1);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [exchangeRate, setExchangeRate] = useState<number>(0.85);
  const [convertedAmount, setConvertedAmount] = useState<number>(0);

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' }
  ];

  useEffect(() => {
    // Simulate exchange rate fetching with mock data
    const mockRates: {[key: string]: number} = {
      'USD-EUR': 0.85, 'EUR-USD': 1.18,
      'USD-GBP': 0.73, 'GBP-USD': 1.37,
      'USD-JPY': 110, 'JPY-USD': 0.009,
      'USD-INR': 74.5, 'INR-USD': 0.013,
      'EUR-GBP': 0.86, 'GBP-EUR': 1.16,
      'EUR-JPY': 129, 'JPY-EUR': 0.008
    };

    const rateKey = `${fromCurrency}-${toCurrency}`;
    const rate = mockRates[rateKey] || 1;
    setExchangeRate(rate);
    setConvertedAmount(amount * rate);
  }, [amount, fromCurrency, toCurrency]);

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Currency Converter</h1>
        <p className="text-gray-600">Convert between different world currencies with live exchange rates</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="Enter amount"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={swapCurrencies}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Swap Currencies
          </button>
        </div>

        <div className="mt-8 p-6 bg-green-50 rounded-lg text-center">
          <DollarSign className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {currencies.find(c => c.code === toCurrency)?.symbol}{convertedAmount.toFixed(2)}
          </div>
          <div className="text-gray-600">
            {amount} {fromCurrency} = {convertedAmount.toFixed(2)} {toCurrency}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Exchange Rate: 1 {fromCurrency} = {exchangeRate} {toCurrency}
          </div>
        </div>
      </div>

      <AdBanner type="bottom" />

      {/* SEO Content Section */}
      <div className="mt-12 space-y-8">
        <div className="finance-card rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Currency Converter Guide</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 mb-4">
              Convert between world currencies with our comprehensive currency converter. Whether you're 
              traveling, shopping internationally, or conducting business across borders, our tool provides 
              accurate exchange rates for major world currencies including USD, EUR, GBP, JPY, and more.
            </p>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-4">Popular Currency Pairs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="font-semibold text-white mb-2">USD/EUR</div>
                <div className="text-slate-300 text-sm">US Dollar to Euro</div>
                <div className="text-xs text-slate-400 mt-1">Most traded currency pair</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="font-semibold text-white mb-2">GBP/USD</div>
                <div className="text-slate-300 text-sm">British Pound to US Dollar</div>
                <div className="text-xs text-slate-400 mt-1">Cable pair</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="font-semibold text-white mb-2">USD/JPY</div>
                <div className="text-slate-300 text-sm">US Dollar to Japanese Yen</div>
                <div className="text-xs text-slate-400 mt-1">Major Asian pair</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="font-semibold text-white mb-2">USD/INR</div>
                <div className="text-slate-300 text-sm">US Dollar to Indian Rupee</div>
                <div className="text-xs text-slate-400 mt-1">Emerging market pair</div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mt-6 mb-4">Exchange Rate Factors</h3>
            <ul className="text-slate-300 space-y-2 mb-6">
              <li>• <strong>Economic Indicators:</strong> GDP, inflation, employment rates</li>
              <li>• <strong>Central Bank Policies:</strong> Interest rates and monetary policy</li>
              <li>• <strong>Political Stability:</strong> Government policies and elections</li>
              <li>• <strong>Trade Balance:</strong> Import/export ratios between countries</li>
              <li>• <strong>Market Sentiment:</strong> Investor confidence and risk appetite</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-4">Currency Converter Tips</h3>
            <ul className="text-slate-300 space-y-2">
              <li>• Check rates from multiple sources for accuracy</li>
              <li>• Consider bank fees and exchange margins</li>
              <li>• Monitor rates for better conversion timing</li>
              <li>• Use limit orders for large conversions</li>
              <li>• Understand the difference between buy and sell rates</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;