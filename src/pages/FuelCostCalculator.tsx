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
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Fuel
