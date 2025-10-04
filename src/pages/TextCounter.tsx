import React, { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import { seoData, generateCalculatorSchema } from "../utils/seoData";
import RelatedCalculators from "../components/RelatedCalculators";

const TextReverser: React.FC = () => {
  const [text, setText] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [reverseMode, setReverseMode] = useState<string>("full");
  const [caseOption, setCaseOption] = useState<string>("none");

  // 🧠 Reverse Logic
  const reverseText = () => {
    if (text.trim() === "") return;
    let reversed = text;

    switch (reverseMode) {
      case "full":
        reversed = text.split("").reverse().join("");
        break;
      case "words":
        reversed = text
          .split(" ")
          .map((word) => word.split("").reverse().join(""))
          .join(" ");
        break;
      case "lines":
        reversed = text.split("\n").reverse().join("\n");
        break;
    }

    setText(reversed);
  };

  // 🔠 Convert Case Logic
  const applyCaseOption = () => {
    let newText = text;

    switch (caseOption) {
      case "upper":
        newText = text.toUpperCase();
        break;
      case "lower":
        newText = text.toLowerCase();
        break;
      case "title":
        newText = text
          .toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase());
        break;
      case "sentence":
        newText = text
          .toLowerCase()
          .replace(/(^\s*\w|[.!?]\s*\w)/g, (char) => char.toUpperCase());
        break;
      case "clean":
        newText = text.replace(/\s+/g, " ").trim();
        break;
      default:
        return;
    }

    setText(newText);
  };

  // 📋 Copy Text
  const copyText = async () => {
    if (text.trim() === "") return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // 📥 Paste Text
  const pasteText = async () => {
    const clipboardText = await navigator.clipboard.readText();
    setText(clipboardText);
  };

  // 💾 Download Text
  const downloadText = () => {
    if (text.trim() === "") return;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reversed-text.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // 🧹 Clear Text
  const clearText = () => setText("");

  return (
    <>
      <SEOHead
        title={
          seoData.textReverser?.title ||
          "Text Reverser - Reverse Text, Words, and Lines Instantly"
        }
        description={
          seoData.textReverser?.description ||
          "Reverse text easily online. Flip letters, words, or lines instantly with copy, paste, and download options."
        }
        canonical="https://calculatorhub.com/text-reverser"
        schemaData={generateCalculatorSchema(
          "Text Reverser",
          "Reverse text, words, or lines instantly online",
          "/text-reverser",
          ["text reverser", "reverse text", "reverse words", "flip text"]
        )}
        breadcrumbs={[
          { name: "Misc Tools", url: "/category/misc-tools" },
          { name: "Text Reverser", url: "/text-reverser" },
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { name: "Misc Tools", url: "/category/misc-tools" },
            { name: "Text Reverser", url: "/text-reverser" },
          ]}
        />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6 justify-between">
            <div className="flex items-center space-x-3">
              <ArrowLeftRight className="h-8 w-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">Text Reverser</h1>
            </div>
            <button
              onClick={pasteText}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded transition"
            >
              Paste
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              Enter or Paste Your Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-64 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Type or paste text to reverse..."
            />

            <div className="flex justify-between items-center mt-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {/* Reverse Options */}
                <select
                  value={reverseMode}
                  onChange={(e) => setReverseMode(e.target.value)}
                  className="text-xs bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="full">Reverse Entire Text</option>
                  <option value="words">Reverse Each Word</option>
                  <option value="lines">Reverse Lines</option>
                </select>

                <button
                  onClick={reverseText}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded transition"
                >
                  Reverse
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Convert Case Dropdown */}
                <select
                  value={caseOption}
                  onChange={(e) => setCaseOption(e.target.value)}
                  className="text-xs bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="none">Convert Case</option>
                  <option value="upper">UPPERCASE</option>
                  <option value="lower">lowercase</option>
                  <option value="title">Title Case</option>
                  <option value="sentence">Sentence Case</option>
                  <option value="clean">Clean Spaces</option>
                </select>
                <button
                  onClick={applyCaseOption}
                  className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded transition"
                >
                  Apply
                </button>

                <button
                  onClick={copyText}
                  className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded transition"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={downloadText}
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
          </div>
        </div>

        <AdBanner />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            About Text Reverser
          </h2>
          <div className="space-y-4 text-slate-300">
            <p>
              The Text Reverser tool allows you to flip or reverse any text,
              whether it’s a single line, paragraph, or entire document. Choose
              from multiple reversal modes and apply case conversions easily.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6">
              Features:
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Reverse text, words, or lines instantly</li>
              <li>Convert between UPPERCASE, lowercase, Title, or Sentence case</li>
              <li>Clean up extra spaces automatically</li>
              <li>Copy, paste, download, and clear with one click</li>
              <li>Lightweight and fast for instant text manipulation</li>
            </ul>
          </div>
        </div>

        <RelatedCalculators currentPath="/text-reverser" />
      </div>
    </>
  );
};

export default TextReverser;
