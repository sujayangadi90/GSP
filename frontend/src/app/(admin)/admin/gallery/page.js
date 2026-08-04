'use client';

import React, { useEffect, useState } from 'react';
import { galleryApi, uploadApi } from '@/utils/api';
import { Plus, Trash, Edit, AlertCircle, X, Save, Upload, Image as ImageIcon } from 'lucide-react';

export default function AdminGalleryManager() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState(false);
  const [ratioWarning, setRatioWarning] = useState('');

  // Modal & Form states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
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
      const data = await galleryApi.getAllGalleryImages();
      setGalleryItems(data);
    } catch (err) {
      triggerAlert('error', err.message || 'Failed to fetch gallery images.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const triggerAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert({ type: '', text: '' }), 6000);
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

    // Client-side image ratio validation
    setRatioWarning('');
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    img.onload = () => {
      if (img.width !== img.height) {
        setRatioWarning(
          'Recommendation: The uploaded image is not a square (1:1 aspect ratio). For best display results, we recommend uploading square images (e.g., 1000 x 1000 px).'
        );
      } else {
        setRatioWarning('');
      }
      URL.revokeObjectURL(objectUrl);
    };

    setUploading(true);
    try {
      const res = await uploadApi.uploadFile(file);
      setForm((prev) => ({ ...prev, image: res.path }));
      triggerAlert('success', 'Image uploaded successfully!');
    } catch (err) {
      triggerAlert('error', err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (item) => {
    setForm({
      image: item.image || '',
      displayOrder: item.displayOrder || 0,
      status: item.status || 'Active'
    });
    setRatioWarning('');
    setEditingId(item._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this gallery image?')) return;
    try {
      await galleryApi.deleteGalleryImage(id);
      triggerAlert('success', 'Gallery image deleted successfully.');
      fetchAll();
    } catch (err) {
      triggerAlert('error', err.message || 'Failed to delete gallery image.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.image) {
      triggerAlert('error', 'Please upload a gallery image.');
      return;
    }

    if (form.displayOrder === undefined || form.displayOrder === '' || isNaN(Number(form.displayOrder))) {
      triggerAlert('error', 'Display Order is mandatory and must be numeric.');
      return;
    }

    try {
      if (editingId) {
        await galleryApi.updateGalleryImage(editingId, { ...form, displayOrder: Number(form.displayOrder) });
        triggerAlert('success', 'Gallery image updated successfully!');
      } else {
        await galleryApi.createGalleryImage({ ...form, displayOrder: Number(form.displayOrder) });
        triggerAlert('success', 'Gallery image created successfully!');
      }
      setShowModal(false);
      setForm({ image: '', displayOrder: 0, status: 'Active' });
      setEditingId(null);
      setRatioWarning('');
      fetchAll();
    } catch (err) {
      triggerAlert('error', err.message || 'Saving gallery image failed.');
    }
  };

  return (
    <div className="flex flex-col gap-8 text-left text-slate-200">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Gallery Module</h1>
          <p className="text-slate-400 text-xs mt-1">Manage public gallery images, custom display order, and status settings.</p>
        </div>
        <button 
          onClick={() => { setForm({ image: '', displayOrder: 0, status: 'Active' }); setEditingId(null); setRatioWarning(''); setShowModal(true); }}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-teal-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add Gallery Image</span>
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
                  <th scope="col" className="px-6 py-4">Display Order</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {galleryItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500 text-xs">
                      No gallery images added yet. Click "Add Gallery Image" to upload one.
                    </td>
                  </tr>
                ) : (
                  galleryItems.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-850/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-16 h-16 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center relative">
                          {item.image ? (
                            <img 
                              src={getImageUrl(item.image)} 
                              alt="Gallery Preview" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-650" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-teal-400">
                        {item.displayOrder}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-extrabold uppercase border px-2 py-0.5 rounded ${
                          item.status === 'Active' 
                            ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' 
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => handleEdit(item)}
                            className="p-1.5 rounded-lg bg-slate-850 text-slate-400 hover:text-teal-400 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item._id)}
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
              <h4 className="font-bold text-white">{editingId ? 'Edit Gallery Image' : 'Add Gallery Image'}</h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400 uppercase tracking-wider">Display Order *</label>
                  <input 
                    type="number" 
                    required
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
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
                <label className="text-slate-400 uppercase tracking-wider">Gallery Image * (Recommended: 1000 × 1000 px Square)</label>
                <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <div className="w-16 h-16 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center relative flex-shrink-0">
                    {form.image ? (
                      <img 
                        src={getImageUrl(form.image)} 
                        alt="Gallery Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-650" />
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
                {ratioWarning && (
                  <div className="text-[10px] text-amber-400 mt-2 bg-amber-400/10 border border-amber-500/20 p-2.5 rounded-lg flex items-start gap-1.5 leading-relaxed font-medium">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{ratioWarning}</span>
                  </div>
                )}
              </div>

              <button 
                type="submit"
                disabled={uploading}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{editingId ? 'Save Changes' : 'Create Gallery Image'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
