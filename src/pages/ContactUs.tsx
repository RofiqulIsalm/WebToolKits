import React, { useState } from 'react';
import { Mail, MessageSquare, Send, MapPin, Clock, Phone } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData } from '../utils/seoData';

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => setSubmitStatus('idle'), 5000);
    }, 1000);
  };

  return (
    <>
      <SEOHead
        title={seoData.contactUs.title}
        description={seoData.contactUs.description}
        canonical="https://calculatorhub.com/contact-us"
        breadcrumbs={[
          { name: 'Contact Us', url: '/contact-us' }
        ]}
      />
    <div className="max-w-6xl mx-auto">
      <Breadcrumbs items={[
        { name: 'Contact Us', url: '/contact-us' }
      ]} />
      
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Mail className="h-8 w-8 text-blue-400 drop-shadow-lg" />
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">Contact Us</h1>
        </div>
        <p className="text-slate-300">Get in touch with us - we'd love to hear from you!</p>
      </div>
              {/* Team Profiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="glow-card rounded-lg p-6">  
            <h3 className="text-xl font-semibold text-white mb-2">Rofiqul Islam – Senior                   Partner</h3>
            <p className="text-slate-300 text-sm">
              Rofiqul Islam is the Senior Partner and founder of CalculatorHub. With                       expertise in creating user-friendly calculators and tools, [he/she/they]                     ensures high-quality solutions and a smooth experience for all users.
            </p>
          </div>
        
          <div className="glow-card rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-2">Siraj Shah – Associate             Partner</h3>
            <p className="text-slate-300 text-sm">
              Siraj Shah is the Associate Partner at CalculatorHub. Bringing strong                  operational and technical skills, [he/she/they] supports development, user                   experience, and contributes to the growth and innovation of the platform.
            </p>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="glow-card rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <MessageSquare className="h-6 w-6 text-blue-400 mr-2" />
              Send us a Message
            </h2>

            {submitStatus === 'success' && (
              <div className="mb-6 p-4 result-green rounded-lg">
                <p className="text-white font-medium">Thank you for your message! We'll get back to you soon.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="bug-report">Bug Report</option>
                  <option value="feature-request">Feature Request</option>
                  <option value="calculator-issue">Calculator Issue</option>
                  <option value="business">Business Inquiry</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 glow-button text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-6">
          <div className="glow-card rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Get in Touch</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-slate-300 text-sm">Email</p>
                  <p className="text-white font-medium">support@dailytoolshub.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-slate-300 text-sm">Response Time</p>
                  <p className="text-white font-medium">Within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-purple-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-slate-300 text-sm">Location</p>
                  <p className="text-white font-medium">Global Service</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glow-card rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Frequently Asked</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">Are the calculators free?</h4>
                <p className="text-slate-300 text-sm">Yes, all our calculators and converters are completely free to use.</p>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">Do I need to create an account?</h4>
                <p className="text-slate-300 text-sm">No account required! All tools work instantly without signup.</p>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">Can I suggest new calculators?</h4>
                <p className="text-slate-300 text-sm">Absolutely! Use the contact form to suggest new tools or features.</p>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">Are calculations accurate?</h4>
                <p className="text-slate-300 text-sm">We strive for accuracy, but always verify important calculations independently.</p>
              </div>
            </div>
          </div>

          <div className="glow-card rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Quick Links</h3>
            <div className="space-y-2">
              <a href="/privacy-policy" className="block text-blue-400 hover:text-blue-300 transition-colors text-sm">
                Privacy Policy
              </a>
              <a href="/terms-of-service" className="block text-blue-400 hover:text-blue-300 transition-colors text-sm">
                Terms of Service
              </a>
              <a href="/" className="block text-blue-400 hover:text-blue-300 transition-colors text-sm">
                All Calculators
              </a>
            </div>
          </div>
        </div>
      </div>

      <AdBanner type="bottom" />
    </div>
    </> 
  );
};

export default ContactUs;