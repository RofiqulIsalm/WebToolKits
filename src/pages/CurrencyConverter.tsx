import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, RefreshCw } from 'lucide-react';
import AdBanner from '../components/AdBanner';

const CurrencyConverter: React.FC = () => {
  const [amount, setAmount] = useState<number>(1);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [result, setResult] = useState<number>(0);
  const [exchangeRates, setExchangeRates] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState<boolean>(false);

  const popularCurrencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'KRW', name: 'South Korean Won' }
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
        USD: 1, EUR: 0.85, GBP: 0.73, JPY: 110, AUD: 1.35,
        CAD: 1.25, CHF: 0.92, CNY: 6.45, INR: 74.5, KRW: 1180
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Currency Converter</h1>
        <p className="text-slate-300">Convert between different currencies with live exchange rates</p>
      </div>

      <div className="glow-card rounded-lg p-6 mb-8">
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
                {popularCurrencies.map((currency) => (
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
                {popularCurrencies.map((currency) => (
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
          <div className="result-glow rounded-lg p-4 text-center">
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

      <AdBanner type="bottom" />
    </div>
  );
};

export default CurrencyConverter;