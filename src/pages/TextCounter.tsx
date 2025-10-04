import React, { useState, useEffect } from 'react';
import { FileText, ChevronDown } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const TextCounter: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [stats, setStats] = useState({
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0,
    lines: 0,
    readingTime: 0
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

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

    setStats({
      characters,
      charactersNoSpaces,
      words,
      sentences,
      paragraphs,
      lines,
      readingTime
    });
  };

  const clearText = () => setText('');

  // 🔠 Convert Case Functions
  const toUpperCase = () => setText(text.toUpperCase());
  const toLowerCase = () => setText(text.toLowerCase());
  const toTitleCase = () => {
    const converted = text
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
    setText(converted);
  };
  const toSentenceCase = () => {
    const converted = text
      .toLowerCase()
      .replace(/(^\s*\w|[.!?]\s*\w)/g, char => char.toUpperCase());
    setText(converted);
  };
  const removeExtraSpaces = () => {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    setText(cleaned);
  };

  // 📋 Copy Text
  const copyText = async () => {
    if (text.trim() === '') return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // 💾 Download Text File
  const downloadText = () => {
    if (text.trim() === '') return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'text-counter-output.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

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

  return (
    <>
      <SEOHead
        title={seoData.textCounter?.title || 'Text Counter - Character, Word, and Sentence Counter'}
        description={seoData.textCounter?.description || 'Count characters, words, sentences, and paragraphs in your text. Get reading time estimates and detailed text statistics instantly.'}
        canonical="https://calculatorhub.com/text-counter"
        schemaData={generateCalculatorSchema(
          'Text Counter',
          'Count characters, words, sentences, and paragraphs in text',
          '/text-counter',
          ['text counter', 'word counter', 'character counter', 'word count', 'character count']
        )}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Text Counter', url: '/text-counter' }
        ]}
      />
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Misc Tools', url: '/category/misc-tools' },
            { name: 'Text Counter', url: '/text-counter' }
          ]}
        />

        <div className="glow-card rounded-2xl p-8 mb-8 relative">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Text Counter</h1>
          </div>

          <div className="mb-6 relative">
            <label className="block text-sm font-medium text-white mb-2">
              Enter or Paste Your Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-64 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Start typing or paste your text here..."
            />

            {/* Controls Row */}
            <div className="flex flex-wrap justify-between items-center mt-2 gap-2">
              <p className="text-sm text-slate-400">
                Real-time analysis as you type
              </p>

              <div className="flex flex-wrap items-center gap-2 relative">
                {/* 🔽 Dropdown Menu */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded transition"
                  >
                    Convert Case
                    <ChevronDown className="ml-1 h-4 w-4" />
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
                        ✍️ Sentence Case
                      </button>
                      <button
                        onClick={() => handleDropdownSelect('clean')}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                      >
                        🧹 Clean Extra Spaces
                      </button>
                    </div>
                  )}
                </div>

                {/* Copy / Download / Clear */}
                <button
                  onClick={copyText}
                  className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded transition"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>

                <button
                  onClick={downloadText}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded transition"
                >
                  Download
                </button>

                <button
                  onClick={clearText}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors ml-2"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Characters', value: stats.characters, color: 'blue' },
              { label: 'No Spaces', value: stats.charactersNoSpaces, color: 'purple' },
              { label: 'Words', value: stats.words, color: 'green' },
              { label: 'Sentences', value: stats.sentences, color: 'orange' },
              { label: 'Paragraphs', value: stats.paragraphs, color: 'pink' },
              { label: 'Lines', value: stats.lines, color: 'teal' }
            ].map((item, i) => (
              <div
                key={i}
                className={`p-4 bg-gradient-to-br from-${item.color}-900/30 to-${item.color}-800/30 rounded-xl border border-${item.color}-500/30`}
              >
                <p className="text-sm text-slate-400 mb-1">{item.label}</p>
                <p className="text-3xl font-bold text-white">
                  {item.value.toLocaleString()}
                </p>
              </div>
            ))}

            <div className="p-4 bg-gradient-to-br from-indigo-900/30 to-indigo-800/30 rounded-xl border border-indigo-500/30 col-span-2">
              <p className="text-sm text-slate-400 mb-1">Reading Time</p>
              <p className="text-3xl font-bold text-white">
                {stats.readingTime} min{stats.readingTime !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-slate-500 mt-1">Based on 200 words/min</p>
            </div>
          </div>
        </div>

        <AdBanner />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">About Text Counter</h2>
          <div className="space-y-4 text-slate-300">
            <p>
              Our text counter provides comprehensive analysis of your text including character count,
              word count, sentence count, and more. Perfect for writers, students, and content creators
              who need to meet specific text requirements.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6">Features:</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Real-time character and word counting</li>
              <li>Convert case, clean spaces, copy, and download options</li>
              <li>Sentence, paragraph, and line analysis</li>
              <li>Reading time estimation</li>
              <li>No character or word limits</li>
            </ul>
          </div>
        </div>

        <RelatedCalculators currentPath="/text-counter" />
      </div>
    </>
  );
};

export default TextCounter;
