'use client';

import React, { useEffect, useState } from 'react';
import { bannerApi, uploadApi } from '@/utils/api';
import { Plus, Trash, Edit, AlertCircle, X, Save, Upload, Image as ImageIcon } from 'lucide-react';

export default function AdminBannersManager() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState(false);

  // Modal & Form states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    image: '',
    displayOrder: 0,
    status: 'Active'
  });

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${baseUrl}${imagePath}`;
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await bannerApi.getAllBanners();
      setBanners(data);
    } catch (err) {
      triggerAlert('error', err.message || 'Failed to fetch banners.');
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (max 5 MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      triggerAlert('error', 'File size exceeds 5 MB limit.');
      return;
    }

    // Validate formats: JPG, JPEG, PNG, WEBP
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      triggerAlert('error', 'Only JPG, JPEG, PNG, and WEBP formats are allowed.');
      return;
    }

    setUploading(true);
    try {
      const res = await uploadApi.uploadFile(file);
      setForm((prev) => ({ ...prev, image: res.path }));
      triggerAlert('success', 'Banner image uploaded successfully!');
    } catch (err) {
      triggerAlert('error', err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (banner) => {
    setForm({
      title: banner.title,
      image: banner.image || '',
      displayOrder: banner.displayOrder || 0,
      status: banner.status || 'Active'
    });
    setEditingId(banner._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this banner image? Deleted banners will no longer appear on the website.')) return;
    try {
      await bannerApi.deleteBanner(id);
      triggerAlert('success', 'Banner deleted successfully.');
      fetchAll();
    } catch (err) {
      triggerAlert('error', err.message || 'Failed to delete banner.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.image) {
      triggerAlert('error', 'Please upload a banner image.');
      return;
    }

    try {
      if (editingId) {
        await bannerApi.updateBanner(editingId, form);
        triggerAlert('success', 'Banner updated successfully!');
      } else {
        await bannerApi.createBanner(form);
        triggerAlert('success', 'Banner created successfully!');
      }
      setShowModal(false);
      setForm({ title: '', image: '', displayOrder: 0, status: 'Active' });
      setEditingId(null);
      fetchAll();
    } catch (err) {
      triggerAlert('error', err.message || 'Saving banner failed.');
    }
  };

  return (
    <div className="flex flex-col gap-8 text-left text-slate-200">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Homepage Banner Slider</h1>
          <p className="text-slate-400 text-xs mt-1">Manage banner images, ordering, and statuses for the homepage banner slider.</p>
        </div>
        <button 
          onClick={() => { setForm({ title: '', image: '', displayOrder: 0, status: 'Active' }); setEditingId(null); setShowModal(true); }}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-teal-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add Banner</span>
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
        <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-350">
              <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-850 font-bold">
                <tr>
                  <th scope="col" className="px-6 py-4">Image Preview</th>
                  <th scope="col" className="px-6 py-4">Title</th>
                  <th scope="col" className="px-6 py-4">Display Order</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {banners.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500 text-xs">
                      No banner images added yet. Click "Add Banner" to upload one.
                    </td>
                  </tr>
                ) : (
                  banners.map((banner) => (
                    <tr key={banner._id} className="hover:bg-slate-850/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-24 h-10 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center relative">
                          {banner.image ? (
                            <img 
                              src={getImageUrl(banner.image)} 
                              alt={banner.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-slate-650" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-white max-w-[200px] truncate">
                        {banner.title}
                      </td>
                      <td className="px-6 py-4 font-semibold text-teal-400">
                        {banner.displayOrder}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-extrabold uppercase border px-2 py-0.5 rounded ${
                          banner.status === 'Active' 
                            ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' 
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                          {banner.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => handleEdit(banner)}
                            className="p-1.5 rounded-lg bg-slate-850 text-slate-400 hover:text-teal-400 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(banner._id)}
                            className="p-1.5 rounded-lg bg-slate-850 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL WRITER */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-850 p-6 sm:p-8 rounded-3xl max-w-md w-full text-left shadow-2xl flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white">{editingId ? 'Edit Banner' : 'Add Banner'}</h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs font-semibold">
              <div className="flex flex-col gap-1">
                <label className="text-slate-400 uppercase tracking-wider">Banner Title * (Admin reference only, not shown on site)</label>
                <input 
                  type="text" 
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. AC Repair Slide (Reference)"
                  className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 uppercase tracking-wider">Display Order *</label>
                  <input 
                    type="number" 
                    required
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
                    placeholder="e.g. 1"
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 uppercase tracking-wider">Status *</label>
                  <select 
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-400 uppercase tracking-wider">Banner Image * (Recommended: 1900 × 760 px)</label>
                <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <div className="w-20 h-10 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center relative flex-shrink-0">
                    {form.image ? (
                      <img 
                        src={getImageUrl(form.image)} 
                        alt="Banner Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer flex items-center gap-1 w-max">
                      <Upload className="w-3 h-3" />
                      <span>{uploading ? 'Uploading...' : 'Choose Image File'}</span>
                      <input 
                        type="file" 
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    <span className="text-[10px] text-slate-500">JPG, JPEG, PNG, WEBP (Max: 5 MB)</span>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={uploading}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{editingId ? 'Save Changes' : 'Create Banner'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
