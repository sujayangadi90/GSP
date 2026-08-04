'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { serviceApi, testimonialApi, inquiryApi, brandApi } from '@/utils/api';
import { MailWarning, Cpu, MessageSquare, Bookmark, ArrowRight, UserCheck } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalInquiries: 0,
    totalServices: 0,
    totalTestimonials: 0,
    totalBrands: 0
  });
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [inqs, servs, tests, brands] = await Promise.all([
          inquiryApi.getInquiries(),
          serviceApi.getServices(),
          testimonialApi.getAllTestimonials(),
          brandApi.getBrands()
        ]);

        setStats({
          totalInquiries: inqs.length,
          totalServices: servs.length,
          totalTestimonials: tests.length,
          totalBrands: brands.length
        });

        // Get 5 most recent inquiries
        setRecentInquiries(inqs.slice(0, 5));
      } catch (err) {
        console.log('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    { name: 'Total Inquiries', count: stats.totalInquiries, icon: MailWarning, color: 'text-amber-400 bg-amber-400/10 border-amber-500/20' },
    { name: 'Active Services', count: stats.totalServices, icon: Cpu, color: 'text-teal-400 bg-teal-400/10 border-teal-500/20' },
    { name: 'Testimonials', count: stats.totalTestimonials, icon: MessageSquare, color: 'text-cyan-400 bg-cyan-400/10 border-cyan-500/20' },
    { name: 'Partner Brands', count: stats.totalBrands, icon: Bookmark, color: 'text-indigo-400 bg-indigo-400/10 border-indigo-500/20' }
  ];

  return (
    <div className="flex flex-col gap-8 text-left">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Executive Dashboard</h1>
        <p className="text-slate-400 text-xs mt-1">GSP Gadag overview, performance metrics, and lead inquiries tracker.</p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx}
              className={`bg-slate-900 border p-6 rounded-2xl flex justify-between items-center ${stat.color.split(' ')[2]}`}
            >
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{stat.name}</span>
                <span className="text-3xl font-extrabold text-white">{stat.count}</span>
              </div>
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${stat.color.split(' ')[0]} ${stat.color.split(' ')[1]}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Inquiries List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex flex-col">
            <h3 className="font-extrabold text-lg text-white">Recent Customer Inquiries</h3>
            <p className="text-xs text-slate-400 mt-0.5">Showing last 5 leads received on the website.</p>
          </div>
          <Link 
            href="/admin/inquiries"
            className="flex items-center gap-1 text-xs text-teal-400 font-bold hover:underline"
          >
            <span>View All Inquiries</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentInquiries.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No inquiries received yet.
          </div>
        ) : (
          <div className="overflow-x-auto text-sm">
            <table className="w-full text-slate-350">
              <thead>
                <tr className="bg-slate-950 text-slate-450 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-4 px-6 text-left">Customer</th>
                  <th className="py-4 px-6 text-left">Mobile</th>
                  <th className="py-4 px-6 text-left">Service Context</th>
                  <th className="py-4 px-6 text-left">Message Snippet</th>
                  <th className="py-4 px-6 text-left">Received At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {recentInquiries.map((inq) => (
                  <tr key={inq._id} className="hover:bg-slate-850/50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center text-[10px] font-bold">
                          {inq.name.charAt(0)}
                        </div>
                        <span className="text-white font-semibold">{inq.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-mono">{inq.mobileNumber}</td>
                    <td className="py-4 px-6">
                      <span className="bg-slate-800 text-teal-400 border border-slate-700 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold">
                        {inq.serviceCategory}
                      </span>
                    </td>
                    <td className="py-4 px-6 truncate max-w-xs">{inq.message}</td>
                    <td className="py-4 px-6 text-slate-400 text-xs">
                      {new Date(inq.createdAt).toLocaleString(undefined, {
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
    </div>
  );
}
