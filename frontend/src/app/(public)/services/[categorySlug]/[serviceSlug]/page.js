'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { serviceApi, brandApi, inquiryApi } from '@/utils/api';
import { Settings, Check, HelpCircle, Phone, Sparkles, Send, CheckCircle2 } from 'lucide-react';

export default function ServiceDetailPage({ params }) {
  // Unwrap params using React.use() / use() hook to support Next.js dynamic routing safely
  const resolvedParams = use(params);
  const { serviceSlug } = resolvedParams;

  const [service, setService] = useState(null);
  const [brands, setBrands] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    emailAddress: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const serv = await serviceApi.getServiceBySlug(serviceSlug);
        setService(serv);

        // Load all brands and filter which ones are associated with this service
        const allBrands = await brandApi.getBrands();
        const associated = allBrands.filter(b => 
          b.associatedServices && b.associatedServices.some(s => s.toLowerCase() === serv.name.toLowerCase())
        );
        setBrands(associated);

        // Load related services (same category)
        const allServs = await serviceApi.getServices();
        const rel = allServs.filter(s => 
          s.isActive !== false && 
          s.category && 
          serv.category && 
          s.category._id === serv.category._id && 
          s._id !== serv._id
        );
        setRelated(rel.slice(0, 3));
      } catch (err) {
        console.log('Error loading service detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serviceSlug]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      await inquiryApi.submit({
        ...formData,
        serviceCategory: service ? `${service.category ? service.category.name : 'General'} - ${service.name}` : 'General Inquiry'
      });
      setSubmitSuccess(true);
      setFormData({ name: '', mobileNumber: '', emailAddress: '', message: '' });
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
        <div className="text-center p-8 bg-white border rounded-2xl shadow-sm max-w-sm">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Service Not Found</h2>
          <p className="text-sm text-slate-500 mt-2">The service listing may have been moved or unpublished.</p>
          <Link href="/services" className="mt-6 inline-block bg-teal-600 text-white font-bold px-6 py-2.5 rounded-full text-sm">
            Browse All Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 text-slate-800 min-h-screen pb-20">
      {/* 1. Page Header banner */}
      <section className="bg-slate-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(20,184,166,0.1),transparent_65%)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 flex flex-col items-start gap-4">
            <span className="text-teal-400 font-bold uppercase tracking-widest text-xs">
              {service.category ? service.category.name : 'Service Details'}
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {service.name}
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-3xl leading-relaxed">
              {service.shortDescription}
            </p>
          </div>
          <div className="lg:col-span-4 flex justify-start lg:justify-end">
            <a 
              href="#inquiry" 
              className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold px-8 py-3.5 rounded-full shadow-lg hover:shadow-teal-500/20 hover:scale-102 transition-all duration-300"
            >
              Book service quote
            </a>
          </div>
        </div>
      </section>

      {/* 2. Main Content Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left detailed view column */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            {/* Overview */}
            <div className="bg-white border border-neutral-200 p-8 rounded-2xl shadow-sm text-left">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-4 pb-2 border-b border-neutral-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-teal-600 animate-spin-slow" />
                <span>Service Overview</span>
              </h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {service.detailedDescription}
              </p>
            </div>

            {/* Features & Benefits matrices */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Features */}
              {service.features && service.features.length > 0 && (
                <div className="bg-white border border-neutral-200 p-8 rounded-2xl shadow-sm text-left">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Check className="w-5 h-5 text-teal-600" />
                    <span>Technical Highlights</span>
                  </h3>
                  <div className="flex flex-col gap-3">
                    {service.features.map((feat, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start text-sm text-slate-600">
                        <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {service.benefits && service.benefits.length > 0 && (
                <div className="bg-white border border-neutral-200 p-8 rounded-2xl shadow-sm text-left">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal-600" />
                    <span>Key Advantages</span>
                  </h3>
                  <div className="flex flex-col gap-3">
                    {service.benefits.map((bene, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start text-sm text-slate-600">
                        <span className="w-5 h-5 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                          ★
                        </span>
                        <span>{bene}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right inquiry form column */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div id="inquiry" className="bg-white border-2 border-teal-500/20 p-8 rounded-3xl shadow-lg relative text-left">
              <span className="absolute top-0 right-8 -translate-y-1/2 bg-teal-600 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">
                Instant Quote
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                Inquire About Service
              </h3>
              <p className="text-slate-500 text-xs mb-6">
                Fill the form below and GSP Gadag engineers will respond within 30 minutes.
              </p>

              {submitSuccess ? (
                <div className="bg-teal-50 border border-teal-200 p-6 rounded-2xl text-center flex flex-col items-center gap-3 animate-in zoom-in-95 duration-200">
                  <CheckCircle2 className="w-12 h-12 text-teal-600" />
                  <h4 className="font-bold text-teal-850">Inquiry Received!</h4>
                  <p className="text-xs text-teal-700 leading-relaxed">
                    Thank you. An admin has been notified, and our service coordinators will reach out on your mobile number shortly.
                  </p>
                  <button 
                    onClick={() => setSubmitSuccess(false)}
                    className="text-xs text-teal-600 underline font-bold mt-2"
                  >
                    Send Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
                  {submitError && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-200 p-3 rounded-lg">
                      {submitError}
                    </p>
                  )}
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Your Name</label>
                    <input 
                      type="text" 
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Ramesh Patil"
                      className="w-full border border-neutral-200/80 bg-slate-50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Mobile Number</label>
                    <input 
                      type="tel" 
                      name="mobileNumber"
                      required
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      placeholder="e.g. 9876543210"
                      className="w-full border border-neutral-200/80 bg-slate-50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email (Optional)</label>
                    <input 
                      type="email" 
                      name="emailAddress"
                      value={formData.emailAddress}
                      onChange={handleChange}
                      placeholder="e.g. ramesh@example.com"
                      className="w-full border border-neutral-200/80 bg-slate-50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Brief Message</label>
                    <textarea 
                      name="message"
                      required
                      rows={3}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="e.g. Need regular cooling maintenance for my 1.5 ton split AC."
                      className="w-full border border-neutral-200/80 bg-slate-50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-teal-500/10 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Submit Inquiry</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Related Services Sidebar */}
            {related.length > 0 && (
              <div className="bg-white border border-neutral-200 p-8 rounded-2xl shadow-sm text-left">
                <h4 className="font-extrabold text-slate-900 text-lg mb-6 pb-2 border-b border-neutral-100">
                  Related Services
                </h4>
                <div className="flex flex-col gap-4">
                  {related.map((relServ) => (
                    <Link
                      key={relServ._id}
                      href={`/services/${relServ.category ? relServ.category.slug : 'general'}/${relServ.slug}`}
                      className="group flex flex-col gap-1 hover:bg-neutral-50/50 p-2 rounded transition-all"
                    >
                      <span className="font-bold text-sm text-slate-800 group-hover:text-teal-600 transition-colors">
                        {relServ.name}
                      </span>
                      <span className="text-xs text-slate-500 line-clamp-1">
                        {relServ.shortDescription}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
