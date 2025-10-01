
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import AdBanner from '../components/AdBanner';

const CompoundInterestCalculator = () => {
  // State variables (same as previous implementation)
  const [principal, setPrincipal] = useState(0);  
  const [rate, setRate] = useState(0);
  const [rateUnit, setRateUnit] = useState('daily');
  const [time, setTime] = useState(0);
  const [timeUnit, setTimeUnit] = useState('days');
  const [finalAmount, setFinalAmount] = useState(0);
  const [compoundInterest, setCompoundInterest] = useState(0);
  const [breakdownMode, setBreakdownMode] = useState('daily');
  const [includeAllDays, setIncludeAllDays] = useState(true);
  const [selectedDays, setSelectedDays] = useState(['SU','MO','TU','WE','TH','FR','SA']);
  const [breakdownData, setBreakdownData] = useState([]);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Existing calculation methods remain the same...
  const getDailyRate = () => {
    switch (rateUnit) {
      case 'daily': return rate / 100;
      case 'weekly': return (rate / 100) / 7;
      case 'monthly': return (rate / 100) / 30;
      case 'yearly': return (rate / 100) / 365;
      default: return rate / 100 / 365;
    }
  };

  const getTotalDays = () => {
    switch (timeUnit) {
      case 'days': return time;
      case 'months': return time * 30;
      case 'years': return time * 365;
      default: return time * 365;
    }
  };

  useEffect(() => {
    calculateCompoundInterest();
    generateBreakdown();
  }, [principal, rate, rateUnit, time, timeUnit, breakdownMode, includeAllDays, selectedDays]);

  const calculateCompoundInterest = () => {
    const dailyRate = getDailyRate();
    const totalDays = getTotalDays();
    let balance = principal;
    for (let i = 0; i < totalDays; i++) {
      const day = new Date();
      day.setDate(day.getDate() + i);
      if (!includeAllDays) {
        const dayMap = ['SU','MO','TU','WE','TH','FR','SA'];
        if (!selectedDays.includes(dayMap[day.getDay()])) continue;
      }
      balance += balance * dailyRate;
    }
    setFinalAmount(balance);
    setCompoundInterest(balance - principal);
  };

  const generateBreakdown = () => {
    // Existing breakdown generation logic remains the same...
    // (No changes in this method)
  };

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const faqData = [
    {
      question: "What is Compound Interest?",
      answer: "Compound interest is the interest calculated on the initial principal and the accumulated interest from previous periods. This means you earn interest not just on your original investment, but on the interest you've already earned."
    },
    {
      question: "How Often Can Interest Be Compounded?",
      answer: "Interest can be compounded daily, weekly, monthly, or yearly. More frequent compounding leads to higher returns as you earn interest on your previously earned interest more often."
    },
    {
      question: "Is Compound Interest Better Than Simple Interest?",
      answer: "Generally, yes. Compound interest allows your money to grow faster because you earn returns on your previous earnings, creating a snowball effect of wealth accumulation."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <Helmet>
        <title>Compound Interest Calculator - Maximize Your Investments</title>
        <meta 
          name="description" 
          content="Calculate your potential investment growth with our advanced compound interest calculator. Understand how your money can grow over time with different interest rates and compounding frequencies."
        />
        <meta 
          name="keywords" 
          content="compound interest, investment calculator, financial planning, wealth growth, interest rates, investment strategy"
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqData.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })}
        </script>
      </Helmet>

      <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center">
        Compound Interest Calculator
      </h1>
      <p className="text-slate-600 text-center mb-8">
        Calculate your investment growth and unlock the power of compound interest
      </p>

      {/* Existing calculator layout remains the same */}
      {/* (Reuse previous component's layout) */}

 
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import AdBanner from '../components/AdBanner';

