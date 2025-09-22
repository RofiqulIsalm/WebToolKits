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
        <div className="glow-card rounded-lg p-6">
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

        <div className="glow-card rounded-lg p-6">
        <div className="math-card rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Your Result</h2>
          
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <Activity className="h-12 w-12 text-blue-400 drop-shadow-lg" />
            </div>
            <div className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
              {bmi.toFixed(1)}
            </div>
            <div className={`inline-block px-4 py-2 rounded-lg font-medium result-glow text-white`}>
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
        </div>
      </div>

      <AdBanner type="bottom" />
    </div>
  );
};

export default BMICalculator;
  )
}