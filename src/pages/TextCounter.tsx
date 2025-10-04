import React, { useState, useEffect, useRef } from 'react'; // added useRef
import { FileText, ChevronDown } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

// ... your loremSentences, generateLoremParagraph, generateLoremText functions remain unchanged

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
    readingTime: 0
  });
  const [copied, setCopied] = useState(false);

  // Dropdown states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [reverseDropdownOpen, setReverseDropdownOpen] = useState(false);
  const [loremDropdownOpen, setLoremDropdownOpen] = useState(false);

  // ----------------- Refs for click outside detection -----------------
  const dropdownRef = useRef<HTMLDivElement>(null);
  const reverseDropdownRef = useRef<HTMLDivElement>(null);
  const loremDropdownRef = useRef<HTMLDivElement>(null);

  // ----------------- Lorem Ipsum state -----------------
  const [loremText, setLoremText] = useState('');
  const [paragraphsCount, setParagraphsCount] = useState(3);
  const [sentencesPerParagraph, setSentencesPerParagraph] = useState(5);

  // ----------------- Calculate text stats -----------------
  useEffect(() => { calculateStats(); }, [text]);

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

  // ----------------- Click outside detection -----------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setDropdownOpen(false);
      if (reverseDropdownRef.current && !reverseDropdownRef.current.contains(event.target as Node)) setReverseDropdownOpen(false);
      if (loremDropdownRef.current && !loremDropdownRef.current.contains(event.target as Node)) setLoremDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  // ----------------- Other functions remain unchanged -----------------
  const clearText = () => setText('');
  const reverseText = (mode: 'word' | 'sentence' | 'line') => { /* unchanged */ };
  const convertText = (mode: 'upper' | 'lower' | 'title' | 'sentence' | 'clean', target: 'text' | 'lorem') => { /* unchanged */ };
  const copyTextToClipboard = async (sourceText: string) => { /* unchanged */ };
  const downloadTextFile = (sourceText: string, filename: string) => { /* unchanged */ };
  const generateLoremIpsum = () => { /* unchanged */ };

  return (
    <>
      {/* SEO, Breadcrumbs, Tabs remain unchanged */}

      {/* ----------------- Text Counter ----------------- */}
      {selectedTab === 'textCounter' && (
        <div className="glow-card rounded-2xl p-8 mb-8 relative">
          {/* ... header, textarea remain unchanged */}

          <div className="flex flex-wrap justify-between items-center mt-2 gap-2">
            {/* Reverse Text Dropdown */}
            <div ref={reverseDropdownRef} className="relative">
              <button onClick={() => setReverseDropdownOpen(!reverseDropdownOpen)} className="flex items-center text-xs bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded transition">
                Reverse <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {reverseDropdownOpen && (
                <div className="absolute left-0 mt-2 w-36 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50">
                  <button onClick={() => reverseText('word')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">Reverse by Word</button>
                  <button onClick={() => reverseText('sentence')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">Reverse by Sentence</button>
                  <button onClick={() => reverseText('line')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700">Reverse by Line</button>
                </div>
              )}
            </div>

            {/* Convert Case Dropdown */}
            <div ref={dropdownRef} className="relative">
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded transition">
                Convert Case <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50">
                  {/* ... dropdown buttons remain unchanged */}
                </div>
              )}
            </div>

            {/* Copy, Download, Clear buttons remain unchanged */}
          </div>

          {/* Statistics grid remains unchanged */}
        </div>
      )}

      {/* ----------------- Lorem Ipsum Generator ----------------- */}
      {selectedTab === 'loremIpsum' && (
        <div className="glow-card rounded-2xl p-8 mb-8 relative">
          {/* ... header, inputs, textarea remain unchanged */}

          <div className="flex flex-wrap justify-between items-center mt-2 gap-2">
            <div ref={loremDropdownRef} className="relative">
              <button onClick={() => setLoremDropdownOpen(!loremDropdownOpen)} className="flex items-center text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded transition">
                Convert Case <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {loremDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50">
                  {/* ... dropdown buttons remain unchanged */}
                </div>
              )}
            </div>

            {/* Copy, Download, Clear buttons remain unchanged */}
          </div>
        </div>
      )}

      <AdBanner />
      <RelatedCalculators currentPath="/text-tools" />
    </>
  );
};

export default TextToolsPage;
