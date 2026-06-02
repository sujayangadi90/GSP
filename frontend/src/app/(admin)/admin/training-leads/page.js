'use client';

import React, { useEffect, useState } from 'react';
import { trainingApi } from '@/utils/api';
import { GraduationCap, Search, Calendar, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

export default function AdminTrainingLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', text: '' });

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Filter states
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLeads = async (pageNum = page) => {
    setLoading(true);
    try {
      const params = {
        page: pageNum,
        limit
      };
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await trainingApi.getLeads(params);
      setLeads(data.leads || []);
      setTotalPages(data.totalPages || 1);
      setTotalLeads(data.totalLeads || 0);
      setPage(data.currentPage || 1);
    } catch (err) {
      setAlert({ type: 'error', text: err.message || 'Failed to load training leads list.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(1); // Reset to page 1 on date changes
  }, [startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeads(1); // Reset to page 1 for new search
  };

  const handleClearFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setTimeout(() => fetchLeads(1), 50);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchLeads(newPage);
  };

  return (
    <div className="flex flex-col gap-8 text-left text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-teal-400" />
            <span>Training Center Leads</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">Review student registrations and lead collections from Meta advertising campaigns.</p>
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

      {/* Filters bar */}
      <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-xl flex flex-col gap-4 text-xs font-semibold">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          
          {/* Search box */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-slate-400 uppercase tracking-wider">Search Keyword</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, city..."
                className="w-full bg-slate-950 border border-slate-850 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-teal-500 text-white font-semibold placeholder:text-slate-600"
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
            onClick={() => fetchLeads(1)}
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
          <div className="min-h-[30vh] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No training leads found matching your search filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-slate-350">
              <thead>
                <tr className="bg-slate-950 text-slate-450 border-b border-slate-850 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-4 px-6 text-left">Lead ID</th>
                  <th className="py-4 px-6 text-left">Student Name</th>
                  <th className="py-4 px-6 text-left">Phone Number</th>
                  <th className="py-4 px-6 text-left">City Location</th>
                  <th className="py-4 px-6 text-left">Submitted Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-slate-850/40">
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">
                      {lead._id}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center text-[10px] font-bold">
                          {lead.name.charAt(0)}
                        </div>
                        <span className="text-white font-semibold">{lead.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-mono">{lead.phone}</td>
                    <td className="py-4 px-6">
                      <span className="flex items-center gap-1 text-slate-400">
                        <MapPin className="w-3 h-3 text-teal-400" />
                        <span>{lead.city}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-xs font-mono">
                      {new Date(lead.createdAt).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-400">
            Showing Page <span className="text-white">{page}</span> of <span className="text-white">{totalPages}</span> ({totalLeads} total leads)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
