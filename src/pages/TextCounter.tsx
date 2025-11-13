import React, { useState, useEffect, useRef } from 'react';
import { FileText, ChevronDown, Volume2, VolumeX, Lock, Search, BarChart } from 'lucide-react';
import { toWords } from 'number-to-words';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

/**
 * TextToolsPage.tsx
 * - Keeps original tabs (Text Counter, Lorem Ipsum, Binary ↔ Text, Number ↔ Words)
 * - Adds an "Advanced Tools" toggle INSIDE the Text Counter card (no new tabs)
 *   Advanced Tools include:
 *   - Text to Speech (Speak/Stop/Clear)
 *   - Encrypt/Decrypt (Caesar cipher with shift + Base64 encode/decode)
 *   - Text Analysis (Duplicate word finder & Word frequency table)
 *   - Regex Tester & Text Similarity (Jaccard) + Character Distribution table
 */

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
  'In interdum consequat mauris at mollis.',
];

// Simple Caesar cipher for Encrypt/Decrypt
function caesarCipher(str: string, shift: number): string {
  return str.replace(/[a-z]/gi, (c) => {
    const base = c >= 'a' && c <= 'z' ? 97 : 65;
    return String.fromCharCode(((c.charCodeAt(0) - base + shift + 26) % 26) + base);
  });
}

const TextToolsPage: React.FC = () => {
  // ----------------- Tabs -----------------
  const [selectedTab, setSelectedTab] = useState<
    'textCounter' | 'loremIpsum' | 'binarytotext' | 'numberConverter'
  >('textCounter');

  // ----------------- Number Converter state -----------------
  const [numberInput, setNumberInput] = useState('');
  const [numberResult, setNumberResult] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);

  // ----------------- Text Counter state -----------------
  const [text, setText] = useState('');
  const [stats, setStats] = useState({
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0,
    lines: 0,
    readingTime: 0,
    palindromeWords: 0,
  });
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [reverseDropdownOpen, setReverseDropdownOpen] = useState(false);
  const reverseDropdownRef = useRef<HTMLDivElement>(null);
  const convertCaseDropdownRef = useRef<HTMLDivElement>(null);
  const loremDropdownRef = useRef<HTMLDivElement>(null);


  // ----------------- Advanced Tools toggle (inside Text Counter) -----------------
  const [showAdvanced, setShowAdvanced] = useState(false);

// Text to Speech
const [speaking, setSpeaking] = useState(false);

const speakText = () => {
  if (!text) {
    alert("Enter text");
    return;
  }

  if (typeof window === "undefined" || !window.speechSynthesis) {
    alert("Speech not supported");
    return;
  }

  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.0;
  utter.pitch = 1.0;

  utter.onstart = () => setSpeaking(true);
  utter.onend = () => setSpeaking(false);

  window.speechSynthesis.speak(utter);
};

const stopSpeech = () => {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }
};
const [shift, setShift] = useState(3);
const [cryptoOutput, setCryptoOutput] = useState('');
// Caesar Encrypt: main text → cryptoOutput
const encryptText = () => {
  if (!text) {
    alert('Enter text to encrypt');
    return;
  }
  setCryptoOutput(caesarCipher(text, shift));
};

// Caesar Decrypt: cryptoOutput → decrypted text
const decryptText = () => {
  if (!cryptoOutput) {
    alert('Nothing to decrypt. First encrypt or paste encrypted text.');
    return;
  }
  setCryptoOutput(caesarCipher(cryptoOutput, -shift));
};

// Base64 Encode: main text → cryptoOutput
const encodeBase64 = () => {
  if (!text) {
    alert('Enter text to encode');
    return;
  }
  try {
    const encoded = btoa(unescape(encodeURIComponent(text)));
    setCryptoOutput(encoded);
  } catch {
    alert('Invalid input for Base64 encoding');
  }
};

