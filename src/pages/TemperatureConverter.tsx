import React, { useState, useEffect } from 'react';
import { Thermometer } from 'lucide-react';
import AdBanner from '../components/AdBanner';

const TemperatureConverter: React.FC = () => {
  const [celsius, setCelsius] = useState<number>(20);
  const [fahrenheit, setFahrenheit] = useState<number>(68);
  const [kelvin, setKelvin] = useState<number>(293.15);

  const updateFromCelsius = (value: number) => {
    setCelsius(value);
    setFahrenheit((value * 9/5) + 32);
    setKelvin(value + 273.15);
  };

  const updateFromFahrenheit = (value: number) => {
    setFahrenheit(value);
    const celsiusValue = (value - 32) * 5/9;
    setCelsius(celsiusValue);
    setKelvin(celsiusValue + 273.15);
  };

  const updateFromKelvin = (value: number) => {
    setKelvin(value);
    const celsiusValue = value - 273.15;
    setCelsius(celsiusValue);
    setFahrenheit((celsiusValue * 9/5) + 32);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Temperature Converter</h1>
        <p className="text-gray-600">Convert between Celsius, Fahrenheit, and Kelvin</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Thermometer className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Celsius (°C)</h3>
            </div>
            <input
              type="number"
              value={celsius}
              onChange={(e) => updateFromCelsius(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>

          <div className="bg-red-50 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Thermometer className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Fahrenheit (°F)</h3>
            </div>
            <input
              type="number"
              value={fahrenheit}
              onChange={(e) => updateFromFahrenheit(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>

          <div className="bg-purple-50 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Thermometer className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Kelvin (K)</h3>
            </div>
            <input
              type="number"
              value={kelvin}
              onChange={(e) => updateFromKelvin(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
        </div>

        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Quick Reference</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Water freezes:</strong>
              <br />0°C = 32°F = 273.15K
            </div>
            <div>
              <strong>Room temperature:</strong>
              <br />20°C = 68°F = 293.15K
            </div>
            <div>
              <strong>Water boils:</strong>
              <br />100°C = 212°F = 373.15K
            </div>
          </div>
        </div>
      </div>

      <AdBanner type="bottom" />

      {/* SEO Content Section */}
      <div className="mt-12 space-y-8">
        <div className="converter-card rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Temperature Converter Guide</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 mb-4">
              Convert between Celsius, Fahrenheit, and Kelvin temperature scales instantly. Our temperature 
              converter is essential for cooking, weather analysis, scientific calculations, and international 
              communication where different temperature scales are used.
            </p>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-4">Temperature Scales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/30">
                <div className="font-semibold text-blue-400 mb-2">Celsius (°C)</div>
                <div className="text-slate-300 text-sm mb-2">Water freezes at 0°C, boils at 100°C</div>
                <div className="text-xs text-slate-400">Used worldwide, scientific standard</div>
              </div>
              <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/30">
                <div className="font-semibold text-red-400 mb-2">Fahrenheit (°F)</div>
                <div className="text-slate-300 text-sm mb-2">Water freezes at 32°F, boils at 212°F</div>
                <div className="text-xs text-slate-400">Used in USA, some Caribbean countries</div>
              </div>
              <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-500/30">
                <div className="font-semibold text-purple-400 mb-2">Kelvin (K)</div>
                <div className="text-slate-300 text-sm mb-2">Absolute zero at 0K (-273.15°C)</div>
                <div className="text-xs text-slate-400">Scientific absolute temperature scale</div>
              </div>
            </div>
    </div>
  );
};

            <h3 className="text-xl font-semibold text-white mt-6 mb-4">Conversion Formulas</h3>
            <div className="bg-slate-700/50 p-4 rounded-lg mb-6">
              <div className="space-y-2 text-sm">
                <div className="text-white"><strong>Celsius to Fahrenheit:</strong> °F = (°C × 9/5) + 32</div>
                <div className="text-white"><strong>Fahrenheit to Celsius:</strong> °C = (°F - 32) × 5/9</div>
                <div className="text-white"><strong>Celsius to Kelvin:</strong> K = °C + 273.15</div>
                <div className="text-white"><strong>Kelvin to Celsius:</strong> °C = K - 273.15</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemperatureConverter;
export default TemperatureConverter;