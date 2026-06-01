'use client';

import React, { useEffect, useState } from 'react';
import { brandApi, serviceApi } from '@/utils/api';
import { Plus, Trash, Edit, AlertCircle, Bookmark, X, Save } from 'lucide-react';

export default function AdminBrandsManager() {
  const [brands, setBrands] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', text: '' });

  // Modal & Form states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    associatedServicesString: '' // comma list
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [brandData, servData] = await Promise.all([
        brandApi.getBrands(),
        serviceApi.getServices()
      ]);
      setBrands(brandData);
      setServices(servData);
    } catch (err) {
      triggerAlert('error', err.message || 'Failed to fetch brands.');
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

  const handleEdit = (brand) => {
    setForm({
      name: brand.name,
      description: brand.description || '',
      associatedServicesString: (brand.associatedServices || []).join(', ')
    });
    setEditingId(brand._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this brand logo?')) return;
    try {
      await brandApi.deleteBrand(id);
      triggerAlert('success', 'Brand removed.');
      fetchAll();
    } catch (err) {
      triggerAlert('error', err.message || 'Delete brand failed.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const associatedServices = form.associatedServicesString
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      name: form.name,
      description: form.description,
      associatedServices,
      logo: '/brands/generic.png' // Default placeholder brand logo
    };

    try {
      if (editingId) {
        await brandApi.updateBrand(editingId, payload);
        triggerAlert('success', 'Brand updated successfully!');
      } else {
        await brandApi.createBrand(payload);
        triggerAlert('success', 'Brand registered successfully!');
      }
      setShowModal(false);
      setForm({ name: '', description: '', associatedServicesString: '' });
      setEditingId(null);
      fetchAll();
    } catch (err) {
      triggerAlert('error', err.message || 'Brand write failed.');
    }
  };

  return (
    <div className="flex flex-col gap-8 text-left text-slate-200">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Partner Brands</h1>
          <p className="text-slate-400 text-xs mt-1">Manage brand logos and link them to respective appliances repair services.</p>
        </div>
        <button 
          onClick={() => { setForm({ name: '', description: '', associatedServicesString: '' }); setEditingId(null); setShowModal(true); }}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-teal-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add Brand</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <div 
              key={brand._id}
              className="bg-slate-900 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between gap-5 hover:border-slate-800 transition-all text-left"
            >
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-teal-400" />
                    <span className="font-extrabold text-white text-lg">{brand.name}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => handleEdit(brand)}
                      className="p-1.5 rounded-lg bg-slate-850 text-slate-400 hover:text-teal-400 transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(brand._id)}
                      className="p-1.5 rounded-lg bg-slate-850 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{brand.description || 'No description provided.'}</p>
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
              <h4 className="font-bold text-white">{editingId ? 'Edit Brand' : 'Register Brand'}</h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs font-semibold">
              <div className="flex flex-col gap-1">
                <label className="text-slate-400 uppercase tracking-wider">Brand / Manufacturer Name</label>
                <input 
                  type="text" 
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Panasonic"
                  className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white"
                />
              </div>


              <button 
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
              >
                <Save className="w-4 h-4" />
                <span>{editingId ? 'Save Changes' : 'Register Brand'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
