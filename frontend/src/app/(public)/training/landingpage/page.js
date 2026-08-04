'use client';

import React, { useState, useRef } from 'react';
import { trainingApi } from '@/utils/api';
import { 
  BookOpen, 
  Settings, 
  Award, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Phone, 
  MapPin, 
  User, 
  CheckCircle2, 
  Send 
} from 'lucide-react';

export default function TrainingLandingPage() {
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      await trainingApi.submitLead(formData);
      setSubmitSuccess(true);
      setFormData({ name: '', phone: '', city: '' });
    } catch (err) {
      setSubmitError(err.message || 'Failed to request information. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const benefits = [
    { title: 'Hands-on practical training', desc: 'Real appliances, real tools, real experience.', icon: Settings },
    { title: 'Learn appliance troubleshooting', desc: 'Diagnose electronic cards, compressors, and motor faults.', icon: Zap },
    { title: 'Industry-experienced trainers', desc: 'Learn directly from certified technicians and field veterans.', icon: BookOpen },
    { title: 'Career & business opportunities', desc: 'Start earning as a technician or set up your own repair agency.', icon: TrendingUp },
    { title: 'Certification support', desc: 'Assistance in getting recognized certificates to build credibility.', icon: Award },
    { title: 'Latest repair techniques', desc: 'Cover inverter ACs, smart fridges, modern ovens & purifiers.', icon: ShieldCheck }
  ];

  return (
    <div className="bg-neutral-50 text-slate-800 min-h-screen font-sans selection:bg-teal-500 selection:text-white">
      {/* 1. Hero Section */}
      <section className="bg-slate-950 text-white py-24 sm:py-32 text-center relative overflow-hidden flex flex-col items-center">
        {/* Subtle background gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(20,184,166,0.15),transparent_60%)]"></div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
          <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest animate-pulse">
            Professional Skill Center
          </span>
          <h1 className="text-4xl sm:text-6xl font-black mt-6 tracking-tight leading-tight max-w-3xl">
            Become a Certified <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Appliance Service</span> Technician
          </h1>
          <p className="text-slate-400 mt-6 text-base sm:text-xl max-w-2xl leading-relaxed">
            Learn appliance repair and servicing from industry experts and build your career with practical hands-on training in Gadag.
          </p>
          <button 
            onClick={scrollToForm}
            className="mt-10 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold px-8 py-4 rounded-full shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:scale-105 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Enroll Now</span>
            <Zap className="w-4 h-4 text-white fill-white" />
          </button>
        </div>
      </section>

      {/* 2. About Training Center */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text panel */}
          <div className="text-left">
            <span className="text-teal-600 font-bold uppercase tracking-widest text-xs">
              Knowledge Hub
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-6">
              About Global Service Point Training Center
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
              Global Service Point Training Center provides hands-on technical training for individuals interested in appliance repair and servicing. Our programs are designed to equip trainees with practical skills, troubleshooting techniques, and industry knowledge required to service home and commercial appliances confidently.
            </p>
            <div className="flex flex-col gap-4 mt-6">
              <div className="flex gap-3 items-center">
                <div className="w-5 h-5 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-700">100% Practical and Workshop Driven</span>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-5 h-5 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-700">In-depth PCB and Electrical Fault Diagnosis</span>
              </div>
            </div>
          </div>

          {/* Graphic panel */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 rounded-3xl transform rotate-3"></div>
            <img 
              src="/Appliance Repair.png" 
              alt="Appliance Repair Technical Training" 
              className="rounded-3xl shadow-2xl relative z-10 border border-slate-200/40 w-full h-auto object-cover max-h-[400px]"
            />
          </div>
        </div>
      </section>

      {/* 3. Lead Collection & Benefits (Split Layout) */}
      <section className="bg-slate-100 py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-200" ref={formRef}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Benefits Panel (Why Join) */}
          <div className="lg:col-span-7 text-left">
            <span className="text-teal-600 font-bold uppercase tracking-widest text-xs">
              Program Benefits
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-3 mb-10">
              Why Join Our Training Program
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {benefits.map((benefit, i) => {
                const Icon = benefit.icon;
                return (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all">
                    <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{benefit.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{benefit.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Collection Panel */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl shadow-sm text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none"></div>
              
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
                Join GSP Academy
              </h3>
              <p className="text-slate-500 text-xs mb-8">
                Request training information below, and our program advisor will call you shortly.
              </p>

              {submitSuccess ? (
                <div className="bg-teal-50 border border-teal-200 p-8 rounded-2xl text-center flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-teal-900 text-lg">Submission Successful!</h4>
                  <p className="text-sm text-teal-700 leading-relaxed max-w-sm">
                    Thank you for your interest. Our training team will contact you shortly.
                  </p>
                  <button 
                    onClick={() => setSubmitSuccess(false)}
                    className="text-xs text-teal-600 underline font-bold mt-4 cursor-pointer"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-sm">
                  {submitError && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-200 p-3 rounded-lg">
                      {submitError}
                    </p>
                  )}

                  {/* Name field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Your Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Anand Angadi"
                        className="w-full border border-slate-200/80 bg-slate-50 pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all font-semibold placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Phone field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="tel" 
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="e.g. 9876543210"
                        className="w-full border border-slate-200/80 bg-slate-50 pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all font-semibold placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* City field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Your City</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="e.g. Gadag"
                        className="w-full border border-slate-200/80 bg-slate-50 pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all font-semibold placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {submitting ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Request Training Information</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
