'use client';

import React, { useState, useEffect } from 'react';
import { cmsApi, inquiryApi } from '@/utils/api';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [cms, setCms] = useState({
    footer: {
      address: 'Main Road, Near Kalasgiri Temple, Gadag - 582101, Karnataka',
      phone: '+91 99000 12345',
      email: 'support@globalservicepoint.com',
      businessHours: 'Mon - Sat: 9:00 AM - 7:00 PM, Sun: Closed'
    }
  });

  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    message: ''
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    cmsApi.getContent()
      .then((data) => {
        if (data.footer) {
          setCms((prev) => ({
            ...prev,
            footer: data.footer
          }));
        }
      })
      .catch((err) => console.log('Error fetching CMS for contact page:', err))
      .finally(() => setLoading(false));
  }, []);

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
        emailAddress: '',
        serviceCategory: 'General Contact Us'
      });
      setSubmitSuccess(true);
      setFormData({ name: '', mobileNumber: '', message: '' });
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit message. Please try again.');
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

  const { footer } = cms;

  return (
    <div className="bg-neutral-50 text-slate-800 min-h-screen">
      {/* Banner */}
      <section className="bg-slate-900 text-white py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(20,184,166,0.1),transparent_65%)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="text-teal-400 font-bold uppercase tracking-widest text-xs">
            Get In Touch
          </span>
          <h1 className="text-4xl sm:text-5xl font-black mt-3">
            Contact Us
          </h1>
          <p className="text-slate-400 mt-4 text-sm sm:text-base max-w-2xl mx-auto">
            Have questions about solar rooftops or need immediate appliance repair in Gadag? Write to us now!
          </p>
        </div>
      </section>

      {/* Main Container */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Details Column */}
          <div className="lg:col-span-5 flex flex-col gap-8 text-left justify-start">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Office Details & Support
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm">
              We operate directly from the heart of Gadag city, allowing our mobile technician fleet to cover Betageri, Mulgund, and neighboring hubs efficiently.
            </p>

            <div className="flex flex-col gap-6 mt-4">
              {/* Address */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-950 text-sm">Visit Location</h4>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{footer.address}</p>
                </div>
              </div>

              {/* Phones */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-950 text-sm">Call Support</h4>
                  <a href={`tel:${footer.phone}`} className="text-sm text-teal-600 font-semibold mt-1 block hover:underline">
                    {footer.phone}
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-950 text-sm">Write Email</h4>
                  <a href={`mailto:${footer.email}`} className="text-sm text-teal-600 font-semibold mt-1 block hover:underline">
                    {footer.email}
                  </a>
                </div>
              </div>

              {/* Business Hours */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-950 text-sm">Working Hours</h4>
                  <p className="text-sm text-slate-500 mt-1">{footer.businessHours}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-neutral-200 p-8 sm:p-10 rounded-3xl shadow-sm text-left">
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
                Send Us a Message
              </h3>
              <p className="text-slate-500 text-xs mb-8">
                Submit your phone number below and our desk coordinators will callback.
              </p>

              {submitSuccess ? (
                <div className="bg-teal-50 border border-teal-200 p-8 rounded-2xl text-center flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
                  <CheckCircle2 className="w-12 h-12 text-teal-600" />
                  <h4 className="font-extrabold text-teal-900 text-lg">Message Submitted Successfully!</h4>
                  <p className="text-sm text-teal-700 leading-relaxed max-w-sm">
                    Thank you. We have saved your callback inquiry. Our field technicians are being mapped to your details.
                  </p>
                  <button 
                    onClick={() => setSubmitSuccess(false)}
                    className="text-sm text-teal-600 underline font-bold mt-4"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-sm">
                  {submitError && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-200 p-3 rounded-lg">
                      {submitError}
                    </p>
                  )}
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Your Full Name</label>
                    <input 
                      type="text" 
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Ramesh Kulkarni"
                      className="w-full border border-neutral-200/80 bg-slate-50 px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Mobile Number</label>
                    <input 
                      type="tel" 
                      name="mobileNumber"
                      required
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      placeholder="e.g. 9876543210"
                      className="w-full border border-neutral-200/80 bg-slate-50 px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Describe Your Requirement</label>
                    <textarea 
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Explain what appliances, solar setup, or water systems support you require..."
                      className="w-full border border-neutral-200/80 bg-slate-50 px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all resize-none font-medium"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={submitting}
                    className="bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-teal-500/10 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Submit Message</span>
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
