'use client';

import React, { useEffect, useState } from 'react';
import { galleryApi } from '@/utils/api';
import { ChevronLeft, ChevronRight, X, Image as ImageIcon } from 'lucide-react';

export default function GalleryPage() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${baseUrl}${imagePath}`;
  };

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const data = await galleryApi.getGalleryImages();
        setGalleryItems(data || []);
      } catch (err) {
        console.error('Error fetching gallery images:', err);
      } finally {
        setLoading(false);
      }
    };
    loadGallery();
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedImageIndex === null) return;
      if (e.key === 'Escape') {
        setSelectedImageIndex(null);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, galleryItems]);

  const handleNext = () => {
    if (galleryItems.length <= 1) return;
    setSelectedImageIndex((prev) => (prev === galleryItems.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    if (galleryItems.length <= 1) return;
    setSelectedImageIndex((prev) => (prev === 0 ? galleryItems.length - 1 : prev - 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        {/* Page Title Header */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
          <span className="text-teal-600 font-bold text-xs uppercase tracking-widest bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-100 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Visual Showcase</span>
          </span>
          <h1 className="text-3xl sm:text-4.5xl font-extrabold tracking-tight text-slate-900">
            Our Gallery
          </h1>
          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
            Take a visual tour of our work, equipment, certifications, and project achievements.
          </p>
        </div>

        {/* Gallery Grid */}
        {galleryItems.length === 0 ? (
          <div className="text-center py-20 bg-white border border-neutral-200 rounded-3xl p-8 max-w-lg mx-auto flex flex-col items-center gap-4">
            <ImageIcon className="w-12 h-12 text-slate-350" />
            <h3 className="font-bold text-lg text-slate-800">No Images Available</h3>
            <p className="text-slate-550 text-sm">We are currently updating our gallery catalog. Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {galleryItems.map((item, idx) => (
              <div 
                key={item._id}
                onClick={() => setSelectedImageIndex(idx)}
                className="group relative bg-white border border-neutral-200 p-2 rounded-2xl shadow-xs hover:shadow-lg hover:border-teal-500/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden aspect-square flex items-center justify-center"
              >
                <img 
                  src={getImageUrl(item.image)} 
                  alt={`Gallery Image ${idx + 1}`} 
                  className="w-full h-full object-cover rounded-xl group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-2xl">
                  <span className="bg-white/95 text-teal-650 text-xs font-extrabold tracking-wider px-4 py-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">View Larger</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Slider Popup */}
      {selectedImageIndex !== null && galleryItems[selectedImageIndex] && (
        <div 
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-zoom-out select-none"
          onClick={() => setSelectedImageIndex(null)}
        >
          {/* Lightbox Container */}
          <div 
            className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              className="absolute -top-12 right-0 text-white hover:text-teal-400 p-2 transition-colors cursor-pointer"
              onClick={() => setSelectedImageIndex(null)}
              aria-label="Close Lightbox"
            >
              <X className="w-7 h-7" />
            </button>

            {/* Slider Image */}
            <img 
              src={getImageUrl(galleryItems[selectedImageIndex].image)} 
              alt={`Gallery Enlarged View ${selectedImageIndex + 1}`} 
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/5"
            />

            {/* Left/Right Navigation controls */}
            {galleryItems.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  className="absolute -left-4 sm:-left-16 top-1/2 -translate-y-1/2 z-40 p-2 sm:p-3 rounded-full bg-white/10 hover:bg-teal-500 text-white transition-all cursor-pointer backdrop-blur-xs shadow-md border border-white/10 hover:scale-105"
                  aria-label="Previous Image"
                >
                  <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="absolute -right-4 sm:-right-16 top-1/2 -translate-y-1/2 z-40 p-2 sm:p-3 rounded-full bg-white/10 hover:bg-teal-500 text-white transition-all cursor-pointer backdrop-blur-xs shadow-md border border-white/10 hover:scale-105"
                  aria-label="Next Image"
                >
                  <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
              </>
            )}

            {/* Image pagination indicator */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-slate-400 text-xs font-semibold">
              Image {selectedImageIndex + 1} of {galleryItems.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
