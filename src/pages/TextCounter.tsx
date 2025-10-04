import React, { useState, useEffect } from 'react';
import { FileText, ChevronDown, Copy, Download } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const TextToolsPage: React.FC = () => {
  // Tabs
  const [selectedTab, setSelectedTab] = useState<'textCounter' | 'loremIpsum'>('textCounter');

  // Shared states
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // ----------------- Text Counter States -----------------
  const [text, setText] = useState('');
  const [stats, setStats] = useState({
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0,
    lines: 0,
    readingTime: 0,
  });

  useEffect(() => {
    if (selectedTab === 'textCounter') calculateTextStats();
  }, [text]);

  const calculateTextStats = () => {
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const sentences =
      text.trim() === ''
        ? 0
        : text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
    const paragraphs =
      text.trim() === ''
        ? 0
        : text.split(/\n\n+/).filter((p) => p.trim().length > 0).length;
    const lines = text === '' ? 0 : text.split(/\n/).length;
    const readingTime = Math.ceil(words / 200);

    setStats({
      characters,
      charactersNoSpaces,
      words,
      sentences,
      paragraphs,
      lines,
      readingTime,
    });
  };

  const clearText = () => setText('');

  // ----------------- Convert Case Functions -----------------
  const toUpperCase = () => setText(text.toUpperCase());
  const toLowerCase = () => setText(text.toLowerCase());
  const toTitleCase = () =>
    setText(
      text
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())
    );
  const toSentenceCase = () =>
    setText(
      text
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, (char) => char.toUpperCase())
    );
  const removeExtraSpaces = () => setText(text.replace(/\s+/g, ' ').trim());

  const handleDropdownSelect = (option: string) => {
    switch (option) {
      case 'upper':
        toUpperCase();
        break;
      case 'lower':
        toLowerCase();
        break;
      case 'title':
        toTitleCase();
        break;
      case 'sentence':
        toSentenceCase();
        break;
      case 'clean':
        removeExtraSpaces();
        break;
    }
    setDropdownOpen(false);
  };

  // ----------------- Lorem Ipsum States -----------------
  const [loremText, setLoremText] = useState('');
  const [paragraphsCount, setParagraphsCount] = useState(3);
  const [loremDropdownOpen, setLoremDropdownOpen] = useState(false);

  const generateLoremIpsum = () => {
    const loremParagraph =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum. Cras venenatis euismod malesuada.';
    let text = '';
    for (let i = 0; i < paragraphsCount; i++) {
      text += loremParagraph + '\n\n';
    }
    setLoremText(text.trim());
  };

  const handleLoremDropdownSelect = (option: string) => {
    switch (option) {
      case 'upper':
        setLoremText(loremText.toUpperCase());
        break;
      case 'lower':
        setLoremText(loremText.toLowerCase());
        break;
      case 'title':
        setLoremText(
          loremText
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase())
        );
        break;
      case 'sentence':
        setLoremText(
          loremText
            .toLowerCase()
            .replace(/(^\s*\w|[.!?]\s*\w)/g, (char) => char.toUpperCase())
        );
        break;
      case 'clean':
        setLoremText(loremText.replace(/\s+/g, ' ').trim());
        break;
    }
    setLoremDropdownOpen(false);
  };

  // ----------------- Shared Utilities -----------------
  const copyTextToClipboard = async (content: string) => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadTextFile = (content: string, filename: string) => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
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
        title={seoData.textCounter?.title || 'Text Tools'}
        description={seoData.textCounter?.description || 'Text Counter and Lorem Ipsum Generator'}
        canonical="https://calculatorhub.com/text-tools"
        schemaData={generateCalculatorSchema(
          'Text Tools',
          'Text Counter and Lorem Ipsum Generator',
          '/text-tools',
          ['text counter', 'lorem ipsum', 'convert case', 'text tools']
        )}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Text Tools', url: '/text-tools' },
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Misc Tools', url: '/category/misc-tools' },
            { name: 'Text Tools', url: '/text-tools' },
          ]}
        />

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setSelectedTab('textCounter')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedTab === 'textCounter'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Text Counter
          </button>
          <button
            onClick={() => setSelectedTab('loremIpsum')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedTab === 'loremIpsum'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Lorem Ipsum Generator
          </button>
        </div>

        {/* Tab Panels */}
        {selectedTab === 'textCounter' && (
          <div className="glow-card rounded-2xl p-8 mb-8 relative">
            {/* Text Counter UI (same as before) */}
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="h-8 w-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">Text Counter</h1>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-64 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
              placeholder="Start typing or paste your text here..."
            />

            <div className="flex flex-wrap justify-between items-center mt-2 gap-2">
              <p className="text-sm text-slate-400">Real-time analysis as you type</p>

              <div className="flex flex-wrap items-center gap-2 relative">
                {/* Convert Case Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded transition"
                  >
                    Convert Case <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => handleDropdownSelect('upper')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        🔠 UPPERCASE
                      </button>
                      <button
                        onClick={() => handleDropdownSelect('lower')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        🔡 lowercase
                      </button>
                      <button
                        onClick={() => handleDropdownSelect('title')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        🧾 Title Case
                      </button>
                      <button
                        onClick={() => handleDropdownSelect('sentence')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        📝 Sentence Case
                      </button>
                      <button
                        onClick={() => handleDropdownSelect('clean')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        ✂️ Clean Spaces
                      </button>
                    </div>
                  )}
                </div>

                {/* Copy, Download, Clear */}
                <button
                  onClick={() => copyTextToClipboard(text)}
                  className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded transition"
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
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
                <p className="text-3xl font-bold text-white">
                  {stats.readingTime} min{stats.readingTime !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-slate-500 mt-1">Based on 200 words/min</p>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- Lorem Ipsum Generator ----------------- */}
        {selectedTab === 'loremIpsum' && (
          <div className="glow-card rounded-2xl p-8 mb-8 relative">
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="h-8 w-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">Lorem Ipsum Generator</h1>
            </div>

            <div className="flex flex-col md:flex-row gap-2 mb-4">
              <input
                type="number"
                min={1}
                max={50}
                value={paragraphsCount}
                onChange={(e) => setParagraphsCount(parseInt(e.target.value))}
                className="w-full md:w-36 px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paragraphs"
              />
              <button
                onClick={generateLoremIpsum}
                className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded transition"
              >
                Generate
              </button>
            </div>

            <textarea
              value={loremText}
              onChange={(e) => setLoremText(e.target.value)}
              className="w-full h-64 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
              placeholder="Generated Lorem Ipsum will appear here..."
            />

            <div className="flex flex-wrap justify-between items-center mt-2 gap-2">
              <p className="text-sm text-slate-400">Modify or copy your generated text</p>

              <div className="flex flex-wrap items-center gap-2 relative">
                {/* Convert Case Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setLoremDropdownOpen(!loremDropdownOpen)}
                    className="flex items-center text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded transition"
                  >
                    Convert Case <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  {loremDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => handleLoremDropdownSelect('upper')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        🔠 UPPERCASE
                      </button>
                      <button
                        onClick={() => handleLoremDropdownSelect('lower')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        🔡 lowercase
                      </button>
                      <button
                        onClick={() => handleLoremDropdownSelect('title')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        🧾 Title Case
                      </button>
                      <button
                        onClick={() => handleLoremDropdownSelect('sentence')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        📝 Sentence Case
                      </button>
                      <button
                        onClick={() => handleLoremDropdownSelect('clean')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        ✂️ Clean Spaces
                      </button>
                    </div>
                  )}
                </div>

                {/* Copy, Download, Clear */}
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

        <AdBanner />
        <RelatedCalculators currentPath="/text-tools" />
      </div>
    </>
  );
};

export default TextToolsPage;
