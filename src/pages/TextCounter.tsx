import React, { useState, useEffect } from 'react';
import { FileText, ChevronDown, RefreshCw } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

// ---------------- Lorem Ipsum Sentences ----------------
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

// ---------------- Helper Functions ----------------
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

// ---------------- Component ----------------
const TextToolsPage: React.FC = () => {
  // Tabs
  const [selectedTab, setSelectedTab] = useState<'textCounter' | 'loremIpsum' | 'textReverser'>('textCounter');

  // Common States
  const [copied, setCopied] = useState(false);

  // ---------------- TEXT COUNTER ----------------
  const [text, setText] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [stats, setStats] = useState({
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0,
    lines: 0,
    readingTime: 0
  });

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

  // ---------------- LOREM IPSUM ----------------
  const [loremText, setLoremText] = useState('');
  const [paragraphsCount, setParagraphsCount] = useState(3);
  const [loremDropdownOpen, setLoremDropdownOpen] = useState(false);

  const generateLoremIpsum = () => {
    const text = generateLoremText(paragraphsCount, 5);
    setLoremText(text);
  };

  // ---------------- TEXT REVERSER ----------------
  const [reverseInput, setReverseInput] = useState('');
  const [reversedOutput, setReversedOutput] = useState('');
  const [reverseDropdownOpen, setReverseDropdownOpen] = useState(false);

  const handleReverse = (value: string) => {
    setReverseInput(value);
    setReversedOutput(value.split('').reverse().join(''));
  };

  // ---------------- Common Tools ----------------
  const convertText = (mode: 'upper' | 'lower' | 'title' | 'sentence' | 'clean', target: 'text' | 'lorem' | 'reverse') => {
    let sourceText = target === 'text' ? text : target === 'lorem' ? loremText : reversedOutput;
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
    if (target === 'lorem') setLoremText(converted);
    if (target === 'reverse') setReversedOutput(converted);
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

  // ---------------- RETURN ----------------
  return (
    <>
      <SEOHead
        title="Text Tools - Counter, Lorem Ipsum, Reverser"
        description="Text Counter, Lorem Ipsum Generator, and Text Reverser tools with convert case, copy, and download options."
        canonical="https://calculatorhub.com/text-tools"
        schemaData={generateCalculatorSchema('Text Tools', 'All-in-one text utilities', '/text-tools')}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[{ name: 'Misc Tools', url: '/category/misc-tools' }, { name: 'Text Tools', url: '/text-tools' }]} />

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button onClick={() => setSelectedTab('textCounter')} className={`px-4 py-2 rounded-xl font-semibold ${selectedTab === 'textCounter' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Text Counter</button>
          <button onClick={() => setSelectedTab('loremIpsum')} className={`px-4 py-2 rounded-xl font-semibold ${selectedTab === 'loremIpsum' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Lorem Ipsum Generator</button>
          <button onClick={() => setSelectedTab('textReverser')} className={`px-4 py-2 rounded-xl font-semibold ${selectedTab === 'textReverser' ? 'bg-pink-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Text Reverser</button>
        </div>

        {/* ---------------- TEXT REVERSER ---------------- */}
        {selectedTab === 'textReverser' && (
          <div className="glow-card rounded-2xl p-8 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <RefreshCw className="h-8 w-8 text-pink-400" />
              <h1 className="text-3xl font-bold text-white">Text Reverser</h1>
            </div>

            <textarea
              value={reverseInput}
              onChange={(e) => handleReverse(e.target.value)}
              className="w-full h-40 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none mb-3"
              placeholder="Type or paste text to reverse..."
            />

            <textarea
              value={reversedOutput}
              readOnly
              className="w-full h-40 px-4 py-3 bg-slate-800 text-pink-100 rounded-lg border border-slate-700 focus:outline-none resize-none mb-3"
              placeholder="Reversed text will appear here..."
            />

            <div className="flex flex-wrap justify-between items-center mt-2 gap-2">
              <p className="text-sm text-slate-400">Reverse and modify your text easily</p>

              <div className="flex flex-wrap items-center gap-2 relative">
                <div className="relative">
                  <button
                    onClick={() => setReverseDropdownOpen(!reverseDropdownOpen)}
                    className="flex items-center text-xs bg-pink-700 hover:bg-pink-600 text-white px-3 py-1 rounded transition"
                  >
                    Convert Case <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  {reverseDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50">
                      <button onClick={() => convertText('upper', 'reverse')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">🔠 UPPERCASE</button>
                      <button onClick={() => convertText('lower', 'reverse')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">🔡 lowercase</button>
                      <button onClick={() => convertText('title', 'reverse')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">🧾 Title Case</button>
                      <button onClick={() => convertText('sentence', 'reverse')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">📝 Sentence Case</button>
                      <button onClick={() => convertText('clean', 'reverse')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">✂️ Clean Spaces</button>
                    </div>
                  )}
                </div>

                <button onClick={() => copyTextToClipboard(reversedOutput)} className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded transition">{copied ? 'Copied!' : 'Copy'}</button>
                <button onClick={() => downloadTextFile(reversedOutput, 'reversed-text.txt')} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded transition">Download</button>
                <button onClick={() => { setReverseInput(''); setReversedOutput(''); }} className="text-xs text-red-400 hover:text-red-300 transition-colors">Clear</button>
              </div>
            </div>
          </div>
        )}

        {/* Keep your existing text counter and lorem ipsum sections unchanged */}
        <AdBanner />
        <RelatedCalculators currentPath="/text-tools" />
      </div>
    </>
  );
};

export default TextToolsPage;
