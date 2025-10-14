import React, { useState, useEffect } from 'react';
import { PiggyBank } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const LoanEMICalculator: React.FC = () => {
  const [principal, setPrincipal] = useState<number>(100000);
  const [rate, setRate] = useState<number>(10);
  const [tenure, setTenure] = useState<number>(12);
  const [emi, setEmi] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);

  useEffect(() => {
    calculateEMI();
  }, [principal, rate, tenure]);
  
  useEffect(() => {
    document.getElementById("principalInput")?.focus();
  }, []);

  const calculateEMI = () => {
    const monthlyRate = rate / 100 / 12;
    const months = tenure;
    let emiValue = 0;
  
    if (monthlyRate === 0) {
      emiValue = principal / months;
    } else {
      emiValue =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);
    }
  
    const total = emiValue * months;
    const interest = total - principal;
  
    setEmi(emiValue);
    setTotalAmount(total);
    setTotalInterest(interest);
  };


  return (
    <>
      <SEOHead
        title={seoData.loanEmiCalculator.title}
        description={seoData.loanEmiCalculator.description}
        canonical="https://calculatorhub.site/loan-emi-calculator"
        schemaData={generateCalculatorSchema(
          "Loan EMI Calculator",
          seoData.loanEmiCalculator.description,
          "/loan-emi-calculator",
          seoData.loanEmiCalculator.keywords
        )}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Loan EMI Calculator', url: '/loan-emi-calculator' }
        ]}
      />
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Loan EMI Calculator', url: '/loan-emi-calculator' }
        ]} />
        
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Loan EMI Calculator</h1>
        <p className="text-gray-600">Calculate your monthly loan EMI, total amount, and interest payable</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="finance-card rounded-lg p-6">
            <div class="grid grid-cols-3 gap-4">
              
              <h2 className="text-xl col-span-2 font-semibold text-white mb-4">Loan Details</h2>
                <button 
                  type="button"
                  onClick={() => { setPrincipal(100000); setRate(10); setTenure(12); }}
                  class="text-white text-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm p-2.5 text-center inline-flex items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                  Reset
               </button>
            </div>

          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Loan Amount (Principal)
              </label>
              <input
                type="number"
                aria-label="Loan Amount in doller"
                value={principal}
                onChange={(e) => {
                  const value = Math.max(0, Number(e.target.value));
                  setPrincipal(value);
                }}
                className="w-full px-4 py-2 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Interest Rate (% per annum)
              </label>
              <input
                type="number"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full px-4 py-2 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Loan Tenure (months)
              </label>
              <input
                type="number"
                value={tenure}
                onChange={(e) => setTenure(Number(e.target.value))}
                className="w-full px-4 py-2 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-slate-400 mt-1">
                {Math.floor(tenure / 12)} years {tenure % 12} months
              </p>
            </div>
          </div>
        </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="finance-card rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">EMI Breakdown</h2>
          
          <div className="space-y-6">
            <div className="text-center p-4 result-purple rounded-lg">
              <PiggyBank className="h-8 w-8 text-white mx-auto mb-2 drop-shadow-lg" />
              <div className="text-2xl font-bold text-white drop-shadow-lg">
                ${emi.toFixed(2)}
              </div>
              <div className="text-sm text-slate-300">Monthly EMI</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 result-green rounded-lg text-center">
                <div className="text-lg font-semibold text-white">
                  ${principal.toLocaleString()}
                </div>
                <div className="text-sm text-slate-300">Principal Amount</div>
              </div>
              
              <div className="p-4 result-amber rounded-lg text-center">
                <div className="text-lg font-semibold text-white">
                  ${totalInterest.toFixed(0)}
                </div>
                <div className="text-sm text-slate-300">Total Interest</div>
              </div>
            </div>

            <div className="p-4 result-purple rounded-lg text-center">
              <div className="text-xl font-semibold text-white">
                ${totalAmount.toFixed(0)}
              </div>
              <div className="text-sm text-slate-300">Total Amount Payable</div>
            </div>
            <div className="text-sm text-slate-300 mt-2">
                <strong>Note : </strong>Your estimated monthly EMI based on current rate and tenure.
            </div>
          </div>
        </div>
        </div>
      </div>

        {/* ------------Seo content-----------------*/}
        <div className="seo-content text-white space-y-6 mt-10">
        <h2 className="text-2xl font-bold">What is a Loan EMI Calculator?</h2>
        <p>...</p>
      
        <h2 className="text-2xl font-bold">How to Calculate EMI Manually</h2>
        <div className="bg-slate-800/60 p-4 rounded-lg">
          <code className="text-green-400">
            EMI = [P × R × (1 + R)^N] / [(1 + R)^N – 1]
          </code>
        </div>
      
        <h2 className="text-2xl font-bold">Benefits of Using EMI Calculator</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>✔ Instant results with accuracy</li>
          <li>✔ Plan your monthly budget</li>
          <li>✔ Compare loans and interest rates</li>
        </ul>
      
        <h2 className="text-2xl font-bold">Popular Loan Calculators</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 list-disc list-inside">
          <li><a href="/loan-affordability-calculator" className="text-blue-400 hover:underline">Loan Affordability Calculator</a></li>
          <li><a href="/simple-interest-calculator" className="text-blue-400 hover:underline">Simple Interest Calculator</a></li>
          <li><a href="/compound-interest-calculator" className="text-blue-400 hover:underline">Compound Interest Calculator</a></li>
        </ul>
      </div>


      <AdBanner type="bottom" />
      
      <RelatedCalculators 
        currentPath="/loan-emi-calculator" 
        category="currency-finance" 
      />
      </div>
    </>
  );
};

export default LoanEMICalculator;