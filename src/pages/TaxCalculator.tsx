import React, { useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { seoData, generateCalculatorSchema } from '../utils/seoData';

const TextUtils: React.FC = () => {
  const tabs = [
    'Text Counter',
    'Text Reverser',
    'Lorem Ipsum Generator',
    'Binary Converter',
    'Palindrome Checker',
    'Number to Words Converter'
  ];

  const [activeTab, setActiveTab] = useState('Text Counter');
  const [text, setText] = useState('');
  const [result, setResult] = useState('');

  // Case converters
  const convertCase = (type: string) => {
    switch(type) {
      case 'upper': return setText(text.toUpperCase());
      case 'lower': return setText(text.toLowerCase());
      case 'title': return setText(text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase()));
      case 'sentence': return setText(text.replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase()));
      case 'capitalize': return setText(text.charAt(0).toUpperCase() + text.slice(1));
      default: return;
    }
  };

  // Tab features
  const handleAction = () => {
    switch(activeTab){
      case 'Text Counter':
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        const chars = text.length;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        setResult(`Words: ${words} | Characters: ${chars} | Sentences: ${sentences}`);
        break;

      case 'Text Reverser':
        setResult(text.split('').reverse().join(''));
        break;

      case 'Lorem Ipsum Generator':
        const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
        setResult(lorem);
        break;

      case 'Binary Converter':
        if (/^[01\s]+$/.test(text.trim())) {
          // Binary to Text
          try {
            const txt = text.trim().split(' ').map(b => String.fromCharCode(parseInt(b,2))).join('');
            setResult(txt);
          } catch(e) { setResult('Invalid binary input'); }
        } else {
          // Text to Binary
          const bin = text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ');
          setResult(bin);
        }
        break;

      case 'Palindrome Checker':
        const clean = text.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
        const isPalindrome = clean === clean.split('').reverse().join('');
        setResult(isPalindrome ? '✅ This is a palindrome!' : '❌ Not a palindrome');
        break;

      case 'Number to Words Converter':
        const numberToWords = (num: number) => {
          if (isNaN(num)) return 'Invalid number';
          const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
          const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
          const n = ('000000000'+num).slice(-9).match(/(\d{2})(\d{3})(\d{3})/);
          if(!n) return '';
          let str = '';
          if (Number(n[1]) !== 0) str += a[Number(n[1])] + ' Crore '; 
          if (Number(n[2].slice(0,2)) !== 0) str += (b[Number(n[2].slice(0,1))]+' '+a[Number(n[2].slice(1,2))]) + ' Lakh '; 
          if (Number(n[3].slice(0,2)) !== 0) str += (b[Number(n[3].slice(0,1))]+' '+a[Number(n[3].slice(1,2))]) + ' Thousand '; 
          if (Number(n[3].slice(2,3)) !== 0) str += a[Number(n[3].slice(2,3))];
          return str.trim();
        };
        setResult(numberToWords(Number(text)));
        break;

      default: break;
    }
  };

  return (
    <>
      <SEOHead
        title={seoData.textUtils.title}
        description={seoData.textUtils.description}
        canonical="https://calculatorhub.com/text-utils"
        schemaData={generateCalculatorSchema(
          "Text Utility Tools",
          seoData.textUtils.description,
          "/text-utils",
          seoData.textUtils.keywords
        )}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Text Utilities', url: '/text-utils' }
        ]}
      />
      <div className="max-w-4xl mx-auto px-4">
        <Breadcrumbs items={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Text Utilities', url: '/text-utils' }
        ]} />

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Text Utility Tools</h1>
          <p className="text-slate-300">Multi-purpose text tools: counter, reverser, binary converter, palindrome check, lorem ipsum generator, and number to words.</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap mb-6 border-b border-gray-300">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => {setActiveTab(tab); setResult('');}}
              className={`px-4 py-2 -mb-px ${activeTab===tab ? 'border-b-2 border-blue-600 text-blue-600 font-semibold' : 'text-gray-400 hover:text-blue-500'}`}
            >{tab}</button>
          ))}
        </div>

        {/* Input area */}
        <div className="mb-4">
          <textarea
            rows={6}
            value={text}
            onChange={(e)=>setText(e.target.value)}
            className="w-full p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            placeholder="Enter your text here..."
          />
        </div>

        {/* Case Converter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={()=>convertCase('upper')} className="px-3 py-1 bg-blue-600 text-white rounded">UPPERCASE</button>
          <button onClick={()=>convertCase('lower')} className="px-3 py-1 bg-blue-600 text-white rounded">lowercase</button>
          <button onClick={()=>convertCase('title')} className="px-3 py-1 bg-blue-600 text-white rounded">Title Case</button>
          <button onClick={()=>convertCase('sentence')} className="px-3 py-1 bg-blue-600 text-white rounded">Sentence case</button>
          <button onClick={()=>convertCase('capitalize')} className="px-3 py-1 bg-blue-600 text-white rounded">Capitalize</button>
          <button onClick={()=>{setText(''); setResult('');}} className="px-3 py-1 bg-red-500 text-white rounded flex items-center gap-1">Clear <RefreshCw className="w-4 h-4"/></button>
        </div>

        {/* Action button */}
        <div className="mb-4">
          <button onClick={handleAction} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">Generate Result</button>
        </div>

        {/* Result display */}
        {result && (
          <div className="p-4 bg-gray-100 rounded-lg mb-6 relative">
            <pre className="whitespace-pre-wrap text-gray-900">{result}</pre>
            <button onClick={()=>navigator.clipboard.writeText(result)} className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"><Copy className="w-5 h-5" /></button>
          </div>
        )}

        <AdBanner type="bottom" />
        <RelatedCalculators currentPath="/text-utils" category="misc-tools" />
      </div>
    </>
  );
};

export default TextUtils;
