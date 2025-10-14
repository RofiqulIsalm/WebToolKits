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
    if (exchangeRates[fromCurrency] && exchangeRates[toCurrency]) {
      const rate = exchangeRates[toCurrency] / exchangeRates[fromCurrency];
      setResult(amount * rate);
    }
  }, [amount, fromCurrency, toCurrency, exchangeRates]);

  const [error, setError] = useState<string | null>(null);

  const fetchExchangeRates = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setExchangeRates({  USD: 1, EUR: 0.85, GBP: 0.73, JPY: 110, AUD: 1.35, CAD: 1.25, CHF: 0.92, 
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
        ZMW: 27, ZWL: 6.4 });
      } catch (error) {
        setError('⚠️ Failed to fetch live exchange rates. Using fallback values.');
        console.error('Fetch error:', error);
        setExchangeRates(fallbackRates); // Keep your fallback rates
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
        canonical="https://calculatorhub.site/currency-converter"
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
            {error && <p className="text-red-400 text-center mb-4">{error}</p>}
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
      <AdBanner type="bottom" />
        <div className="seo-content text-white space-y-6 mt-10">

        <h2 className="text-2xl font-bold">What is a Currency Converter?</h2>
       <p> A <strong>currency converter</strong> is a practical and widely used financial tool that allows individuals and businesses to quickly convert one type of currency into another. It works by applying the <strong>latest exchange rates</strong>, ensuring users always receive an accurate and up-to-date calculation. This tool has become an <strong>essential part of international trade, travel, and online transactions</strong>, as money is constantly being exchanged across borders in today’s global economy.
        
        For <strong>travelers</strong>, a currency converter is extremely useful when planning trips abroad. Before setting off, people can easily calculate how much their home currency will be worth in another country. For example, someone traveling from the United States to Europe can quickly check how many euros they will get for their U.S. dollars. This makes it easier to <strong>budget for expenses such as hotels, food, shopping, and transportation</strong>.
        
        <strong>Businesses and investors</strong> also benefit greatly from using currency converters. In international trade, companies often deal with multiple currencies, and small fluctuations in rates can significantly affect profits. A reliable converter helps them <strong>calculate costs, forecast revenues, and make smarter financial decisions</strong>. Likewise, investors trading in global stock markets, cryptocurrencies, or foreign exchange markets depend on accurate conversions to understand the true value of their assets.
        
        <strong>Online shoppers</strong> are another group that frequently uses this tool. Many e-commerce websites display prices in foreign currencies, and a converter allows customers to instantly check the <strong>cost in their local currency</strong>. This helps ensure that buyers know exactly how much they are spending before completing a purchase.
        
        In short, a <strong>currency converter saves time, reduces confusion, and provides financial clarity</strong>. Whether you are exchanging USD to EUR, GBP to INR, or JPY to AUD, this tool guarantees a <strong>transparent and instant result</strong>. It is not only convenient but also an <strong>essential guide for making smart financial choices</strong> in today’s interconnected world. 
       </p>
        <h2 className="text-2xl font-bold">How Does the Currency Converter Work?</h2>
        <p>
        A <strong>currency converter</strong> works on a simple yet powerful principle: it takes an amount of money in one currency and calculates its value in another using the <strong>latest exchange rate</strong>. This process ensures that the conversion is both <strong>accurate and instant</strong>, making it a reliable tool for travelers, businesses, and investors alike.
        </p>
        <p>
         The general formula used by most converters is:
        </p>
        <div className="bg-slate-800/60 p-4 rounded-lg">
          <code className="text-green-400">
            Converted Amount = Amount × (Target Currency Rate ÷ Base Currency Rate)
          </code>
        </div>
          <p>This formula means that the calculator first looks at the value of your base currency (the one you are converting from) and compares it with the value of the target currency (the one you are converting to). By applying the exchange rate between the two, it provides the converted result within seconds.</p>
        <p>
        If you want to convert <strong>100 USD to EUR</strong>, and the exchange rate is <strong>1 USD = 0.85 EUR</strong>, the calculation would look like this:
        </p>
          <div className="bg-slate-800/60 p-4 rounded-lg">
          <code className="italic text-yellow-300">
            100 × 0.85 = 85 EUR
          </code>
        </div>
          <p>This shows that your <strong>100 U.S</strong>. dollars are equal to <strong>85 euros</strong> at the current rate.</p>

          <AdBanner type="bottom" />
      
        <h2 className="text-2xl font-bold">Why Should You Use an Online Currency Calculator?</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>✔ It helps <strong>travelers</strong> know exactly how much money they will get when exchanging cash abroad.</li>
          <li>✔ It allows <strong>businesses and investors</strong> to make informed financial decisions when dealing with foreign markets.</li>
          <li>✔ Supports more than <strong>150+ world currencies</strong></li>
          <li>✔ It supports <strong>online shoppers</strong> in checking the actual cost of products listed in different currencies.</li>
          <li>✔ Saves time by avoiding manual calculation mistakes</li>
        </ul>

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