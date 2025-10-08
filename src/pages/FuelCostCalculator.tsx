import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Fuel, Share2 } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

type Results = {
  fuelNeeded: number;
  totalCost: number;
  costPerKm: number;
  costPerMile: number;
};

type SavedTrip = {
  id: string;
  label: string;
  timestamp: number;
  payload: {
    distance: number;
    distanceUnit: 'km' | 'miles';
    fuelEfficiency: number;
    efficiencyUnit: 'l/100km' | 'mpg' | 'km/l';
    fuelPrice: number;
    currencySymbol: string;
    tolls: number;
    otherCost: number;
    passengers: number;
    timesPerMonth: number;
  };
};

const STORAGE_KEY = 'ch_saved_trips_v1';

const FuelCostCalculator: React.FC = () => {
  // Main trip A
  const [distance, setDistance] = useState<number>(100);
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'miles'>('km');

  const [fuelEfficiency, setFuelEfficiency] = useState<number>(8);
  const [efficiencyUnit, setEfficiencyUnit] = useState<
    'l/100km' | 'mpg' | 'km/l'
  >('l/100km');

  const [fuelPrice, setFuelPrice] = useState<number>(1.5);
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');

  // Advanced
  const [tolls, setTolls] = useState<number>(0);
  const [otherCost, setOtherCost] = useState<number>(0);
  const [passengers, setPassengers] = useState<number>(1);
  const [timesPerMonth, setTimesPerMonth] = useState<number>(0); // frequency for monthly/yearly calc

  // Comparison trip (B)
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [bDistance, setBDistance] = useState<number>(120);
  const [bFuelEfficiency, setBFuelEfficiency] = useState<number>(10);

  // Results
  const [results, setResults] = useState<Results>({
    fuelNeeded: 0,
    totalCost: 0,
    costPerKm: 0,
    costPerMile: 0,
  });
  const [resultsB, setResultsB] = useState<Results>({
    fuelNeeded: 0,
    totalCost: 0,
    costPerKm: 0,
    costPerMile: 0,
  });

  // Saved trips
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);

  // Tips widget
  const TIPS = [
    'Maintain tire pressure for best fuel economy.',
    'Avoid rapid acceleration; use steady speeds.',
    'Remove unnecessary weight from your vehicle.',
    'Use cruise control on highways to save fuel.',
    'Plan routes to avoid heavy traffic and idling.',
  ];
  const [tipIdx, setTipIdx] = useState<number>(
    Math.floor(Math.random() * TIPS.length)
  );

  // FAQs (SEO-friendly)
  const FAQS = [
    {
      q: 'How do I calculate fuel cost for a trip?',
      a: 'Enter distance, your vehicle fuel efficiency and fuel price. The calculator estimates fuel needed and multiplies by price.',
    },
    {
      q: 'Can I compare two vehicles?',
      a: 'Yes — enable Compare mode and input the second vehicle’s efficiency to compare total costs.',
    },
    {
      q: 'How accurate is the calculation?',
      a: 'This provides an estimate based on the inputs. Real-world fuel consumption varies with driving style, traffic, and load.',
    },
  ];

  // Utility: convert distance to km
  const toKm = (d: number, unit: 'km' | 'miles') =>
    unit === 'km' ? d : d * 1.60934;

  // fuel calc function (shared)
  const calcFuelNeeded = (
    distanceValue: number,
    unit: 'km' | 'miles',
    eff: number,
    effUnit: 'l/100km' | 'mpg' | 'km/l'
  ) => {
    const distanceKm = toKm(distanceValue, unit);
    switch (effUnit) {
      case 'l/100km':
        return (distanceKm / 100) * eff;
      case 'mpg': {
        const miles = distanceKm / 1.60934;
        return (miles / eff) * 3.78541;
      }
      case 'km/l':
        return distanceKm / eff;
      default:
        return 0;
    }
  };



  // Recalculate whenever inputs change for A
  useEffect(() => {
    try {
      const fuelNeeded = calcFuelNeeded(
        distance,
        distanceUnit,
        fuelEfficiency,
        efficiencyUnit
      );
      const total = Math.round((fuelNeeded * fuelPrice + tolls + otherCost) * 100) / 100;
      const costPerKm = +(total / toKm(distance, distanceUnit)).toFixed(4);
      const costPerMile = +(costPerKm * 1.60934).toFixed(4);
      setResults({
        fuelNeeded: Math.round(fuelNeeded * 100) / 100,
        totalCost: total,
        costPerKm: Math.round(costPerKm * 100) / 100,
        costPerMile: Math.round(costPerMile * 100) / 100,
      });
    } catch (e) {
      // ignore
    }
  }, [distance, distanceUnit, fuelEfficiency, efficiencyUnit, fuelPrice, tolls, otherCost]);

  // Recalculate for B
  useEffect(() => {
    const fuelNeededB = calcFuelNeeded(bDistance, distanceUnit, bFuelEfficiency, efficiencyUnit);
    const totalB = Math.round((fuelNeededB * fuelPrice + tolls + otherCost) * 100) / 100;
    const costPerKmB = +(totalB / toKm(bDistance, distanceUnit)).toFixed(4);
    const costPerMileB = +(costPerKmB * 1.60934).toFixed(4);
    setResultsB({
      fuelNeeded: Math.round(fuelNeededB * 100) / 100,
      totalCost: totalB,
      costPerKm: Math.round(costPerKmB * 100) / 100,
      costPerMile: Math.round(costPerMileB * 100) / 100,
    });
  }, [bDistance, bFuelEfficiency, distanceUnit, efficiencyUnit, fuelPrice, tolls, otherCost]);

  // Pie data for charts (A)
  const pieData = useMemo(
    () => [
      { name: 'Fuel', value: Math.round(results.fuelNeeded * fuelPrice * 100) / 100 },
      { name: 'Tolls', value: tolls },
      { name: 'Other', value: otherCost },
    ],
    [results, fuelPrice, tolls, otherCost]
  );
  const COLORS = ['#3b82f6', '#22c55e', '#f97316'];

  // Comparison BarChart data (A vs B)
  const comparisonData = useMemo(
    () => [
      {
        category: 'Fuel',
        VehicleA: Math.round(results.fuelNeeded * fuelPrice * 100) / 100,
        VehicleB: Math.round(resultsB.fuelNeeded * fuelPrice * 100) / 100,
      },
      { category: 'Tolls', VehicleA: tolls, VehicleB: tolls },
      { category: 'Other', VehicleA: otherCost, VehicleB: otherCost },
    ],
    [results, resultsB, fuelPrice, tolls, otherCost]
  );

  // Save/load trips to localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSavedTrips(JSON.parse(raw));
    } catch (e) {
      setSavedTrips([]);
    }
  }, []);

  const persistTrips = (list: SavedTrip[]) => {
    setSavedTrips(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      // ignore
    }
  };

  const saveCurrentTrip = (label?: string) => {
    const id = Date.now().toString(36);
    const trip: SavedTrip = {
      id,
      label: label || `Trip ${new Date().toLocaleString()}`,
      timestamp: Date.now(),
      payload: {
        distance,
        distanceUnit,
        fuelEfficiency,
        efficiencyUnit,
        fuelPrice,
        currencySymbol,
        tolls,
        otherCost,
        passengers,
        timesPerMonth,
      },
    };
    persistTrips([trip, ...savedTrips].slice(0, 20));
  };

  const removeTrip = (id: string) => {
    persistTrips(savedTrips.filter((s) => s.id !== id));
  };

  // Share URL generator
    const [showShareModal, setShowShareModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const shareRef = useRef<HTMLDivElement | null>(null);
    const buildShareUrl = (payload?: SavedTrip['payload']) => {
    const base = window.location.origin + window.location.pathname;
    const p = payload || {
      distance,
      distanceUnit,
      fuelEfficiency,
      efficiencyUnit,
      fuelPrice,
      currencySymbol,
      tolls,
      otherCost,
      passengers,
      timesPerMonth,
    };
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
          setShowShareModal(false);
        }
      };
    
      if (showShareModal) {
        document.addEventListener("mousedown", handleClickOutside);
      } else {
        document.removeEventListener("mousedown", handleClickOutside);
      }
    
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showShareModal]);

    const params = new URLSearchParams();
    Object.entries(p).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.set(k, String(v));
    });
    return `${base}?${params.toString()}`;
  };

  // On mount, if URL has params, load them
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const maybe = (k: string) => params.get(k);
    if (params.toString()) {
      const d = maybe('distance');
      if (d) setDistance(Number(d));
      const du = maybe('distanceUnit') as 'km' | 'miles';
      if (du) setDistanceUnit(du);
      const fe = maybe('fuelEfficiency');
      if (fe) setFuelEfficiency(Number(fe));
      const eu = maybe('efficiencyUnit') as 'l/100km' | 'mpg' | 'km/l';
      if (eu) setEfficiencyUnit(eu);
      const fp = maybe('fuelPrice');
      if (fp) setFuelPrice(Number(fp));
      const sym = maybe('currencySymbol');
      if (sym) setCurrencySymbol(sym);
      const t = maybe('tolls');
      if (t) setTolls(Number(t));
      const o = maybe('otherCost');
      if (o) setOtherCost(Number(o));
      const pass = maybe('passengers');
      if (pass) setPassengers(Number(pass));
      const times = maybe('timesPerMonth');
      if (times) setTimesPerMonth(Number(times));
    }
  }, []);

  // Monthly & yearly
  const monthlyCost = +(results.totalCost * timesPerMonth).toFixed(2);
  const yearlyCost = +(monthlyCost * 12).toFixed(2);

  // helpers
  const formatCurrency = (val: number) => `${currencySymbol}${val}`;

  // Rotate random tip
  useEffect(() => {
    const t = setInterval(() => {
      setTipIdx((i) => (i + 1) % TIPS.length);
    }, 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
    <SEOHead
          title="Fuel Cost Calculator - Calculate Trip Fuel & Gas Expenses | CalculatorHub"
          description="Use our free online Fuel Cost Calculator to estimate trip fuel expenses for cars, bikes, and trucks. Compare vehicles, save trips, and calculate total journey costs easily."
          canonical="https://calculatorhub.site/fuel-cost-calculator"
          schemaData={generateCalculatorSchema(
            'Fuel Cost Calculator',
            'Estimate fuel costs, gas consumption, and trip expenses using this free tool.',
            '/fuel-cost-calculator',
            [
              'fuel cost calculator',
              'gas calculator',
              'trip cost estimator',
              'fuel consumption calculator',
              'mpg calculator',
              'car travel cost calculator',
              'road trip fuel estimator'
            ]
          )}
          breadcrumbs={[
            { name: 'Misc Tools', url: '/category/misc-tools' },
            { name: 'Fuel Cost Calculator', url: '/fuel-cost-calculator' }
          ]}
        />
        
        {/* ✅ For Vite/React (no next/head): place meta + schema directly */}
        <>
          <meta property="og:title" content="Fuel Cost Calculator - Calculate Trip Fuel & Gas Expenses | CalculatorHub" />
          <meta property="og:description" content="Estimate trip fuel expenses, compare vehicle efficiency, and save money with our accurate online fuel cost calculator." />
          <meta property="og:url" content="https://calculatorhub.site/fuel-cost-calculator" />
          <meta property="og:image" content="https://calculatorhub.site/images/fuel-cost-calculator-og.jpg" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Fuel Cost Calculator - Estimate Your Trip Costs Instantly" />
          <meta name="twitter:description" content="Calculate and compare fuel expenses for your trips with CalculatorHub's free fuel cost calculator." />
          <meta name="twitter:image" content="https://calculatorhub.site/images/fuel-cost-calculator-og.jpg" />
        
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "How do I calculate fuel cost for a trip?",
                    "acceptedAnswer": { "@type": "Answer", "text": "Enter distance, fuel efficiency, and price to estimate total fuel cost for your trip automatically." }
                  },
                  {
                    "@type": "Question",
                    "name": "Can I compare two vehicles using this calculator?",
                    "acceptedAnswer": { "@type": "Answer", "text": "Yes. Enable Compare Mode and view side-by-side total cost results." }
                  },
                  {
                    "@type": "Question",
                    "name": "Can I calculate monthly or yearly fuel expenses?",
                    "acceptedAnswer": { "@type": "Answer", "text": "Yes. Enter trips per month to see your monthly and yearly fuel costs instantly." }
                  },
                  {
                    "@type": "Question",
                    "name": "Does this calculator support kilometers and miles?",
                    "acceptedAnswer": { "@type": "Answer", "text": "Yes. You can switch between km and miles, and between L/100km, km/L, or MPG." }
                  },
                  {
                    "@type": "Question",
                    "name": "Can I save and share my trip calculations?",
                    "acceptedAnswer": { "@type": "Answer", "text": "Yes. You can save trips locally and generate shareable URLs." }
                  },
                  {
                    "@type": "Question",
                    "name": "How can I reduce my fuel costs while driving?",
                    "acceptedAnswer": { "@type": "Answer", "text": "Maintain tire pressure, drive smoothly, use cruise control, and reduce load weight." }
                  },
                  {
                    "@type": "Question",
                    "name": "Is the fuel cost calculator free to use?",
                    "acceptedAnswer": { "@type": "Answer", "text": "Yes. The calculator is 100% free to use and works on any device without login." }
                  }
                ]
              })
            }}
          />
        </>


      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Fuel Cost Calculator', url: '/fuel-cost-calculator' }
        ]} />

        <div className="glow-card rounded-2xl p-5 sm:p-8 mb-6 bg-slate-800/70">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-4">
            <Fuel className="h-10 w-10 text-blue-400" />
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Fuel Cost Calculator</h1>
              <p className="text-sm text-slate-300 mt-1">Estimate fuel, compare vehicles, save & share trips.</p>
            </div>

          {/* Share Button — responsive position */}
          <div ref={shareRef} className="flex sm:static absolute top-3 right-3 sm:top-auto sm:right-auto gap-2 items-center">

            <button
              className="px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs sm:text-sm flex items-center gap-1 sm:gap-2 shadow-sm"
              onClick={() => setShowShareModal((prev) => !prev)}
            >
              <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> 
              <span className="hidden sm:inline">Share</span>
            </button>
          
            {/* Popover dropdown */}
            {showShareModal && (
              <div
                className="absolute right-0 mt-2 w-48 sm:w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 animate-fade-in"
                onMouseLeave={() => setShowShareModal(false)}
              >
                <div className="p-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(buildShareUrl())}`, '_blank')}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-1 rounded text-xs"
                  >
                    Facebook
                  </button>
                  <button
                    onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(buildShareUrl())}`, '_blank')}
                    className="bg-sky-500 hover:bg-sky-600 text-white py-1 rounded text-xs"
                  >
                    Twitter
                  </button>
                  <button
                    onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(buildShareUrl())}`, '_blank')}
                    className="bg-green-600 hover:bg-green-700 text-white py-1 rounded text-xs"
                  >
                    WhatsApp
                  </button>
                  <button
                    onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(buildShareUrl())}`, '_blank')}
                    className="bg-blue-700 hover:bg-blue-800 text-white py-1 rounded text-xs"
                  >
                    LinkedIn
                  </button>
                  <button
                    onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(buildShareUrl())}`, '_blank')}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white py-1 rounded text-xs"
                  >
                    Telegram
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(buildShareUrl());
                      setCopied(true);
                      setTimeout(() => setCopied(false), 3000);
                    }}
                    className={`${
                      copied ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-600 hover:bg-slate-700'
                    } text-white py-1 rounded text-xs transition-colors duration-200`}
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            )}
          </div>



          </div>

          {/* Inputs (stack on mobile) */}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white block mb-2">Distance</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600"
                  type="number"
                  min={0}
                  step={0.1}
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  placeholder="Distance"
                />
                <select
                  value={distanceUnit}
                  onChange={(e) => setDistanceUnit(e.target.value as any)}
                  className="w-full sm:w-40 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600"
                >
                  <option value="km">Kilometers</option>
                  <option value="miles">Miles</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm text-white block mb-2">Fuel Efficiency</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={fuelEfficiency}
                  onChange={(e) => setFuelEfficiency(Number(e.target.value))}
                  className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600"
                />
                <select
                  value={efficiencyUnit}
                  onChange={(e) => setEfficiencyUnit(e.target.value as any)}
                  className="w-full sm:w-40 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600"
                >
                  <option value="l/100km">L/100km</option>
                  <option value="mpg">MPG (US)</option>
                  <option value="km/l">km/L</option>
                </select>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {efficiencyUnit === 'mpg' ? 'Miles per gallon (US)' : efficiencyUnit === 'km/l' ? 'Kilometers per liter' : 'Liters per 100 kilometers'}
              </p>
            </div>

            <div>
              <label className="text-sm text-white block mb-2">Fuel Price per Liter</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  maxLength={3}
                  className="w-full sm:w-24 px-4 py-3 text-center bg-slate-700 text-white rounded-lg border border-slate-600"
                />
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(Number(e.target.value))}
                  className="w-full flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600"
                />
              </div>
            </div>


            {/* Advanced settings */}
            <div className="bg-slate-700/40 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-2">Advanced Settings</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-300">Tolls ({currencySymbol})</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={tolls}
                    onChange={(e) => setTolls(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300">Other Costs ({currencySymbol})</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={otherCost}
                    onChange={(e) => setOtherCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300">Passengers</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-300">Trips per month (for monthly/yearly)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={timesPerMonth}
                    onChange={(e) => setTimesPerMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                  />
                </div>
                <div className="sm:col-span-1 flex items-end">
                  <button
                    className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                    onClick={() => saveCurrentTrip()}
                  >
                    Save Trip
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results & charts */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl border border-blue-500/30">
                <p className="text-sm text-slate-400">Fuel Needed</p>
                <p className="text-3xl font-bold text-white">{results.fuelNeeded} L</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl border border-green-500/30">
                <p className="text-sm text-slate-400">Total Cost</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(results.totalCost)}</p>
                <p className="text-xs text-slate-300 mt-1">Per person: {formatCurrency(+(results.totalCost / Math.max(1, passengers)).toFixed(2))}</p>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <p className="text-xs text-slate-400">Monthly (x{timesPerMonth})</p>
                <p className="text-lg font-semibold text-white">{formatCurrency(monthlyCost)} / month</p>
                <p className="text-xs text-slate-300">Yearly: {formatCurrency(yearlyCost)}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl">
              <h4 className="text-sm font-semibold text-white mb-2">Cost Breakdown</h4>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={70} label>
                      {pieData.map((entry, idx) => <Cell key={`c-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-300">
                <div className="flex flex-col items-start"><span className="font-semibold">{formatCurrency(Math.round(pieData[0].value * 100) / 100)}</span><span>Fuel</span></div>
                <div className="flex flex-col items-start"><span className="font-semibold">{formatCurrency(pieData[1].value)}</span><span>Tolls</span></div>
                <div className="flex flex-col items-start"><span className="font-semibold">{formatCurrency(pieData[2].value)}</span><span>Other</span></div>
              </div>
            </div>
          </div>

          {/* Comparison Chart */}
          {compareMode && (
            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl">
              <h4 className="text-sm font-semibold text-white mb-3">Vehicle A vs B Cost Comparison</h4>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="category" stroke="#cbd5e1" />
                    <YAxis stroke="#cbd5e1" />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                    <Legend />
                    <Bar dataKey="VehicleA" fill="#3b82f6" name="Vehicle A" />
                    <Bar dataKey="VehicleB" fill="#22c55e" name="Vehicle B" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Compare Vehicles */}
          <div className="mt-4 p-4 bg-slate-700/30 rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">Compare Two Vehicles</h4>
              <label className="text-xs text-slate-300 flex items-center gap-2">
                <input type="checkbox" checked={compareMode} onChange={(e) => setCompareMode(e.target.checked)} className="accent-blue-500" />
                Enable
              </label>
            </div>

            {compareMode && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-300">Vehicle A (current)</label>
                  <div className="text-sm text-slate-200">{fuelEfficiency} {efficiencyUnit}</div>
                  <div className="mt-1 text-xs text-slate-300">Cost: {formatCurrency(results.totalCost)}</div>
                </div>
                <div>
                  <label className="text-xs text-slate-300">Vehicle B Efficiency</label>
                  <input className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg" value={bFuelEfficiency} onChange={(e) => setBFuelEfficiency(Number(e.target.value))} />
                  <div className="mt-1 text-xs text-slate-300">Cost: {formatCurrency(resultsB.totalCost)}</div>
                </div>
                <div className="flex items-center">
                  <div className="text-sm text-white font-semibold">Difference:</div>
                  <div className={`ml-2 text-sm ${results.totalCost - resultsB.totalCost > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatCurrency(Math.abs(+(results.totalCost - resultsB.totalCost).toFixed(2)))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Saved trips list */}
          <div className="mt-4 p-4 bg-slate-700/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-white">Saved Trips</h4>
              <div className="text-xs text-slate-300">Stored in your browser (local)</div>
            </div>
            {savedTrips.length === 0 ? (
              <p className="text-xs text-slate-400">No saved trips yet — click Save Trip to store.</p>
            ) : (
              <ul className="space-y-2">
                {savedTrips.map((s) => (
                  <li key={s.id} className="flex items-center justify-between bg-slate-800/40 px-3 py-2 rounded-md">
                    <div>
                      <div className="text-sm text-white font-medium">{s.label}</div>
                      <div className="text-xs text-slate-300">{new Date(s.timestamp).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { const url = buildShareUrl(s.payload); navigator.clipboard?.writeText(url); alert('Share URL copied'); }} className="px-2 py-1 bg-slate-600 rounded text-xs">Share</button>
                      <button onClick={() => { /* load into UI */ setDistance(s.payload.distance); setDistanceUnit(s.payload.distanceUnit); setFuelEfficiency(s.payload.fuelEfficiency); setEfficiencyUnit(s.payload.efficiencyUnit); setFuelPrice(s.payload.fuelPrice); setCurrencySymbol(s.payload.currencySymbol); setTolls(s.payload.tolls); setOtherCost(s.payload.otherCost); setPassengers(s.payload.passengers); setTimesPerMonth(s.payload.timesPerMonth); }} className="px-2 py-1 bg-blue-600 rounded text-xs">Load</button>
                      <button onClick={() => removeTrip(s.id)} className="px-2 py-1 bg-rose-600 rounded text-xs">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Floating tip + ad spot */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start">
            <div className="flex-1 p-3 bg-slate-700/40 rounded-lg">
              <div className="text-xs text-slate-400">Tip</div>
              <div className="text-sm text-white mt-1">{TIPS[tipIdx]}</div>
            </div>

            
          </div>
        </div>

        {/* About / FAQ section */}
         <div className="">
          <h2 className="text-3xl font-bold text-white mb-4">Fuel Cost Calculator – Estimate, Compare & Save on Fuel Expenses</h2>
          <h3 className="text-xl font-semibold text-yellow-400 mb-2">What Is a Fuel Cost Calculator?</h3>
          <div className="space-y-4 text-slate-300">
            <p>
              A <strong>Fuel Cost Calculator</strong> helps you accurately estimate how much money you’ll spend on fuel for any trip. 
              Whether you're planning a road trip, calculating daily commute expenses, or comparing vehicles, 
              this free online <strong>fuel expense calculator</strong> provides instant, accurate, and clear cost breakdowns.
            </p>
        
            <p>
              Simply enter your <strong>distance</strong>, <strong>fuel efficiency</strong>, and <strong>fuel price</strong> 
              to get an instant result. Our tool also includes advanced features such as toll cost entry, passenger splitting, 
              and monthly or yearly cost projections for regular travelers.
            </p>
        
            <p>
              The <strong>CalculatorHub Fuel Cost Calculator</strong> is 100% free, easy to use, and designed to help drivers, businesses, and fleet owners 
              budget their trips smartly while reducing unnecessary fuel expenses.
            </p>
        
            <h2 className="text-yellow-500 font-semibold mt-6">Why You Should Use a Fuel Cost Calculator</h2>
            <p>
              Using this calculator allows you to plan smarter trips, compare vehicles, and understand where your money goes. 
              It’s perfect for budgeting travel expenses, managing business mileage reimbursements, and tracking gas consumption 
              for personal or professional use.
            </p>
        
            <h2 className="text-yellow-500 font-semibold mt-6">Main Benefits</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Accurate Fuel Estimates:</strong> Get real-time trip fuel cost based on your efficiency and fuel price.</li>
              <li><strong>Vehicle Comparison:</strong> Instantly compare two vehicles’ fuel costs side-by-side.</li>
              <li><strong>Monthly & Yearly Projection:</strong> Know how much you’ll spend on fuel over time.</li>
              <li><strong>Save & Share Trips:</strong> Store past trips locally or generate shareable links with one click.</li>
              <li><strong>Advanced Options:</strong> Include tolls, passengers, and other additional costs easily.</li>
              <li><strong>Cross-Unit Support:</strong> Switch between kilometers/miles and L/100km, km/L, or MPG.</li>
            </ul>
        
            <h2 className="text-yellow-500 font-semibold mt-6">How to Use the Calculator</h2>
            <p>Follow these simple steps to calculate your fuel costs quickly:</p>
            <ul className="list-decimal list-inside space-y-2 ml-4">
              <li>Enter the total distance of your trip and select the unit (km or miles).</li>
              <li>Provide your vehicle’s fuel efficiency and choose its format (L/100km, km/L, or MPG).</li>
              <li>Enter the current fuel price per liter or gallon and add any toll or extra cost if applicable.</li>
              <li>Optionally input trips per month to estimate your monthly and yearly expenses.</li>
              <li>Click “Save Trip” to store your data or “Share” to generate a link you can send to others.</li>
            </ul>
        
            <p>In just a few seconds, you’ll get a complete cost summary with charts, comparisons, and breakdowns for easy understanding.</p>
        
            <h2 className="text-yellow-500 font-semibold mt-6">Features Explained</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Fuel Cost Estimator:</strong> Calculates total fuel and per-distance costs based on your input.</li>
              <li><strong>Vehicle Comparison Mode:</strong> Compare Vehicle A and B costs visually with a bar chart.</li>
              <li><strong>Save Trips Locally:</strong> Save up to 20 trips directly in your browser (no login needed).</li>
              <li><strong>Dynamic Share Links:</strong> Share your trip details with anyone using a unique URL.</li>
              <li><strong>Advanced Cost Inputs:</strong> Add tolls, extra costs, passengers, and frequency to refine your results.</li>
              <li><strong>Charts and Graphs:</strong> View easy-to-read Pie and Bar charts for expense visualization.</li>
            </ul>
        
            <p>
              With CalculatorHub’s Fuel Cost Calculator, you can make smarter travel decisions, 
              compare cars effectively, and manage your transportation budget like a pro.
            </p>
        
            <AdBanner type="bottom" />
        
            <section className="space-y-4 mt-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)</h2>
              <div className="space-y-4 text-lg text-slate-100 leading-relaxed">
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q1:</span> What is a Fuel Cost Calculator?</h3>
                  <p>This is a free online tool that helps you calculate your total trip cost based on distance, vehicle fuel efficiency, and fuel price.</p>
                </div>
        
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q2:</span> How does the fuel cost calculator work?</h3>
                  <p>It multiplies the distance by your vehicle’s fuel consumption rate and fuel price, then adds tolls and other costs to give a precise estimate.</p>
                </div>
        
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q3:</span> Can I compare two vehicles?</h3>
                  <p>Yes, the Compare Mode lets you see which vehicle is more efficient with visual charts and exact cost differences.</p>
                </div>
        
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q4:</span> Does it work for both kilometers and miles?</h3>
                  <p>Absolutely! You can switch between km/miles and L/100km, km/L, or MPG for full flexibility.</p>
                </div>
        
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q5:</span> Can I save or share my trip results?</h3>
                  <p>Yes! You can save trips in your browser or share them using auto-generated links—no signup required.</p>
                </div>
        
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q6:</span> Is this tool free to use?</h3>
                  <p>Yes, the CalculatorHub Fuel Cost Calculator is completely free, ad-supported, and works across all devices.</p>
                </div>
        
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q7:</span> How can I save money on fuel?</h3>
                  <p>Maintain proper tire pressure, avoid harsh acceleration, plan routes efficiently, and compare cars with this calculator to choose the most fuel-efficient option.</p>
                </div>
              </div>
            </section>
        

          </div>
        </div>

            <AdBanner type="bottom" />

        <RelatedCalculators currentPath="/fuel-cost-calculator" />
      </div>
    </>
  );
};

export default FuelCostCalculator;
