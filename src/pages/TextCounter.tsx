import React, { useState } from "react";
import { Copy, Download, Trash2 } from "lucide-react";
import AdBanner from "../components/AdBanner";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";

const TextTools = () => {
  const [activeTab, setActiveTab] = useState("textCounter");

  // --- TEXT COUNTER STATE ---
  const [text, setText] = useState("");
  const [caseOption, setCaseOption] = useState("none");

  // --- LOREM IPSUM STATE ---
  const [loremWordCount, setLoremWordCount] = useState(100);
  const [loremText, setLoremText] = useState("");
  const [loremCaseOption, setLoremCaseOption] = useState("none");

  const loremSource = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam sodales at mi id laoreet. Ut eget neque viverra, laoreet mi eu, pulvinar felis. Nunc quis lobortis mi. Integer eget massa cursus leo varius ullamcorper. In sit amet aliquet erat. Donec in viverra sapien. Mauris congue quam ut sollicitudin tempus. Maecenas vulputate erat et quam ullamcorper, ac gravida velit mollis. Aenean consectetur mauris in odio commodo porta. In vel neque sit amet dui pharetra bibendum. Mauris lacinia ex eu ante pharetra, a malesuada dolor volutpat. Sed rhoncus, libero at maximus vestibulum, ante justo facilisis felis, a dapibus eros arcu vitae purus. Duis facilisis metus blandit leo consequat, at tincidunt eros finibus. In tincidunt, quam sed bibendum vulputate, justo metus sagittis erat, in finibus erat sem at est. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nec risus vitae erat interdum elementum vitae at dui. Donec quis consectetur ligula, ullamcorper eleifend ligula. Fusce venenatis aliquam suscipit. Donec venenatis sapien nec erat tincidunt facilisis. Duis dui purus, finibus sit amet dapibus sit amet, tristique ut ante. Nulla pharetra, erat vel consectetur lobortis, enim elit cursus libero, non hendrerit nisi justo et velit. Interdum et malesuada fames ac ante ipsum primis in faucibus. In sed erat ut dui molestie pharetra ornare vel turpis. Sed orci sem, iaculis sed suscipit et, gravida non nisl. Suspendisse convallis enim a vestibulum tincidunt.`;

  // --- FUNCTIONS ---

  // Convert case helper
  const convertCase = (text: string, option: string) => {
    switch (option) {
      case "upper":
        return text.toUpperCase();
      case "lower":
        return text.toLowerCase();
      case "title":
        return text
          .toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase());
      case "sentence":
        return text
          .toLowerCase()
          .replace(/(^\s*\w|[.!?]\s*\w)/g, (char) => char.toUpperCase());
      case "clean":
        return text.replace(/\s+/g, " ").trim();
      default:
        return text;
    }
  };

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt);
  };

  const handleDownload = (txt: string, filename = "text.txt") => {
    const blob = new Blob([txt], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleGenerateLorem = () => {
    const words = loremSource.split(/\s+/);
    const repeated = Array(Math.ceil(loremWordCount / words.length))
      .fill(words)
      .flat()
      .slice(0, loremWordCount);
    setLoremText(repeated.join(" "));
  };

  return (
    <div className="container mx-auto text-white py-10">
      <SEOHead
        title="Text Tools – Counter & Lorem Ipsum Generator"
        description="Use our text tools including character counter and lorem ipsum generator with convert case options."
      />
      <Breadcrumbs />
      <AdBanner type="top" />

      {/* Tabs */}
      <div className="flex justify-center mb-6">
        {["textCounter", "loremIpsum"].map((tab) => (
          <button
            key={tab}
            className={`px-6 py-2 mx-2 rounded-full ${
              activeTab === tab
                ? "bg-yellow-400 text-black"
                : "bg-slate-700 hover:bg-slate-600"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "textCounter" ? "Text Counter" : "Lorem Ipsum Generator"}
          </button>
        ))}
      </div>

      {/* TEXT COUNTER */}
      {activeTab === "textCounter" && (
        <div className="max-w-3xl mx-auto bg-slate-800 p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Text Counter</h2>
          <textarea
            className="w-full h-48 p-3 rounded-lg bg-slate-900 text-white resize-none border border-slate-600"
            placeholder="Type or paste your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          ></textarea>

          <div className="flex justify-between items-center mt-4">
            <div className="text-gray-400">
              <p>Characters: {text.length}</p>
              <p>Words: {text.trim() ? text.trim().split(/\s+/).length : 0}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="bg-slate-700 text-white p-2 rounded-md"
                value={caseOption}
                onChange={(e) => {
                  setCaseOption(e.target.value);
                  setText(convertCase(text, e.target.value));
                }}
              >
                <option value="none">Convert Case</option>
                <option value="upper">UPPER CASE</option>
                <option value="lower">lower case</option>
                <option value="title">Title Case</option>
                <option value="sentence">Sentence Case</option>
                <option value="clean">Clean Spaces</option>
              </select>
              <button
                onClick={() => handleCopy(text)}
                className="p-2 bg-yellow-400 text-black rounded-lg"
              >
                <Copy size={18} />
              </button>
              <button
                onClick={() => handleDownload(text, "text.txt")}
                className="p-2 bg-green-500 text-black rounded-lg"
              >
                <Download size={18} />
              </button>
              <button
                onClick={() => setText("")}
                className="p-2 bg-red-500 text-white rounded-lg"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOREM IPSUM GENERATOR */}
      {activeTab === "loremIpsum" && (
        <div className="max-w-3xl mx-auto bg-slate-800 p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Lorem Ipsum Generator</h2>

          <div className="flex gap-2 mb-4">
            <input
              type="number"
              className="w-40 p-2 rounded-md bg-slate-900 text-white border border-slate-600"
              value={loremWordCount}
              onChange={(e) => setLoremWordCount(Number(e.target.value))}
              placeholder="Word count"
            />
            <button
              onClick={handleGenerateLorem}
              className="bg-yellow-400 text-black px-4 py-2 rounded-lg"
            >
              Generate
            </button>
          </div>

          <textarea
            className="w-full h-48 p-3 rounded-lg bg-slate-900 text-white resize-none border border-slate-600"
            placeholder="Generated lorem ipsum text will appear here..."
            value={loremText}
            readOnly
          ></textarea>

          <div className="flex justify-end items-center gap-2 mt-4">
            <select
              className="bg-slate-700 text-white p-2 rounded-md"
              value={loremCaseOption}
              onChange={(e) => {
                setLoremCaseOption(e.target.value);
                setLoremText(convertCase(loremText, e.target.value));
              }}
            >
              <option value="none">Convert Case</option>
              <option value="upper">UPPER CASE</option>
              <option value="lower">lower case</option>
              <option value="title">Title Case</option>
              <option value="sentence">Sentence Case</option>
              <option value="clean">Clean Spaces</option>
            </select>
            <button
              onClick={() => handleCopy(loremText)}
              className="p-2 bg-yellow-400 text-black rounded-lg"
            >
              <Copy size={18} />
            </button>
            <button
              onClick={() => handleDownload(loremText, "lorem-ipsum.txt")}
              className="p-2 bg-green-500 text-black rounded-lg"
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => setLoremText("")}
              className="p-2 bg-red-500 text-white rounded-lg"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      )}

      <AdBanner type="bottom" />
    </div>
  );
};

export default TextTools;
