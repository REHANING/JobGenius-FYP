import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon,
  SparklesIcon,
  ClipboardDocumentCheckIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

interface CoverLetterResponse {
  success: boolean;
  data?: {
    coverLetter: string;
    jobTitle: string;
    companyName: string;
    hiringManagerName: string | null;
    generatedAt: string;
  };
  error?: string;
}

const Marketplace: React.FC = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [hiringManagerName, setHiringManagerName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState<'professional' | 'enthusiastic' | 'creative'>('professional');
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);

  // Load user profile on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = currentUser._id || currentUser.id;
        
        if (userId) {
          const response = await fetch(`http://localhost:5000/api/profile/${userId}`);
          const data = await response.json();
          
          if (data.success && data.data) {
            setUserProfile(data.data);
            console.log('✅ User profile loaded for cover letter');
          }
        }
      } catch (err) {
        console.log('No profile found or error loading:', err);
      }
    };
    
    loadUserProfile();
  }, []);

  const handleGenerate = async () => {
    if (!jobTitle.trim() || !companyName.trim()) {
      setError('Job title and company name are required');
      return;
    }

    setLoading(true);
    setError(null);
    setCoverLetter('');

    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser._id || currentUser.id || null;

      const response = await fetch('http://localhost:5000/api/cover-letter/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          jobTitle: jobTitle.trim(),
          companyName: companyName.trim(),
          hiringManagerName: hiringManagerName.trim() || null,
          jobDescription: jobDescription.trim() || null,
          tone,
        }),
      });

      const data: CoverLetterResponse = await response.json();

      if (data.success && data.data) {
        setCoverLetter(data.data.coverLetter);
      } else {
        setError(data.error || 'Failed to generate cover letter');
      }
    } catch (err) {
      console.error('Error generating cover letter:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (coverLetter) {
      navigator.clipboard.writeText(coverLetter);
      // Show temporary success message
      const btn = document.querySelector('[data-copy-btn]');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      }
    }
  };

  const handleDownload = () => {
    if (coverLetter) {
      const blob = new Blob([coverLetter], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cover_Letter_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadPDF = () => {
    if (!coverLetter) return;

    // Initialize fonts for pdfMake once
    if (!(pdfMake as any).vfs) {
      (pdfMake as any).vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : (pdfFonts as any);
    }

    const headerLines: any[] = [];
    if (jobTitle || companyName) {
      headerLines.push({ text: `${jobTitle || ''}${jobTitle && companyName ? ' at ' : ''}${companyName || ''}`, style: 'title', margin: [0, 0, 0, 6] });
    }
    if (hiringManagerName) {
      headerLines.push({ text: `Attention: ${hiringManagerName}`, style: 'sub' });
    }

    const docDefinition: any = {
      content: [
        ...headerLines,
        { text: new Date().toLocaleDateString(), style: 'date', margin: [0, 8, 0, 12] },
        { text: coverLetter, style: 'body' },
      ],
      styles: {
        title: { fontSize: 16, bold: true },
        sub: { fontSize: 11, color: '#555' },
        date: { fontSize: 9, color: '#888' },
        body: { fontSize: 11, lineHeight: 1.35 },
      },
      pageMargins: [40, 40, 40, 60],
    };

    const fileName = `Cover_Letter_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    (pdfMake as any).createPdf(docDefinition).download(fileName);
  };

  const handleReset = () => {
    setJobTitle('');
    setCompanyName('');
    setHiringManagerName('');
    setJobDescription('');
    setCoverLetter('');
    setError(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 min-h-screen" style={{ background: '#FFFFFF' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-saas-text-heading font-semibold mb-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          <span className="text-saas-cyan">
            AI Cover Letter
          </span>
          {' '}Generator
        </h1>
        <p className="text-xl text-saas-text-heading-secondary max-w-3xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
          Create professional, personalized cover letters tailored to any job application. Powered by AI.
        </p>
      </motion.div>

      {/* User Profile Status */}
      {userProfile && (
      <motion.div
          initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="p-4 glass-card">
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-saas-cyan" />
              <div>
                <p className="text-sm font-medium text-saas-cyan" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Using your saved profile: {userProfile.name || 'Profile loaded'}
                </p>
                <p className="text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Your experience and skills will be automatically included in the cover letter
                </p>
              </div>
            </div>
              </Card>
            </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
      <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
      >
        <Card className="p-6">
            <h2 className="text-2xl font-bold text-saas-text-heading mb-6 flex items-center gap-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              <DocumentTextIcon className="h-6 w-6 text-saas-cyan" />
              Job Details
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Job Title */}
              <div>
                <label className="block text-sm font-medium text-saas-text-heading mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Software Engineer, Marketing Manager"
                  className="w-full px-4 py-2 border border-saas-border rounded-lg input-glacier text-saas-text-heading focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-saas-text-heading mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Google, Microsoft"
                  className="w-full px-4 py-2 border border-saas-border rounded-lg input-glacier text-saas-text-heading focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              {/* Hiring Manager Name (Optional) */}
              <div>
                <label className="block text-sm font-medium text-saas-text-heading mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Hiring Manager Name (Optional)
                </label>
              <input
                type="text"
                  value={hiringManagerName}
                  onChange={(e) => setHiringManagerName(e.target.value)}
                  placeholder="e.g., John Smith"
                  className="w-full px-4 py-2 border border-saas-border rounded-lg input-glacier text-saas-text-heading focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan"
                  style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>

              {/* Job Description */}
              <div>
                <label className="block text-sm font-medium text-saas-text-heading mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Job Description (Optional)
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here for better personalization..."
                  rows={6}
                  className="w-full px-4 py-2 border border-saas-border rounded-lg input-glacier text-saas-text-heading focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan resize-none"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
                <p className="text-xs text-saas-text-heading-secondary mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Providing the job description helps create a more targeted cover letter
                </p>
              </div>

              {/* Tone Selection */}
              <div>
                <label className="block text-sm font-medium text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Tone
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'professional' as const, label: 'Professional', icon: '💼' },
                    { value: 'enthusiastic' as const, label: 'Enthusiastic', icon: '✨' },
                    { value: 'creative' as const, label: 'Creative', icon: '🎨' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTone(option.value)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        tone === option.value
                          ? 'border-saas-cyan bg-saas-cyan/20 text-[#22D3EE]'
                          : 'border-saas-border bg-white/20 text-saas-text-heading hover:border-saas-cyan/50'
                      }`}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-sm font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={loading || !jobTitle.trim() || !companyName.trim()}
                className="w-full gradient-primary hover:opacity-90"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Generate Cover Letter
                  </>
                )}
            </Button>
          </div>
        </Card>
      </motion.div>

        {/* Generated Cover Letter */}
      <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-saas-text-heading flex items-center gap-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                <ClipboardDocumentCheckIcon className="h-6 w-6 text-saas-cyan" />
                Generated Cover Letter
        </h2>
              {coverLetter && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActionsMenuOpen((o) => !o)}
                    className="flex items-center"
                    aria-haspopup="menu"
                    aria-expanded={actionsMenuOpen}
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Actions
                  </Button>
                  {actionsMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-48 glass-card rounded-lg shadow-lg z-10 overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          handleCopy();
                          setActionsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-saas-cyan/10 text-saas-text-heading flex items-center transition-colors"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2" />
                        Copy
                      </button>
                      <button
                        onClick={() => {
                          handleDownload();
                          setActionsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-saas-cyan/10 text-saas-text-heading flex items-center transition-colors"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        Download .txt
                      </button>
                      <button
                        onClick={() => {
                          handleDownloadPDF();
                          setActionsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-saas-cyan/10 text-saas-text-heading flex items-center transition-colors"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        Download PDF
                      </button>
                  </div>
                  )}
                </div>
              )}
        </div>

            {coverLetter ? (
              <div className="flex-1 glass-card rounded-lg p-6 overflow-y-auto max-h-[600px]">
                <pre className="whitespace-pre-wrap text-saas-text-heading font-sans text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {coverLetter}
                </pre>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-white/20 rounded-lg border-2 border-dashed border-saas-border">
                <div className="text-center p-8">
                  <DocumentTextIcon className="h-16 w-16 text-saas-text-heading-secondary mx-auto mb-4" />
                  <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Your generated cover letter will appear here
                  </p>
                  <p className="text-sm text-saas-text-heading-secondary mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Fill in the job details and click "Generate Cover Letter"
                  </p>
                </div>
              </div>
            )}

            {coverLetter && (
              <div className="mt-4 pt-4 border-t border-saas-cyan/20">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="w-full"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Generate New Cover Letter
            </Button>
              </div>
        )}
          </Card>
      </motion.div>
      </div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-saas-text-heading mb-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            💡 Tips for Using the Cover Letter Generator
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-saas-text-heading mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                📋 Provide Complete Information
              </h4>
              <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                Include the job description for better personalization and alignment with requirements.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-saas-text-heading mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                ✏️ Review and Customize
              </h4>
              <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                Always review the generated cover letter and make personal adjustments before sending.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-saas-text-heading mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                💼 Match the Tone
              </h4>
              <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                Choose the appropriate tone based on the company culture and industry.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Marketplace;
