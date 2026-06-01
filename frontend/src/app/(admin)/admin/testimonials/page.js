'use client';

import React, { useEffect, useState } from 'react';
import { testimonialApi } from '@/utils/api';
import { Plus, Trash, Edit, AlertCircle, Star, X, Save } from 'lucide-react';

export default function AdminTestimonialsManager() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', text: '' });

  // Modal & Form states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    review: '',
    rating: 5,
    isPublished: true
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await testimonialApi.getAllTestimonials();
      setTestimonials(data);
    } catch (err) {
      triggerAlert('error', err.message || 'Failed to fetch reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const triggerAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert({ type: '', text: '' }), 4000);
  };

  const handleEdit = (test) => {
    setForm({
      name: test.name,
      review: test.review,
      rating: test.rating || 5,
      isPublished: test.isPublished !== false
    });
    setEditingId(test._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer testimonial?')) return;
    try {
      await testimonialApi.deleteTestimonial(id);
      triggerAlert('success', 'Testimonial removed successfully.');
      fetchAll();
    } catch (err) {
      triggerAlert('error', err.message || 'Failed to delete review.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await testimonialApi.updateTestimonial(editingId, form);
        triggerAlert('success', 'Testimonial updated successfully!');
      } else {
        await testimonialApi.createTestimonial(form);
        triggerAlert('success', 'Testimonial created successfully!');
      }
      setShowModal(false);
      setForm({ name: '', review: '', rating: 5, isPublished: true });
      setEditingId(null);
      fetchAll();
    } catch (err) {
      triggerAlert('error', err.message || 'Write testimonial failed.');
    }
  };

  return (
    <div className="flex flex-col gap-8 text-left text-slate-200">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Customer Testimonials</h1>
          <p className="text-slate-400 text-xs mt-1">Review, approve, publish, or edit client ratings showing on the homepage slider.</p>
        </div>
        <button 
          onClick={() => { setForm({ name: '', review: '', rating: 5, isPublished: true }); setEditingId(null); setShowModal(true); }}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-teal-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add Testimonial</span>
        </button>
      </div>

      {alert.text && (
        <div className={`p-4 rounded-xl border flex gap-2.5 items-start text-xs ${
          alert.type === 'success'
            ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
            : 'bg-red-500/10 border-red-500/25 text-red-400'
        }`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{alert.text}</span>
        </div>
      )}

      {loading ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
          {testimonials.map((test) => (
            <div 
              key={test._id}
              className="bg-slate-900 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between gap-5 hover:border-slate-800 transition-all text-left"
            >
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-0.5 text-yellow-400">
                    {[...Array(test.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className={`text-[9px] font-extrabold uppercase border px-2 py-0.5 rounded ${
                    test.isPublished !== false 
                      ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' 
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {test.isPublished !== false ? 'Approved' : 'Hidden'}
                  </span>
                </div>

                <p className="text-xs text-slate-450 italic leading-relaxed">"{test.review}"</p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-800 mt-2">
                <span className="font-extrabold text-white text-xs">{test.name}</span>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => handleEdit(test)}
                    className="p-1.5 rounded-lg bg-slate-850 text-slate-400 hover:text-teal-400 transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(test._id)}
                    className="p-1.5 rounded-lg bg-slate-850 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL WRITER */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-850 p-6 sm:p-8 rounded-3xl max-w-md w-full text-left shadow-2xl flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white">{editingId ? 'Edit Testimonial' : 'Add Testimonial'}</h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 uppercase tracking-wider">Customer Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Anand Kumar"
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 uppercase tracking-wider">Rating (1 to 5 Stars)</label>
                  <select 
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold"
                  >
                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-400 uppercase tracking-wider">Review Content</label>
                <textarea 
                  rows={4}
                  required
                  value={form.review}
                  onChange={(e) => setForm({ ...form, review: e.target.value })}
                  placeholder="Paste customer review here..."
                  className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox"
                  id="testActive"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="testActive" className="text-slate-350 select-none">Approve & Publish on Website</label>
              </div>

              <button 
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
              >
                <Save className="w-4 h-4" />
                <span>{editingId ? 'Save Changes' : 'Approve Testimonial'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
