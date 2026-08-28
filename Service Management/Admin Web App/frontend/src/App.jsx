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
  ClipboardList,
  Settings,
  Layers,
  Calendar,
  Trash2,
  Edit,
  Power,
  Menu
} from 'lucide-react';

const API_BASE = '/api';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gsp_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [token, setToken] = useState(() => localStorage.getItem('gsp_token') || '');
  
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, dealers, technicians, tickets
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // States for lists
  const [dealers, setDealers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [activeTechniciansForAssign, setActiveTechniciansForAssign] = useState([]);
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
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageForm, setMessageForm] = useState({ recipient: 'dealer', title: '', body: '' });
  
  // Raise Request Modal states
  const [createRequestOpen, setCreateRequestOpen] = useState(false);
  const [newRequestForm, setNewRequestForm] = useState({
    dealer: '',
    type: 'installation',
    customer: {
      name: '',
      mobile: '',
      alternateMobile: '',
      address: '',
      city: '',
      pincode: ''
    },
    product: {
      category: '',
      name: '',
      modelNumber: '',
      serialNumber: '',
      purchaseDate: '',
      invoiceNumber: ''
    },
    serviceDetails: {
      description: '',
      priority: 'medium'
    },
    installationDetails: {
      preferredDate: ''
    },
    preferredVisitDate: '',
    remarks: ''
  });
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const [uploadedInvoicePath, setUploadedInvoicePath] = useState('');

  // Sidebar / Submenu states
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Settings: Appliances & Brands states
  const [appliances, setAppliances] = useState([]);
  const [brands, setBrands] = useState([]);
  const [applianceForm, setApplianceForm] = useState(null); // null or { id?, name }
  const [brandForm, setBrandForm] = useState(null); // null or { id?, name, applianceId, followUpDays }
  const [cities, setCities] = useState([]);
  const [cityForm, setCityForm] = useState(null); // null or { id?, name }
  const [feeForm, setFeeForm] = useState(null); // null or { id, brandName, applianceName, serviceFee, installationFee }
  const [admins, setAdmins] = useState([]);
  const [adminForm, setAdminForm] = useState(null); // null or { id?, name, email, password, status, permissions }
  const [customers, setCustomers] = useState([]);
  // History page states
  const [historyTabBack, setHistoryTabBack] = useState('');
  const [historyContext, setHistoryContext] = useState(''); // 'customer', 'dealer', 'technician'
  const [historyEntity, setHistoryEntity] = useState(null);
  const [historyTickets, setHistoryTickets] = useState([]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Dashboard Date Filter states
  // Reports states
  const [reportTab, setReportTab] = useState('expense');
  const [reportFilters, setReportFilters] = useState({
    fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    dealer: 'ALL',
    technician: 'ALL',
    ticketType: 'ALL',
    category: 'ALL',
    brand: 'ALL'
  });
  const [appliedFiltersSummary, setAppliedFiltersSummary] = useState(null);
  const [reportsData, setReportsData] = useState([]);
  const [reportsSummary, setReportsSummary] = useState({
    totalAmount: 0,
    completedCount: 0,
    serviceAmount: 0,
    installationAmount: 0
  });
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsTotalCount, setReportsTotalCount] = useState(0);
  const [reportsLoading, setReportsLoading] = useState(false);
  const getLocalDateString = (date = new Date()) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const calculatePredefinedRange = (filterName) => {
    const today = new Date();
    let fromDate = new Date();
    let toDate = new Date();

    switch (filterName) {
      case 'Today':
        break;
      case 'Yesterday':
        fromDate.setDate(today.getDate() - 1);
        toDate.setDate(today.getDate() - 1);
        break;
      case 'Last 7 Days':
        fromDate.setDate(today.getDate() - 6);
        break;
      case 'Last 30 Days':
        fromDate.setDate(today.getDate() - 29);
        break;
      case 'This Month':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'Last Month':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        toDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'This Year':
        fromDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        break;
    }

    return {
      fromDate: getLocalDateString(fromDate),
      toDate: getLocalDateString(toDate)
    };
  };

  const todayStr = getLocalDateString();
  const [dashboardDateFilter, setDashboardDateFilter] = useState('Today');
  const [dashboardCustomRange, setDashboardCustomRange] = useState({
    fromDate: todayStr,
    toDate: todayStr
  });
  const [appliedDashboardRange, setAppliedDashboardRange] = useState({
    fromDate: todayStr,
    toDate: todayStr
  });
  const [dashboardPendingVerifications, setDashboardPendingVerifications] = useState([]);
  const [dashboardNewUnassigned, setDashboardNewUnassigned] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Technician History Filter states
  const [techFromDate, setTechFromDate] = useState(todayStr);
  const [techToDate, setTechToDate] = useState(todayStr);
  const [techStatusFilter, setTechStatusFilter] = useState('assigned_completed');
  const [techPerformanceStats, setTechPerformanceStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pendingVerification: 0
  });

  // Dealer History Filter states
  const [dealerFromDate, setDealerFromDate] = useState(todayStr);
  const [dealerToDate, setDealerToDate] = useState(todayStr);
  const [dealerPerformanceStats, setDealerPerformanceStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pendingVerification: 0,
    expenses: 0
  });
  const [isDealerFilterApplied, setIsDealerFilterApplied] = useState(false);

  // Follow-ups states
  const [followUps, setFollowUps] = useState([]);
  const [followUpFilters, setFollowUpFilters] = useState({
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0]
  });

  // Pagination states
  const [customerPage, setCustomerPage] = useState(1);
  const [followUpPage, setFollowUpPage] = useState(1);
  const [ticketPage, setTicketPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  // Filters & Searches
  const [dealerSearch, setDealerSearch] = useState('');
  const [techSearch, setTechSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [ticketFilters, setTicketFilters] = useState({
    status: '',
    type: '',
    city: '',
    search: '',
    fromDate: '',
    toDate: '',
    dashboardFilter: ''
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

  const fetchDashboardData = async () => {
    try {
      setDashboardLoading(true);
      const data = await apiFetch(`/tickets/dashboard?fromDate=${appliedDashboardRange.fromDate}&toDate=${appliedDashboardRange.toDate}`);
      setStats(data.stats);
      setDashboardPendingVerifications(data.pendingVerifications);
      setDashboardNewUnassigned(data.newUnassignedTickets);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // Load dealers, technicians, and tickets
      const dealersData = await apiFetch(`/dealers?search=${dealerSearch}`);
      const techsData = await apiFetch(`/technicians?search=${techSearch}`);
      const ticketsData = await apiFetch(`/tickets?status=${ticketFilters.status}&type=${ticketFilters.type}&city=${ticketFilters.city}&search=${ticketFilters.search}&fromDate=${ticketFilters.fromDate || ''}&toDate=${ticketFilters.toDate || ''}&dashboardFilter=${ticketFilters.dashboardFilter || ''}`);

      setDealers(dealersData);
      setTechnicians(techsData);
      setTickets(ticketsData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliances = async () => {
    try {
      const data = await apiFetch('/appliances');
      setAppliances(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBrands = async () => {
    try {
      const data = await apiFetch('/brands');
      setBrands(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCities = async () => {
    try {
      const data = await apiFetch('/cities');
      setCities(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const data = await apiFetch('/admins');
      setAdmins(data);
    } catch (err) {
      console.error('Error fetching admins:', err);
    }
  };

  const handleSaveAdmin = async (e) => {
    e.preventDefault();
    try {
      if (adminForm.id) {
        // Edit admin
        await apiFetch(`/admins/${adminForm.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: adminForm.name,
            email: adminForm.email,
            password: adminForm.password || undefined,
            status: adminForm.status,
            permissions: adminForm.permissions
          })
        });
      } else {
        // Add admin
        await apiFetch('/admins', {
          method: 'POST',
          body: JSON.stringify({
            name: adminForm.name,
            email: adminForm.email,
            password: adminForm.password,
            status: adminForm.status,
            permissions: adminForm.permissions
          })
        });
      }
      setAdminForm(null);
      fetchAdmins();
      alert('Admin user saved successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleAdminStatus = async (id) => {
    try {
      await apiFetch(`/admins/${id}/toggle`, {
        method: 'PATCH'
      });
      fetchAdmins();
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchFollowUps = async () => {
    try {
      const data = await apiFetch(`/followups?fromDate=${followUpFilters.fromDate}&toDate=${followUpFilters.toDate}`);
      setFollowUps(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await apiFetch('/tickets/customers');
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDealerHistory = async () => {
    if (!dealerFromDate || !dealerToDate) {
      alert('Both dates are mandatory.');
      return;
    }
    if (dealerFromDate > dealerToDate) {
      alert('From Date cannot be greater than To Date.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch(`/tickets?dealer=${historyEntity._id}&fromDate=${dealerFromDate}&toDate=${dealerToDate}&dealerFilter=true`);
      setHistoryTickets(data.tickets);
      setDealerPerformanceStats(data.summary);
      setIsDealerFilterApplied(true);
      setHistoryPage(1);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicianHistory = async () => {
    if (!techFromDate || !techToDate) {
      alert('Both dates are mandatory.');
      return;
    }
    if (techFromDate > techToDate) {
      alert('From Date cannot be greater than To Date.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch(`/tickets?technician=${historyEntity._id}&fromDate=${techFromDate}&toDate=${techToDate}&performanceFilter=${techStatusFilter}`);
      setHistoryTickets(data.tickets);
      setTechPerformanceStats(data.summary);
      setHistoryPage(1);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewHistory = async (type, entity, backTab) => {
    setHistoryContext(type);
    setHistoryEntity(entity);
    setHistoryTabBack(backTab);
    setHistoryTickets([]);
    setHistorySearchQuery('');
    setHistoryPage(1);
    setActiveTab('history_view');
    setLoading(true);
    try {
      let url = '';
      if (type === 'customer') {
        url = `/tickets?customerMobile=${entity.mobile}`;
      } else if (type === 'dealer') {
        // Reset dealer filter states to today but filter not applied initially
        setDealerFromDate(todayStr);
        setDealerToDate(todayStr);
        setIsDealerFilterApplied(false);
        url = `/tickets?dealer=${entity._id}`;
      } else if (type === 'technician') {
        // Reset default technician filter states
        setTechFromDate(todayStr);
        setTechToDate(todayStr);
        setTechStatusFilter('assigned_completed');
        url = `/tickets?technician=${entity._id}&fromDate=${todayStr}&toDate=${todayStr}&performanceFilter=assigned_completed`;
      }
      const data = await apiFetch(url);
      if (type === 'technician') {
        setHistoryTickets(data.tickets);
        setTechPerformanceStats(data.summary);
      } else {
        setHistoryTickets(data);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (page = 1) => {
    setReportsLoading(true);
    try {
      const params = new URLSearchParams({
        reportType: reportTab,
        fromDate: reportFilters.fromDate,
        toDate: reportFilters.toDate,
        dealer: reportFilters.dealer,
        technician: reportFilters.technician,
        ticketType: reportFilters.ticketType,
        category: reportFilters.category,
        brand: reportFilters.brand,
        page,
        limit: 25
      });

      const res = await fetch(`${API_BASE}/tickets/reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const json = await res.json();
        setReportsData(json.data);
        setReportsSummary(json.summary);
        setReportsPage(json.page);
        setReportsTotalCount(json.totalCount);
        setAppliedFiltersSummary({ ...reportFilters });
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error connecting to backend');
    } finally {
      setReportsLoading(false);
    }
  };

  const resetReportFilters = () => {
    const fresh = {
      fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      toDate: new Date().toISOString().split('T')[0],
      dealer: 'ALL',
      technician: 'ALL',
      ticketType: 'ALL',
      category: 'ALL',
      brand: 'ALL'
    };
    setReportFilters(fresh);
    setReportsData([]);
    setReportsSummary({
      totalAmount: 0,
      completedCount: 0,
      serviceAmount: 0,
      installationAmount: 0
    });
    setReportsPage(1);
    setReportsTotalCount(0);
    setAppliedFiltersSummary(null);
  };

  const handleRaiseTicketForCustomer = (cust) => {
    setNewRequestForm({
      dealer: '',
      type: 'installation',
      customer: {
        name: cust.name || '',
        mobile: cust.mobile || '',
        alternateMobile: cust.alternateMobile || '',
        address: cust.address || '',
        city: cust.city || '',
        pincode: cust.pincode || ''
      },
      product: {
        category: '',
        name: '',
        modelNumber: '',
        serialNumber: '',
        purchaseDate: ''
      },
      serviceDetails: {
        description: '',
        preferredDate: '',
        preferredTimeSlot: 'anytime'
      }
    });
    setCreateRequestOpen(true);
  };

  const exportToCSV = () => {
    if (reportsData.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = reportTab === 'expense' 
      ? ['Ticket ID', 'Completed Date', 'Dealer', 'Ticket Type', 'Appliance Category', 'Brand', 'Customer', 'Technician', 'Dealer Expense']
      : ['Ticket ID', 'Completed Date', 'Technician', 'Dealer', 'Ticket Type', 'Appliance Category', 'Brand', 'Customer', 'Technician Earning'];

    const rows = reportsData.map(t => {
      const completedDate = t.adminVerification?.verifiedAt 
        ? new Date(t.adminVerification.verifiedAt).toLocaleDateString('en-GB') 
        : t.closedAt 
          ? new Date(t.closedAt).toLocaleDateString('en-GB') 
          : new Date(t.updatedAt).toLocaleDateString('en-GB');

      const expVal = reportTab === 'expense' ? t.dealerExpense : t.technicianEarning;
      const amountStr = typeof expVal === 'number' ? `₹${expVal}` : expVal;

      return reportTab === 'expense' ? [
        t.ticketNumber || '—',
        completedDate,
        t.dealer?.name || '—',
        (t.type || '—').toUpperCase(),
        t.product?.category || '—',
        t.product?.name || '—',
        t.customer?.name || '—',
        t.assignedTechnician?.name || '—',
        amountStr
      ] : [
        t.ticketNumber || '—',
        completedDate,
        t.assignedTechnician?.name || '—',
        t.dealer?.name || '—',
        (t.type || '—').toUpperCase(),
        t.product?.category || '—',
        t.product?.name || '—',
        t.customer?.name || '—',
        amountStr
      ];
    });

    const totalRow = reportTab === 'expense'
      ? ['TOTAL EXPENSE', '', '', '', '', '', '', '', `₹${reportsSummary.totalAmount}`]
      : ['TOTAL EARNINGS', '', '', '', '', '', '', '', `₹${reportsSummary.totalAmount}`];
    
    rows.push(totalRow);

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportTab === 'expense' ? 'expense_report' : 'earning_report'}_${reportFilters.fromDate}_to_${reportFilters.toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (reportsData.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = reportTab === 'expense' 
      ? ['Ticket ID', 'Completed Date', 'Dealer', 'Ticket Type', 'Appliance Category', 'Brand', 'Customer', 'Technician', 'Dealer Expense']
      : ['Ticket ID', 'Completed Date', 'Technician', 'Dealer', 'Ticket Type', 'Appliance Category', 'Brand', 'Customer', 'Technician Earning'];

    const rows = reportsData.map(t => {
      const completedDate = t.adminVerification?.verifiedAt 
        ? new Date(t.adminVerification.verifiedAt).toLocaleDateString('en-GB') 
        : t.closedAt 
          ? new Date(t.closedAt).toLocaleDateString('en-GB') 
          : new Date(t.updatedAt).toLocaleDateString('en-GB');

      const expVal = reportTab === 'expense' ? t.dealerExpense : t.technicianEarning;
      const amountStr = typeof expVal === 'number' ? `₹${expVal}` : expVal;

      return reportTab === 'expense' ? [
        t.ticketNumber || '—',
        completedDate,
        t.dealer?.name || '—',
        (t.type || '—').toUpperCase(),
        t.product?.category || '—',
        t.product?.name || '—',
        t.customer?.name || '—',
        t.assignedTechnician?.name || '—',
        amountStr
      ] : [
        t.ticketNumber || '—',
        completedDate,
        t.assignedTechnician?.name || '—',
        t.dealer?.name || '—',
        (t.type || '—').toUpperCase(),
        t.product?.category || '—',
        t.product?.name || '—',
        t.customer?.name || '—',
        amountStr
      ];
    });

    const totalRow = reportTab === 'expense'
      ? ['TOTAL EXPENSE', '', '', '', '', '', '', '', `₹${reportsSummary.totalAmount}`]
      : ['TOTAL EARNINGS', '', '', '', '', '', '', '', `₹${reportsSummary.totalAmount}`];
    
    rows.push(totalRow);

    const xlsContent = [headers.join('\t'), ...rows.map(e => e.join('\t'))].join('\n');
    const blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportTab === 'expense' ? 'expense_report' : 'earning_report'}_${reportFilters.fromDate}_to_${reportFilters.toDate}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      resetReportFilters();
    }
  }, [activeTab, reportTab]);

  // Run searches / filters trigger reload
  useEffect(() => {
    if (user) {
      if (activeTab === 'appliances_brands') {
        fetchAppliances();
        fetchBrands();
      } else if (activeTab === 'fees_config') {
        fetchAppliances();
        fetchBrands();
      } else if (activeTab === 'cities') {
        fetchCities();
      } else if (activeTab === 'user_management') {
        fetchAdmins();
      } else if (activeTab === 'customers') {
        fetchCustomers();
      } else if (activeTab === 'followups') {
        fetchFollowUps();
      } else if (activeTab === 'dashboard') {
        fetchDashboardData();
      } else {
        fetchData();
        fetchCities();
        fetchAppliances();
        fetchBrands();
      }
    }
  }, [user, dealerSearch, techSearch, ticketFilters, activeTab, followUpFilters, appliedDashboardRange]);

  useEffect(() => {
    setCustomerPage(1);
  }, [customerSearch]);

  useEffect(() => {
    setFollowUpPage(1);
  }, [followUpFilters]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      const perms = user.permissions || {
        dashboard: true,
        tickets: true,
        customers: true,
        manageDealers: true,
        manageTechnicians: true,
        followups: true,
        settings: true
      };
      
      const isAllowed = (tab) => {
        if (tab === 'dashboard' && !perms.dashboard) return false;
        if (tab === 'tickets' && !perms.tickets) return false;
        if (tab === 'customers' && !perms.customers) return false;
        if (tab === 'dealers' && !perms.manageDealers) return false;
        if (tab === 'technicians' && !perms.manageTechnicians) return false;
        if (tab === 'followups' && !perms.followups) return false;
        if (tab === 'appliances_brands' && !perms.settings) return false;
        if (tab === 'cities' && !perms.settings) return false;
        if (tab === 'user_management' && !perms.settings) return false;
        return true;
      };

      if (!isAllowed(activeTab)) {
        if (perms.dashboard) setActiveTab('dashboard');
        else if (perms.tickets) setActiveTab('tickets');
        else if (perms.customers) setActiveTab('customers');
        else if (perms.manageDealers) setActiveTab('dealers');
        else if (perms.manageTechnicians) setActiveTab('technicians');
        else if (perms.followups) setActiveTab('followups');
        else if (perms.settings) setActiveTab('appliances_brands');
      }
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (selectedTicket && selectedTicket.status === 'new') {
      const fetchActiveTechs = async () => {
        try {
          const data = await apiFetch('/technicians?status=active');
          setActiveTechniciansForAssign(data);
        } catch (err) {
          console.error('Error fetching active technicians for assignment:', err);
        }
      };
      fetchActiveTechs();
    }
  }, [selectedTicket]);

  useEffect(() => {
    setTicketPage(1);
  }, [ticketFilters, dealerSearch, techSearch]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historySearchQuery]);

  const handleStatClick = (statusType) => {
    setTicketFilters({
      status: statusType,
      type: '',
      city: '',
      search: '',
      fromDate: appliedDashboardRange.fromDate,
      toDate: appliedDashboardRange.toDate,
      dashboardFilter: 'true'
    });
    setActiveTab('tickets');
  };

  // Appliance Actions
  const saveAppliance = async (e) => {
    e.preventDefault();
    try {
      if (applianceForm.id) {
        await apiFetch(`/appliances/${applianceForm.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: applianceForm.name })
        });
      } else {
        await apiFetch('/appliances', {
          method: 'POST',
          body: JSON.stringify({ name: applianceForm.name })
        });
      }
      setApplianceForm(null);
      fetchAppliances();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleApplianceStatus = async (id) => {
    try {
      await apiFetch(`/appliances/${id}/toggle`, { method: 'PATCH' });
      fetchAppliances();
      fetchBrands();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteAppliance = async (id) => {
    if (!window.confirm('Are you sure you want to delete this appliance? This will fail if brands are linked.')) return;
    try {
      await apiFetch(`/appliances/${id}`, { method: 'DELETE' });
      fetchAppliances();
    } catch (err) {
      alert(err.message);
    }
  };

  // Brand Actions
  const saveBrand = async (e) => {
    e.preventDefault();
    try {
      if (brandForm.id) {
        await apiFetch(`/brands/${brandForm.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: brandForm.name, followUpDays: brandForm.followUpDays })
        });
      } else {
        await apiFetch('/brands', {
          method: 'POST',
          body: JSON.stringify({
            name: brandForm.name,
            applianceId: brandForm.applianceId,
            followUpDays: brandForm.followUpDays
          })
        });
      }
      setBrandForm(null);
      fetchBrands();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleBrandStatus = async (id) => {
    try {
      await apiFetch(`/brands/${id}/toggle`, { method: 'PATCH' });
      fetchBrands();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteBrand = async (id) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;
    try {
      await apiFetch(`/brands/${id}`, { method: 'DELETE' });
      fetchBrands();
    } catch (err) {
      alert(err.message);
    }
  };

  const saveFee = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/brands/${feeForm.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          serviceFee: feeForm.serviceFee,
          installationFee: feeForm.installationFee
        })
      });
      setFeeForm(null);
      fetchBrands();
    } catch (err) {
      alert(err.message);
    }
  };

  // City Actions
  const saveCity = async (e) => {
    e.preventDefault();
    try {
      if (cityForm.id) {
        await apiFetch(`/cities/${cityForm.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: cityForm.name })
        });
      } else {
        await apiFetch('/cities', {
          method: 'POST',
          body: JSON.stringify({ name: cityForm.name })
        });
      }
      setCityForm(null);
      fetchCities();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleCityStatus = async (id) => {
    try {
      await apiFetch(`/cities/${id}/toggle`, { method: 'PATCH' });
      fetchCities();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteCity = async (id) => {
    if (!window.confirm('Are you sure you want to delete this city?')) return;
    try {
      await apiFetch(`/cities/${id}`, { method: 'DELETE' });
      fetchCities();
    } catch (err) {
      alert(err.message);
    }
  };

  // Follow-up Actions
  const markFollowUpClosed = async (id) => {
    try {
      await apiFetch(`/followups/${id}/close`, { method: 'PATCH' });
      fetchFollowUps();
    } catch (err) {
      alert(err.message);
    }
  };

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
      fetchDashboardData();
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
      fetchDashboardData();
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
      fetchDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = async (e) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to cancel this ticket? This action cannot be undone.")) {
      return;
    }
    try {
      const updated = await apiFetch(`/tickets/${selectedTicket._id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: cancelReason })
      });
      setSelectedTicket(updated);
      setCancelReason('');
      setShowCancelForm(false);
      fetchData();
      fetchDashboardData();
      alert("Ticket cancelled successfully!");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendCustomMessage = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/tickets/${selectedTicket._id}/message`, {
        method: 'POST',
        body: JSON.stringify(messageForm)
      });
      setMessageForm({ recipient: 'dealer', title: '', body: '' });
      setShowMessageForm(false);
      const refreshed = await apiFetch(`/tickets/${selectedTicket._id}`);
      setSelectedTicket(refreshed);
      alert("Push notification sent successfully!");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingInvoice(true);
    try {
      const formData = new FormData();
      formData.append('invoiceImage', file);
      
      const res = await fetch(`${API_BASE}/tickets/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!res.ok) {
        let errMsg = 'Failed to upload invoice copy';
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch (jsonErr) {
          try {
            const textErr = await res.text();
            if (textErr && textErr.includes('413') && textErr.includes('Large')) {
              errMsg = 'File is too large. Please upload an image/file smaller than 10MB.';
            } else {
              errMsg = textErr || errMsg;
            }
          } catch (textErr) {}
        }
        throw new Error(errMsg);
      }
      
      const data = await res.json();
      setUploadedInvoicePath(data.filePath);
    } catch (err) {
      alert(err.message);
      e.target.value = null;
      setUploadedInvoicePath('');
    } finally {
      setUploadingInvoice(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    
    // Validation
    const mobile = newRequestForm.customer.mobile;
    if (!/^[0-9]{10}$/.test(mobile)) {
      alert("Mobile Number must be exactly 10 digits.");
      return;
    }
    const pincode = newRequestForm.customer.pincode;
    if (!/^[0-9]{6}$/.test(pincode)) {
      alert("Pincode must be exactly 6 digits.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        type: newRequestForm.type,
        dealer: newRequestForm.dealer,
        preferredVisitDate: newRequestForm.preferredVisitDate,
        remarks: newRequestForm.remarks,
        customer: {
          name: newRequestForm.customer.name,
          mobile: newRequestForm.customer.mobile,
          alternateMobile: newRequestForm.customer.alternateMobile || undefined,
          address: newRequestForm.customer.address,
          city: newRequestForm.customer.city,
          pincode: newRequestForm.customer.pincode
        },
        product: {
          category: newRequestForm.product.category,
          name: newRequestForm.product.name,
          modelNumber: newRequestForm.product.modelNumber || undefined,
          serialNumber: newRequestForm.product.serialNumber || undefined,
          purchaseDate: newRequestForm.product.purchaseDate || undefined,
          invoiceNumber: newRequestForm.product.invoiceNumber || undefined
        },
        invoiceImage: uploadedInvoicePath || undefined
      };

      if (newRequestForm.type === 'service') {
        payload.serviceDetails = {
          description: newRequestForm.serviceDetails.description,
          priority: newRequestForm.serviceDetails.priority
        };
      } else {
        payload.installationDetails = {
          preferredDate: newRequestForm.preferredVisitDate
        };
      }

      const res = await fetch(`${API_BASE}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errMsg = 'Failed to create request';
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch (jsonErr) {
          try {
            const textErr = await res.text();
            if (textErr && textErr.includes('413') && textErr.includes('Large')) {
              errMsg = 'File is too large. Please upload an image/file smaller than 10MB.';
            } else {
              errMsg = textErr || errMsg;
            }
          } catch (textErr) {
            // Ignore text read error
          }
        }
        throw new Error(errMsg);
      }

      alert('Request created successfully!');
      setCreateRequestOpen(false);
      setNewRequestForm({
        dealer: '',
        type: 'installation',
        customer: { name: '', mobile: '', alternateMobile: '', address: '', city: '', pincode: '' },
        product: { category: '', name: '', modelNumber: '', serialNumber: '', purchaseDate: '', invoiceNumber: '' },
        serviceDetails: { description: '', priority: 'medium' },
        installationDetails: { preferredDate: '' },
        preferredVisitDate: '',
        remarks: ''
      });
      setInvoiceFile(null);
      setUploadedInvoicePath('');
      fetchData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
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

  const filteredCustomers = customers.filter(c => {
    const s = customerSearch.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(s)) ||
      (c.mobile && c.mobile.toLowerCase().includes(s)) ||
      (c.alternateMobile && c.alternateMobile.toLowerCase().includes(s)) ||
      (c.address && c.address.toLowerCase().includes(s)) ||
      (c.city && c.city.toLowerCase().includes(s)) ||
      (c.pincode && c.pincode.toLowerCase().includes(s))
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden flex items-center justify-center p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white cursor-pointer mr-1"
          >
            <Menu className="w-5 h-5" />
          </button>
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
        <aside className={`${menuOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 bg-slate-900/50 border-r border-slate-800 p-4 space-y-2 lg:min-h-[calc(100vh-73px)]`}>
          {(!user || user.permissions?.dashboard !== false) && (
            <button
              onClick={() => { setActiveTab('dashboard'); setMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${activeTab === 'dashboard' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </button>
          )}
          {(!user || user.permissions?.tickets !== false) && (
            <button
              onClick={() => { setActiveTab('tickets'); setMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${activeTab === 'tickets' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <TicketIcon className="w-5 h-5" />
              Tickets
            </button>
          )}
          {(!user || user.permissions?.customers !== false) && (
            <button
              onClick={() => { setActiveTab('customers'); setMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${activeTab === 'customers' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <UserCheck className="w-5 h-5" />
              Customers
            </button>
          )}
          {(!user || user.permissions?.manageDealers !== false) && (
            <button
              onClick={() => { setActiveTab('dealers'); setMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${activeTab === 'dealers' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Users className="w-5 h-5" />
              Manage Dealers
            </button>
          )}
          {(!user || user.permissions?.manageTechnicians !== false) && (
            <button
              onClick={() => { setActiveTab('technicians'); setMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${activeTab === 'technicians' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Wrench className="w-5 h-5" />
              Manage Technicians
            </button>
          )}
          {(!user || user.permissions?.followups !== false) && (
            <button
              onClick={() => { setActiveTab('followups'); setMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${activeTab === 'followups' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Calendar className="w-5 h-5" />
              Follow-ups
            </button>
          )}
          {(!user || user.role === 'admin') && (
            <button
              onClick={() => { setActiveTab('reports'); setMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${activeTab === 'reports' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <ClipboardList className="w-5 h-5" />
              Reports
            </button>
          )}
          {(!user || user.permissions?.settings !== false) && (
            <div>
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <span className="flex items-center gap-3">
                  <Settings className="w-5 h-5" />
                  Settings
                </span>
                <span>
                  {settingsOpen ? '▲' : '▼'}
                </span>
              </button>
              {(settingsOpen || activeTab === 'appliances_brands' || activeTab === 'cities' || activeTab === 'user_management' || activeTab === 'fees_config') && (
                <div className="pl-6 mt-1 space-y-1">
                  <button
                    onClick={() => { setActiveTab('appliances_brands'); setMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${activeTab === 'appliances_brands' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    <Layers className="w-4 h-4" />
                    Appliances & Brands
                  </button>
                  <button
                    onClick={() => { setActiveTab('cities'); setMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${activeTab === 'cities' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    <MapPin className="w-4 h-4" />
                    Cities
                  </button>
                  <button
                    onClick={() => { setActiveTab('user_management'); setMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${activeTab === 'user_management' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    <Users className="w-4 h-4" />
                    User Management
                  </button>
                  <button
                    onClick={() => { setActiveTab('fees_config'); setMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${activeTab === 'fees_config' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    Fees Configuration
                  </button>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Dashboard / Workspace Area */}
        <main className="flex-1 p-6 lg:p-8 space-y-8 bg-slate-950">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">Overview Dashboard</h1>
                  <p className="text-slate-400 mt-1">Real-time statistics of service operations</p>
                </div>
                
                {/* Date Filter */}
                <div className="flex flex-wrap items-center gap-3">
                  {dashboardDateFilter === 'Custom' && (
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl">
                      <input 
                        type="date"
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-hidden"
                        value={dashboardCustomRange.fromDate}
                        onChange={e => setDashboardCustomRange({ ...dashboardCustomRange, fromDate: e.target.value })}
                      />
                      <span className="text-xs text-slate-500">to</span>
                      <input 
                        type="date"
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-hidden"
                        value={dashboardCustomRange.toDate}
                        onChange={e => setDashboardCustomRange({ ...dashboardCustomRange, toDate: e.target.value })}
                      />
                      <button
                        onClick={() => {
                          if (dashboardCustomRange.fromDate > dashboardCustomRange.toDate) {
                            alert('From Date cannot be later than To Date');
                            return;
                          }
                          setAppliedDashboardRange({
                            fromDate: dashboardCustomRange.fromDate,
                            toDate: dashboardCustomRange.toDate
                          });
                        }}
                        className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-2.5 py-1 rounded-lg font-bold transition cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  
                  <div className="relative">
                    <select
                      className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
                      value={dashboardDateFilter}
                      onChange={e => {
                        const val = e.target.value;
                        setDashboardDateFilter(val);
                        if (val !== 'Custom') {
                          const range = calculatePredefinedRange(val);
                          setAppliedDashboardRange(range);
                        }
                      }}
                    >
                      <option value="Today">Today</option>
                      <option value="Yesterday">Yesterday</option>
                      <option value="Last 7 Days">Last 7 Days</option>
                      <option value="Last 30 Days">Last 30 Days</option>
                      <option value="This Month">This Month</option>
                      <option value="Last Month">Last Month</option>
                      <option value="This Year">This Year</option>
                      <option value="Custom">Custom Date Range</option>
                    </select>
                  </div>
                </div>
              </div>

              {dashboardLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
                  <p className="text-slate-400 text-sm font-medium">Refreshing stats...</p>
                </div>
              ) : (
                <>
                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div 
                      onClick={() => handleStatClick('')}
                      className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between shadow-lg cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200"
                    >
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Requests</span>
                      <span className="text-3xl font-black text-white mt-2">{stats.total}</span>
                    </div>
                    <div 
                      onClick={() => handleStatClick('new')}
                      className="bg-blue-950/20 border border-blue-900/40 p-5 rounded-2xl flex flex-col justify-between shadow-lg cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200"
                    >
                      <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">New Requests</span>
                      <span className="text-3xl font-black text-blue-400 mt-2">{stats.new}</span>
                    </div>
                    <div 
                      onClick={() => handleStatClick('assigned')}
                      className="bg-amber-950/20 border border-amber-900/40 p-5 rounded-2xl flex flex-col justify-between shadow-lg cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200"
                    >
                      <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Assigned</span>
                      <span className="text-3xl font-black text-amber-400 mt-2">{stats.assigned}</span>
                    </div>
                    <div 
                      onClick={() => handleStatClick('pending')}
                      className="bg-purple-950/20 border border-purple-900/40 p-5 rounded-2xl flex flex-col justify-between shadow-lg cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200"
                    >
                      <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Pending/Action</span>
                      <span className="text-3xl font-black text-purple-400 mt-2">{stats.pending}</span>
                    </div>
                    <div 
                      onClick={() => handleStatClick('closed')}
                      className="bg-emerald-950/20 border border-emerald-900/40 p-5 rounded-2xl flex flex-col justify-between shadow-lg cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200"
                    >
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
                          {dashboardPendingVerifications.length} Action Required
                        </span>
                      </div>
                      <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto">
                        {dashboardPendingVerifications.length === 0 ? (
                          <p className="text-slate-500 py-6 text-center text-sm font-medium">No pending work verifications</p>
                        ) : (
                          dashboardPendingVerifications.map(ticket => (
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
                          {dashboardNewUnassigned.length} Unassigned
                        </span>
                      </div>
                      <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto">
                        {dashboardNewUnassigned.length === 0 ? (
                          <p className="text-slate-500 py-6 text-center text-sm font-medium">No unassigned tickets</p>
                        ) : (
                          dashboardNewUnassigned.map(ticket => (
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
                </>
              )}
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
                <button 
                  onClick={() => {
                    fetchAppliances();
                    fetchBrands();
                    setCreateRequestOpen(true);
                  }}
                  className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition duration-200 cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Raise Request
                </button>
              </div>

              {/* Filters */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                {/* Row 1: Search */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">SEARCH</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input 
                      type="text" 
                      placeholder="Ticket #, Customer, Dealer, Technician"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                      value={ticketFilters.search}
                      onChange={(e) => setTicketFilters({ ...ticketFilters, search: e.target.value, dashboardFilter: '' })}
                    />
                  </div>
                </div>

                {/* Row 2: Date, City, Request Type, Status */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* DATE */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">DATE</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="date" 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
                        value={ticketFilters.fromDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (ticketFilters.toDate && val > ticketFilters.toDate) {
                            alert('From Date cannot be later than To Date');
                            return;
                          }
                          setTicketFilters({ ...ticketFilters, fromDate: val, dashboardFilter: '' });
                        }}
                      />
                      <span className="text-slate-500 text-xs font-bold">to</span>
                      <input 
                        type="date" 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
                        value={ticketFilters.toDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (ticketFilters.fromDate && ticketFilters.fromDate > val) {
                            alert('From Date cannot be later than To Date');
                            return;
                          }
                          setTicketFilters({ ...ticketFilters, toDate: val, dashboardFilter: '' });
                        }}
                      />
                    </div>
                  </div>

                  {/* CITY */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">CITY</label>
                    <select 
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
                      value={ticketFilters.city}
                      onChange={(e) => setTicketFilters({ ...ticketFilters, city: e.target.value, dashboardFilter: '' })}
                    >
                      <option value="">All Cities</option>
                      {cities.map(city => (
                        <option key={city._id} value={city.name}>{city.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* REQUEST TYPE */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">REQUEST TYPE</label>
                    <select 
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
                      value={ticketFilters.type}
                      onChange={(e) => setTicketFilters({ ...ticketFilters, type: e.target.value, dashboardFilter: '' })}
                    >
                      <option value="">All Types</option>
                      <option value="installation">Installation</option>
                      <option value="service">Service Request</option>
                    </select>
                  </div>

                  {/* STATUS */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">STATUS</label>
                    <select 
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
                      value={ticketFilters.status}
                      onChange={(e) => setTicketFilters({ ...ticketFilters, status: e.target.value, dashboardFilter: '' })}
                    >
                      <option value="">All Statuses</option>
                      <option value="new">New</option>
                      <option value="assigned">Assigned</option>
                      <option value="pending">Pending/Action</option>
                      <option value="in_progress">Work In Progress</option>
                      <option value="verification_pending">Verification Pending</option>
                      <option value="completed">Completed (Pending Close)</option>
                      <option value="closed">Closed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
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
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="text-center py-16 text-slate-400 font-medium">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                              <p className="text-sm">Loading requests...</p>
                            </div>
                          </td>
                        </tr>
                      ) : tickets.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-8 text-slate-500 font-medium">No tickets found matches current filters</td>
                        </tr>
                      ) : (
                        tickets.slice((ticketPage - 1) * 15, ticketPage * 15).map(ticket => (
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
                              <div className="flex flex-wrap gap-2 items-center">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                  ticket.status === 'new' ? 'bg-blue-900/50 text-blue-300 border border-blue-700/30' :
                                  ticket.status === 'assigned' ? 'bg-amber-900/50 text-amber-300 border border-amber-700/30' :
                                  ticket.status === 'in_progress' ? 'bg-orange-900/50 text-orange-300 border border-orange-700/30' :
                                  ticket.status === 'verification_pending' ? 'bg-purple-900/50 text-purple-300 border border-purple-700/30' :
                                  ticket.status === 'completed' ? 'bg-green-900/50 text-green-300 border border-green-700/30' :
                                  ticket.status === 'cancelled' ? 'bg-rose-900/50 text-rose-300 border border-rose-700/30' :
                                  'bg-slate-800 text-slate-400'
                                }`}>
                                  {ticket.status.replace('_', ' ')}
                                </span>
                                {ticket.adminVerification?.status === 'rejected' && (
                                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-red-950/60 text-red-400 border border-red-800/40">
                                    Reassigned
                                  </span>
                                )}
                              </div>
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
                <div className="px-6 py-4 bg-slate-950/40 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Showing <span className="font-semibold text-slate-200">{tickets.length === 0 ? 0 : (ticketPage - 1) * 15 + 1}</span> to <span className="font-semibold text-slate-200">{Math.min(ticketPage * 15, tickets.length)}</span> of <span className="font-semibold text-slate-200">{tickets.length}</span> entries
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTicketPage(prev => Math.max(prev - 1, 1))}
                      disabled={ticketPage === 1}
                      className="px-3 py-1.5 rounded-lg bg-slate-850 text-slate-350 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition text-xs font-bold"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.ceil(tickets.length / 15) }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setTicketPage(page)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                          page === ticketPage
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'bg-slate-850 text-slate-350 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setTicketPage(prev => Math.min(prev + 1, Math.max(1, Math.ceil(tickets.length / 15))))}
                      disabled={ticketPage === Math.max(1, Math.ceil(tickets.length / 15))}
                      className="px-3 py-1.5 rounded-lg bg-slate-850 text-slate-350 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition text-xs font-bold"
                    >
                      Next
                    </button>
                  </div>
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
                        onClick={() => viewHistory('dealer', dealer, 'dealers')}
                        className="text-xs text-amber-450 hover:text-amber-350 font-bold cursor-pointer"
                      >
                        History
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
                  onClick={() => setTechForm({ name: '', mobile: '', email: '', password: '', appliances: [] })}
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
                      {tech.appliances && tech.appliances.length > 0 && (
                        <div className="pt-1 flex flex-wrap gap-1">
                          {tech.appliances.map(a => (
                            <span key={a._id} className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                              {a.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
                      <button
                        onClick={() => setTechForm({ 
                          id: tech._id, 
                          name: tech.name, 
                          mobile: tech.mobile, 
                          email: tech.email, 
                          password: '',
                          appliances: tech.appliances ? tech.appliances.map(a => typeof a === 'object' ? a._id : a) : []
                        })}
                        className="text-xs text-violet-400 hover:text-violet-300 font-bold cursor-pointer"
                      >
                        Edit Details
                      </button>
                      <button
                        onClick={() => viewHistory('technician', tech, 'technicians')}
                        className="text-xs text-amber-450 hover:text-amber-350 font-bold cursor-pointer"
                      >
                        History
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

          {/* Settings Tab (Appliances & Brands) */}
          {activeTab === 'appliances_brands' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Appliances & Brands Master</h1>
                <p className="text-slate-400 mt-1">Manage categories of appliances and their associated brands & follow-up policies</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Appliances Panel */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-violet-400" />
                      Appliance Categories
                    </h3>
                    <button
                      onClick={() => setApplianceForm({ name: '' })}
                      className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Appliance
                    </button>
                  </div>

                  <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
                    {appliances.length === 0 ? (
                      <p className="text-slate-500 py-6 text-center text-sm">No appliances added yet</p>
                    ) : (
                      appliances.map(app => (
                        <div key={app._id} className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-xl transition duration-150">
                          <div>
                            <p className="text-sm font-bold text-white">{app.name}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${app.isActive ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                              {app.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setApplianceForm({ id: app._id, name: app.name })}
                              className="text-slate-400 hover:text-white p-1"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleApplianceStatus(app._id)}
                              className={`p-1 ${app.isActive ? 'text-emerald-500' : 'text-red-500'}`}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteAppliance(app._id)}
                              className="text-red-500 hover:text-red-400 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Brands Panel */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                      Brand Configurations
                    </h3>
                    <button
                      disabled={appliances.length === 0}
                      onClick={() => setBrandForm({ name: '', applianceId: appliances[0]?._id, followUpDays: 90 })}
                      className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" /> Add Brand
                    </button>
                  </div>

                  <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
                    {brands.length === 0 ? (
                      <p className="text-slate-500 py-6 text-center text-sm">No brands added yet</p>
                    ) : (
                      brands.map(b => (
                        <div key={b._id} className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-xl transition duration-150">
                          <div>
                            <p className="text-sm font-bold text-white">{b.name}</p>
                            <p className="text-xs text-slate-400">Appliance: {b.appliance?.name || 'N/A'}</p>
                            <p className="text-xs text-violet-400 font-medium">Follow-up: {b.followUpDays} Days</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${b.isActive ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                              {b.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setBrandForm({ id: b._id, name: b.name, followUpDays: b.followUpDays })}
                              className="text-slate-400 hover:text-white p-1"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleBrandStatus(b._id)}
                              className={`p-1 ${b.isActive ? 'text-emerald-500' : 'text-red-500'}`}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteBrand(b._id)}
                              className="text-red-500 hover:text-red-400 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cities Settings Tab */}
          {activeTab === 'cities' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Cities Master Settings</h1>
                <p className="text-slate-400 mt-1">Manage target coverage cities for installations & support tickets</p>
              </div>

              <div className="max-w-2xl bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-violet-400" />
                    Coverage Cities
                  </h3>
                  <button
                    onClick={() => setCityForm({ name: '' })}
                    className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add City
                  </button>
                </div>

                <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto">
                  {cities.length === 0 ? (
                    <p className="text-slate-500 py-6 text-center text-sm">No cities added yet</p>
                  ) : (
                    cities.map(city => (
                      <div key={city._id} className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-xl transition duration-150">
                        <div>
                          <p className="text-sm font-bold text-white">{city.name}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${city.isActive ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                            {city.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCityForm({ id: city._id, name: city.name })}
                            className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-slate-200 transition"
                            title="Edit City"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleCityStatus(city._id)}
                            className={`p-1.5 hover:bg-slate-850 rounded-lg transition ${city.isActive ? 'text-amber-500 hover:text-amber-400' : 'text-emerald-500 hover:text-emerald-400'}`}
                            title={city.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCity(city._id)}
                            className="p-1.5 hover:bg-slate-850 rounded-lg text-red-400 hover:text-red-300 transition"
                            title="Delete City"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fees Configuration Settings Tab */}
          {activeTab === 'fees_config' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Fees Configuration</h1>
                <p className="text-slate-400 mt-1">Configure service and installation fees for appliance categories & brands</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-violet-400" />
                    Appliance & Brand Fees
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-6 py-3 rounded-l-lg">Appliance Category</th>
                        <th className="px-6 py-3">Brand</th>
                        <th className="px-6 py-3">Service Fee</th>
                        <th className="px-6 py-3">Installation Fee</th>
                        <th className="px-6 py-3 rounded-r-lg text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {brands.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-slate-500 py-10 text-center">No brands configured yet. Please configure appliances and brands first.</td>
                        </tr>
                      ) : (
                        brands.map(b => (
                          <tr key={b._id} className="hover:bg-slate-800/20 transition duration-150">
                            <td className="px-6 py-4 font-medium text-white">{b.appliance?.name || 'N/A'}</td>
                            <td className="px-6 py-4 text-white font-medium">{b.name}</td>
                            <td className="px-6 py-4 text-violet-400 font-semibold">₹ {b.serviceFee ?? 0}</td>
                            <td className="px-6 py-4 text-indigo-400 font-semibold">₹ {b.installationFee ?? 0}</td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => setFeeForm({ id: b._id, brandName: b.name, applianceName: b.appliance?.name || 'N/A', serviceFee: b.serviceFee ?? 0, installationFee: b.installationFee ?? 0 })}
                                className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold inline-flex items-center gap-1 cursor-pointer transition duration-150"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit Fee
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

          {activeTab === 'user_management' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">User Management</h1>
                <p className="text-slate-400 mt-1">Manage admin users and configure their specific access permissions</p>
              </div>

              <div className="max-w-4xl bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-violet-400" />
                    Admin Accounts
                  </h3>
                  <button
                    onClick={() => setAdminForm({
                      name: '',
                      email: '',
                      password: '',
                      status: 'active',
                      permissions: {
                        dashboard: true,
                        tickets: true,
                        customers: true,
                        manageDealers: true,
                        manageTechnicians: true,
                        followups: true,
                        settings: true
                      }
                    })}
                    className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Admin User
                  </button>
                </div>

                <div className="divide-y divide-slate-800">
                  {admins.length === 0 ? (
                    <p className="text-slate-500 py-6 text-center text-sm">No admin users found</p>
                  ) : (
                    admins.map(admin => (
                      <div key={admin._id} className="py-4 flex items-center justify-between hover:bg-slate-800/30 px-3 rounded-xl transition duration-150">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white">{admin.name}</p>
                            <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded font-mono">{admin.code}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${admin.status === 'active' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                              {admin.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{admin.email}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Access:</span>
                            {Object.entries(admin.permissions || {}).map(([key, val]) => (
                              val && (
                                <span key={key} className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-md font-medium uppercase tracking-wider">
                                  {key.replace('manage', '').replace('followups', 'follow-ups')}
                                </span>
                              )
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setAdminForm({
                              id: admin._id,
                              name: admin.name,
                              email: admin.email,
                              password: '', // blank for edits
                              status: admin.status,
                              permissions: admin.permissions || {
                                dashboard: true,
                                tickets: true,
                                customers: true,
                                manageDealers: true,
                                manageTechnicians: true,
                                followups: true,
                                settings: true
                              }
                            })}
                            className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-slate-200 transition"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            disabled={admin._id === user._id}
                            onClick={() => toggleAdminStatus(admin._id)}
                            className={`p-1.5 hover:bg-slate-850 rounded-lg transition disabled:opacity-30 ${admin.status === 'active' ? 'text-amber-500 hover:text-amber-400' : 'text-emerald-500 hover:text-emerald-400'}`}
                            title={admin.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">Customers Directory</h1>
                  <p className="text-slate-400 mt-1">View unique customer details compiled across all service and installation requests</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="w-5 h-5 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name, mobile, city..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-violet-600 focus:border-transparent transition"
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Customers Table / Card list */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase bg-slate-950/40">
                        <th className="py-4 px-6">Customer Name</th>
                        <th className="py-4 px-6">Mobile Number</th>
                        <th className="py-4 px-6">Alternate Mobile</th>
                        <th className="py-4 px-6">City</th>
                        <th className="py-4 px-6">Address</th>
                        <th className="py-4 px-6 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-500 text-sm">
                            No customers found.
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.slice((customerPage - 1) * 15, customerPage * 15).map((cust, idx) => (
                          <tr key={cust.mobile || idx} className="hover:bg-slate-800/25 transition duration-150">
                            <td className="py-4 px-6 font-bold text-white">
                              {cust.name}
                            </td>
                            <td className="py-4 px-6 font-mono text-sm">
                              {cust.mobile}
                            </td>
                            <td className="py-4 px-6 font-mono text-sm text-slate-400">
                              {cust.alternateMobile || '—'}
                            </td>
                            <td className="py-4 px-6">
                              <span className="bg-slate-850 px-3 py-1 rounded-full text-xs font-semibold text-slate-300">
                                {cust.city}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-sm text-slate-400 max-w-xs truncate" title={cust.address}>
                              {cust.address} (PIN: {cust.pincode})
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex justify-center items-center gap-2">
                                <button
                                  onClick={() => viewHistory('customer', cust, 'customers')}
                                  className="bg-violet-600/20 hover:bg-violet-600 border border-violet-700/30 hover:border-violet-600 text-violet-300 hover:text-white text-xs px-3 py-1.5 rounded-lg font-bold inline-flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                                >
                                  <Eye className="w-4 h-4" /> History
                                </button>
                                <button
                                  onClick={() => handleRaiseTicketForCustomer(cust)}
                                  className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold inline-flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                                >
                                  <Plus className="w-4 h-4" /> Raise Request
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 bg-slate-950/40 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Showing <span className="font-semibold text-slate-200">{filteredCustomers.length === 0 ? 0 : (customerPage - 1) * 15 + 1}</span> to <span className="font-semibold text-slate-200">{Math.min(customerPage * 15, filteredCustomers.length)}</span> of <span className="font-semibold text-slate-200">{filteredCustomers.length}</span> entries
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCustomerPage(prev => Math.max(prev - 1, 1))}
                      disabled={customerPage === 1}
                      className="px-3 py-1.5 rounded-lg bg-slate-850 text-slate-350 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition text-xs font-bold"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.ceil(filteredCustomers.length / 15) }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCustomerPage(page)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                          page === customerPage
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'bg-slate-850 text-slate-350 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCustomerPage(prev => Math.min(prev + 1, Math.max(1, Math.ceil(filteredCustomers.length / 15))))}
                      disabled={customerPage === Math.max(1, Math.ceil(filteredCustomers.length / 15))}
                      className="px-3 py-1.5 rounded-lg bg-slate-850 text-slate-350 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition text-xs font-bold"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Inline History View Page */}
          {activeTab === 'history_view' && (
            <div className="space-y-8">
              {/* Back Navigation & Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <button 
                    onClick={() => setActiveTab(historyTabBack || 'dashboard')}
                    className="flex items-center gap-2 text-violet-400 hover:text-violet-355 text-sm font-bold transition cursor-pointer"
                  >
                    <span>←</span> Back to {historyTabBack ? historyTabBack.charAt(0).toUpperCase() + historyTabBack.slice(1) : 'Dashboard'}
                  </button>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                    {historyContext === 'customer' && <UserCheck className="w-8 h-8 text-violet-400" />}
                    {historyContext === 'dealer' && <Users className="w-8 h-8 text-violet-400" />}
                    {historyContext === 'technician' && <Wrench className="w-8 h-8 text-violet-400" />}
                    History: {historyEntity?.name}
                  </h1>
                  <p className="text-slate-400 text-sm">
                    {historyContext === 'customer' && `Mobile: ${historyEntity?.mobile} | Address: ${historyEntity?.address}, ${historyEntity?.city} (PIN: ${historyEntity?.pincode})`}
                    {historyContext === 'dealer' && `Dealer Code: ${historyEntity?.code} | City: ${historyEntity?.city} | Mobile: ${historyEntity?.mobile} | Contact: ${historyEntity?.contactPerson}`}
                    {historyContext === 'technician' && `Technician Code: ${historyEntity?.code} | Mobile: ${historyEntity?.mobile} | Email: ${historyEntity?.email}`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Sub-search Inside History */}
                  <div className="relative w-full md:w-80">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="w-5 h-5 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search history by ticket, category..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-violet-600 focus:border-transparent transition"
                      value={historySearchQuery}
                      onChange={e => setHistorySearchQuery(e.target.value)}
                    />
                  </div>
                  {historyContext === 'customer' && (
                    <button
                      onClick={() => handleRaiseTicketForCustomer(historyEntity)}
                      className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-violet-600/20 text-sm flex items-center gap-2 cursor-pointer transition duration-150 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Raise Request
                    </button>
                  )}
                </div>
              </div>
              
              {/* Technician Date-based Performance Filter */}
              {historyContext === 'technician' && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-wrap items-end gap-6">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">FROM DATE</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
                      value={techFromDate}
                      onChange={e => setTechFromDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">TO DATE</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
                      value={techToDate}
                      onChange={e => setTechToDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">TICKET STATUS</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
                      value={techStatusFilter}
                      onChange={e => setTechStatusFilter(e.target.value)}
                    >
                      <option value="assigned_completed">Assigned & Completed</option>
                      <option value="assigned">Assigned</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <button
                      onClick={fetchTechnicianHistory}
                      className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition duration-150 cursor-pointer shadow-md"
                    >
                      GO
                    </button>
                  </div>
                </div>
              )}              {/* Dealer Date-based Filter */}
              {historyContext === 'dealer' && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-wrap items-end gap-6">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">FROM DATE</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
                      value={dealerFromDate}
                      onChange={e => setDealerFromDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">TO DATE</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
                      value={dealerToDate}
                      onChange={e => setDealerToDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <button
                      onClick={fetchDealerHistory}
                      className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition duration-150 cursor-pointer shadow-md"
                    >
                      GO
                    </button>
                  </div>
                </div>
              )}

              {/* Stats Counters inside history */}
              {historyContext === 'technician' ? (
                techStatusFilter === 'assigned' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                      <span className="text-slate-500 text-xs font-semibold uppercase">Total Requests</span>
                      <p className="text-2xl font-bold text-white mt-1">{techPerformanceStats.total}</p>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                      <span className="text-amber-500/80 text-xs font-semibold uppercase">In Progress / Assigned</span>
                      <p className="text-2xl font-bold text-amber-400 mt-1">{techPerformanceStats.inProgress}</p>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                      <span className="text-violet-400 text-xs font-semibold uppercase">Earnings</span>
                      <p className="text-2xl font-bold text-violet-400 mt-1">₹ {techPerformanceStats.earnings ?? 0}</p>
                    </div>
                  </div>
                ) : techStatusFilter === 'completed' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                      <span className="text-emerald-500/80 text-xs font-semibold uppercase">Completed</span>
                      <p className="text-2xl font-bold text-emerald-400 mt-1">{techPerformanceStats.completed}</p>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                      <span className="text-yellow-500/80 text-xs font-semibold uppercase">Pending Verification</span>
                      <p className="text-2xl font-bold text-yellow-400 mt-1">{techPerformanceStats.pendingVerification}</p>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                      <span className="text-violet-400 text-xs font-semibold uppercase">Earnings</span>
                      <p className="text-2xl font-bold text-violet-400 mt-1">₹ {techPerformanceStats.earnings ?? 0}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                      <span className="text-slate-500 text-xs font-semibold uppercase">Total Requests</span>
                      <p className="text-2xl font-bold text-white mt-1">{techPerformanceStats.total}</p>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                      <span className="text-emerald-500/80 text-xs font-semibold uppercase">Completed</span>
                      <p className="text-2xl font-bold text-emerald-400 mt-1">{techPerformanceStats.completed}</p>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                      <span className="text-amber-500/80 text-xs font-semibold uppercase">In Progress / Assigned</span>
                      <p className="text-2xl font-bold text-amber-400 mt-1">{techPerformanceStats.inProgress}</p>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                      <span className="text-yellow-500/80 text-xs font-semibold uppercase">Pending Verification</span>
                      <p className="text-2xl font-bold text-yellow-400 mt-1">{techPerformanceStats.pendingVerification}</p>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                      <span className="text-violet-400 text-xs font-semibold uppercase">Earnings</span>
                      <p className="text-2xl font-bold text-violet-400 mt-1">₹ {techPerformanceStats.earnings ?? 0}</p>
                    </div>
                  </div>
                )
              ) : historyContext === 'dealer' ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                    <span className="text-slate-500 text-xs font-semibold uppercase">Total Requests</span>
                    <p className="text-2xl font-bold text-white mt-1">
                      {isDealerFilterApplied ? dealerPerformanceStats.total : historyTickets.length}
                    </p>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                    <span className="text-emerald-500/80 text-xs font-semibold uppercase">Completed</span>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                      {isDealerFilterApplied
                        ? dealerPerformanceStats.completed
                        : historyTickets.filter(t => t.status === 'completed' || t.status === 'closed').length}
                    </p>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                    <span className="text-amber-500/80 text-xs font-semibold uppercase">In Progress / Assigned</span>
                    <p className="text-2xl font-bold text-amber-400 mt-1">
                      {isDealerFilterApplied
                        ? dealerPerformanceStats.inProgress
                        : historyTickets.filter(t => t.status === 'assigned' || t.status === 'in_progress').length}
                    </p>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                    <span className="text-yellow-500/80 text-xs font-semibold uppercase">Pending Verification</span>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">
                      {isDealerFilterApplied
                        ? dealerPerformanceStats.pendingVerification
                        : historyTickets.filter(t => t.status === 'verification_pending').length}
                    </p>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                    <span className="text-violet-400 text-xs font-semibold uppercase">Expenses</span>
                    <p className="text-2xl font-bold text-violet-400 mt-1">
                      ₹ {(isDealerFilterApplied
                        ? (dealerPerformanceStats.expenses ?? 0)
                        : historyTickets.reduce((acc, t) => {
                            if (t.status === 'completed' || t.status === 'closed') {
                              if (typeof t.dealerExpense === 'number') {
                                return acc + t.dealerExpense;
                              }
                            }
                            return acc;
                          }, 0)
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                    <span className="text-slate-500 text-xs font-semibold uppercase">Total Requests</span>
                    <p className="text-2xl font-bold text-white mt-1">{historyTickets.length}</p>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                    <span className="text-emerald-500/80 text-xs font-semibold uppercase">Completed</span>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                      {historyTickets.filter(t => t.status === 'completed' || t.status === 'closed').length}
                    </p>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                    <span className="text-amber-500/80 text-xs font-semibold uppercase">In Progress / Assigned</span>
                    <p className="text-2xl font-bold text-amber-400 mt-1">
                      {historyTickets.filter(t => t.status === 'assigned' || t.status === 'in_progress').length}
                    </p>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                    <span className="text-yellow-500/80 text-xs font-semibold uppercase">Pending Verification</span>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">
                      {historyTickets.filter(t => t.status === 'verification_pending').length}
                    </p>
                  </div>
                </div>
              )}

              {/* Requests List */}
              <div className="space-y-4">
                {(() => {
                  const filtered = historyTickets.filter(t => {
                    const s = historySearchQuery.toLowerCase();
                    return (
                      (t.ticketNumber && t.ticketNumber.toLowerCase().includes(s)) ||
                      (t.product?.category && t.product.category.toLowerCase().includes(s)) ||
                      (t.product?.name && t.product.name.toLowerCase().includes(s)) ||
                      (t.customer?.name && t.customer.name.toLowerCase().includes(s)) ||
                      (t.status && t.status.toLowerCase().includes(s))
                    );
                  });

                  return (
                    <>
                      {filtered.length === 0 ? (
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl py-16 text-center text-slate-500 text-sm">
                          No matching service or repair requests found.
                        </div>
                      ) : (
                        filtered.slice((historyPage - 1) * 10, historyPage * 10).map(ticket => (
                          <div key={ticket._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:shadow-xl transition duration-150">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-black text-white">{ticket.ticketNumber}</span>
                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                                  ticket.type === 'installation' ? 'bg-cyan-950 text-cyan-400 border border-cyan-900/50' : 'bg-amber-950 text-amber-400 border border-amber-900/50'
                                }`}>
                                  {ticket.type}
                                </span>
                              </div>
                              <span className={`text-xs px-3 py-1.5 rounded-xl font-bold uppercase ${
                                ticket.status === 'completed' ? 'bg-emerald-950 text-emerald-400' :
                                ticket.status === 'pending' ? 'bg-yellow-950 text-yellow-400' :
                                ticket.status === 'assigned' ? 'bg-blue-950 text-blue-400' :
                                'bg-slate-800 text-slate-400'
                              }`}>
                                {ticket.status}
                              </span>
                            </div>
                            
                             <div className={`grid grid-cols-1 ${ticket.status === 'completed' || ticket.status === 'closed' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-6 text-sm`}>
                              <div className="space-y-1">
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Customer Details</p>
                                <p className="text-white font-bold">{ticket.customer?.name}</p>
                                <p className="text-slate-450">{ticket.customer?.mobile} | {ticket.customer?.city}</p>
                                <p className="text-slate-450 text-xs truncate max-w-xs">{ticket.customer?.address}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Product & Device</p>
                                <p className="text-white font-bold">{ticket.product?.category} - {ticket.product?.name}</p>
                                <p className="text-slate-450 font-mono text-xs">Model: {ticket.product?.modelNumber || '—'}</p>
                                <p className="text-slate-450 font-mono text-xs">Serial: {ticket.product?.serialNumber || '—'}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Partner Assignments</p>
                                <p className="text-white font-medium">Dealer: {ticket.dealer?.name || '—'}</p>
                                <p className="text-slate-450">Tech: {ticket.assignedTechnician?.name || 'Unassigned'}</p>
                                <p className="text-slate-500 text-xs">Created: {new Date(ticket.createdAt).toLocaleString()}</p>
                              </div>
                              {(ticket.status === 'completed' || ticket.status === 'closed') && (
                                <div className="space-y-1">
                                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Expense</p>
                                  <p className="text-white font-bold">
                                    {typeof ticket.dealerExpense === 'number'
                                      ? `₹ ${ticket.dealerExpense}`
                                      : ticket.dealerExpense || 'Fee Not Configured'}
                                  </p>
                                </div>
                              )}
                            </div>

                            {ticket.serviceDetails?.description && (
                              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-sm">
                                <p className="text-slate-500 text-xs font-bold mb-1.5 uppercase">Issue Description:</p>
                                <p className="text-slate-300 italic font-mono">"{ticket.serviceDetails.description}"</p>
                              </div>
                            )}
                          </div>
                        ))
                      )}

                      {/* Pagination footer */}
                      <div className="px-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between mt-6">
                        <div className="text-xs text-slate-400">
                          Showing <span className="font-semibold text-slate-200">{filtered.length === 0 ? 0 : (historyPage - 1) * 10 + 1}</span> to <span className="font-semibold text-slate-200">{Math.min(historyPage * 10, filtered.length)}</span> of <span className="font-semibold text-slate-200">{filtered.length}</span> entries
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setHistoryPage(prev => Math.max(prev - 1, 1))}
                            disabled={historyPage === 1}
                            className="px-3 py-1.5 rounded-lg bg-slate-850 text-slate-350 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition text-xs font-bold"
                          >
                            Previous
                          </button>
                          {Array.from({ length: Math.ceil(filtered.length / 10) }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => setHistoryPage(page)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                                page === historyPage
                                  ? 'bg-violet-600 text-white shadow-md'
                                  : 'bg-slate-850 text-slate-350 hover:bg-slate-800 hover:text-white'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                          <button
                            onClick={() => setHistoryPage(prev => Math.min(prev + 1, Math.max(1, Math.ceil(filtered.length / 10))))}
                            disabled={historyPage === Math.max(1, Math.ceil(filtered.length / 10))}
                            className="px-3 py-1.5 rounded-lg bg-slate-850 text-slate-355 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition text-xs font-bold"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Follow-ups Tab */}
          {activeTab === 'followups' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Follow-ups Dashboard</h1>
                <p className="text-slate-400 mt-1">Manage scheduled customer follow-up actions</p>
              </div>

              {/* Filters */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-wrap gap-4 items-end shadow-xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">From Date</label>
                  <input
                    type="date"
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                    value={followUpFilters.fromDate}
                    onChange={e => setFollowUpFilters({ ...followUpFilters, fromDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">To Date</label>
                  <input
                    type="date"
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                    value={followUpFilters.toDate}
                    onChange={e => setFollowUpFilters({ ...followUpFilters, toDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Listing Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800/50 border-b border-slate-800">
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Due Date</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Mobile</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Appliance</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Brand</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Address</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {followUps.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="p-8 text-center text-slate-500 text-sm">No follow-ups found for the selected date range.</td>
                        </tr>
                      ) : (
                        followUps.slice((followUpPage - 1) * 15, followUpPage * 15).map(f => (
                          <tr key={f._id} className="hover:bg-slate-800/20 transition">
                            <td className="p-4 text-sm font-semibold text-slate-200">
                              {new Date(f.dueAt).toLocaleDateString('en-GB')}
                            </td>
                            <td className="p-4 text-sm text-white font-medium">
                              {f.ticket?.customer?.name || 'N/A'}
                            </td>
                            <td className="p-4 text-sm text-slate-300">
                              {f.ticket?.customer?.mobile || 'N/A'}
                            </td>
                            <td className="p-4 text-sm text-slate-300">
                              {f.ticket?.product?.category || 'N/A'}
                            </td>
                            <td className="p-4 text-sm text-slate-300">
                              {f.ticket?.product?.name || 'N/A'}
                            </td>
                            <td className="p-4 text-sm text-slate-400 truncate max-w-xs">
                              {f.ticket?.customer?.address || 'N/A'}
                            </td>
                            <td className="p-4 text-sm">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${f.status === 'new' ? 'bg-violet-950 text-violet-300' : 'bg-emerald-950 text-emerald-400'}`}>
                                {f.status === 'new' ? 'New' : 'Closed'}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-right space-x-2">
                              {f.ticket && (
                                <button
                                  onClick={() => setSelectedTicket(f.ticket)}
                                  className="text-xs font-bold text-violet-400 hover:text-violet-300 cursor-pointer"
                                >
                                  View Ticket
                                </button>
                              )}
                              {f.status === 'new' && (
                                <button
                                  onClick={() => markFollowUpClosed(f._id)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer"
                                >
                                  Mark Closed
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 bg-slate-950/40 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Showing <span className="font-semibold text-slate-200">{followUps.length === 0 ? 0 : (followUpPage - 1) * 15 + 1}</span> to <span className="font-semibold text-slate-200">{Math.min(followUpPage * 15, followUps.length)}</span> of <span className="font-semibold text-slate-200">{followUps.length}</span> entries
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFollowUpPage(prev => Math.max(prev - 1, 1))}
                      disabled={followUpPage === 1}
                      className="px-3 py-1.5 rounded-lg bg-slate-850 text-slate-350 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition text-xs font-bold"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.ceil(followUps.length / 15) }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setFollowUpPage(page)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                          page === followUpPage
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'bg-slate-850 text-slate-355 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setFollowUpPage(prev => Math.min(prev + 1, Math.max(1, Math.ceil(followUps.length / 15))))}
                      disabled={followUpPage === Math.max(1, Math.ceil(followUps.length / 15))}
                      className="px-3 py-1.5 rounded-lg bg-slate-850 text-slate-350 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition text-xs font-bold"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-8">
              {/* Page Title */}
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Reports</h1>
                <p className="text-slate-400 mt-1">Generate and export business financial reports</p>
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => { setReportTab('expense'); setReportsData([]); setAppliedFiltersSummary(null); }}
                  className={`px-6 py-3 font-bold text-sm border-b-2 transition duration-200 cursor-pointer ${
                    reportTab === 'expense'
                      ? 'border-violet-500 text-violet-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Expense Report
                </button>
                <button
                  onClick={() => { setReportTab('earning'); setReportsData([]); setAppliedFiltersSummary(null); }}
                  className={`px-6 py-3 font-bold text-sm border-b-2 transition duration-200 cursor-pointer ${
                    reportTab === 'earning'
                      ? 'border-violet-500 text-violet-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Earning Report
                </button>
              </div>

              {/* Filters Block */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-violet-400" />
                  {reportTab === 'expense' ? 'Expense Report Filters' : 'Earning Report Filters'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* From Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">From Date</label>
                    <input
                      type="date"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                      value={reportFilters.fromDate}
                      onChange={e => setReportFilters({ ...reportFilters, fromDate: e.target.value })}
                    />
                  </div>

                  {/* To Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">To Date</label>
                    <input
                      type="date"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                      value={reportFilters.toDate}
                      onChange={e => setReportFilters({ ...reportFilters, toDate: e.target.value })}
                    />
                  </div>

                  {/* Dealer Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Dealer</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500 cursor-pointer"
                      value={reportFilters.dealer}
                      onChange={e => setReportFilters({ ...reportFilters, dealer: e.target.value })}
                    >
                      <option value="ALL">ALL DEALERS</option>
                      {dealers.map(d => (
                        <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* Technician Filter (Only show for Earning Report) */}
                  {reportTab === 'earning' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Technician</label>
                      <select
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500 cursor-pointer"
                        value={reportFilters.technician}
                        onChange={e => setReportFilters({ ...reportFilters, technician: e.target.value })}
                      >
                        <option value="ALL">ALL TECHNICIANS</option>
                        {technicians.map(t => (
                          <option key={t._id} value={t._id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Ticket Type */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ticket Type</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500 cursor-pointer"
                      value={reportFilters.ticketType}
                      onChange={e => setReportFilters({ ...reportFilters, ticketType: e.target.value })}
                    >
                      <option value="ALL">ALL</option>
                      <option value="SERVICE">SERVICE</option>
                      <option value="INSTALLATION">INSTALLATION</option>
                    </select>
                  </div>

                  {/* Appliance Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Appliance Category</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500 cursor-pointer"
                      value={reportFilters.category}
                      onChange={e => {
                        const newCat = e.target.value;
                        const availableBrands = brands
                          .filter(b => newCat === 'ALL' || (b.appliance?.name && b.appliance.name.trim().toLowerCase() === newCat.trim().toLowerCase()))
                          .map(b => b.name);
                        const currentBrand = reportFilters.brand;
                        const nextBrand = (currentBrand === 'ALL' || availableBrands.includes(currentBrand)) ? currentBrand : 'ALL';
                        setReportFilters({ ...reportFilters, category: newCat, brand: nextBrand });
                      }}
                    >
                      <option value="ALL">ALL CATEGORIES</option>
                      {appliances.map(a => (
                        <option key={a._id} value={a.name}>{a.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Brand</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500 cursor-pointer"
                      value={reportFilters.brand}
                      onChange={e => setReportFilters({ ...reportFilters, brand: e.target.value })}
                    >
                      <option value="ALL">ALL BRANDS</option>
                      {Array.from(new Set(
                        brands
                          .filter(b => reportFilters.category === 'ALL' || (b.appliance?.name && b.appliance.name.trim().toLowerCase() === reportFilters.category.trim().toLowerCase()))
                          .map(b => b.name)
                      )).map(brandName => (
                        <option key={brandName} value={brandName}>{brandName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={resetReportFilters}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer"
                  >
                    RESET
                  </button>
                  <button
                    onClick={() => generateReport(1)}
                    className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer"
                  >
                    GENERATE REPORT
                  </button>
                </div>
              </div>

              {/* Report Content */}
              {reportsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
                  <p className="text-slate-400 text-sm font-medium">Generating report...</p>
                </div>
              ) : appliedFiltersSummary ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {reportTab === 'expense' ? 'TOTAL EXPENSE' : 'TOTAL EARNINGS'}
                      </span>
                      <span className="text-2xl font-black text-white mt-2">
                        ₹ {reportsSummary.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">COMPLETED TICKETS</span>
                      <span className="text-2xl font-black text-white mt-2">{reportsSummary.completedCount}</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {reportTab === 'expense' ? 'SERVICE EXPENSE' : 'SERVICE EARNINGS'}
                      </span>
                      <span className="text-2xl font-black text-violet-400 mt-2">
                        ₹ {reportsSummary.serviceAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {reportTab === 'expense' ? 'INSTALLATION EXPENSE' : 'INSTALLATION EARNINGS'}
                      </span>
                      <span className="text-2xl font-black text-indigo-400 mt-2">
                        ₹ {reportsSummary.installationAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Applied Filters Summary & Export Block */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Applied Filters</p>
                      <div className="text-sm text-slate-200 font-semibold space-y-0.5">
                        <div>Period: <span className="text-slate-400">{new Date(appliedFiltersSummary.fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} – {new Date(appliedFiltersSummary.toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
                        <div>Dealer: <span className="text-slate-400">{appliedFiltersSummary.dealer === 'ALL' ? 'All Dealers' : dealers.find(d => d._id === appliedFiltersSummary.dealer)?.name || 'N/A'}</span></div>
                        {reportTab === 'earning' && (
                          <div>Technician: <span className="text-slate-400">{appliedFiltersSummary.technician === 'ALL' ? 'All Technicians' : technicians.find(t => t._id === appliedFiltersSummary.technician)?.name || 'N/A'}</span></div>
                        )}
                        <div>Type: <span className="text-slate-400 capitalize">{appliedFiltersSummary.ticketType}</span></div>
                        <div>Category: <span className="text-slate-400">{appliedFiltersSummary.category}</span></div>
                        <div>Brand: <span className="text-slate-400">{appliedFiltersSummary.brand}</span></div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={exportToCSV}
                        className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2.5 rounded-lg font-bold transition cursor-pointer"
                      >
                        EXPORT CSV
                      </button>
                      <button
                        onClick={exportToExcel}
                        className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2.5 rounded-lg font-bold transition cursor-pointer"
                      >
                        EXPORT EXCEL
                      </button>
                    </div>
                  </div>

                  {/* Report Data Table */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-800/50 border-b border-slate-800">
                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket ID</th>
                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Date</th>
                            {reportTab === 'expense' ? (
                              <>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Dealer</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket Type</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Appliance Category</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Brand</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Technician</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Dealer Expense</th>
                              </>
                            ) : (
                              <>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Technician</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Dealer</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket Type</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Appliance Category</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Brand</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Technician Earning</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {reportsData.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-slate-500 text-sm font-medium">
                                {reportTab === 'expense' ? 'No expense records found' : 'No earning records found'}
                              </td>
                            </tr>
                          ) : (
                            reportsData.map(t => {
                              const completedDate = t.adminVerification?.verifiedAt 
                                ? new Date(t.adminVerification.verifiedAt).toLocaleDateString('en-GB') 
                                : t.closedAt 
                                  ? new Date(t.closedAt).toLocaleDateString('en-GB') 
                                  : new Date(t.updatedAt).toLocaleDateString('en-GB');

                              const expVal = reportTab === 'expense' ? t.dealerExpense : t.technicianEarning;
                              const amountText = typeof expVal === 'number' ? `₹ ${expVal}` : expVal;

                              return (
                                <tr key={t._id} className="hover:bg-slate-800/20 transition duration-150">
                                  <td className="p-4 text-sm font-bold text-white">
                                    <button 
                                      onClick={() => setSelectedTicket(t)}
                                      className="hover:text-violet-400 transition cursor-pointer text-left"
                                    >
                                      {t.ticketNumber}
                                    </button>
                                  </td>
                                  <td className="p-4 text-sm text-slate-300">{completedDate}</td>
                                  {reportTab === 'expense' ? (
                                    <>
                                      <td className="p-4 text-sm text-slate-200 font-medium">{t.dealer?.name || 'N/A'}</td>
                                      <td className="p-4 text-sm">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${t.type === 'service' ? 'bg-amber-950 text-amber-400' : 'bg-blue-950 text-blue-400'}`}>
                                          {(t.type || '').toUpperCase()}
                                        </span>
                                      </td>
                                      <td className="p-4 text-sm text-slate-300">{t.product?.category || 'N/A'}</td>
                                      <td className="p-4 text-sm text-slate-300">{t.product?.name || 'N/A'}</td>
                                      <td className="p-4 text-sm text-slate-300">{t.customer?.name || 'N/A'}</td>
                                      <td className="p-4 text-sm text-slate-300">{t.assignedTechnician?.name || 'N/A'}</td>
                                      <td className={`p-4 text-sm text-right font-bold ${expVal === 'Fee Not Configured' ? 'text-red-400' : 'text-violet-400'}`}>
                                        {amountText}
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="p-4 text-sm text-slate-200 font-medium">{t.assignedTechnician?.name || 'N/A'}</td>
                                      <td className="p-4 text-sm text-slate-300">{t.dealer?.name || 'N/A'}</td>
                                      <td className="p-4 text-sm">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${t.type === 'service' ? 'bg-amber-950 text-amber-400' : 'bg-blue-950 text-blue-400'}`}>
                                          {(t.type || '').toUpperCase()}
                                        </span>
                                      </td>
                                      <td className="p-4 text-sm text-slate-300">{t.product?.category || 'N/A'}</td>
                                      <td className="p-4 text-sm text-slate-300">{t.product?.name || 'N/A'}</td>
                                      <td className="p-4 text-sm text-slate-300">{t.customer?.name || 'N/A'}</td>
                                      <td className={`p-4 text-sm text-right font-bold ${expVal === 'Fee Not Configured' ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {amountText}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination / Total Block */}
                    {reportsData.length > 0 && (
                      <div className="px-6 py-4 bg-slate-950/40 border-t border-slate-800/80 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-300">
                            {reportTab === 'expense' ? 'TOTAL EXPENSE:' : 'TOTAL EARNINGS:'}
                          </span>
                          <span className="text-lg font-black text-white">
                            ₹ {reportsSummary.totalAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="text-xs text-slate-400">
                            Showing <span className="font-semibold text-slate-200">{(reportsPage - 1) * 25 + 1}</span> to <span className="font-semibold text-slate-200">{Math.min(reportsPage * 25, reportsTotalCount)}</span> of <span className="font-semibold text-slate-200">{reportsTotalCount}</span> records
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => generateReport(reportsPage - 1)}
                              disabled={reportsPage === 1}
                              className="px-3 py-1.5 rounded-lg bg-slate-850 text-slate-350 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition text-xs font-bold cursor-pointer"
                            >
                              Previous
                            </button>
                            {Array.from({ length: Math.ceil(reportsTotalCount / 25) }, (_, i) => i + 1).map(page => (
                              <button
                                key={page}
                                onClick={() => generateReport(page)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                                  page === reportsPage
                                    ? 'bg-violet-600 text-white shadow-md'
                                    : 'bg-slate-850 text-slate-350 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                            <button
                              onClick={() => generateReport(reportsPage + 1)}
                              disabled={reportsPage === Math.max(1, Math.ceil(reportsTotalCount / 25))}
                              className="px-3 py-1.5 rounded-lg bg-slate-850 text-slate-355 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition text-xs font-bold cursor-pointer"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
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
                  <input 
                    required 
                    type="text" 
                    maxLength={10}
                    placeholder="10 digit mobile"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" 
                    value={dealerForm.mobile} 
                    onChange={e => setDealerForm({
                      ...dealerForm, 
                      mobile: e.target.value.replace(/\D/g, '').slice(0, 10)
                    })} 
                  />
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
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
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
                <input 
                  required 
                  type="text" 
                  maxLength={10}
                  placeholder="10 digit mobile"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" 
                  value={techForm.mobile} 
                  onChange={e => setTechForm({
                    ...techForm, 
                    mobile: e.target.value.replace(/\D/g, '').slice(0, 10)
                  })} 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <input required type="email" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" value={techForm.email} onChange={e => setTechForm({...techForm, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
                <input type="text" placeholder={techForm.id ? "Keep blank to leave unchanged" : "Password (default: tech@123)"} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" value={techForm.password} onChange={e => setTechForm({...techForm, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Associate Appliances</label>
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 max-h-32 overflow-y-auto space-y-2">
                  {appliances.map(app => {
                    const isChecked = techForm.appliances ? techForm.appliances.includes(app._id) : false;
                    return (
                      <label key={app._id} className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            let list = [...(techForm.appliances || [])];
                            if (e.target.checked) {
                              list.push(app._id);
                            } else {
                              list = list.filter(id => id !== app._id);
                            }
                            setTechForm({ ...techForm, appliances: list });
                          }}
                          className="rounded border-slate-600 bg-slate-700 text-violet-600 focus:ring-violet-500"
                        />
                        <span>{app.name}</span>
                      </label>
                    );
                  })}
                </div>
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
              <button onClick={() => { setSelectedTicket(null); setShowCancelForm(false); setCancelReason(''); fetchData(); fetchDashboardData(); }} className="text-slate-400 hover:text-slate-200 cursor-pointer"><X className="w-6 h-6" /></button>
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
                      <p className="text-xs text-slate-500 font-semibold">Preferred Visit Date & Time</p>
                      <p className="font-bold text-slate-200">
                        {selectedTicket.preferredVisitDate 
                          ? new Date(selectedTicket.preferredVisitDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) 
                          : selectedTicket.installationDetails?.preferredDate 
                            ? new Date(selectedTicket.installationDetails.preferredDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) 
                            : 'Flexible'}
                      </p>
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
                        <a href={selectedTicket.invoiceImage.startsWith('http') ? selectedTicket.invoiceImage : `${API_BASE.startsWith('http') ? new URL(API_BASE).origin : ''}/${selectedTicket.invoiceImage}`} target="_blank" rel="noreferrer" className="text-violet-400 hover:text-violet-300 text-xs font-bold underline mt-1 inline-block">View Uploaded Invoice Image</a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Technician Completion Uploads */}
                {(() => {
                  const completionsList = selectedTicket.completionHistory && selectedTicket.completionHistory.length > 0
                    ? selectedTicket.completionHistory
                    : (selectedTicket.completion?.workDone ? [selectedTicket.completion] : []);
                  
                  return completionsList.map((comp, idx) => {
                    const submissionLabel = completionsList.length > 1
                      ? `${idx + 1}${idx === 0 ? 'st' : idx === 1 ? 'nd' : idx === 2 ? 'rd' : 'th'} Completion Submission`
                      : "Technician Job Submission";
                    
                    return (
                      <div key={idx} className="bg-slate-800/40 border border-slate-850 p-5 rounded-2xl space-y-4">
                        <h4 className="font-bold text-white text-sm border-b border-slate-700 pb-2 flex items-center justify-between">
                          <span>{submissionLabel}</span>
                          <span className="text-xs text-slate-400">{new Date(comp.submittedAt).toLocaleString()}</span>
                        </h4>
                        <div className="text-sm text-slate-300 space-y-2">
                          <p><span className="text-slate-500 font-semibold">Work Done:</span> {comp.workDone}</p>
                          <p><span className="text-slate-500 font-semibold">Remarks:</span> {comp.remarks || 'None'}</p>
                        </div>
                        {comp.photos && comp.photos.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-500 font-semibold mb-2">Completion Photos</p>
                            <div className="grid grid-cols-3 gap-2">
                              {comp.photos.map((photo, i) => (
                                <a key={i} href={photo.startsWith('http') ? photo : `${API_BASE.startsWith('http') ? new URL(API_BASE).origin : ''}/${photo}`} target="_blank" rel="noreferrer">
                                  <img src={photo.startsWith('http') ? photo : `${API_BASE.startsWith('http') ? new URL(API_BASE).origin : ''}/${photo}`} alt="Completion" className="rounded-lg object-cover w-full h-24 border border-slate-700" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}

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
                        {activeTechniciansForAssign.map(tech => (
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

                  {selectedTicket.status === 'cancelled' && (
                    <div className="bg-rose-950/40 border border-rose-900/30 p-3 rounded-xl text-rose-400 text-xs font-semibold space-y-1">
                      <p>Ticket Cancelled</p>
                      {(() => {
                        const cancelTimeline = selectedTicket.timeline?.slice().reverse().find(item => item.status === 'cancelled');
                        return cancelTimeline && <p className="italic text-slate-300 mt-1">Reason: {cancelTimeline.note.replace('Ticket cancelled by Admin. Reason: ', '')}</p>;
                      })()}
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

                  {selectedTicket.status !== 'closed' && selectedTicket.status !== 'cancelled' && (
                    <div className="border-t border-slate-700/50 pt-4 mt-2">
                      {!showCancelForm ? (
                        <button
                          type="button"
                          onClick={() => setShowCancelForm(true)}
                          className="w-full bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 font-bold py-2 rounded-lg text-xs cursor-pointer border border-rose-900/30 transition-all"
                        >
                          Cancel Ticket
                        </button>
                      ) : (
                        <form onSubmit={handleCancel} className="space-y-3">
                          <label className="block text-xs font-semibold text-slate-400">Reason for Cancellation</label>
                          <textarea
                            required
                            placeholder="Please specify why this ticket is being cancelled..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-hidden"
                            value={cancelReason}
                            onChange={e => setCancelReason(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-lg text-xs cursor-pointer"
                            >
                              Confirm Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowCancelForm(false);
                                setCancelReason('');
                              }}
                              className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-300 font-bold py-2 rounded-lg text-xs cursor-pointer border border-slate-700"
                            >
                              Back
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Custom Message Notification */}
                  <div className="border-t border-slate-700/50 pt-4 mt-3">
                    <button
                      type="button"
                      onClick={() => setShowMessageForm(!showMessageForm)}
                      className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200"
                    >
                      <span>Send Push Announcement</span>
                      <span>{showMessageForm ? '▲' : '▼'}</span>
                    </button>
                    {showMessageForm && (
                      <form onSubmit={handleSendCustomMessage} className="mt-3 space-y-3">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">RECIPIENT</label>
                          <select
                            required
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white cursor-pointer"
                            value={messageForm.recipient}
                            onChange={e => setMessageForm({ ...messageForm, recipient: e.target.value })}
                          >
                            <option value="dealer">Dealer</option>
                            <option value="technician">Technician</option>
                            <option value="both">Both</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">TITLE</label>
                          <input
                            required
                            type="text"
                            placeholder="Notification title..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            value={messageForm.title}
                            onChange={e => setMessageForm({ ...messageForm, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-1">BODY MESSAGE</label>
                          <textarea
                            required
                            placeholder="Write message details..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                            rows="2"
                            value={messageForm.body}
                            onChange={e => setMessageForm({ ...messageForm, body: e.target.value })}
                          />
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs cursor-pointer">
                          Send Push Notification
                        </button>
                      </form>
                    )}
                  </div>
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

      {/* Appliance Form Modal */}
      {applianceForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <h3 className="font-bold text-white">{applianceForm.id ? 'Edit Appliance Name' : 'Add New Appliance'}</h3>
              <button onClick={() => setApplianceForm(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveAppliance} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Appliance Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Washing Machine"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-violet-500"
                  value={applianceForm.name}
                  onChange={e => setApplianceForm({ ...applianceForm, name: e.target.value })}
                />
              </div>
              <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 py-2.5 rounded-lg text-sm font-bold text-white transition">
                {applianceForm.id ? 'Save Changes' : 'Create Appliance'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Brand Form Modal */}
      {brandForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <h3 className="font-bold text-white">{brandForm.id ? 'Edit Brand Config' : 'Add Brand Configuration'}</h3>
              <button onClick={() => setBrandForm(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveBrand} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Brand Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Samsung"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-violet-500"
                  value={brandForm.name}
                  onChange={e => setBrandForm({ ...brandForm, name: e.target.value })}
                />
              </div>
              {!brandForm.id && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Select Appliance Category</label>
                  <select
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-violet-500"
                    value={brandForm.applianceId}
                    onChange={e => setBrandForm({ ...brandForm, applianceId: e.target.value })}
                  >
                    {appliances.map(app => (
                      <option key={app._id} value={app._id}>{app.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Follow-up Days</label>
                <input
                  required
                  type="number"
                  min="1"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-violet-500"
                  value={brandForm.followUpDays}
                  onChange={e => setBrandForm({ ...brandForm, followUpDays: e.target.value })}
                />
              </div>
              <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 py-2.5 rounded-lg text-sm font-bold text-white transition">
                {brandForm.id ? 'Save Configuration' : 'Create Brand'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* City Form Modal */}
      {cityForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <h3 className="font-bold text-white">{cityForm.id ? 'Edit City' : 'Add New City'}</h3>
              <button onClick={() => setCityForm(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveCity} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">City Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Mumbai"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-violet-500"
                  value={cityForm.name}
                  onChange={e => setCityForm({ ...cityForm, name: e.target.value })}
                />
              </div>
              <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 py-2.5 rounded-lg text-sm font-bold text-white transition">
                {cityForm.id ? 'Save Changes' : 'Create City'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Fee Form Modal */}
      {feeForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <h3 className="font-bold text-white">Configure Fees ({feeForm.brandName})</h3>
              <button onClick={() => setFeeForm(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveFee} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Appliance Category</label>
                <input
                  disabled
                  type="text"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400 cursor-not-allowed font-medium"
                  value={feeForm.applianceName}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Brand</label>
                <input
                  disabled
                  type="text"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400 cursor-not-allowed font-medium"
                  value={feeForm.brandName}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Service Fee (₹)</label>
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="e.g. 250"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-violet-500"
                  value={feeForm.serviceFee}
                  onChange={e => setFeeForm({ ...feeForm, serviceFee: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Installation Fee (₹)</label>
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="e.g. 500"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-violet-500"
                  value={feeForm.installationFee}
                  onChange={e => setFeeForm({ ...feeForm, installationFee: e.target.value })}
                />
              </div>
              <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 py-2.5 rounded-lg text-sm font-bold text-white transition">
                Save Fees Configuration
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Form Modal */}
      {adminForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <h3 className="font-bold text-white">{adminForm.id ? 'Edit Admin User' : 'Add New Admin User'}</h3>
              <button onClick={() => setAdminForm(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveAdmin} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-violet-500"
                  value={adminForm.name}
                  onChange={e => setAdminForm({ ...adminForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email ID</label>
                <input
                  required
                  type="email"
                  placeholder="e.g. admin@gsp.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-violet-500"
                  value={adminForm.email}
                  onChange={e => setAdminForm({ ...adminForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Password {adminForm.id && '(leave blank to keep current)'}</label>
                <input
                  required={!adminForm.id}
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-violet-500"
                  value={adminForm.password}
                  onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">User Status</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white cursor-pointer"
                  value={adminForm.status}
                  onChange={e => setAdminForm({ ...adminForm, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Permissions Checkboxes */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Access Permissions</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(adminForm.permissions).map((permKey) => (
                    <label key={permKey} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="rounded border-slate-750 text-violet-600 focus:ring-violet-500 w-4 h-4 bg-slate-800 cursor-pointer"
                        checked={adminForm.permissions[permKey]}
                        onChange={e => setAdminForm({
                          ...adminForm,
                          permissions: {
                            ...adminForm.permissions,
                            [permKey]: e.target.checked
                          }
                        })}
                      />
                      <span className="capitalize">{permKey.replace('manage', '').replace('followups', 'follow-ups')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 py-2.5 rounded-lg text-sm font-bold text-white transition mt-4">
                {adminForm.id ? 'Save Changes' : 'Create Admin User'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Raise Request Modal */}
      {createRequestOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl my-8 overflow-hidden">
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <h3 className="font-bold text-white">Raise Installation / Service Request</h3>
              <button 
                onClick={() => setCreateRequestOpen(false)} 
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateRequest} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Request Details */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">Request Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Select Dealer *</label>
                    <select 
                      required 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white cursor-pointer"
                      value={newRequestForm.dealer}
                      onChange={e => setNewRequestForm({ ...newRequestForm, dealer: e.target.value })}
                    >
                      <option value="">-- Choose Dealer --</option>
                      {dealers.map(d => (
                        <option key={d._id} value={d._id}>{d.name} ({d.city})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Request Type *</label>
                    <select 
                      required 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white cursor-pointer"
                      value={newRequestForm.type}
                      onChange={e => setNewRequestForm({ ...newRequestForm, type: e.target.value })}
                    >
                      <option value="installation">Installation</option>
                      <option value="service">Service Request</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Preferred Visit Date & Time *</label>
                    <input 
                      required 
                      type="datetime-local" 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      value={newRequestForm.preferredVisitDate}
                      onChange={e => setNewRequestForm({ ...newRequestForm, preferredVisitDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">Customer Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Customer Name *</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      value={newRequestForm.customer.name}
                      onChange={e => setNewRequestForm({ 
                        ...newRequestForm, 
                        customer: { ...newRequestForm.customer, name: e.target.value } 
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Mobile Number *</label>
                    <input 
                      required 
                      type="tel" 
                      pattern="[0-9]{10}"
                      maxLength={10}
                      placeholder="10 digit mobile"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      value={newRequestForm.customer.mobile}
                      onChange={e => setNewRequestForm({ 
                        ...newRequestForm, 
                        customer: { ...newRequestForm.customer, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) } 
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Alternate Mobile</label>
                    <input 
                      type="tel" 
                      maxLength={10}
                      placeholder="10 digit mobile"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      value={newRequestForm.customer.alternateMobile}
                      onChange={e => setNewRequestForm({ 
                        ...newRequestForm, 
                        customer: { ...newRequestForm.customer, alternateMobile: e.target.value.replace(/\D/g, '').slice(0, 10) } 
                      })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Address *</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      value={newRequestForm.customer.address}
                      onChange={e => setNewRequestForm({ 
                        ...newRequestForm, 
                        customer: { ...newRequestForm.customer, address: e.target.value } 
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">City *</label>
                    <select 
                      required 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white cursor-pointer"
                      value={newRequestForm.customer.city}
                      onChange={e => setNewRequestForm({ 
                        ...newRequestForm, 
                        customer: { ...newRequestForm.customer, city: e.target.value } 
                      })}
                    >
                      <option value="">-- Choose City --</option>
                      {cities.filter(c => c.isActive).map(c => (
                        <option key={c._id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Pincode *</label>
                    <input 
                      required 
                      type="text" 
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="6 digit pincode"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      value={newRequestForm.customer.pincode}
                      onChange={e => setNewRequestForm({ 
                        ...newRequestForm, 
                        customer: { ...newRequestForm.customer, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) } 
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Product details */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">Product Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Category (Appliance) *</label>
                    <select 
                      required 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white cursor-pointer"
                      value={newRequestForm.product.category}
                      onChange={e => {
                        const appName = e.target.value;
                        setNewRequestForm({ 
                          ...newRequestForm, 
                          product: { 
                            ...newRequestForm.product, 
                            category: appName, 
                            name: '' 
                          } 
                        });
                      }}
                    >
                      <option value="">-- Choose Category --</option>
                      {appliances.map(app => (
                        <option key={app._id} value={app.name}>{app.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Product (Brand) *</label>
                    <select 
                      required 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white cursor-pointer"
                      value={newRequestForm.product.name}
                      onChange={e => setNewRequestForm({ 
                        ...newRequestForm, 
                        product: { ...newRequestForm.product, name: e.target.value } 
                      })}
                      disabled={!newRequestForm.product.category}
                    >
                      <option value="">-- Choose Brand --</option>
                      {brands
                        .filter(b => {
                          const appObj = appliances.find(a => a.name === newRequestForm.product.category);
                          return appObj && (b.appliance === appObj._id || b.appliance?._id === appObj._id);
                        })
                        .map(b => (
                          <option key={b._id} value={b.name}>{b.name}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Invoice Number</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      value={newRequestForm.product.invoiceNumber}
                      onChange={e => setNewRequestForm({ 
                        ...newRequestForm, 
                        product: { ...newRequestForm.product, invoiceNumber: e.target.value } 
                      })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Model Number</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      value={newRequestForm.product.modelNumber}
                      onChange={e => setNewRequestForm({ 
                        ...newRequestForm, 
                        product: { ...newRequestForm.product, modelNumber: e.target.value } 
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Serial Number</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      value={newRequestForm.product.serialNumber}
                      onChange={e => setNewRequestForm({ 
                        ...newRequestForm, 
                        product: { ...newRequestForm.product, serialNumber: e.target.value } 
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Purchase Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      value={newRequestForm.product.purchaseDate}
                      onChange={e => setNewRequestForm({ 
                        ...newRequestForm, 
                        product: { ...newRequestForm.product, purchaseDate: e.target.value } 
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Type-Specific Details */}
              {newRequestForm.type === 'service' && (
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">Service Request Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Issue Description</label>
                      <textarea 
                        rows="2"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                        value={newRequestForm.serviceDetails.description}
                        onChange={e => setNewRequestForm({ 
                          ...newRequestForm, 
                          serviceDetails: { ...newRequestForm.serviceDetails, description: e.target.value } 
                        })}
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Priority *</label>
                      <select 
                        required 
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white cursor-pointer"
                        value={newRequestForm.serviceDetails.priority}
                        onChange={e => setNewRequestForm({ 
                          ...newRequestForm, 
                          serviceDetails: { ...newRequestForm.serviceDetails, priority: e.target.value } 
                        })}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Attachments & Remarks */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">Attachment & Remarks</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Invoice Image / Photo</label>
                    <input 
                      type="file" 
                      accept="image/*,.pdf"
                      className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-500 cursor-pointer disabled:opacity-50"
                      onChange={handleFileChange}
                      disabled={uploadingInvoice}
                    />
                    {uploadingInvoice && (
                      <span className="text-xs text-violet-400 mt-1 block">Uploading invoice copy...</span>
                    )}
                    {!uploadingInvoice && uploadedInvoicePath && (
                      <span className="text-xs text-emerald-400 mt-1 block">✓ Invoice copy uploaded successfully</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Remarks</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      value={newRequestForm.remarks}
                      onChange={e => setNewRequestForm({ ...newRequestForm, remarks: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => {
                    setCreateRequestOpen(false);
                    setUploadedInvoicePath('');
                  }} 
                  className="px-5 py-2.5 text-sm text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploadingInvoice}
                  className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition duration-200 cursor-pointer disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  {uploadingInvoice ? 'Uploading...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