const CompoundInterestCalculator = () => {
  // State variables
  const [principal, setPrincipal] = useState(0);  
  const [rate, setRate] = useState(0);
  const [rateUnit, setRateUnit] = useState('daily');
  const [time, setTime] = useState(0);
  const [timeUnit, setTimeUnit] = useState('days');
  const [finalAmount, setFinalAmount] = useState(0);
  const [compoundInterest, setCompoundInterest] = useState(0);
  const [breakdownMode, setBreakdownMode] = useState('daily');
  const [includeAllDays, setIncludeAllDays] = useState(true);
  const [selectedDays, setSelectedDays] = useState(['SU','MO','TU','WE','TH','FR','SA']);
  const [breakdownData, setBreakdownData] = useState([]);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // FAQ Data
  const faqData = [
    {
      question: "What is Compound Interest?",
      answer: "Compound interest is the interest calculated on the initial principal and the accumulated interest from previous periods. This means you earn interest not just on your original investment, but on the interest you've already earned."
    },
    {
      question: "How Often Can Interest Be Compounded?",
      answer: "Interest can be compounded daily, weekly, monthly, or yearly. More frequent compounding leads to higher returns as you earn interest on your previously earned interest more often."
    },
    {
      question: "Is Compound Interest Better Than Simple Interest?",
      answer: "Generally, yes. Compound interest allows your money to grow faster because you earn returns on your previous earnings, creating a snowball effect of wealth accumulation."
    }
  ];

  // Helper: convert rate to daily rate
  const getDailyRate = () => {
    switch (rateUnit) {
      case 'daily': return rate / 100;
      case 'weekly': return (rate / 100) / 7;
      case 'monthly': return (rate / 100) / 30;
      case 'yearly': return (rate / 100) / 365;
      default: return rate / 100 / 365;
    }
  };

  // Helper: convert time to days
  const getTotalDays = () => {
    switch (timeUnit) {
      case 'days': return time;
      case 'months': return time * 30;
      case 'years': return time * 365;
      default: return time * 365;
    }
  };

  // Effect: recalc when inputs change
  useEffect(() => {
    calculateCompoundInterest();
    generateBreakdown();
  }, [principal, rate, rateUnit, time, timeUnit, breakdownMode, includeAllDays, selectedDays]);

  // Calculation: compound interest
  const calculateCompoundInterest = () => {
    const dailyRate = getDailyRate();
    const totalDays = getTotalDays();
    let balance = principal;
    for (let i = 0; i < totalDays; i++) {
      const day = new Date();
      day.setDate(day.getDate() + i);
      if (!includeAllDays) {
        const dayMap = ['SU','MO','TU','WE','TH','FR','SA'];
        if (!selectedDays.includes(dayMap[day.getDay()])) continue;
      }
      balance += balance * dailyRate;
    }
    setFinalAmount(balance);
    setCompoundInterest(balance - principal);
  };

  // Generate breakdown rows
  const generateBreakdown = () => {
    let data = [];
    const startDate = new Date();
    let balance = principal;
    let totalEarnings = 0;
    const dailyRate = getDailyRate();
    const totalDays = getTotalDays();

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      if (!includeAllDays) {
        const dayMap = ['SU','MO','TU','WE','TH','FR','SA'];
        if (!selectedDays.includes(dayMap[date.getDay()])) continue;
      }

      const earnings = balance * dailyRate;
      balance += earnings;
      totalEarnings += earnings;

      let label = '';
      if (breakdownMode === 'daily') {
        label = date.toDateString();
      } else if (breakdownMode === 'weekly') {
        label = `Week ${Math.floor(i / 7) + 1}`;
      } else if (breakdownMode === 'monthly') {
        label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      } else if (breakdownMode === 'yearly') {
        label = date.getFullYear().toString();
      }

      data.push({ period: label, earnings, totalEarnings, balance });
    }

    // Group data for weekly/monthly/yearly modes
    if (breakdownMode === 'monthly' || breakdownMode === 'yearly') {
      const grouped = {};
      data.forEach((row) => {
        if (!grouped[row.period]) grouped[row.period] = { ...row };
        else {
          grouped[row.period].earnings += row.earnings;
          grouped[row.period].totalEarnings = row.totalEarnings;
          grouped[row.period].balance = row.balance;
        }
      });
      data = Object.values(grouped);
    }

    // Add total row
    data.push({
      period: 'TOTAL',
      earnings: data.reduce((s, r) => s + r.earnings, 0),
      totalEarnings: data.reduce((s, r) => s + r.earnings, 0),
      balance: data[data.length - 1].balance
    });

    setBreakdownData(data);
  };

  // Toggle selected days
  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <Helmet>
        <title>Compound Interest Calculator - Maximize Your Investments</title>
        <meta 
          name="description" 
          content="Calculate your potential investment growth with our advanced compound interest calculator. Understand how your money can grow over time with different interest rates and compounding frequencies."
        />
        <meta 
          name="keywords" 
          content="compound interest, investment calculator, financial planning, wealth growth, interest rates, investment strategy"
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqData.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })}
        </script>
      </Helmet>

      <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center">
        Compound Interest Calculator
      </h1>
      <p className="text-slate-600 text-center mb-8">
        Calculate your investment growth and unlock the power of compound interest
      </p>

      {/* Calculator Component (Your Original Implementation) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Investment Inputs */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Investment Details</h2>
          <div className="space-y-4">
            {/* Principal Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Principal Amount ($)</label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Rate Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Interest Rate (%)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
                />
                <select
                  value={rateUnit}
                  onChange={(e) => setRateUnit(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            {/* Time Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Time Period</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={time}
                  onChange={(e) => setTime(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
                />
                <select
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="years">Years</option>
                  <option value="months">Months</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Results</h2>
            <div className="space-y-6">
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-900">${finalAmount.toFixed(2)}</div>
                <div className="text-sm text-slate-600">Final Amount</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-indigo-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-slate-900">${principal.toLocaleString()}</div>
                  <div className="text-sm text-slate-600">Principal</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-slate-900">${compoundInterest.toFixed(2)}</div>
                  <div className="text-sm text-slate-600">Compound Interest</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supplementary Content Sections */}
      <section className="mt-12 bg-white rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-semibold mb-6">Understanding Compound Interest</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-medium mb-4">How Compound Interest Works</h3>
            <p className="text-slate-700 leading-relaxed">
              Compound interest is a powerful financial concept where you earn returns not just on your initial investment, but on the accumulated interest as well. Unlike simple interest, which calculates earnings only on the principal amount, compound interest allows your money to grow exponentially over time.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-medium mb-4">Benefits of Compounding</h3>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>Accelerated wealth accumulation</li>
              <li>Potential for significant long-term growth</li>
              <li>Passive income generation</li>
              <li>Strategic investment planning</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <img 
            src="/api/placeholder/400/300" 
            alt="Illustration of compound interest growth" 
            className="rounded-lg shadow-md"
          />
          <img 
            src="/api/placeholder/400/300" 
            alt="Compound interest vs simple interest comparison" 
            className="rounded-lg shadow-md"
          />
          <img 
            src="/api/placeholder/400/300" 
            alt="Financial growth over time visualization" 
            className="rounded-lg shadow-md"
          />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mt-12 bg-white rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <div key={index} className="border-b pb-4 last:border-b-0">
              <h3 className="text-lg font-medium mb-2">{faq.question}</h3>
              <p className="text-slate-700">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <AdBanner type="bottom" />
    </div>
  );
};

