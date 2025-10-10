import React, { useEffect, useRef, useState } from 'react';
import { FileText, ChevronDown } from 'lucide-react';
import { toWords } from 'number-to-words';
import { motion, AnimatePresence } from 'framer-motion';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

// ----------------- Lorem Sentences -----------------
const loremSentences = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'Nullam sodales at mi id laoreet.',
  'Ut eget neque viverra, laoreet mi eu, pulvinar felis.',
  'Nunc quis lobortis mi.',
  'Integer eget massa cursus leo varius ullamcorper.',
  'In sit amet aliquet erat.',
  'Donec in viverra sapien.',
  'Mauris congue quam ut sollicitudin tempus.',
  'Maecenas vulputate erat et quam ullamcorper, ac gravida velit mollis.',
  'Aenean consectetur mauris in odio commodo porta.',
  'In vel neque sit amet dui pharetra bibendum.',
  'Mauris lacinia ex eu ante pharetra, a malesuada dolor volutpat.',
  'Sed rhoncus, libero at maximus vestibulum, ante justo facilisis felis, a dapibus eros arcu vitae purus.',
  'Duis facilisis metus blandit leo consequat, at tincidunt eros finibus.',
  'In tincidunt, quam sed bibendum vulputate, justo metus sagittis erat, in finibus erat sem at est.',
  'Quisque nec risus vitae erat interdum elementum vitae at dui.',
  'Donec quis consectetur ligula, ullamcorper eleifend ligula.',
  'Fusce venenatis aliquam suscipit.',
  'Donec venenatis sapien nec erat tincidunt facilisis.',
  'Duis dui purus, finibus sit amet dapibus sit amet, tristique ut ante.',
  'Vivamus viverra sem eu dolor fermentum, quis semper risus fringilla.',
  'In interdum consequat mauris at mollis.'
];

// ----------------- Helpers -----------------
function generateLoremWords(wordCount: number) {
  const out: string[] = [];
  while (out.join(' ').split(/\s+/).filter(Boolean).length < wordCount) {
    const sentence = loremSentences[Math.floor(Math.random() * loremSentences.length)];
    out.push(sentence);
  }
  return out
    .join(' ')
    .split(/\s+/)
    .slice(0, wordCount)
    .join(' ');
}

