import React, { useState } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck,
  Mail,
  Send,
  Lock,
  FileText,
  Cloud,
  CheckCircle,
  HelpCircle,
  FolderOpen,
} from 'lucide-react';

interface StaticPageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<StaticPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <Breadcrumbs items={[{ label: 'About FileVault' }]} />

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Platform Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            About FileVault
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            A fast, minimal, and transparent verified distribution platform for open-source tools, software, games, and creative media.
          </p>
        </div>

        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4">
          <p>
            FileVault was engineered as an antidote to bloated download portals cluttered with deceptive green download banners, forced installers, hidden adware bundles, and multi-tier artificial countdown delays.
          </p>
          <p>
            We adhere to a <strong>strict verification philosophy</strong>: every distribution uploaded to FileVault is matched against published cryptographic hashes (SHA-256), malware scanned, and directly linked to high-speed Cloudflare R2 edge storage.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <ShieldCheck className="w-5 h-5 text-emerald-600 mb-2" />
            <h3 className="font-bold text-slate-900 text-sm">Cryptographic Integrity</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Every archive features verifiable SHA-256 and MD5 checksums for zero tampering.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <Cloud className="w-5 h-5 text-blue-500 mb-2" />
            <h3 className="font-bold text-slate-900 text-sm">Cloudflare R2 Powered</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Global object storage delivering maximum unthrottled throughput without egress fees.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <Lock className="w-5 h-5 text-slate-800 mb-2" />
            <h3 className="font-bold text-slate-900 text-sm">No Deceptive Ads</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              All promotional or partner slots are strictly labelled and separated from download triggers.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-start">
          <button
            onClick={() => onNavigate('/files')}
            className="px-6 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-full hover:bg-slate-800 transition-colors shadow-xs"
          >
            Explore Distributed Files
          </button>
        </div>
      </div>
    </div>
  );
};

export const ContactPage: React.FC<StaticPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showToast('Inquiry Received', 'Thank you! Your message has been forwarded to our support desk.', 'success');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <Breadcrumbs items={[{ label: 'Contact Us' }]} />

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Support & Verification
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Contact & File Submission
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Need assistance, have copyright inquiries, or want to submit an open distribution for hosting?
          </p>
        </div>

        {submitted ? (
          <div className="p-8 rounded-3xl bg-emerald-50/60 border border-emerald-200/60 text-center space-y-3">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-emerald-900">Message Sent Successfully</h3>
            <p className="text-xs text-emerald-700 max-w-sm mx-auto">
              We respond to developer inquiries and distribution verification requests within 24 business hours.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setName('');
                setEmail('');
                setMessage('');
              }}
              className="mt-2 text-xs font-semibold text-emerald-800 underline"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:bg-white focus:border-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:bg-white focus:border-slate-900 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. New software distribution request or DMCA notice"
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:bg-white focus:border-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Message & Details *
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Include download link, checksum, licensing documentation, or your question..."
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-slate-900 focus:outline-hidden leading-relaxed"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Message</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const PrivacyPage: React.FC<StaticPageProps> = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Legal & Data Protection
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Effective Date: September 2026 • Version 2.0
          </p>
        </div>

        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-5">
          <section className="space-y-2">
            <h2 className="font-bold text-slate-900 text-base">1. Information We Do Not Collect</h2>
            <p>
              FileVault does not require user accounts, passwords, or personal credentials to download verified files. We do not track cross-site behavioral telemetry or sell personal data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-slate-900 text-base">2. Download Logs & Aggregation</h2>
            <p>
              For network reliability and bandwidth capacity planning, our edge CDN servers record standard anonymized HTTP access metrics: file request URL, HTTP status code, and total byte transfer volume. No IP profiling or persistent cross-domain tracking is conducted.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-slate-900 text-base">3. Advertising & Sponsored Partners</h2>
            <p>
              When sponsored partner slots (e.g., Adsterra, Google AdSense) are displayed, they are kept in sandboxed containers. We enforce strict policies preventing full-page takeovers, forced clicks, or deceptive file download button mimics.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-slate-900 text-base">4. Storage Infrastructure</h2>
            <p>
              Binary assets are stored in Cloudflare R2 object storage located in certified data centers with end-to-end TLS 1.3 encryption.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export const TermsPage: React.FC<StaticPageProps> = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <Breadcrumbs items={[{ label: 'Terms of Service' }]} />

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Terms & Permitted Distribution
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Last Updated: September 2026
          </p>
        </div>

        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-5">
          <section className="space-y-2">
            <h2 className="font-bold text-slate-900 text-base">1. Permitted Content & Licensing</h2>
            <p>
              FileVault is strictly dedicated to hosting software, tools, game demos, documentation, and creative assets that the platform or its contributors have explicit authorization to distribute. We prohibit copyrighted pirated software, cracked binaries, malware, and unlicensed proprietary content.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-slate-900 text-base">2. Download Verification & Safe Usage</h2>
            <p>
              While FileVault performs automated virus scanning and publishes cryptographic hashes (SHA-256) for every file, users are advised to verify checksums before executing binaries on their operating systems. All software is provided "as is" under its respective author license (e.g. MIT, GPL, CC0).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-slate-900 text-base">3. Fair Use & Automated Scraping</h2>
            <p>
              Automated high-frequency scraping of binary downloads without rate limiting is subject to IP throttling to preserve edge CDN bandwidth for human visitors.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export const NotFoundPage: React.FC<StaticPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
        <FolderOpen className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">404 - Page Not Found</h1>
      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
        The file distribution or page you are looking for has been moved, unpublished, or does not exist.
      </p>
      <div className="pt-2">
        <button
          onClick={() => onNavigate('/')}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-full transition-colors shadow-xs"
        >
          Return to Homepage
        </button>
      </div>
    </div>
  );
};
