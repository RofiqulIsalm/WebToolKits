import React, { useState, useEffect } from 'react';
import { PiggyBank } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';
import { RotateCcw } from 'lucide-react';

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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Loan Details Card */}
          <div className="rounded-xl shadow-md bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700 p-6">
            <div className="rounded-lg p-6 bg-slate-900/70 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-cyan-300 drop-shadow">Loan Details</h2>
                <button
                  onClick={() => {
                    setPrincipal(0);
                    setRate(0);
                    setTenure(0);
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 text-cyan-400 hover:text-white hover:bg-cyan-600 transition-all duration-300 shadow-md hover:shadow-cyan-500/40 transform hover:scale-110"
                  aria-label="Reset loan inputs"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
        
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Loan Amount (Principal)
                  </label>
                  <input
                    type="number"
                    aria-label="Loan Amount in dollars"
                    value={principal}
                    onChange={(e) => {
                      const value = Math.max(0, Number(e.target.value));
                      setPrincipal(value);
                    }}
                    className="w-full px-4 py-2 bg-slate-800/70 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-slate-500"
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
                    className="w-full px-4 py-2 bg-slate-800/70 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-slate-500"
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
                    className="w-full px-4 py-2 bg-slate-800/70 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-slate-500"
                  />
                  <p className="text-sm text-slate-400 mt-1">
                    {Math.floor(tenure / 12)} years {tenure % 12} months
                  </p>
                </div>
              </div>
            </div>
          </div>
        
          {/* EMI Breakdown Card */}
          <div className="rounded-xl shadow-md bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700 p-6">
            <div className="rounded-lg p-6 bg-slate-900/70 backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-cyan-300 mb-4 drop-shadow">EMI Breakdown</h2>
        
              <div className="space-y-6">
                <div className="text-center p-4 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 shadow-lg">
                  <PiggyBank className="h-8 w-8 text-white mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">${emi.toFixed(2)}</div>
                  <div className="text-sm text-slate-200">Monthly EMI</div>
                </div>
        
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg text-center bg-gradient-to-r from-green-600 to-emerald-600 shadow-md">
                    <div className="text-lg font-semibold text-white">
                      ${principal.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-100">Principal Amount</div>
                  </div>
        
                  <div className="p-4 rounded-lg text-center bg-gradient-to-r from-amber-600 to-orange-600 shadow-md">
                    <div className="text-lg font-semibold text-white">
                      ${totalInterest.toFixed(0)}
                    </div>
                    <div className="text-sm text-slate-100">Total Interest</div>
                  </div>
                </div>
        
                <div className="p-4 rounded-lg text-center bg-gradient-to-r from-indigo-600 to-cyan-600 shadow-lg">
                  <div className="text-xl font-semibold text-white">
                    ${totalAmount.toFixed(0)}
                  </div>
                  <div className="text-sm text-slate-200">Total Amount Payable</div>
                </div>
        
                <p className="text-sm text-slate-400 mt-2 text-center">
                  <strong>Note:</strong> Your estimated monthly EMI based on current rate and tenure.
                </p>
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
      
          {/*----------- Back link -------------*/}
          <div className="mt-10">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                💼 Related Finance Tools
              </h3>
            
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Compound Interest Calculator', link: '/compound-interest-calculator', color: 'from-emerald-500 to-teal-600' },
                  { name: 'Mortgage Calculator', link: '/mortgage-calculator', color: 'from-indigo-500 to-blue-600' },
                  { name: 'Fixed Deposit (FD) Calculator', link: '/fd-calculator', color: 'from-green-500 to-emerald-600' },
                  { name: 'ROI Calculator', link: '/roi-calculator', color: 'from-purple-500 to-fuchsia-600' },
                ].map((tool) => (
                  <a
                    key={tool.name}
                    href={tool.link}
                    className={`group p-4 rounded-xl bg-gradient-to-r ${tool.color} shadow-md hover:shadow-lg  transition-all duration-300 flex items-center justify-between text-white`}
                  >
                    <span className="font-medium group-hover:translate-x-1 transition-transform duration-200">
                      {tool.name}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

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