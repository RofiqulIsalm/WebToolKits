import React, { useState, useEffect } from 'react';
import { Receipt } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const TaxCalculator: React.FC = () => {
  const [salary, setSalary] = useState<number>(600000);
  const [regime, setRegime] = useState<'old' | 'new'>('new');
  const [deductions, setDeductions] = useState<number>(150000);
  const [tax, setTax] = useState<number>(0);
  const [netSalary, setNetSalary] = useState<number>(0);

  useEffect(() => {
    calculateTax();
  }, [salary, regime, deductions]);

  const calculateTax = () => {
    let taxableIncome = salary;
    
    // Standard deduction of 50,000
    taxableIncome -= 50000;
    
    if (regime === 'old') {
      taxableIncome -= deductions;
    }

    let calculatedTax = 0;

    if (regime === 'new') {
      // New tax regime slabs
      if (taxableIncome > 300000) {
        calculatedTax += Math.min(taxableIncome - 300000, 300000) * 0.05;
      }
      if (taxableIncome > 600000) {
        calculatedTax += Math.min(taxableIncome - 600000, 300000) * 0.1;
      }
      if (taxableIncome > 900000) {
        calculatedTax += Math.min(taxableIncome - 900000, 300000) * 0.15;
      }
      if (taxableIncome > 1200000) {
        calculatedTax += Math.min(taxableIncome - 1200000, 300000) * 0.2;
      }
      if (taxableIncome > 1500000) {
        calculatedTax += (taxableIncome - 1500000) * 0.3;
      }
    } else {
      // Old tax regime slabs
      if (taxableIncome > 250000) {
        calculatedTax += Math.min(taxableIncome - 250000, 250000) * 0.05;
      }
      if (taxableIncome > 500000) {
        calculatedTax += Math.min(taxableIncome - 500000, 500000) * 0.2;
      }
      if (taxableIncome > 1000000) {
        calculatedTax += (taxableIncome - 1000000) * 0.3;
      }
    }

    // Add 4% cess
    calculatedTax = calculatedTax * 1.04;

    setTax(calculatedTax);
    setNetSalary(salary - calculatedTax);
  };

  return (
    <>
      <SEOHead
        title={seoData.taxCalculator.title}
        description={seoData.taxCalculator.description}
        canonical="https://calculatorhub.com/tax-calculator"
        schemaData={generateCalculatorSchema(
          "Tax Calculator",
          seoData.taxCalculator.description,
          "/tax-calculator",
          seoData.taxCalculator.keywords
        )}
        breadcrumbs={[
          { name: 'Currency & Finance', url: '/category/currency-finance' },
          { name: 'Tax Calculator', url: '/tax-calculator' }
        ]}
      />
    <div className="max-w-4xl mx-auto">
      <Breadcrumbs items={[
        { name: 'Currency & Finance', url: '/category/currency-finance' },
        { name: 'Tax Calculator', url: '/tax-calculator' }
      ]} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Income Tax Calculator</h1>
        <p className="text-slate-300">Calculate your income tax for FY 2024-25 under both tax regimes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Income Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Salary (₹)
              </label>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Regime
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setRegime('new')}
                  className={`px-4 py-2 rounded-lg border ${regime === 'new' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
                >
                  New Regime
                </button>
                <button
                  onClick={() => setRegime('old')}
                  className={`px-4 py-2 rounded-lg border ${regime === 'old' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
                >
                  Old Regime
                </button>
              </div>
            </div>

            {regime === 'old' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Deductions (₹)
                </label>
                <input
                  type="number"
                  value={deductions}
                  onChange={(e) => setDeductions(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  80C, 80D, HRA, etc.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tax Calculation</h2>
          
          <div className="space-y-6">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <Receipt className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                ₹{tax.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Annual Tax</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <div className="text-lg font-semibold text-gray-900">
                  ₹{salary.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Gross Salary</div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-lg font-semibold text-gray-900">
                  ₹{netSalary.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">Net Salary</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Monthly Tax:</span>
                <span className="font-medium">₹{(tax / 12).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Monthly Take-home:</span>
                <span className="font-medium">₹{(netSalary / 12).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Effective Tax Rate:</span>
                <span className="font-medium">{((tax / salary) * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdBanner type="bottom" />
      
      <RelatedCalculators 
        currentPath="/tax-calculator" 
        category="currency-finance" 
      />
    </div>
    </>
  );
};

export default TaxCalculator;