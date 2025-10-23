import React, { useState } from 'react';
import { Thermometer } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

const TemperatureConverter: React.FC = () => {
  const [celsius, setCelsius] = useState<number>(20);
  const [fahrenheit, setFahrenheit] = useState<number>(68);
  const [kelvin, setKelvin] = useState<number>(293.15);

  // Formatting helper (keeps things neat but not aggressive)
  const fmt = (n: number) =>
    Number.isFinite(n) ? Number(n.toFixed(4)).toString() : '—';

  const updateFromCelsius = (value: number) => {
    setCelsius(value);
    setFahrenheit((value * 9) / 5 + 32);
    setKelvin(value + 273.15);
  };

  const updateFromFahrenheit = (value: number) => {
    setFahrenheit(value);
    const c = ((value - 32) * 5) / 9;
    setCelsius(c);
    setKelvin(c + 273.15);
  };

  const updateFromKelvin = (value: number) => {
    setKelvin(value);
    const c = value - 273.15;
    setCelsius(c);
    setFahrenheit((c * 9) / 5 + 32);
  };

  return (
    <>
      <SEOHead
        title={seoData.temperatureConverter.title}
        description={seoData.temperatureConverter.description}
        canonical="https://calculatorhub.site/temperature-converter"
        schemaData={generateCalculatorSchema(
          'Temperature Converter',
          seoData.temperatureConverter.description,
          '/temperature-converter',
          seoData.temperatureConverter.keywords
        )}
        breadcrumbs={[
          { name: 'Unit Converters', url: '/category/unit-converters' },
          { name: 'Temperature Converter', url: '/temperature-converter' },
        ]}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <div className="max-w-5xl mx-auto text-gray-200">
        <Breadcrumbs
          items={[
            { name: 'Unit Converters', url: '/category/unit-converters' },
            { name: 'Temperature Converter', url: '/temperature-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 rounded-2xl p-6 bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-800 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Temperature Converter</h1>
          <p className="text-gray-300">
            Convert between <b>Celsius</b>, <b>Fahrenheit</b>, and <b>Kelvin</b>.
          </p>
        </div>

        {/* Three colored cards (dark) */}
        <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Celsius */}
            <div className="rounded-xl p-6 border bg-gradient-to-br from-blue-950 to-blue-900 border-blue-800">
              <div className="flex items-center gap-2 mb-4">
                <Thermometer className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Celsius (°C)</h3>
              </div>
              <input
                type="number"
                value={Number.isFinite(celsius) ? Number(celsius.toFixed(6)) : 0}
                onChange={(e) => updateFromCelsius(Number(e.target.value))}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl bg-blue-950/60 border border-blue-800 text-blue-50 placeholder-blue-300/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
              <div className="mt-2 text-sm text-blue-300/80">= {fmt(fahrenheit)} °F, {fmt(kelvin)} K</div>
            </div>

            {/* Fahrenheit */}
            <div className="rounded-xl p-6 border bg-gradient-to-br from-rose-950 to-rose-900 border-rose-800">
              <div className="flex items-center gap-2 mb-4">
                <Thermometer className="h-5 w-5 text-rose-400" />
                <h3 className="text-lg font-semibold text-white">Fahrenheit (°F)</h3>
              </div>
              <input
                type="number"
                value={Number.isFinite(fahrenheit) ? Number(fahrenheit.toFixed(6)) : 0}
                onChange={(e) => updateFromFahrenheit(Number(e.target.value))}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-50 placeholder-rose-300/50 focus:ring-2 focus:ring-rose-500 focus:border-transparent text-lg"
              />
              <div className="mt-2 text-sm text-rose-300/80">= {fmt(celsius)} °C, {fmt(kelvin)} K</div>
            </div>

            {/* Kelvin */}
            <div className="rounded-xl p-6 border bg-gradient-to-br from-violet-950 to-violet-900 border-violet-800">
              <div className="flex items-center gap-2 mb-4">
                <Thermometer className="h-5 w-5 text-violet-400" />
                <h3 className="text-lg font-semibold text-white">Kelvin (K)</h3>
              </div>
              <input
                type="number"
                value={Number.isFinite(kelvin) ? Number(kelvin.toFixed(6)) : 0}
                onChange={(e) => updateFromKelvin(Number(e.target.value))}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl bg-violet-950/60 border border-violet-800 text-violet-50 placeholder-violet-300/50 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-lg"
              />
              <div className="mt-2 text-sm text-violet-300/80">= {fmt(celsius)} °C, {fmt(fahrenheit)} °F</div>
            </div>
          </div>
        </div>

        {/* Quick Reference (dark) */}
        <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow mb-8">
          <h4 className="font-semibold text-white mb-3">Quick Reference</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg p-4 bg-blue-950/50 border border-blue-900">
              <div className="text-blue-200/90 font-medium mb-1">Water freezes</div>
              <div className="text-gray-200">0°C = 32°F = 273.15K</div>
            </div>
            <div className="rounded-lg p-4 bg-rose-950/50 border border-rose-900">
              <div className="text-rose-200/90 font-medium mb-1">Room temperature</div>
              <div className="text-gray-200">20°C = 68°F = 293.15K</div>
            </div>
            <div className="rounded-lg p-4 bg-violet-950/50 border border-violet-900">
              <div className="text-violet-200/90 font-medium mb-1">Water boils</div>
              <div className="text-gray-200">100°C = 212°F = 373.15K</div>
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
