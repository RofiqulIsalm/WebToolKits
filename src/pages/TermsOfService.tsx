import React from 'react';
import { FileText, AlertTriangle, Scale, Users, Zap } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData } from '../utils/seoData';

const TermsOfService: React.FC = () => {
  return (
    <>
      <SEOHead
        title={seoData.termsOfService.title}
        description={seoData.termsOfService.description}
        canonical="https://calculatorhub.com/terms-of-service"
        breadcrumbs={[
          { name: 'Terms of Service', url: '/terms-of-service' }
        ]}
      />
    <div className="max-w-4xl mx-auto">
      <Breadcrumbs items={[
        { name: 'Terms of Service', url: '/terms-of-service' }
      ]} />
      
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="h-8 w-8 text-blue-400 drop-shadow-lg" />
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">Terms of Service</h1>
        </div>
        <p className="text-slate-300">Last updated: January 2025</p>
      </div>

      <div className="glow-card rounded-lg p-8 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">Agreement to Terms</h2>
          <div className="text-slate-300 space-y-4">
            <p>
              By accessing and using CalculatorHub, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
            <Zap className="h-6 w-6 text-green-400 mr-2" />
            Use License
          </h2>
          <div className="text-slate-300 space-y-4">
            <p>
              Permission is granted to temporarily use CalculatorHub for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on the website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
            <p>
              This license shall automatically terminate if you violate any of these restrictions and may be terminated by us at any time.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
            <AlertTriangle className="h-6 w-6 text-yellow-400 mr-2" />
            Disclaimer
          </h2>
          <div className="text-slate-300 space-y-4">
            <p>
              The materials on CalculatorHub are provided on an 'as is' basis. CalculatorHub makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
            <p>
              Further, CalculatorHub does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">Accuracy of Calculations</h2>
          <div className="text-slate-300 space-y-4">
            <p>
              While we strive to provide accurate calculations and conversions, CalculatorHub:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Does not guarantee the accuracy of any calculations or results</li>
              <li>Recommends verifying important calculations with professional tools or services</li>
              <li>Is not responsible for any decisions made based on our calculator results</li>
              <li>Continuously works to improve accuracy but cannot guarantee error-free results</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
            <Scale className="h-6 w-6 text-purple-400 mr-2" />
            Limitations
          </h2>
          <div className="text-slate-300 space-y-4">
            <p>
              In no event shall CalculatorHub or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on CalculatorHub, even if Daily Tools Hub or a CalculatorHub authorized representative has been notified orally or in writing of the possibility of such damage. Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">Accuracy of Materials</h2>
          <div className="text-slate-300 space-y-4">
            <p>
              The materials appearing on CalculatorHub could include technical, typographical, or photographic errors. CalculatorHub does not warrant that any of the materials on its website are accurate, complete, or current. CalculatorHub may make changes to the materials contained on its website at any time without notice. However, CalculatorHub does not make any commitment to update the materials.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">Links</h2>
          <div className="text-slate-300 space-y-4">
            <p>
              CalculatorHub has not reviewed all of the sites linked to our website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by CalculatorHub of the site. Use of any such linked website is at the user's own risk.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
            <Users className="h-6 w-6 text-cyan-400 mr-2" />
            User Conduct
          </h2>
          <div className="text-slate-300 space-y-4">
            <p>You agree not to use CalculatorHub to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Transmit any harmful, threatening, or offensive content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>Use automated systems to access the service excessively</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">Modifications</h2>
          <div className="text-slate-300 space-y-4">
            <p>
              Daily Tools Hub may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">Governing Law</h2>
          <div className="text-slate-300 space-y-4">
            <p>
              These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">Contact Information</h2>
          <div className="text-slate-300">
            <p>
              If you have any questions about these Terms of Service, please contact us through our Contact Us page.
            </p>
          </div>
        </section>
      </div>

      <AdBanner type="bottom" />
    </div>
    </>
  );
};

export default TermsOfService;