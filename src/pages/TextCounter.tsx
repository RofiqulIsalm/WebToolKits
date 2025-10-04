import React, { useState, useEffect } from "react";
import { FileText, ChevronDown } from "lucide-react";
import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { seoData, generateCalculatorSchema } from "../utils/seoData";
import RelatedCalculators from "../components/RelatedCalculators";

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
  "In interdum consequat mauris at mollis.",
];

function generateLoremParagraph(sentencesPerParagraph: number) {
  let paragraph = "";
  for (let i = 0; i < sentencesPerParagraph; i++) {
    const sentence =
      loremSentences[Math.floor(Math.random() * loremSentences.length)];
    paragraph += sentence + " ";
  }
  return paragraph.trim();
}

function generateLoremText(paragraphCount: number, sentencesPerParagraph: number) {
  let text = "";
  for (let i = 0; i < paragraphCount; i++) {
    text += generateLoremParagraph(sentencesPerParagraph) + "\n\n";
  }
  return text.trim();
}

const TextToolsPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<
    "textCounter" | "loremIpsum" | "binarytotext"
  >("textCounter");
  const [text, setText] = useState("");
  const [stats, setStats] = useState({
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0,
    lines: 0,
    readingTime: 0,
  });
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [reverseDropdownOpen, setReverseDropdownOpen] = useState(false);
  const [loremText, setLoremText] = useState("");
  const [paragraphsCount, setParagraphsCount] = useState(3);
  const [sentencesPerParagraph, setSentencesPerParagraph] = useState(5);
  const [loremDropdownOpen, setLoremDropdownOpen] = useState(false);

  useEffect(() => {
    calculateStats();
  }, [text]);

  const calculateStats = () => {
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    const sentences =
      text.trim() === ""
        ? 0
        : text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
    const paragraphs =
      text.trim() === ""
        ? 0
        : text.split(/\n\n+/).filter((p) => p.trim().length > 0).length;
    const lines = text === "" ? 0 : text.split(/\n/).length;
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

  const clearText = () => setText("");

  const reverseText = (mode: "word" | "sentence" | "line") => {
    if (!text) return;

    let reversed = "";
    switch (mode) {
      case "word":
        reversed = text.split(/\s+/).reverse().join(" ");
        break;
      case "sentence":
        reversed = text
          .split(/([.!?]+)/)
          .reduce((acc, curr, idx, arr) => {
            if (/[.!?]+/.test(curr)) return acc;
            return (
              acc +
              curr.split(" ").reverse().join(" ") +
              (arr[idx + 1] || "")
            );
          }, "");
        break;
      case "line":
        reversed = text.split("\n").reverse().join("\n");
        break;
    }

    setText(reversed);
  };

  const convertText = (
    mode: "upper" | "lower" | "title" | "sentence" | "clean",
    target: "text" | "lorem"
  ) => {
    let sourceText = target === "text" ? text : loremText;
    let converted = sourceText;

    switch (mode) {
      case "upper":
        converted = sourceText.toUpperCase();
        break;
      case "lower":
        converted = sourceText.toLowerCase();
        break;
      case "title":
        converted = sourceText
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase());
        break;
      case "sentence":
        converted = sourceText
          .toLowerCase()
          .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
        break;
      case "clean":
        converted = sourceText.replace(/\s+/g, " ").trim();
        break;
    }

    if (target === "text") setText(converted);
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
    const blob = new Blob([sourceText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
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
          "Text Tools - Text Counter & Lorem Ipsum Generator"
        }
        description={
          seoData.textCounter?.description ||
          "Text counter and Lorem Ipsum generator with convert case tools."
        }
        canonical="https://calculatorhub.com/text-tools"
        schemaData={generateCalculatorSchema(
          "Text Tools",
          "Text counter and Lorem Ipsum generator with convert case tools",
          "/text-tools",
          ["text counter", "lorem ipsum generator", "word counter", "character counter"]
        )}
        breadcrumbs={[
          { name: "Misc Tools", url: "/category/misc-tools" },
          { name: "Text Tools", url: "/text-tools" },
        ]}
      />

      <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6">
        <Breadcrumbs
          items={[
            { name: "Misc Tools", url: "/category/misc-tools" },
            { name: "Text Tools", url: "/text-tools" },
          ]}
        />

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {[
            { id: "textCounter", label: "Text Counter", color: "blue" },
            { id: "loremIpsum", label: "Lorem Ipsum Generator", color: "green" },
            { id: "binarytotext", label: "Binary ↔ Text", color: "violet" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 rounded-xl font-semibold text-sm sm:text-base ${
                selectedTab === tab.id
                  ? `bg-${tab.color}-600 text-white`
                  : "bg-slate-700 text-slate-300"
              }`}
              onClick={() =>
                setSelectedTab(tab.id as "textCounter" | "loremIpsum" | "binarytotext")
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* --- TEXT COUNTER --- */}
        {selectedTab === "textCounter" && (
          <div className="glow-card rounded-2xl p-5 sm:p-8 mb-8 relative">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <FileText className="h-8 w-8 text-blue-400" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Text Counter
              </h1>
            </div>

            <button
              onClick={async () => {
                try {
                  const clipText = await navigator.clipboard.readText();
                  setText(clipText);
                } catch {
                  alert("Please allow clipboard access.");
                }
              }}
              className="absolute top-3 right-3 text-sm text-blue-400 hover:text-blue-300 transition-colors bg-slate-800/70 px-3 py-1 rounded-md border border-slate-600"
            >
              Paste
            </button>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-60 sm:h-72 md:h-80 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
              placeholder="Start typing or paste your text here..."
            />

            <div className="flex flex-wrap justify-center sm:justify-between items-center mt-3 gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Reverse Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setReverseDropdownOpen(!reverseDropdownOpen)}
                    className="flex items-center text-xs sm:text-sm bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 rounded transition"
                  >
                    Reverse <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  {reverseDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-36 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => reverseText("word")}
                        className="block w-full px-4 py-2 text-sm text-white hover:bg-slate-700 text-left"
                      >
                        Reverse by Word
                      </button>
                      <button
                        onClick={() => reverseText("sentence")}
                        className="block w-full px-4 py-2 text-sm text-white hover:bg-slate-700 text-left"
                      >
                        Reverse by Sentence
                      </button>
                      <button
                        onClick={() => reverseText("line")}
                        className="block w-full px-4 py-2 text-sm text-white hover:bg-slate-700 text-left"
                      >
                        Reverse by Line
                      </button>
                    </div>
                  )}
                </div>

                {/* Convert Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center text-xs sm:text-sm bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded transition"
                  >
                    Convert Case <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => convertText("upper", "text")}
                        className="block w-full px-4 py-2 text-sm text-white hover:bg-slate-700 text-left"
                      >
                        🔠 UPPERCASE
                      </button>
                      <button
                        onClick={() => convertText("lower", "text")}
                        className="block w-full px-4 py-2 text-sm text-white hover:bg-slate-700 text-left"
                      >
                        🔡 lowercase
                      </button>
                      <button
                        onClick={() => convertText("title", "text")}
                        className="block w-full px-4 py-2 text-sm text-white hover:bg-slate-700 text-left"
                      >
                        🧾 Title Case
                      </button>
                      <button
                        onClick={() => convertText("sentence", "text")}
                        className="block w-full px-4 py-2 text-sm text-white hover:bg-slate-700 text-left"
                      >
                        📝 Sentence Case
                      </button>
                      <button
                        onClick={() => convertText("clean", "text")}
                        className="block w-full px-4 py-2 text-sm text-white hover:bg-slate-700 text-left"
                      >
                        ✂️ Clean Spaces
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => copyTextToClipboard(text)}
                  className="text-xs sm:text-sm bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded transition"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={() => downloadTextFile(text, "text-counter.txt")}
                  className="text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded transition"
                >
                  Download
                </button>
                <button
                  onClick={clearText}
                  className="text-xs sm:text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
              {[
                ["Characters", stats.characters],
                ["No Spaces", stats.charactersNoSpaces],
                ["Words", stats.words],
                ["Sentences", stats.sentences],
                ["Paragraphs", stats.paragraphs],
                ["Lines", stats.lines],
                [
                  "Reading Time",
                  `${stats.readingTime} min${
                    stats.readingTime !== 1 ? "s" : ""
                  }`,
                ],
              ].map(([label, value], idx) => (
                <div
                  key={idx}
                  className="p-3 sm:p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-center"
                >
                  <p className="text-xs sm:text-sm text-slate-400 mb-1">
                    {label}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-white break-words">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- LOREM IPSUM --- */}
        {selectedTab === "loremIpsum" && (
          <div className="glow-card rounded-2xl p-5 sm:p-8 mb-8 relative">
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="h-8 w-8 text-green-400" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Lorem Ipsum Generator
              </h1>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <input
                type="number"
                min={1}
                onChange={(e) => setParagraphsCount(Number(e.target.value))}
                className="w-full sm:w-36 px-3 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Word Number"
              />

              <button
                onClick={() => {
                  const totalWords = paragraphsCount;
                  const loremArray = [];
                  while (loremArray.join(" ").split(" ").length < totalWords) {
                    const sentence =
                      loremSentences[
                        Math.floor(Math.random() * loremSentences.length)
                      ];
                    loremArray.push(sentence);
                  }
                  const generated = loremArray
                    .join(" ")
                    .split(" ")
                    .slice(0, totalWords)
                    .join(" ");
                  setLoremText(generated);
                }}
                className="text-xs sm:text-sm bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition"
              >
                Generate
              </button>
            </div>

            <textarea
              value={loremText}
              readOnly
              className="w-full h-60 sm:h-72 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none mb-3"
              placeholder="Generated Lorem Ipsum text will appear here..."
            />

            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <button
                onClick={() => copyTextToClipboard(loremText)}
                className="text-xs sm:text-sm bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded transition"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() =>
                  downloadTextFile(loremText, "lorem-ipsum.txt")
                }
                className="text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded transition"
              >
                Download
              </button>
            </div>
          </div>
        )}
      </div>

      <AdBanner />
      <RelatedCalculators />
    </>
  );
};

export default TextToolsPage;
