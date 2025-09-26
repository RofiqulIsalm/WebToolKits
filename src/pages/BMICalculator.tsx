import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import AdBanner from '../components/AdBanner';

const BMICalculator: React.FC = () => {
  const [height, setHeight] = useState<number>(170);
  const [weight, setWeight] = useState<number>(70);
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [bmi, setBmi] = useState<number>(0);
  const [category, setCategory] = useState<string>('');
  const [color, setColor] = useState<string>('');

  useEffect(() => {
    calculateBMI();
  }, [height, weight, unit]);

  const calculateBMI = () => {
    let heightInMeters = height;
    let weightInKg = weight;

    if (unit === 'imperial') {
      heightInMeters = height * 0.0254; // inches to meters
      weightInKg = weight * 0.453592; // pounds to kg
    } else {
      heightInMeters = height / 100; // cm to meters
    }

    const bmiValue = weightInKg / (heightInMeters * heightInMeters);
    setBmi(bmiValue);

    if (bmiValue < 18.5) {
      setCategory('Underweight');
      setColor('text-blue-600 bg-blue-50');
    } else if (bmiValue < 25) {
      setCategory('Normal weight');
      setColor('text-green-600 bg-green-50');
    } else if (bmiValue < 30) {
      setCategory('Overweight');
      setColor('text-yellow-600 bg-yellow-50');
    } else {
      setCategory('Obese');
      setColor('text-red-600 bg-red-50');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">BMI Calculator</h1>
        <p className="text-slate-300">Calculate your Body Mass Index and check if you're in a healthy weight range</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="math-card rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Calculate BMI</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Unit System</label>
            <div className="flex space-x-4">
              <button
                onClick={() => setUnit('metric')}
                className={`px-4 py-2 rounded-lg border transition-all ${unit === 'metric' ? 'glow-button text-white border-blue-600' : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-blue-400'}`}
              >
                Metric
              </button>
              <button
                onClick={() => setUnit('imperial')}
                className={`px-4 py-2 rounded-lg border transition-all ${unit === 'imperial' ? 'glow-button text-white border-blue-600' : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-blue-400'}`}
              >
                Imperial
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Height ({unit === 'metric' ? 'cm' : 'inches'})
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full px-4 py-2 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Weight ({unit === 'metric' ? 'kg' : 'lbs'})
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-4 py-2 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="math-card rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Your Result</h2>
          
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <Activity className="h-12 w-12 text-blue-400 drop-shadow-lg" />
            </div>
            <div className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
              {bmi.toFixed(1)}
            </div>
            <div className={`inline-block px-4 py-2 rounded-lg font-medium result-pink text-white`}>
              {category}
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-300">Underweight:</span>
              <span className="text-blue-400">Below 18.5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Normal weight:</span>
              <span className="text-green-400">18.5 - 24.9</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Overweight:</span>
              <span className="text-yellow-400">25 - 29.9</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Obese:</span>
              <span className="text-red-400">30 and above</span>
            </div>
          </div>
      <AdBanner type="bottom" />
      {/* SEO Content Section */}
      <div className="mt-12 space-y-8">
        <div className="math-card rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Understanding BMI Calculator</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 mb-4">
              Body Mass Index (BMI) is a widely used screening tool that measures body fat based on height and weight. 
              Our BMI calculator helps you determine if you're in a healthy weight range and provides insights into 
              your overall health status. It's used by healthcare professionals worldwide as an initial assessment tool.
            </p>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-4">BMI Categories Explained</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/30">
                <div className="font-semibold text-blue-400 mb-2">Underweight</div>
                <div className="text-slate-300">BMI below 18.5</div>
                <div className="text-sm text-slate-400 mt-1">May indicate malnutrition or underlying health issues</div>
              </div>
              <div className="bg-green-900/30 p-4 rounded-lg border border-green-500/30">
                <div className="font-semibold text-green-400 mb-2">Normal Weight</div>
                <div className="text-slate-300">BMI 18.5 - 24.9</div>
                <div className="text-sm text-slate-400 mt-1">Indicates a healthy weight for your height</div>
              </div>
              <div className="bg-yellow-900/30 p-4 rounded-lg border border-yellow-500/30">
                <div className="font-semibold text-yellow-400 mb-2">Overweight</div>
                <div className="text-slate-300">BMI 25 - 29.9</div>
                <div className="text-sm text-slate-400 mt-1">May increase risk of health problems</div>
              </div>
              <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/30">
                <div className="font-semibold text-red-400 mb-2">Obese</div>
                <div className="text-slate-300">BMI 30 and above</div>
                <div className="text-sm text-slate-400 mt-1">Significantly increased health risks</div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mt-6 mb-4">How to Use the BMI Calculator</h3>
            <ol className="text-slate-300 space-y-2 mb-6 list-decimal list-inside">
              <li>Choose your preferred unit system (Metric or Imperial)</li>
              <li>Enter your height in centimeters or inches</li>
              <li>Input your weight in kilograms or pounds</li>
              <li>View your BMI result and category instantly</li>
              <li>Check the reference ranges to understand your result</li>
            </ol>

            <h3 className="text-xl font-semibold text-white mt-6 mb-4">Important Considerations</h3>
            <ul className="text-slate-300 space-y-2">
              <li>• BMI doesn't distinguish between muscle and fat mass</li>
              <li>• Athletes may have high BMI due to muscle mass, not fat</li>
              <li>• Age, gender, and ethnicity can affect BMI interpretation</li>
              <li>• Consult healthcare professionals for personalized advice</li>
              <li>• BMI is a screening tool, not a diagnostic measure</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );