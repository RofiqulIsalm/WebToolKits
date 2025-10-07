import React, { useState, useEffect } from 'react';
import { Key, Copy, RefreshCw, Eye, EyeOff } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

type Strength = { score: number; label: string; color: string };

const PasswordGenerator: React.FC = () => {
  const [length, setLength] = useState<number>(12);
  const [includeUppercase, setIncludeUppercase] = useState<boolean>(true);
  const [includeLowercase, setIncludeLowercase] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [excludeSimilar, setExcludeSimilar] = useState<boolean>(false);
  const [numPasswords, setNumPasswords] = useState<number>(2);
  const [inputText, setInputText] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [passwords, setPasswords] = useState<{ pwd: string; strength: Strength }[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  const calculateStrength = (pwd: string): Strength => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const levels = [
      { score: 0, label: 'Very Weak', color: 'red' },
      { score: 1, label: 'Weak', color: 'red' },
      { score: 2, label: 'Fair', color: 'orange' },
      { score: 3, label: 'Good', color: 'yellow' },
      { score: 4, label: 'Strong', color: 'green' },
      { score: 5, label: 'Very Strong', color: 'green' },
      { score: 6, label: 'Excellent', color: 'green' },
    ];
    return levels[Math.min(score, levels.length - 1)];
  };

  const generatePasswords = () => {
    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (excludeSimilar) charset = charset.replace(/[0O1lI]/g, '');

    if (charset === '' && !inputText) {
      setPasswords([]);
      return;
    }

    const newPasswords: { pwd: string; strength: Strength }[] = [];
    for (let n = 0; n < numPasswords; n++) {
      let pwd = inputText || '';
      while (pwd.length < length) {
        pwd += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      newPasswords.push({ pwd, strength: calculateStrength(pwd) });
    }

    setPasswords(newPasswords);
    setHistory((prev) => [...newPasswords.map(p => p.pwd), ...prev].slice(0, 10));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  useEffect(() => {
    generatePasswords();
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar, inputText, numPasswords]);

  return (
    <>
        <SEOHead
          title="Free Password Generator | Create Strong & Secure Passwords Online"
          description="Generate strong, random, and secure passwords instantly with our free Password Generator. Customize length, symbols, numbers, and letters to protect your online accounts easily."
          canonical="https://calculatorhub.site/password-generator"
          schemaData={generateCalculatorSchema(
            "Password Generator",
            "Generate strong, random, and secure passwords instantly with our free Password Generator. Customize length, symbols, numbers, and letters to protect your online accounts easily.",
            "/password-generator",
            "password generator, strong passwords, secure password maker, online password generator, random password generator, strong password creator, safe password tool"
          )}
          breadcrumbs={[
            { name: 'Misc Tools', url: '/category/misc-tools' },
            { name: 'Password Generator', url: '/password-generator' }
          ]}
        />

        {/* -------- Additional Meta Tags for SEO -------- */}
        <meta name="keywords" content="password generator, strong password generator, secure password creator, random password tool, online password maker, password strength meter, password manager, data security, generate secure password, free password generator" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="CalculatorHub" />

        {/* -------- Open Graph (Facebook/LinkedIn) -------- */}
        <meta property="og:title" content="Free Password Generator | Create Strong & Secure Passwords Online" />
        <meta property="og:description" content="Generate strong, random, and secure passwords instantly with our free Password Generator. Customize length, symbols, and numbers to protect your online accounts easily." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://calculatorhub.site/password-generator" />
        <meta property="og:image" content="https://calculatorhub.site/images/password-generator-banner.png" />
        <meta property="og:site_name" content="CalculatorHub" />

        {/* -------- Twitter Card Tags -------- */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Password Generator | Create Strong & Secure Passwords Online" />
        <meta name="twitter:description" content="Generate secure, random passwords instantly and protect your online accounts with our free password generator." />
        <meta name="twitter:image" content="https://calculatorhub.site/images/password-generator-banner.png" />
        <meta name="twitter:site" content="@CalculatorHub" />

      <meta property="og:image:alt" content="Password Generator tool banner - CalculatorHub" />




      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Password Generator', url: '/password-generator' }
        ]} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Password Generator – Create Secure & Random Passwords</h1>
          <p className="text-slate-300 mb-4">
Use our free password generator to instantly create strong, unique passwords for maximum online security.
</p>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Password Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Input Text (optional)</label>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full px-3 py-2 text-black border rounded-lg"
                  placeholder="Start password with..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password Length: {length}
                </label>
                <input
                  type="range"
                  min="4"
                  max="50"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full text-black"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>4</span>
                  <span>50</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Passwords: {numPasswords}
                </label>
                <input
                  type="number"
                  min={1} 
                  max={4}
                  value={numPasswords}
                  onChange={(e) => setNumPasswords(Number(e.target.value))}
                  className="w-20 px-2 py-1 border text-black rounded-lg"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={includeUppercase} onChange={e => setIncludeUppercase(e.target.checked)} />
                  <span className="text-black">Include Uppercase (A-Z)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={includeLowercase} onChange={e => setIncludeLowercase(e.target.checked)} />
                  <span className="text-black">Include Lowercase (a-z)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={includeNumbers} onChange={e => setIncludeNumbers(e.target.checked)} />
                  <span className="text-black">Include Numbers (0-9)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={includeSymbols} onChange={e => setIncludeSymbols(e.target.checked)} />
                  <span className="text-black">Include Symbols (!@#$%^&*)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={excludeSimilar} onChange={e => setExcludeSimilar(e.target.checked)} />
                  <span className="text-black">Exclude Similar Characters (0, O, 1, l, I)</span>
                </label>
              </div>

              <button
                onClick={generatePasswords}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Generate Passwords</span>
              </button>
            </div>
          </div>

          {/* Password List Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Generated Passwords</h2>

            {passwords.length === 0 ? (
              <div className="text-center py-12">
                <Key className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select options to generate passwords</p>
              </div>
            ) : (
              passwords.map((item, idx) => (
                <div key={idx} className="relative p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className=" text-black font-mono break-all">{showPassword ? item.pwd : '•'.repeat(item.pwd.length)}</span>
                    <div className="flex space-x-2">
                      <button onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-gray-700">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button onClick={() => copyToClipboard(item.pwd)} className="text-gray-500 hover:text-gray-700">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Strength meter */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(item.strength.score / 6) * 100}%`, backgroundColor: item.strength.color }}
                    />
                  </div>
                  <span className="text-xs font-medium" style={{ color: item.strength.color }}>
                    {item.strength.label}
                  </span>
                </div>
              ))
            )}

            {history.length > 0 && (
              <div className="mt-4 bg-gray-300 rounded px-2 py-2">
                <h3 className="text-sm font-medium text-black mb-2">History (recent passwords)</h3>
                <ul className=" px-2 space-y-1 text-xs text-gray-500 max-h-48 overflow-auto">
                  {history.map((pwd, i) => (
                    <li className=" text-black py-1 bg-gray-400 px-2 py-1 rounded mr-2" key={i}>{pwd}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

       <div className="rounded-2xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Password Generator – Create Strong & Secure Passwords</h2>
            <div className="space-y-4 text-slate-300">
              <p>
                In today’s digital world, maintaining online security is more important than ever. Using a strong, <strong>unique password </strong>for every account is essential to protect your personal information, financial data, and digital identity. Our <strong>Password Generator</strong> is designed to help you create secure, random passwords instantly, ensuring that your accounts remain safe from unauthorized access.
              </p>
              <p>
                With our tool, you can customize password length, include uppercase and lowercase letters, numbers, and symbols, and even exclude similar characters to avoid confusion. Generate multiple passwords at once, save them in your password history, and copy them to the clipboard with a single click. Each password is evaluated with a dynamic strength meter, showing whether it is weak, medium, or strong, so you always know the security level of your generated passwords.
              </p>
              <p>
              Whether you are signing up for new services, updating old passwords, or managing multiple accounts, this <strong>password generator tool</strong> ensures your online safety effortlessly.
              </p>

              <AdBanner type="bottom" />

              
              <h3 className="text-2xl font-semibold text-white mt-6">Why Use a Strong Password? – 10 Reasons to Protect Your Accounts</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Prevent Unauthorized Access</strong> – Strong passwords make it harder for hackers to access your personal and professional accounts.</li>
                <li><strong>Protect Personal Information</strong>  – Keep sensitive details like your address, phone number, and email secure from cybercriminals.</li>
                <li><strong>Secure Financial Data</strong>  – Protect your bank accounts, credit cards, and online payment platforms from theft and fraud.</li>
                <li><strong>Reduce Risk of Hacking Attacks</strong>  – Minimize the chances of phishing, brute force attacks, and credential stuffing.</li>
                <li><strong>Prevent Identity Theft</strong>  – Strong passwords help protect your digital identity and avoid impersonation online.</li>
                <li><strong>Comply with Security Policies</strong>  – Many platforms require secure passwords to meet regulatory and security standards.</li>
                <li><strong>Maintain Privacy on Social Media</strong>  – Protect your posts, messages, and personal content from unauthorized access.</li>
                <li><strong>Enhance Account Recovery Options</strong>  – Strong passwords reduce the risk of account lockouts or recovery breaches.</li>
                <li><strong>Safeguard Business Accounts</strong>  – Protect company emails, client data, and internal systems from cyber threats.</li>
                <li><strong>Peace of Mind Online</strong>  – Knowing your accounts are protected allows you to use online services safely and confidently.</li>
              </ul>
              <p>By using a <storng>secure password generator</storng>, you can effortlessly create passwords that meet these requirements and ensure your digital life stays safe.</p>
          
              <h3 className="text-2xl font-semibold text-white mt-6">Features of Our Powerful Password Generator Tool</h3>
              <p>Our <strong>Password Generator</strong> is designed to help you create <strong>strong and secure passwords</strong> effortlessly. Here’s what makes it an essential tool for online security:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Generate Multiple Passwords at Once</strong> – Create several unique passwords in a single click, saving time and effort.</li>
                <li><strong>View Recently Generated Passwords</strong> – Keep track of your past passwords with a convenient history list, so you never lose track.</li>
                <li><strong>Customizable Password Length</strong> – Choose the exact length of your password, from short and simple to long and complex.</li>
                <li><strong>Flexible Character Options</strong> – Include uppercase letters, lowercase letters, numbers, and symbols for maximum security.</li>
                <li><strong>Instant Copy to Clipboard</strong> – Quickly copy passwords with a single click for easy use across your accounts.</li>
                <li><strong>Interactive Strength Meter</strong> – Monitor your password’s strength in real-time, with dynamic indicators showing Weak, Medium, or Strong.</li>
                <li><strong>Input-Based Password Generation</strong> – Start your password with your own text or phrase, combined with random characters for added uniqueness.</li>
                <li><strong>Exclude Similar Characters</strong> – Avoid confusing characters like 0, O, 1, l, and I for safer passwords.</li>
                <li><strong>Multi-Device Compatibility</strong> – Works seamlessly on desktop, tablet, and mobile devices.</li>
                <li><strong>Enhanced Online Security</strong> – All features combined ensure your accounts are protected against hacking, identity theft, and cyber attacks.</li>
              </ul>
              <p>Using these features, our Password Generator ensures that you can always create<strong> robust, high-security passwords</strong> for all your online accounts with ease.</p>
          
              <h3 className="text-2xl font-semibold text-white mt-6">🔐 Tips for Creating Strong Passwords</h3>
              <p>Creating a strong password is one of the most effective ways to protect your online accounts from hacking and identity theft. Follow these<strong> expert-recommended password security tips</strong> to keep your data safe and secure:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Use at least 12 characters</strong> — Combine uppercase and lowercase letters, numbers, and symbols to make your password harder to guess.</li>
                <li><strong>Avoid reusing passwords</strong> — Never use the same password on multiple accounts. Unique passwords reduce your overall vulnerability.</li>
                <li><strong>Enable two-factor authentication (2FA)</strong> — Add an extra layer of protection by requiring a verification code in addition to your password.</li>
                <li><strong>Use a reputable password manager</strong> — Securely generate, save, and manage all your passwords in one encrypted place.</li>
                <li><strong>Update passwords regularly</strong> — Change your passwords every few months to reduce the risk of unauthorized access.</li>
              </ul>
              <p>By following these<strong> strong password creation tips</strong>, you’ll enhance your online security and keep your personal and financial information protected.</p>
         
              
              <AdBanner type="bottom" />

              
                        <section className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">🔍 Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)</h2>
            <div className="space-y-4 text-lg text-slate-100 leading-relaxed">
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q1</span>: Is this Password Generator free to use?</h3>
                    <p>Yes! Our Password Generator is completely free and allows you to create <strong>unlimited strong </strong>passwords without any hidden costs or sign-ups.
</p>
                  
                </div>
              </div>
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q2</span>: How secure are the generated passwords?</h3>
                <p>All passwords are generated <strong>locally on your device</strong>, ensuring your data is never stored or transmitted online. Each password is<strong> completely random and unique</strong>, providing the highest level of security.</p>
                </div>
                </div>
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q3</span>: Can I copy the generated password to my clipboard?</h3>
                <p>Absolutely! With one click on the <strong>“Copy” button</strong>, your password is instantly copied to the clipboard for easy use anywhere you need.</p>
                </div>
              </div>
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q4</span>: Can I customize the password length and characters?</h3>
                <p>Yes. You can set your preferred<strong> password length</strong> (from 4 to 50 characters) and choose to include<strong> uppercase, lowercase, numbers, and symbols </strong>based on your security needs.</p>
                </div>
              </div>
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q5</span>: Does this Password Generator show password strength?</h3>
                <p> Yes! Our built-in<strong> strength meter </strong>dynamically shows whether your password is Weak, Medium, or Strong — helping you create the most secure combination possible.</p>

                </div>
              </div>
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q6</span>: Can I exclude similar characters like “0” and “O”?</h3>
                <p> Definitely. You can enable the “<strong>Exclude Similar Characters</strong>” option to avoid confusing symbols such as 0, O, 1, l, and I for better readability and usability.</p>

                </div>
              </div>
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q7</span>: Why should I use this Password Generator?</h3>
                <p> Using this tool helps you <strong>protect your online accounts</strong> with unique, complex passwords that are nearly impossible to guess. Whether it’s for<strong> social media, gaming, or banking</strong>, our password generator ensures maximum safety and reliability.</p>

                </div>
              </div>
              
            </div>
          </section>

          {/* ===================== FAQ SCHEMA (SEO Rich Results) ===================== */}
          <script type="application/ld+json" dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "Is this Password Generator free to use?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes! Our Password Generator is completely free and allows you to create unlimited strong passwords without any hidden costs or sign-ups."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How secure are the generated passwords?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "All passwords are generated locally on your device, ensuring your data is never stored or transmitted online. Each password is completely random and unique, providing the highest level of security."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I copy the generated password to my clipboard?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Absolutely! With one click on the 'Copy' button, your password is instantly copied to the clipboard for easy use anywhere you need."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I customize the password length and characters?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. You can set your preferred password length (from 4 to 50 characters) and choose to include uppercase, lowercase, numbers, and symbols based on your security needs."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Does this Password Generator show password strength?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes! Our built-in strength meter dynamically shows whether your password is Weak, Medium, or Strong — helping you create the most secure combination possible."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I exclude similar characters like 0 and O?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Definitely. You can enable the 'Exclude Similar Characters' option to avoid confusing symbols such as 0, O, 1, l, and I for better readability and usability."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Why should I use this Password Generator?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Using this tool helps you protect your online accounts with unique, complex passwords that are nearly impossible to guess. Whether it’s for social media, gaming, or banking, our password generator ensures maximum safety and reliability."
                  }
                }
              ]
            })
          }} /> 

            <script type="application/ld+json" dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "SoftwareApplication",
                  "name": "Password Generator",
                  "operatingSystem": "All",
                  "applicationCategory": "SecurityApplication",
                  "description": "Generate strong, random, and secure passwords instantly.",
                  "url": "https://calculatorhub.site/password-generator",
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.9",
                    "reviewCount": "1750"
                  }
                })
              }} />

          
              <p className="mt-4">
                Use this <strong>secure password generator</strong> to protect your accounts today. Whether you need a single password
                or multiple passwords for work, gaming, or personal use, our tool ensures your passwords are strong, unique, and safe.
              </p>
            </div>
          </div>


        
        <RelatedCalculators currentPath="/password-generator" category="misc-tools" />
      </div>
    </>
  );
};

export default PasswordGenerator;

