import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Clipboard, Download, RotateCcw, Edit } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import { generateLoremText } from '../utils/loremGenerator';
import { numberToWords, wordsToNumber } from '../utils/numberWordsConverter';
import { generateCalculatorSchema } from '../utils/seoSchema';

const TextCounter: React.FC = () => {
  // Text Counter State
  const [text, setText] = useState('');
  const [stats, setStats] = useState({
    words: 0,
    sentences: 0,
    paragraphs: 0,
    lines: 0,
    characters: 0,
    palindromeWords: 0,
    readingTime: '0 min',
  });

  // Copy States
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLorem, setCopiedLorem] = useState(false);
  const [copiedBinary, setCopiedBinary] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Case / Reverse Dropdown
  const [caseDropdown, setCaseDropdown] = useState(false);
  const [reverseDropdown, setReverseDropdown] = useState(false);

  // Lorem Ipsum State
  const [loremText, setLoremText] = useState('');
  const [paragraphsCount, setParagraphsCount] = useState(3);
  const [sentencesPerParagraph, setSentencesPerParagraph] = useState(5);

  // Binary ↔ Text State
  const [binaryText, setBinaryText] = useState('');
  const [binaryResult, setBinaryResult] = useState('');

  // Number ↔ Words State
  const [numberInput, setNumberInput] = useState('');
  const [numberResult, setNumberResult] = useState('');

  /** DEBOUNCED STATS CALCULATION **/
  useEffect(() => {
    const timer = setTimeout(() => calculateStats(), 300);
    return () => clearTimeout(timer);
  }, [text]);

  const calculateStats = () => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const sentences = text.split(/[.!?]+/).filter(Boolean).length;
    const paragraphs = text.split(/\n+/).filter(Boolean).length;
    const lines = text.split(/\n/).length;
    const characters = text.length;
    const palindromeWords = text
      .split(/\s+/)
      .filter(
        (word) => word.length > 1 && word.toLowerCase() === word.toLowerCase().split('').reverse().join('')
      ).length;
    const readingTime = Math.ceil(words / 200);

    setStats({
      words,
      sentences,
      paragraphs,
      lines,
      characters,
      palindromeWords,
      readingTime: `${readingTime} min`,
    });
  };

  /** CASE CONVERSION **/
  const handleCaseChange = (type: string) => {
    if (!text) return;
    let newText = '';
    switch (type) {
      case 'uppercase':
        newText = text.toUpperCase();
        break;
      case 'lowercase':
        newText = text.toLowerCase();
        break;
      case 'capitalize':
        newText = text.replace(/\b\w/g, (c) => c.toUpperCase());
        break;
      case 'title':
        newText = text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
        break;
      case 'toggle':
        newText = text
          .split('')
          .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
          .join('');
        break;
    }
    setText(newText);
    setCaseDropdown(false);
  };

  /** REVERSE TEXT **/
  const handleReverseChange = (type: string) => {
    if (!text) return;
    let newText = '';
    switch (type) {
      case 'words':
        newText = text.split(' ').reverse().join(' ');
        break;
      case 'letters':
        newText = text.split('').reverse().join('');
        break;
    }
    setText(newText);
    setReverseDropdown(false);
  };

  /** COPY TO CLIPBOARD **/
  const copyToClipboard = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    switch (type) {
      case 'text':
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 1500);
        break;
      case 'lorem':
        setCopiedLorem(true);
        setTimeout(() => setCopiedLorem(false), 1500);
        break;
      case 'binary':
        setCopiedBinary(true);
        setTimeout(() => setCopiedBinary(false), 1500);
        break;
      case 'number':
        setCopiedNumber(true);
        setTimeout(() => setCopiedNumber(false), 1500);
        break;
    }
  };

  /** DOWNLOAD TEXT **/
  const downloadText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  /** LOREM IPSUM GENERATOR **/
  const generateLorem = () => {
    const text = generateLoremText(paragraphsCount, sentencesPerParagraph);
    setLoremText(text);
  };

  /** BINARY ↔ TEXT CONVERTER **/
  const handleBinaryToText = () => {
    if (!/^[01\s]+$/.test(binaryText)) {
      alert('Binary input must contain only 0 and 1.');
      return;
    }
    const result = binaryText
      .trim()
      .split(' ')
      .map((b) => String.fromCharCode(parseInt(b, 2)))
      .join('');
    setBinaryResult(result);
  };

  const handleTextToBinary = () => {
    const result = text
      .split('')
      .map((c) => c.charCodeAt(0).toString(2).padStart(8, '0'))
      .join(' ');
    setBinaryResult(result);
  };

  /** NUMBER ↔ WORDS **/
  const handleNumberToWords = () => {
    setNumberResult(numberToWords(Number(numberInput)));
  };

  const handleWordsToNumber = () => {
    setNumberResult(wordsToNumber(numberInput).toString());
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* SEO Head */}
      {generateCalculatorSchema({
        title: 'Text Counter Online Tool',
        description: 'Count words, characters, sentences, paragraphs and more online.',
      })}

      <h1 className="text-3xl font-bold mb-4 text-center">Text Counter Tool</h1>

      {/* Text Counter Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Text Counter</h2>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg min-h-[200px] mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Paste or type your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="flex flex-wrap gap-2 mb-2">
          <button
            onClick={() => copyToClipboard(text, 'text')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
            <Clipboard size={16} /> {copiedText ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={() => downloadText(text, 'text.txt')}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
            <Download size={16} /> Download
          </button>

          {/* Case Dropdown */}
          <div className="relative">
            <button
              onClick={() => setCaseDropdown(!caseDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition">
              <Edit size={16} /> Case
            </button>
            {caseDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow z-10">
                {['uppercase', 'lowercase', 'capitalize', 'title', 'toggle'].map((c) => (
                  <button
                    key={c}
                    onClick={() => handleCaseChange(c)}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100">
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reverse Dropdown */}
          <div className="relative">
            <button
              onClick={() => setReverseDropdown(!reverseDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition">
              <RotateCcw size={16} /> Reverse
            </button>
            {reverseDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow z-10">
                {['words', 'letters'].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleReverseChange(r)}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100">
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
          <div>Words: {stats.words}</div>
          <div>Characters: {stats.characters}</div>
          <div>Sentences: {stats.sentences}</div>
          <div>Paragraphs: {stats.paragraphs}</div>
          <div>Lines: {stats.lines}</div>
          <div>Palindrome Words: {stats.palindromeWords}</div>
          <div>Reading Time: {stats.readingTime}</div>
        </div>
      </section>

      {/* Lorem Ipsum */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Lorem Ipsum Generator</h2>
        <div className="flex flex-wrap gap-2 mb-2">
          <input
            type="number"
            min={1}
            value={paragraphsCount}
            onChange={(e) => setParagraphsCount(Number(e.target.value))}
            className="w-24 p-2 border rounded"
            placeholder="Paragraphs"
          />
          <input
            type="number"
            min={1}
            value={sentencesPerParagraph}
            onChange={(e) => setSentencesPerParagraph(Number(e.target.value))}
            className="w-24 p-2 border rounded"
            placeholder="Sentences"
          />
          <button
            onClick={generateLorem}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
            Generate
          </button>
          <button
            onClick={() => copyToClipboard(loremText, 'lorem')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition">
            {copiedLorem ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg min-h-[150px]"
          value={loremText}
          readOnly
        />
      </section>

      {/* Binary ↔ Text */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Binary ↔ Text Converter</h2>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg min-h-[100px] mb-2"
          value={binaryText}
          onChange={(e) => setBinaryText(e.target.value)}
          placeholder="Enter binary or text"
        />
        <div className="flex gap-2 mb-2 flex-wrap">
          <button
            onClick={handleBinaryToText}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
            Binary → Text
          </button>
          <button
            onClick={handleTextToBinary}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition">
            Text → Binary
          </button>
          <button
            onClick={() => copyToClipboard(binaryResult, 'binary')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition">
            {copiedBinary ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <textarea className="w-full p-3 border border-gray-300 rounded-lg min-h-[100px]" value={binaryResult} readOnly />
      </section>

      {/* Number ↔ Words */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Number ↔ Words Converter</h2>
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded-lg mb-2"
          placeholder="Enter number or words"
          value={numberInput}
          onChange={(e) => setNumberInput(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap mb-2">
          <button
            onClick={handleNumberToWords}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
            Number → Words
          </button>
          <button
            onClick={handleWordsToNumber}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition">
            Words → Number
          </button>
          <button
            onClick={() => copyToClipboard(numberResult, 'number')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition">
            {copiedNumber ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <textarea className="w-full p-3 border border-gray-300 rounded-lg min-h-[100px]" value={numberResult} readOnly />
      </section>

      {/* Ad Banner */}
      <AdBanner />
    </div>
  );
};

export default TextCounter;
