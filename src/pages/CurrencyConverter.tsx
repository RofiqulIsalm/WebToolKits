import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, RefreshCw } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const CurrencyConverter: React.FC = () => {
  const [amount, setAmount] = useState(1);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [result, setResult] = useState<number | null>(null);
  const [rates, setRates] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // New search states
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');

  const allCurrencies = rates ? Object.keys(rates) : [];

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.exchangerate.host/latest?base=USD');
      const data = await response.json();
      setRates(data.rates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const convert = () => {
    if (rates && rates[toCurrency] && rates[fromCurrency]) {
      const usdAmount = amount / rates[fromCurrency];
      const converted = usdAmount * rates[toCurrency];
      setResult(converted);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
  };

  // Filtered dropdowns
  const filteredFrom = allCurrencies.filter((c) =>
    c.toLowerCase().includes(fromSearch.toLowerCase())
  );
  const filteredTo = allCurrencies.filter((c) =>
    c.toLowerCase().includes(toSearch.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6 text-white">
      <SEOHead
        title={seoData.currencyConverter.title}
        description={seoData.currencyConverter.description}
        keywords={seoData.currencyConverter.keywords}
        schema={generateCalculatorSchema('Currency Converter')}
      />

      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Currency & Finance', href: '/currency-finance' },
          { label: 'Currency Converter', href: '/currency-finance/currency-converter' },
        ]}
      />

      <h1 className="text-4xl font-bold mb-4 text-center">Currency Converter</h1>
      <AdBanner type="top" />

      <div className="bg-gray-900 rounded-lg shadow-lg p-6 mb-6">
        <div className="mb-4">
          <label className="block mb-2">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full px-3 py-2 glow-input rounded-lg"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          {/* From Currency */}
          <div>
            <label className="block mb-2">From</label>
            <input
              type="text"
              value={fromSearch}
              onChange={(e) => setFromSearch(e.target.value)}
              placeholder="Search currency..."
              className="w-full px-3 py-2 mb-2 glow-input rounded-lg"
            />
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full px-3 py-2 glow-input rounded-lg"
            >
              {filteredFrom.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>

          {/* To Currency */}
          <div>
            <label className="block mb-2">To</label>
            <input
              type="text"
              value={toSearch}
              onChange={(e) => setToSearch(e.target.value)}
              placeholder="Search currency..."
              className="w-full px-3 py-2 mb-2 glow-input rounded-lg"
            />
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full px-3 py-2 glow-input rounded-lg"
            >
              {filteredTo.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-center my-4">
          <button
            onClick={swapCurrencies}
            className="flex items-center px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition"
          >
            <ArrowRightLeft className="mr-2" /> Swap
          </button>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={convert}
            className="flex items-center px-6 py-3 bg-green-500 text-black rounded-lg hover:bg-green-600 transition"
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="animate-spin mr-2" />
            ) : (
              'Convert'
            )}
          </button>
        </div>

        {result !== null && (
          <div className="mt-6 text-center text-xl font-semibold">
            {amount} {fromCurrency} = {result.toFixed(2)} {toCurrency}
          </div>
        )}
      </div>

      <AdBanner type="bottom" />
      <RelatedCalculators category="currency-finance" />
    </div>
  );
};

export default CurrencyConverter;
