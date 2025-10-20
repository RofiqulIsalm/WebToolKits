import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, RefreshCw } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';
import { fallbackRates } from '../utils/fallbackRates';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

const CurrencyConverter: React.FC = () => {
  const [amount, setAmount] = useState<number>(1);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [result, setResult] = useState<number>(0);
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [chartData, setChartData] = useState<{ date: string; rate: number }[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  const allCurrencies = React.useMemo(
    () => [
      { code: 'USD', name: 'US Dollar' },
      { code: 'EUR', name: 'Euro' },
      { code: 'GBP', name: 'British Pound Sterling' },
      { code: 'INR', name: 'Indian Rupee' },
      { code: 'JPY', name: 'Japanese Yen' },
      { code: 'AUD', name: 'Australian Dollar' },
      { code: 'CAD', name: 'Canadian Dollar' },
      { code: 'CNY', name: 'Chinese Yuan' },
      { code: 'CHF', name: 'Swiss Franc' },
      { code: 'SGD', name: 'Singapore Dollar' }
    ],
    []
  );

  const fetchExchangeRates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      setExchangeRates({ USD: 1, ...data.rates });
      setLastUpdated(new Date().toLocaleString());
    } catch {
      setError('⚠️ Failed to fetch live exchange rates. Using fallback values.');
      setExchangeRates(fallbackRates);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalRates = async (base: string, target: string) => {
    setChartLoading(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const start = new Date();
      start.setDate(start.getDate() - 30);
      const startDate = start.toISOString().split('T')[0];

      const response = await fetch(
        `https://api.exchangerate.host/timeseries?start_date=${startDate}&end_date=${endDate}&base=${base}&symbols=${target}`
      );
      const data = await response.json();

      if (data.rates && Object.keys(data.rates).length > 0) {
        const formatted = Object.entries(data.rates)
          .map(([date, value]: [string, any]) => ({
            date,
            rate: value[target]
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setChartData(formatted);
      } else {
        setChartData([]);
      }
    } catch (err) {
      console.error('Error fetching historical data:', err);
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  useEffect(() => {
    if (exchangeRates[fromCurrency] && exchangeRates[toCurrency]) {
      const rate = exchangeRates[toCurrency] / exchangeRates[fromCurrency];
      setResult(amount * rate);
    }
  }, [amount, fromCurrency, toCurrency, exchangeRates]);

  useEffect(() => {
    fetchHistoricalRates(fromCurrency, toCurrency);
  }, [fromCurrency, toCurrency]);

  const swapCurrencies = React.useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }, [fromCurrency, toCurrency]);

  return (
    <>
      <SEOHead
        title={seoData.currencyConverter.title}
        description={seoData.currencyConverter.description}
        keywords={seoData.currencyConverter.keywords}
        canonical="https://calculatorhub.site/currency-converter"
        schemaData={generateCalculatorSchema(
          'Currency Converter',
          seoData.currencyConverter.description,
          '/currency-converter',
          seoData.currencyConverter.keywords
        )}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'Currency Converter', url: '/currency-converter' }
          ]}
        />

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
                  id="amountInput"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full px-4 py-2 glow-input rounded-lg"
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
                  className="w-full px-4 py-2 glow-input rounded-lg"
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

          {error && <p className="text-red-400 text-center mb-4">{error}</p>}

          <div className="flex justify-center mb-6">
            <button
              onClick={swapCurrencies}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 glow-button text-white rounded-lg"
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

          {lastUpdated && (
            <p className="text-center text-xs text-slate-400 mt-2">Last updated: {lastUpdated}</p>
          )}
        </div>

        <AdBanner type="bottom" />

        <div className="mt-8 bg-slate-800/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">30-Day Exchange Rate Trend</h3>
          {chartLoading ? (
            <p className="text-slate-400 text-center animate-pulse">Loading chart...</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: any) => value.toFixed(4)}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <RelatedCalculators currentPath="/currency-converter" category="currency-finance" />
      </div>
    </>
  );
};

export default CurrencyConverter;
