import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
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

  // ✂️ Remove Extra Spaces
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
        <Breadcrumbs items={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Text Counter', url: '/text-counter' }
        ]} />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Text Counter</h1>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              Enter or Paste Your Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-64 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Start typing or paste your text here..."
            />

            {/* Buttons Row */}
            <div className="flex flex-wrap justify-between items-center mt-2 gap-2">
              <p className="text-sm text-slate-400">
                Real-time analysis as you type
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {/* 🔠 Convert Case Buttons */}
                <button
                  onClick={toUpperCase}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded transition"
                >
                  UPPERCASE
                </button>
                <button
                  onClick={toLowerCase}
                  className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded transition"
                >
                  lowercase
                </button>
                <button
                  onClick={toTitleCase}
                  className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded transition"
                >
                  Title Case
                </button>
                <button
                  onClick={toSentenceCase}
                  className="text-xs bg-pink-600 hover:bg-pink-500 text-white px-3 py-1 rounded transition"
                >
                  Sentence Case
                </button>

                {/* ✂️ Extra Tools */}
                <button
                  onClick={removeExtraSpaces}
                  className="text-xs bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded transition"
                >
                  Clean Spaces
                </button>
                <button
                  onClick={copyText}
                  className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded transition"
                >
                  {copied ? 'Copied!' : 'Copy Text'}
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <li>Count with and without spaces</li>
              <li>Sentence and paragraph analysis</li>
              <li>Line count for structured text</li>
              <li>Reading time estimation</li>
              <li>Convert case, copy, clean spaces, and download tools</li>
            </ul>
            <h3 className="text-xl font-semibold text-white mt-6">Common Uses:</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Essay and article writing</li>
              <li>Social media post optimization (Twitter, Facebook)</li>
              <li>SEO content optimization</li>
              <li>Academic paper requirements</li>
              <li>Resume and cover letter writing</li>
              <li>SMS and text message limits</li>
            </ul>
          </div>
        </div>

        <RelatedCalculators currentPath="/text-counter" />
      </div>
    </>
  );
};

export default TextCounter;
