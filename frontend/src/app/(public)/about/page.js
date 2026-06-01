'use client';

import React, { useState, useEffect } from 'react';
import { cmsApi } from '@/utils/api';
import { Target, Compass, Star, ShieldCheck } from 'lucide-react';

export default function AboutPage() {
  const [cms, setCms] = useState({
    about_us: {
      introTitle: 'Welcome to Global Service Point',
      introText: 'Established in Gadag, Global Service Point has grown into a premium one-stop hub for specialized services. We combine skilled craftsmanship, authentic parts, and swift turnaround times to guarantee maximum appliance and asset lifetime for our domestic and commercial clients.',
      experienceYears: '10+',
      vision: 'To be the most reliable, efficient, and preferred multi-services partner in Karnataka by delivering value, transparency, and top-tier support.',
      mission: 'To restore client convenience and comfort with professional home appliances repairs, high-performing green energy solutions, and complete hygiene management.',
      coreValues: [
        { title: 'Integrity', desc: 'Honest pricing and 100% genuine spares always.' },
        { title: 'Expertise', desc: 'Fully qualified, background-checked technicians.' },
        { title: 'Promptness', desc: 'Committed to quick response times and resolving issues on the first visit.' },
        { title: 'Eco-conscious', desc: 'Promoting energy-efficient systems and non-toxic services.' }
      ],
      commitment: 'We stand by our work. If you face any issues post-service within 30 days, we perform re-inspection and correction absolutely free of cost!'
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cmsApi.getContent()
      .then((data) => {
        if (data.about_us) {
          setCms((prev) => ({
            ...prev,
            about_us: data.about_us
          }));
        }
      })
      .catch((err) => console.log('Error loading CMS for about:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { about_us } = cms;

  return (
    <div className="bg-neutral-50 text-slate-800">
      {/* Page Header */}
      <section className="bg-slate-900 text-white py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(20,184,166,0.1),transparent_65%)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="text-teal-400 font-bold uppercase tracking-widest text-xs">
            Learn More About Us
          </span>
          <h1 className="text-4xl sm:text-5xl font-black mt-3">
            Company Profile
          </h1>
          <p className="text-slate-400 mt-4 text-sm sm:text-base max-w-2xl mx-auto">
            Providing premium technical support, solar deployment, and cleaning engineering in Gadag and nearby regions.
          </p>
        </div>
      </section>

      {/* Intro Overview & Stats */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col items-start gap-6 text-left">
            <h2 className="text-3xl font-extrabold text-slate-900">
              {about_us.introTitle}
            </h2>
            <p className="text-slate-600 leading-relaxed">
              {about_us.introText}
            </p>
            <p className="text-slate-600 leading-relaxed">
              We employ localized multi-skilled technicians who undergo continuous training in state-of-the-art repair tools, ensuring you get factory-equivalent servicing for advanced inverter ACs, smart washing machines, and complex RO setups.
            </p>
          </div>
          
          <div className="lg:col-span-5 bg-gradient-to-tr from-teal-550/5 to-cyan-550/5 border border-teal-500/10 p-10 rounded-3xl flex flex-col items-center justify-center text-center">
            <span className="text-7xl font-extrabold text-teal-600 leading-none">
              {about_us.experienceYears}
            </span>
            <span className="text-sm uppercase tracking-widest font-extrabold text-slate-500 mt-2">
              Years of Experience
            </span>
            <div className="w-16 h-1 bg-teal-500 rounded my-6"></div>
            <p className="text-sm text-slate-500 italic max-w-xs">
              "We take pride in our service excellence and honest technician callouts."
            </p>
          </div>
        </div>
      </section>

      {/* Vision & Mission Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-b border-neutral-200/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Vision */}
          <div className="bg-white border border-neutral-200 p-8 rounded-2xl shadow-sm flex gap-5 items-start">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-3 text-left">
              <h3 className="text-2xl font-bold text-slate-900">Our Vision</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                {about_us.vision}
              </p>
            </div>
          </div>

          {/* Mission */}
          <div className="bg-white border border-neutral-200 p-8 rounded-2xl shadow-sm flex gap-5 items-start">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-3 text-left">
              <h3 className="text-2xl font-bold text-slate-900">Our Mission</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                {about_us.mission}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-3xl mx-auto mb-16 flex flex-col items-center gap-3">
            <span className="text-teal-600 font-bold text-xs uppercase tracking-widest bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-100">
              Our Principles
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Core Values
            </h2>
            <p className="text-slate-500 text-sm">
              We base our business on transparency, engineering standards, and long-term values.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {about_us.coreValues.map((value, idx) => (
              <div 
                key={idx}
                className="bg-neutral-50 border border-neutral-200/60 p-6 rounded-xl flex flex-col items-center text-center gap-4 hover:-translate-y-0.5 transition-transform"
              >
                <div className="w-10 h-10 bg-teal-500/10 text-teal-600 rounded-full flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
                <h4 className="font-bold text-lg text-slate-900">{value.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
