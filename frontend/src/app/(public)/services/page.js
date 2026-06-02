'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { serviceApi } from '@/utils/api';
import { ArrowRight, Settings } from 'lucide-react';

export default function ServicesDirectoryPage() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    Promise.all([
      serviceApi.getCategories(),
      serviceApi.getServices()
    ])
      .then(([cats, servs]) => {
        setCategories(cats.filter(c => c.isActive !== false));
        setServices(servs.filter(s => s.isActive !== false));
      })
      .catch((err) => console.log('Error listing services catalog:', err))
      .finally(() => setLoading(false));
  }, []);

  const getServiceImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${baseUrl}${imagePath}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter(s => s.category && s.category.slug === selectedCategory);

  return (
    <div className="bg-neutral-50 text-slate-800 min-h-screen">
      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(20,184,166,0.1),transparent_65%)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="text-teal-400 font-bold uppercase tracking-widest text-xs">
            Professional Engineering
          </span>
          <h1 className="text-4xl sm:text-5xl font-black mt-3">
            Services & Solutions
          </h1>
          <p className="text-slate-400 mt-4 text-sm sm:text-base max-w-2xl mx-auto">
            Choose from home appliances repair, pure water purifiers, commercial sanitizations, or high-yield solar rooftop plants.
          </p>
        </div>
      </section>

      {/* Filter Menu Bar */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
              selectedCategory === 'all'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-500/10'
                : 'bg-slate-100 text-slate-650 hover:bg-slate-200'
            }`}
          >
            All Services
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                selectedCategory === cat.slug
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-500/10'
                  : 'bg-slate-100 text-slate-650 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Services Grid Catalog */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No services active in this category currently.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {filteredServices.map((service) => (
                <div
                  key={service._id}
                  className="bg-white border border-neutral-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-teal-500/10 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="p-8">
                    {/* Header Details */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-24 h-24 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {service.image ? (
                          <img 
                            src={getServiceImageUrl(service.image)} 
                            alt={service.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Settings className="w-10 h-10" />
                        )}
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border border-neutral-200 px-2 py-1 rounded bg-slate-50">
                        {service.category ? service.category.name : 'Service'}
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold text-slate-900 leading-tight mb-3">
                      {service.name}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                      {service.shortDescription}
                    </p>

                    {/* Features list snippets */}
                    {service.features && service.features.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-neutral-100 flex flex-wrap gap-1.5">
                        {service.features.slice(0, 3).map((feat, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-650 px-2 py-1 rounded">
                            {feat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="px-8 pb-8 pt-4 bg-slate-50 border-t border-neutral-100">
                    <Link
                      href={`/services/${service.category ? service.category.slug : 'general'}/${service.slug}`}
                      className="bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-bold py-3 px-6 rounded-xl w-full text-center hover:shadow-lg hover:shadow-teal-500/10 transition-all duration-300 flex items-center justify-center gap-1.5"
                    >
                      <span>Explore Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
