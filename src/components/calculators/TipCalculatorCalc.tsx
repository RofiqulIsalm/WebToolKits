import React, { useState, useEffect } from 'react';

const TipCalculatorCalc: React.FC = () => {
  const [bill, setBill] = useState<number>(100);
  const [tipPercent, setTipPercent] = useState<number>(15);
  const [people, setPeople] = useState<number>(1);
  const [currency, setCurrency] = useState<string>('$');

  const tipAmount = (bill * tipPercent) / 100;
  const total = bill + tipAmount;
  const perPerson = total / people;

  const billPercent = (bill / total) * 100;
  const tipPercentOfTotal = (tipAmount / total) * 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Inputs</h3>

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
              <option value="₹">₹ INR</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Bill Amount ({currency})</label>
            <input
              type="number"
              value={bill}
              onChange={(e) => setBill(Number(e.target.value))}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Tip Percentage: {tipPercent}%</label>
            <input
              type="range"
              min={0}
              max={50}
              value={tipPercent}
              onChange={(e) => setTipPercent(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Number of People</label>
            <input
              type="number"
              min={1}
              value={people}
              onChange={(e) => setPeople(Number(e.target.value))}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Results</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl border border-blue-500/30">
              <div className="text-sm text-slate-400 mb-1">Tip Amount</div>
              <div className="text-2xl font-bold text-white">{currency}{tipAmount.toFixed(2)}</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl border border-green-500/30">
              <div className="text-sm text-slate-400 mb-1">Total</div>
              <div className="text-2xl font-bold text-white">{currency}{total.toFixed(2)}</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl border border-purple-500/30 col-span-2">
              <div className="text-sm text-slate-400 mb-1">Per Person</div>
              <div className="text-3xl font-bold text-white">{currency}{perPerson.toFixed(2)}</div>
            </div>
          </div>

          <div className="p-4 bg-slate-800 rounded-lg">
            <h4 className="text-sm font-semibold text-white mb-3">Distribution Chart</h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Bill</span>
                  <span>{billPercent.toFixed(1)}%</span>
                </div>
                <div className="h-6 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${billPercent}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Tip</span>
                  <span>{tipPercentOfTotal.toFixed(1)}%</span>
                </div>
                <div className="h-6 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${tipPercentOfTotal}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TipCalculatorCalc;