export default CompoundInterestCalculator;
     <section className="mt-12 bg-white rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-semibold mb-6">Understanding Compound Interest</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-medium mb-4">How Compound Interest Works</h3>
            <p className="text-slate-700 leading-relaxed">
              Compound interest is a powerful financial concept where you earn returns not just on your initial investment, but on the accumulated interest as well. Unlike simple interest, which calculates earnings only on the principal amount, compound interest allows your money to grow exponentially over time.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-medium mb-4">Benefits of Compounding</h3>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>Accelerated wealth accumulation</li>
              <li>Potential for significant long-term growth</li>
              <li>Passive income generation</li>
              <li>Strategic investment planning</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <img 
            src="/api/placeholder/400/300" 
            alt="Illustration of compound interest growth" 
            className="rounded-lg shadow-md"
          />
          <img 
            src="/api/placeholder/400/300" 
            alt="Compound interest vs simple interest comparison" 
            className="rounded-lg shadow-md"
          />
          <img 
            src="/api/placeholder/400/300" 
            alt="Financial growth over time visualization" 
            className="rounded-lg shadow-md"
          />
        </div>
      </section>

      <section className="mt-12 bg-white rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <div key={index} className="border-b pb-4 last:border-b-0">
              <h3 className="text-lg font-medium mb-2">{faq.question}</h3>
              <p className="text-slate-700">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <AdBanner type="bottom" />
    </div>
  );
};

export default CompoundInterestCalculator;
