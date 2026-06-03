'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cmsApi, serviceApi, brandApi, testimonialApi, bannerApi } from '@/utils/api';
import { Shield, Settings, Zap, Smile, ArrowRight, Star, Heart, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const [cms, setCms] = useState({
    hero: {
      title: 'Your Trusted Partner for Expert Services',
      subtitle: 'Professional Appliance Repair, Solar Systems, Water Solutions & Cleanings in Gadag & Surrounding Areas.',
      ctaText: 'Submit Inquiry',
      banners: []
    },
    about_us: {
      introTitle: 'Welcome to Global Service Point',
      introText: 'Established in Gadag, Global Service Point has grown into a premium one-stop hub for specialized services. We combine skilled craftsmanship, authentic parts, and swift turnaround times to guarantee maximum appliance and asset lifetime for our domestic and commercial clients.',
      experienceYears: '10+'
    },
    why_choose_us: {
      title: 'Why Gadag Trusts Us',
      subtitle: 'We bring precision, quality, and values to every service callback.',
      features: [
        { title: 'Proven Experience', desc: 'Over a decade servicing thousands of happy households and shops.' },
        { title: 'Certified Technicians', desc: 'Specially trained and certified engineers for premium brands.' },
        { title: 'Quick Turnaround', desc: 'Local staff ensures quick reach and same-day diagnosis.' },
        { title: '100% Customer Satisfaction', desc: 'Top ratings, friendly staff, and robust post-service warranties.' }
      ]
    }
  });

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch active banners for homepage
  const [banners, setBanners] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [cmsData, catData, brandData, testData, bannerData] = await Promise.all([
          cmsApi.getContent(),
          serviceApi.getCategories(),
          brandApi.getBrands(),
          testimonialApi.getTestimonials(),
          bannerApi.getBanners().catch(() => []) // Safely load banners
        ]);

        if (cmsData.hero) {
          setCms((prev) => ({
            ...prev,
            hero: cmsData.hero,
            about_us: cmsData.about_us || prev.about_us,
            why_choose_us: cmsData.why_choose_us || prev.why_choose_us
          }));
        }

        setCategories(catData.filter(c => c.isActive !== false));
        setBrands(brandData);
        setTestimonials(testData);
        setBanners(bannerData || []);
      } catch (err) {
        console.log('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  // Slider Auto Rotation logic (rotate every 4 seconds)
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Loading premium services...</p>
        </div>
      </div>
    );
  }

  const getCategoryImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${baseUrl}${imagePath}`;
  };

  const handlePrevSlide = () => {
    if (banners.length === 0) return;
    setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    if (banners.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  return (
    <div className="flex flex-col overflow-x-hidden">
      {/* Dynamic Banner Slider Section */}
      <section className="relative w-full bg-slate-950 overflow-hidden aspect-[4/3] md:aspect-[1900/760] min-h-[260px] sm:min-h-[320px]">
        {banners.length === 0 ? (
          // Case 5: If no banner exists, show a default placeholder banner
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white p-8 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(20,184,166,0.15),transparent_60%)]"></div>
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <div className="relative z-10 flex flex-col items-center gap-4 max-w-3xl">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Your Trusted Partner for Expert Services</h1>
              <p className="text-sm sm:text-lg text-slate-300">Professional Appliance Repair, Solar Systems, Water Solutions & Cleanings in Gadag & Surrounding Areas.</p>
              <Link 
                href="/contact" 
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold px-8 py-3.5 rounded-full shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all duration-300 flex items-center gap-2 mt-4"
              >
                <span>Enquire Now</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Banner list */}
            <div className="relative w-full h-full flex transition-transform duration-500 ease-in-out" style={{ height: '100%' }}>
              {banners.map((banner, idx) => (
                <div 
                  key={banner._id} 
                  className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  {/* Banner Image covers full area without distortion */}
                  <img 
                    src={getCategoryImageUrl(banner.image)} 
                    alt={banner.title} 
                    className="w-full h-full object-cover select-none"
                  />
                  {/* Dark overlay for readability */}
                  <div className="absolute inset-0 bg-slate-950/45 md:bg-slate-950/30"></div>
                  
                  {/* CTA overlay positioned at the lower region */}
                  <div className="absolute bottom-10 sm:bottom-14 md:bottom-20 lg:bottom-24 left-6 sm:left-12 md:left-20 lg:left-32 z-20">
                    <Link 
                      href="/contact" 
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-extrabold px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-full shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 w-fit text-xs sm:text-sm group border border-white/10"
                    >
                      <span>Enquire Now</span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation buttons: Displayed only if there's more than one banner */}
            {banners.length > 1 && (
              <>
                <button 
                  onClick={handlePrevSlide} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-slate-900/60 hover:bg-teal-500/90 text-white transition-all backdrop-blur-sm cursor-pointer shadow-lg hover:scale-105 border border-white/10"
                  aria-label="Previous Slide"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <button 
                  onClick={handleNextSlide} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-slate-900/60 hover:bg-teal-500/90 text-white transition-all backdrop-blur-sm cursor-pointer shadow-lg hover:scale-105 border border-white/10"
                  aria-label="Next Slide"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                </button>

                {/* Pagination Indicators / Dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                  {banners.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-teal-400 w-6' : 'bg-white/50 hover:bg-white'}`}
                      aria-label={`Go to slide ${idx + 1}`}
                    ></button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>

      {/* 2. Services Highlights */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-50 text-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center gap-3">
            <span className="text-teal-600 font-bold text-xs uppercase tracking-widest bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-100">
              Browse Categories
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Our Professional Solutions
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
              Select a category to view individual service listings, dynamic booking calendars, and supported brand partners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category) => (
              <Link 
                key={category._id}
                href={`/services/${category.slug}`}
                className="group relative bg-white border border-neutral-200/60 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:border-teal-500/20 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="flex flex-col gap-4">
                  <div className="w-24 h-24 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center overflow-hidden group-hover:bg-teal-500 group-hover:text-white transition-colors duration-300 flex-shrink-0">
                    {category.image ? (
                      <img 
                        src={getCategoryImageUrl(category.image)} 
                        alt={category.name} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <Settings className="w-10 h-10" />
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-teal-600 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                    {category.description}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-teal-600 font-bold mt-6 group-hover:underline">
                  <span>View Services</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. About us introduction */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white text-slate-900 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 relative">
            <div className="relative w-full max-w-md mx-auto aspect-[16/10] rounded-3xl overflow-hidden shadow-lg border border-neutral-200">
              <img 
                src="/10plus.png" 
                alt="10+ Years of Excellence" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col items-start gap-6 text-left">
            <span className="text-teal-600 font-bold text-xs uppercase tracking-widest bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-100">
              Corporate Profile
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              {cms.about_us.introTitle}
            </h2>
            <p className="text-slate-600 leading-relaxed">
              {cms.about_us.introText}
            </p>
            <div className="flex gap-4">
              <Link 
                href="/about" 
                className="bg-slate-900 text-white font-semibold px-6 py-3 rounded-full hover:bg-slate-800 transition-colors"
              >
                Read Full Story
              </Link>
              <Link 
                href="/contact" 
                className="text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1"
              >
                <span>Get Service Quote</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Why Choose Us */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-900 text-white relative overflow-hidden">
        {/* Subtle backdrop blobs */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(20,184,166,0.08),transparent_50%)]"></div>
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center gap-3 relative z-10">
            <span className="text-teal-400 font-bold text-xs uppercase tracking-widest bg-teal-500/10 px-3.5 py-1.5 rounded-full border border-teal-500/20">
              Our Core Strengths
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {cms.why_choose_us.title}
            </h2>
            <p className="text-slate-400 leading-relaxed text-sm sm:text-base">
              {cms.why_choose_us.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            {cms.why_choose_us.features.map((feature, idx) => (
              <div 
                key={idx}
                className="bg-slate-850 border border-slate-800/80 p-8 rounded-2xl flex gap-5 items-start hover:border-teal-500/30 hover:bg-slate-800/50 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center flex-shrink-0">
                  {idx === 0 && <Shield className="w-6 h-6" />}
                  {idx === 1 && <Settings className="w-6 h-6" />}
                  {idx === 2 && <Zap className="w-6 h-6" />}
                  {idx === 3 && <Smile className="w-6 h-6" />}
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Supported Brands Slider */}
      {brands.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-neutral-100">
          <div className="max-w-7xl mx-auto">
            <p className="text-center text-xs text-slate-400 uppercase tracking-widest font-extrabold mb-8">
              Certified Multi-Brand Service Partner
            </p>
            <div className="relative w-full overflow-hidden">
              {/* Flex row with wrap or sliding carousel. For simplicity and responsiveness, a beautiful flex grid is ideal */}
              <div className="flex flex-wrap items-center justify-center gap-12 md:gap-16 opacity-60 grayscale hover:grayscale-0 hover:opacity-90 transition-all duration-300">
                {brands.map((brand) => (
                  <div key={brand._id} className="flex flex-col items-center justify-center">
                    <span className="font-extrabold text-xl sm:text-2xl text-slate-700 tracking-tight">
                      {brand.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900 border-b border-neutral-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center gap-3">
              <span className="text-teal-600 font-bold text-xs uppercase tracking-widest bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-100">
                Testimonials
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                What Our Customers Say
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((test) => (
                <div 
                  key={test._id}
                  className="bg-white border border-neutral-200/50 p-8 rounded-2xl shadow-sm flex flex-col justify-between gap-6 hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-0.5 text-yellow-400">
                      {[...Array(test.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed italic">
                      "{test.review}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
                    <div className="w-9 h-9 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-sm">
                      {test.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-bold text-sm text-slate-900">{test.name}</h4>
                      <span className="text-[10px] text-slate-400">Verified Customer</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. Call-to-action Book Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-teal-600 to-cyan-600 text-white relative">
        <div className="max-w-5xl mx-auto text-center flex flex-col items-center gap-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Need Expert Repair or Solar Installation?
          </h2>
          <p className="text-lg text-teal-100 max-w-2xl leading-relaxed">
            Submit a quick callback request. Our local technicians in Gadag will reach out to you within 30 minutes to diagnose your requirement.
          </p>
          <Link 
            href="/contact" 
            className="bg-white text-teal-700 font-extrabold px-10 py-4 rounded-full shadow-xl hover:shadow-2xl hover:bg-neutral-50 hover:-translate-y-0.5 transition-all duration-300"
          >
            Submit Callback Request
          </Link>
        </div>
      </section>
    </div>
  );
}
