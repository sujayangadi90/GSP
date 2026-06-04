'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cmsApi, serviceApi } from '@/utils/api';
import { Phone, Mail, Clock, Menu, X, ArrowUp } from 'lucide-react';

export default function PublicLayout({ children }) {
  const [cms, setCms] = useState({
    header: {
      logoText: 'Global Service Point',
      phoneNumber: '+91 99000 12345',
      emailAddress: 'info@globalservicepoint.com'
    },
    footer: {
      aboutText: 'Global Service Point is Gadag\'s leading service provider for all home appliances, renewable energy products, water purifiers, and commercial cleaning services.',
      address: 'Main Road, Near Kalasgiri Temple, Gadag - 582101, Karnataka',
      phone: '+91 99000 12345',
      email: 'support@globalservicepoint.com',
      businessHours: 'Mon - Sat: 9:00 AM - 7:00 PM, Sun: Closed'
    }
  });

  const [categories, setCategories] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Fetch CMS
    cmsApi.getContent()
      .then((data) => {
        if (data.header && data.footer) {
          setCms((prev) => ({
            ...prev,
            header: data.header,
            footer: data.footer
          }));
        }
      })
    
    serviceApi.getCategories()
      .then((data) => {
        setCategories(data.filter(c => c.isActive !== false));
      })
      .catch((err) => console.log('Categories load failed in footer:', err));

    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 text-neutral-800 font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Header Contact Bar */}
      <div className="bg-slate-900 text-neutral-300 py-2.5 px-4 sm:px-6 lg:px-8 text-xs border-b border-slate-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:justify-between items-center gap-2">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <a href={`tel:${cms.footer.phone}`} className="flex items-center gap-1.5 hover:text-teal-400 transition-colors">
              <Phone className="w-3.5 h-3.5 text-teal-400" />
              <span>{cms.footer.phone}</span>
            </a>
            <a href={`mailto:${cms.footer.email}`} className="flex items-center gap-1.5 hover:text-teal-400 transition-colors">
              <Mail className="w-3.5 h-3.5 text-teal-400" />
              <span>{cms.footer.email}</span>
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Clock className="w-3.5 h-3.5 text-neutral-500" />
            <span>{cms.footer.businessHours}</span>
          </div>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-md py-3' 
          : 'bg-white py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img 
              src="/GSPlogoTransperant.png" 
              alt="Global Service Point Logo" 
              className="h-20 w-auto group-hover:scale-102 transition-transform duration-300"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 group-hover:text-teal-650 transition-colors">
                {cms.header.logoText}
              </span>
              <span className="text-[10px] text-teal-600 font-bold uppercase tracking-widest leading-none">
                Service & Solutions
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            <Link href="/" className="hover:text-teal-600 transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-teal-500 hover:after:w-full after:transition-all">Home</Link>
            <Link href="/about" className="hover:text-teal-600 transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-teal-500 hover:after:w-full after:transition-all">About Us</Link>
            <Link href="/#awards" className="hover:text-teal-600 transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-teal-500 hover:after:w-full after:transition-all">Awards</Link>
            <Link href="/services" className="hover:text-teal-600 transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-teal-500 hover:after:w-full after:transition-all">Services</Link>
            <Link href="/contact" className="hover:text-teal-600 transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-teal-500 hover:after:w-full after:transition-all">Contact Us</Link>
            
            <Link href="/contact" className="bg-gradient-to-r from-teal-600 to-cyan-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-teal-500/25 hover:-translate-y-0.5 transition-all duration-300">
              Enquire Now
            </Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-neutral-100 hover:text-slate-900 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-xl border-t border-neutral-100 p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-5 duration-200">
            <Link 
              href="/" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-semibold text-slate-800 hover:text-teal-600 py-1 transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/about" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-semibold text-slate-800 hover:text-teal-600 py-1 transition-colors"
            >
              About Us
            </Link>
            <Link 
              href="/#awards" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-semibold text-slate-800 hover:text-teal-600 py-1 transition-colors"
            >
              Awards
            </Link>
            <Link 
              href="/services" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-semibold text-slate-800 hover:text-teal-600 py-1 transition-colors"
            >
              Services
            </Link>
            <Link 
              href="/contact" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-semibold text-slate-800 hover:text-teal-600 py-1 transition-colors"
            >
              Contact Us
            </Link>
            
            <Link 
              href="/contact" 
              onClick={() => setMobileMenuOpen(false)}
              className="bg-gradient-to-r from-teal-600 to-cyan-500 text-white text-center py-3 rounded-xl font-bold shadow-lg shadow-teal-500/20"
            >
              Enquire Now
            </Link>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <main className="flex-grow">{children}</main>

      {/* Modern Footer Section */}
      <footer className="bg-slate-900 text-neutral-300 pt-16 pb-8 px-4 sm:px-6 lg:px-8 border-t border-slate-850">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Logo & About summary */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <img 
                src="/GSPlogoTransperant.png" 
                alt="Global Service Point Logo" 
                className="h-16 w-auto brightness-0 invert" 
              />
              <span className="font-extrabold text-lg text-white">{cms.header.logoText}</span>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {cms.footer.aboutText}
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Quick Navigation</h4>
            <div className="flex flex-col gap-2.5 text-sm text-neutral-400">
              <Link href="/" className="hover:text-teal-400 transition-colors">Home Base</Link>
              <Link href="/about" className="hover:text-teal-400 transition-colors">Who We Are</Link>
              <Link href="/services" className="hover:text-teal-400 transition-colors">Our Catalog</Link>
              <Link href="/contact" className="hover:text-teal-400 transition-colors">Get in Touch</Link>
              <Link href="/admin/login" className="hover:text-teal-400 transition-colors text-xs text-neutral-600">Admin Login</Link>
            </div>
          </div>

          {/* Services Category List */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Primary Categories</h4>
            <div className="flex flex-col gap-2.5 text-sm text-neutral-400">
              {categories.map((cat) => (
                <Link 
                  key={cat._id}
                  href={`/services/${cat.slug}`} 
                  className="hover:text-teal-400 transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact Details */}
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Office Details</h4>
            <div className="flex flex-col gap-3 text-sm text-neutral-400">
              <p className="leading-relaxed">{cms.footer.address}</p>
              <p className="flex items-center gap-2 hover:text-teal-400 transition-colors">
                <Phone className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <a href={`tel:${cms.footer.phone}`}>{cms.footer.phone}</a>
              </p>
              <p className="flex items-center gap-2 hover:text-teal-400 transition-colors">
                <Mail className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <a href={`mailto:${cms.footer.email}`}>{cms.footer.email}</a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer bottom bar */}
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 flex flex-col sm:flex-row sm:justify-between items-center gap-4 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} {cms.header.logoText}. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Designed for Gadag & Surrounding Regions</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
