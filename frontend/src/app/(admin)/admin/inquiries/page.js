'use client';

import React, { useEffect, useState } from 'react';
import { inquiryApi } from '@/utils/api';
import { MailWarning, Search, Calendar, Download, Trash, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', text: '' });

  // Filter states
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await inquiryApi.getInquiries(params);
      setInquiries(data);
    } catch (err) {
      setAlert({ type: 'error', text: err.message || 'Failed to load inquiries list.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [startDate, endDate]); // Trigger re-fetch automatically on date filter change

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInquiries();
  };

  const handleExport = async () => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      await inquiryApi.exportInquiries(params);
      setAlert({ type: 'success', text: 'Inquiries exported successfully as CSV!' });
      setTimeout(() => setAlert({ type: '', text: '' }), 4000);
    } catch (err) {
      setAlert({ type: 'error', text: 'CSV export failed.' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this inquiry record?')) return;
    try {
      await inquiryApi.deleteInquiry(id);
      setAlert({ type: 'success', text: 'Inquiry removed.' });
      setTimeout(() => setAlert({ type: '', text: '' }), 4000);
      fetchInquiries();
    } catch (err) {
      setAlert({ type: 'error', text: 'Delete failed.' });
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    // For immediate reload
    setTimeout(() => fetchInquiries(), 50);
  };

  return (
    <div className="flex flex-col gap-8 text-left text-slate-200">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Customer Inquiries</h1>
          <p className="text-slate-400 text-xs mt-1">Review call-backs, filter by service categories, and download database worksheets.</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-slate-800 hover:bg-slate-750 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 border border-slate-750 cursor-pointer shadow-lg shadow-black/10 self-start"
        >
          <Download className="w-4 h-4" />
          <span>Export Excel/CSV</span>
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

      {/* Filters bar */}
      <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-xl flex flex-col gap-4 text-xs font-semibold">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          
          {/* Search box */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-slate-400 uppercase tracking-wider">Search Keyword</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-550 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, email, message..."
                className="w-full bg-slate-950 border border-slate-850 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold placeholder:text-slate-650"
              />
            </div>
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span>Start Date</span>
            </label>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>End Date</span>
            </label>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold"
            />
          </div>
        </form>

        {/* Buttons row */}
        <div className="flex justify-between items-center pt-2">
          <button 
            onClick={handleClearFilters}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            Clear All Filters
          </button>
          
          <button 
            onClick={fetchInquiries}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer flex items-center gap-1 shadow-md shadow-teal-500/10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Apply Search</span>
          </button>
        </div>
      </div>

      {/* Main Table view */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl text-sm">
        {loading ? (
          <div className="min-h-[25vh] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No inquiries match the current search filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-slate-350">
              <thead>
                <tr className="bg-slate-950 text-slate-450 border-b border-slate-850 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-4 px-6 text-left">Customer</th>
                  <th className="py-4 px-6 text-left">Mobile</th>
                  <th className="py-4 px-6 text-left">Email</th>
                  <th className="py-4 px-6 text-left">Context Topic</th>
                  <th className="py-4 px-6 text-left">Inquiry Message</th>
                  <th className="py-4 px-6 text-left">Submitted</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {inquiries.map((inq) => (
                  <tr key={inq._id} className="hover:bg-slate-850/40">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center text-[10px] font-bold">
                          {inq.name.charAt(0)}
                        </div>
                        <span className="text-white font-semibold">{inq.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-mono">{inq.mobileNumber}</td>
                    <td className="py-4 px-6 text-slate-400">{inq.emailAddress || '—'}</td>
                    <td className="py-4 px-6">
                      <span className="bg-slate-800 text-teal-400 border border-slate-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold whitespace-nowrap">
                        {inq.serviceCategory}
                      </span>
                    </td>
                    <td className="py-4 px-6 max-w-xs truncate" title={inq.message}>{inq.message}</td>
                    <td className="py-4 px-6 text-slate-400 text-xs">
                      {new Date(inq.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button 
                        onClick={() => handleDelete(inq._id)}
                        className="p-1.5 rounded bg-slate-850 hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete Lead"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
