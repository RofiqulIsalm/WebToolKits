import React, { useState, useEffect } from 'react';
import { Home } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const MortgageCalculator: React.FC = () => {
  const [loanAmount, setLoanAmount] = useState<number>(3000000);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [loanTerm, setLoanTerm] = useState<number>(20);
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);

  useEffect(() => {
    calculateMortgage();
  }, [loanAmount, interestRate, loanTerm]);

  const calculateMortgage = () => {
    const principal = loanAmount;
    const monthlyRate = interestRate / 12 / 100;
    const months = loanTerm * 12;

    if (interestRate === 0) {
      const emi = principal / months;
      setMonthlyPayment(emi);
      setTotalPayment(emi * months);
      setTotalInterest(0);
      return;
    }

    const emi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);

    const totalPay = emi * months;
    const totalInt = totalPay - principal;

    setMonthlyPayment(emi);
    setTotalPayment(totalPay);
    setTotalInterest(totalInt);
  };

  return (
    <>
      <SEOHead
        title={seoData.mortgageCalculator.title}
        description={seoData.mortgageCalculator.description}
        canonical="https://calculatorhub.site/mortgage-calculator"
        schemaData={generateCalculatorSchema(
          "Mortgage Calculator",
          seoData.mortgageCalculator.description,
          "/mortgage-calculator",
          seoData.mortgageCalculator.keywords
        )}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Mortgage Calculator', url: '/mortgage-calculator' },
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Currency & Finance', url: '/category/currency-finance' },
            { name: 'Mortgage Calculator', url: '/mortgage-calculator' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Mortgage Calculator
          </h1>
          <p className="text-slate-300">
            Estimate your monthly mortgage payment, total interest, and total payment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Loan Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Amount (₹)
                </label>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Term (Years)
                </label>
                <input
                  type="number"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Result Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Mortgage Summary
            </h2>

            <div className="space-y-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Home className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  ₹{monthlyPayment.toFixed(0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Monthly EMI</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{totalPayment.toFixed(0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Payment</div>
                </div>

                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{totalInterest.toFixed(0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Interest</div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Loan Term:</span>
                  <span className="font-medium">{loanTerm} years</span>
                </div>
                <div className="flex justify-between">
                  <span>Interest Rate:</span>
                  <span className="font-medium">{interestRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Payments:</span>
                  <span className="font-medium">{loanTerm * 12}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AdBanner type="bottom" />

        <RelatedCalculators
          currentPath="/mortgage-calculator"
          category="currency-finance"
        />
      </div>
    </>
  );
};

export default MortgageCalculator;
