'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { serviceApi } from '@/utils/api';
import { ArrowLeft, ArrowRight, Settings } from 'lucide-react';

export default function CategoryDetailPage({ params }) {
  // Safe param unwrapping for React 19 / Next.js 15+
  const resolvedParams = use(params);
  const { categorySlug } = resolvedParams;

  const [category, setCategory] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategoryData = async () => {
      try {
        const [cats, servs] = await Promise.all([
          serviceApi.getCategories(),
          serviceApi.getServices()
        ]);

        const currentCat = cats.find(c => c.slug === categorySlug);
        if (currentCat) {
          setCategory(currentCat);
          const filtered = servs.filter(s => 
            s.isActive !== false && 
            s.category && 
            s.category._id === currentCat._id
          );
          setServices(filtered);
        }
      } catch (err) {
        console.log('Error loading category detail page:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategoryData();
  }, [categorySlug]);

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

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
        <div className="text-center p-8 bg-white border rounded-2xl shadow-sm max-w-sm">
          <Settings className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Category Not Found</h2>
          <p className="text-sm text-slate-500 mt-2">The requested services category does not exist.</p>
          <Link href="/services" className="mt-6 inline-block bg-teal-600 text-white font-bold px-6 py-2.5 rounded-full text-sm">
            All Services Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 text-slate-800 min-h-screen pb-20">
      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(20,184,166,0.1),transparent_65%)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-left">
          <Link 
            href="/services" 
            className="flex items-center gap-1.5 text-xs text-teal-400 font-bold hover:underline mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Categories</span>
          </Link>
          <h1 className="text-4xl sm:text-5xl font-black mt-2 tracking-tight leading-tight">
            {category.name} Services
          </h1>
          <p className="text-slate-400 mt-4 text-sm sm:text-base max-w-3xl leading-relaxed">
            {category.description || `Professional ${category.name} servicing and custom engineering solutions in Gadag.`}
          </p>
        </div>
      </section>

      {/* Services grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {services.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border p-8 max-w-md mx-auto">
              <p className="text-slate-500 font-medium">No active services inside this category yet.</p>
              <Link href="/contact" className="mt-4 inline-block bg-teal-650 text-white px-5 py-2 rounded-xl text-xs font-bold">
                Submit General Inquiry
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services.map((service) => (
                <div
                  key={service._id}
                  className="bg-white border border-neutral-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-teal-500/10 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="p-8 text-left">
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
                        {category.name}
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold text-slate-900 leading-tight mb-3">
                      {service.name}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                      {service.shortDescription}
                    </p>

                    {service.features && service.features.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-neutral-100 flex flex-wrap gap-1.5">
                        {service.features.slice(0, 3).map((feat, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-650 px-2 py-1 rounded font-medium">
                            {feat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="px-8 pb-8 pt-4 bg-slate-50 border-t border-neutral-100">
                    <Link
                      href={`/services/${category.slug}/${service.slug}`}
                      className="bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-bold py-3.5 px-6 rounded-xl w-full text-center hover:shadow-lg hover:shadow-teal-500/10 transition-all duration-300 flex items-center justify-center gap-1.5"
                    >
                      <span>Enquire Now</span>
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
