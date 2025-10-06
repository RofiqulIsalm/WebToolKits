import React, { useState } from 'react';
import { Key, Dices, Palette, DollarSign, Hash, Sparkles, Binary, Fuel } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';
import PasswordGeneratorCalc from '../components/calculators/PasswordGeneratorCalc';
import RandomNumberGeneratorCalc from '../components/calculators/RandomNumberGeneratorCalc';
import ColorConverterCalc from '../components/calculators/ColorConverterCalc';
import TipCalculatorCalc from '../components/calculators/TipCalculatorCalc';
import RomanNumberGeneratorCalc from '../components/calculators/RomanNumberGeneratorCalc';
import UUIDGeneratorCalc from '../components/calculators/UUIDGeneratorCalc';
import BaseConverterCalc from '../components/calculators/BaseConverterCalc';
import FuelCostCalculatorCalc from '../components/calculators/FuelCostCalculatorCalc';

type CalculatorTab = 'password' | 'random' | 'color' | 'tip' | 'roman' | 'uuid' | 'base' | 'fuel';

const AllCalculators: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CalculatorTab>('password');

  const tabs = [
    { id: 'password', label: 'Password', icon: Key },
    { id: 'random', label: 'Random Number', icon: Dices },
    { id: 'color', label: 'Color', icon: Palette },
    { id: 'tip', label: 'Tip', icon: DollarSign },
    { id: 'roman', label: 'Roman', icon: Hash },
    { id: 'uuid', label: 'UUID', icon: Sparkles },
    { id: 'base', label: 'Base', icon: Binary },
    { id: 'fuel', label: 'Fuel Cost', icon: Fuel }
  ];

  return (
    <>
      <SEOHead
        title="All-in-One Calculator Suite - 8 Essential Tools"
        description="Complete calculator suite including password generator, random numbers, color converter, tip calculator, roman numerals, UUID generator, base converter, and fuel cost calculator."
        canonical="https://calculatorhub.com/all-calculators"
        schemaData={generateCalculatorSchema(
          'All-in-One Calculator Suite',
          'Comprehensive suite of 8 essential calculators and tools',
          '/all-calculators',
          ['calculator', 'converter', 'generator', 'tools', 'utilities']
        )}
        breadcrumbs={[
          { name: 'All Tools', url: '/all-calculators' }
        ]}
      />
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs items={[
          { name: 'All Tools', url: '/all-calculators' }
        ]} />

        <div className="glow-card rounded-2xl p-6 md:p-8 mb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">All-in-One Calculator Suite</h1>
            <p className="text-slate-300">8 essential tools in one place - switch between calculators instantly</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-700 pb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as CalculatorTab)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          <div>
            {activeTab === 'password' && <PasswordGeneratorCalc />}
            {activeTab === 'random' && <RandomNumberGeneratorCalc />}
            {activeTab === 'color' && <ColorConverterCalc />}
            {activeTab === 'tip' && <TipCalculatorCalc />}
            {activeTab === 'roman' && <RomanNumberGeneratorCalc />}
            {activeTab === 'uuid' && <UUIDGeneratorCalc />}
            {activeTab === 'base' && <BaseConverterCalc />}
            {activeTab === 'fuel' && <FuelCostCalculatorCalc />}
          </div>
        </div>

        <AdBanner />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">About These Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-300">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Password Generator</h3>
              <p className="text-sm">Generate secure passwords with history tracking and custom text-based generation.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Random Number Generator</h3>
              <p className="text-sm">Generate random numbers with dice animation, statistics, and sound effects.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Color Converter</h3>
              <p className="text-sm">Convert between HEX, RGB, HSL, CMYK with gradient generator and live preview.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Tip Calculator</h3>
              <p className="text-sm">Calculate tips with currency support and visual pie chart breakdown.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Roman Number Generator</h3>
              <p className="text-sm">Bidirectional conversion with interactive quiz mode for learning.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">UUID Generator</h3>
              <p className="text-sm">Generate V1, V4, V5 UUIDs with bulk generation and timestamp display.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Base Converter</h3>
              <p className="text-sm">Convert between any base (2-36) with auto-detection support.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Fuel Cost Calculator</h3>
              <p className="text-sm">Compare vehicles, calculate fuel costs with pie chart and map integration.</p>
            </div>
          </div>
        </div>

        <RelatedCalculators currentPath="/all-calculators" />
      </div>
    </>
  );
};

export default AllCalculators;
