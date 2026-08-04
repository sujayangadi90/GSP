import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Wrench, 
  Ticket as TicketIcon, 
  LogOut, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  UserCheck, 
  Check, 
  X,
  TrendingUp,
  MapPin,
  ClipboardList
} from 'lucide-react';

const API_BASE = '/api';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gsp_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [token, setToken] = useState(() => localStorage.getItem('gsp_token') || '');
  
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, dealers, technicians, tickets
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // States for lists
  const [dealers, setDealers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0, new: 0, assigned: 0, pending: 0, closed: 0
  });

  // Modals & Forms
  const [dealerForm, setDealerForm] = useState(null); // null or { id?, name, contactPerson, mobile, email, address, city, password }
  const [techForm, setTechForm] = useState(null); // null or { id?, name, mobile, email, password }
  const [selectedTicket, setSelectedTicket] = useState(null); // null or ticket details object
  const [assignTechId, setAssignTechId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [verificationForm, setVerificationForm] = useState({ status: 'approved', reason: '' });
  const [closureRemarks, setClosureRemarks] = useState('');

  // Filters & Searches
  const [dealerSearch, setDealerSearch] = useState('');
  const [techSearch, setTechSearch] = useState('');
  const [ticketFilters, setTicketFilters] = useState({
    status: '',
    type: '',
    city: '',
    search: ''
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('gsp_token', token);
    } else {
      localStorage.removeItem('gsp_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('gsp_user', JSON.stringify(user));
      fetchData();
    } else {
      localStorage.removeItem('gsp_user');
    }
  }, [user]);

  const apiFetch = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (res.status === 401 || res.status === 403) {
      handleLogout();
      throw new Error('Session expired');
    }
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Something went wrong');
    }
    return res.json();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm)
      });
      if (data.role !== 'admin') {
        throw new Error('Access denied. Admin portal only.');
      }
      setToken(data.token);
      setUser(data);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('gsp_user');
    localStorage.removeItem('gsp_token');
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // Load dealers, technicians, and tickets
      const dealersData = await apiFetch(`/dealers?search=${dealerSearch}`);
      const techsData = await apiFetch(`/technicians?search=${techSearch}`);
      const ticketsData = await apiFetch(`/tickets?status=${ticketFilters.status}&type=${ticketFilters.type}&city=${ticketFilters.city}&search=${ticketFilters.search}`);

      setDealers(dealersData);
      setTechnicians(techsData);
      setTickets(ticketsData);

      // Compute statistics based on loaded tickets
      const newStats = { total: ticketsData.length, new: 0, assigned: 0, pending: 0, closed: 0 };
      ticketsData.forEach(t => {
        if (t.status === 'new') newStats.new++;
        else if (t.status === 'assigned') newStats.assigned++;
        else if (t.status === 'in_progress' || t.status === 'verification_pending' || t.status === 'completed') newStats.pending++;
        else if (t.status === 'closed') newStats.closed++;
      });
      setStats(newStats);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run searches / filters trigger reload
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [dealerSearch, techSearch, ticketFilters, activeTab]);

  // Dealer actions
  const saveDealer = async (e) => {
    e.preventDefault();
    try {
      if (dealerForm.id) {
        await apiFetch(`/dealers/${dealerForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(dealerForm)
        });
      } else {
        await apiFetch('/dealers', {
          method: 'POST',
          body: JSON.stringify(dealerForm)
        });
      }
      setDealerForm(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleDealer = async (id) => {
    try {
      await apiFetch(`/dealers/${id}/toggle`, { method: 'PATCH' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Tech actions
  const saveTech = async (e) => {
    e.preventDefault();
    try {
      if (techForm.id) {
        await apiFetch(`/technicians/${techForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(techForm)
        });
      } else {
        await apiFetch('/technicians', {
          method: 'POST',
          body: JSON.stringify(techForm)
        });
      }
      setTechForm(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleTech = async (id) => {
    try {
      await apiFetch(`/technicians/${id}/toggle`, { method: 'PATCH' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Ticket assignments
  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignTechId) return alert('Select a technician');
    try {
      const updated = await apiFetch(`/tickets/${selectedTicket._id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ technicianId: assignTechId, assignmentNotes: assignNotes })
      });
      setSelectedTicket(updated);
      setAssignNotes('');
      setAssignTechId('');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const updated = await apiFetch(`/tickets/${selectedTicket._id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ approvalStatus: verificationForm.status, reason: verificationForm.reason })
      });
      setSelectedTicket(updated);
      setVerificationForm({ status: 'approved', reason: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClose = async (e) => {
    e.preventDefault();
    try {
      const updated = await apiFetch(`/tickets/${selectedTicket._id}/close`, {
        method: 'PATCH',
        body: JSON.stringify({ closingRemarks: closureRemarks })
      });
      setSelectedTicket(updated);
      setClosureRemarks('');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8 bg-linear-to-r from-violet-600 to-indigo-700 text-center">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">GSP Admin</h1>
            <p className="text-violet-200 mt-2 font-medium">Service Management System</p>
          </div>
          <div className="p-8">
            {loginError && (
              <div className="mb-4 bg-red-900/50 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Username / Email</label>
                <input
                  type="text"
                  required
                  placeholder="admin@gsp.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transition duration-200 disabled:opacity-55 cursor-pointer"
              >
                {loading ? 'Logging in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-linear-to-tr from-violet-600 to-indigo-600 p-2 rounded-xl">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">GSP Admin Hub</h2>
            <p className="text-xs text-slate-400 font-medium">Global Service Point</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-200">{user.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-slate-800 hover:bg-red-900/40 hover:text-red-300 border border-slate-700 hover:border-red-700/50 px-4 py-2 rounded-xl text-sm font-medium transition duration-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Sidebar Nav */}
        <aside className="w-full lg:w-64 bg-slate-900/50 border-r border-slate-800 p-4 space-y-2 lg:min-h-[calc(100vh-73px)]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${activeTab === 'dashboard' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${activeTab === 'tickets' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <TicketIcon className="w-5 h-5" />
            Tickets & Requests
          </button>
          <button
            onClick={() => setActiveTab('dealers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${activeTab === 'dealers' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Users className="w-5 h-5" />
            Manage Dealers
          </button>
          <button
            onClick={() => setActiveTab('technicians')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${activeTab === 'technicians' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Wrench className="w-5 h-5" />
            Manage Technicians
          </button>
        </aside>

        {/* Dashboard / Workspace Area */}
        <main className="flex-1 p-6 lg:p-8 space-y-8 bg-slate-950">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Overview Dashboard</h1>
                <p className="text-slate-400 mt-1">Real-time statistics of service operations</p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between shadow-lg">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Requests</span>
                  <span className="text-3xl font-black text-white mt-2">{stats.total}</span>
                </div>
                <div className="bg-blue-950/20 border border-blue-900/40 p-5 rounded-2xl flex flex-col justify-between shadow-lg">
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">New Requests</span>
                  <span className="text-3xl font-black text-blue-400 mt-2">{stats.new}</span>
                </div>
                <div className="bg-amber-950/20 border border-amber-900/40 p-5 rounded-2xl flex flex-col justify-between shadow-lg">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Assigned</span>
                  <span className="text-3xl font-black text-amber-400 mt-2">{stats.assigned}</span>
                </div>
                <div className="bg-purple-950/20 border border-purple-900/40 p-5 rounded-2xl flex flex-col justify-between shadow-lg">
                  <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Pending/Action</span>
                  <span className="text-3xl font-black text-purple-400 mt-2">{stats.pending}</span>
                </div>
                <div className="bg-emerald-950/20 border border-emerald-900/40 p-5 rounded-2xl flex flex-col justify-between shadow-lg">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Closed</span>
                  <span className="text-3xl font-black text-emerald-400 mt-2">{stats.closed}</span>
                </div>
              </div>

              {/* Quick Actions / Recent activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pending Verification list */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-purple-400" />
                      Pending Work Verifications
                    </h3>
                    <span className="bg-purple-900/50 text-purple-200 text-xs px-2.5 py-1 rounded-full font-bold">
                      {tickets.filter(t => t.status === 'verification_pending').length} Action Required
                    </span>
                  </div>
                  <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto">
                    {tickets.filter(t => t.status === 'verification_pending').length === 0 ? (
                      <p className="text-slate-500 py-6 text-center text-sm font-medium">No pending work verifications</p>
                    ) : (
                      tickets.filter(t => t.status === 'verification_pending').map(ticket => (
                        <div key={ticket._id} className="py-4 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-xl transition duration-150">
                          <div>
                            <p className="text-sm font-bold text-white">{ticket.ticketNumber} • {ticket.customer.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Technician: {ticket.assignedTechnician?.name || 'N/A'}</p>
                          </div>
                          <button 
                            onClick={() => setSelectedTicket(ticket)}
                            className="bg-violet-600 hover:bg-violet-500 px-3 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer"
                          >
                            Verify Work
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* New Tickets pending assignment */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-400" />
                      New Unassigned Tickets
                    </h3>
                    <span className="bg-blue-900/50 text-blue-200 text-xs px-2.5 py-1 rounded-full font-bold">
                      {tickets.filter(t => t.status === 'new').length} Unassigned
                    </span>
                  </div>
                  <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto">
                    {tickets.filter(t => t.status === 'new').length === 0 ? (
                      <p className="text-slate-500 py-6 text-center text-sm font-medium">No unassigned tickets</p>
                    ) : (
                      tickets.filter(t => t.status === 'new').map(ticket => (
                        <div key={ticket._id} className="py-4 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-xl transition duration-150">
                          <div>
                            <p className="text-sm font-bold text-white">{ticket.ticketNumber} • {ticket.customer.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{ticket.customer.city} • {ticket.type}</p>
                          </div>
                          <button 
                            onClick={() => setSelectedTicket(ticket)}
                            className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer"
                          >
                            Assign Tech
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">Installation & Service Requests</h1>
                  <p className="text-slate-400 mt-1">Manage, assign, and track customer support tickets</p>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Search</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input 
                      type="text" 
                      placeholder="Ticket #, Customer, Product..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                      value={ticketFilters.search}
                      onChange={(e) => setTicketFilters({ ...ticketFilters, search: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                  <select 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
                    value={ticketFilters.status}
                    onChange={(e) => setTicketFilters({ ...ticketFilters, status: e.target.value })}
                  >
                    <option value="">All Statuses</option>
                    <option value="new">New</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">Work In Progress</option>
                    <option value="verification_pending">Verification Pending</option>
                    <option value="completed">Completed (Pending Close)</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Request Type</label>
                  <select 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
                    value={ticketFilters.type}
                    onChange={(e) => setTicketFilters({ ...ticketFilters, type: e.target.value })}
                  >
                    <option value="">All Types</option>
                    <option value="installation">Installation</option>
                    <option value="service">Service Request</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">City</label>
                  <input 
                    type="text" 
                    placeholder="Enter city..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                    value={ticketFilters.city}
                    onChange={(e) => setTicketFilters({ ...ticketFilters, city: e.target.value })}
                  />
                </div>
              </div>

              {/* Tickets Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-800/40 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Ticket Info</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Dealer</th>
                        <th className="px-6 py-4">Technician</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-sm">
                      {tickets.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-8 text-slate-500 font-medium">No tickets found matches current filters</td>
                        </tr>
                      ) : (
                        tickets.map(ticket => (
                          <tr key={ticket._id} className="hover:bg-slate-800/35 transition duration-150">
                            <td className="px-6 py-4">
                              <span className="font-bold text-white">{ticket.ticketNumber}</span>
                              <p className="text-xs text-slate-500 mt-1">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-200">{ticket.customer.name}</p>
                              <p className="text-xs text-slate-400">{ticket.customer.city}</p>
                            </td>
                            <td className="px-6 py-4 capitalize text-slate-300">
                              {ticket.type}
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-medium text-slate-300">{ticket.dealer?.name || 'N/A'}</p>
                              <p className="text-xs text-slate-500">{ticket.dealer?.code || 'N/A'}</p>
                            </td>
                            <td className="px-6 py-4">
                              {ticket.assignedTechnician ? (
                                <>
                                  <p className="font-medium text-slate-300">{ticket.assignedTechnician.name}</p>
                                  <p className="text-xs text-slate-500">{ticket.assignedTechnician.code}</p>
                                </>
                              ) : (
                                <span className="text-red-400 font-semibold text-xs flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  Unassigned
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                ticket.status === 'new' ? 'bg-blue-900/50 text-blue-300 border border-blue-700/30' :
                                ticket.status === 'assigned' ? 'bg-amber-900/50 text-amber-300 border border-amber-700/30' :
                                ticket.status === 'in_progress' ? 'bg-orange-900/50 text-orange-300 border border-orange-700/30' :
                                ticket.status === 'verification_pending' ? 'bg-purple-900/50 text-purple-300 border border-purple-700/30' :
                                ticket.status === 'completed' ? 'bg-green-900/50 text-green-300 border border-green-700/30' :
                                'bg-slate-800 text-slate-400'
                              }`}>
                                {ticket.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => setSelectedTicket(ticket)}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition duration-150 cursor-pointer"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Dealers Tab */}
          {activeTab === 'dealers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">Dealer Directory</h1>
                  <p className="text-slate-400 mt-1">Manage retail partner credentials and details</p>
                </div>
                <button
                  onClick={() => setDealerForm({ name: '', contactPerson: '', mobile: '', email: '', address: '', city: '', password: '' })}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-violet-600/20 text-sm flex items-center gap-2 cursor-pointer transition duration-150"
                >
                  <Plus className="w-4 h-4" />
                  Add Dealer
                </button>
              </div>

              {/* Search */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
                <Search className="w-5 h-5 text-slate-500 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search dealers by name, code, city, email..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={dealerSearch}
                  onChange={(e) => setDealerSearch(e.target.value)}
                />
              </div>

              {/* Dealers List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dealers.map(dealer => (
                  <div key={dealer._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative hover:shadow-2xl transition duration-200">
                    <span className="absolute top-6 right-6 bg-slate-800 text-slate-300 font-bold text-xs px-2.5 py-1 rounded-lg">
                      {dealer.code}
                    </span>
                    <h3 className="text-lg font-bold text-white pr-20">{dealer.name}</h3>
                    <p className="text-sm text-slate-400 mt-1">{dealer.contactPerson} (Contact)</p>
                    
                    <div className="mt-4 space-y-2 text-sm text-slate-300">
                      <p className="flex items-center gap-2">
                        <span className="text-slate-500">Mob:</span> {dealer.mobile}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="text-slate-500">Email:</span> {dealer.email}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="text-slate-500">City:</span> {dealer.city}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
                      <button
                        onClick={() => setDealerForm({ 
                          id: dealer._id, 
                          name: dealer.name, 
                          contactPerson: dealer.contactPerson, 
                          mobile: dealer.mobile, 
                          email: dealer.email, 
                          address: dealer.address, 
                          city: dealer.city, 
                          password: '' 
                        })}
                        className="text-xs text-violet-400 hover:text-violet-300 font-bold cursor-pointer"
                      >
                        Edit Details
                      </button>
                      <button
                        onClick={() => toggleDealer(dealer._id)}
                        className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                          dealer.status === 'active' 
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-700/35 hover:bg-emerald-900/20' 
                          : 'bg-red-950/40 text-red-400 border border-red-700/35 hover:bg-red-900/20'
                        }`}
                      >
                        {dealer.status === 'active' ? 'Active' : 'Disabled'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technicians Tab */}
          {activeTab === 'technicians' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">Technician Team</h1>
                  <p className="text-slate-400 mt-1">Manage field service technicians and activations</p>
                </div>
                <button
                  onClick={() => setTechForm({ name: '', mobile: '', email: '', password: '' })}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-violet-600/20 text-sm flex items-center gap-2 cursor-pointer transition duration-150"
                >
                  <Plus className="w-4 h-4" />
                  Add Technician
                </button>
              </div>

              {/* Search */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
                <Search className="w-5 h-5 text-slate-500 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search technicians by name, code, email..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={techSearch}
                  onChange={(e) => setTechSearch(e.target.value)}
                />
              </div>

              {/* Technicians List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {technicians.map(tech => (
                  <div key={tech._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative hover:shadow-2xl transition duration-200">
                    <span className="absolute top-6 right-6 bg-slate-800 text-slate-300 font-bold text-xs px-2.5 py-1 rounded-lg">
                      {tech.code}
                    </span>
                    <h3 className="text-lg font-bold text-white pr-20">{tech.name}</h3>
                    
                    <div className="mt-4 space-y-2 text-sm text-slate-300">
                      <p className="flex items-center gap-2">
                        <span className="text-slate-500">Mob:</span> {tech.mobile}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="text-slate-500">Email:</span> {tech.email}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
                      <button
                        onClick={() => setTechForm({ 
                          id: tech._id, 
                          name: tech.name, 
                          mobile: tech.mobile, 
                          email: tech.email, 
                          password: '' 
                        })}
                        className="text-xs text-violet-400 hover:text-violet-300 font-bold cursor-pointer"
                      >
                        Edit Details
                      </button>
                      <button
                        onClick={() => toggleTech(tech._id)}
                        className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                          tech.status === 'active' 
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-700/35 hover:bg-emerald-900/20' 
                          : 'bg-red-950/40 text-red-400 border border-red-700/35 hover:bg-red-900/20'
                        }`}
                      >
                        {tech.status === 'active' ? 'Active' : 'Disabled'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Dealer Creation/Edit Modal */}
      {dealerForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <h3 className="font-bold text-white">{dealerForm.id ? 'Edit Dealer Details' : 'Register New Dealer'}</h3>
              <button onClick={() => setDealerForm(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveDealer} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Dealer Name</label>
                  <input required type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" value={dealerForm.name} onChange={e => setDealerForm({...dealerForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Person</label>
                  <input required type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" value={dealerForm.contactPerson} onChange={e => setDealerForm({...dealerForm, contactPerson: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mobile Number</label>
                  <input required type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" value={dealerForm.mobile} onChange={e => setDealerForm({...dealerForm, mobile: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Email (Username)</label>
                  <input required type="email" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" value={dealerForm.email} onChange={e => setDealerForm({...dealerForm, email: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Address</label>
                <input required type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" value={dealerForm.address} onChange={e => setDealerForm({...dealerForm, address: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">City</label>
                  <input required type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" value={dealerForm.city} onChange={e => setDealerForm({...dealerForm, city: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
                  <input type="text" placeholder={dealerForm.id ? "Keep blank to leave unchanged" : "Password (default: dealer@123)"} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" value={dealerForm.password} onChange={e => setDealerForm({...dealerForm, password: e.target.value})} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setDealerForm(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 cursor-pointer">Cancel</button>
                <button type="submit" className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-5 rounded-lg text-sm cursor-pointer">Save Dealer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Technician Creation/Edit Modal */}
      {techForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <h3 className="font-bold text-white">{techForm.id ? 'Edit Technician Details' : 'Register New Technician'}</h3>
              <button onClick={() => setTechForm(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveTech} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Technician Name</label>
                <input required type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" value={techForm.name} onChange={e => setTechForm({...techForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Mobile Number</label>
                <input required type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" value={techForm.mobile} onChange={e => setTechForm({...techForm, mobile: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <input required type="email" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" value={techForm.email} onChange={e => setTechForm({...techForm, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
                <input type="text" placeholder={techForm.id ? "Keep blank to leave unchanged" : "Password (default: tech@123)"} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" value={techForm.password} onChange={e => setTechForm({...techForm, password: e.target.value})} />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setTechForm(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 cursor-pointer">Cancel</button>
                <button type="submit" className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-5 rounded-lg text-sm cursor-pointer">Save Technician</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Details Panel Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-white text-lg">{selectedTicket.ticketNumber} Details</h3>
                <p className="text-xs text-slate-400 mt-0.5 capitalize">Type: {selectedTicket.type} • Status: {selectedTicket.status.replace('_', ' ')}</p>
              </div>
              <button onClick={() => { setSelectedTicket(null); fetchData(); }} className="text-slate-400 hover:text-slate-200 cursor-pointer"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[calc(85vh-150px)] overflow-y-auto">
              {/* Left Column: Customer & Product Details */}
              <div className="md:col-span-2 space-y-6">
                
                {/* Customer Details */}
                <div className="bg-slate-800/40 border border-slate-850 p-5 rounded-2xl">
                  <h4 className="font-bold text-white mb-3 text-sm border-b border-slate-700 pb-2">Customer & Venue</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">Name</p>
                      <p className="font-bold text-slate-200">{selectedTicket.customer.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">Mobile</p>
                      <p className="font-medium">{selectedTicket.customer.mobile} {selectedTicket.customer.alternateMobile && ` / ${selectedTicket.customer.alternateMobile}`}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 font-semibold">Address</p>
                      <p>{selectedTicket.customer.address}, {selectedTicket.customer.city} - {selectedTicket.customer.pincode}</p>
                    </div>
                  </div>
                </div>

                {/* Product details */}
                <div className="bg-slate-800/40 border border-slate-850 p-5 rounded-2xl">
                  <h4 className="font-bold text-white mb-3 text-sm border-b border-slate-700 pb-2">Product & Service Scope</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">Product Name</p>
                      <p className="font-semibold text-slate-200">{selectedTicket.product.name} ({selectedTicket.product.category})</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">Model / Serial Number</p>
                      <p>{selectedTicket.product.modelNumber || 'N/A'} • {selectedTicket.product.serialNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">Invoice Number & Purchase Date</p>
                      <p>{selectedTicket.product.invoiceNumber || 'N/A'} • {selectedTicket.product.purchaseDate ? new Date(selectedTicket.product.purchaseDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">Preferred Installation/Visit Date</p>
                      <p className="font-bold text-slate-200">{selectedTicket.installationDetails?.preferredDate ? new Date(selectedTicket.installationDetails.preferredDate).toLocaleDateString() : selectedTicket.preferredVisitDate ? new Date(selectedTicket.preferredVisitDate).toLocaleDateString() : 'Flexible'}</p>
                    </div>
                    {selectedTicket.serviceDetails?.description && (
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500 font-semibold">Problem / Issue Description</p>
                        <p className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-slate-200 mt-1">{selectedTicket.serviceDetails.description}</p>
                      </div>
                    )}
                    {selectedTicket.remarks && (
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500 font-semibold">Dealer Remarks</p>
                        <p className="text-slate-300 italic">{selectedTicket.remarks}</p>
                      </div>
                    )}
                    {selectedTicket.invoiceImage && (
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500 font-semibold">Invoice Attachment</p>
                        <a href={`http://localhost:5050/${selectedTicket.invoiceImage}`} target="_blank" rel="noreferrer" className="text-violet-400 hover:text-violet-300 text-xs font-bold underline mt-1 inline-block">View Uploaded Invoice Image</a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Technician Completion Uploads */}
                {selectedTicket.completion?.workDone && (
                  <div className="bg-slate-800/40 border border-slate-850 p-5 rounded-2xl space-y-4">
                    <h4 className="font-bold text-white text-sm border-b border-slate-700 pb-2 flex items-center justify-between">
                      <span>Technician Job Submission</span>
                      <span className="text-xs text-slate-400">{new Date(selectedTicket.completion.submittedAt).toLocaleString()}</span>
                    </h4>
                    <div className="text-sm text-slate-300 space-y-2">
                      <p><span className="text-slate-500 font-semibold">Work Done:</span> {selectedTicket.completion.workDone}</p>
                      <p><span className="text-slate-500 font-semibold">Remarks:</span> {selectedTicket.completion.remarks || 'None'}</p>
                    </div>
                    {selectedTicket.completion.photos && selectedTicket.completion.photos.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 font-semibold mb-2">Completion Photos</p>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedTicket.completion.photos.map((photo, i) => (
                            <a key={i} href={`http://localhost:5050/${photo}`} target="_blank" rel="noreferrer">
                              <img src={`http://localhost:5050/${photo}`} alt="Completion" className="rounded-lg object-cover w-full h-24 border border-slate-700" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Right Column: Assignment, Closure, Timeline */}
              <div className="space-y-6">
                
                {/* Actions Panel */}
                <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-850 space-y-4">
                  <h4 className="font-bold text-white text-sm border-b border-slate-700 pb-2">Ticket Actions</h4>
                  
                  {/* Assignment Form */}
                  {selectedTicket.status === 'new' && (
                    <form onSubmit={handleAssign} className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-400">Assign Technician</label>
                      <select 
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white cursor-pointer"
                        value={assignTechId}
                        onChange={e => setAssignTechId(e.target.value)}
                      >
                        <option value="">Select Technician...</option>
                        {technicians.filter(t => t.status === 'active').map(tech => (
                          <option key={tech._id} value={tech._id}>{tech.name} ({tech.code})</option>
                        ))}
                      </select>
                      <textarea
                        placeholder="Assignment notes/schedule..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-hidden"
                        value={assignNotes}
                        onChange={e => setAssignNotes(e.target.value)}
                      />
                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs cursor-pointer">
                        Assign Technician
                      </button>
                    </form>
                  )}

                  {/* Verification Form */}
                  {selectedTicket.status === 'verification_pending' && (
                    <form onSubmit={handleVerify} className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-400">Work Verification</label>
                      <select 
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white cursor-pointer"
                        value={verificationForm.status}
                        onChange={e => setVerificationForm({...verificationForm, status: e.target.value})}
                      >
                        <option value="approved">Approve Work</option>
                        <option value="rejected">Reject (Send back to Technician)</option>
                      </select>
                      <textarea
                        required={verificationForm.status === 'rejected'}
                        placeholder={verificationForm.status === 'rejected' ? "Specify reason for rejection..." : "Enter verification remarks (optional)..."}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-hidden"
                        value={verificationForm.reason}
                        onChange={e => setVerificationForm({...verificationForm, reason: e.target.value})}
                      />
                      <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg text-xs cursor-pointer">
                        Submit Verification
                      </button>
                    </form>
                  )}

                  {/* Closure Form */}
                  {selectedTicket.status === 'completed' && (
                    <form onSubmit={handleClose} className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-400">Close Ticket</label>
                      <textarea
                        required
                        placeholder="Enter final closing remarks..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-hidden"
                        value={closureRemarks}
                        onChange={e => setClosureRemarks(e.target.value)}
                      />
                      <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs cursor-pointer">
                        Approve & Close Ticket
                      </button>
                    </form>
                  )}

                  {selectedTicket.status === 'closed' && (
                    <div className="bg-emerald-950/40 border border-emerald-900/30 p-3 rounded-xl text-emerald-400 text-xs font-semibold space-y-1">
                      <p>Ticket Closed Successfully</p>
                      {selectedTicket.closingRemarks && <p className="italic text-slate-300 mt-1">Remarks: {selectedTicket.closingRemarks}</p>}
                    </div>
                  )}

                  {selectedTicket.status === 'assigned' || selectedTicket.status === 'in_progress' ? (
                    <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700/50 space-y-2 text-xs">
                      <p className="font-semibold text-slate-300">Currently Assigned: {selectedTicket.assignedTechnician?.name}</p>
                      <p className="text-slate-400">Waiting for technician updates.</p>
                      <button 
                        onClick={() => {
                          // Allow re-assigning even if assigned
                          setSelectedTicket({...selectedTicket, status: 'new'});
                        }}
                        className="text-violet-400 font-bold hover:underline"
                      >
                        Re-assign Technician?
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Timeline History */}
                <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-850 space-y-4">
                  <h4 className="font-bold text-white text-sm border-b border-slate-700 pb-2">Status Timeline</h4>
                  <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                    {selectedTicket.timeline.map((entry, idx) => (
                      <div key={idx} className="flex gap-3 text-xs">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                          {idx < selectedTicket.timeline.length - 1 && <div className="w-0.5 flex-1 bg-slate-700 my-1" />}
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-200 capitalize">{entry.status.replace('_', ' ')}</p>
                          <p className="text-slate-400">{entry.note}</p>
                          <p className="text-slate-500 text-[10px]">{entry.updatedBy} • {new Date(entry.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
