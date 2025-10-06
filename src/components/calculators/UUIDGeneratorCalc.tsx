import React, { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';

const UUIDGeneratorCalc: React.FC = () => {
  const [version, setVersion] = useState<'v1' | 'v4' | 'v5'>('v4');
  const [count, setCount] = useState<number>(1);
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [uuids, setUuids] = useState<Array<{ uuid: string; timestamp?: string }>>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateV4UUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const generateV1UUID = (): { uuid: string; timestamp: string } => {
    const now = Date.now();
    const timestamp = new Date(now).toISOString();
    const timeHex = now.toString(16).padStart(16, '0');
    const uuid = `${timeHex.slice(8)}-${timeHex.slice(4, 8)}-1${timeHex.slice(1, 4)}-${Math.random().toString(16).slice(2, 6)}-${Math.random().toString(16).slice(2, 14)}`;
    return { uuid, timestamp };
  };

  const generateV5UUID = (namespace: string = 'default'): string => {
    const hash = namespace.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const hex = Math.abs(hash).toString(16).padStart(32, '0');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  };

  const generate = () => {
    const generated: Array<{ uuid: string; timestamp?: string }> = [];

    for (let i = 0; i < count; i++) {
      if (version === 'v1') {
        const v1Result = generateV1UUID();
        generated.push(v1Result);
      } else if (version === 'v4') {
        generated.push({ uuid: generateV4UUID() });
      } else if (version === 'v5') {
        generated.push({ uuid: generateV5UUID(`namespace-${i}`) });
      }
    }

    setUuids(generated.map(item => ({
      ...item,
      uuid: uppercase ? item.uuid.toUpperCase() : item.uuid
    })));
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAll = () => {
    const allUuids = uuids.map(item => item.uuid).join('\n');
    navigator.clipboard.writeText(allUuids);
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadAsFile = () => {
    const content = uuids.map(item => item.uuid).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'uuids.txt';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Settings</h3>

          <div>
            <label className="block text-sm font-medium text-white mb-2">UUID Version</label>
            <select
              value={version}
              onChange={(e) => setVersion(e.target.value as 'v1' | 'v4' | 'v5')}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="v1">Version 1 (Timestamp-based)</option>
              <option value="v4">Version 4 (Random)</option>
              <option value="v5">Version 5 (Namespace-based)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Count: {count}
            </label>
            <input
              type="range"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <label className="flex items-center space-x-2 text-white cursor-pointer">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Uppercase</span>
          </label>

          <button
            onClick={generate}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Generate UUIDs
          </button>

          {uuids.length > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={copyAll}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                {copiedIndex === -1 ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copiedIndex === -1 ? 'Copied!' : 'Copy All'}</span>
              </button>
              <button
                onClick={downloadAsFile}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Save .txt</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Generated UUIDs ({uuids.length})</h3>
          {uuids.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {uuids.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <code className="text-slate-200 font-mono text-sm flex-1 break-all">{item.uuid}</code>
                    <button
                      onClick={() => copyToClipboard(item.uuid, index)}
                      className="ml-3 p-2 hover:bg-slate-600 rounded transition-colors"
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                  {item.timestamp && version === 'v1' && (
                    <div className="text-xs text-slate-400 px-3">
                      Timestamp: {item.timestamp}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              Click generate to create UUIDs
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UUIDGeneratorCalc;