const TextToolsPage: React.FC = () => {
  // ----------------- Tabs -----------------
  const [selectedTab, setSelectedTab] = useState<'textCounter' | 'loremIpsum' | 'binarytotext' | 'numberConverter'>('textCounter');

  // ----------------- Text Counter state -----------------
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [reverseDropdownOpen, setReverseDropdownOpen] = useState(false);
  const reverseDropdownRef = useRef<HTMLDivElement>(null);
  const convertCaseDropdownRef = useRef<HTMLDivElement>(null);
  const loremDropdownRef = useRef<HTMLDivElement>(null);

  // ----------------- Lorem Ipsum state (word count based) -----------------
  const [wordCount, setWordCount] = useState(50);
  const [loremText, setLoremText] = useState('');
  const [loremDropdownOpen, setLoremDropdownOpen] = useState(false);

  // ----------------- Binary tab -----------------
  const [binaryText, setBinaryText] = useState('');

  // ----------------- Number ↔ Words -----------------
  const [numberInput, setNumberInput] = useState('');
  const [numberResult, setNumberResult] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);

  // ----------------- Close dropdowns when clicking outside -----------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (reverseDropdownRef.current && !reverseDropdownRef.current.contains(target) && reverseDropdownOpen) {
        setReverseDropdownOpen(false);
      }
      if (convertCaseDropdownRef.current && !convertCaseDropdownRef.current.contains(target) && dropdownOpen) {
        setDropdownOpen(false);
      }
      if (loremDropdownRef.current && !loremDropdownRef.current.contains(target) && loremDropdownOpen) {
        setLoremDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [reverseDropdownOpen, dropdownOpen, loremDropdownOpen]);

  // ----------------- Text Counter Stats (debounced) -----------------
  const [stats, setStats] = useState({
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0,
    lines: 0,
    readingTime: 0,
    palindromeWords: 0
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const characters = text.length;
      const charactersNoSpaces = text.replace(/\s/g, '').length;
      const wordsArray = text.trim() === '' ? [] : text.trim().split(/\s+/);
      const words = wordsArray.length;
      const sentences = text.trim() === '' ? 0 : (text.match(/[^.!?]+[.!?]?/g) || []).length;
      const paragraphs = text.trim() === '' ? 0 : text.split(/\n\n+/).filter((p) => p.trim().length > 0).length;
      const lines = text === '' ? 0 : text.split(/\n/).length;
      const readingTime = Math.max(1, Math.ceil(words / 200));
      const palindromeWords = wordsArray.filter((word) => {
        const clean = word.replace(/[^a-z0-9]/gi, '').toLowerCase();
        return clean.length > 1 && clean === clean.split('').reverse().join('');
      }).length;
      setStats({ characters, charactersNoSpaces, words, sentences, paragraphs, lines, readingTime, palindromeWords });
    }, 160);
    return () => clearTimeout(timer);
  }, [text]);

  const clearText = () => setText('');

  // ----------------- Reverse text -----------------
  const reverseText = (mode: 'word' | 'sentence' | 'line') => {
    if (!text) return;
    let reversed = '';
    switch (mode) {
      case 'word':
        reversed = text.split(/\s+/).reverse().join(' ');
        break;
      case 'sentence':
        // Split on sentence-like chunks (keeps punctuation), reverse order
        reversed = (text.match(/[^.!?\n]+[.!?]?/g) || [])
          .map((s) => s.trim())
          .filter(Boolean)
          .reverse()
          .join(' ');
        break;
      case 'line':
        reversed = text.split('\n').reverse().join('\n');
        break;
    }
    setText(reversed);
  };

  // ----------------- local store --------------------
  useEffect(() => {
  localStorage.setItem('textToolsInput', text);
  }, [text]);
  useEffect(() => {
    setText(localStorage.getItem('textToolsInput') || '');
  }, []);

  
    // ----------------- Convert Case -----------------
  const convertText = (
    mode: 'upper' | 'lower' | 'title' | 'sentence' | 'clean',
    target: 'text' | 'lorem'
  ) => {
    const sourceText = target === 'text' ? text : loremText;
    let converted = sourceText;
    switch (mode) {
      case 'upper':
        converted = sourceText.toUpperCase();
        break;
      case 'lower':
        converted = sourceText.toLowerCase();
        break;
      case 'title':
        converted = sourceText.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
        break;
      case 'sentence':
        converted = sourceText.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
        break;
      case 'clean':
        converted = sourceText.replace(/\s+/g, ' ').trim();
        break;
    }
    if (target === 'text') setText(converted);
    else setLoremText(converted);
  };

  // ----------------- Clipboard + download helpers -----------------
  const copyTextToClipboard = async (sourceText: string) => {
    if (!sourceText) return;
    try {
      await navigator.clipboard.writeText(sourceText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert('Clipboard not available. Please copy manually.');
    }
  };

  const downloadTextFile = (sourceText: string, filename: string) => {
    if (!sourceText) return;
    const blob = new Blob([sourceText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ----------------- Lorem Ipsum generator (words) -----------------
  const generateLoremIpsum = () => setLoremText(generateLoremWords(Math.max(1, wordCount)));

  // ----------------- Number ↔ Words -----------------
  const convertNumberToWords = () => {
    if (!numberInput) return;
    const num = Number(numberInput);
    if (Number.isNaN(num)) {
      setNumberResult('Invalid number');
      return;
    }
    try {
      setNumberResult(toWords(num));
    } catch {
      setNumberResult('Out of supported range');
    }
  };

  const convertWordsToNumber = () => {
    if (!numberInput) return;
    try {
      const cleaned = numberInput
        .toLowerCase()
        .replace(/-/g, ' ')
        .replace(/,/g, ' ')
        .replace(/ and /g, ' ')
        .trim();

      const units: Record<string, number> = {
        zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
        ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19
      };
      const tens: Record<string, number> = {
        twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90
      };
      const scales: Record<string, number> = { hundred: 100, thousand: 1000, million: 1_000_000 };

      let total = 0;
      let chunk = 0;

      for (const w of cleaned.split(/\s+/)) {
        if (w in units) {
          chunk += units[w];
        } else if (w in tens) {
          chunk += tens[w];
        } else if (w in scales) {
          const scale = scales[w];
          if (scale === 100) {
            chunk = chunk === 0 ? 100 : chunk * 100; // handle lone "hundred"
          } else {
            total += chunk * scale;
            chunk = 0;
          }
        } else if (w.length) {
          throw new Error('bad token');
        }
      }
      const result = total + chunk;
      setNumberResult(String(result));
    } catch {
      setNumberResult('Invalid words');
    }
  };

  const pasteNumberInput = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      setNumberInput(clipText);
    } catch {
      alert('Failed to read clipboard — please allow clipboard access.');
    }
  };

  const copyNumberResult = async () => {
    if (!numberResult) return;
    try {
      await navigator.clipboard.writeText(numberResult);
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 1500);
    } catch {
      alert('Clipboard not available. Please copy manually.');
    }
  };

  const downloadNumberResult = () => {
    if (!numberResult) return;
    const blob = new Blob([numberResult], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'number-converter.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearNumberConverter = () => {
    setNumberInput('');
    setNumberResult('');
  };

  // ----------------- UI Helpers -----------------
  const dropdownCls = (open: boolean) =>
    `${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'} transition transform origin-top duration-150 ease-out`;


  return (
    <>
     <SEOHead
        title={seoData.textCounter?.title || 'Free Online Text Counter | Word, Character & Converter Tool'}
        description={
          seoData.textCounter?.description ||
          'Count characters, words, sentences & paragraphs instantly. Convert text, binary & numbers. Free online text counter tool with generator & case converter.'
        }
        canonical="https://calculatorhub.site/text-tools"
        schemaData={generateCalculatorSchema(
          'Text Tools',
          'Text counter and Lorem Ipsum generator with convert case tools',
          '/text-tools',
          [
            'text counter',
            'lorem ipsum generator',
            'word counter',
            'character counter',
            'online word counter',
            'text analysis tool',
            'binary to text converter',
            'number to text converter',
            'free text tool',
            'case converter',
            'word counter for SEO',
            'reverse text tool',
            'online text editor'
          ]
        )}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Text Tools', url: '/text-tools' }
        ]}
      />


       <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Misc Tools', url: '/category/misc-tools' },
            { name: 'Text Tools', url: '/text-tools' }
          ]}
        />


        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          <button
            className={`px-4 py-2 rounded-xl font-semibold shadow ${
              selectedTab === 'textCounter' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            onClick={() => setSelectedTab('textCounter')}
          >
            Text Counter
          </button>
          <button
            className={`px-4 py-2 rounded-xl font-semibold shadow ${
              selectedTab === 'loremIpsum' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            onClick={() => setSelectedTab('loremIpsum')}
          >
            Lorem Ipsum Generator
          </button>
          <button
            className={`px-4 py-2 rounded-xl font-semibold shadow ${
              selectedTab === 'binarytotext' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            onClick={() => setSelectedTab('binarytotext')}
          >
            Binary ↔ Text
          </button>
          <button
            className={`px-4 py-2 rounded-xl font-semibold shadow ${
              selectedTab === 'numberConverter' ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            onClick={() => setSelectedTab('numberConverter')}
          >
            Number ↔ Words
          </button>
        </div>

         <AnimatePresence mode="wait">
          {selectedTab === 'textCounter' && (
            <motion.div key="textCounter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {/* tab content */}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ----------------- Text Counter ----------------- */}
        {selectedTab === 'textCounter' && (
          <div className="glow-card rounded-2xl p-4 sm:p-6 md:p-8 mb-8 relative border border-slate-700/60 bg-slate-800/40">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-400" />
                <h1 className="text-3xl font-bold text-white">Text Counter</h1>
              </div>
              <button
                onClick={async () => {
                  try {
                    const clipText = await navigator.clipboard.readText();
                    setText(clipText);
                  } catch {
                    alert('Failed to read clipboard — please allow clipboard access.');
                  }
                }}
                className="text-sm text-blue-100 hover:text-white transition-colors bg-slate-800/70 px-3 py-1 rounded-md border border-slate-600"
              >
                Paste
              </button>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full max-w-full h-64 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3 placeholder-slate-400"
              placeholder="Start typing or paste your text here..."
            />

            <div className="flex flex-wrap justify-between items-center mt-2 gap-2">
              {/* Reverse Text Dropdown */}
              <div className="relative" ref={reverseDropdownRef}>
                <button
                  onClick={() => setReverseDropdownOpen((v) => !v)}
                  className="flex items-center text-xs bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded transition shadow"
                  aria-expanded={reverseDropdownOpen}
                  aria-haspopup="menu"
                >
                  Reverse <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                <div
                  className={`absolute left-0 mt-2 w-36 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 ${dropdownCls(
                    reverseDropdownOpen
                  )}`}
                  role="menu"
                >
                  <button onClick={() => reverseText('word')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700" aria-label="Reverse by word">
                    Word
                  </button>
                  <button onClick={() => reverseText('sentence')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700" aria-label="Reverse by sentence">
                    Sentence
                  </button>
                  <button onClick={() => reverseText('line')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700" aria-label="Reverse by line">
                    Line
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 relative">
                {/* Convert Case Dropdown */}
                <div className="relative" ref={convertCaseDropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded transition shadow"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="menu"
                  >
                    Convert Case <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  <div
                    className={`absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 ${dropdownCls(
                      dropdownOpen
                    )}`}
                    role="menu"
                  >
                    <button onClick={() => convertText('upper', 'text')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700" aria-label="Convert to uppercase">
                      🔠 UPPERCASE
                    </button>
                    <button onClick={() => convertText('lower', 'text')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700" aria-label="Convert to lowercase">
                      🔡 lowercase
                    </button>
                    <button onClick={() => convertText('title', 'text')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700" aria-label="Convert to title case">
                      🧾 Title Case
                    </button>
                    <button onClick={() => convertText('sentence', 'text')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700" aria-label="Convert to sentence case">
                      📝 Sentence Case
                    </button>
                    <button onClick={() => convertText('clean', 'text')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700" aria-label="Remove extra spaces">
                      ✂️ Clean Spaces
                    </button>
                  </div>
                </div>

                <button
                  className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded transition shadow"
                  onClick={() => copyTextToClipboard(text)}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  aria-label="Download text file"
                  onClick={() => downloadTextFile(text, 'text-counter.txt')}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded transition shadow"
                >
                  Download
                </button>
                <button aria-label="Clear text area" onClick={clearText} className="text-xs text-red-300 hover:text-red-200 transition-colors">
                  Clear
                </button>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="p-4 bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl border border-blue-500/30">
                <p className="text-sm text-slate-400 mb-1">Characters</p>
                <p className="text-3xl font-bold text-white">{stats.characters.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl border border-purple-500/30">
                <p className="text-sm text-slate-400 mb-1">No Spaces</p>
                <p className="text-3xl font-bold text-white">{stats.charactersNoSpaces.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl border border-green-500/30">
                <p className="text-sm text-slate-400 mb-1">Words</p>
                <p className="text-3xl font-bold text-white">{stats.words.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-900/30 to-orange-800/30 rounded-xl border border-orange-500/30">
                <p className="text-sm text-slate-400 mb-1">Sentences</p>
                <p className="text-3xl font-bold text-white">{stats.sentences.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-pink-900/30 to-pink-800/30 rounded-xl border border-pink-500/30">
                <p className="text-sm text-slate-400 mb-1">Paragraphs</p>
                <p className="text-3xl font-bold text-white">{stats.paragraphs.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-teal-900/30 to-teal-800/30 rounded-xl border border-teal-500/30">
                <p className="text-sm text-slate-400 mb-1">Lines</p>
                <p className="text-3xl font-bold text-white">{stats.lines.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-pink-900/30 to-pink-800/30 rounded-xl border border-pink-500/30">
                <p className="text-sm text-slate-400 mb-1">Palindrome Words</p>
                <p className="text-3xl font-bold text-white">{stats.palindromeWords.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-indigo-900/30 to-indigo-800/30 rounded-xl border border-indigo-500/30 col-span-1">
                <p className="text-sm text-slate-400 mb-1">Reading Time</p>
                <p className="text-3xl font-bold text-white">{stats.readingTime} min{stats.readingTime !== 1 ? 's' : ''}</p>
                <p className="text-xs text-slate-500 mt-1">Based on 200 words/min</p>
              </div>
            </div>
          </div>
        )}


        

         {/* ----------------- Lorem Ipsum Generator ----------------- */}
        {selectedTab === 'loremIpsum' && (
          <div className="glow-card rounded-2xl p-4 sm:p-6 md:p-8 mb-8 relative border border-slate-700/60 bg-slate-800/40">
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="h-8 w-8 text-green-400" />
              <h1 className="text-3xl font-bold text-white">Lorem Ipsum Generator</h1>
            </div>

            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <label className="text-slate-300 text-sm">Word count</label>
              <input
                type="number"
                min={1}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="w-36 px-3 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Word count"
              />
              <button
                onClick={generateLoremIpsum}
                className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded transition shadow"
              >
                Generate
              </button>
            </div>

            <textarea
              value={loremText}
              readOnly
              className="w-full max-w-full h-64 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none mb-3 placeholder-slate-400"
              placeholder="Generated Lorem Ipsum text will appear here..."
            />

            {/* Bottom-right tools */}
            <div className="flex flex-wrap justify-between items-center mt-2 gap-2">
              <p className="text-sm text-slate-400">Modify or download your generated Lorem Ipsum</p>

              <div className="flex flex-wrap items-center gap-2 relative">
                {/* Convert Case Dropdown */}
                <div className="relative" ref={loremDropdownRef}>
                  <button
                    onClick={() => setLoremDropdownOpen((v) => !v)}
                    className="flex items-center text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded transition shadow"
                    aria-expanded={loremDropdownOpen}
                    aria-haspopup="menu"
                  >
                    Convert Case <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  <div
                    className={`absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 ${dropdownCls(
                      loremDropdownOpen
                    )}`}
                    role="menu"
                  >
                    <button onClick={() => convertText('upper', 'lorem')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700" aria-label="Uppercase">
                      🔠 UPPERCASE
                    </button>
                    <button onClick={() => convertText('lower', 'lorem')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700" aria-label="Lowercase">
                      🔡 lowercase
                    </button>
                    <button onClick={() => convertText('title', 'lorem')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700" aria-label="Title case">
                      🧾 Title Case
                    </button>
                    <button onClick={() => convertText('sentence', 'lorem')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700" aria-label="Sentence case">
                      📝 Sentence Case
                    </button>
                    <button onClick={() => convertText('clean', 'lorem')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700" aria-label="Clean spaces">
                      ✂️ Clean Spaces
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => copyTextToClipboard(loremText)}
                  className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded transition shadow"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  aria-label="Download text file"
                  onClick={() => downloadTextFile(loremText, 'lorem-ipsum.txt')}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded transition shadow"
                >
                  Download
                </button>
                <button aria-label="Clear text area" onClick={() => setLoremText('')} className="text-xs text-red-300 hover:text-red-200 transition-colors">
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}


        
        {/* ----------------- Binary ↔ Text Converter ----------------- */}
        {selectedTab === 'binarytotext' && (
          <div className="glow-card rounded-2xl p-4 sm:p-6 md:p-8 mb-8 relative border border-slate-700/60 bg-slate-800/40">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-violet-400" />
                <h1 className="text-3xl font-bold text-white">Binary ↔ Text Converter</h1>
              </div>
              <button
                onClick={async () => {
                  try {
                    const clipText = await navigator.clipboard.readText();
                    setBinaryText(clipText);
                  } catch {
                    alert('Failed to read clipboard — please allow clipboard access.');
                  }
                }}
                className="text-sm text-violet-100 hover:text-white transition-colors bg-slate-800/70 px-3 py-1 rounded-md border border-slate-600"
              >
                Paste
              </button>
            </div>

            <textarea
              value={binaryText}
              onChange={(e) => setBinaryText(e.target.value)}
              className="w-full max-w-full h-64 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none mb-2 placeholder-slate-400"
              placeholder="Enter text or binary here..."
            />

            <div className="flex flex-wrap items-center gap-2 mb-2">
              <button
                className="focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2"
                onClick={() => {
                  if (!binaryText) return;
                  const binary = binaryText
                    .split('')
                    .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
                    .join(' ');
                  setBinaryText(binary);
                }}
              >
                Text → Binary
              </button>

              <button
                className="focus:outline-none text-white bg-yellow-500 hover:bg-yellow-600 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2"
                onClick={() => {
                  if (!binaryText) return;
                  try {
                    const textFromBinary = binaryText
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean)
                      .map((b) => {
                        const n = parseInt(b, 2);
                        if (Number.isNaN(n)) throw new Error('bad');
                        return String.fromCharCode(n);
                      })
                      .join('');
                    setBinaryText(textFromBinary);
                  } catch {
                    alert('Invalid binary input!');
                  }
                }}
              >
                Binary → Text
              </button>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button
                className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded transition shadow"
                onClick={() => copyTextToClipboard(binaryText)}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                aria-label="Download text file"
                onClick={() => downloadTextFile(binaryText, 'binary.txt')}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded transition shadow"
              >
                Download
              </button>
              <button aria-label="Clear text area" className="text-xs text-red-300 hover:text-red-200 transition-colors" onClick={() => setBinaryText('')}>
                Clear
              </button>
            </div>
          </div>
        )}

        {/* ----------------- Number ↔ Words ----------------- */}
        {selectedTab === 'numberConverter' && (
          <div className="glow-card rounded-2xl p-4 sm:p-6 md:p-8 mb-8 relative border border-slate-700/60 bg-slate-800/40">
            <div className="flex items-center space-x-3 mb-6 relative">
              <FileText className="h-8 w-8 text-yellow-400" />
              <h1 className="text-3xl font-bold text-white">Number ↔ Words Converter</h1>
              <button
                onClick={pasteNumberInput}
                className="absolute top-0 right-0 text-sm text-yellow-100 hover:text-white transition-colors bg-slate-800/70 px-3 py-1 rounded-md border border-slate-600"
              >
                Paste
              </button>
            </div>

            <input
              type="text"
              value={numberInput}
              onChange={(e) => setNumberInput(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 mb-3 placeholder-slate-400"
              placeholder="Enter number or words"
            />

            <div className="flex gap-2 mb-3">
              <button onClick={convertNumberToWords} className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded shadow">
                Number → Words
              </button>
              <button onClick={convertWordsToNumber} className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded shadow">
                Words → Number
              </button>
            </div>

            <textarea
              value={numberResult}
              readOnly
              className="w-full h-32 px-3 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 resize-none mb-2 placeholder-slate-400"
              placeholder="Result will appear here"
            />

            <div className="flex justify-end gap-2 mt-1">
              <button onClick={copyNumberResult} className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded shadow">
                {copiedNumber ? 'Copied!' : 'Copy'}
              </button>
              <button aria-label="Download text file" onClick={downloadNumberResult} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow">
                Download
              </button>
              <button aria-label="Clear text area" onClick={clearNumberConverter} className="px-3 py-1 text-red-300 hover:text-red-200 rounded">
                Clear
              </button>
            </div>
          </div>
        )}

        <AdBanner />

          <div className="rounded-2xl p-8 mb-8">
                 <h2 className="text-3xl font-bold text-white mb-4">📝 Text Counter – Count, Convert & Generate Text Instantly</h2>
          <h3 className="text-slate-200 font-semibold">What is a Text Counter and Why Do You Need It?</h3>
          <div className="space-y-4 text-slate-300">
            <p>
              A <strong>Text Counter Tool </strong>helps writers, students, developers, and digital marketers quickly analyze and manage their content. Whether you’re counting characters for a tweet, checking word density for SEO, or formatting a long document, this free online <strong>text counter</strong> does it all in seconds.
            </p>
            <p>
              Our tool is more than just a counter — it includes text analysis, case conversion, <strong>lorem ipsum generator, binary converter,</strong> and<strong> number-to-text converter</strong>, making it an all-in-one writing and conversion suite.
            </p>
            <p>
              Writers use it to ensure their posts meet limits, students for precise essays, and developers for encoding or testing. It’s fast, accurate, and works directly in your browser — no installation or login required.
            </p>
            <p>
              From counting words to converting binary or generating placeholder text, this is the most complete<strong> text utility tool</strong> online for accurate and efficient content processing.
            </p>

            <h2 className="text-yellow-500 font-semibold"><strong>What is a QR Code?</strong></h2>
            <p>
              A QR (Quick Response) Code is a two-dimensional barcode that stores information like website URLs, Wi-Fi passwords, phone numbers, or text. It’s scannable by any mobile camera, making it a fast and contactless way to share data.
            </p>
            <h2 className="text-yellow-500 font-semibold"><strong>What is a Barcode?</strong></h2>
            <p>
              Barcodes are one-dimensional representations used widely in retail, inventory, and logistics. Each line pattern represents unique data that helps businesses manage products efficiently.
            </p>
            <h2 className="text-yellow-500 font-semibold"><strong>What is a Hash Code?</strong></h2>
            <p>
              Hashing converts plain text into fixed, encrypted strings using algorithms like MD5, SHA-1, and SHA-256. Hash codes ensure data integrity, authentication, and secure password storage.
            </p>
            <p>
              Our platform combines all these functions into one powerful, easy-to-use interface — no software installation, no limits, and completely free.
            </p>

            <h3 className="text-2xl font-semibold text-white mt-6">🔟 Why Use Our Text Counter Tool</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>100% free and browser-based – no signup needed.</li>
              <li>Supports instant text analysis (characters, words, sentences).</li>
              <li>Helps maintain SEO-friendly content length.</li>
              <li>Great for students, bloggers, and social media creators.</li>
              <li>Accurate word and character count for any text.</li>
              <li>Converts binary, numbers, and lorem ipsum in one place.</li>
              <li>Clean, ad-light interface with fast processing.</li>
              <li>Copy, clear, and download text easily.</li>
              <li>Works on mobile, tablet, and desktop.</li>
              <li>Ensures text quality and readability tracking.</li>
            </ul>

            <p>By using a <strong>secure password generator</strong>, you can effortlessly create passwords that meet these requirements and ensure your digital life stays safe.</p>

            <h3 className="text-2xl font-semibold text-white mt-6">💡 Our Tool Features</h3>
            <p>Our <strong>Password Generator</strong> is designed to help you create <strong>strong and secure passwords</strong> effortlessly. Here’s what makes it an essential tool for online security:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Text Counter:</strong> – Counts characters, words, paragraphs, and reading time.</li>
              <li><strong>Reverse Text:</strong> – Reverse by word, sentence, or line instantly.</li>
              <li><strong>Case Converter:</strong> – Change to uppercase, lowercase, title case, or sentence case.</li>
              <li><strong>Extra Space Remover:</strong> – Clean up text with one click.</li>
              <li><strong>Copy / Download / Clear Buttons:</strong> – Manage your content instantly.</li>
              <li><strong>Lorem Ipsum Generator:</strong> – Create placeholder text with a custom word count.</li>
              <li><strong>Binary to Text Converter:</strong> – Translate binary code or text easily.</li>
              <li><strong>Number ↔ Text Converter:</strong> –Convert numbers into words or vice versa.</li>
              <li><strong>Instant Paste Button:</strong> – Add text quickly without manual typing.</li>
              <li><strong>Auto Result Display:</strong> – Real-time results without refreshing the page.</li>
            </ul>

         
              
              <AdBanner type="bottom" />

                   
            <section className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">❓ Frequently Asked Questions (<span className="text-yellow-300"> FAQ </span>)</h2>
            <div className="space-y-4 text-lg text-slate-100 leading-relaxed">
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q1</span>: What is a text counter tool used for?</h3>
                    <p>It helps you count characters, words, and lines in any text to stay within writing limits.
                    </p>
                  
                </div>
              </div>
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q2</span>: Can I convert binary to text using this tool?</h3>
                  <p>Yes, our Binary tab lets you convert binary to text and text to binary instantly.</p>
                </div>
             </div>
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q3</span>: Does it work on mobile devices?</h3>
                <p>Absolutely! It’s fully mobile-friendly and responsive on all screen sizes.</p>
                </div>
              </div>
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q4</span>: Is the lorem ipsum generator customizable?</h3>
                <p>Yes, you can set how many words you want before generating.</p>
                </div>
              </div>
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q5</span>: Can I download my text as a file?</h3>
                <p>Yes, you can download your text as a <span className="bg-gray-700  px-2 rounded">.txt</span>  file with one click.</p>

                </div>
              </div>
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q6</span>: What cases can I convert text into?</h3>
                <p> You can switch between uppercase, lowercase, title case, sentence case, or remove extra spaces.</p>

                </div>
              </div>
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q7</span>: Is this tool free to use?</h3>
                <p>Completely free! No registration, ads, or hidden limits — just instant text tools.</p>

                </div>
              </div>
              
            </div>
          </section>

              <AdBanner type="bottom" />

                   
            </div>
          </div>
        
        <RelatedCalculators currentPath="/text-tools" />

        <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is a Text Counter Tool?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "A Text Counter is an online tool that counts words, characters, sentences, and paragraphs instantly — perfect for SEO writers, students, and editors."
              }
            },
            {
              "@type": "Question",
              "name": "Is this Text Counter free?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! Our Text Counter and all its features are 100% free with no sign-up required."
              }
            },
            {
              "@type": "Question",
              "name": "Can I generate Lorem Ipsum text?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, the Lorem Generator tab lets you create custom placeholder text instantly by word count."
              }
            },
            {
              "@type": "Question",
              "name": "Can I convert Binary or Numbers to Text?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Absolutely. The tool includes binary-to-text and number-to-text converters with instant output and copy/download options."
              }
            },
            {
              "@type": "Question",
              "name": "Does it work on mobile devices?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, our Text Counter is fully responsive and works perfectly on mobile, tablet, and desktop."
              }
            },
            {
              "@type": "Question",
              "name": "Can I copy or download my text?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! You can easily copy your processed text or download it as a .txt file with one click."
              }
            }
          ]
        })
      }} />
        
        


      </div>
    </>
  );
};

export default TextToolsPage;
 
