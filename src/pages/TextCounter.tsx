import React, { useState, useEffect, useRef } from 'react';
import { FileText, ChevronDown } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

// ----------------- Lorem Sentences -----------------
const loremSentences = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "Nullam sodales at mi id laoreet.",
  "Ut eget neque viverra, laoreet mi eu, pulvinar felis.",
  "Nunc quis lobortis mi.",
  "Integer eget massa cursus leo varius ullamcorper.",
  "In sit amet aliquet erat.",
  "Donec in viverra sapien.",
  "Mauris congue quam ut sollicitudin tempus.",
  "Maecenas vulputate erat et quam ullamcorper, ac gravida velit mollis.",
  "Aenean consectetur mauris in odio commodo porta.",
  "In vel neque sit amet dui pharetra bibendum.",
  "Mauris lacinia ex eu ante pharetra, a malesuada dolor volutpat.",
  "Sed rhoncus, libero at maximus vestibulum, ante justo facilisis felis, a dapibus eros arcu vitae purus.",
  "Duis facilisis metus blandit leo consequat, at tincidunt eros finibus.",
  "In tincidunt, quam sed bibendum vulputate, justo metus sagittis erat, in finibus erat sem at est.",
  "Quisque nec risus vitae erat interdum elementum vitae at dui.",
  "Donec quis consectetur ligula, ullamcorper eleifend ligula.",
  "Fusce venenatis aliquam suscipit.",
  "Donec venenatis sapien nec erat tincidunt facilisis.",
  "Duis dui purus, finibus sit amet dapibus sit amet, tristique ut ante.",
  "Vivamus viverra sem eu dolor fermentum, quis semper risus fringilla.",
  "In interdum consequat mauris at mollis."
];

// ----------------- Helper functions -----------------
function generateLoremParagraph(sentencesPerParagraph: number) {
  let paragraph = '';
  for (let i = 0; i < sentencesPerParagraph; i++) {
    const sentence = loremSentences[Math.floor(Math.random() * loremSentences.length)];
    paragraph += sentence + ' ';
  }
  return paragraph.trim();
}

function generateLoremText(paragraphCount: number, sentencesPerParagraph: number) {
  let text = '';
  for (let i = 0; i < paragraphCount; i++) {
    text += generateLoremParagraph(sentencesPerParagraph) + '\n\n';
  }
  return text.trim();
}

const TextToolsPage: React.FC = () => {
    // ----------------- Tabs -----------------
  const [selectedTab, setSelectedTab] = useState<'textCounter' | 'loremIpsum'>('textCounter');


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
    palindromeWords: 0 
  });
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [reverseDropdownOpen, setReverseDropdownOpen] = useState(false);
  const reverseDropdownRef = useRef<HTMLDivElement>(null);
  const convertCaseDropdownRef = useRef<HTMLDivElement>(null);
  const loremDropdownRef = useRef<HTMLDivElement>(null);

  


  // Lorem Ipsum state
  const [loremText, setLoremText] = useState('');
  const [paragraphsCount, setParagraphsCount] = useState(3);
  const [sentencesPerParagraph, setSentencesPerParagraph] = useState(5);
  const [loremDropdownOpen, setLoremDropdownOpen] = useState(false);

  // ----------------- Close dropdowns when clicking outside -----------------
const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          (reverseDropdownRef.current && !reverseDropdownRef.current.contains(event.target as Node)) &&
          reverseDropdownOpen
        ) {
          setReverseDropdownOpen(false);
        }
    
        if (
          (convertCaseDropdownRef.current && !convertCaseDropdownRef.current.contains(event.target as Node)) &&
          dropdownOpen
        ) {
          setDropdownOpen(false);
        }
    
        if (
          (loremDropdownRef.current && !loremDropdownRef.current.contains(event.target as Node)) &&
          loremDropdownOpen
        ) {
          setLoremDropdownOpen(false);
        }
      };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [reverseDropdownOpen, dropdownOpen, loremDropdownOpen]);

