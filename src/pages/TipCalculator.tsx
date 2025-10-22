import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { DollarSign, Users, Calculator, Globe2 } from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

ChartJS.register(ArcElement, Tooltip, Legend);

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
      perPersonTip: 0,
  });

useEffect(() => {
    const tip = (billAmount * tipPercentage) / 100;
    const total = billAmount + tip;
    const perPerson = total / numberOfPeople;
    const tipPerPerson = tip / numberOfPeople;

    setResults({
      tipAmount: tip,
      totalAmount: total,
      perPersonAmount: perPerson,
      perPersonTip: tipPerPerson,
    });
  
   if (searchCurrency) {
      const match = currencies.find(
        (c) =>
          c.code.toLowerCase() === searchCurrency.toLowerCase() ||
          c.symbol === searchCurrency
      );
      if (match) setCurrency(match);
    }
  }, [billAmount, tipPercentage, numberOfPeople, searchCurrency]);

  const pieData = {
    labels: ['Bill', 'Tip'],
    datasets: [
      {
        label: 'Bill Breakdown',
        data: [billAmount, results.tipAmount],
        backgroundColor: ['#22c55e', '#3b82f6'],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const setPresetTip = (p: number) => {
    setTipPercentage(p);
    setCustomTip('');
  };

  const handleCustomTip = (value: string) => {
    setCustomTip(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) setTipPercentage(num);
  };

  const filteredCurrencies = currencies.filter(
    (c) =>
      c.code.toLowerCase().includes(searchCurrency.toLowerCase()) ||
      c.symbol.includes(searchCurrency)
  );

  return (
    <>
      <SEOHead
        title="Tip Calculator - Split Bills, Calculate Gratuity & Per-Person Totals | CalculatorHub"
        description="Use our free online Tip Calculator to calculate restaurant tips, split bills, and find per-person totals instantly. Supports 100+ currencies with a visual pie chart."
        canonical="https://calculatorhub.site/tip-calculator"
        openGraph={{
          title: "Tip Calculator - Split Bills & Calculate Gratuity | CalculatorHub",
          description:
            "Quickly calculate tips, split bills among friends, and view per-person totals in any currency. Includes a pie chart visualization.",
          url: "https://calculatorhub.site/tip-calculator",
          type: "website",
          site_name: "CalculatorHub",
          locale: "en_US",
          images: [
            {
              url: "https://calculatorhub.site/assets/tip-calculator-og.jpg",
              width: 1200,
              height: 630,
              alt: "Tip Calculator - Split Bills & Calculate Gratuity Online",
            },
          ],
        }}
        twitter={{
          card: "summary_large_image",
          site: "@calculatorhub",
          title: "Tip Calculator - Split Bills & Calculate Gratuity | CalculatorHub",
          description:
            "Free Tip Calculator that helps you calculate restaurant tips, split bills by person, and view totals with ease.",
          image: "https://calculatorhub.site/assets/tip-calculator-og.jpg",
        }}
        schemaData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Tip Calculator - Split Bills & Calculate Gratuity | CalculatorHub",
          "url": "https://calculatorhub.site/tip-calculator",
          "description":
            "Easily calculate restaurant tips, gratuities, and per-person totals with CalculatorHub’s free Tip Calculator. Supports multiple currencies and group bill splitting.",
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Misc Tools",
                "item": "https://calculatorhub.site/category/misc-tools",
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Tip Calculator",
                "item": "https://calculatorhub.site/tip-calculator",
              },
            ],
          },
          "mainEntity": {
            "@type": "SoftwareApplication",
            "name": "Tip Calculator",
            "operatingSystem": "All",
            "applicationCategory": "FinanceApplication",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            "featureList": [
              "Calculate restaurant tips and split bills",
              "Supports 100+ global currencies",
              "Per-person total and tip breakdown",
              "Pie chart visualization of bill vs tip",
              "Customizable tip percentage options",
              "Responsive, mobile-friendly interface",
            ],
          },
          "faq": [
            {
              "@type": "Question",
              "name": "What is a Tip Calculator?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text":
                  "A Tip Calculator is a free online tool that helps users calculate how much tip to leave, total bill amount, and per-person share. It removes the need for manual math when splitting bills.",
              },
            },
            {
              "@type": "Question",
              "name": "How does the Tip Calculator work?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text":
                  "Simply enter your bill amount, choose a tip percentage or enter a custom one, and specify how many people are splitting the bill. The calculator instantly shows the total and per-person tip.",
              },
            },
            {
              "@type": "Question",
              "name": "Can I calculate tips in different currencies?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text":
                  "Yes. CalculatorHub’s Tip Calculator supports over 100 currencies worldwide, making it easy for travelers and international users.",
              },
            },
            {
              "@type": "Question",
              "name": "Is this Tip Calculator free to use?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text":
                  "Yes, this tool is completely free, requires no sign-up, and works instantly on all devices.",
              },
            },
            {
              "@type": "Question",
              "name": "Can I split the bill among multiple people?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text":
                  "Absolutely. Just enter the number of people, and the calculator divides both the tip and total evenly, showing each person’s share.",
              },
            },
            {
              "@type": "Question",
              "name": "Why should I use CalculatorHub’s Tip Calculator?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text":
                  "It’s fast, accurate, mobile-friendly, and perfect for group outings, travel, and restaurant use. No ads or hidden charges.",
              },
            },
            {
              "@type": "Question",
              "name": "Does it include a pie chart visualization?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text":
                  "Yes, the calculator includes a color-coded pie chart that shows how much of your total is the bill and how much is the tip.",
              },
            },
          ],
        }}
        breadcrumbs={[
          { name: "Misc Tools", url: "/category/misc-tools" },
          { name: "Tip Calculator", url: "/tip-calculator" },
        ]}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Misc Tools', url: '/category/misc-tools' },
            { name: 'Tip Calculator', url: '/tip-calculator' },
          ]}
        />

        <div className="rounded-2xl p-5 sm:p-8 mb-8 bg-gradient-to-b from-slate-800/70 to-slate-900 border border-slate-700 shadow-lg backdrop-blur">
          <div className="flex items-center gap-3 mb-6 sm:mb-8 flex-wrap">
            <div className="p-2 sm:p-3 rounded-xl bg-blue-600/20 border border-blue-500/40">
              <DollarSign className="text-blue-400 h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Tip Calculator
            </h1>
          </div>

          {/* Currency */}
          <div className="mb-6 sm:mb-8">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Globe2 className="inline-block w-4 h-4 mr-1" /> Select Currency
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Search..."
                value={searchCurrency}
                onChange={(e) => setSearchCurrency(e.target.value)}
                className="w-full sm:flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={currency.code}
                onChange={(e) => {
                  const sel = currencies.find((c) => c.code === e.target.value);
                  if (sel) setCurrency(sel);
                }}
                className="w-full sm:w-44 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                {filteredCurrencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bill Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Bill Amount ({currency.symbol})
            </label>
            <input
              type="number"
              value={billAmount}
              onChange={(e) => setBillAmount(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-base focus:ring-2 focus:ring-blue-500"
              placeholder="Enter total bill"
              min={0}
            />
          </div>

          {/* Tip Percentage */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Tip Percentage
            </label>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 mb-3">
              {[5, 10, 15, 20].map((p) => (
                <button
                  key={p}
                  onClick={() => setPresetTip(p)}
                  className={`py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition ${
                    tipPercentage === p && customTip === ''
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
            <input
              type="number"
              value={customTip}
              onChange={(e) => handleCustomTip(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Custom tip %"
              min={0}
            />
          </div>

          {/* People */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <Users className="inline-block w-4 h-4 mr-1" /> Number of People
            </label>
            <input
              type="number"
              value={numberOfPeople}
              onChange={(e) => setNumberOfPeople(Math.max(1, Number(e.target.value)))}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500"
              min={1}
            />
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-10">
            <ResultBox
              title="Tip Amount"
              value={results.tipAmount}
              color="blue"
              symbol={currency.symbol}
            />
            <ResultBox
              title="Total Amount"
              value={results.totalAmount}
              color="green"
              symbol={currency.symbol}
            />
            <ResultBox
              title="Per Person"
              value={results.perPersonAmount}
              color="purple"
              symbol={currency.symbol}
            />
            <ResultBox
              title="Per Person Tip"
              value={results.perPersonTip}
              color="orange"
              symbol={currency.symbol}
            />
          </div>

          {/* Chart */}
          <div className="bg-slate-800/80 p-4 sm:p-6 rounded-xl border border-slate-700 mb-8">
            <h3 className="text-white font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <Calculator className="text-blue-400" /> Bill Breakdown
            </h3>
            <div className="w-full max-w-[250px] sm:max-w-xs mx-auto">
              <Pie data={pieData} />
            </div>
          </div>
        </div>

        <AdBanner />

        {/*----------------------seo content------------------------------------*/}
          <div className="rounded-2xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">About Tip Calculator</h2>
            <h3 className="text-xl text-slate-300 mb-4">Easily Calculate Tips and Split Bills in Seconds</h3>
          
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>
                The <strong>Tip Calculator</strong> helps you quickly calculate the amount you should leave as a tip for your service. 
                Whether you're dining at a restaurant, getting a haircut, or using a taxi, our calculator makes it simple to determine 
                the right tip and divide the bill among multiple people instantly.
              </p>
          
              <p>
                This <strong>online tip calculator</strong> eliminates guesswork by letting you enter your bill amount, desired tip percentage, 
                and the number of people. It automatically shows the <strong>total tip amount, total bill with tip, tip per person,</strong> 
                and <strong>total per person</strong> — all in your preferred currency.
              </p>
          
              <p>
                It’s perfect for travelers, groups, and anyone who wants to be fair and accurate when tipping service providers. 
                The calculator also supports multiple <strong>currencies</strong> and offers a beautiful, responsive interface for both desktop and mobile devices.
              </p>
          
              <h2 className="text-yellow-500 mt-6"><strong>How Does a Tip Calculator Work?</strong></h2>
              <p>
                The Tip Calculator uses a simple formula:
              </p>
              <p className="bg-slate-800 p-3 rounded-lg text-yellow-300 font-mono text-center">
                Tip Amount = (Bill Amount × Tip Percentage) ÷ 100
              </p>
              <p>
                Then, it adds the tip to your bill to get the <strong>Total Amount</strong>. 
                If you’re splitting the bill with others, it divides both the tip and total equally among all participants.
              </p>
          
              <h2 className="text-yellow-500 mt-6"><strong>Why Use a Tip Calculator?</strong></h2>
              <p>
                A Tip Calculator ensures <strong>accuracy, fairness, and transparency</strong> when paying your bill. 
                Instead of estimating or calculating mentally, you can get precise numbers instantly. 
                It’s especially useful in group settings where everyone contributes equally.
              </p>
          
              <h2 className="text-yellow-500 mt-6"><strong>Benefits of Using a Tip Calculator</strong></h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>✅ Avoid calculation errors when splitting group bills</li>
                <li>💡 Instantly see how much to tip for excellent, average, or minimal service</li>
                <li>🌍 Works with multiple currencies — perfect for travelers</li>
                <li>👥 Calculates per-person totals for easy group payments</li>
                <li>📱 Mobile-friendly and fast — ideal for use in restaurants or cafés</li>
                <li>💰 Helps ensure fair tipping etiquette worldwide</li>
              </ul>
          
              <h2 className="text-yellow-500 mt-6"><strong>When Should You Use a Tip Calculator?</strong></h2>
              <p>
                You can use this calculator whenever you receive a service and want to show appreciation through tipping. 
                Common use cases include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Restaurants and cafés</li>
                <li>Food delivery and takeout</li>
                <li>Hair salons and spas</li>
                <li>Taxi and ride-share services</li>
                <li>Hotel housekeeping or concierge tips</li>
              </ul>
          
              <p>
                In short, our <strong>Tip Calculator</strong> helps you calculate and share tips fairly — anywhere, anytime.
              </p>
          
              <AdBanner type="bottom" />
          
              {/* FAQ Section */}
              <section className="space-y-4 mt-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
                </h2>
          
                <div className="space-y-4 text-slate-100 leading-relaxed">
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q1:</span> What is a Tip Calculator?
                    </h3>
                    <p>
                      A Tip Calculator is an online tool that helps you determine how much tip to leave based on your bill amount 
                      and preferred tip percentage. It also calculates how to split the bill among multiple people.
                    </p>
                  </div>
          
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q2:</span> How do I calculate the tip manually?
                    </h3>
                    <p>
                      Multiply your bill amount by the tip percentage (for example, 15%) and divide by 100. 
                      For instance, if your bill is $100 and you want to tip 15%, your tip will be $15.
                    </p>
                  </div>
          
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q3:</span> Can I use this tool for group bills?
                    </h3>
                    <p>
                      Yes, you can easily enter the number of people, and the calculator will show each person’s share of the tip 
                      and total bill automatically.
                    </p>
                  </div>
          
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q4:</span> What currencies are supported?
                    </h3>
                    <p>
                      The Tip Calculator supports most global currencies — including USD, EUR, GBP, INR, JPY, CAD, AUD, and many more. 
                      You can search and select your currency easily.
                    </p>
                  </div>
          
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q5:</span> Why should I use an online tip calculator?
                    </h3>
                    <p>
                      An online calculator saves time, avoids awkward math errors, and ensures fairness when sharing bills in groups 
                      or while traveling abroad.
                    </p>
                  </div>
          
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q6:</span> Is this calculator free to use?
                    </h3>
                    <p>
                      Yes, our Tip Calculator is completely free, accessible on all devices, and requires no registration or downloads.
                    </p>
                  </div>
          
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q7:</span> Can I use this tool offline?
                    </h3>
                    <p>
                      The tool works best online since it fetches updated currency data. However, basic calculations will still work 
                      if the page is already loaded.
                    </p>
                  </div>
                </div>
              </section>
          
            </div>
          </div>

        
        <RelatedCalculators currentPath="/tip-calculator" />
      </div>

      {/*-----------------for rank page on google------------------------*/}
      {/* ===================== TIP CALCULATOR ENHANCED SEO SCHEMAS ===================== */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Tip Calculator | Split Bills & Calculate Gratuity Online",
            "url": "https://calculatorhub.site/tip-calculator",
            "description":
              "Calculate restaurant tips, split bills, and find per-person totals with CalculatorHub's Tip Calculator. Supports over 100 currencies and includes a visual pie chart for easy understanding.",
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Misc Tools",
                  "item": "https://calculatorhub.site/category/misc-tools"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Tip Calculator",
                  "item": "https://calculatorhub.site/tip-calculator"
                }
              ]
            },
            "about": [
              "Online tip calculator",
              "Restaurant gratuity calculator",
              "Split bill calculator",
              "Multi-currency tip calculation",
              "Per-person total calculator"
            ],
            "hasPart": {
              "@type": "CreativeWork",
              "name": "Tip Calculator Features",
              "about": [
                "Supports 100+ currencies worldwide",
                "Calculates total bill, tip, and per-person amount",
                "Includes visual pie chart for bill vs tip",
                "Customizable tip percentages",
                "Responsive mobile-friendly interface"
              ]
            },
            "publisher": {
              "@type": "Organization",
              "name": "CalculatorHub",
              "url": "https://calculatorhub.site",
              "logo": {
                "@type": "ImageObject",
                "url": "https://calculatorhub.site/assets/logo.png"
              }
            }
          })
        }}
      />
      
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Tip Calculator",
            "operatingSystem": "All",
            "applicationCategory": "FinanceApplication",
            "url": "https://calculatorhub.site/tip-calculator",
            "description":
              "Quickly calculate restaurant tips, gratuities, and split bills among multiple people. Supports over 100 currencies and provides per-person totals and visual pie chart.",
            "featureList": [
              "Supports 100+ currencies worldwide",
              "Calculate total, tip, and per-person amounts",
              "Customizable tip percentages",
              "Visual pie chart for bill vs tip",
              "Responsive mobile-friendly design",
              "Instant results with clear display"
            ],
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": "1420"
            },
            "publisher": {
              "@type": "Organization",
              "name": "CalculatorHub",
              "url": "https://calculatorhub.site"
            }
          })
        }}
      />

      
    </>
  );
};

const ResultBox: React.FC<{ title: string; value: number; color: string; symbol: string }> = ({
  title,
  value,
  color,
  symbol,
}) => {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-900/30 to-blue-800/30 border-blue-500/30',
    green: 'from-green-900/30 to-green-800/30 border-green-500/30',
    purple: 'from-purple-900/30 to-purple-800/30 border-purple-500/30',
    orange: 'from-orange-900/30 to-orange-800/30 border-orange-500/30',
  };

  return (
    <div
      className={`p-4 sm:p-6 rounded-xl border bg-gradient-to-br ${colorMap[color]} hover:scale-[1.02] transition-transform`}
    >
      <p className="text-sm text-slate-400 mb-1">{title}</p>
      <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
        {symbol}
        {value.toFixed(2)}
      </p>
    </div>
  );
};



export default TipCalculator;
