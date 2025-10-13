import React, { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const CreditCardPayoffCalculator: React.FC = () => {
  const [balance, setBalance] = useState<number>(50000);
  const [annualRate, setAnnualRate] = useState<number>(18);
  const [monthlyPayment, setMonthlyPayment] = useState<number>(3000);

  const [monthsToPayoff, setMonthsToPayoff] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [totalPaid, setTotalPaid] = useState<number>(0);

  useEffect(() => {
    calculatePayoff();
  }, [balance, annualRate, monthlyPayment]);

  const calculatePayoff = () => {
    const monthlyRate = annualRate / 12 / 100;
    let remaining = balance;
    let totalInterestPaid = 0;
    let months = 0;

    if (monthlyPayment <= balance * monthlyRate) {
      setMonthsToPayoff(0);
      setTotalInterest(0);
      setTotalPaid(0);
      return;
    }

    // simulate monthly payments
    while (remaining > 0 && months < 600) {
      const interest = remaining * monthlyRate;
      const principal = monthlyPayment - interest;
      remaining -= principal;
      totalInterestPaid += interest;
      months++;
    }

    setMonthsToPayoff(months);
    setTotalInterest(totalInterestPaid);
    setTotalPaid(balance + totalInterestPaid);
  };

  return (
    <>
      <SEOHead
        title={seoData.creditCardPayoffCalculator.title}
        description={seoData.creditCardPayoffCalculator.description}
        canonical="https://calculatorhub.site/credit-card-payoff-calculator"
        schemaData={generateCalculatorSchema(
          "Credit Card Payoff Calculator",
          seoData.creditCardPayoffCalculator.description,
          "/credit-card-payoff-calculator",
          seoData.creditCardPayoffCalculator.keywords
        )}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Credit Card Payoff Calculator', url: '/credit-card-payoff-calculator' },
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'Credit Card Payoff Calculator', url: '/credit-card-payoff-calculator' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Credit Card Payoff Calculator
          </h1>
          <p className="text-slate-300">
            Calculate how long it will take to pay off your credit card balance and how much interest you’ll pay.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Card & Payment Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Balance (₹)
                </label>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={annualRate}
                  onChange={(e) => setAnnualRate(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Payment (₹)
                </label>
                <input
                  type="number"
                  value={monthlyPayment}
                  onChange={(e) => setMonthlyPayment(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Payoff Summary
            </h2>

            <div className="space-y-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <CreditCard className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {monthsToPayoff > 0 ? `${monthsToPayoff} months` : "—"}
                </div>
                <div className="text-sm text-gray-600">Time to Pay Off</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{totalInterest.toFixed(0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Interest Paid</div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{totalPaid.toFixed(0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Amount Paid</div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Balance:</span>
                  <span className="font-medium">₹{balance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Interest Rate:</span>
                  <span className="font-medium">{annualRate}% p.a.</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Payment:</span>
                  <span className="font-medium">₹{monthlyPayment.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators
          currentPath="/credit-card-payoff-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default CreditCardPayoffCalculator;
