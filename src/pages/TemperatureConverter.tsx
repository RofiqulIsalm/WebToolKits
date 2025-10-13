import React, { useState, useEffect } from 'react';
import { Thermometer } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

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
    <>
      <SEOHead
        title={seoData.temperatureConverter.title}
        description={seoData.temperatureConverter.description}
        canonical="https://calculatorhub.site/temperature-converter"
        schemaData={generateCalculatorSchema(
          "Temperature Converter",
          seoData.temperatureConverter.description,
          "/temperature-converter",
          seoData.temperatureConverter.keywords
        )}
        breadcrumbs={[
          { name: 'Unit Converters', url: '/category/unit-converters' },
          { name: 'Temperature Converter', url: '/temperature-converter' }
        ]}
      />
    <div className="max-w-4xl mx-auto">
      <Breadcrumbs items={[
        { name: 'Unit Converters', url: '/category/unit-converters' },
        { name: 'Temperature Converter', url: '/temperature-converter' }
      ]} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Temperature Converter</h1>
        <p className="text-slate-300">Convert between Celsius, Fahrenheit, and Kelvin</p>
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
      
      <RelatedCalculators 
        currentPath="/temperature-converter" 
        category="unit-converters" 
      />
    </div>
    </>
  );
};

export default TemperatureConverter;