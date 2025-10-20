import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, RefreshCw } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';
import { fallbackRates } from '../utils/fallbackRates';


 
const CurrencyConverter: React.FC = () => {
  const [amount, setAmount] = useState<number>(1);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [result, setResult] = useState<number>(0);
  const [exchangeRates, setExchangeRates] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState<boolean>(false);


  const allCurrencies = React.useMemo(() => [
    { code: 'AED', name: 'UAE Dirham' },
    { code: 'AFN', name: 'Afghan Afghani' },
    { code: 'ALL', name: 'Albanian Lek' },
    { code: 'AMD', name: 'Armenian Dram' },
    { code: 'ANG', name: 'Netherlands Antillean Guilder' },
    { code: 'AOA', name: 'Angolan Kwanza' },
    { code: 'ARS', name: 'Argentine Peso' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'AWG', name: 'Aruban Florin' },
    { code: 'AZN', name: 'Azerbaijani Manat' },
    { code: 'BAM', name: 'Bosnia-Herzegovina Convertible Mark' },
    { code: 'BBD', name: 'Barbadian Dollar' },
    { code: 'BDT', name: 'Bangladeshi Taka' },
    { code: 'BGN', name: 'Bulgarian Lev' },
    { code: 'BHD', name: 'Bahraini Dinar' },
    { code: 'BIF', name: 'Burundian Franc' },
    { code: 'BMD', name: 'Bermudan Dollar' },
    { code: 'BND', name: 'Brunei Dollar' },
    { code: 'BOB', name: 'Bolivian Boliviano' },
    { code: 'BRL', name: 'Brazilian Real' },
    { code: 'BSD', name: 'Bahamian Dollar' }, 
    { code: 'BTN', name: 'Bhutanese Ngultrum' },
    { code: 'BWP', name: 'Botswanan Pula' },
    { code: 'BYN', name: 'Belarusian Ruble' },
    { code: 'BZD', name: 'Belize Dollar' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'CDF', name: 'Congolese Franc' },
    { code: 'CHF', name: 'Swiss Franc' },
    { code: 'CLP', name: 'Chilean Peso' },
    { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'COP', name: 'Colombian Peso' },
    { code: 'CRC', name: 'Costa Rican Colón' },
    { code: 'CUP', name: 'Cuban Peso' },
    { code: 'CVE', name: 'Cape Verdean Escudo' },
    { code: 'CZK', name: 'Czech Republic Koruna' },
    { code: 'DJF', name: 'Djiboutian Franc' },
    { code: 'DKK', name: 'Danish Krone' },
    { code: 'DOP', name: 'Dominican Peso' },
    { code: 'DZD', name: 'Algerian Dinar' },
    { code: 'EGP', name: 'Egyptian Pound' },
    { code: 'ERN', name: 'Eritrean Nakfa' },
    { code: 'ETB', name: 'Ethiopian Birr' },
    { code: 'EUR', name: 'Euro' },
    { code: 'FJD', name: 'Fijian Dollar' },
    { code: 'FKP', name: 'Falkland Islands Pound' },
    { code: 'GBP', name: 'British Pound Sterling' },
    { code: 'GEL', name: 'Georgian Lari' },
    { code: 'GGP', name: 'Guernsey Pound' },
    { code: 'GHS', name: 'Ghanaian Cedi' },
    { code: 'GIP', name: 'Gibraltar Pound' },
    { code: 'GMD', name: 'Gambian Dalasi' },
    { code: 'GNF', name: 'Guinean Franc' },
    { code: 'GTQ', name: 'Guatemalan Quetzal' },
    { code: 'GYD', name: 'Guyanaese Dollar' },
    { code: 'HKD', name: 'Hong Kong Dollar' },
    { code: 'HNL', name: 'Honduran Lempira' },
    { code: 'HRK', name: 'Croatian Kuna' },
    { code: 'HTG', name: 'Haitian Gourde' },
    { code: 'HUF', name: 'Hungarian Forint' },
    { code: 'IDR', name: 'Indonesian Rupiah' },
    { code: 'ILS', name: 'Israeli New Sheqel' },
    { code: 'IMP', name: 'Manx pound' },
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'IQD', name: 'Iraqi Dinar' },
    { code: 'IRR', name: 'Iranian Rial' },
    { code: 'ISK', name: 'Icelandic Króna' },
    { code: 'JEP', name: 'Jersey Pound' },
    { code: 'JMD', name: 'Jamaican Dollar' },
    { code: 'JOD', name: 'Jordanian Dinar' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'KES', name: 'Kenyan Shilling' },
    { code: 'KGS', name: 'Kyrgystani Som' },
    { code: 'KHR', name: 'Cambodian Riel' },
    { code: 'KMF', name: 'Comorian Franc' },
    { code: 'KPW', name: 'North Korean Won' },
    { code: 'KRW', name: 'South Korean Won' },
    { code: 'KWD', name: 'Kuwaiti Dinar' },
    { code: 'KYD', name: 'Cayman Islands Dollar' },
    { code: 'KZT', name: 'Kazakhstani Tenge' },
    { code: 'LAK', name: 'Laotian Kip' },
    { code: 'LBP', name: 'Lebanese Pound' },
    { code: 'LKR', name: 'Sri Lankan Rupee' },
    { code: 'LRD', name: 'Liberian Dollar' },
    { code: 'LSL', name: 'Lesotho Loti' },
    { code: 'LYD', name: 'Libyan Dinar' },
    { code: 'MAD', name: 'Moroccan Dirham' },
    { code: 'MDL', name: 'Moldovan Leu' },
    { code: 'MGA', name: 'Malagasy Ariary' },
    { code: 'MKD', name: 'Macedonian Denar' },
    { code: 'MMK', name: 'Myanma Kyat' },
    { code: 'MNT', name: 'Mongolian Tugrik' },
    { code: 'MOP', name: 'Macanese Pataca' },
    { code: 'MRU', name: 'Mauritanian Ouguiya' },
    { code: 'MUR', name: 'Mauritian Rupee' },
    { code: 'MVR', name: 'Maldivian Rufiyaa' },
    { code: 'MWK', name: 'Malawian Kwacha' },
    { code: 'MXN', name: 'Mexican Peso' },
    { code: 'MYR', name: 'Malaysian Ringgit' },
    { code: 'MZN', name: 'Mozambican Metical' },
    { code: 'NAD', name: 'Namibian Dollar' },
    { code: 'NGN', name: 'Nigerian Naira' },
    { code: 'NIO', name: 'Nicaraguan Córdoba' },
    { code: 'NOK', name: 'Norwegian Krone' },
    { code: 'NPR', name: 'Nepalese Rupee' },
    { code: 'NZD', name: 'New Zealand Dollar' },
    { code: 'OMR', name: 'Omani Rial' },
    { code: 'PAB', name: 'Panamanian Balboa' },
    { code: 'PEN', name: 'Peruvian Nuevo Sol' },
    { code: 'PGK', name: 'Papua New Guinean Kina' },
    { code: 'PHP', name: 'Philippine Peso' },
    { code: 'PKR', name: 'Pakistani Rupee' },
    { code: 'PLN', name: 'Polish Zloty' },
    { code: 'PYG', name: 'Paraguayan Guarani' },
    { code: 'QAR', name: 'Qatari Rial' },
    { code: 'RON', name: 'Romanian Leu' },
    { code: 'RSD', name: 'Serbian Dinar' },
    { code: 'RUB', name: 'Russian Ruble' },
    { code: 'RWF', name: 'Rwandan Franc' },
    { code: 'SAR', name: 'Saudi Riyal' },
    { code: 'SBD', name: 'Solomon Islands Dollar' },
    { code: 'SCR', name: 'Seychellois Rupee' },
    { code: 'SDG', name: 'Sudanese Pound' },
    { code: 'SEK', name: 'Swedish Krona' },
    { code: 'SGD', name: 'Singapore Dollar' },
    { code: 'SHP', name: 'Saint Helena Pound' },
    { code: 'SLE', name: 'Sierra Leonean Leone' },
    { code: 'SOS', name: 'Somali Shilling' },
    { code: 'SRD', name: 'Surinamese Dollar' },
    { code: 'SSP', name: 'South Sudanese Pound' },
    { code: 'STN', name: 'São Tomé and Príncipe Dobra' },
    { code: 'SYP', name: 'Syrian Pound' },
    { code: 'SZL', name: 'Swazi Lilangeni' },
    { code: 'THB', name: 'Thai Baht' },
    { code: 'TJS', name: 'Tajikistani Somoni' },
    { code: 'TMT', name: 'Turkmenistani Manat' },
    { code: 'TND', name: 'Tunisian Dinar' },
    { code: 'TOP', name: 'Tongan Paʻanga' },
    { code: 'TRY', name: 'Turkish Lira' },
    { code: 'TTD', name: 'Trinidad and Tobago Dollar' },
    { code: 'TVD', name: 'Tuvaluan Dollar' },
    { code: 'TWD', name: 'New Taiwan Dollar' },
    { code: 'TZS', name: 'Tanzanian Shilling' },
    { code: 'UAH', name: 'Ukrainian Hryvnia' },
    { code: 'UGX', name: 'Ugandan Shilling' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'UYU', name: 'Uruguayan Peso' },
    { code: 'UZS', name: 'Uzbekistan Som' },
    { code: 'VED', name: 'Venezuelan Bolívar Soberano' },
    { code: 'VES', name: 'Venezuelan Bolívar' },
    { code: 'VND', name: 'Vietnamese Dong' },
    { code: 'VUV', name: 'Vanuatu Vatu' },
    { code: 'WST', name: 'Samoan Tala' },
    { code: 'XAF', name: 'CFA Franc BEAC' },
    { code: 'XCD', name: 'East Caribbean Dollar' },
    { code: 'XDR', name: 'Special Drawing Rights' },
    { code: 'XOF', name: 'CFA Franc BCEAO' },
    { code: 'XPF', name: 'CFP Franc' },
    { code: 'YER', name: 'Yemeni Rial' },
    { code: 'ZAR', name: 'South African Rand' },
    { code: 'ZMW', name: 'Zambian Kwacha' },
    { code: 'ZWL', name: 'Zimbabwean Dollar' }

], []);


  useEffect(() => {
    fetchExchangeRates();
  }, []);

  useEffect(() => {
  document.getElementById("amountInput")?.focus();
}, []);

  
  useEffect(() => {
    if (exchangeRates[fromCurrency] && exchangeRates[toCurrency]) {
      const rate = exchangeRates[toCurrency] / exchangeRates[fromCurrency];
      setResult(amount * rate);
    }
  }, [amount, fromCurrency, toCurrency, exchangeRates]);

  const [error, setError] = useState<string | null>(null);

 

  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

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

  const rate = React.useMemo(() => {
    if (exchangeRates[fromCurrency] && exchangeRates[toCurrency]) {
      return exchangeRates[toCurrency] / exchangeRates[fromCurrency];
    }
    return 0;
  }, [exchangeRates, fromCurrency, toCurrency]);
  
  

  const swapCurrencies = React.useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }, [fromCurrency, toCurrency]);


  return (
    <>
       <SEOHead
          title={seoData.currencyConverter.title}
          description={seoData.currencyConverter.description}
          keywords={seoData.currencyConverter.keywords} // ✅ Add this line if not already supported
          canonical="https://calculatorhub.site/currency-converter"
          schemaData={generateCalculatorSchema(
            "Currency Converter",
            seoData.currencyConverter.description,
            "/currency-converter",
            seoData.currencyConverter.keywords
          )}
        />
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Currency Converter', url: '/currency-converter' }
        ]} />
        
     {/* Header Section */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-3 drop-shadow-lg">
          Currency Converter
        </h1>
        <p className="text-slate-300 text-base">
          Convert between world currencies instantly with live exchange rates 🌍
        </p>
      </div>
      
      {/* Converter Card */}
      <div className="rounded-2xl bg-slate-800/60 backdrop-blur-md border border-slate-700 p-6 mb-10 shadow-lg hover:shadow-blue-500/10 transition-all">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          
          {/* From Section */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-300 mb-2">From</label>
            <div className="relative">
              <input
                id="amountInput"
                type="number"
                value={amount}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 0) setAmount(value);
                }}
                className="w-full px-4 py-3 bg-slate-900/70 text-white rounded-xl border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter amount"
              />
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full mt-3 px-4 py-3 bg-slate-900/70 text-white rounded-xl border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {allCurrencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} — {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
      
          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={swapCurrencies}
              disabled={loading}
              className={`flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-md hover:shadow-blue-400/40 transition-transform hover:rotate-180 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <ArrowRightLeft className="h-5 w-5" />
            </button>
          </div>
      
          {/* To Section */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-300 mb-2">To</label>
            <div className="relative">
              <input
                type="text"
                value={result.toFixed(2)}
                readOnly
                className="w-full px-4 py-3 bg-slate-900/70 text-white rounded-xl border border-slate-700"
              />
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full mt-3 px-4 py-3 bg-slate-900/70 text-white rounded-xl border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {allCurrencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} — {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      
        {/* Error or Loading Messages */}
        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
        {loading && <p className="text-center text-slate-300 mt-4 animate-pulse">Fetching latest rates...</p>}
      
        {/* Conversion Result */}
        {exchangeRates[fromCurrency] && exchangeRates[toCurrency] && (
          <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-4 mt-6 text-center transition-transform hover:scale-[1.02]" aria-live="polite">
            <p className="text-xl font-semibold text-white">
              {amount} {fromCurrency} = <span className="text-cyan-400">{result.toFixed(2)}</span> {toCurrency}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              1 {fromCurrency} = {(exchangeRates[toCurrency] / exchangeRates[fromCurrency]).toFixed(4)} {toCurrency}
            </p>
          </div>
        )}
      
        {/* Refresh Button & Timestamp */}
        <div className="flex flex-col items-center mt-6 space-y-2">
          <button
            onClick={fetchExchangeRates}
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-2 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Rates</span>
          </button>
          {lastUpdated && (
            <p className="text-xs text-slate-500">Last updated: {lastUpdated}</p>
          )}
        </div>
      </div>

        
      <AdBanner type="bottom" />
        <div className="seo-content text-white space-y-6 mt-10">

        <h2 className="text-2xl font-bold">Understanding Currency Converters: How They Work and Why You Need One</h2>
          
        <h2 className="text-2xl font-bold">What is a Currency Converter?</h2>
          <p>A <strong>currency converter </strong>is a practical online tool that allows people to quickly and accurately convert one currency into another. It works using <strong>live exchange rates</strong>, ensuring that the value you see reflects the most current market prices. Whether you are a traveler planning a trip abroad, an investor managing international assets, or a business owner trading across borders, a <strong>real time currency converter</strong> simplifies the process of currency exchange.</p>
          <p>In essence, a <strong>money converter</strong> or <strong>foreign exchange calculator </strong>saves time and reduces uncertainty by giving users instant access to the value of their money in another currency. For instance, a person who wants to<strong> convert dollars</strong> to euros or check the<strong> currency conversion rates today</strong> can simply enter the amount and select the desired currencies to get an immediate result.</p>
          <p>Over the years, the best <strong>currency converter</strong> tools have evolved into feature-rich platforms that can handle multiple currencies, historical exchange rates, and automatic rate updates. Whether it’s a<strong> travel currency converter</strong> or an <strong>international currency converter</strong>, users can depend on these tools to stay financially prepared wherever they go.</p>
          
         
        <h2 className="text-2xl font-bold">How Does the Currency Converter Work?</h2>
        <p>
      A <strong>currency converter</strong> operates by pulling<strong> real-time exchange data </strong>from global financial markets. These rates fluctuate constantly due to economic indicators, inflation, and geopolitical factors that influence the strength of different currencies. The system updates every few seconds, ensuring accuracy when you use a <strong>real time currency converter </strong>or <strong>exchange rate calculator</strong>.
        </p>  
        <p>
         When a user inputs an amount—say, converting 100 USD to EUR—the <strong>online currency calculator</strong> fetches the<strong> live exchange rate</strong> for USD to EUR and instantly performs the calculation. The formula is straightforward:
        </p>
        <div className="bg-slate-800/60 p-4 rounded-lg">
          <code className="text-green-400">
            Converted Amount = Amount × Current Exchange Rate
          </code>
        </div>
          
          <p>For example, if the <strong>currency conversion rate today</strong> shows that 1 USD equals 0.92 EUR, the converter will display €92 for $100.</p>
          
          <div className="bg-slate-800/60 p-4 rounded-lg">
            <code className="italic text-yellow-300">
              100 × 0.85 = 85 EUR
            </code>
          </div>
        <p>
       Some advanced tools, like a <strong>multi currency converter</strong>, allow users to track several currencies at once, making it ideal for businesses or travelers managing multiple accounts. Other tools offer <strong>historical exchange rates</strong>, enabling investors and analysts to study market trends over time.
        </p>
        
      
          <p>However, it’s important to note that the rates shown on a converter might differ slightly from what banks or credit card companies offer due to <strong>currency conversion fees</strong> or additional service charges. Understanding this small difference can help users avoid unexpected costs when exchanging money in real transactions.</p>

          <AdBanner type="bottom" />
      
        <h2 className="text-2xl font-bold">Why Should You Use an Online Currency Calculator?</h2>
          <p>
            There are countless reasons why people rely on a <strong>currency calculator online</strong>, especially in an increasingly connected global economy. Here are a few major benefits:
          </p>

          <ol>
            <li>
                <strong>Instant Conversions Anytime, Anywhere</strong>
                <p>
                An online currency converter works 24/7, allowing users to check live exchange rates from their phones or laptops. This convenience makes it a must-have for travelers, digital nomads, and remote professionals who deal with international payments.
                </p>
              </li>
              <li>
                <strong>Accurate and Real-Time Data</strong>
                <p>
                Modern real time currency converters ensure that the displayed rates reflect current market values. Whether you’re using an accurate currency converter for business planning or checking prices on e-commerce platforms, these tools eliminate the guesswork.
                </p>
              </li>
              <li>
                <strong>Smarter Financial Decisions</strong>
                <p>
                For investors and business owners, understanding the latest currency conversion rates today can be the difference between profit and loss. A reliable foreign exchange calculator helps you forecast expenses, compare options, and plan international transactions more effectively.
                </p>
              </li>
              <li>
                <strong>Transparent and Easy-to-Use</strong>
                <p>
                Unlike banks, which might charge hidden fees, a moneyconverter tool offers clarity. You can see the conversion instantly and understand how much you’ll actually get before making a transaction. Many currency converter apps even integrate with payment platforms or travel booking sites for seamless use.
                </p>
              </li>
            </ol>

          <p>In practice, most modern converters use <strong>real-time exchange rates</strong> provided by financial institutions, banks, or forex markets. This means the results update automatically whenever the rates change, keeping the information as accurate as possible.

In short, the logic may be simple, but the impact is powerful: a <strong>currency converter saves time, reduces risk, and ensures financial clarity</strong> for anyone dealing with multiple currencies.</p>
          
        <h2 className="text-2xl font-bold">Popular Currency Conversions</h2>
        <p>
          Here are some of the most searched conversions worldwide:
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 list-disc list-inside">
          <li>USD to EUR – United States Dollar to Euro</li>
          <li>USD to INR – United States Dollar to Indian Rupee</li>
          <li>GBP to USD – British Pound Sterling to US Dollar</li>
          <li>EUR to JPY – Euro to Japanese Yen</li>
          <li>CAD to AUD – Canadian Dollar to Australian Dollar</li>
          <li>AED to BDT – Dirham to Bangladeshi Taka</li>
        </ul>
         <p className="mt-6 text-slate-300">
            You may also like our 
            <a href="/loan-affordability-calculator" className="text-blue-400 hover:underline"> Loan Affordability Calculator</a>, 
            <a href="/roi-calculator" className="text-blue-400 hover:underline"> ROI Calculator</a>, 
            or 
            <a href="/profit-margin-calculator" className="text-blue-400 hover:underline"> Profit Margin Calculator</a>.
          </p>

      
          <AdBanner type="bottom" />
      
        <h2 className="text-2xl font-bold">Image Suggestions</h2>
        <ul className="list-disc list-inside">
          <li>A world map with currency symbols ($, €, ¥, £)</li>
          <li>A digital forex trading chart with real-time exchange rates</li>
          <li>A traveler exchanging money at an airport</li>
        </ul>
      
        <p className="text-slate-300 mt-4">
          This <strong>currency converter calculator</strong> is designed to make your life easier, 
          whether you’re shopping online internationally, planning a trip abroad, or trading in 
          foreign exchange markets. With accurate rates and an easy-to-use interface, you’ll always 
          stay updated on global money values.
        </p>
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