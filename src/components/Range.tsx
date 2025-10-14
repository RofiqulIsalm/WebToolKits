import React, { useState } from "react";

interface RangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

const Range: React.FC<RangeProps> = ({ label, value, min, max, step = 1, onChange }) => {
  const [tempValue, setTempValue] = useState<number>(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempValue(Number(e.target.value));
  };

  const commitChange = () => {
    onChange(tempValue);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          value={tempValue}
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          onMouseUp={commitChange}
          onTouchEnd={commitChange}
          className="w-full accent-cyan-500 cursor-pointer"
        />
        <span className="text-slate-200 text-sm font-semibold w-16 text-right">
          {tempValue.toFixed(0)}
        </span>
      </div>
    </div>
  );
};

export default Range;
