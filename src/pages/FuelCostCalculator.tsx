import React, { useEffect, useMemo, useState } from 'react';
import { Fuel, MapPin, Car, Share2 } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

/**
 * NOTES:
 * - Requires `recharts` package: `npm install recharts`
 * - Optional: provide Google Maps JS API key to enable automatic distance lookup.
 * - Persists saved trips to localStorage under 'ch_saved_trips'
 */

/* Minimal helper to load Google Maps JS SDK dynamically */
const loadGoogleMaps = (apiKey: string) =>
  new Promise<void>((resolve, reject) => {
    if (!apiKey) return reject('No API key');
    if ((window as any).google && (window as any).google.maps) return resolve();
    const id = 'calculatorhub-google-maps';
    if (document.getElementById(id)) {
      const check = setInterval(() => {
        if ((window as any).google && (window as any).google.maps) {
          clearInterval(check);
          resolve();
        }
      }, 200);
      return;
    }
    const s = document.createElement('script');
    s.id = id;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });

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
    origin?: string;
    destination?: string;
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

  // Map / search
  const [useMapKey, setUseMapKey] = useState<string>(''); // user-provided Google Maps JS API key (optional)
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [mapLoading, setMapLoading] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);

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
      q: 'How to get distance from a map?',
      a: 'Provide a Google Maps JavaScript API key and enter origin & destination — the calculator will attempt to compute route distance.',
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

  // Recalculate whenever inputs change
  useEffect(() => {
    try {
      const fuelNeeded = calcFuelNeeded(distance, distanceUnit, fuelEfficiency, efficiencyUnit);
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

  // Pie data for charts
  const pieData = useMemo(
    () => [
      { name: 'Fuel', value: Math.round(results.fuelNeeded * fuelPrice * 100) / 100 },
      { name: 'Tolls', value: tolls },
      { name: 'Other', value: otherCost },
    ],
    [results, fuelPrice, tolls, otherCost]
  );
  const COLORS = ['#3b82f6', '#22c55e', '#f97316'];

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
        origin,
        destination,
      },
    };
    persistTrips([trip, ...savedTrips].slice(0, 20));
  };

  const removeTrip = (id: string) => {
    persistTrips(savedTrips.filter((s) => s.id !== id));
  };

  // Share URL generator
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
      origin,
      destination,
    };
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
      const org = maybe('origin'); if (org) setOrigin(org);
      const dst = maybe('destination'); if (dst) setDestination(dst);
    }
  }, []);

  // Google Maps Directions route & distance compute (client-side)
  const computeDistanceFromMap = async () => {
    setMapError(null);
    if (!useMapKey) {
      setMapError('Please provide Google Maps JS API key to enable distance lookup.');
      return;
    }
    if (!origin || !destination) {
      setMapError('Please enter both origin and destination.');
      return;
    }
    setMapLoading(true);
    try {
      await loadGoogleMaps(useMapKey);
      // @ts-ignore
      const directionsService = new (window as any).google.maps.DirectionsService();
      directionsService.route(
        {
          origin,
          destination,
          travelMode: 'DRIVING',
        },
        (response: any, status: string) => {
          setMapLoading(false);
          if (status === 'OK' && response) {
            try {
              // sum legs distance
              const legs = response.routes[0].legs || [];
              let meters = 0;
              for (const leg of legs) meters += leg.distance.value || 0;
              const km = meters / 1000;
              // set distance in current unit
              const finalDistance = distanceUnit === 'km' ? km : +(km / 1.60934).toFixed(3);
              setDistance(finalDistance);
            } catch (e) {
              setMapError('Failed to parse route distance.');
            }
          } else {
            setMapError('Could not find route. Try clearer origin/destination names.');
          }
        }
      );
    } catch (e) {
      setMapLoading(false);
      setMapError('Failed to load Google Maps. Check API key and referer restrictions.');
    }
  };

  // Open Google Maps directions
  const openMapsDirections = (o?: string, d?: string) => {
    const orig = encodeURIComponent(o || origin || '');
    const dest = encodeURIComponent(d || destination || '');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${orig}&destination=${dest}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // Monthly & yearly
  const monthlyCost = +(results.totalCost * timesPerMonth).toFixed(2);
  const yearlyCost = +(monthlyCost * 12).toFixed(2);

  // tiny helpers
  const formatCurrency = (val: number) => `${currencySymbol}${val}`;

  // Small UI: rotate random tip
  useEffect(() => {
    const t = setInterval(() => {
      setTipIdx((i) => (i + 1) % TIPS.length);
    }, 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <SEOHead
        title={seoData.fuelCostCalculator?.title || 'Fuel Cost Calculator - Calculate Trip Fuel Expenses'}
        description={seoData.fuelCostCalculator?.description || 'Calculate fuel costs for your trips. Enter distance, fuel efficiency, and price to get accurate fuel expense estimates.'}
        canonical="https://calculatorhub.site/fuel-cost-calculator"
        schemaData={generateCalculatorSchema(
          'Fuel Cost Calculator',
          'Calculate fuel costs for trips and journeys',
          '/fuel-cost-calculator',
          ['fuel cost calculator', 'gas calculator', 'trip cost', 'fuel consumption', 'mpg calculator']
        )}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Fuel Cost Calculator', url: '/fuel-cost-calculator' }
        ]}
      />

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

            <div className="flex gap-2 items-center">
              <button
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center gap-2"
                onClick={() => {
                  navigator.clipboard?.writeText(buildShareUrl());
                  alert('Shareable URL copied to clipboard');
                }}
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
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
              <div className="flex gap-3">
                <input
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  maxLength={3}
                  className="w-24 px-4 py-3 text-center bg-slate-700 text-white rounded-lg border border-slate-600"
                />
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(Number(e.target.value))}
                  className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600"
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

            {/* Map & auto distance */}
            <div className="bg-slate-700/40 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-2">Map Distance (optional)</h4>
              <p className="text-xs text-slate-300 mb-2">Provide Google Maps JS API key to allow automatic distance lookup</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  placeholder="Google Maps JS API Key (optional)"
                  className="sm:col-span-2 px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                  value={useMapKey}
                  onChange={(e) => setUseMapKey(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex-1"
                    onClick={() => computeDistanceFromMap()}
                    disabled={mapLoading}
                  >
                    {mapLoading ? 'Calculating...' : 'Compute Distance'}
                  </button>
                  <button
                    className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md"
                    onClick={() => { setOrigin(''); setDestination(''); setMapError(null); }}
                    title="clear"
                  >
                    Clear
                  </button>
                </div>
                <input
                  placeholder="Origin (e.g., Dhaka)"
                  className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                />
                <input
                  placeholder="Destination (e.g., Chittagong)"
                  className="px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
                <div className="sm:col-span-3 flex gap-2">
                  <button className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex-1" onClick={() => openMapsDirections()}>Open in Google Maps</button>
                  <button className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md" onClick={() => {
                    const url = buildShareUrl();
                    navigator.clipboard?.writeText(url);
                    alert('Shareable URL copied to clipboard');
                  }}>Copy Share URL</button>
                </div>

                {mapError && <p className="text-xs text-rose-400 col-span-3">{mapError}</p>}
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
                      <button onClick={() => { /* load into UI */ setDistance(s.payload.distance); setDistanceUnit(s.payload.distanceUnit); setFuelEfficiency(s.payload.fuelEfficiency); setEfficiencyUnit(s.payload.efficiencyUnit); setFuelPrice(s.payload.fuelPrice); setCurrencySymbol(s.payload.currencySymbol); setTolls(s.payload.tolls); setOtherCost(s.payload.otherCost); setPassengers(s.payload.passengers); setTimesPerMonth(s.payload.timesPerMonth); setOrigin(s.payload.origin || ''); setDestination(s.payload.destination || ''); }} className="px-2 py-1 bg-blue-600 rounded text-xs">Load</button>
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

            <div className="w-full sm:w-64">
              {/* Ad placeholder — keep your AdBanner component or replace with AdSense snippet */}
              <AdBanner />
            </div>
          </div>
        </div>

        {/* About / FAQ section */}
        <div className="glow-card rounded-2xl p-5 sm:p-8 mb-8 bg-slate-800/70">
          <h2 className="text-xl font-bold text-white mb-3">About Fuel Cost Calculator</h2>
          <p className="text-sm text-slate-300 mb-4">
            Calculate the fuel costs for your trips with precision. Our fuel cost calculator helps you
            budget for road trips, daily commutes, and business travel by estimating fuel consumption
            and total expenses.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">How to Use</h3>
              <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
                <li>Enter the distance or compute using the map option.</li>
                <li>Input your vehicle's fuel efficiency and the current fuel price.</li>
                <li>Use Advanced settings for tolls, other costs, passengers and frequency.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-2">FAQ</h3>
              <div className="space-y-2 text-sm">
                {FAQS.map((f, i) => (
                  <div key={i}>
                    <div className="text-slate-200 font-medium">{f.q}</div>
                    <div className="text-slate-400 text-xs">{f.a}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <RelatedCalculators currentPath="/fuel-cost-calculator" />
      </div>
    </>
  );
};

export default FuelCostCalculator;
