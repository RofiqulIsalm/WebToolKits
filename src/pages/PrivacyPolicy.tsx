import React from 'react';
import { Shield, Eye, Database, Lock, Mail } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData } from '../utils/seoData';

const PrivacyPolicy: React.FC = () => {
  return (
    <>
      <SEOHead
        title={seoData.privacyPolicy.title}
        description={seoData.privacyPolicy.description}
        canonical="https://calculatorhub.com/privacy-policy"
        breadcrumbs={[
          { name: 'Privacy Policy', url: '/privacy-policy' }
        ]}
      />
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[
          { name: 'Privacy Policy', url: '/privacy-policy' }
        ]} />
        
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-8 w-8 text-blue-400 drop-shadow-lg" />
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">Privacy Policy</h1>
        </div>
        <p className="text-slate-300">Last updated: October 2025</p>
      </div>

      <div className="glow-card rounded-lg p-8 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
            <Eye className="h-6 w-6 text-blue-400 mr-2" />
            Information We Collect
          </h2>
          <div className="text-slate-300 space-y-4">
            <p>
              CalculatorHub is committed to protecting your privacy. We collect minimal information to provide you with the best possible experience:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Usage Data:</strong> We may collect anonymous usage statistics to improve our tools and services.</li>
              <li><strong>Local Storage:</strong> Some calculators may store your preferences locally in your browser for convenience.</li>
              <li><strong>No Personal Data:</strong> We do not collect, store, or process any personal information, names, emails, or contact details.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
            <Database className="h-6 w-6 text-green-400 mr-2" />
            How We Use Information
          </h2>
          <div className="text-slate-300 space-y-4">
            <p>The limited information we collect is used solely to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Improve the functionality and user experience of our calculators</li>
              <li>Analyze usage patterns to develop new tools and features</li>
              <li>Ensure the security and proper functioning of our website</li>
              <li>Provide relevant advertisements through third-party services</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
            <Lock className="h-6 w-6 text-purple-400 mr-2" />
            Data Security
          </h2>
          <div className="text-slate-300 space-y-4">
            <p>
              We implement appropriate security measures to protect against unauthorized access, alteration, disclosure, or destruction of information:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>All data transmission is encrypted using SSL/TLS protocols</li>
              <li>We use secure hosting infrastructure with regular security updates</li>
              <li>Access to any collected data is strictly limited and monitored</li>
              <li>We regularly review and update our security practices</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services</h2>
          <div className="text-slate-300 space-y-4">
            <p>Our website may use third-party services for:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Analytics:</strong> To understand how our tools are used and improve them</li>
              <li><strong>Advertising:</strong> To display relevant advertisements that support our free service</li>
              <li><strong>CDN Services:</strong> To ensure fast loading times and reliable access</li>
            </ul>
            <p>
              These third-party services may have their own privacy policies, and we encourage you to review them.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">Cookies and Local Storage</h2>
          <div className="text-slate-300 space-y-4">
            <p>
              We use cookies and local storage to enhance your experience:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Essential cookies for website functionality</li>
              <li>Preference cookies to remember your calculator settings</li>
              <li>Analytics cookies to understand usage patterns</li>
              <li>Advertising cookies from third-party services</li>
            </ul>
            <p>
              You can control cookie settings through your browser preferences.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
          <div className="text-slate-300 space-y-4">
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access any personal information we may have collected</li>
              <li>Request correction of any inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of data collection where technically feasible</li>
              <li>Receive information about our data practices</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
            <Mail className="h-6 w-6 text-yellow-400 mr-2" />
            Contact Us
          </h2>
          <div className="text-slate-300">
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us through our Contact Us page or reach out to us directly.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Policy</h2>
          <div className="text-slate-300 space-y-4">
            <p>
              We may update this Privacy Policy from time to time. We will notify users of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
            <p>
              Your continued use of our services after any changes indicates your acceptance of the updated Privacy Policy.
            </p>
          </div>
        </section>
      </div>

      <AdBanner type="bottom" />
      </div>
    </>
  );
};

export default PrivacyPolicy;