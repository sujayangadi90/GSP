'use client';

import React, { useEffect, useState } from 'react';
import { cmsApi } from '@/utils/api';
import { Settings, Save, AlertCircle, Compass, Target, HelpCircle, PhoneCall } from 'lucide-react';

export default function AdminCmsPage() {
  const [cms, setCms] = useState({
    header: { logoText: 'Global Service Point', phoneNumber: '+91 99000 12345', emailAddress: 'info@globalservicepoint.com' },
    footer: { aboutText: '', address: '', phone: '', email: '', businessHours: '' },
    hero: { title: '', subtitle: '', ctaText: '' },
    about_us: { introTitle: '', introText: '', experienceYears: '', vision: '', mission: '', commitment: '' }
  });

  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    cmsApi.getContent()
      .then((data) => {
        setCms({
          header: data.header || cms.header,
          footer: data.footer || cms.footer,
          hero: data.hero || cms.hero,
          about_us: data.about_us || cms.about_us
        });
      })
      .catch((err) => console.log('Error loading CMS fields:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleFieldChange = (section, field, value) => {
    setCms((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSaveSection = async (sectionKey) => {
    setSavingKey(sectionKey);
    setAlertMsg({ type: '', text: '' });

    try {
      await cmsApi.updateContent(sectionKey, cms[sectionKey]);
      setAlertMsg({ type: 'success', text: `Section [${sectionKey.toUpperCase()}] updated successfully!` });
      setTimeout(() => setAlertMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to update CMS section.' });
    } finally {
      setSavingKey('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 text-left">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">CMS Customizer</h1>
        <p className="text-slate-400 text-xs mt-1">Manage website banners, Vision/Mission copy, footers, and office coordinates dynamically.</p>
      </div>

      {alertMsg.text && (
        <div className={`p-4 rounded-xl border flex gap-2.5 items-start text-xs ${
          alertMsg.type === 'success'
            ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
            : 'bg-red-500/10 border-red-500/25 text-red-400'
        }`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Grid containing two columns of customizers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-sm">
        
        {/* Column 1: Hero banner & Footer */}
        <div className="flex flex-col gap-8">
          
          {/* 1. Hero banner editor */}
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Settings className="w-5 h-5 text-teal-400" />
              <span>Homepage Hero Banner</span>
            </h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider">Hero Main Title</label>
              <input 
                type="text" 
                value={cms.hero.title}
                onChange={(e) => handleFieldChange('hero', 'title', e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider">Hero Description Subtext</label>
              <textarea 
                rows={3}
                value={cms.hero.subtitle}
                onChange={(e) => handleFieldChange('hero', 'subtitle', e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider">Call-to-Action Text</label>
              <input 
                type="text" 
                value={cms.hero.ctaText}
                onChange={(e) => handleFieldChange('hero', 'ctaText', e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold"
              />
            </div>

            <button 
              onClick={() => handleSaveSection('hero')}
              disabled={savingKey === 'hero'}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
            >
              {savingKey === 'hero' ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Hero Section</span>
                </>
              )}
            </button>
          </div>

          {/* 2. Contact & Footer coordinates */}
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <PhoneCall className="w-5 h-5 text-teal-400" />
              <span>Contact Coordinates & Footer</span>
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider">Footer About Copy</label>
              <textarea 
                rows={2}
                value={cms.footer.aboutText}
                onChange={(e) => handleFieldChange('footer', 'aboutText', e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider">Corporate Office Address</label>
              <input 
                type="text" 
                value={cms.footer.address}
                onChange={(e) => handleFieldChange('footer', 'address', e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-450 uppercase tracking-wider">Contact Phone</label>
                <input 
                  type="text" 
                  value={cms.footer.phone}
                  onChange={(e) => handleFieldChange('footer', 'phone', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-450 uppercase tracking-wider">Contact Email</label>
                <input 
                  type="email" 
                  value={cms.footer.email}
                  onChange={(e) => handleFieldChange('footer', 'email', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider">Business Operating Hours</label>
              <input 
                type="text" 
                value={cms.footer.businessHours}
                onChange={(e) => handleFieldChange('footer', 'businessHours', e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold"
              />
            </div>

            <button 
              onClick={() => handleSaveSection('footer')}
              disabled={savingKey === 'footer'}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
            >
              {savingKey === 'footer' ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Footer Details</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Column 2: About Us copy */}
        <div className="flex flex-col gap-8">
          
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Compass className="w-5 h-5 text-teal-400" />
              <span>About Us Content</span>
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-450 uppercase tracking-wider">About Intro Title</label>
                <input 
                  type="text" 
                  value={cms.about_us.introTitle}
                  onChange={(e) => handleFieldChange('about_us', 'introTitle', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-450 uppercase tracking-wider">Experience (Yrs)</label>
                <input 
                  type="text" 
                  value={cms.about_us.experienceYears}
                  onChange={(e) => handleFieldChange('about_us', 'experienceYears', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider">About Description Copy</label>
              <textarea 
                rows={4}
                value={cms.about_us.introText}
                onChange={(e) => handleFieldChange('about_us', 'introText', e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-teal-400" />
                <span>Vision Statement</span>
              </label>
              <textarea 
                rows={2}
                value={cms.about_us.vision}
                onChange={(e) => handleFieldChange('about_us', 'vision', e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mission Statement</span>
              </label>
              <textarea 
                rows={2}
                value={cms.about_us.mission}
                onChange={(e) => handleFieldChange('about_us', 'mission', e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>Service Guarantee & Commitment</span>
              </label>
              <textarea 
                rows={2}
                value={cms.about_us.commitment}
                onChange={(e) => handleFieldChange('about_us', 'commitment', e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold resize-none"
              />
            </div>

            <button 
              onClick={() => handleSaveSection('about_us')}
              disabled={savingKey === 'about_us'}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
            >
              {savingKey === 'about_us' ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save About Content</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
