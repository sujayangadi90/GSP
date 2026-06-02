'use client';

import React, { useEffect, useState } from 'react';
import { serviceApi, uploadApi } from '@/utils/api';
import { Plus, Trash, Edit, AlertCircle, Settings, Check, X, RefreshCw, Upload, Image as ImageIcon } from 'lucide-react';

export default function AdminServicesManager() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', text: '' });

  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '', isActive: true, order: 0, image: '' });
  const [editingCatId, setEditingCatId] = useState(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const getCategoryImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${baseUrl}${imagePath}`;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadApi.uploadFile(file);
      setCatForm((prev) => ({ ...prev, image: res.path }));
      triggerAlert('success', 'Category image uploaded successfully!');
    } catch (err) {
      triggerAlert('error', err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Form states - Service
  const [servForm, setServForm] = useState({
    category: '', name: '', slug: '', shortDescription: '', detailedDescription: '',
    featuresString: '', benefitsString: '', serviceTypesString: '', isActive: true, image: ''
  });
  const [editingServId, setEditingServId] = useState(null);
  const [showServModal, setShowServModal] = useState(false);

  const handleServiceImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadApi.uploadFile(file);
      setServForm((prev) => ({ ...prev, image: res.path }));
      triggerAlert('success', 'Service image uploaded successfully!');
    } catch (err) {
      triggerAlert('error', err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cats, servs] = await Promise.all([
        serviceApi.getCategories(),
        serviceApi.getServices()
      ]);
      setCategories(cats);
      setServices(servs);
    } catch (err) {
      triggerAlert('error', err.message || 'Failed to fetch catalog.');
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

  // --- CATEGORIES HANDLERS ---

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCatId) {
        await serviceApi.updateCategory(editingCatId, catForm);
        triggerAlert('success', 'Category updated successfully!');
      } else {
        await serviceApi.createCategory(catForm);
        triggerAlert('success', 'Category created successfully!');
      }
      setCatForm({ name: '', slug: '', description: '', isActive: true, order: 0, image: '' });
      setEditingCatId(null);
      setShowCatModal(false);
      fetchAll();
    } catch (err) {
      triggerAlert('error', err.message || 'Category write failed.');
    }
  };

  const handleEditCat = (cat) => {
    setCatForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      isActive: cat.isActive !== false,
      order: cat.order || 0,
      image: cat.image || ''
    });
    setEditingCatId(cat._id);
    setShowCatModal(true);
  };

  const handleDeleteCat = async (id) => {
    if (!confirm('Are you sure you want to delete this category? (It must not contain active services)')) return;
    try {
      await serviceApi.deleteCategory(id);
      triggerAlert('success', 'Category removed.');
      fetchAll();
    } catch (err) {
      triggerAlert('error', err.message || 'Failed to delete category.');
    }
  };

  // --- SERVICES HANDLERS ---

  const handleServSubmit = async (e) => {
    e.preventDefault();
    
    // Parse commas-separated strings into lists
    const features = servForm.featuresString.split('\n').map(f => f.trim()).filter(Boolean);
    const benefits = servForm.benefitsString.split('\n').map(b => b.trim()).filter(Boolean);
    const serviceTypes = servForm.serviceTypesString.split(',').map(s => s.trim()).filter(Boolean);

    const payload = {
      category: servForm.category,
      name: servForm.name,
      slug: servForm.slug,
      image: servForm.image,
      shortDescription: servForm.shortDescription,
      detailedDescription: servForm.detailedDescription,
      features,
      benefits,
      serviceTypes,
      isActive: servForm.isActive
    };

    try {
      if (editingServId) {
        await serviceApi.updateService(editingServId, payload);
        triggerAlert('success', 'Service updated successfully!');
      } else {
        await serviceApi.createService(payload);
        triggerAlert('success', 'Service created successfully!');
      }
      resetServForm();
      setShowServModal(false);
      fetchAll();
    } catch (err) {
      triggerAlert('error', err.message || 'Service write failed.');
    }
  };

  const handleEditServ = (serv) => {
    setServForm({
      category: serv.category ? serv.category._id : '',
      name: serv.name,
      slug: serv.slug,
      image: serv.image || '',
      shortDescription: serv.shortDescription,
      detailedDescription: serv.detailedDescription || '',
      featuresString: (serv.features || []).join('\n'),
      benefitsString: (serv.benefits || []).join('\n'),
      serviceTypesString: (serv.serviceTypes || []).join(', '),
      isActive: serv.isActive !== false
    });
    setEditingServId(serv._id);
    setShowServModal(true);
  };

  const handleDeleteServ = async (id) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await serviceApi.deleteService(id);
      triggerAlert('success', 'Service deleted successfully.');
      fetchAll();
    } catch (err) {
      triggerAlert('error', err.message || 'Failed to delete service.');
    }
  };

  const resetServForm = () => {
    setServForm({
      category: categories[0] ? categories[0]._id : '',
      name: '',
      slug: '',
      image: '',
      shortDescription: '',
      detailedDescription: '',
      featuresString: '',
      benefitsString: '',
      serviceTypesString: 'Installation, Repair, Maintenance',
      isActive: true
    });
    setEditingServId(null);
  };

  return (
    <div className="flex flex-col gap-8 text-left text-slate-200">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Services & Categories</h1>
          <p className="text-slate-400 text-xs mt-1">Add, update, or remove service listings, custom bullet points, and pricing categories.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { resetServForm(); setShowServModal(true); }}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-teal-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service</span>
          </button>
          <button 
            onClick={() => { setCatForm({ name: '', slug: '', description: '', isActive: true, order: 0, image: '' }); setEditingCatId(null); setShowCatModal(true); }}
            className="bg-slate-800 hover:bg-slate-750 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 border border-slate-750 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Categories Grid Panel - Column Left */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-xl flex flex-col gap-6 self-start">
            <h3 className="font-extrabold text-white text-base pb-3 border-b border-slate-800 flex items-center gap-2">
              <Settings className="w-4 h-4 text-teal-400" />
              <span>Service Categories</span>
            </h3>

            {categories.length === 0 ? (
              <p className="text-slate-500 text-xs py-4 text-center">No categories created yet.</p>
            ) : (
              <div className="flex flex-col gap-3.5">
                {categories.map((cat) => (
                  <div 
                    key={cat._id}
                    className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex justify-between items-start hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col gap-1 text-left max-w-[70%]">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white">{cat.name}</span>
                        <span className={`w-2 h-2 rounded-full ${cat.isActive !== false ? 'bg-teal-500' : 'bg-red-500'}`}></span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono select-all">/{cat.slug}</span>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditCat(cat)}
                        className="p-1.5 rounded-lg bg-slate-850 text-slate-400 hover:text-teal-400 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCat(cat._id)}
                        className="p-1.5 rounded-lg bg-slate-850 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Services Listing Panel - Column Right */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-xl flex flex-col gap-6">
            <h3 className="font-extrabold text-white text-base pb-3 border-b border-slate-800 flex items-center gap-2">
              <Settings className="w-4 h-4 text-teal-400 animate-spin-slow" />
              <span>Registered Service Catalog</span>
            </h3>

            {services.length === 0 ? (
              <p className="text-slate-500 text-xs py-8 text-center">No services registered yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((serv) => (
                  <div 
                    key={serv._id}
                    className="bg-slate-950 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col gap-3 text-left">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-extrabold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded uppercase">
                          {serv.category ? serv.category.name : 'Unknown Category'}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${serv.isActive !== false ? 'bg-teal-500' : 'bg-red-500'}`}></span>
                      </div>

                      <h4 className="font-bold text-white text-base">{serv.name}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{serv.shortDescription}</p>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-850 mt-4">
                      <span className="text-[10px] text-slate-500 font-mono">/{serv.slug}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditServ(serv)}
                          className="p-1.5 rounded-lg bg-slate-850 text-slate-400 hover:text-teal-450 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteServ(serv._id)}
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
          </div>

        </div>
      )}

      {/* MODAL 1: CATEGORY WRITER */}
      {showCatModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-850 p-6 sm:p-8 rounded-3xl max-w-md w-full text-left shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white">{editingCatId ? 'Edit Category' : 'Create Category'}</h4>
              <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleCatSubmit} className="flex flex-col gap-4 text-xs font-semibold">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-slate-400 uppercase tracking-wider">Category Name</label>
                  <input 
                    type="text" 
                    required
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    placeholder="e.g. Home Appliances"
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white"
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 uppercase tracking-wider">Sort Order</label>
                  <input 
                    type="number" 
                    required
                    value={catForm.order}
                    onChange={(e) => setCatForm({ ...catForm, order: Number(e.target.value) })}
                    placeholder="e.g. 1"
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-400 uppercase tracking-wider">Slug (lowercase URL slug)</label>
                <input 
                  type="text" 
                  required
                  value={catForm.slug}
                  onChange={(e) => setCatForm({ ...catForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="e.g. home-appliances"
                  className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-400 uppercase tracking-wider">Description</label>
                <textarea 
                  rows={2}
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  placeholder="Summarize this category..."
                  className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-400 uppercase tracking-wider">Category Image (Square)</label>
                <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center relative flex-shrink-0">
                    {catForm.image ? (
                      <img 
                        src={getCategoryImageUrl(catForm.image)} 
                        alt="Category Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer flex items-center gap-1 w-max">
                      <Upload className="w-3 h-3" />
                      <span>{uploading ? 'Uploading...' : 'Choose Square Image'}</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    <span className="text-[10px] text-slate-500">JPG, PNG (Recommended: 1:1 Aspect Ratio)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox"
                  id="catActive"
                  checked={catForm.isActive}
                  onChange={(e) => setCatForm({ ...catForm, isActive: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="catActive" className="text-slate-350 select-none">Active / Show on Website</label>
              </div>

              <button 
                type="submit"
                disabled={uploading}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4 disabled:opacity-50"
              >
                <span>{editingCatId ? 'Save Changes' : 'Create Category'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SERVICE WRITER */}
      {showServModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-850 p-6 sm:p-8 rounded-3xl max-w-lg w-full text-left shadow-2xl flex flex-col gap-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white">{editingServId ? 'Edit Service' : 'Add Service'}</h4>
              <button onClick={() => setShowServModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleServSubmit} className="flex flex-col gap-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 uppercase tracking-wider">Associated Category</label>
                  <select 
                    value={servForm.category}
                    onChange={(e) => setServForm({ ...servForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold"
                  >
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 uppercase tracking-wider">Service Name</label>
                  <input 
                    type="text" 
                    required
                    value={servForm.name}
                    onChange={(e) => setServForm({ ...servForm, name: e.target.value })}
                    placeholder="e.g. Air Conditioner (AC)"
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 uppercase tracking-wider">URL Slug (lowercase)</label>
                  <input 
                    type="text" 
                    required
                    value={servForm.slug}
                    onChange={(e) => setServForm({ ...servForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="e.g. ac-service"
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 uppercase tracking-wider">Service Types (comma list)</label>
                  <input 
                    type="text" 
                    required
                    value={servForm.serviceTypesString}
                    onChange={(e) => setServForm({ ...servForm, serviceTypesString: e.target.value })}
                    placeholder="Installation, Repair, Maintenance"
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-400 uppercase tracking-wider">Short Description (shown in catalog grid)</label>
                <input 
                  type="text" 
                  required
                  value={servForm.shortDescription}
                  onChange={(e) => setServForm({ ...servForm, shortDescription: e.target.value })}
                  placeholder="Premium cooling AC repair, gas charging and installations."
                  className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-400 uppercase tracking-wider">Detailed Overview (for service page)</label>
                <textarea 
                  rows={3}
                  value={servForm.detailedDescription}
                  onChange={(e) => setServForm({ ...servForm, detailedDescription: e.target.value })}
                  placeholder="Provide deep overview copy for this service listing..."
                  className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 uppercase tracking-wider">Technical Highlights (1 per line)</label>
                  <textarea 
                    rows={3}
                    value={servForm.featuresString}
                    onChange={(e) => setServForm({ ...servForm, featuresString: e.target.value })}
                    placeholder="e.g. Jet deep foam wash&#10;Inverter PCB diagnostic"
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 uppercase tracking-wider">Advantages (1 per line)</label>
                  <textarea 
                    rows={3}
                    value={servForm.benefitsString}
                    onChange={(e) => setServForm({ ...servForm, benefitsString: e.target.value })}
                    placeholder="e.g. Lower power draws&#10;30-day warranty guarantee"
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-400 uppercase tracking-wider">Service Image (Square)</label>
                <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center relative flex-shrink-0">
                    {servForm.image ? (
                      <img 
                        src={getCategoryImageUrl(servForm.image)} 
                        alt="Service Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer flex items-center gap-1 w-max">
                      <Upload className="w-3 h-3" />
                      <span>{uploading ? 'Uploading...' : 'Choose Square Image'}</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleServiceImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    <span className="text-[10px] text-slate-500">JPG, PNG (Recommended: 1:1 Aspect Ratio)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox"
                  id="servActive"
                  checked={servForm.isActive}
                  onChange={(e) => setServForm({ ...servForm, isActive: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="servActive" className="text-slate-350 select-none">Active / Show in List</label>
              </div>

              <button 
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
              >
                <span>{editingServId ? 'Save Changes' : 'Add Service'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