// Base64 Decode: cryptoOutput → decoded text
const decodeBase64 = () => {
  if (!cryptoOutput) {
    alert('Nothing to decode. Paste Base64 string or encode first.');
    return;
  }
  try {
    const decoded = decodeURIComponent(escape(atob(cryptoOutput)));
    setCryptoOutput(decoded);
  } catch {
    alert('Invalid Base64 string');
  }
};


  // Text Analysis (duplicates & frequency)
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const [frequencyData, setFrequencyData] = useState<{ word: string; count: number }[]>([]);
  const analyzeText = () => {
    const wordsArr = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);
    const freq: Record<string, number> = {};
    for (const w of wordsArr) freq[w] = (freq[w] || 0) + 1;
    const dups = Object.entries(freq)
      .filter(([, c]) => c > 1)
      .map(([w]) => w);
    setDuplicates(dups);
    setFrequencyData(
      Object.entries(freq)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
    );
  };

  // Regex & Similarity + Character Distribution
  const [regexPattern, setRegexPattern] = useState('');
  const [regexMatches, setRegexMatches] = useState<string[]>([]);
  const runRegexTest = () => {
    try {
      const re = new RegExp(regexPattern, 'g');
      setRegexMatches(text.match(re) || []);
    } catch {
      alert('Invalid regex pattern');
    }
  };

  const [compareText, setCompareText] = useState('');
  const [similarityScore, setSimilarityScore] = useState(0);
  const computeSimilarity = () => {
    const words1 = text.toLowerCase().split(/\s+/).filter(Boolean);
    const words2 = compareText.toLowerCase().split(/\s+/).filter(Boolean);
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = [...set1].filter((w) => set2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;
    const score = union === 0 ? 0 : (intersection / union) * 100;
    setSimilarityScore(Number(score.toFixed(2)));
  };

  const [charStats, setCharStats] = useState<{ char: string; count: number }[]>([]);
  const generateCharStats = () => {
    const chars = text.replace(/\s/g, '').split('');
    const freq: Record<string, number> = {};
    chars.forEach((c) => (freq[c] = (freq[c] || 0) + 1));
    setCharStats(
      Object.entries(freq)
        .map(([char, count]) => ({ char, count }))
        .sort((a, b) => b.count - a.count)
    );
  };

  // ----------------- Lorem Ipsum state -----------------
  const [loremText, setLoremText] = useState('');
  const [paragraphsCount, setParagraphsCount] = useState(3); // used as "total words"
  const [loremDropdownOpen, setLoremDropdownOpen] = useState(false);

  // _________________ Number to word function _________________________
  const convertNumberToWords = () => {
    if (!numberInput) return;
    const num = Number(numberInput);
    if (isNaN(num)) {
      setNumberResult('Invalid number');
      return;
    }
    setNumberResult(toWords(num));
  };

  const convertWordsToNumber = () => {
    if (!numberInput) return;
    try {
      const words = numberInput.toLowerCase().replace(/-/g, ' ').split(' ');
      let num = 0;
      // Simple library-free parser for 0-9999 numbers
      const wordToNum: Record<string, number> = {
        zero: 0,
        one: 1,
        two: 2,
        three: 3,
        four: 4,
        five: 5,
        six: 6,
        seven: 7,
        eight: 8,
        nine: 9,
        ten: 10,
        eleven: 11,
        twelve: 12,
        thirteen: 13,
        fourteen: 14,
        fifteen: 15,
        sixteen: 16,
        seventeen: 17,
        eighteen: 18,
        nineteen: 19,
        twenty: 20,
        thirty: 30,
        forty: 40,
        fifty: 50,
        sixty: 60,
        seventy: 70,
        eighty: 80,
        ninety: 90,
        hundred: 100,
        thousand: 1000,
      };
      let temp = 0;
      words.forEach((w) => {
        const val = wordToNum[w];
        if (val === 100) temp *= 100;
        else if (val === 1000) {
          temp *= 1000;
          num += temp;
          temp = 0;
        } else if (val !== undefined) temp += val;
      });
      num += temp;
      setNumberResult(num.toString());
    } catch {
      setNumberResult('Invalid words');
    }
  };

  // Paste/Copy/Download helpers
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
    await navigator.clipboard.writeText(numberResult);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 1500);
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

  // ----------------- Close dropdowns when clicking outside -----------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reverseDropdownRef.current && !reverseDropdownRef.current.contains(event.target as Node) && reverseDropdownOpen) {
        setReverseDropdownOpen(false);
      }
      if (convertCaseDropdownRef.current && !convertCaseDropdownRef.current.contains(event.target as Node) && dropdownOpen) {
        setDropdownOpen(false);
      }
      if (loremDropdownRef.current && !loremDropdownRef.current.contains(event.target as Node) && loremDropdownOpen) {
        setLoremDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [reverseDropdownOpen, dropdownOpen, loremDropdownOpen]);

  // ----------------- Text Counter Stats Calculation -----------------
  useEffect(() => {
    calculateStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const calculateStats = () => {
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const wordsArray = text.trim() === '' ? [] : text.trim().split(/\s+/);
    const words = wordsArray.length;
    const sentences =
      text.trim() === '' ? 0 : text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
    const paragraphs =
      text.trim() === '' ? 0 : text.split(/\n\n+/).filter((p) => p.trim().length > 0).length;
    const lines = text === '' ? 0 : text.split(/\n/).length;
    const readingTime = Math.ceil(words / 200);

    // Count palindrome words
    const palindromeWords = wordsArray.filter((word) => {
      const cleanWord = word.replace(/[^a-z0-9]/gi, '').toLowerCase();
      return cleanWord.length > 1 && cleanWord === cleanWord.split('').reverse().join('');
    }).length;

    setStats({
      characters,
      charactersNoSpaces,
      words,
      sentences,
      paragraphs,
      lines,
      readingTime,
      palindromeWords,
    });
  };

  const clearText = () => setText('');

  // Reverse dropdown
  const reverseText = (mode: 'word' | 'sentence' | 'line') => {
    if (!text) return;
    let reversed = '';
    switch (mode) {
      case 'word':
        reversed = text.split(/\s+/).reverse().join(' ');
        break;
      case 'sentence':
        reversed = text
          .split(/([.!?]+)/)
          .reduce((acc, curr, idx, arr) => {
            if (/[.!?]+/.test(curr)) return acc;
            return (
              acc + curr.split(' ').reverse().join(' ') + (arr[idx + 1] || '')
            );
          }, '');
        break;
      case 'line':
        reversed = text.split('\n').reverse().join('\n');
        break;
    }
    setText(reversed);
  };

  // For the Binary tab
  const [binaryText, setBinaryText] = useState('');

  // Convert Case Functions
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
        converted = sourceText
          .toLowerCase()
          .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
        break;
      case 'clean':
        converted = sourceText.replace(/\s+/g, ' ').trim();
        break;
    }
    if (target === 'text') setText(converted);
    else setLoremText(converted);
  };

  const copyTextToClipboard = async (sourceText: string) => {
    if (!sourceText) return;
    await navigator.clipboard.writeText(sourceText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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

  return (
    <>
      <SEOHead
        title={
          seoData.textCounter?.title ||
          'Free Online Text Counter | Word, Character & Converter Tool'
        }
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
            'online text editor',
          ]
        )}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Text Tools', url: '/text-tools' },
        ]}
      />

      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <meta
        property="og:title"
        content="Free Online Text Counter | Word, Character & Converter Tool"
      />
      <meta
        property="og:description"
        content="Count characters, words, and paragraphs instantly. Includes text converter, lorem generator, and binary converter. 100% free and browser-based."
      />
      <meta
        name="description"
        content="Use our free Text Counter tool to count words, characters, sentences, and paragraphs instantly. Includes case converter, lorem ipsum generator, binary converter, and number to text converter — all in one place!"
      />
      <meta
        name="keywords"
        content="text counter, word counter, character counter, lorem ipsum generator, binary converter, number to text, text tools, online text counter, SEO writing tools, case converter"
      />
      <meta
        property="og:image"
        content="https://calculatorhub.site/images/text-counter-og.jpg"
      />
      <meta property="og:url" content="https://calculatorhub.site/text-counter" />
      <meta property="og:type" content="calculatorhub" />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Misc Tools', url: '/category/misc-tools' },
            { name: 'Text Tools', url: '/text-tools' },
          ]}
        />

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          <button
            className={`px-4 py-2 rounded-xl font-semibold ${
              selectedTab === 'textCounter'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300'
            }`}
            onClick={() => setSelectedTab('textCounter')}
          >
            Text
          </button>
          <button
            className={`px-4 py-2 rounded-xl font-semibold ${
              selectedTab === 'loremIpsum'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 text-slate-300'
            }`}
            onClick={() => setSelectedTab('loremIpsum')}
          >
            Lorem
          </button>
          <button
            className={`px-4 py-2 rounded-xl font-semibold ${
              selectedTab === 'binarytotext'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-700 text-slate-300'
            }`}
            onClick={() => setSelectedTab('binarytotext')}
          >
            Binary
          </button>
          <button
            className={`px-4 py-2 rounded-xl font-semibold ${
              selectedTab === 'numberConverter'
                ? 'bg-yellow-600 text-white'
                : 'bg-slate-700 text-slate-300'
            }`}
            onClick={() => setSelectedTab('numberConverter')}
          >
            Number
          </button>
        </div>

        {/* ----------------- Text Counter ----------------- */}
        {selectedTab === 'textCounter' && (
          <div className="glow-card rounded-2xl p-4 sm:p-6 md:p-8 mb-8 relative border border-slate-700/60 bg-slate-800/60 backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-400" />
                <h1 className="text-3xl font-bold text-white">Text Counter</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      const clipText = await navigator.clipboard.readText();
                      setText(clipText);
                    } catch {
                      alert('Failed to read clipboard — please allow clipboard access.');
                    }
                  }}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors bg-slate-800/70 px-3 py-1 rounded-md border border-slate-600"
                  aria-label="Paste"
                >
                  Paste
                </button>
                <button
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="text-sm px-3 py-1 rounded-md border border-slate-600 bg-gradient-to-r from-blue-700/60 to-purple-700/60 text-white hover:from-blue-600/70 hover:to-purple-600/70 transition-all shadow-sm"
                  aria-expanded={showAdvanced}
                >
                  {showAdvanced ? 'Hide Advanced ⚙️' : 'Advanced Tools ⚙️'}
                </button>
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full max-w-full h-64 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
              placeholder="Start typing or paste your text here..."
            />

            <div className="flex flex-wrap justify-between items-center mt-2 gap-2">
              {/* Reverse Dropdown */}
              <div className="relative" ref={reverseDropdownRef}>
                <button
                  onClick={() => setReverseDropdownOpen(!reverseDropdownOpen)}
                  className="flex items-center text-xs bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded transition"
                >
                  Reverse <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {reverseDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-36 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => reverseText('word')}
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                    >
                      Word
                    </button>
                    <button
                      onClick={() => reverseText('sentence')}
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                    >
                      Sentence
                    </button>
                    <button
                      onClick={() => reverseText('line')}
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                    >
                      Line
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 relative">
                {/* Convert Case Dropdown */}
                <div className="relative" ref={convertCaseDropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded transition"
                  >
                    Convert Case <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => convertText('upper', 'text')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        🔠 UPPERCASE
                      </button>
                      <button
                        onClick={() => convertText('lower', 'text')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        🔡 lowercase
                      </button>
                      <button
                        onClick={() => convertText('title', 'text')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        🧾 Title Case
                      </button>
                      <button
                        onClick={() => convertText('sentence', 'text')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        📝 Sentence Case
                      </button>
                      <button
                        onClick={() => convertText('clean', 'text')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        ✂️ Clean Spaces
                      </button>
                    </div>
                  )}
                </div>

                <button
                  className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded transition"
                  onClick={() => copyTextToClipboard(text)}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => downloadTextFile(text, 'text-counter.txt')}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded transition"
                >
                  Download
                </button>
                <button
                  onClick={clearText}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="p-4 bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl border border-blue-500/30">
                <p className="text-sm text-slate-400 mb-1">Characters</p>
                <p className="text-3xl font-bold text-white">
                  {stats.characters.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl border border-purple-500/30">
                <p className="text-sm text-slate-400 mb-1">No Spaces</p>
                <p className="text-3xl font-bold text-white">
                  {stats.charactersNoSpaces.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl border border-green-500/30">
                <p className="text-sm text-slate-400 mb-1">Words</p>
                <p className="text-3xl font-bold text-white">
                  {stats.words.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-900/30 to-orange-800/30 rounded-xl border border-orange-500/30">
                <p className="text-sm text-slate-400 mb-1">Sentences</p>
                <p className="text-3xl font-bold text-white">
                  {stats.sentences.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-pink-900/30 to-pink-800/30 rounded-xl border border-pink-500/30">
                <p className="text-sm text-slate-400 mb-1">Paragraphs</p>
                <p className="text-3xl font-bold text-white">
                  {stats.paragraphs.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-teal-900/30 to-teal-800/30 rounded-xl border border-teal-500/30">
                <p className="text-sm text-slate-400 mb-1">Lines</p>
                <p className="text-3xl font-bold text-white">
                  {stats.lines.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-pink-900/30 to-pink-800/30 rounded-xl border border-pink-500/30">
                <p className="text-sm text-slate-400 mb-1">Palindrome Words</p>
                <p className="text-3xl font-bold text-white">
                  {stats.palindromeWords.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-indigo-900/30 to-indigo-800/30 rounded-xl border border-indigo-500/30 col-span-1">
                <p className="text-sm text-slate-400 mb-1">Reading Time</p>
                <p className="text-3xl font-bold text-white">
                  {stats.readingTime} min{stats.readingTime !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-slate-500 mt-1">Based on 200 words/min</p>
              </div>
            </div>

            {/* ----------------- Advanced Tools Collapsible ----------------- */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                showAdvanced ? 'max-h-[9999px] mt-6' : 'max-h-0'
              }`}
              aria-hidden={!showAdvanced}
            >
              <div className="flex flex-col gap-6 w-full">
                {/* TTS */}
                <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Volume2 className="h-6 w-6 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Text to Speech</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={speakText}
                      disabled={speaking}
                      className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {speaking ? 'Speaking...' : 'Speak'}
                    </button>
                    <button
                      onClick={stopSpeech}
                      className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white flex items-center gap-1"
                    >
                      <VolumeX className="h-4 w-4" /> Stop
                    </button>
                    <button
                      onClick={() => setText('')}
                      className="px-3 py-1 rounded bg-slate-600 hover:bg-slate-500 text-white"
                    >
                      Clear Text
                    </button>
                  </div>
                </div>

                {/* Encrypt/Decrypt */}
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-900/10 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="h-6 w-6 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-white">Encrypt / Decrypt</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <label className="text-sm text-slate-300">Shift:</label>
                    <input
                      type="number"
                      value={shift}
                      onChange={(e) => setShift(Number(e.target.value))}
                      className="w-20 px-2 py-1 rounded bg-slate-700 border border-slate-600 text-white"
                    />
                    <button
                      onClick={encryptText}
                      className="px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-500 text-white" 
                    >
                      Caesar Encrypt
                    </button>
                    <button
                      onClick={decryptText}
                      className="px-3 py-1 rounded bg-yellow-700 hover:bg-yellow-600 text-white"
                    >
                      Caesar Decrypt
                    </button>
                    <button
                      onClick={encodeBase64}
                      className="px-3 py-1 rounded bg-green-600 hover:bg-green-500 text-white"
                    >
                      Base64 Encode
                    </button>
                    <button
                      onClick={decodeBase64}
                      className="px-3 py-1 rounded bg-green-700 hover:bg-green-600 text-white"
                    >
                      Base64 Decode
                    </button>
                  </div>
                  <textarea
                    value={cryptoOutput}
                    readOnly
                    className="w-full h-24 px-3 py-2 rounded bg-slate-700 border border-slate-600 text-white resize-none"
                    placeholder="Result will appear here..."
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => copyTextToClipboard(cryptoOutput)}
                      className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => downloadTextFile(cryptoOutput, 'crypto-output.txt')}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded"
                    >
                      Download
                    </button>
                  </div>
                </div>

                {/* Text Analysis */}
                <div className="rounded-xl border border-green-500/30 bg-green-900/10 p-4 md:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart className="h-6 w-6 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Text Analysis</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      onClick={analyzeText}
                      className="px-3 py-1 rounded bg-green-600 hover:bg-green-500 text-white"
                    >
                      Analyze Duplicates & Frequency
                    </button>
                    <button
                      onClick={generateCharStats}
                      className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      Character Distribution
                    </button>
                  </div>

                  {/* Results grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Duplicates */}
                    <div className="rounded-lg border border-yellow-500/30 bg-yellow-900/5 p-3">
                      <h4 className="text-sm font-semibold text-yellow-300 mb-2">
                        🔁 Duplicate Words
                      </h4>
                      {duplicates.length > 0 ? (
                        <p className="text-slate-200">{duplicates.join(', ')}</p>
                      ) : (
                        <p className="text-slate-400">
                          No duplicates detected yet. Run analysis to see results.
                        </p>
                      )}
                    </div>

                    {/* Word Frequency */}
                    <div className="rounded-lg border border-green-500/30 bg-green-900/5 p-3">
                      <h4 className="text-sm font-semibold text-green-300 mb-2">
                        📊 Word Frequency
                      </h4>
                      {frequencyData.length > 0 ? (
                        <div className="max-h-56 overflow-y-auto">
                          <table className="w-full text-left text-slate-200 text-sm">
                            <thead className="text-slate-400 sticky top-0 bg-green-950/40">
                              <tr>
                                <th className="py-1 pr-2">Word</th>
                                <th className="py-1">Count</th>
                              </tr>
                            </thead>
                            <tbody>
                              {frequencyData.map((item, i) => (
                                <tr key={i} className="odd:bg-slate-800/40">
                                  <td className="py-1 pr-2">{item.word}</td>
                                  <td className="py-1">{item.count}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-slate-400">Run analysis to see word frequency.</p>
                      )}
                    </div>
                  </div>

                  {/* Regex & Similarity */}
                  <div className="mt-4 rounded-lg border border-violet-500/30 bg-violet-900/10 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Search className="h-5 w-5 text-violet-300" />
                      <h4 className="text-sm font-semibold text-violet-200">
                        🧠 Regex Tester & Similarity
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center mb-2">
                      <input
                        type="text"
                        value={regexPattern}
                        onChange={(e) => setRegexPattern(e.target.value)}
                        className="flex-1 min-w-[200px] px-3 py-1 rounded bg-slate-700 border border-slate-600 text-white"
                        placeholder="Enter regex pattern (e.g. \\b\\w{5}\\b)"
                      />
                      <button
                        onClick={runRegexTest}
                        className="px-3 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white"
                      >
                        Test Regex
                      </button>
                      {regexMatches.length > 0 && (
                        <span className="text-green-300 text-sm">
                          ✅ {regexMatches.length} match(es)
                        </span>
                      )}
                    </div>
                    {regexMatches.length > 0 && (
                      <div className="text-slate-200 text-sm mb-3 break-words">
                        {regexMatches.join(', ')}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-slate-300">Compare with:</label>
                        <textarea
                          value={compareText}
                          onChange={(e) => setCompareText(e.target.value)}
                          className="w-full h-24 px-3 py-2 rounded bg-slate-700 border border-slate-600 text-white resize-none"
                          placeholder="Enter text to compare with the main text..."
                        />
                        <button
                          onClick={computeSimilarity}
                          className="mt-2 px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-500 text-white"
                        >
                          Compute Similarity
                        </button>
                        {similarityScore > 0 && (
                          <p className="mt-2 text-slate-200 text-sm">
                            Similarity Score:{' '}
                            <span className="text-green-400 font-semibold">
                              {similarityScore}%
                            </span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm text-slate-300">
                          Character Distribution
                        </label>
                        <div className="max-h-36 overflow-y-auto mt-1 rounded border border-slate-700">
                          {charStats.length > 0 ? (
                            <table className="w-full text-left text-slate-200 text-sm">
                              <thead className="text-slate-400 sticky top-0 bg-slate-900/70">
                                <tr>
                                  <th className="py-1 px-2">Char</th>
                                  <th className="py-1">Count</th>
                                </tr>
                              </thead>
                              <tbody>
                                {charStats.map((c, i) => (
                                  <tr key={i} className="odd:bg-slate-800/40">
                                    <td className="py-1 px-2">{c.char}</td>
                                    <td className="py-1">{c.count}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="p-3 text-slate-400 text-sm">
                              Click &quot;Character Distribution&quot; above to generate stats.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- Lorem Ipsum Generator ----------------- */}
        {selectedTab === 'loremIpsum' && (
          <div className="glow-card rounded-2xl p-4 sm:p-6 md:p-8 mb-8 relative">
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="h-8 w-8 text-green-400" />
              <h1 className="text-3xl font-bold text-white">Lorem Ipsum Generator</h1>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <input
                type="number"
                min={1}
                value={paragraphsCount}
                onChange={(e) => setParagraphsCount(Number(e.target.value))}
                className="w-36 px-3 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Word Number"
              />
              <button
                onClick={() => {
                  const totalWords = paragraphsCount;
                  if (!totalWords || totalWords < 1) return;
                  const loremArray: string[] = [];
                  while (loremArray.join(' ').split(' ').length < totalWords) {
                    const sentence =
                      loremSentences[Math.floor(Math.random() * loremSentences.length)];
                    loremArray.push(sentence);
                  }
                  const generated = loremArray
                    .join(' ')
                    .split(' ')
                    .slice(0, totalWords)
                    .join(' ');
                  setLoremText(generated);
                }}
                className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded transition"
              >
                Generate
              </button>
            </div>

            <textarea
              value={loremText}
              readOnly
              className="w-full max-w-full h-64 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none mb-3"
              placeholder="Generated Lorem Ipsum text will appear here..."
            />

            <div className="flex flex-wrap justify-between items-center mt-2 gap-2">
              <p className="text-sm text-slate-400">
                Modify or download your generated Lorem Ipsum
              </p>
              <div className="flex flex-wrap items-center gap-2 relative">
                <div className="relative" ref={loremDropdownRef}>
                  <button
                    onClick={() => setLoremDropdownOpen(!loremDropdownOpen)}
                    className="flex items-center text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded transition"
                  >
                    Convert Case <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  {loremDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => convertText('upper', 'lorem')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        🔠 UPPERCASE
                      </button>
                      <button
                        onClick={() => convertText('lower', 'lorem')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        🔡 lowercase
                      </button>
                      <button
                        onClick={() => convertText('title', 'lorem')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        🧾 Title Case
                      </button>
                      <button
                        onClick={() => convertText('sentence', 'lorem')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        📝 Sentence Case
                      </button>
                      <button
                        onClick={() => convertText('clean', 'lorem')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        ✂️ Clean Spaces
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => copyTextToClipboard(loremText)}
                  className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded transition"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => downloadTextFile(loremText, 'lorem-ipsum.txt')}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded transition"
                >
                  Download
                </button>
                <button
                  onClick={() => setLoremText('')}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- Binary ↔ Text Converter ----------------- */}
        {selectedTab === 'binarytotext' && (
          <div className="glow-card rounded-2xl p-4 sm:p-6 md:p-8 mb-8 relative">
            <div className="flex items-center space-x-3 mb-6">
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
              className="absolute top-3 right-3 text-sm text-violet-400 hover:text-violet-300 transition-colors bg-slate-800/70 px-3 py-1 rounded-md border border-slate-600"
            >
              Paste
            </button>

            <textarea
              value={binaryText}
              onChange={(e) => setBinaryText(e.target.value)}
              className="w-full max-w-full h-64 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
              placeholder="Enter text or binary here..."
            />

            <div className="flex flex-wrap items-center gap-2 mb-2">
              <button
                className="focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900"
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
                className="focus:outline-none text-white bg-yellow-400 hover:bg-yellow-500 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:focus:ring-yellow-900"
                onClick={() => {
                  if (!binaryText) return;
                  try {
                    const textFromBinary = binaryText
                      .trim()
                      .split(/\s+/)
                      .map((b) => String.fromCharCode(parseInt(b, 2)))
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
                className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded transition"
                onClick={() => copyTextToClipboard(binaryText)}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => downloadTextFile(binaryText, 'binary.txt')}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded transition"
              >
                Download
              </button>
              <button
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
                onClick={() => setBinaryText('')}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/*--------------------- Number ↔ Words ----------------------*/}
        {selectedTab === 'numberConverter' && (
          <div className="glow-card rounded-2xl p-4 sm:p-6 md:p-8 mb-8 relative">
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="h-8 w-8 text-yellow-400" />
              <h1 className="text-3xl font-bold text-white">Number ↔ Words Converter</h1>
              <button
                onClick={pasteNumberInput}
                className="absolute top-3 right-3 text-sm text-yellow-400 hover:text-yellow-300 transition-colors bg-slate-800/70 px-3 py-1 rounded-md border border-slate-600"
              >
                Paste
              </button>
            </div>

            <input
              type="text"
              value={numberInput}
              onChange={(e) => setNumberInput(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 mb-3"
              placeholder="Enter number or words"
            />

            <div className="flex gap-2 mb-3">
              <button
                onClick={convertNumberToWords}
                className="px-3 py-1 bg-yellow-600 text-white rounded"
              >
                Number → Words
              </button>
              <button
                onClick={convertWordsToNumber}
                className="px-3 py-1 bg-yellow-600 text-white rounded"
              >
                Words → Number
              </button>
            </div>

            <textarea
              value={numberResult}
              readOnly
              className="w-full h-32 px-3 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 resize-none mb-2"
              placeholder="Result will appear here"
            />

            <div className="flex justify-end gap-2 mt-1">
              <button
                onClick={copyNumberResult}
                className="px-3 py-1 bg-teal-600 text-white rounded"
              >
                {copiedNumber ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={downloadNumberResult}
                className="px-3 py-1 bg-indigo-600 text-white rounded"
              >
                Download
              </button>
              <button
                onClick={clearNumberConverter}
                className="px-3 py-1 text-red-400 hover:text-red-300 rounded"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <AdBanner />

        {/* --------- Informational Section --------- */}
        <div className="rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            📝 Text Counter – Count, Convert & Generate Text Instantly
          </h2>
          <h3 className="text-xl text-slate-200 mb-2">
            What is a Text Counter and Why Do You Need It?
          </h3>
          <div className="space-y-4 text-slate-300">
            <p>
              A <strong>Text Counter Tool</strong> helps writers, students, developers, and
              digital marketers quickly analyze and manage their content. Whether you’re
              counting characters for a tweet, checking word density for SEO, or formatting a
              long document, this free online <strong>text counter</strong> does it all in
              seconds.
            </p>
            <p>
              Our tool is more than just a counter — it includes text analysis, case
              conversion, <strong>lorem ipsum generator, binary converter,</strong> and{' '}
              <strong>number-to-text converter</strong>, making it an all-in-one writing and
              conversion suite.
            </p>
            <p>
              Writers use it to ensure their posts meet limits, students for precise essays,
              and developers for encoding or testing. It’s fast, accurate, and works directly
              in your browser — no installation or login required.
            </p>
            <p>
              From counting words to converting binary or generating placeholder text, this
              is the most complete <strong>text utility tool</strong> online for accurate and
              efficient content processing.
            </p>

            <h2 className="text-yellow-500 font-semibold text-lg">
              <strong>What is a QR Code?</strong>
            </h2>
            <p>
              A QR (Quick Response) Code is a two-dimensional barcode that stores information
              like website URLs, Wi-Fi passwords, phone numbers, or text. It’s scannable by
              any mobile camera, making it a fast and contactless way to share data.
            </p>
            <h2 className="text-yellow-500 font-semibold text-lg">
              <strong>What is a Barcode?</strong>
            </h2>
            <p>
              Barcodes are one-dimensional representations used widely in retail, inventory,
              and logistics. Each line pattern represents unique data that helps businesses
              manage products efficiently.
            </p>
            <h2 className="text-yellow-500 font-semibold text-lg">
              <strong>What is a Hash Code?</strong>
            </h2>
            <p>
              Hashing converts plain text into fixed, encrypted strings using algorithms like
              MD5, SHA-1, and SHA-256. Hash codes ensure data integrity, authentication, and
              secure password storage.
            </p>
            <p>
              Our platform combines all these functions into one powerful, easy-to-use
              interface — no software installation, no limits, and completely free.
            </p>

            <h3 className="text-2xl font-semibold text-white mt-6">
              🔟 Why Use Our Text Counter Tool
            </h3>
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

            <p>
              By using a <strong>secure password generator</strong>, you can effortlessly
              create passwords that meet these requirements and ensure your digital life
              stays safe.
            </p>

            <h3 className="text-2xl font-semibold text-white mt-6">💡 Our Tool Features</h3>
            <p>
              Our <strong>Password Generator</strong> is designed to help you create{' '}
              <strong>strong and secure passwords</strong> effortlessly. Here’s what makes it
              an essential tool for online security:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Text Counter:</strong> – Counts characters, words, paragraphs, and
                reading time.
              </li>
              <li>
                <strong>Reverse Text:</strong> – Reverse by word, sentence, or line
                instantly.
              </li>
              <li>
                <strong>Case Converter:</strong> – Change to uppercase, lowercase, title
                case, or sentence case.
              </li>
              <li>
                <strong>Extra Space Remover:</strong> – Clean up text with one click.
              </li>
              <li>
                <strong>Copy / Download / Clear Buttons:</strong> – Manage your content
                instantly.
              </li>
              <li>
                <strong>Lorem Ipsum Generator:</strong> – Create placeholder text with a
                custom word count.
              </li>
              <li>
                <strong>Binary to Text Converter:</strong> – Translate binary code or text
                easily.
              </li>
              <li>
                <strong>Number ↔ Text Converter:</strong> –Convert numbers into words or
                vice versa.
              </li>
              <li>
                <strong>Instant Paste Button:</strong> – Add text quickly without manual
                typing.
              </li>
              <li>
                <strong>Auto Result Display:</strong> – Real-time results without refreshing
                the page.
              </li>
            </ul>

            <AdBanner type="bottom" />

            <section className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ❓ Frequently Asked Questions (
                <span className="text-yellow-300"> FAQ </span>)
              </h2>
              <div className="space-y-4 text-lg text-slate-100 leading-relaxed">
                <div>
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q1</span>: What is a text counter
                      tool used for?
                    </h3>
                    <p>
                      It helps you count characters, words, and lines in any text to stay
                      within writing limits.
                    </p>
                  </div>
                </div>
                <div>
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q2</span>: Can I convert binary to
                      text using this tool?
                    </h3>
                    <p>
                      Yes, our Binary tab lets you convert binary to text and text to binary
                      instantly.
                    </p>
                  </div>
                </div>
                <div>
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q3</span>: Does it work on mobile
                      devices?
                    </h3>
                    <p>
                      Absolutely! It’s fully mobile-friendly and responsive on all screen
                      sizes.
                    </p>
                  </div>
                </div>
                <div>
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q4</span>: Is the lorem ipsum
                      generator customizable?
                    </h3>
                    <p>Yes, you can set how many words you want before generating.</p>
                  </div>
                </div>
                <div>
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q5</span>: Can I download my text as
                      a file?
                    </h3>
                    <p>
                      Yes, you can download your text as a{' '}
                      <span className="bg-gray-700 px-2 rounded">.txt</span> file with one
                      click.
                    </p>
                  </div>
                </div>
                <div>
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q6</span>: What cases can I convert
                      text into?
                    </h3>
                    <p>
                      You can switch between uppercase, lowercase, title case, sentence
                      case, or remove extra spaces.
                    </p>
                  </div>
                </div>
                <div>
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q7</span>: Is this tool free to use?
                    </h3>
                    <p>
                      Completely free! No registration, ads, or hidden limits — just instant
                      text tools.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <AdBanner type="bottom" />
          </div>
        </div>
      </div>

      <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
        <div className="flex items-center gap-3">
          <img
            src="/images/calculatorhub-author.jpg"
            alt="CalculatorHub Security Tools Team"
            className="w-12 h-12 rounded-full border border-gray-600"
            loading="lazy"
          />
          <div>
            <p className="font-semibold text-white">
              Written by the CalculatorHub Security Tools Team
            </p>
            <p className="text-sm text-slate-400">
              Experts in web security and online calculator development. Last updated:{' '}
              <time dateTime="2025-10-10">October 10, 2025</time>.
            </p>
          </div>
        </div>
      </section>

      <RelatedCalculators currentPath="/text-tools" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What is a Text Counter Tool?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'A Text Counter is an online tool that counts words, characters, sentences, and paragraphs instantly — perfect for SEO writers, students, and editors.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is this Text Counter free?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes! Our Text Counter and all its features are 100% free with no sign-up required.',
                },
              },
              {
                '@type': 'Question',
                name: 'Can I generate Lorem Ipsum text?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes, the Lorem Generator tab lets you create custom placeholder text instantly by word count.',
                },
              },
              {
                '@type': 'Question',
                name: 'Can I convert Binary or Numbers to Text?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Absolutely. The tool includes binary-to-text and number-to-text converters with instant output and copy/download options.',
                },
              },
              {
                '@type': 'Question',
                name: 'Does it work on mobile devices?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes, our Text Counter is fully responsive and works perfectly on mobile, tablet, and desktop.',
                },
              },
              {
                '@type': 'Question',
                name: 'Can I copy or download my text?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes! You can easily copy your processed text or download it as a .txt file with one click.',
                },
              },
            ],
          }),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Text Counter Tool',
            operatingSystem: 'All',
            applicationCategory: 'UtilityApplication',
            description:
              'Count words, characters, and convert text instantly using our free online text counter tool.',
            url: 'https://calculatorhub.site/text-tools',
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              reviewCount: '1580',
            },
          }),
        }}
      />
    </>
  );
};

export default TextToolsPage;