/// dropdown menu done ✅

  // Text Counter Stats Calculation
  useEffect(() => {
    calculateStats();
  }, [text]);

  const calculateStats = () => {
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const sentences = text.trim() === '' ? 0 : text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphs = text.trim() === '' ? 0 : text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
    const lines = text === '' ? 0 : text.split(/\n/).length;
    const readingTime = Math.ceil(words / 200);
    

    setStats({ characters, charactersNoSpaces, words, sentences, paragraphs, lines, readingTime });
  };

  const clearText = () => setText('');

  // dropdwon meny

  //palindromeWords
    const calculateStats = () => {
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const wordsArray = text.trim() === '' ? [] : text.trim().split(/\s+/);
    const words = wordsArray.length;
    const sentences = text.trim() === '' ? 0 : text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphs = text.trim() === '' ? 0 : text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
    const lines = text === '' ? 0 : text.split(/\n/).length;
    const readingTime = Math.ceil(words / 200);
  
    // Count palindrome words
    const palindromeWords = wordsArray.filter(word => {
      const cleanWord = word.replace(/[^a-z0-9]/gi, '').toLowerCase();
      return cleanWord.length > 1 && cleanWord === cleanWord.split('').reverse().join('');
    }).length;
  
    setStats({ characters, charactersNoSpaces, words, sentences, paragraphs, lines, readingTime, palindromeWords });
  };

    
  
  // Reverse dropdwon 
  const reverseText = (mode: 'word' | 'sentence' | 'line') => {
      if (!text) return;
    
      let reversed = '';
      switch(mode) {
        case 'word':
          reversed = text.split(/\s+/).reverse().join(' ');
          break;
        case 'sentence':
          reversed = text.split(/([.!?]+)/).reduce((acc, curr, idx, arr) => {
            if (/[.!?]+/.test(curr)) return acc; 
            return acc + curr.split(' ').reverse().join(' ') + (arr[idx+1] || '');
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
  const convertText = (mode: 'upper' | 'lower' | 'title' | 'sentence' | 'clean', target: 'text' | 'lorem') => {
    let sourceText = target === 'text' ? text : loremText;
    let converted = sourceText;

    switch (mode) {
      case 'upper':
        converted = sourceText.toUpperCase();
        break;
      case 'lower':
        converted = sourceText.toLowerCase();
        break;
      case 'title':
        converted = sourceText.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        break;
      case 'sentence':
        converted = sourceText.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
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

  const generateLoremIpsum = () => {
    const text = generateLoremText(paragraphsCount, sentencesPerParagraph);
    setLoremText(text);
  };

  return (
    <>
      <SEOHead
        title={seoData.textCounter?.title || 'Text Tools - Text Counter & Lorem Ipsum Generator'}
        description={seoData.textCounter?.description || 'Text counter and Lorem Ipsum generator with convert case tools.'}
        canonical="https://calculatorhub.com/text-tools"
        schemaData={generateCalculatorSchema(
          'Text Tools',
          'Text counter and Lorem Ipsum generator with convert case tools',
          '/text-tools',
          ['text counter', 'lorem ipsum generator', 'word counter', 'character counter']
        )}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Text Tools', url: '/text-tools' }
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Text Tools', url: '/text-tools' }
        ]} />

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          <button
            className={`px-4 py-2 rounded-xl font-semibold ${selectedTab === 'textCounter' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            onClick={() => setSelectedTab('textCounter')}
          >
            Text Counter
          </button>
          <button
            className={`px-4 py-2 rounded-xl font-semibold ${selectedTab === 'loremIpsum' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            onClick={() => setSelectedTab('loremIpsum')}
          >
            Lorem Ipsum Generator
          </button> 
        
          <button
            className={`px-4 py-2 rounded-xl font-semibold ${selectedTab === 'binarytotext' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            onClick={() => setSelectedTab('binarytotext')}
          >
            Binary ↔ Text 
          </button>
        </div>

        {/* ----------------- Text Counter ----------------- */}
        {selectedTab === 'textCounter' && (
          <div className="glow-card rounded-2xl p-4 sm:p-6 md:p-8 mb-8 relative">
            <div className="flex items-center space-x-3 mb-6">
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
                className="absolute top-2 right-2 text-sm text-blue-400 hover:text-blue-300 transition-colors bg-slate-800/70 px-3 py-1 rounded-md border border-slate-600"
              >
                Paste
              </button>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full max-w-full h-64 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
              placeholder="Start typing or paste your text here..."
            />

            <div className="flex flex-wrap justify-between items-center mt-2 gap-2" >
             
              {/* text reverse */}
                {/* Reverse Text Dropdown */}
                  <div className="relative" ref={reverseDropdownRef}>
                    <button
                      onClick={() => setReverseDropdownOpen(!reverseDropdownOpen)} 
                      className="flex items-center text-xs bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded transition"
                    >
                      Reverse <ChevronDown className="ml-1 h-4 w-4" />
                    </button>
                    {reverseDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-36 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50">
                        <button onClick={() => reverseText('word')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">Word</button>
                        <button onClick={() => reverseText('sentence')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">Sentence</button>
                        <button onClick={() => reverseText('line')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">Line</button>
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
                      <button onClick={() => convertText('upper', 'text')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">🔠 UPPERCASE</button>
                      <button onClick={() => convertText('lower', 'text')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">🔡 lowercase</button>
                      <button onClick={() => convertText('title', 'text')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">🧾 Title Case</button>
                      <button onClick={() => convertText('sentence', 'text')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">📝 Sentence Case</button>
                      <button onClick={() => convertText('clean', 'text')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">✂️ Clean Spaces</button>
                    </div>
                  )}
                </div>

                <button className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded transition" onClick={() => copyTextToClipboard(text)}>{copied ? 'Copied!' : 'Copy'}</button>
                <button onClick={() => downloadTextFile(text, 'text-counter.txt')} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded transition">Download</button>
                <button onClick={clearText} className="text-xs text-red-400 hover:text-red-300 transition-colors">Clear</button>
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
              <div className="p-4 bg-gradient-to-br from-indigo-900/30 to-indigo-800/30 rounded-xl border border-indigo-500/30 col-span-2">
                <p className="text-sm text-slate-400 mb-1">Reading Time</p>
                <p className="text-3xl font-bold text-white">{stats.readingTime} min{stats.readingTime !== 1 ? 's' : ''}</p>
                <p className="text-xs text-slate-500 mt-1">Based on 200 words/min</p>
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
                  onChange={e => setParagraphsCount(Number(e.target.value))}
                  className="w-36 px-3 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Word Number"
                />
          
                <button
                  onClick={() => {
                    const totalWords = paragraphsCount;
                    const loremArray = [];
                    while (loremArray.join(' ').split(' ').length < totalWords) {
                      const sentence = loremSentences[Math.floor(Math.random() * loremSentences.length)];
                      loremArray.push(sentence);
                    }
                    const generated = loremArray.join(' ').split(' ').slice(0, totalWords).join(' ');
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
          
              {/* Bottom-right tools */}
              <div className="flex flex-wrap justify-between items-center mt-2 gap-2">
                <p className="text-sm text-slate-400">Modify or download your generated Lorem Ipsum</p>
          
                <div className="flex flex-wrap items-center gap-2 relative">
                  {/* Convert Case Dropdown */}
                  <div className="relative" ref={loremDropdownRef}>
                    <button
                      onClick={() => setLoremDropdownOpen(!loremDropdownOpen)}
                      className="flex items-center text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded transition"
                    >
                      Convert Case <ChevronDown className="ml-1 h-4 w-4" />
                    </button>
                    {loremDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50">
                        <button onClick={() => convertText('upper', 'lorem')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">🔠 UPPERCASE</button>
                        <button onClick={() => convertText('lower', 'lorem')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">🔡 lowercase</button>
                        <button onClick={() => convertText('title', 'lorem')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">🧾 Title Case</button>
                        <button onClick={() => convertText('sentence', 'lorem')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">📝 Sentence Case</button>
                        <button onClick={() => convertText('clean', 'lorem')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">✂️ Clean Spaces</button>
                      </div>
                    )}
                  </div>
          
                  <button onClick={() => copyTextToClipboard(loremText)} className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded transition">{copied ? 'Copied!' : 'Copy'}</button>
                  <button onClick={() => downloadTextFile(loremText, 'lorem-ipsum.txt')} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded transition">Download</button>
                  <button onClick={() => setLoremText('')} className="text-xs text-red-400 hover:text-red-300 transition-colors">Clear</button>
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
                      .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
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
                        .split(' ')
                        .map(b => String.fromCharCode(parseInt(b, 2)))
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
          
                <button className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded transition" onClick={() => copyTextToClipboard(binaryText)}>{copied ? 'Copied!' : 'Copy'}</button>

                <button
                  onClick={() => downloadTextFile(binaryText, 'binary.txt')}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded transition"
                >
                  Download
                </button>
                <button className="text-xs text-red-400 hover:text-red-300 transition-colors" onClick={() => setBinaryText('')}>Clear</button>
                
              </div>
            </div>
          )}


        <AdBanner />
        <RelatedCalculators currentPath="/text-tools" />
      </div>
    </>
  );
};

export default TextToolsPage;
 