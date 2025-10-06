import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';

const FuelCostCalculatorCalc: React.FC = () => {
  const [distance, setDistance] = useState<number>(100);
  const [unit, setUnit] = useState<'km' | 'miles'>('km');
  const [fuelEfficiency, setFuelEfficiency] = useState<number>(8);
  const [efficiencyUnit, setEfficiencyUnit] = useState<'l/100km' | 'mpg' | 'km/l'>('l/100km');
  const [fuelPrice, setFuelPrice] = useState<number>(1.50);
  const [currency, setCurrency] = useState<string>('$');
  const [compareMode, setCompareMode] = useState<boolean>(false);

  const [vehicle2Efficiency, setVehicle2Efficiency] = useState<number>(6);
  const [tollCost, setTollCost] = useState<number>(0);

  const calculateFuelNeeded = (dist: number, eff: number): number => {
    const distInKm = unit === 'miles' ? dist * 1.60934 : dist;

    switch (efficiencyUnit) {
      case 'l/100km':
        return (distInKm / 100) * eff;
      case 'mpg':
        const distInMiles = distInKm / 1.60934;
        return (distInMiles / eff) * 3.78541;
      case 'km/l':
        return distInKm / eff;
      default:
        return 0;
    }
  };

  const fuelNeeded = calculateFuelNeeded(distance, fuelEfficiency);
  const fuelCost = fuelNeeded * fuelPrice;
  const totalCost = fuelCost + tollCost;
  const costPerKm = totalCost / (unit === 'miles' ? distance * 1.60934 : distance);
  const costPerMile = costPerKm * 1.60934;

  const vehicle2FuelNeeded = calculateFuelNeeded(distance, vehicle2Efficiency);
  const vehicle2FuelCost = vehicle2FuelNeeded * fuelPrice;
  const vehicle2TotalCost = vehicle2FuelCost + tollCost;

  const fuelPercent = (fuelCost / totalCost) * 100;
  const tollPercent = (tollCost / totalCost) * 100;

  const openGoogleMaps = () => {
    window.open('https://www.google.com/maps/dir/', '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <label className="flex items-center space-x-2 text-white cursor-pointer">
          <input
            type="checkbox"
            checked={compareMode}
            onChange={(e) => setCompareMode(e.target.checked)}
            className="w-4 h-4"
          />
          <span>Compare two vehicles</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Vehicle 1 Settings</h3>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="$">$ USD</option>
              <option value="€">€ EUR</option>
              <option value="£">£ GBP</option>
              <option value="¥">¥ JPY</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Distance</label>
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as 'km' | 'miles')}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="km">Kilometers</option>
                <option value="miles">Miles</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Fuel Efficiency</label>
              <input
                type="number"
                step={0.1}
                value={fuelEfficiency}
                onChange={(e) => setFuelEfficiency(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Unit</label>
              <select
                value={efficiencyUnit}
                onChange={(e) => setEfficiencyUnit(e.target.value as 'l/100km' | 'mpg' | 'km/l')}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="l/100km">L/100km</option>
                <option value="mpg">MPG</option>
                <option value="km/l">km/L</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Fuel Price ({currency}/L)
            </label>
            <input
              type="number"
              step={0.01}
              value={fuelPrice}
              onChange={(e) => setFuelPrice(Number(e.target.value))}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Toll Costs ({currency})
            </label>
            <input
              type="number"
              step={0.01}
              value={tollCost}
              onChange={(e) => setTollCost(Number(e.target.value))}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {compareMode && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Vehicle 2 Efficiency ({efficiencyUnit})
              </label>
              <input
                type="number"
                step={0.1}
                value={vehicle2Efficiency}
                onChange={(e) => setVehicle2Efficiency(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <button
            onClick={openGoogleMaps}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open Google Maps</span>
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Results</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl border border-blue-500/30">
              <div className="text-sm text-slate-400 mb-1">Fuel Needed</div>
              <div className="text-2xl font-bold text-white">{fuelNeeded.toFixed(2)} L</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl border border-green-500/30">
              <div className="text-sm text-slate-400 mb-1">Fuel Cost</div>
              <div className="text-2xl font-bold text-white">{currency}{fuelCost.toFixed(2)}</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl border border-purple-500/30">
              <div className="text-sm text-slate-400 mb-1">Total Cost</div>
              <div className="text-2xl font-bold text-white">{currency}{totalCost.toFixed(2)}</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-orange-900/30 to-orange-800/30 rounded-xl border border-orange-500/30">
              <div className="text-sm text-slate-400 mb-1">Cost/km</div>
              <div className="text-2xl font-bold text-white">{currency}{costPerKm.toFixed(3)}</div>
            </div>
          </div>

          {totalCost > 0 && (
            <div className="p-4 bg-slate-800 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-3">Cost Breakdown</h4>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Fuel</span>
                    <span>{fuelPercent.toFixed(1)}%</span>
                  </div>
                  <div className="h-6 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${fuelPercent}%` }}
                    ></div>
                  </div>
                </div>
                {tollCost > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Tolls</span>
                      <span>{tollPercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-6 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${tollPercent}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {compareMode && (
            <div className="p-4 bg-slate-800 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-3">Vehicle Comparison</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                  <div>
                    <div className="text-sm text-slate-400">Vehicle 1</div>
                    <div className="text-xl font-bold text-white">{currency}{totalCost.toFixed(2)}</div>
                  </div>
                  <div className="text-xs text-slate-400">{fuelEfficiency} {efficiencyUnit}</div>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                  <div>
                    <div className="text-sm text-slate-400">Vehicle 2</div>
                    <div className="text-xl font-bold text-white">{currency}{vehicle2TotalCost.toFixed(2)}</div>
                  </div>
                  <div className="text-xs text-slate-400">{vehicle2Efficiency} {efficiencyUnit}</div>
                </div>
                <div className="pt-2 border-t border-slate-600">
                  <div className="text-sm text-slate-400">Savings with better vehicle:</div>
                  <div className={`text-lg font-bold ${vehicle2TotalCost < totalCost ? 'text-green-400' : 'text-red-400'}`}>
                    {currency}{Math.abs(totalCost - vehicle2TotalCost).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FuelCostCalculatorCalc;
