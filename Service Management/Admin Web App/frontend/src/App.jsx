import React, { useState, useEffect, useMemo } from 'react';
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
  Menu,
  Package,
  Video,
  Film,
  Play,
  Upload,
  Award,
  Star,
  Lock,
  Unlock,
  BarChart2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Filter,
  RotateCcw
} from 'lucide-react';

import AttendancePortal from './AttendancePortal.jsx';
import LocationMapModal from './components/LocationMapModal.jsx';
import EmployeesTab from './components/EmployeesTab.jsx';
import AttendanceTab from './components/AttendanceTab.jsx';
import EmployeeModal from './components/EmployeeModal.jsx';
import EmployeeDetailsModal from './components/EmployeeDetailsModal.jsx';
import CorrectAttendanceModal from './components/CorrectAttendanceModal.jsx';
import EditTicketModal from './components/EditTicketModal.jsx';

const API_BASE = '/api';

const MONTHS_LIST = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS_LIST = [2024, 2025, 2026, 2027, 2028];

// Donut Chart Component
const DonutChart = ({ data = [] }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const safeData = Array.isArray(data) ? data : [];
  const total = safeData.reduce((acc, item) => acc + (item.count || 0), 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-500 text-sm font-medium">
        No records in selected period
      </div>
    );
  }

  // Circle properties
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.761

  // 10 distinct, vibrant modern colors
  const colors = [
    '#8B5CF6', // Purple / Violet
    '#3B82F6', // Blue
    '#10B981', // Emerald / Green
    '#F59E0B', // Amber / Orange
    '#EF4444', // Red
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Bright Orange
    '#A855F7', // Bright Violet
    '#64748B'  // Slate / Gray for Others
  ];

  let accumulatedPercentage = 0;

  const activeItem = hoveredIdx !== null ? safeData[hoveredIdx] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-40 h-40 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {safeData.map((item, idx) => {
            const count = item.count || 0;
            const percentage = count / total;
            const strokeDasharray = `${percentage * circumference} ${circumference * (1 - percentage)}`;
            const strokeDashoffset = -(accumulatedPercentage * circumference);
            accumulatedPercentage += percentage;
            
            // Assign specific color or slate for "Others"
            const color = item.name === 'Others' ? '#64748B' : colors[idx % colors.length];
            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={idx}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth={isHovered ? 15 : 12}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <title>{`${item.name}: ${count} (${(percentage * 100).toFixed(1)}%)`}</title>
              </circle>
            );
          })}
          <circle cx="50" cy="50" r="26" fill="#0f172a" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
          {activeItem ? (
            <>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider truncate max-w-[85px]" title={activeItem.name}>
                {activeItem.name}
              </span>
              <span className="text-lg font-black text-white leading-tight">
                {activeItem.count}
              </span>
              <span className="text-[9px] font-bold text-violet-400 font-mono">
                {((activeItem.count / total) * 100).toFixed(1)}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total</span>
              <span className="text-xl font-black text-white">{total}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 w-full space-y-2 max-h-48 overflow-y-auto pr-1">
        {safeData.map((item, idx) => {
          const count = item.count || 0;
          const percentage = ((count / total) * 100).toFixed(1);
          const color = item.name === 'Others' ? '#64748B' : colors[idx % colors.length];
          const isHovered = hoveredIdx === idx;
          return (
            <div 
              key={idx} 
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between text-xs py-1 px-2 rounded-lg transition cursor-pointer ${isHovered ? 'bg-slate-800/80 shadow-sm' : 'hover:bg-slate-800/40'}`}
              title={`${item.name}: ${count} (${percentage}%)`}
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className={`font-semibold truncate transition ${isHovered ? 'text-white font-bold' : 'text-slate-300'}`}>
                  {item.name || 'Unknown'}
                </span>
              </div>
              <div className="flex-shrink-0 space-x-1.5 font-mono">
                <span className="font-bold text-white">{count}</span>
                <span className="text-slate-500 text-[10px]">({percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Line Graph Component
const LineGraph = ({ data = [], fromDate, toDate }) => {
  const dateList = [];
  const startStr = fromDate || new Date().toISOString().split('T')[0];
  const endStr = toDate || startStr;

  const start = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T23:59:59');

  const curr = new Date(start);
  if (!isNaN(curr.getTime()) && !isNaN(end.getTime())) {
    let safetyCounter = 0;
    while (curr <= end && safetyCounter < 400) {
      dateList.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
      safetyCounter++;
    }
  }

  if (dateList.length === 0) {
    dateList.push(startStr);
  }

  const safeData = Array.isArray(data) ? data : [];
  const series = dateList.map(date => {
    const match = safeData.find(d => d._id === date);
    return { date, count: match ? match.count : 0 };
  });

  const maxVal = Math.max(...series.map(s => s.count), 0);
  const maxCount = maxVal === 0 ? 4 : Math.ceil(maxVal * 1.25);
  const width = 600;
  const height = 180;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  const points = series.map((s, idx) => {
    const x = paddingLeft + (idx / Math.max(series.length - 1, 1)) * graphWidth;
    const y = paddingTop + graphHeight - (s.count / maxCount) * graphHeight;
    return { x, y, date: s.date, count: s.count };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  const formatDateLabel = (dateStr) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return dateStr;
  };

  let xLabelInterval = 1;
  if (series.length > 20) xLabelInterval = 3;
  if (series.length > 40) xLabelInterval = 5;
  if (series.length > 90) xLabelInterval = 10;
  if (series.length > 180) xLabelInterval = 30;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Tickets Over Time</h3>
        <span className="text-xs text-slate-500 font-mono">Range: {series.length} {series.length === 1 ? 'day' : 'days'}</span>
      </div>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[500px] h-48 relative">
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
            {Array.from({ length: 5 }).map((_, idx) => {
              const val = Math.round((maxCount * idx) / 4);
              const y = paddingTop + graphHeight - (idx / 4) * graphHeight;
              return (
                <g key={idx}>
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
                  <text x={paddingLeft - 10} y={y + 3} fill="#64748b" fontSize="8" textAnchor="end" className="font-mono">{val}</text>
                </g>
              );
            })}

            {points.length > 1 && (
              <polyline
                fill="transparent"
                stroke="#8B5CF6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
              />
            )}

            {points.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="#8B5CF6"
                stroke="#0f172a"
                strokeWidth="1"
                className="hover:r-5 cursor-pointer transition-all duration-150"
              >
                <title>{`${p.date}: ${p.count} tickets`}</title>
              </circle>
            ))}

            {points.map((p, idx) => {
              if (idx % xLabelInterval !== 0 && idx !== points.length - 1) return null;
              return (
                <g key={idx}>
                  <line x1={p.x} y1={paddingTop + graphHeight} x2={p.x} y2={paddingTop + graphHeight + 4} stroke="#334155" strokeWidth="1" />
                  <text
                    x={p.x}
                    y={paddingTop + graphHeight + 14}
                    fill="#64748b"
                    fontSize="8"
                    textAnchor="middle"
                    transform={`rotate(-20, ${p.x}, ${paddingTop + graphHeight + 14})`}
                    className="font-mono"
                  >
                    {formatDateLabel(p.date)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/attendanceportal')) {
    return <AttendancePortal />;
  }

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gsp_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [token, setToken] = useState(() => localStorage.getItem('gsp_token') || '');
  
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, dealers, technicians, tickets, employees, attendance
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
    total: 0, new: 0, assigned: 0, pending: 0, closed: 0,
    totalCustomers: 0, totalActiveAmcs: 0
  });

  // Modals & Forms
  const [dealerForm, setDealerForm] = useState(null); // null or { id?, name, contactPerson, mobile, email, address, city, password }
  const [techForm, setTechForm] = useState(null); // null or { id?, name, mobile, email, password }
  const [selectedTicket, setSelectedTicket] = useState(null); // null or ticket details object
  const [editingTicket, setEditingTicket] = useState(null); // null or ticket to edit
  const [editTicketSaving, setEditTicketSaving] = useState(false);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null); // null or customer object
  const [amcs, setAmcs] = useState([]);
  const [amcFilters, setAmcFilters] = useState({
    search: '',
    amcType: '',
    status: '',
    appliance: '',
    fromDate: '',
    toDate: ''
  });
  const [amcForm, setAmcForm] = useState(null); // null or form fields object
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
  const [custSuggestions, setCustSuggestions] = useState([]);
  const [amcCustSuggestions, setAmcCustSuggestions] = useState([]);
  const [applianceHistory, setApplianceHistory] = useState(null); // null or { customer, appliance }
  const [customerHistoryTab, setCustomerHistoryTab] = useState('tickets'); // 'tickets' or 'amcs'
  const [selectedFollowUpNotes, setSelectedFollowUpNotes] = useState(null); // null or followup object
  const [newNoteText, setNewNoteText] = useState('');
  const [showCreateFollowUp, setShowCreateFollowUp] = useState(false);
  const [newFollowUpForm, setNewFollowUpForm] = useState({
    category: 'service',
    dueAt: '',
    customerId: '',
    customerName: '',
    applianceId: '',
    noteText: ''
  });
  const [followUpCustSuggestions, setFollowUpCustSuggestions] = useState([]);
  
  // Inventory states
  const [inventory, setInventory] = useState([]);
  const [inventoryFilters, setInventoryFilters] = useState({ search: '', lowStock: false });
  const [inventoryForm, setInventoryForm] = useState(null); // null or { id, name, sku, image, quantity, minStockLevel, sellingPrice }
  const [uploadingInventoryImage, setUploadingInventoryImage] = useState(false);
  const [showStockAdjustment, setShowStockAdjustment] = useState(null); // null or { id, name, sku, mode, quantity, technicianId, technicianName }
  const [selectedItemTransactions, setSelectedItemTransactions] = useState(null); // null or item object
  const [inventoryPage, setInventoryPage] = useState(1);
  
  // Performance states
  const [evaluations, setEvaluations] = useState([]);
  const [performanceAreas, setPerformanceAreas] = useState([]);
  const [performanceFilters, setPerformanceFilters] = useState({
    technician: '',
    month: '',
    year: '',
    status: 'all',
    search: ''
  });
  const [performancePage, setPerformancePage] = useState(1);
  const [evaluationModal, setEvaluationModal] = useState(null); // null or { id, technicianId, technicianName, technicianCode, month, year, ratings: [], remarks, status, finalScore, performanceBand }
  const [selectedTechProfile, setSelectedTechProfile] = useState(null);
  const [loadingTechProfile, setLoadingTechProfile] = useState(false);
  const [showAreasConfigModal, setShowAreasConfigModal] = useState(false);
  const [newAreaForm, setNewAreaForm] = useState({ name: '', description: '', weight: 1, order: 0 });
  const [editingArea, setEditingArea] = useState(null);
  
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
      priority: 'medium',
      serviceType: 'In Warranty'
    },
    installationDetails: {
      preferredDate: '',
      priority: 'medium',
      installationType: 'Free Installation'
    },
    serviceType: 'In Warranty',
    installationType: 'Free Installation',
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
  const [feeApplianceFilter, setFeeApplianceFilter] = useState('ALL');
  const [feeBrandFilter, setFeeBrandFilter] = useState('ALL');
  const [feeSearchQuery, setFeeSearchQuery] = useState('');

  // Available brands for Fee Configuration dropdown
  const availableFeeBrands = useMemo(() => {
    let list = brands;
    if (feeApplianceFilter !== 'ALL') {
      list = list.filter(b => {
        const appName = (b.appliance && typeof b.appliance === 'object') ? b.appliance.name : (b.appliance || '');
        return (appName || '').toLowerCase() === feeApplianceFilter.toLowerCase();
      });
    }
    const uniqueNames = Array.from(new Set(list.map(b => b.name).filter(Boolean)));
    return uniqueNames.sort((a, b) => a.localeCompare(b));
  }, [brands, feeApplianceFilter]);

  // Filtered brands list for Fee Matrix Table
  const filteredFeeBrands = useMemo(() => {
    return brands.filter(b => {
      const appName = (b.appliance && typeof b.appliance === 'object') ? (b.appliance.name || '') : (b.appliance || '');
      const bName = b.name || '';

      const matchesAppliance = feeApplianceFilter === 'ALL' || appName.toLowerCase() === feeApplianceFilter.toLowerCase();
      const matchesBrand = feeBrandFilter === 'ALL' || bName.toLowerCase() === feeBrandFilter.toLowerCase();
      const matchesSearch = !feeSearchQuery.trim() || 
        appName.toLowerCase().includes(feeSearchQuery.toLowerCase().trim()) || 
        bName.toLowerCase().includes(feeSearchQuery.toLowerCase().trim());

      return matchesAppliance && matchesBrand && matchesSearch;
    });
  }, [brands, feeApplianceFilter, feeBrandFilter, feeSearchQuery]);

  const [feeCurrentPage, setFeeCurrentPage] = useState(1);
  const FEE_ITEMS_PER_PAGE = 20;

  const totalFeePages = Math.ceil(filteredFeeBrands.length / FEE_ITEMS_PER_PAGE) || 1;

  const paginatedFeeBrands = useMemo(() => {
    const validPage = Math.min(Math.max(1, feeCurrentPage), totalFeePages);
    const start = (validPage - 1) * FEE_ITEMS_PER_PAGE;
    return filteredFeeBrands.slice(start, start + FEE_ITEMS_PER_PAGE);
  }, [filteredFeeBrands, feeCurrentPage, totalFeePages]);

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
  const [dashboardTopTechs, setDashboardTopTechs] = useState([]);
  const [dashboardDealerPerformance, setDashboardDealerPerformance] = useState([]);
  const [dashboardAppliancePerformance, setDashboardAppliancePerformance] = useState([]);
  const [dashboardTicketsByDate, setDashboardTicketsByDate] = useState([]);

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
    toDate: new Date().toISOString().split('T')[0],
    category: ''
  });

  // Pagination states
  const [dealerPage, setDealerPage] = useState(1);
  const [techPage, setTechPage] = useState(1);
  const [customerPage, setCustomerPage] = useState(1);
  const [followUpPage, setFollowUpPage] = useState(1);
  const [ticketPage, setTicketPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [amcPage, setAmcPage] = useState(1);

  // Dealer Video States
  const [dealerVideos, setDealerVideos] = useState([]);
  const [dealerVideosLoading, setDealerVideosLoading] = useState(false);
  const [dealerVideoModalOpen, setDealerVideoModalOpen] = useState(false);
  const [isUploadingDealerVideo, setIsUploadingDealerVideo] = useState(false);
  const [dealerVideoForm, setDealerVideoForm] = useState({
    monthYear: new Date().toISOString().slice(0, 7), // "YYYY-MM"
    title: '',
    description: '',
    videoUrl: ''
  });
  const [activePlayingVideo, setActivePlayingVideo] = useState(null);

  // Video Library States
  const [videoLibraryItems, setVideoLibraryItems] = useState([]);
  const [videoLibraryLoading, setVideoLibraryLoading] = useState(false);
  const [videoLibrarySearch, setVideoLibrarySearch] = useState('');
  const [videoLibraryApplianceFilter, setVideoLibraryApplianceFilter] = useState('');
  const [videoLibraryBrandFilter, setVideoLibraryBrandFilter] = useState('');
  const [videoLibraryPage, setVideoLibraryPage] = useState(1);
  const [videoLibraryModal, setVideoLibraryModal] = useState(false); // false | 'add' | 'edit'
  const [videoLibraryForm, setVideoLibraryForm] = useState({
    id: '',
    title: '',
    appliance: '',
    brand: '',
    description: '',
    videoUrl: ''
  });
  const [activePlayingLibraryVideo, setActivePlayingLibraryVideo] = useState(null);

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

  // Employee Management States
  const [employees, setEmployees] = useState([]);
  const [employeeStats, setEmployeeStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    presentToday: 0,
    currentlyClockedIn: 0,
    completedToday: 0,
    notClockedIn: 0
  });
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState('all');
  const [employeePage, setEmployeePage] = useState(1);
  const [employeeForm, setEmployeeForm] = useState(null);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [employeeSaving, setEmployeeSaving] = useState(false);
  const [viewingEmployeeData, setViewingEmployeeData] = useState(null);

  // Attendance States
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    presentToday: 0,
    currentlyClockedIn: 0,
    completedToday: 0,
    missingClockOut: 0,
    notClockedIn: 0
  });
  const [attendanceDateFilter, setAttendanceDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceEmployeeFilter, setAttendanceEmployeeFilter] = useState('');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('all');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendancePage, setAttendancePage] = useState(1);
  const [mapAttendance, setMapAttendance] = useState(null);
  const [correctingAttendance, setCorrectingAttendance] = useState(null);
  const [correctingSaving, setCorrectingSaving] = useState(false);
  const [viewSelfiePhoto, setViewSelfiePhoto] = useState(null);

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
      if (data && data.stats) {
        setStats(data.stats);
      }
      setDashboardPendingVerifications(data?.pendingVerifications || []);
      setDashboardNewUnassigned(data?.newUnassignedTickets || []);
      setDashboardTopTechs(data?.topTechnicians || []);
      setDashboardDealerPerformance(data?.dealerPerformance || []);
      setDashboardAppliancePerformance(data?.appliancePerformance || []);
      setDashboardTicketsByDate(data?.ticketsByDate || []);
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

  const fetchTechnicians = async () => {
    try {
      const data = await apiFetch('/technicians');
      setTechnicians(data);
      if (Array.isArray(data)) {
        setActiveTechniciansForAssign(data.filter(t => t.status === 'active'));
      }
    } catch (err) {
      console.error('Error fetching technicians:', err);
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
        const targetAdmin = admins.find(a => a._id === adminForm.id);
        if (targetAdmin && ((targetAdmin.email || '').toLowerCase() === 'admin@gsp.com' || (targetAdmin.code || '').toUpperCase() === 'ADMIN-01' || (targetAdmin.name || '').toLowerCase() === 'gsp super admin')) {
          alert('The GSP Super Admin account is system protected and cannot be edited.');
          setAdminForm(null);
          return;
        }

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
        if ((adminForm.email || '').toLowerCase() === 'admin@gsp.com') {
          alert('Cannot use the protected Super Admin email address.');
          return;
        }

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
    const targetAdmin = admins.find(a => a._id === id);
    if (targetAdmin && ((targetAdmin.email || '').toLowerCase() === 'admin@gsp.com' || (targetAdmin.code || '').toUpperCase() === 'ADMIN-01' || (targetAdmin.name || '').toLowerCase() === 'gsp super admin')) {
      alert('The GSP Super Admin account is system protected and cannot be deactivated or modified.');
      return;
    }

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
      const data = await apiFetch(`/followups?fromDate=${followUpFilters.fromDate}&toDate=${followUpFilters.toDate}&category=${followUpFilters.category}`);
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

  const fetchAmcs = async () => {
    try {
      const data = await apiFetch(`/amcs?search=${amcFilters.search}&amcType=${amcFilters.amcType}&status=${amcFilters.status}&appliance=${amcFilters.appliance}&fromDate=${amcFilters.fromDate}&toDate=${amcFilters.toDate}`);
      setAmcs(data);
    } catch (err) {
      console.error('Error fetching AMCs:', err);
    }
  };

  const fetchInventory = async () => {
    try {
      const data = await apiFetch(`/inventory?search=${inventoryFilters.search}&lowStock=${inventoryFilters.lowStock}`);
      setInventory(data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  const fetchPerformanceAreas = async () => {
    try {
      const data = await apiFetch('/performance/areas');
      setPerformanceAreas(data);
      return data;
    } catch (err) {
      console.error('Error fetching performance areas:', err);
      return [];
    }
  };

  const fetchEvaluations = async () => {
    try {
      let q = `/performance/evaluations?search=${encodeURIComponent(performanceFilters.search || '')}&status=${performanceFilters.status || 'all'}`;
      if (performanceFilters.technician) q += `&technician=${performanceFilters.technician}`;
      if (performanceFilters.month) q += `&month=${performanceFilters.month}`;
      if (performanceFilters.year) q += `&year=${performanceFilters.year}`;
      const data = await apiFetch(q);
      setEvaluations(data);
    } catch (err) {
      console.error('Error fetching evaluations:', err);
    }
  };

  const fetchTechnicianProfile = async (techId) => {
    setLoadingTechProfile(true);
    try {
      const data = await apiFetch(`/performance/technician/${techId}/summary`);
      setSelectedTechProfile(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingTechProfile(false);
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
      } else if (type === 'dealer') {
        setHistoryTickets(data);
        fetchDealerVideos(entity._id);
      } else {
        setHistoryTickets(data);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openTicketDetails = async (ticket) => {
    setSelectedTicket(ticket);
    try {
      const fullTicket = await apiFetch(`/tickets/${ticket._id}`);
      if (fullTicket) {
        setSelectedTicket(fullTicket);
      }
    } catch (e) {
      console.error('Error fetching full ticket details:', e);
    }
  };

  const fetchDealerVideos = async (dealerId) => {
    if (!dealerId) return;
    try {
      setDealerVideosLoading(true);
      const data = await apiFetch(`/dealers/${dealerId}/videos`);
      setDealerVideos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching dealer videos:', err);
      setDealerVideos([]);
    } finally {
      setDealerVideosLoading(false);
    }
  };

  const handleDealerVideoFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setIsUploadingDealerVideo(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/dealers/upload-video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (!res.ok) {
        let errMsg = 'Failed to upload video file';
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch (errJson) {}
        throw new Error(errMsg);
      }
      const data = await res.json();
      setDealerVideoForm(prev => ({
        ...prev,
        videoUrl: data.filePath
      }));
    } catch (err) {
      alert(err.message);
      e.target.value = null;
    } finally {
      setIsUploadingDealerVideo(false);
    }
  };

  const handleSaveDealerVideo = async (e) => {
    e.preventDefault();
    if (!dealerVideoForm.videoUrl) {
      alert('Please upload a video file first');
      return;
    }
    try {
      await apiFetch(`/dealers/${historyEntity._id}/videos`, {
        method: 'POST',
        body: JSON.stringify(dealerVideoForm)
      });
      setDealerVideoModalOpen(false);
      setDealerVideoForm({
        monthYear: new Date().toISOString().slice(0, 7),
        title: '',
        description: '',
        videoUrl: ''
      });
      fetchDealerVideos(historyEntity._id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteDealerVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this monthly video?')) return;
    try {
      await apiFetch(`/dealers/videos/${videoId}`, {
        method: 'DELETE'
      });
      fetchDealerVideos(historyEntity._id);
    } catch (err) {
      alert(err.message);
    }
  };

  // Video Library Operations
  const fetchVideoLibraryItems = async () => {
    try {
      setVideoLibraryLoading(true);
      const params = new URLSearchParams();
      if (videoLibraryApplianceFilter) params.append('appliance', videoLibraryApplianceFilter);
      if (videoLibraryBrandFilter) params.append('brand', videoLibraryBrandFilter);
      if (videoLibrarySearch) params.append('search', videoLibrarySearch);

      const data = await apiFetch(`/video-library?${params.toString()}`);
      setVideoLibraryItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching video library:', err);
      setVideoLibraryItems([]);
    } finally {
      setVideoLibraryLoading(false);
    }
  };

  const handleSaveVideoLibraryItem = async (e) => {
    e.preventDefault();
    if (!videoLibraryForm.title || !videoLibraryForm.appliance || !videoLibraryForm.brand || !videoLibraryForm.videoUrl) {
      alert('Please fill all required fields: Title, Appliance, Brand, and Video link');
      return;
    }

    try {
      if (videoLibraryForm.id) {
        await apiFetch(`/video-library/${videoLibraryForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(videoLibraryForm)
        });
      } else {
        await apiFetch('/video-library', {
          method: 'POST',
          body: JSON.stringify(videoLibraryForm)
        });
      }
      setVideoLibraryModal(false);
      setVideoLibraryForm({
        id: '',
        title: '',
        appliance: '',
        brand: '',
        description: '',
        videoUrl: ''
      });
      fetchVideoLibraryItems();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteVideoLibraryItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this video item from the library?')) return;
    try {
      await apiFetch(`/video-library/${id}`, {
        method: 'DELETE'
      });
      fetchVideoLibraryItems();
    } catch (err) {
      alert(err.message);
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

  const fetchEmployees = async () => {
    try {
      let query = `/employees?status=${employeeStatusFilter}`;
      if (employeeSearch) query += `&search=${encodeURIComponent(employeeSearch)}`;
      const data = await apiFetch(query);
      if (data) {
        setEmployees(data.employees || []);
        if (data.stats) setEmployeeStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchAttendance = async () => {
    try {
      let query = `/attendance/admin/records?status=${attendanceStatusFilter}`;
      if (attendanceDateFilter) query += `&date=${attendanceDateFilter}`;
      if (attendanceEmployeeFilter) query += `&employeeId=${encodeURIComponent(attendanceEmployeeFilter)}`;
      if (attendanceSearch) query += `&search=${encodeURIComponent(attendanceSearch)}`;
      const data = await apiFetch(query);
      if (data && Array.isArray(data)) {
        setAttendanceRecords(data);
      }
    } catch (err) {
      console.error('Error fetching attendance records:', err);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const data = await apiFetch(`/attendance/admin/stats?date=${attendanceDateFilter || ''}`);
      if (data) setAttendanceStats(data);
    } catch (err) {
      console.error('Error fetching attendance stats:', err);
    }
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!employeeForm) return;
    setEmployeeSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', employeeForm.name || '');
      formData.append('phone', employeeForm.phone || '');
      if (employeeForm.password) formData.append('password', employeeForm.password);
      formData.append('address', employeeForm.address || '');
      formData.append('status', employeeForm.status || 'active');

      if (employeeForm.profilePicFile) formData.append('profilePic', employeeForm.profilePicFile);
      if (employeeForm.aadharFile) formData.append('aadhar', employeeForm.aadharFile);
      if (employeeForm.drivingLicenseFile) formData.append('drivingLicense', employeeForm.drivingLicenseFile);
      if (employeeForm.insuranceFile) formData.append('insurance', employeeForm.insuranceFile);

      const endpoint = (employeeForm.id || employeeForm._id)
        ? `/employees/${employeeForm.id || employeeForm._id}`
        : `/employees`;

      const method = (employeeForm.id || employeeForm._id) ? 'PUT' : 'POST';

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save employee');
      }

      setEmployeeModalOpen(false);
      setEmployeeForm(null);
      fetchEmployees();
    } catch (err) {
      alert(err.message || 'Failed to save employee record');
    } finally {
      setEmployeeSaving(false);
    }
  };

  const handleToggleEmployee = async (id) => {
    try {
      await apiFetch(`/employees/${id}/toggle`, { method: 'PATCH' });
      fetchEmployees();
    } catch (err) {
      alert(err.message || 'Failed to toggle employee status');
    }
  };

  const handleDeleteEmployee = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete employee "${name}"? All associated attendance records will also be removed.`)) return;
    try {
      await apiFetch(`/employees/${id}`, { method: 'DELETE' });
      fetchEmployees();
    } catch (err) {
      alert(err.message || 'Failed to delete employee');
    }
  };

  const handleViewEmployee = async (id) => {
    try {
      const data = await apiFetch(`/employees/${id}`);
      if (data) {
        setViewingEmployeeData(data);
      }
    } catch (err) {
      alert(err.message || 'Failed to load employee details');
    }
  };

  const handleSaveAttendanceCorrection = async ({ id, clockInTime, clockOutTime, status, reason }) => {
    setCorrectingSaving(true);
    try {
      await apiFetch(`/attendance/admin/correct/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ clockInTime, clockOutTime, status, reason })
      });
      setCorrectingAttendance(null);
      fetchAttendance();
      fetchAttendanceStats();
    } catch (err) {
      alert(err.message || 'Failed to correct attendance');
    } finally {
      setCorrectingSaving(false);
    }
  };

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
      } else if (activeTab === 'amcs') {
        fetchAmcs();
        fetchAppliances();
      } else if (activeTab === 'followups') {
        fetchFollowUps();
      } else if (activeTab === 'inventory') {
        fetchInventory();
        fetchTechnicians();
      } else if (activeTab === 'performance') {
        fetchEvaluations();
        fetchPerformanceAreas();
        fetchTechnicians();
      } else if (activeTab === 'video_library') {
        fetchVideoLibraryItems();
        fetchAppliances();
        fetchBrands();
      } else if (activeTab === 'employees') {
        fetchEmployees();
      } else if (activeTab === 'attendance') {
        fetchAttendance();
        fetchAttendanceStats();
        fetchEmployees();
      } else if (activeTab === 'dashboard') {
        fetchDashboardData();
      } else {
        fetchData();
        fetchCities();
        fetchAppliances();
        fetchBrands();
        fetchCustomers();
        fetchInventory();
        fetchEvaluations();
      }
    }
  }, [user, dealerSearch, techSearch, ticketFilters, activeTab, followUpFilters, appliedDashboardRange, amcFilters, inventoryFilters, performanceFilters, employeeSearch, employeeStatusFilter, attendanceDateFilter, attendanceEmployeeFilter, attendanceStatusFilter, attendanceSearch]);

  useEffect(() => {
    setCustomerPage(1);
  }, [customerSearch]);

  useEffect(() => {
    setFollowUpPage(1);
  }, [followUpFilters]);

  useEffect(() => {
    setInventoryPage(1);
  }, [inventoryFilters]);

  useEffect(() => {
    setPerformancePage(1);
  }, [performanceFilters]);

  useEffect(() => {
    setVideoLibraryPage(1);
  }, [videoLibrarySearch, videoLibraryApplianceFilter, videoLibraryBrandFilter]);

  useEffect(() => {
    setAmcPage(1);
  }, [amcFilters]);

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
        if ((tab === 'customers' || tab === 'add-customer' || tab === 'edit-customer') && !perms.customers) return false;
        if ((tab === 'amcs' || tab === 'add-amc' || tab === 'edit-amc' || tab === 'renew-amc') && !perms.customers) return false;
        if (tab === 'dealers' && !perms.manageDealers) return false;
        if ((tab === 'technicians' || tab === 'add-technician' || tab === 'edit-technician') && !perms.manageTechnicians) return false;
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
    if (showStockAdjustment && showStockAdjustment.mode === 'out') {
      fetchTechnicians();
    }
  }, [showStockAdjustment?.mode]);

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
          customerServiceFee: feeForm.customerServiceFee,
          customerInstallationFee: feeForm.customerInstallationFee,
          dealerServiceFee: feeForm.dealerServiceFee,
          dealerInstallationFee: feeForm.dealerInstallationFee,
          technicianServiceFee: feeForm.technicianServiceFee,
          technicianInstallationFee: feeForm.technicianInstallationFee
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

  const saveTech = async (e) => {
    e.preventDefault();
    try {
      const cleanForm = {
        ...techForm,
        pincodes: (techForm.pincodes || []).map(p => p.trim()).filter(Boolean)
      };
      if (techForm.id) {
        await apiFetch(`/technicians/${techForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(cleanForm)
        });
      } else {
        await apiFetch('/technicians', {
          method: 'POST',
          body: JSON.stringify(cleanForm)
        });
      }
      setTechForm(null);
      setActiveTab('technicians');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const saveCustomer = async (e) => {
    e.preventDefault();
    try {
      if (customerForm.id) {
        await apiFetch(`/tickets/customers/${customerForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(customerForm)
        });
      } else {
        await apiFetch('/tickets/customers', {
          method: 'POST',
          body: JSON.stringify(customerForm)
        });
      }
      setCustomerForm(null);
      setActiveTab('customers');
      fetchCustomers();
    } catch (err) {
      alert(err.message);
    }
  };

  const saveAmc = async (e) => {
    e.preventDefault();
    try {
      if (amcForm.id) {
        await apiFetch(`/amcs/${amcForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(amcForm)
        });
      } else {
        await apiFetch('/amcs', {
          method: 'POST',
          body: JSON.stringify(amcForm)
        });
      }
      setAmcForm(null);
      setActiveTab('amcs');
      fetchAmcs();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelAmc = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this AMC Contract?')) return;
    try {
      await apiFetch(`/amcs/${id}/cancel`, {
        method: 'PATCH'
      });
      fetchAmcs();
    } catch (err) {
      alert(err.message);
    }
  };

  const submitCreateFollowUp = async (e) => {
    e.preventDefault();
    try {
      let amcId = undefined;
      let ticketId = undefined;

      if (newFollowUpForm.category === 'amc') {
        const matchingAmcs = amcs.filter(a => a.customer?._id === newFollowUpForm.customerId && a.appliance?._id === newFollowUpForm.applianceId);
        if (matchingAmcs.length === 0) {
          return alert('No AMC contract found for this customer and selected appliance. Please create an AMC contract first.');
        }
        amcId = matchingAmcs[0]._id;
      } else {
        const matchingTickets = tickets.filter(t => 
          t.customer?.mobile && 
          customers.find(c => c._id === newFollowUpForm.customerId)?.mobile === t.customer.mobile &&
          t.product?.category.toLowerCase() === appliances.find(a => a._id === newFollowUpForm.applianceId)?.name.toLowerCase()
        );
        if (matchingTickets.length > 0) {
          ticketId = matchingTickets[0]._id;
        } else {
          const anyTicket = tickets.filter(t => t.customer?.mobile === customers.find(c => c._id === newFollowUpForm.customerId)?.mobile);
          if (anyTicket.length > 0) {
            ticketId = anyTicket[0]._id;
          } else {
            return alert('No service tickets found for this customer. Please raise a request first to schedule a service follow-up.');
          }
        }
      }

      await apiFetch('/followups', {
        method: 'POST',
        body: JSON.stringify({
          category: newFollowUpForm.category,
          dueAt: newFollowUpForm.dueAt,
          amc: amcId,
          ticket: ticketId,
          noteText: newFollowUpForm.noteText
        })
      });

      setShowCreateFollowUp(false);
      setNewFollowUpForm({
        category: 'service',
        dueAt: '',
        customerId: '',
        customerName: '',
        applianceId: '',
        noteText: ''
      });
      fetchFollowUps();
    } catch (err) {
      alert(err.message);
    }
  };

  const submitFollowUpNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    try {
      const updated = await apiFetch(`/followups/${selectedFollowUpNotes._id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ text: newNoteText })
      });
      setSelectedFollowUpNotes(updated);
      setNewNoteText('');
      fetchFollowUps();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleInventoryImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingInventoryImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/inventory/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        let errMsg = 'Failed to upload part image';
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch (errJson) {}
        throw new Error(errMsg);
      }

      const data = await res.json();
      setInventoryForm(prev => ({ ...prev, image: data.filePath }));
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingInventoryImage(false);
    }
  };

  const saveInventoryItem = async (e) => {
    e.preventDefault();
    try {
      if (inventoryForm.id) {
        await apiFetch(`/inventory/${inventoryForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(inventoryForm)
        });
      } else {
        await apiFetch('/inventory', {
          method: 'POST',
          body: JSON.stringify(inventoryForm)
        });
      }
      setInventoryForm(null);
      fetchInventory();
    } catch (err) {
      alert(err.message);
    }
  };

  const submitStockAdjustment = async (e) => {
    e.preventDefault();
    const qty = Number(showStockAdjustment.quantity);
    if (!qty || qty <= 0) return alert('Please enter a valid positive quantity');
    try {
      const endpoint = `/inventory/${showStockAdjustment.id}/${showStockAdjustment.mode === 'in' ? 'stock-in' : 'stock-out'}`;
      const payload = {
        quantity: qty,
        technicianId: showStockAdjustment.technicianId || '',
        technicianName: showStockAdjustment.technicianName || ''
      };
      await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setShowStockAdjustment(null);
      fetchInventory();
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

  // Performance Evaluation handlers
  const openNewEvaluationModal = async () => {
    let areas = performanceAreas;
    if (!areas || areas.length === 0) {
      areas = await fetchPerformanceAreas();
    }
    const currentMonth = MONTHS_LIST[new Date().getMonth()];
    const currentYear = new Date().getFullYear();
    const activeAreas = (areas || []).filter(a => a.isActive !== false);

    const firstTech = technicians[0];
    setEvaluationModal({
      id: null,
      technicianId: firstTech?._id || firstTech?.id || '',
      technicianName: firstTech?.name || '',
      technicianCode: firstTech?.code || '',
      month: currentMonth,
      year: currentYear,
      ratings: activeAreas.map(a => ({
        areaId: a._id,
        areaName: a.name,
        rating: 8,
        comments: ''
      })),
      remarks: '',
      status: 'draft',
      isLocked: false
    });
  };

  const openEditEvaluationModal = (ev) => {
    setEvaluationModal({
      id: ev._id,
      technicianId: ev.technician?._id || ev.technician,
      technicianName: ev.technicianName,
      technicianCode: ev.technicianCode,
      month: ev.month,
      year: ev.year,
      ratings: ev.ratings ? ev.ratings.map(r => ({
        areaId: r.areaId,
        areaName: r.areaName,
        rating: r.rating,
        comments: r.comments || ''
      })) : [],
      remarks: ev.remarks || '',
      status: ev.status,
      isLocked: ev.status === 'finalized'
    });
  };

  const saveEvaluation = async (submitStatus = 'draft') => {
    if (!evaluationModal.technicianId) {
      return alert('Please select a technician.');
    }
    if (!evaluationModal.ratings || evaluationModal.ratings.length === 0) {
      return alert('Evaluation ratings are required.');
    }

    try {
      const payload = {
        technicianId: evaluationModal.technicianId,
        month: evaluationModal.month,
        year: evaluationModal.year,
        ratings: evaluationModal.ratings,
        remarks: evaluationModal.remarks,
        status: submitStatus
      };

      if (evaluationModal.id) {
        await apiFetch(`/performance/evaluations/${evaluationModal.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...payload, unlock: true })
        });
      } else {
        await apiFetch('/performance/evaluations', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      setEvaluationModal(null);
      fetchEvaluations();
    } catch (err) {
      alert(err.message);
    }
  };

  const finalizeEvaluationHandler = async (id) => {
    if (!confirm('Are you sure you want to finalize this evaluation? It will be locked from editing.')) return;
    try {
      await apiFetch(`/performance/evaluations/${id}/finalize`, { method: 'PATCH' });
      fetchEvaluations();
    } catch (err) {
      alert(err.message);
    }
  };

  const unlockEvaluationHandler = async (id) => {
    if (!confirm('Unlock this evaluation to allow modifications?')) return;
    try {
      await apiFetch(`/performance/evaluations/${id}/unlock`, { method: 'PATCH' });
      fetchEvaluations();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteEvaluationHandler = async (id) => {
    if (!confirm('Are you sure you want to delete this evaluation record?')) return;
    try {
      await apiFetch(`/performance/evaluations/${id}`, { method: 'DELETE' });
      fetchEvaluations();
    } catch (err) {
      alert(err.message);
    }
  };

  const savePerformanceAreaHandler = async (e) => {
    e.preventDefault();
    try {
      if (editingArea) {
        await apiFetch(`/performance/areas/${editingArea._id}`, {
          method: 'PUT',
          body: JSON.stringify(editingArea)
        });
        setEditingArea(null);
      } else {
        if (!newAreaForm.name.trim()) return alert('Area name is required');
        await apiFetch('/performance/areas', {
          method: 'POST',
          body: JSON.stringify(newAreaForm)
        });
        setNewAreaForm({ name: '', description: '', weight: 1, order: 0 });
      }
      fetchPerformanceAreas();
    } catch (err) {
      alert(err.message);
    }
  };

  const deletePerformanceAreaHandler = async (id) => {
    if (!confirm('Are you sure you want to delete this performance area?')) return;
    try {
      await apiFetch(`/performance/areas/${id}`, { method: 'DELETE' });
      fetchPerformanceAreas();
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

  const handleSaveEditTicket = async (ticketId, payloadFormData) => {
    try {
      setEditTicketSaving(true);
      const res = await fetch(`${API_BASE}/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: payloadFormData
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update ticket');
      }
      const updated = await res.json();
      setEditingTicket(null);
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket(updated);
      }
      fetchData();
      fetchDashboardData();
      alert('Ticket details updated successfully!');
    } catch (err) {
      alert(err.message || 'Error updating ticket');
    } finally {
      setEditTicketSaving(false);
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

  const handleTechDocUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${API_BASE}/technicians/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!res.ok) {
        let errMsg = 'Failed to upload document';
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch (errJson) {}
        throw new Error(errMsg);
      }
      
      const data = await res.json();
      setTechForm(prev => ({
        ...prev,
        [fieldName]: data.filePath
      }));
    } catch (err) {
      alert(err.message);
      e.target.value = null;
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
        const sType = newRequestForm.serviceType || newRequestForm.serviceDetails?.serviceType || 'In Warranty';
        payload.serviceDetails = {
          description: newRequestForm.serviceDetails.description,
          priority: newRequestForm.serviceDetails.priority,
          serviceType: sType
        };
        payload.serviceType = sType;
      } else {
        const iType = newRequestForm.installationType || newRequestForm.installationDetails?.installationType || 'Free Installation';
        payload.installationDetails = {
          preferredDate: newRequestForm.preferredVisitDate,
          priority: newRequestForm.installationDetails?.priority || 'medium',
          installationType: iType
        };
        payload.installationType = iType;
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
        serviceType: 'In Warranty',
        installationType: 'Free Installation',
        customer: { name: '', mobile: '', alternateMobile: '', address: '', city: '', pincode: '' },
        product: { category: '', name: '', modelNumber: '', serialNumber: '', purchaseDate: '', invoiceNumber: '' },
        serviceDetails: { description: '', priority: 'medium', serviceType: 'In Warranty' },
        installationDetails: { preferredDate: '', priority: 'medium', installationType: 'Free Installation' },
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
      <div className="flex flex-1 flex-col lg:flex-row min-w-0">
        {/* Sidebar Nav */}
        <aside className={`${menuOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 shrink-0 bg-slate-900/50 border-r border-slate-800 p-4 space-y-2 lg:min-h-[calc(100vh-73px)]`}>
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${(activeTab === 'customers' || activeTab === 'add-customer' || activeTab === 'edit-customer') ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <UserCheck className="w-5 h-5" />
              Customers
            </button>
          )}
          {(!user || user.permissions?.customers !== false) && (
            <button
              onClick={() => { setActiveTab('amcs'); setMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${(activeTab === 'amcs' || activeTab === 'add-amc' || activeTab === 'edit-amc' || activeTab === 'renew-amc') ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <ClipboardList className="w-5 h-5" />
              AMC Contracts
            </button>
          )}
          {(!user || user.permissions?.customers !== false) && (
            <button
              onClick={() => { setActiveTab('inventory'); setMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${activeTab === 'inventory' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Package className="w-5 h-5" />
              Inventory
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${(activeTab === 'technicians' || activeTab === 'add-technician' || activeTab === 'edit-technician') ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Wrench className="w-5 h-5" />
              Manage Technicians
            </button>
          )}
          {(!user || user.permissions?.manageTechnicians !== false) && (
            <button
              onClick={() => { setActiveTab('performance'); setMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${activeTab === 'performance' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Award className="w-5 h-5 text-amber-400" />
              Performance
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
          {(!user || user.role === 'admin') && (
            <button
              onClick={() => { setActiveTab('video_library'); setMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${activeTab === 'video_library' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Video className="w-5 h-5" />
              Video Library
            </button>
          )}
          {(!user || user.role === 'admin') && (
            <button
              onClick={() => { setActiveTab('employees'); setMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${(activeTab === 'employees' || activeTab === 'add-employee' || activeTab === 'edit-employee') ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Users className="w-5 h-5 text-indigo-400" />
              Employees
            </button>
          )}
          {(!user || user.role === 'admin') && (
            <button
              onClick={() => { setActiveTab('attendance'); setMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${activeTab === 'attendance' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Clock className="w-5 h-5 text-emerald-400" />
              Attendance
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
        <main className="flex-1 p-6 lg:p-8 space-y-8 bg-slate-950 min-w-0 max-w-full overflow-x-hidden">
          
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
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <div 
                      onClick={() => handleStatClick('')}
                      className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between shadow-lg cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200"
                    >
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Requests</span>
                      <span className="text-2xl font-black text-white mt-2">{stats.total || 0}</span>
                    </div>
                    <div 
                      onClick={() => handleStatClick('new')}
                      className="bg-blue-950/20 border border-blue-900/40 p-4 rounded-2xl flex flex-col justify-between shadow-lg cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200"
                    >
                      <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">New Requests</span>
                      <span className="text-2xl font-black text-blue-400 mt-2">{stats.new || 0}</span>
                    </div>
                    <div 
                      onClick={() => handleStatClick('assigned')}
                      className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-2xl flex flex-col justify-between shadow-lg cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200"
                    >
                      <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Assigned</span>
                      <span className="text-2xl font-black text-amber-400 mt-2">{stats.assigned || 0}</span>
                    </div>
                    <div 
                      onClick={() => handleStatClick('pending')}
                      className="bg-purple-950/20 border border-purple-900/40 p-4 rounded-2xl flex flex-col justify-between shadow-lg cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200"
                    >
                      <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">Pending/Action</span>
                      <span className="text-2xl font-black text-purple-400 mt-2">{stats.pending || 0}</span>
                    </div>
                    <div 
                      onClick={() => handleStatClick('closed')}
                      className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-2xl flex flex-col justify-between shadow-lg cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200"
                    >
                      <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Closed</span>
                      <span className="text-2xl font-black text-emerald-400 mt-2">{stats.closed || 0}</span>
                    </div>
                    <div 
                      onClick={() => { setActiveTab('customers'); }}
                      className="bg-violet-950/20 border border-violet-900/40 p-4 rounded-2xl flex flex-col justify-between shadow-lg cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200"
                    >
                      <span className="text-[11px] font-semibold text-violet-400 uppercase tracking-wider">Total Customers</span>
                      <span className="text-2xl font-black text-violet-400 mt-2">{stats.totalCustomers || 0}</span>
                    </div>
                    <div 
                      onClick={() => { setActiveTab('amcs'); }}
                      className="bg-teal-950/20 border border-teal-900/40 p-4 rounded-2xl flex flex-col justify-between shadow-lg cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200"
                    >
                      <span className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider">Active AMCs</span>
                      <span className="text-2xl font-black text-teal-400 mt-2">{stats.totalActiveAmcs || 0}</span>
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

                  {/* Analytics Section 1: Tickets Over Time Line Graph */}
                  <LineGraph
                    data={dashboardTicketsByDate}
                    fromDate={appliedDashboardRange.fromDate}
                    toDate={appliedDashboardRange.toDate}
                  />

                  {/* Analytics Section 2: Dealer & Appliance Performance Donut Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Dealer Performance */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Dealer Performance</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Tickets created in selected period</p>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-2.5 py-1 rounded font-mono">Top 6 + Others</span>
                      </div>
                      <DonutChart data={dashboardDealerPerformance} />
                    </div>

                    {/* Appliance Performance */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Appliance Performance</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Tickets by appliance category in selected period</p>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-2.5 py-1 rounded font-mono">Top 6 + Others</span>
                      </div>
                      <DonutChart data={dashboardAppliancePerformance} />
                    </div>
                  </div>

                  {/* Analytics Section 3: Top 10 Technicians */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Top 10 Technicians</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Ranked by tickets closed within selected period</p>
                      </div>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2.5 py-1 rounded font-mono">By Tickets Closed</span>
                    </div>
                    {dashboardTopTechs.length === 0 ? (
                      <div className="py-10 text-center text-slate-500 text-sm font-medium">
                        No closed tickets in selected period
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800">
                        {dashboardTopTechs.map((tech, idx) => {
                          const max = dashboardTopTechs[0]?.closedCount || 1;
                          const pct = Math.round((tech.closedCount / max) * 100);
                          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                          return (
                            <div key={tech._id || idx} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-800/30 transition">
                              <div className="w-8 text-center flex-shrink-0">
                                {medal ? (
                                  <span className="text-lg">{medal}</span>
                                ) : (
                                  <span className="text-xs font-black text-slate-500">#{idx + 1}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="text-sm font-bold text-white truncate">{tech.name}</span>
                                    {tech.code && (
                                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                                        {tech.code}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs font-black text-violet-400 font-mono flex-shrink-0 ml-2">
                                    {tech.closedCount} {tech.closedCount === 1 ? 'ticket' : 'tickets'} closed
                                  </span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-500"
                                    style={{ width: `${Math.max(pct, 4)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
                              <div className="font-semibold text-slate-200">{ticket.type}</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(() => {
                                  const specificType = ticket.type === 'service'
                                    ? (ticket.serviceType || ticket.serviceDetails?.serviceType || 'In Warranty')
                                    : (ticket.installationType || ticket.installationDetails?.installationType || 'Free Installation');
                                  const isPaidByDealer = specificType === 'Paid by Dealer';
                                  return (
                                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                                      isPaidByDealer 
                                        ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                                        : 'bg-slate-800 text-slate-300 border-slate-700'
                                    }`}>
                                      {specificType}
                                    </span>
                                  );
                                })()}
                                {(() => {
                                  const priority = ticket.installationDetails?.priority || ticket.serviceDetails?.priority;
                                  if (!priority) return null;
                                  const isHigh = priority.toLowerCase() === 'high';
                                  const isLow = priority.toLowerCase() === 'low';
                                  return (
                                    <span className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                      isHigh ? 'bg-red-950/80 text-red-400 border border-red-800/60' :
                                      isLow ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                                      'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                                    }`}>
                                      {priority.toLowerCase() === 'medium' ? 'Mid' : priority}
                                    </span>
                                  );
                                })()}
                              </div>
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
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => setSelectedTicket(ticket)}
                                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs transition duration-150 cursor-pointer"
                                >
                                  View Details
                                </button>
                                <button 
                                  onClick={() => {
                                    fetchAppliances();
                                    fetchBrands();
                                    fetchTechnicians();
                                    fetchDealers();
                                    setEditingTicket(ticket);
                                  }}
                                  className="bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/40 font-bold py-2 px-3 rounded-xl text-xs transition duration-150 cursor-pointer flex items-center gap-1.5 shadow-xs"
                                  title="Edit Ticket Details"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>Edit</span>
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
                  onChange={(e) => {
                    setDealerSearch(e.target.value);
                    setDealerPage(1);
                  }}
                />
              </div>

              {/* Dealers List */}
              {dealers.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                  No dealers found matching your search.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dealers.slice((dealerPage - 1) * 9, dealerPage * 9).map(dealer => (
                      <div key={dealer._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative hover:shadow-2xl transition duration-200 flex flex-col justify-between">
                        <div>
                          <span className="absolute top-6 right-6 bg-slate-800 text-slate-300 font-bold text-xs px-2.5 py-1 rounded-lg font-mono">
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

                  {/* Pagination Controls */}
                  <div className="px-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-slate-400">
                      Showing <span className="font-semibold text-slate-200">{dealers.length === 0 ? 0 : (dealerPage - 1) * 9 + 1}</span> to <span className="font-semibold text-slate-200">{Math.min(dealerPage * 9, dealers.length)}</span> of <span className="font-semibold text-slate-200">{dealers.length}</span> dealers
                    </div>
                    {Math.ceil(dealers.length / 9) > 1 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setDealerPage(prev => Math.max(prev - 1, 1))}
                          disabled={dealerPage === 1}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-bold"
                        >
                          Previous
                        </button>
                        {Array.from({ length: Math.ceil(dealers.length / 9) }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setDealerPage(page)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                              page === dealerPage
                                ? 'bg-violet-600 text-white shadow-md'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setDealerPage(prev => Math.min(prev + 1, Math.ceil(dealers.length / 9)))}
                          disabled={dealerPage === Math.ceil(dealers.length / 9)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-bold"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
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
                  onClick={() => {
                    setTechForm({ 
                      name: '', 
                      mobile: '', 
                      email: '', 
                      password: '', 
                      appliances: [],
                      profilePic: '',
                      drivingLicense: '',
                      aadhar: '',
                      insurance: '',
                      pincodes: []
                    });
                    setActiveTab('add-technician');
                  }}
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
                  onChange={(e) => {
                    setTechSearch(e.target.value);
                    setTechPage(1);
                  }}
                />
              </div>

              {/* Technicians List */}
              {technicians.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                  No technicians found matching your search.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {technicians.slice((techPage - 1) * 9, techPage * 9).map(tech => (
                      <div key={tech._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative hover:shadow-2xl transition duration-200 flex flex-col justify-between">
                        <div>
                          <span className="absolute top-6 right-6 bg-slate-800 text-slate-300 font-bold text-xs px-2.5 py-1 rounded-lg font-mono">
                            {tech.code}
                          </span>
                          <div className="flex items-center gap-3.5 pr-20">
                            {tech.profilePic ? (
                              <img 
                                src={`${API_BASE}/${tech.profilePic}`} 
                                alt={tech.name} 
                                className="w-12 h-12 rounded-full object-cover border-2 border-violet-500/50 shadow-md shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-violet-950/60 border border-violet-700/50 flex items-center justify-center text-violet-300 font-bold text-base shadow-md shrink-0">
                                {tech.name ? tech.name.charAt(0).toUpperCase() : 'T'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h3 className="text-lg font-bold text-white truncate">{tech.name}</h3>
                              <p className="text-xs text-slate-400 font-mono">{tech.code}</p>
                            </div>
                          </div>
                          
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
                            {tech.pincodes && tech.pincodes.length > 0 && (
                              <p className="text-xs text-slate-400 mt-2">
                                <span className="text-slate-500 font-semibold">Pincodes served:</span> {tech.pincodes.join(', ')}
                              </p>
                            )}
                            <div className="mt-3 pt-2 border-t border-slate-800/60 space-y-1.5">
                              <p className="text-xs text-slate-500 font-semibold">Documents:</p>
                              <div className="flex flex-wrap gap-2 text-xs">
                                {tech.drivingLicense ? (
                                  <a href={`${API_BASE}/${tech.drivingLicense}`} target="_blank" rel="noreferrer" className="text-violet-400 hover:underline flex items-center gap-1 font-semibold">
                                    DL ✓
                                  </a>
                                ) : (
                                  <span className="text-slate-600">DL ✗</span>
                                )}
                                {tech.aadhar ? (
                                  <a href={`${API_BASE}/${tech.aadhar}`} target="_blank" rel="noreferrer" className="text-violet-400 hover:underline flex items-center gap-1 font-semibold">
                                    Aadhar ✓
                                  </a>
                                ) : (
                                  <span className="text-slate-600">Aadhar ✗</span>
                                )}
                                {tech.insurance ? (
                                  <a href={`${API_BASE}/${tech.insurance}`} target="_blank" rel="noreferrer" className="text-violet-400 hover:underline flex items-center gap-1 font-semibold">
                                    Insurance ✓
                                  </a>
                                ) : (
                                  <span className="text-slate-600">Insurance ✗</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
                          <button
                            onClick={() => {
                              setTechForm({ 
                                id: tech._id, 
                                name: tech.name, 
                                mobile: tech.mobile, 
                                email: tech.email, 
                                password: '',
                                appliances: tech.appliances ? tech.appliances.map(a => typeof a === 'object' ? a._id : a) : [],
                                profilePic: tech.profilePic || '',
                                drivingLicense: tech.drivingLicense || '',
                                aadhar: tech.aadhar || '',
                                insurance: tech.insurance || '',
                                pincodes: tech.pincodes || []
                              });
                              setActiveTab('edit-technician');
                            }}
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

                  {/* Pagination Controls */}
                  <div className="px-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-slate-400">
                      Showing <span className="font-semibold text-slate-200">{technicians.length === 0 ? 0 : (techPage - 1) * 9 + 1}</span> to <span className="font-semibold text-slate-200">{Math.min(techPage * 9, technicians.length)}</span> of <span className="font-semibold text-slate-200">{technicians.length}</span> technicians
                    </div>
                    {Math.ceil(technicians.length / 9) > 1 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setTechPage(prev => Math.max(prev - 1, 1))}
                          disabled={techPage === 1}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-bold"
                        >
                          Previous
                        </button>
                        {Array.from({ length: Math.ceil(technicians.length / 9) }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setTechPage(page)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                              page === techPage
                                ? 'bg-violet-600 text-white shadow-md'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setTechPage(prev => Math.min(prev + 1, Math.ceil(technicians.length / 9)))}
                          disabled={techPage === Math.ceil(technicians.length / 9)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-bold"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Add/Edit Technician Standalone Page */}
          {(activeTab === 'add-technician' || activeTab === 'edit-technician') && techForm && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">
                    {activeTab === 'edit-technician' ? 'Edit Technician Details' : 'Register New Technician'}
                  </h1>
                  <p className="text-slate-400 mt-1">
                    {activeTab === 'edit-technician' ? `Update profile and credentials for ${techForm.name || 'Technician'}` : 'Configure credentials, appliances, documents and coverage'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setTechForm(null); setActiveTab('technicians'); }}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-5 rounded-xl border border-slate-700 text-sm cursor-pointer transition duration-150"
                >
                  Back to List
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl">
                <form onSubmit={saveTech} className="space-y-6">
                  {/* Profile Picture Upload Section */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-850 border border-slate-800 rounded-2xl">
                    <div className="relative group">
                      {techForm.profilePic ? (
                        <img 
                          src={`${API_BASE}/${techForm.profilePic}`} 
                          alt="Technician Profile" 
                          className="w-24 h-24 rounded-full object-cover border-4 border-violet-600/50 shadow-xl"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-400">
                          <UserCheck className="w-8 h-8 text-slate-500 mb-1" />
                          <span className="text-[10px] font-semibold uppercase">No Photo</span>
                        </div>
                      )}
                      {techForm.profilePic && (
                        <button
                          type="button"
                          onClick={() => setTechForm({ ...techForm, profilePic: '' })}
                          className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 shadow-lg transition"
                          title="Remove Photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Profile Picture
                      </label>
                      <p className="text-xs text-slate-400">Upload a clear passport size or face photo (JPG, PNG). Max 5MB.</p>
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={(e) => handleTechDocUpload(e, 'profilePic')}
                        className="w-full sm:w-auto text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-violet-600 file:text-white hover:file:bg-violet-500 cursor-pointer transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Technician Name</label>
                      <input 
                        required 
                        type="text" 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 focus:border-violet-500" 
                        value={techForm.name} 
                        onChange={e => setTechForm({...techForm, name: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Mobile Number</label>
                      <input 
                        required 
                        type="text" 
                        maxLength={10}
                        placeholder="10 digit mobile number"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 focus:border-violet-500" 
                        value={techForm.mobile} 
                        onChange={e => setTechForm({
                          ...techForm, 
                          mobile: e.target.value.replace(/\D/g, '').slice(0, 10)
                        })} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                      <input 
                        required 
                        type="email" 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 focus:border-violet-500" 
                        value={techForm.email} 
                        onChange={e => setTechForm({...techForm, email: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
                      <input 
                        type="text" 
                        placeholder={activeTab === 'edit-technician' ? "Keep blank to leave unchanged" : "Password (default: tech@123)"} 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 focus:border-violet-500" 
                        value={techForm.password || ''} 
                        onChange={e => setTechForm({...techForm, password: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Associate Appliances</label>
                    <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 max-h-40 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {appliances.map(app => {
                        const isChecked = techForm.appliances ? techForm.appliances.includes(app._id) : false;
                        return (
                          <label key={app._id} className="flex items-center gap-2.5 text-sm text-slate-200 cursor-pointer p-1.5 hover:bg-slate-800/40 rounded-lg">
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
                              className="rounded border-slate-600 bg-slate-700 text-violet-600 focus:ring-violet-500 w-4 h-4"
                            />
                            <span>{app.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Document Uploads section */}
                  <div className="space-y-4 border-t border-slate-800 pt-5">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Upload Verification Documents</h3>
                    <p className="text-xs text-slate-400">Accepted formats: Jpeg, PDF. Max size: 10MB.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Driving License */}
                      <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl space-y-3">
                        <label className="block text-xs font-semibold text-slate-400 uppercase">Driving License</label>
                        {techForm.drivingLicense ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs bg-slate-800 p-2 rounded-lg">
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">✓ Uploaded</span>
                              <a href={`${API_BASE}/${techForm.drivingLicense}`} target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">View</a>
                            </div>
                            <input 
                              type="file" 
                              accept=".jpeg,.jpg,.png,.pdf"
                              onChange={(e) => handleTechDocUpload(e, 'drivingLicense')}
                              className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-violet-950/40 file:text-violet-400 hover:file:bg-violet-900/40 cursor-pointer"
                            />
                          </div>
                        ) : (
                          <input 
                            type="file" 
                            accept=".jpeg,.jpg,.png,.pdf"
                            required={activeTab === 'add-technician'}
                            onChange={(e) => handleTechDocUpload(e, 'drivingLicense')}
                            className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-violet-950/40 file:text-violet-400 hover:file:bg-violet-900/40 cursor-pointer"
                          />
                        )}
                      </div>

                      {/* Aadhar */}
                      <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl space-y-3">
                        <label className="block text-xs font-semibold text-slate-400 uppercase">Aadhar Card</label>
                        {techForm.aadhar ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs bg-slate-800 p-2 rounded-lg">
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">✓ Uploaded</span>
                              <a href={`${API_BASE}/${techForm.aadhar}`} target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">View</a>
                            </div>
                            <input 
                              type="file" 
                              accept=".jpeg,.jpg,.png,.pdf"
                              onChange={(e) => handleTechDocUpload(e, 'aadhar')}
                              className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-violet-950/40 file:text-violet-400 hover:file:bg-violet-900/40 cursor-pointer"
                            />
                          </div>
                        ) : (
                          <input 
                            type="file" 
                            accept=".jpeg,.jpg,.png,.pdf"
                            required={activeTab === 'add-technician'}
                            onChange={(e) => handleTechDocUpload(e, 'aadhar')}
                            className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-violet-950/40 file:text-violet-400 hover:file:bg-violet-900/40 cursor-pointer"
                          />
                        )}
                      </div>

                      {/* Insurance */}
                      <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl space-y-3">
                        <label className="block text-xs font-semibold text-slate-400 uppercase">Insurance Policy</label>
                        {techForm.insurance ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs bg-slate-800 p-2 rounded-lg">
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">✓ Uploaded</span>
                              <a href={`${API_BASE}/${techForm.insurance}`} target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">View</a>
                            </div>
                            <input 
                              type="file" 
                              accept=".jpeg,.jpg,.png,.pdf"
                              onChange={(e) => handleTechDocUpload(e, 'insurance')}
                              className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-violet-950/40 file:text-violet-400 hover:file:bg-violet-900/40 cursor-pointer"
                            />
                          </div>
                        ) : (
                          <input 
                            type="file" 
                            accept=".jpeg,.jpg,.png,.pdf"
                            required={activeTab === 'add-technician'}
                            onChange={(e) => handleTechDocUpload(e, 'insurance')}
                            className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-violet-950/40 file:text-violet-400 hover:file:bg-violet-900/40 cursor-pointer"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pincodes serving */}
                  <div className="border-t border-slate-800 pt-5">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Served Pincodes</label>
                    <input 
                      type="text" 
                      placeholder="Enter pincodes separated by commas (e.g. 110001, 110002, 110003)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 focus:border-violet-500" 
                      value={techForm.pincodes ? techForm.pincodes.join(', ') : ''} 
                      onChange={e => {
                        const arr = e.target.value.split(',');
                        setTechForm({ ...techForm, pincodes: arr });
                      }} 
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Specify all postal pincodes this technician is available to service.</p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-800">
                    <button 
                      type="button" 
                      onClick={() => { setTechForm(null); setActiveTab('technicians'); }} 
                      className="px-5 py-2.5 text-sm text-slate-400 hover:text-slate-200 cursor-pointer font-bold"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm cursor-pointer shadow-lg hover:shadow-violet-600/20 transition duration-150"
                    >
                      Save Technician
                    </button>
                  </div>
                </form>
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
                <p className="text-slate-400 mt-1">Configure Customer, Dealer, and Technician service & installation fees for each appliance category and brand</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-violet-400" />
                    Appliance & Brand Fee Matrix
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Showing <strong className="text-white">{filteredFeeBrands.length}</strong> of {brands.length} fee configurations</span>
                  </div>
                </div>

                {/* Filter Controls Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                  {/* Appliance Category Filter */}
                  <div className="lg:col-span-4">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Filter className="w-3 h-3 text-violet-400" />
                      Appliance Category
                    </label>
                    <select
                      value={feeApplianceFilter}
                      onChange={(e) => {
                        setFeeApplianceFilter(e.target.value);
                        setFeeBrandFilter('ALL'); // Reset brand filter when appliance category changes
                        setFeeCurrentPage(1);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-violet-500 cursor-pointer"
                    >
                      <option value="ALL">All Appliances ({appliances.length})</option>
                      {appliances.map(a => (
                        <option key={a._id} value={a.name}>{a.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Brand Filter */}
                  <div className="lg:col-span-4">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Filter className="w-3 h-3 text-amber-400" />
                      Brand
                    </label>
                    <select
                      value={feeBrandFilter}
                      onChange={(e) => {
                        setFeeBrandFilter(e.target.value);
                        setFeeCurrentPage(1);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="ALL">All Brands ({availableFeeBrands.length})</option>
                      {availableFeeBrands.map(bName => (
                        <option key={bName} value={bName}>{bName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Search Input */}
                  <div className="lg:col-span-3">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Search className="w-3 h-3 text-slate-400" />
                      Search
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search appliance or brand..."
                        value={feeSearchQuery}
                        onChange={(e) => {
                          setFeeSearchQuery(e.target.value);
                          setFeeCurrentPage(1);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-8 pr-7 py-2 text-xs focus:outline-none focus:border-violet-500"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                      {feeSearchQuery && (
                        <button
                          onClick={() => {
                            setFeeSearchQuery('');
                            setFeeCurrentPage(1);
                          }}
                          className="absolute right-2.5 top-1.5 text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reset Button */}
                  <div className="lg:col-span-1 flex items-end">
                    <button
                      disabled={feeApplianceFilter === 'ALL' && feeBrandFilter === 'ALL' && !feeSearchQuery}
                      onClick={() => {
                        setFeeApplianceFilter('ALL');
                        setFeeBrandFilter('ALL');
                        setFeeSearchQuery('');
                        setFeeCurrentPage(1);
                      }}
                      className="w-full h-[34px] bg-slate-700/60 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 text-xs rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1"
                      title="Reset all filters"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-5 py-3.5 rounded-l-lg">Appliance Category</th>
                        <th className="px-5 py-3.5">Brand</th>
                        <th className="px-5 py-3.5">
                          <span className="text-violet-400 font-bold">1. Customer Fee</span>
                          <div className="text-[10px] text-slate-500 font-normal uppercase">Service / Install</div>
                        </th>
                        <th className="px-5 py-3.5">
                          <span className="text-amber-400 font-bold">2. Dealer Fee</span>
                          <div className="text-[10px] text-slate-500 font-normal uppercase">Service / Install</div>
                        </th>
                        <th className="px-5 py-3.5">
                          <span className="text-emerald-400 font-bold">3. Technician Fee</span>
                          <div className="text-[10px] text-slate-500 font-normal uppercase">Service / Install</div>
                        </th>
                        <th className="px-5 py-3.5 rounded-r-lg text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {paginatedFeeBrands.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-slate-500 py-10 text-center">
                            {brands.length === 0 
                              ? 'No brands configured yet. Please configure appliances and brands first.'
                              : 'No fee configurations match the selected filters.'}
                          </td>
                        </tr>
                      ) : (
                        paginatedFeeBrands.map(b => (
                          <tr key={b._id} className="hover:bg-slate-800/20 transition duration-150">
                            <td className="px-5 py-4 font-medium text-white">{b.appliance?.name || 'N/A'}</td>
                            <td className="px-5 py-4 text-white font-medium">{b.name}</td>
                            <td className="px-5 py-4">
                              <div className="space-y-0.5">
                                <div className="text-xs font-semibold text-violet-300">Service: <span className="font-bold">₹ {b.customerServiceFee ?? b.serviceFee ?? 0}</span></div>
                                <div className="text-[11px] text-slate-400">Install: <span className="font-semibold text-slate-300">₹ {b.customerInstallationFee ?? b.installationFee ?? 0}</span></div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="space-y-0.5">
                                <div className="text-xs font-semibold text-amber-300">Service: <span className="font-bold">₹ {b.dealerServiceFee ?? 0}</span></div>
                                <div className="text-[11px] text-slate-400">Install: <span className="font-semibold text-slate-300">₹ {b.dealerInstallationFee ?? 0}</span></div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="space-y-0.5">
                                <div className="text-xs font-semibold text-emerald-300">Service: <span className="font-bold">₹ {b.technicianServiceFee ?? 0}</span></div>
                                <div className="text-[11px] text-slate-400">Install: <span className="font-semibold text-slate-300">₹ {b.technicianInstallationFee ?? 0}</span></div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => setFeeForm({ 
                                  id: b._id, 
                                  brandName: b.name, 
                                  applianceName: b.appliance?.name || 'N/A', 
                                  customerServiceFee: b.customerServiceFee ?? b.serviceFee ?? 0, 
                                  customerInstallationFee: b.customerInstallationFee ?? b.installationFee ?? 0,
                                  dealerServiceFee: b.dealerServiceFee ?? 0,
                                  dealerInstallationFee: b.dealerInstallationFee ?? 0,
                                  technicianServiceFee: b.technicianServiceFee ?? 0,
                                  technicianInstallationFee: b.technicianInstallationFee ?? 0
                                })}
                                className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold inline-flex items-center gap-1.5 cursor-pointer transition duration-150"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit Fees
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                {filteredFeeBrands.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
                    <div className="text-xs text-slate-400">
                      Showing <strong className="text-white">{(feeCurrentPage - 1) * FEE_ITEMS_PER_PAGE + 1}</strong> to <strong className="text-white">{Math.min(feeCurrentPage * FEE_ITEMS_PER_PAGE, filteredFeeBrands.length)}</strong> of <strong className="text-white">{filteredFeeBrands.length}</strong> configurations (20 per page)
                    </div>

                    {totalFeePages > 1 && (
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          disabled={feeCurrentPage <= 1}
                          onClick={() => setFeeCurrentPage(prev => Math.max(1, prev - 1))}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer border border-slate-700/60"
                          title="Previous Page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span className="hidden sm:inline">Prev</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalFeePages }, (_, i) => i + 1).map(pageNum => {
                            if (
                              pageNum === 1 || 
                              pageNum === totalFeePages || 
                              (pageNum >= feeCurrentPage - 1 && pageNum <= feeCurrentPage + 1)
                            ) {
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setFeeCurrentPage(pageNum)}
                                  className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                                    feeCurrentPage === pageNum 
                                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' 
                                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            }
                            if (pageNum === feeCurrentPage - 2 || pageNum === feeCurrentPage + 2) {
                              return <span key={pageNum} className="text-slate-500 text-xs px-1 select-none">...</span>;
                            }
                            return null;
                          })}
                        </div>

                        <button
                          disabled={feeCurrentPage >= totalFeePages}
                          onClick={() => setFeeCurrentPage(prev => Math.min(totalFeePages, prev + 1))}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer border border-slate-700/60"
                          title="Next Page"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
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
                    admins.map(admin => {
                      const isSuper = (admin.email || '').toLowerCase() === 'admin@gsp.com' || (admin.code || '').toUpperCase() === 'ADMIN-01' || (admin.name || '').toLowerCase() === 'gsp super admin';
                      return (
                        <div key={admin._id} className="py-4 flex items-center justify-between hover:bg-slate-800/30 px-3 rounded-xl transition duration-150">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-white">{admin.name}</p>
                              <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded font-mono">{admin.code}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${admin.status === 'active' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                                {admin.status}
                              </span>
                              {isSuper && (
                                <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" /> Protected Super Admin
                                </span>
                              )}
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
                            {isSuper ? (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg text-slate-400 text-xs font-semibold select-none shadow-sm" title="GSP Super Admin account cannot be edited or deactivated">
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-slate-300">Protected</span>
                              </div>
                            ) : (
                              <>
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
                                  className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
                                  title="Edit User"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  disabled={admin._id === user._id}
                                  onClick={() => toggleAdminStatus(admin._id)}
                                  className={`p-1.5 hover:bg-slate-850 rounded-lg transition cursor-pointer disabled:opacity-30 ${admin.status === 'active' ? 'text-amber-500 hover:text-amber-400' : 'text-emerald-500 hover:text-emerald-400'}`}
                                  title={admin.status === 'active' ? 'Deactivate' : 'Activate'}
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
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
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => {
                      setCustomerForm({
                        name: '',
                        mobile: '',
                        alternateMobile: '',
                        address: '',
                        city: cities[0]?.name || '',
                        pincode: '',
                        appliances: []
                      });
                      setActiveTab('add-customer');
                    }}
                    className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-violet-600/20 text-sm flex items-center gap-2 cursor-pointer transition duration-150 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Customer
                  </button>

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
                              <button 
                                onClick={() => setSelectedCustomerDetails(cust)}
                                className="text-left font-bold hover:text-violet-400 cursor-pointer transition duration-150 block"
                              >
                                {cust.name}
                              </button>
                              {cust.appliances && cust.appliances.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {cust.appliances.map(a => (
                                    <span key={a._id || a} className="text-[10px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                                      {typeof a === 'object' ? a.name : a}
                                    </span>
                                  ))}
                                </div>
                              )}
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

          {/* Add/Edit Customer Standalone Page */}
          {(activeTab === 'add-customer' || activeTab === 'edit-customer') && customerForm && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">
                    {customerForm.id ? 'Edit Customer Details' : 'Add New Customer'}
                  </h1>
                  <p className="text-slate-400 mt-1">
                    {customerForm.id ? 'Update customer profile and assign owned appliances' : 'Create a new customer profile and assign owned appliances'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setCustomerForm(null); setActiveTab('customers'); }}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-5 rounded-xl border border-slate-700 text-sm cursor-pointer transition duration-150"
                >
                  Back to List
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl">
                <form onSubmit={saveCustomer} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Customer Name *</label>
                      <input 
                        required 
                        type="text" 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 focus:border-violet-500" 
                        value={customerForm.name} 
                        onChange={e => setCustomerForm({...customerForm, name: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Mobile Number *</label>
                      <input 
                        required 
                        type="text" 
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 focus:border-violet-500" 
                        value={customerForm.mobile} 
                        onChange={e => setCustomerForm({
                          ...customerForm, 
                          mobile: e.target.value.replace(/\D/g, '').slice(0, 10)
                        })} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Alternate Mobile Number</label>
                      <input 
                        type="text" 
                        maxLength={10}
                        placeholder="10-digit alternate mobile number"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 focus:border-violet-500" 
                        value={customerForm.alternateMobile || ''} 
                        onChange={e => setCustomerForm({
                          ...customerForm, 
                          alternateMobile: e.target.value.replace(/\D/g, '').slice(0, 10)
                        })} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Pincode *</label>
                      <input 
                        required 
                        type="text" 
                        maxLength={6}
                        placeholder="6-digit postal pincode"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 focus:border-violet-500" 
                        value={customerForm.pincode} 
                        onChange={e => setCustomerForm({
                          ...customerForm, 
                          pincode: e.target.value.replace(/\D/g, '').slice(0, 6)
                        })} 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Address *</label>
                    <textarea 
                      required 
                      rows={3}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 focus:border-violet-500" 
                      value={customerForm.address} 
                      onChange={e => setCustomerForm({...customerForm, address: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">City *</label>
                    <select
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                      value={customerForm.city}
                      onChange={e => setCustomerForm({...customerForm, city: e.target.value})}
                    >
                      <option value="" disabled>Select City</option>
                      {cities.map(c => (
                        <option key={c._id || c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Appliances Owned</label>
                    <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 max-h-40 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {appliances.map(app => {
                        const isChecked = customerForm.appliances ? customerForm.appliances.includes(app._id) : false;
                        return (
                          <label key={app._id} className="flex items-center gap-2.5 text-sm text-slate-200 cursor-pointer p-1.5 hover:bg-slate-800/40 rounded-lg">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                let list = [...(customerForm.appliances || [])];
                                if (e.target.checked) {
                                  list.push(app._id);
                                } else {
                                  list = list.filter(id => id !== app._id);
                                }
                                setCustomerForm({ ...customerForm, appliances: list });
                              }}
                              className="rounded border-slate-600 bg-slate-700 text-violet-600 focus:ring-violet-500 w-4 h-4"
                            />
                            <span>{app.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-800">
                    <button 
                      type="button" 
                      onClick={() => { setCustomerForm(null); setActiveTab('customers'); }} 
                      className="px-5 py-2.5 text-sm text-slate-400 hover:text-slate-200 cursor-pointer font-bold"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm cursor-pointer shadow-lg hover:shadow-violet-600/20 transition duration-150"
                    >
                      Save Customer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* AMC Contracts Tab */}
          {activeTab === 'amcs' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">AMC Contracts Directory</h1>
                  <p className="text-slate-400 mt-1">Manage customer Annual Maintenance Contracts and visits</p>
                </div>
                <button
                  onClick={() => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const nextYear = new Date();
                    nextYear.setFullYear(nextYear.getFullYear() + 1);
                    nextYear.setDate(nextYear.getDate() - 1);
                    const endStr = nextYear.toISOString().split('T')[0];

                    setAmcForm({
                      customer: '',
                      customerName: '',
                      appliance: '',
                      startDate: todayStr,
                      endDate: endStr,
                      amcType: 'service_only',
                      amcAmount: 0,
                      visitsIncluded: 4,
                      visitsUsed: 0,
                      includedServices: '',
                      notes: ''
                    });
                    setActiveTab('add-amc');
                  }}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-violet-600/20 text-sm flex items-center gap-2 cursor-pointer transition duration-150 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Create AMC Contract
                </button>
              </div>

              {/* Filters Area */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Customer / Mobile</label>
                  <input
                    type="text"
                    placeholder="Search customer..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                    value={amcFilters.search}
                    onChange={e => setAmcFilters({ ...amcFilters, search: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Appliance</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                    value={amcFilters.appliance}
                    onChange={e => setAmcFilters({ ...amcFilters, appliance: e.target.value })}
                  >
                    <option value="">All Appliances</option>
                    {appliances.map(app => (
                      <option key={app._id} value={app._id}>{app.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">AMC Type</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                    value={amcFilters.amcType}
                    onChange={e => setAmcFilters({ ...amcFilters, amcType: e.target.value })}
                  >
                    <option value="">All Types</option>
                    <option value="service_only">Service Only</option>
                    <option value="part_service">Part + Service</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Status</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                    value={amcFilters.status}
                    onChange={e => setAmcFilters({ ...amcFilters, status: e.target.value })}
                  >
                    <option value="">All Statuses</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex gap-2 items-end">
                  <button
                    onClick={() => setAmcFilters({ search: '', amcType: '', status: '', appliance: '', fromDate: '', toDate: '' })}
                    className="w-full bg-slate-850 hover:bg-slate-800 text-slate-350 hover:text-white border border-slate-750 text-xs py-2 px-3 rounded-lg font-bold transition duration-150 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>

              {/* AMC Contracts Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase bg-slate-950/40">
                        <th className="py-4 px-6">Customer Name</th>
                        <th className="py-4 px-6">Appliance</th>
                        <th className="py-4 px-6">Contract Type</th>
                        <th className="py-4 px-6">Amount</th>
                        <th className="py-4 px-6">Duration</th>
                        <th className="py-4 px-6">Visits (Used/Total)</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {amcs.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-12 text-center text-slate-500 text-sm">
                            No AMC Contracts found.
                          </td>
                        </tr>
                      ) : (
                        amcs.slice((amcPage - 1) * 20, amcPage * 20).map(amc => {
                          const remaining = amc.visitsIncluded - amc.visitsUsed;
                          return (
                            <tr key={amc._id} className="hover:bg-slate-800/25 transition duration-150 text-sm">
                              <td className="py-4 px-6 font-bold text-white">
                                <div>{amc.customer?.name}</div>
                                <div className="text-xs text-slate-500 font-mono mt-0.5">{amc.customer?.mobile}</div>
                              </td>
                              <td className="py-4 px-6">
                                <button
                                  onClick={() => setApplianceHistory({ customer: amc.customer?._id, appliance: amc.appliance?._id, applianceName: amc.appliance?.name, customerName: amc.customer?.name })}
                                  className="text-violet-400 hover:underline hover:text-violet-300 font-semibold cursor-pointer text-left"
                                >
                                  {amc.appliance?.name}
                                </button>
                              </td>
                              <td className="py-4 px-6">
                                <span className="capitalize">{amc.amcType ? amc.amcType.replace('_', ' ') : '—'}</span>
                              </td>
                              <td className="py-4 px-6 font-semibold">
                                ₹ {amc.amcAmount}
                              </td>
                              <td className="py-4 px-6 text-slate-400 text-xs">
                                <div>{new Date(amc.startDate).toLocaleDateString()}</div>
                                <div className="text-[10px] text-slate-550">to {new Date(amc.endDate).toLocaleDateString()}</div>
                              </td>
                              <td className="py-4 px-6 font-semibold">
                                <span className="text-slate-300">{amc.visitsUsed}</span>
                                <span className="text-slate-600"> / {amc.visitsIncluded}</span>
                                <div className="text-[10px] font-normal text-slate-500 mt-0.5">({remaining} remaining)</div>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                                  amc.status === 'active' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-700/35' :
                                  amc.status === 'upcoming' ? 'bg-blue-950/40 text-blue-400 border border-blue-750/35' :
                                  amc.status === 'expired' ? 'bg-slate-800 text-slate-400 border border-slate-700/35' :
                                  'bg-red-950/40 text-red-400 border border-red-700/35'
                                }`}>
                                  {amc.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <div className="flex justify-center items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setAmcForm({
                                        id: amc._id,
                                        customer: amc.customer?._id,
                                        customerName: amc.customer?.name,
                                        appliance: amc.appliance?._id,
                                        startDate: amc.startDate.split('T')[0],
                                        endDate: amc.endDate.split('T')[0],
                                        amcType: amc.amcType,
                                        amcAmount: amc.amcAmount,
                                        visitsIncluded: amc.visitsIncluded,
                                        visitsUsed: amc.visitsUsed,
                                        includedServices: amc.includedServices,
                                        notes: amc.notes
                                      });
                                      setActiveTab('edit-amc');
                                    }}
                                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition shadow-sm text-slate-300"
                                  >
                                    Edit
                                  </button>
                                  {amc.status !== 'cancelled' && (
                                    <button
                                      onClick={() => handleCancelAmc(amc._id)}
                                      className="bg-red-950/40 hover:bg-red-900/30 border border-red-900/40 text-red-400 text-xs px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition shadow-sm"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                  {(amc.status === 'expired' || amc.status === 'cancelled' || amc.status === 'active') && (
                                    <button
                                      onClick={() => {
                                        // Set Start Date to day after end date of previous contract
                                        const end = new Date(amc.endDate);
                                        end.setDate(end.getDate() + 1);
                                        const startStr = end.toISOString().split('T')[0];
                                        
                                        const newEnd = new Date(end);
                                        newEnd.setFullYear(newEnd.getFullYear() + 1);
                                        newEnd.setDate(newEnd.getDate() - 1);
                                        const endStr = newEnd.toISOString().split('T')[0];

                                        setAmcForm({
                                          customer: amc.customer?._id,
                                          customerName: amc.customer?.name,
                                          appliance: amc.appliance?._id,
                                          startDate: startStr,
                                          endDate: endStr,
                                          amcType: amc.amcType,
                                          amcAmount: amc.amcAmount,
                                          visitsIncluded: amc.visitsIncluded,
                                          visitsUsed: 0,
                                          includedServices: amc.includedServices,
                                          notes: amc.notes
                                        });
                                        setActiveTab('renew-amc');
                                      }}
                                      className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition shadow-sm"
                                    >
                                      Renew
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-4 bg-slate-955/30 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-400">
                    Showing <span className="font-semibold text-slate-200">{amcs.length === 0 ? 0 : (amcPage - 1) * 20 + 1}</span> to <span className="font-semibold text-slate-200">{Math.min(amcPage * 20, amcs.length)}</span> of <span className="font-semibold text-slate-200">{amcs.length}</span> entries
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAmcPage(prev => Math.max(prev - 1, 1))}
                      disabled={amcPage === 1}
                      className="px-3 py-1.5 rounded-lg bg-slate-850 text-slate-350 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition text-xs font-bold cursor-pointer"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.ceil(amcs.length / 20) }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setAmcPage(page)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                          page === amcPage
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'bg-slate-850 text-slate-355 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setAmcPage(prev => Math.min(prev + 1, Math.max(1, Math.ceil(amcs.length / 20))))}
                      disabled={amcPage === Math.max(1, Math.ceil(amcs.length / 20))}
                      className="px-3 py-1.5 rounded-lg bg-slate-850 text-slate-355 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition text-xs font-bold cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create/Edit/Renew AMC Page */}
          {(activeTab === 'add-amc' || activeTab === 'edit-amc' || activeTab === 'renew-amc') && amcForm && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">
                    {activeTab === 'edit-amc' ? 'Edit AMC Details' : activeTab === 'renew-amc' ? 'Renew AMC Contract' : 'Create AMC Contract'}
                  </h1>
                  <p className="text-slate-400 mt-1">Configure service policies, coverage, visits, and amounts</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setAmcForm(null); setActiveTab('amcs'); }}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-5 rounded-xl border border-slate-700 text-sm cursor-pointer transition duration-150"
                >
                  Back to List
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl">
                <form onSubmit={saveAmc} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Selection */}
                    <div className="relative">
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Search Customer *</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="Type customer name or mobile..."
                        disabled={activeTab === 'edit-amc' || activeTab === 'renew-amc'}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 focus:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed" 
                        value={amcForm.customerName || ''} 
                        onChange={e => {
                          const val = e.target.value;
                          setAmcForm({ ...amcForm, customerName: val, customer: '', appliance: '' });
                          if (val.trim().length >= 2) {
                            const matches = customers.filter(c => 
                              c.name.toLowerCase().includes(val.toLowerCase()) || 
                              (c.mobile && c.mobile.includes(val))
                            );
                            setAmcCustSuggestions(matches);
                          } else {
                            setAmcCustSuggestions([]);
                          }
                        }}
                      />
                      {amcCustSuggestions.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-850 border border-slate-750 rounded-lg shadow-xl max-h-40 overflow-y-auto divide-y divide-slate-700">
                          {amcCustSuggestions.map(c => (
                            <button
                              key={c._id}
                              type="button"
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-violet-600 transition flex justify-between items-center cursor-pointer"
                              onClick={() => {
                                setAmcForm({
                                  ...amcForm,
                                  customer: c._id,
                                  customerName: c.name,
                                  appliance: ''
                                });
                                setAmcCustSuggestions([]);
                              }}
                            >
                              <span className="font-bold">{c.name}</span>
                              <span className="text-xs text-slate-450">{c.mobile}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Customer Appliance */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Customer Appliance *</label>
                      <select
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 focus:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        value={amcForm.appliance || ''}
                        onChange={e => setAmcForm({ ...amcForm, appliance: e.target.value })}
                        disabled={!amcForm.customer || activeTab === 'edit-amc' || activeTab === 'renew-amc'}
                      >
                        <option value="">Select Appliance</option>
                        {(() => {
                          const selectedCust = customers.find(c => c._id === amcForm.customer);
                          if (!selectedCust || !selectedCust.appliances) return null;
                          return selectedCust.appliances.map(app => (
                            <option key={app._id} value={app._id}>{app.name}</option>
                          ));
                        })()}
                      </select>
                      {!amcForm.customer && (
                        <p className="text-[10px] text-slate-500 mt-1">Please select a customer first to load their appliances.</p>
                      )}
                      {amcForm.customer && (() => {
                        const selectedCust = customers.find(c => c._id === amcForm.customer);
                        if (!selectedCust || !selectedCust.appliances || selectedCust.appliances.length === 0) {
                          return <p className="text-[10px] text-amber-500 mt-1">This customer has no appliances. Please add appliances to their profile first.</p>;
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Start Date */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Start Date *</label>
                      <input 
                        required
                        type="date"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                        value={amcForm.startDate}
                        onChange={e => {
                          const start = new Date(e.target.value);
                          const end = new Date(start);
                          end.setFullYear(end.getFullYear() + 1);
                          end.setDate(end.getDate() - 1);
                          const endStr = end.toISOString().split('T')[0];
                          setAmcForm({ ...amcForm, startDate: e.target.value, endDate: endStr });
                        }}
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">End Date *</label>
                      <input 
                        required
                        type="date"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                        value={amcForm.endDate}
                        onChange={e => setAmcForm({ ...amcForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* AMC Type */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">AMC Type *</label>
                      <select
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                        value={amcForm.amcType}
                        onChange={e => setAmcForm({ ...amcForm, amcType: e.target.value })}
                      >
                        <option value="service_only">Service Only (Parts chargeable)</option>
                        <option value="part_service">Part + Service (Parts covered)</option>
                      </select>
                    </div>

                    {/* AMC Amount */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">AMC Amount (INR) *</label>
                      <input 
                        required
                        type="number"
                        min={0}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                        value={amcForm.amcAmount}
                        onChange={e => setAmcForm({ ...amcForm, amcAmount: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Visits Included */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Visits Included *</label>
                      <input 
                        required
                        type="number"
                        min={1}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                        value={amcForm.visitsIncluded}
                        onChange={e => setAmcForm({ ...amcForm, visitsIncluded: Number(e.target.value) })}
                      />
                    </div>

                    {/* Visits Used */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Visits Used</label>
                      <input 
                        type="number"
                        min={0}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                        value={amcForm.visitsUsed || 0}
                        onChange={e => setAmcForm({ ...amcForm, visitsUsed: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  {/* Included Services */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Included Services & Coverage details</label>
                    <textarea
                      rows={2}
                      placeholder="Specify services covered under this AMC contract (e.g. 4 wet washings, electrical checks...)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                      value={amcForm.includedServices || ''}
                      onChange={e => setAmcForm({ ...amcForm, includedServices: e.target.value })}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Internal Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Add any specific comments or terms..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                      value={amcForm.notes || ''}
                      onChange={e => setAmcForm({ ...amcForm, notes: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-800">
                    <button 
                      type="button" 
                      onClick={() => { setAmcForm(null); setActiveTab('amcs'); }} 
                      className="px-5 py-2.5 text-sm text-slate-400 hover:text-slate-200 cursor-pointer font-bold"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm cursor-pointer shadow-lg hover:shadow-violet-600/20 transition duration-150"
                    >
                      Save Contract
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Appliance History & Service Cards Details Modal */}
          {applianceHistory && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-b border-slate-800">
                  <div>
                    <h3 className="font-extrabold text-white text-lg">Appliance Service & AMC History</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Customer: {applianceHistory.customerName} • Appliance: {applianceHistory.applianceName}
                    </p>
                  </div>
                  <button 
                    onClick={() => setApplianceHistory(null)} 
                    className="text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  {/* AMC Contracts history for this appliance */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">AMC Contracts</h4>
                    {(() => {
                      const list = amcs.filter(a => a.customer?._id === applianceHistory.customer && a.appliance?._id === applianceHistory.appliance);
                      if (list.length === 0) return <p className="text-xs text-slate-500">No AMC Contracts found for this appliance.</p>;
                      return (
                        <div className="space-y-2">
                          {list.map(a => (
                            <div key={a._id} className="bg-slate-850 border border-slate-800/80 p-3 rounded-lg flex items-center justify-between text-xs">
                              <div>
                                <p className="font-bold text-white capitalize">{a.amcType.replace('_', ' ')} • ₹ {a.amcAmount}</p>
                                <p className="text-slate-450 mt-0.5">
                                  {new Date(a.startDate).toLocaleDateString()} to {new Date(a.endDate).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                a.status === 'active' ? 'bg-emerald-950 text-emerald-400' :
                                a.status === 'upcoming' ? 'bg-blue-950 text-blue-400' :
                                'bg-slate-800 text-slate-400'
                              }`}>
                                {a.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Service Ticket history for this appliance */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">Service & Maintenance Tickets</h4>
                    {(() => {
                      const list = tickets.filter(t => 
                        t.customer?.mobile && 
                        customers.find(c => c._id === applianceHistory.customer)?.mobile === t.customer.mobile &&
                        t.product?.category.toLowerCase() === applianceHistory.applianceName.toLowerCase()
                      );
                      if (list.length === 0) return <p className="text-xs text-slate-500">No ticket service history found for this appliance.</p>;
                      return (
                        <div className="space-y-2">
                          {list.map(t => (
                            <div key={t._id} className="bg-slate-850 border border-slate-800/80 p-3 rounded-lg flex items-center justify-between text-xs">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">{t.ticketNumber}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">{t.type}</span>
                                </div>
                                <p className="text-slate-450 mt-1">{t.product?.name} (Serial: {t.product?.serialNumber || 'N/A'})</p>
                                <p className="text-slate-500 mt-0.5">{new Date(t.createdAt).toLocaleDateString()} • {t.serviceDetails?.description}</p>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">{t.status}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="bg-slate-850 px-6 py-4 flex justify-end border-t border-slate-800">
                  <button 
                    onClick={() => setApplianceHistory(null)} 
                    className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-2 px-5 rounded-lg text-sm border border-slate-750 cursor-pointer"
                  >
                    Close
                  </button>
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

              {/* Dealer Monthly Video Section */}
              {historyContext === 'dealer' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Film className="w-5 h-5 text-violet-400" />
                        Monthly Dealer Update & Training Videos
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Upload and manage monthly video briefings for {historyEntity?.name}
                      </p>
                    </div>
                    {(!user || user.role === 'admin') && (
                      <button
                        onClick={() => {
                          setDealerVideoForm({
                            monthYear: new Date().toISOString().slice(0, 7),
                            title: '',
                            description: '',
                            videoUrl: ''
                          });
                          setDealerVideoModalOpen(true);
                        }}
                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md transition duration-150 self-start sm:self-auto shrink-0"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Monthly Video
                      </button>
                    )}
                  </div>

                  {dealerVideosLoading ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Loading dealer videos...
                    </div>
                  ) : dealerVideos.length === 0 ? (
                    <div className="py-10 text-center text-slate-500 text-sm italic bg-slate-950/30 rounded-xl border border-slate-800/60">
                      No monthly videos uploaded for this dealer yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {dealerVideos.map(vid => {
                        const monthLabel = (() => {
                          try {
                            const [y, m] = vid.monthYear.split('-');
                            const d = new Date(parseInt(y), parseInt(m) - 1, 1);
                            return d.toLocaleString('default', { month: 'long', year: 'numeric' });
                          } catch (e) {
                            return vid.monthYear;
                          }
                        })();

                        return (
                          <div key={vid._id} className="bg-slate-850/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition duration-150 shadow-md">
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-md bg-violet-950/60 text-violet-300 border border-violet-800/40">
                                  {monthLabel}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {new Date(vid.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              <h4 className="font-bold text-white text-sm truncate" title={vid.title}>
                                {vid.title}
                              </h4>
                              {vid.description && (
                                <p className="text-xs text-slate-400 line-clamp-2" title={vid.description}>
                                  {vid.description}
                                </p>
                              )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                              <button
                                onClick={() => setActivePlayingVideo(vid)}
                                className="flex-1 bg-violet-600/20 hover:bg-violet-600 border border-violet-700/40 hover:border-violet-600 text-violet-300 hover:text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" /> Watch Video
                              </button>
                              {(!user || user.role === 'admin') && (
                                <button
                                  onClick={() => handleDeleteDealerVideo(vid._id)}
                                  className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-950/40 transition cursor-pointer"
                                  title="Delete Video"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {historyContext === 'customer' && (
                <div className="flex border-b border-slate-800 gap-6 mb-6">
                  <button
                    onClick={() => setCustomerHistoryTab('tickets')}
                    className={`pb-3 text-sm font-bold transition relative cursor-pointer ${
                      customerHistoryTab === 'tickets' ? 'text-violet-400' : 'text-slate-455 hover:text-slate-200'
                    }`}
                  >
                    Service History (Tickets)
                    {customerHistoryTab === 'tickets' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
                    )}
                  </button>
                  <button
                    onClick={() => setCustomerHistoryTab('amcs')}
                    className={`pb-3 text-sm font-bold transition relative cursor-pointer ${
                      customerHistoryTab === 'amcs' ? 'text-violet-400' : 'text-slate-455 hover:text-slate-200'
                    }`}
                  >
                    AMC Contracts
                    {customerHistoryTab === 'amcs' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
                    )}
                  </button>
                </div>
              )}

              {historyContext === 'customer' && customerHistoryTab === 'amcs' ? (
                <div className="space-y-4">
                  {(() => {
                    const custAmcs = amcs.filter(a => a.customer?._id === historyEntity?._id || a.customer?.mobile === historyEntity?.mobile);
                    if (custAmcs.length === 0) {
                      return (
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl py-16 text-center text-slate-500 text-sm">
                          No AMC Contracts found for this customer.
                        </div>
                      );
                    }
                    return custAmcs.map(amc => {
                      const remaining = amc.visitsIncluded - amc.visitsUsed;
                      return (
                        <div key={amc._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:shadow-xl transition duration-150">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-black text-white">{amc.appliance?.name}</span>
                              <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase bg-violet-955 text-violet-400 border border-violet-900/50">
                                {amc.amcType ? amc.amcType.replace('_', ' ') : ''}
                              </span>
                            </div>
                            <span className={`text-xs px-3 py-1.5 rounded-xl font-bold uppercase ${
                              amc.status === 'active' ? 'bg-emerald-950 text-emerald-400' :
                              amc.status === 'upcoming' ? 'bg-blue-950 text-blue-400' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {amc.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                            <div className="space-y-1">
                              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Contract Details</p>
                              <p className="text-white font-bold">Amount: ₹ {amc.amcAmount}</p>
                              <p className="text-slate-450">
                                Period: {new Date(amc.startDate).toLocaleDateString()} to {new Date(amc.endDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Visits Status</p>
                              <p className="text-white font-bold">Visits Included: {amc.visitsIncluded}</p>
                              <p className="text-slate-455">Visits Used: {amc.visitsUsed} ({remaining} remaining)</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Included Services & Notes</p>
                              <p className="text-slate-300 italic">"{amc.includedServices || 'None specified'}"</p>
                              {amc.notes && <p className="text-slate-450 mt-1 text-xs">Note: {amc.notes}</p>}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                /* Requests List */
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
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-black text-white">{ticket.ticketNumber}</span>
                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                                  ticket.type === 'installation' ? 'bg-cyan-950 text-cyan-400 border border-cyan-900/50' : 'bg-amber-950 text-amber-400 border border-amber-900/50'
                                }`}>
                                  {ticket.type}
                                </span>
                                {(() => {
                                  const specificType = ticket.type === 'service'
                                    ? (ticket.serviceType || ticket.serviceDetails?.serviceType || 'In Warranty')
                                    : (ticket.installationType || ticket.installationDetails?.installationType || 'Free Installation');
                                  const isPaidByDealer = specificType === 'Paid by Dealer';
                                  return (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                                      isPaidByDealer 
                                        ? 'bg-amber-950/80 text-amber-300 border-amber-800/60' 
                                        : 'bg-slate-800 text-slate-300 border-slate-700'
                                    }`}>
                                      {specificType}
                                    </span>
                                  );
                                })()}
                              </div>
                              <div className="flex items-center gap-2.5">
                                <button
                                  onClick={() => openTicketDetails(ticket)}
                                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3.5 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer border border-slate-700 hover:border-slate-600 transition duration-150 shadow-sm"
                                >
                                  <Eye className="w-3.5 h-3.5 text-violet-400" />
                                  View details
                                </button>
                                <span className={`text-xs px-3 py-1.5 rounded-xl font-bold uppercase ${
                                  ticket.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50' :
                                  ticket.status === 'closed' ? 'bg-slate-800 text-slate-300 border border-slate-700' :
                                  ticket.status === 'verification_pending' || ticket.status === 'pending' ? 'bg-yellow-950 text-yellow-400 border border-yellow-900/50' :
                                  ticket.status === 'assigned' ? 'bg-blue-950 text-blue-400 border border-blue-900/50' :
                                  ticket.status === 'in_progress' ? 'bg-amber-950 text-amber-400 border border-amber-900/50' :
                                  'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}>
                                  {ticket.status.replace('_', ' ')}
                                </span>
                              </div>
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
              )}
            </div>
          )}

          {/* Follow-ups Tab */}
          {activeTab === 'followups' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">Follow-ups Dashboard</h1>
                  <p className="text-slate-400 mt-1">Manage scheduled customer follow-up actions</p>
                </div>
                <button
                  onClick={() => {
                    setNewFollowUpForm({
                      category: 'service',
                      dueAt: new Date().toISOString().split('T')[0],
                      customerId: '',
                      customerName: '',
                      applianceId: '',
                      noteText: ''
                    });
                    setShowCreateFollowUp(true);
                  }}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-violet-600/20 text-sm flex items-center gap-2 cursor-pointer transition duration-150 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Schedule Follow-up
                </button>
              </div>

              {/* Filters */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-wrap gap-4 items-end shadow-xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">From Date</label>
                  <input
                    type="date"
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500 cursor-pointer"
                    value={followUpFilters.fromDate}
                    onChange={e => setFollowUpFilters({ ...followUpFilters, fromDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">To Date</label>
                  <input
                    type="date"
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500 cursor-pointer"
                    value={followUpFilters.toDate}
                    onChange={e => setFollowUpFilters({ ...followUpFilters, toDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                  <select
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500 cursor-pointer"
                    value={followUpFilters.category}
                    onChange={e => setFollowUpFilters({ ...followUpFilters, category: e.target.value })}
                  >
                    <option value="">All Categories</option>
                    <option value="service">Service</option>
                    <option value="amc">AMC</option>
                  </select>
                </div>
              </div>

              {/* Listing Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="p-4">Due Date</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Mobile</th>
                        <th className="p-4">Appliance</th>
                        <th className="p-4">Reference Details</th>
                        <th className="p-4">Address</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {followUps.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="p-8 text-center text-slate-500 text-sm">No follow-ups found for the selected criteria.</td>
                        </tr>
                      ) : (
                        followUps.slice((followUpPage - 1) * 15, followUpPage * 15).map(f => {
                          // Resolve details based on category
                          const isAmc = f.category === 'amc';
                          const cust = isAmc ? f.amc?.customer : f.ticket?.customer;
                          const applianceName = isAmc ? f.amc?.appliance?.name : f.ticket?.product?.category;
                          const refDetails = isAmc ? `AMC (Amount: ₹${f.amc?.amcAmount || 0})` : `Ticket: ${f.ticket?.ticketNumber || 'N/A'}`;

                          return (
                            <tr key={f._id} className="hover:bg-slate-800/20 transition text-sm">
                              <td className="p-4 font-semibold text-slate-200">
                                {new Date(f.dueAt).toLocaleDateString('en-GB')}
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${isAmc ? 'bg-cyan-950 text-cyan-400 border border-cyan-900/50' : 'bg-slate-800 text-slate-450'}`}>
                                  {f.category || 'service'}
                                </span>
                              </td>
                              <td className="p-4 font-medium">
                                {cust ? (
                                  <button
                                    onClick={() => viewHistory('customer', cust, 'followups')}
                                    className="text-violet-400 hover:text-violet-300 font-bold hover:underline cursor-pointer text-left"
                                  >
                                    {cust.name}
                                  </button>
                                ) : (
                                  'N/A'
                                )}
                              </td>
                              <td className="p-4 text-slate-300 font-mono text-xs">
                                {cust?.mobile || 'N/A'}
                              </td>
                              <td className="p-4 text-slate-300">
                                {applianceName || 'N/A'}
                              </td>
                              <td className="p-4 text-xs text-slate-350">
                                {refDetails}
                              </td>
                              <td className="p-4 text-slate-400 truncate max-w-xs" title={cust?.address}>
                                {cust?.address || 'N/A'}
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${f.status === 'new' ? 'bg-violet-950 text-violet-300' : 'bg-emerald-950 text-emerald-400'}`}>
                                  {f.status === 'new' ? 'New' : 'Closed'}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-2.5">
                                  <button
                                    onClick={() => {
                                      setSelectedFollowUpNotes(f);
                                      setNewNoteText('');
                                    }}
                                    className="bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition shadow-sm"
                                  >
                                    Notes ({f.notes?.length || 0})
                                  </button>
                                  {!isAmc && f.ticket && (
                                    <button
                                      onClick={() => setSelectedTicket(f.ticket)}
                                      className="text-xs font-bold text-violet-400 hover:text-violet-300 cursor-pointer"
                                    >
                                      Ticket
                                    </button>
                                  )}
                                  {f.status === 'new' && (
                                    <button
                                      onClick={() => markFollowUpClosed(f._id)}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer transition shadow-md"
                                    >
                                      Close
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
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
          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">Inventory Management</h1>
                  <p className="text-slate-400 mt-1">Manage, edit, and track parts stock</p>
                </div>
                <button
                  onClick={() => {
                    setInventoryForm({
                      name: '',
                      sku: '',
                      image: '',
                      quantity: 0,
                      minStockLevel: 5,
                      sellingPrice: 0
                    });
                  }}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-violet-600/20 text-sm flex items-center gap-2 cursor-pointer transition duration-150 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add Inventory Item
                </button>
              </div>

              {/* Filters */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-wrap gap-4 items-end shadow-xl">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Search Items</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search SKU or item name..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                      value={inventoryFilters.search}
                      onChange={e => setInventoryFilters({ ...inventoryFilters, search: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2.5 mb-3.5">
                  <input
                    type="checkbox"
                    id="lowStockFilter"
                    className="w-4 h-4 rounded-sm border-slate-700 bg-slate-800 text-violet-600 focus:ring-violet-500 cursor-pointer"
                    checked={inventoryFilters.lowStock}
                    onChange={e => setInventoryFilters({ ...inventoryFilters, lowStock: e.target.checked })}
                  />
                  <label htmlFor="lowStockFilter" className="text-sm font-semibold text-slate-350 cursor-pointer select-none">
                    Show Low Stock Only
                  </label>
                </div>
              </div>

              {/* Listing Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="p-4 w-16 text-center">Image</th>
                        <th className="p-4">SKU</th>
                        <th className="p-4">Item Name</th>
                        <th className="p-4">Available Stock</th>
                        <th className="p-4">Min stock level</th>
                        <th className="p-4">Selling Price</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {inventory.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="p-8 text-center text-slate-500 text-sm">No inventory items found.</td>
                        </tr>
                      ) : (
                        inventory.slice((inventoryPage - 1) * 15, inventoryPage * 15).map(item => {
                          let statusLabel = 'Active';
                          let statusClass = 'bg-emerald-950 text-emerald-400';
                          if (item.quantity === 0) {
                            statusLabel = 'Out of Stock';
                            statusClass = 'bg-rose-950 text-rose-400 border border-rose-900/50';
                          } else if (item.quantity <= item.minStockLevel) {
                            statusLabel = 'Low Stock';
                            statusClass = 'bg-amber-950 text-amber-400 border border-amber-905/50';
                          }

                          return (
                            <tr key={item._id} className="hover:bg-slate-800/20 transition text-sm">
                              <td className="p-4 text-center">
                                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center mx-auto shrink-0 shadow-inner">
                                  {item.image ? (
                                    <img
                                      src={item.image.startsWith('http') ? item.image : `/${item.image}`}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package className="w-5 h-5 text-slate-500" />
                                  )}
                                </div>
                              </td>
                              <td className="p-4 font-mono font-bold text-slate-200">
                                {item.sku}
                              </td>
                              <td className="p-4 font-medium text-slate-200">
                                {item.name}
                              </td>
                              <td className="p-4 font-semibold text-slate-300">
                                {item.quantity}
                              </td>
                              <td className="p-4 text-slate-400">
                                {item.minStockLevel}
                              </td>
                              <td className="p-4 text-slate-300">
                                ₹{item.sellingPrice}
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${statusClass}`}>
                                  {statusLabel}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setShowStockAdjustment({
                                        id: item._id,
                                        name: item.name,
                                        sku: item.sku,
                                        image: item.image,
                                        mode: 'in',
                                        quantity: '',
                                        technicianId: '',
                                        technicianName: ''
                                      });
                                    }}
                                    className="bg-emerald-700/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-900/40 text-xs px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition shadow-xs"
                                  >
                                    Stock In
                                  </button>
                                  <button
                                    onClick={() => {
                                      fetchTechnicians();
                                      setShowStockAdjustment({
                                        id: item._id,
                                        name: item.name,
                                        sku: item.sku,
                                        image: item.image,
                                        mode: 'out',
                                        quantity: '',
                                        technicianId: '',
                                        technicianName: ''
                                      });
                                    }}
                                    className="bg-rose-700/20 hover:bg-rose-600/30 text-rose-400 border border-rose-900/40 text-xs px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition shadow-xs"
                                    disabled={item.quantity === 0}
                                  >
                                    Stock Out
                                  </button>
                                  <button
                                    onClick={() => {
                                      setInventoryForm({
                                        id: item._id,
                                        name: item.name,
                                        sku: item.sku,
                                        image: item.image || '',
                                        minStockLevel: item.minStockLevel,
                                        sellingPrice: item.sellingPrice
                                      });
                                    }}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => setSelectedItemTransactions(item)}
                                    className="bg-violet-955/40 hover:bg-violet-900/50 text-violet-400 border border-violet-900/30 text-xs px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition shadow-xs"
                                  >
                                    History ({item.transactions?.length || 0})
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 bg-slate-955/30 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Showing <span className="font-semibold text-slate-200">{inventory.length === 0 ? 0 : (inventoryPage - 1) * 15 + 1}</span> to <span className="font-semibold text-slate-200">{Math.min(inventoryPage * 15, inventory.length)}</span> of <span className="font-semibold text-slate-200">{inventory.length}</span> entries
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInventoryPage(prev => Math.max(prev - 1, 1))}
                      disabled={inventoryPage === 1}
                      className="px-3 py-1.5 rounded-lg bg-slate-850 text-slate-350 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition text-xs font-bold"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.ceil(inventory.length / 15) }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setInventoryPage(page)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                          page === inventoryPage
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'bg-slate-850 text-slate-355 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setInventoryPage(prev => Math.min(prev + 1, Math.max(1, Math.ceil(inventory.length / 15))))}
                      disabled={inventoryPage === Math.max(1, Math.ceil(inventory.length / 15))}
                      className="px-3 py-1.5 rounded-lg bg-slate-850 text-slate-355 hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition text-xs font-bold"
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

          {/* Performance Main Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-8 max-w-full min-w-0">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                    <Award className="w-8 h-8 text-amber-400" />
                    Technician Performance Management
                  </h1>
                  <p className="text-slate-400 mt-1">
                    Evaluate monthly technician performance, track ratings, and monitor quality trends
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowAreasConfigModal(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl border border-slate-700 text-sm flex items-center gap-2 cursor-pointer transition duration-150 shadow-md"
                  >
                    <Sliders className="w-4 h-4 text-violet-400" />
                    Configure Areas
                  </button>
                  <button
                    onClick={openNewEvaluationModal}
                    className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-violet-600/20 text-sm flex items-center gap-2 cursor-pointer transition duration-150 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    New Evaluation
                  </button>
                </div>
              </div>

              {/* Employee of the Month Slider (Last 12 Months including Current Month) */}
              {(() => {
                const last12Months = [];
                const now = new Date();
                for (let i = 0; i < 12; i++) {
                  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                  const mName = MONTHS_LIST[d.getMonth()];
                  const yVal = d.getFullYear();
                  const monthEvals = evaluations.filter(e => e.month === mName && e.year === yVal);
                  const topEval = monthEvals.length > 0
                    ? [...monthEvals].sort((a, b) => b.finalScore - a.finalScore)[0]
                    : null;
                  last12Months.push({
                    month: mName,
                    year: yVal,
                    isCurrent: i === 0,
                    topEval,
                    totalEvals: monthEvals.length
                  });
                }

                return (
                  <div className="w-full max-w-full min-w-0 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
                    {/* Background glow decoration */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

                    {/* Section Header with Slider Navigation */}
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                          <Star className="w-5 h-5 fill-slate-950" />
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                            Employee of the Month
                            <span className="text-xs font-bold text-amber-400 bg-amber-950/70 border border-amber-800/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              12-Month Roll of Honour
                            </span>
                          </h2>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Spotlighting top-rated technicians for each month over the past year
                          </p>
                        </div>
                      </div>

                      {/* Slider Navigation Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const el = document.getElementById('eom-slider-track');
                            if (el) el.scrollBy({ left: -320, behavior: 'smooth' });
                          }}
                          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition cursor-pointer shadow-md"
                          title="Previous Months"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            const el = document.getElementById('eom-slider-track');
                            if (el) el.scrollBy({ left: 320, behavior: 'smooth' });
                          }}
                          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition cursor-pointer shadow-md"
                          title="Next Months"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Horizontal Slider Track */}
                    <div
                      id="eom-slider-track"
                      className="w-full max-w-full min-w-0 flex gap-4 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory relative z-10 scrollbar-none"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {last12Months.map((item, idx) => {
                        const top = item.topEval;
                        const techUser = top 
                          ? (technicians.find(t => (t._id === top.technician?._id || t._id === top.technician || t.id === top.technician)) || top.technician)
                          : null;
                        const photoUrl = techUser?.profilePic || top?.technician?.profilePic;

                        let bandClass = 'bg-amber-950 text-amber-300 border border-amber-800/60';
                        if (top?.performanceBand === 'Excellent') {
                          bandClass = 'bg-emerald-950 text-emerald-300 border border-emerald-800/60';
                        } else if (top?.performanceBand === 'Good') {
                          bandClass = 'bg-blue-950 text-blue-300 border border-blue-800/60';
                        }

                        return (
                          <div
                            key={`${item.month}-${item.year}`}
                            className={`w-[260px] sm:w-[280px] shrink-0 snap-start rounded-2xl p-4.5 flex flex-col justify-between transition-all duration-200 relative overflow-hidden border ${
                              item.isCurrent
                                ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-violet-950/40 border-violet-700/60 shadow-xl shadow-violet-950/40'
                                : top
                                ? 'bg-slate-900 border-slate-800 hover:border-amber-500/40 shadow-lg'
                                : 'bg-slate-950/40 border-slate-800/80 border-dashed'
                            }`}
                          >
                            {/* Card Top Banner */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-black text-white tracking-wide">
                                {item.month} {item.year}
                              </span>
                              {item.isCurrent ? (
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-violet-600 text-white shadow-sm">
                                  Current
                                </span>
                              ) : top ? (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-400 border border-amber-800/60 flex items-center gap-1">
                                  <Award className="w-2.5 h-2.5" /> Top Rated
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-slate-500 uppercase">
                                  Pending
                                </span>
                              )}
                            </div>

                            {/* Card Body */}
                            {top ? (
                              <div className="my-3 flex flex-col items-center text-center">
                                {/* Photo Container */}
                                <div className="relative mb-2.5">
                                  <div className="w-18 h-18 rounded-2xl bg-slate-800 border-2 border-amber-400/60 overflow-hidden shadow-lg shadow-amber-500/10 flex items-center justify-center shrink-0">
                                    {photoUrl ? (
                                      <img
                                        src={photoUrl.startsWith('http') ? photoUrl : `/${photoUrl}`}
                                        alt={top.technicianName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-tr from-amber-500 to-violet-600 flex items-center justify-center font-black text-white text-2xl">
                                        {top.technicianName?.charAt(0).toUpperCase() || 'T'}
                                      </div>
                                    )}
                                  </div>
                                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md font-bold text-xs" title="Top Performer">
                                    ★
                                  </div>
                                </div>

                                {/* Tech Name & Code */}
                                <h3 className="font-extrabold text-white text-sm truncate max-w-[220px]">
                                  {top.technicianName}
                                </h3>
                                <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                                  {top.technicianCode || 'TECH'}
                                </p>

                                {/* Score & Badge */}
                                <div className="flex items-center gap-2 mt-3">
                                  <div className="bg-slate-950/80 px-3 py-1 rounded-xl border border-slate-800 flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                    <span className="text-sm font-black text-white">{top.finalScore}</span>
                                    <span className="text-[10px] text-slate-500">/10</span>
                                  </div>
                                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl ${bandClass}`}>
                                    {top.performanceBand}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="my-5 flex flex-col items-center text-center justify-center py-2 space-y-2">
                                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                                  <Award className="w-7 h-7 opacity-40" />
                                </div>
                                <p className="text-xs font-semibold text-slate-400">No evaluation yet</p>
                                <button
                                  onClick={() => {
                                    const activeAreas = (performanceAreas || []).filter(a => a.isActive !== false);
                                    const firstTech = technicians[0];
                                    setEvaluationModal({
                                      id: null,
                                      technicianId: firstTech?._id || firstTech?.id || '',
                                      technicianName: firstTech?.name || '',
                                      technicianCode: firstTech?.code || '',
                                      month: item.month,
                                      year: item.year,
                                      ratings: activeAreas.map(a => ({
                                        areaId: a._id,
                                        areaName: a.name,
                                        rating: 8,
                                        comments: ''
                                      })),
                                      remarks: '',
                                      status: 'draft',
                                      isLocked: false
                                    });
                                  }}
                                  className="text-[11px] font-bold text-violet-400 hover:text-violet-300 bg-violet-950/40 hover:bg-violet-900/50 border border-violet-800/40 px-2.5 py-1 rounded-lg transition cursor-pointer"
                                >
                                  + Evaluate {item.month.substring(0, 3)}
                                </button>
                              </div>
                            )}

                            {/* Card Footer */}
                            {top && (
                              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">{item.totalEvals} evaluated</span>
                                <button
                                  onClick={() => fetchTechnicianProfile(top.technician?._id || top.technician)}
                                  className="text-violet-400 hover:text-violet-300 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                                >
                                  View Trend &rarr;
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Filters Bar */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-wrap gap-4 items-end shadow-xl">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Search Evaluations</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search technician name, code, evaluator..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                      value={performanceFilters.search}
                      onChange={e => setPerformanceFilters({ ...performanceFilters, search: e.target.value })}
                    />
                  </div>
                </div>

                <div className="w-48">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Technician</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                    value={performanceFilters.technician}
                    onChange={e => setPerformanceFilters({ ...performanceFilters, technician: e.target.value })}
                  >
                    <option value="">All Technicians</option>
                    {technicians.map(t => (
                      <option key={t._id || t.id} value={t._id || t.id}>
                        {t.name} {t.code ? `(${t.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-36">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Month</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                    value={performanceFilters.month}
                    onChange={e => setPerformanceFilters({ ...performanceFilters, month: e.target.value })}
                  >
                    <option value="">All Months</option>
                    {MONTHS_LIST.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="w-32">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Year</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                    value={performanceFilters.year}
                    onChange={e => setPerformanceFilters({ ...performanceFilters, year: e.target.value })}
                  >
                    <option value="">All Years</option>
                    {YEARS_LIST.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="w-36">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                    value={performanceFilters.status}
                    onChange={e => setPerformanceFilters({ ...performanceFilters, status: e.target.value })}
                  >
                    <option value="all">All Status</option>
                    <option value="finalized">Finalized</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                {(performanceFilters.search || performanceFilters.technician || performanceFilters.month || performanceFilters.year || performanceFilters.status !== 'all') && (
                  <button
                    onClick={() => setPerformanceFilters({ technician: '', month: '', year: '', status: 'all', search: '' })}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Evaluations Directory Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="p-4">Technician</th>
                        <th className="p-4">Evaluation Period</th>
                        <th className="p-4 text-center">Areas Rated</th>
                        <th className="p-4 text-center">Final Score</th>
                        <th className="p-4">Rating Band</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Evaluated By</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {evaluations.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="p-12 text-center text-slate-500 text-sm">
                            <Award className="w-12 h-12 mx-auto mb-3 text-slate-600 opacity-50" />
                            No performance evaluations found matching current filters.
                            <div className="mt-3">
                              <button
                                onClick={openNewEvaluationModal}
                                className="text-violet-400 hover:text-violet-300 font-bold inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Plus className="w-4 h-4" /> Create First Monthly Evaluation
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        evaluations.slice((performancePage - 1) * 15, performancePage * 15).map(ev => {
                          let bandClass = 'bg-amber-950/80 text-amber-400 border border-amber-800/50';
                          if (ev.performanceBand === 'Excellent') {
                            bandClass = 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50';
                          } else if (ev.performanceBand === 'Good') {
                            bandClass = 'bg-blue-950/80 text-blue-400 border border-blue-800/50';
                          } else if (ev.performanceBand === 'Needs Improvement') {
                            bandClass = 'bg-rose-950/80 text-rose-400 border border-rose-800/50';
                          }

                          return (
                            <tr key={ev._id} className="hover:bg-slate-800/20 transition text-sm">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-violet-950/60 border border-violet-800/40 flex items-center justify-center font-black text-violet-300 text-sm shrink-0">
                                    {ev.technicianName ? ev.technicianName.charAt(0).toUpperCase() : 'T'}
                                  </div>
                                  <div>
                                    <p className="font-bold text-white leading-tight">{ev.technicianName}</p>
                                    <p className="font-mono text-xs text-slate-400 mt-0.5">{ev.technicianCode || 'TECH'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 font-semibold text-slate-200">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4 text-violet-400" />
                                  <span>{ev.month} {ev.year}</span>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-lg font-bold border border-slate-700">
                                  {ev.ratings?.length || 0} criteria
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <div className="inline-flex items-center gap-1 font-black text-base text-white bg-slate-950/60 px-3 py-1 rounded-xl border border-slate-800">
                                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                  <span>{ev.finalScore}</span>
                                  <span className="text-[11px] font-normal text-slate-500">/10</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider inline-block ${bandClass}`}>
                                  {ev.performanceBand || 'Average'}
                                </span>
                              </td>
                              <td className="p-4">
                                {ev.status === 'finalized' ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-900/50 px-2.5 py-1 rounded-lg">
                                    <Lock className="w-3.5 h-3.5" /> Finalized
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-900/50 px-2.5 py-1 rounded-lg">
                                    <Unlock className="w-3.5 h-3.5" /> Draft
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-xs text-slate-400">
                                <div>{ev.evaluatedBy}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">{new Date(ev.createdAt).toLocaleDateString('en-GB')}</div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => fetchTechnicianProfile(ev.technician?._id || ev.technician)}
                                    className="bg-violet-950/40 hover:bg-violet-900/50 text-violet-400 border border-violet-900/30 text-xs px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition shadow-xs flex items-center gap-1"
                                    title="View Technician Performance Profile & Trend"
                                  >
                                    <BarChart2 className="w-3.5 h-3.5" /> Profile & Trend
                                  </button>
                                  <button
                                    onClick={() => openEditEvaluationModal(ev)}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition flex items-center gap-1"
                                  >
                                    <Edit className="w-3.5 h-3.5" /> Edit
                                  </button>
                                  {ev.status === 'draft' ? (
                                    <button
                                      onClick={() => finalizeEvaluationHandler(ev._id)}
                                      className="bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-900/40 text-xs px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition"
                                      title="Finalize and Lock"
                                    >
                                      Finalize
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => unlockEvaluationHandler(ev._id)}
                                      className="bg-amber-950/40 hover:bg-amber-900/50 text-amber-400 border border-amber-900/30 text-xs px-2.5 py-1.5 rounded-lg font-bold cursor-pointer transition"
                                      title="Unlock for edits"
                                    >
                                      Unlock
                                    </button>
                                  )}
                                  <button
                                    onClick={() => deleteEvaluationHandler(ev._id)}
                                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                                    title="Delete Evaluation"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {evaluations.length > 0 && (
                  <div className="bg-slate-850 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
                    <span className="text-xs text-slate-400">
                      Showing <span className="font-semibold text-slate-200">{(performancePage - 1) * 15 + 1}</span> to <span className="font-semibold text-slate-200">{Math.min(performancePage * 15, evaluations.length)}</span> of <span className="font-semibold text-slate-200">{evaluations.length}</span> evaluations
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPerformancePage(prev => Math.max(prev - 1, 1))}
                        disabled={performancePage === 1}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-bold"
                      >
                        Prev
                      </button>
                      {Array.from({ length: Math.ceil(evaluations.length / 15) }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setPerformancePage(page)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                            page === performancePage
                              ? 'bg-violet-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setPerformancePage(prev => Math.min(prev + 1, Math.max(1, Math.ceil(evaluations.length / 15))))}
                        disabled={performancePage === Math.max(1, Math.ceil(evaluations.length / 15))}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-bold"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Video Library Main Tab */}
          {activeTab === 'video_library' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                    <Video className="w-8 h-8 text-violet-400" />
                    Video Library
                  </h1>
                  <p className="text-slate-400 mt-1">
                    Manage reference & training videos classified by appliance and brand
                  </p>
                </div>
                <button
                  onClick={() => {
                    const firstApp = appliances[0]?._id || '';
                    setVideoLibraryForm({
                      id: '',
                      title: '',
                      appliance: firstApp,
                      brand: brands.find(b => (b.appliance?._id || b.appliance) === firstApp)?._id || '',
                      description: '',
                      videoUrl: ''
                    });
                    setVideoLibraryModal('add');
                  }}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-violet-600/20 text-sm flex items-center gap-2 cursor-pointer transition duration-150 self-start sm:self-auto shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add Video
                </button>
              </div>

              {/* Filters Bar */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[220px] relative">
                  <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search videos by title or description..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                    value={videoLibrarySearch}
                    onChange={e => setVideoLibrarySearch(e.target.value)}
                  />
                </div>

                <div className="w-full sm:w-48">
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
                    value={videoLibraryApplianceFilter}
                    onChange={e => {
                      setVideoLibraryApplianceFilter(e.target.value);
                      setVideoLibraryBrandFilter('');
                    }}
                  >
                    <option value="">All Appliances</option>
                    {appliances.map(app => (
                      <option key={app._id} value={app._id}>{app.name}</option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-48">
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
                    value={videoLibraryBrandFilter}
                    onChange={e => setVideoLibraryBrandFilter(e.target.value)}
                  >
                    <option value="">All Brands</option>
                    {brands
                      .filter(b => !videoLibraryApplianceFilter || (b.appliance?._id || b.appliance) === videoLibraryApplianceFilter)
                      .map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                  </select>
                </div>

                <button
                  onClick={fetchVideoLibraryItems}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl text-sm border border-slate-700 transition cursor-pointer"
                >
                  Filter
                </button>
              </div>

              {/* Videos Grid */}
              {videoLibraryLoading ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-slate-400 text-sm">
                  Loading Video Library...
                </div>
              ) : videoLibraryItems.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center space-y-3">
                  <Film className="w-12 h-12 text-slate-600 mx-auto" />
                  <h3 className="text-lg font-bold text-white">No Videos Found</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    No videos match your search or filter criteria. Click "Add Video" to add educational and training resources.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videoLibraryItems.slice((videoLibraryPage - 1) * 9, videoLibraryPage * 9).map(item => (
                      <div
                        key={item._id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 hover:shadow-2xl transition duration-200"
                      >
                        <div className="space-y-3">
                          {/* Appliance & Brand Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-lg bg-violet-950/60 text-violet-300 border border-violet-800/40">
                              {item.appliance?.name || 'Appliance'}
                            </span>
                            <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                              {item.brand?.name || 'Brand'}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-white line-clamp-2" title={item.title}>
                            {item.title}
                          </h3>

                          {item.description && (
                            <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed" title={item.description}>
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono truncate">
                            <span className="truncate" title={item.videoUrl}>
                              🔗 {item.videoUrl.replace(/^https?:\/\//, '')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setActivePlayingLibraryVideo(item)}
                              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" /> Watch Video
                            </button>
                            <button
                              onClick={() => {
                                setVideoLibraryForm({
                                  id: item._id,
                                  title: item.title,
                                  appliance: item.appliance?._id || item.appliance,
                                  brand: item.brand?._id || item.brand,
                                  description: item.description || '',
                                  videoUrl: item.videoUrl
                                });
                                setVideoLibraryModal('edit');
                              }}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                              title="Edit Video Item"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteVideoLibraryItem(item._id)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-900/50 transition cursor-pointer"
                              title="Delete Video Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  <div className="px-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-slate-400">
                      Showing <span className="font-semibold text-slate-200">{videoLibraryItems.length === 0 ? 0 : (videoLibraryPage - 1) * 9 + 1}</span> to <span className="font-semibold text-slate-200">{Math.min(videoLibraryPage * 9, videoLibraryItems.length)}</span> of <span className="font-semibold text-slate-200">{videoLibraryItems.length}</span> videos
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setVideoLibraryPage(prev => Math.max(prev - 1, 1))}
                        disabled={videoLibraryPage === 1}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition text-xs font-bold cursor-pointer"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.ceil(videoLibraryItems.length / 9) }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setVideoLibraryPage(page)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                            page === videoLibraryPage
                              ? 'bg-violet-600 text-white shadow-md'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setVideoLibraryPage(prev => Math.min(prev + 1, Math.max(1, Math.ceil(videoLibraryItems.length / 9))))}
                        disabled={videoLibraryPage === Math.max(1, Math.ceil(videoLibraryItems.length / 9))}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition text-xs font-bold cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <EmployeesTab
              employees={employees}
              stats={employeeStats}
              search={employeeSearch}
              setSearch={setEmployeeSearch}
              statusFilter={employeeStatusFilter}
              setStatusFilter={setEmployeeStatusFilter}
              page={employeePage}
              setPage={setEmployeePage}
              onAddEmployee={() => {
                setEmployeeForm({
                  name: '',
                  phone: '',
                  password: '',
                  address: '',
                  status: 'active'
                });
                setEmployeeModalOpen(true);
              }}
              onEditEmployee={(emp) => {
                setEmployeeForm({
                  id: emp._id,
                  employeeId: emp.employeeId,
                  name: emp.name,
                  phone: emp.phone,
                  password: '',
                  address: emp.address,
                  status: emp.status,
                  profilePic: emp.profilePic,
                  aadhar: emp.aadhar,
                  drivingLicense: emp.drivingLicense,
                  insurance: emp.insurance
                });
                setEmployeeModalOpen(true);
              }}
              onViewEmployee={handleViewEmployee}
              onToggleStatus={handleToggleEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              API_BASE={API_BASE}
            />
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <AttendanceTab
              records={attendanceRecords}
              stats={attendanceStats}
              employees={employees}
              dateFilter={attendanceDateFilter}
              setDateFilter={setAttendanceDateFilter}
              employeeFilter={attendanceEmployeeFilter}
              setEmployeeFilter={setAttendanceEmployeeFilter}
              statusFilter={attendanceStatusFilter}
              setStatusFilter={setAttendanceStatusFilter}
              search={attendanceSearch}
              setSearch={setAttendanceSearch}
              page={attendancePage}
              setPage={setAttendancePage}
              onViewMap={(rec) => setMapAttendance(rec)}
              onViewSelfie={(url) => setViewSelfiePhoto(url)}
              onCorrectAttendance={(rec) => setCorrectingAttendance(rec)}
              API_BASE={API_BASE}
            />
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

      {/* Customer Details Modal */}
      {selectedCustomerDetails && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="font-extrabold text-white text-lg">Customer Profile</h3>
              <button 
                onClick={() => setSelectedCustomerDetails(null)} 
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-350">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Customer Name</p>
                  <p className="font-bold text-slate-200 text-base mt-0.5">{selectedCustomerDetails.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Mobile Number</p>
                  <p className="font-bold text-slate-200 text-base mt-0.5">{selectedCustomerDetails.mobile}</p>
                </div>
                {selectedCustomerDetails.alternateMobile && (
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Alternate Mobile</p>
                    <p className="font-bold text-slate-200 mt-0.5">{selectedCustomerDetails.alternateMobile}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">City</p>
                  <p className="font-bold text-slate-200 mt-0.5">{selectedCustomerDetails.city}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Address</p>
                  <p className="font-bold text-slate-200 mt-0.5">{selectedCustomerDetails.address} (PIN: {selectedCustomerDetails.pincode})</p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-5">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Owned Appliances</p>
                {selectedCustomerDetails.appliances && selectedCustomerDetails.appliances.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomerDetails.appliances.map(app => (
                      <span key={app._id || app} className="text-xs font-bold bg-violet-950/40 text-violet-400 border border-violet-850 px-3 py-1 rounded-lg">
                        {typeof app === 'object' ? app.name : app}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No appliances registered for this customer.</p>
                )}
              </div>
            </div>
            <div className="bg-slate-850 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-800">
              <button 
                onClick={() => {
                  setCustomerForm({
                    id: selectedCustomerDetails._id,
                    name: selectedCustomerDetails.name,
                    mobile: selectedCustomerDetails.mobile,
                    alternateMobile: selectedCustomerDetails.alternateMobile || '',
                    address: selectedCustomerDetails.address,
                    city: selectedCustomerDetails.city,
                    pincode: selectedCustomerDetails.pincode,
                    appliances: (selectedCustomerDetails.appliances || []).map(a => typeof a === 'object' ? a._id : a)
                  });
                  setSelectedCustomerDetails(null);
                  setActiveTab('edit-customer');
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm cursor-pointer border border-slate-700 transition"
              >
                Edit Profile & Appliances
              </button>
              <button 
                onClick={() => setSelectedCustomerDetails(null)} 
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm cursor-pointer transition shadow-md"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Inventory Item Modal */}
      {inventoryForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="font-extrabold text-white text-lg">{inventoryForm.id ? 'Edit Inventory Item' : 'Add Inventory Item'}</h3>
              <button 
                onClick={() => setInventoryForm(null)} 
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={saveInventoryItem}>
              <div className="p-6 space-y-4">
                {/* Part Square Image Upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Part Image (Square)
                  </label>
                  <div className="flex items-center gap-4 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800">
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/80 overflow-hidden flex items-center justify-center relative shrink-0">
                      {inventoryForm.image ? (
                        <img 
                          src={inventoryForm.image.startsWith('http') ? inventoryForm.image : `/${inventoryForm.image}`} 
                          alt="Part Preview" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <Package className="w-7 h-7 text-slate-500" />
                      )}
                      {uploadingInventoryImage && (
                        <div className="absolute inset-0 bg-slate-900/85 flex items-center justify-center text-[10px] font-bold text-violet-400 animate-pulse">
                          Uploading...
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition flex items-center gap-1.5 w-fit">
                        <Upload className="w-3.5 h-3.5 text-violet-400" />
                        {inventoryForm.image ? 'Change Image' : 'Upload Image'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleInventoryImageUpload}
                          disabled={uploadingInventoryImage}
                        />
                      </label>
                      {inventoryForm.image && (
                        <button
                          type="button"
                          onClick={() => setInventoryForm({ ...inventoryForm, image: '' })}
                          className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer text-left flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remove Image
                        </button>
                      )}
                      <span className="text-[11px] text-slate-500">Square ratio (1:1) recommended</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Item Name *</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Copper Pipe 1/4 inch"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500" 
                    value={inventoryForm.name} 
                    onChange={e => setInventoryForm({ ...inventoryForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">SKU *</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. COP-PIPE-01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500" 
                    value={inventoryForm.sku} 
                    onChange={e => setInventoryForm({ ...inventoryForm, sku: e.target.value })}
                  />
                </div>
                {!inventoryForm.id && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Initial Quantity *</label>
                    <input 
                      required 
                      type="number" 
                      min="0"
                      placeholder="e.g. 50"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500" 
                      value={inventoryForm.quantity} 
                      onChange={e => setInventoryForm({ ...inventoryForm, quantity: e.target.value })}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Min Stock Level *</label>
                    <input 
                      required 
                      type="number" 
                      min="0"
                      placeholder="e.g. 5"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500" 
                      value={inventoryForm.minStockLevel} 
                      onChange={e => setInventoryForm({ ...inventoryForm, minStockLevel: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Selling Price *</label>
                    <input 
                      required 
                      type="number" 
                      min="0"
                      placeholder="e.g. 150"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500" 
                      value={inventoryForm.sellingPrice} 
                      onChange={e => setInventoryForm({ ...inventoryForm, sellingPrice: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="bg-slate-850 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setInventoryForm(null)} 
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploadingInventoryImage}
                  className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold py-2 px-5 rounded-lg text-sm cursor-pointer shadow-md transition"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal (In / Out) */}
      {showStockAdjustment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="font-extrabold text-white text-lg">Stock Adjustment ({showStockAdjustment.mode === 'in' ? 'Stock In' : 'Stock Out'})</h3>
              <button 
                onClick={() => setShowStockAdjustment(null)} 
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={submitStockAdjustment}>
              <div className="p-6 space-y-4">
                <div className="bg-slate-850 p-4 rounded-xl flex items-center gap-3 border border-slate-800">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    {showStockAdjustment.image ? (
                      <img
                        src={showStockAdjustment.image.startsWith('http') ? showStockAdjustment.image : `/${showStockAdjustment.image}`}
                        alt={showStockAdjustment.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div className="space-y-0.5 text-sm min-w-0">
                    <p className="font-bold text-white truncate">{showStockAdjustment.name}</p>
                    <p className="font-mono text-slate-400 text-xs truncate">SKU: {showStockAdjustment.sku}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Adjustment Quantity *</label>
                  <input 
                    required 
                    type="number" 
                    min="1"
                    placeholder="Enter quantity to adjust..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500" 
                    value={showStockAdjustment.quantity} 
                    onChange={e => setShowStockAdjustment({ ...showStockAdjustment, quantity: e.target.value })}
                  />
                </div>

                {showStockAdjustment.mode === 'out' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                      Select Technician (Stock Out To)
                    </label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
                      value={showStockAdjustment.technicianId || ''}
                      onChange={e => {
                        const techId = e.target.value;
                        const tech = technicians.find(t => (t._id === techId || t.id === techId));
                        setShowStockAdjustment({
                          ...showStockAdjustment,
                          technicianId: techId,
                          technicianName: tech ? tech.name : ''
                        });
                      }}
                    >
                      <option value="">-- Select Technician (Optional) --</option>
                      {technicians && technicians.length > 0 ? (
                        technicians.map(tech => (
                          <option key={tech._id || tech.id} value={tech._id || tech.id}>
                            {tech.name} {tech.code ? `(${tech.code})` : ''} {tech.mobile ? `- ${tech.mobile}` : ''}
                          </option>
                        ))
                      ) : (
                        <option disabled value="">No technicians available</option>
                      )}
                    </select>
                  </div>
                )}
              </div>
              <div className="bg-slate-850 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowStockAdjustment(null)} 
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`font-bold py-2 px-5 rounded-lg text-sm cursor-pointer shadow-md transition text-white ${showStockAdjustment.mode === 'in' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}
                >
                  Confirm {showStockAdjustment.mode === 'in' ? 'Stock In' : 'Stock Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {selectedItemTransactions && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                  {selectedItemTransactions.image ? (
                    <img 
                      src={selectedItemTransactions.image.startsWith('http') ? selectedItemTransactions.image : `/${selectedItemTransactions.image}`} 
                      alt={selectedItemTransactions.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <Package className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">Stock Transaction History</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedItemTransactions.name} ({selectedItemTransactions.sku})</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItemTransactions(null)} 
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {(!selectedItemTransactions.transactions || selectedItemTransactions.transactions.length === 0) ? (
                <p className="text-center text-slate-500 py-8 text-sm italic">No transaction history recorded yet.</p>
              ) : (
                <div className="bg-slate-950/20 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-800/40 border-b border-slate-800 text-slate-450 font-bold uppercase tracking-wider">
                        <th className="p-3">Date</th>
                        <th className="p-3">Type</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3">User</th>
                        <th className="p-3">Technician / Recipient</th>
                        <th className="p-3">Ref Ticket</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {[...selectedItemTransactions.transactions].reverse().map((t, idx) => (
                        <tr key={t._id || idx} className="hover:bg-slate-800/10">
                          <td className="p-3">
                            {new Date(t.date).toLocaleString('en-GB')}
                          </td>
                          <td className="p-3 font-semibold uppercase">
                            {t.type === 'stock_in' && <span className="text-emerald-400">Stock In</span>}
                            {t.type === 'stock_out' && <span className="text-rose-400">Stock Out</span>}
                            {t.type === 'ticket_use' && <span className="text-cyan-400">Ticket Use</span>}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-200">
                            {t.type === 'stock_in' ? `+${t.quantity}` : `-${t.quantity}`}
                          </td>
                          <td className="p-3 text-slate-400">
                            {t.user}
                          </td>
                          <td className="p-3">
                            {t.technicianName ? (
                              <span className="font-semibold text-violet-400 bg-violet-950/50 border border-violet-800/50 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-violet-400" />
                                {t.technicianName}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-450">
                            {t.ticketNumber || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="bg-slate-850 px-6 py-4 flex items-center justify-end border-t border-slate-800">
              <button 
                onClick={() => setSelectedItemTransactions(null)} 
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-5 rounded-lg text-sm cursor-pointer shadow-md transition"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Manual Follow-up Modal */}
      {showCreateFollowUp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="font-extrabold text-white text-lg">Schedule New Follow-up</h3>
              <button 
                onClick={() => setShowCreateFollowUp(false)} 
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={submitCreateFollowUp}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Category *</label>
                  <select
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                    value={newFollowUpForm.category}
                    onChange={e => setNewFollowUpForm({ ...newFollowUpForm, category: e.target.value, customerId: '', customerName: '', applianceId: '' })}
                  >
                    <option value="service">Service (Service tickets follow-up)</option>
                    <option value="amc">AMC (AMC contract follow-up)</option>
                  </select>
                </div>

                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Search Customer *</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Type customer name or mobile..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 focus:border-violet-500" 
                    value={newFollowUpForm.customerName} 
                    onChange={e => {
                      const val = e.target.value;
                      setNewFollowUpForm({ ...newFollowUpForm, customerName: val, customerId: '', applianceId: '' });
                      if (val.trim().length >= 2) {
                        const matches = customers.filter(c => 
                          c.name.toLowerCase().includes(val.toLowerCase()) || 
                          (c.mobile && c.mobile.includes(val))
                        );
                        setFollowUpCustSuggestions(matches);
                      } else {
                        setFollowUpCustSuggestions([]);
                      }
                    }}
                  />
                  {followUpCustSuggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-850 border border-slate-750 rounded-lg shadow-xl max-h-40 overflow-y-auto divide-y divide-slate-700">
                      {followUpCustSuggestions.map(c => (
                        <button
                          key={c._id}
                          type="button"
                          className="w-full text-left px-4 py-2 text-xs text-white hover:bg-violet-600 transition flex justify-between items-center cursor-pointer"
                          onClick={() => {
                            setNewFollowUpForm({
                              ...newFollowUpForm,
                              customerId: c._id,
                              customerName: c.name,
                              applianceId: ''
                            });
                            setFollowUpCustSuggestions([]);
                          }}
                        >
                          <span className="font-bold">{c.name}</span>
                          <span className="text-xs text-slate-450">{c.mobile}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Customer Appliance *</label>
                  <select
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                    value={newFollowUpForm.applianceId}
                    onChange={e => setNewFollowUpForm({ ...newFollowUpForm, applianceId: e.target.value })}
                    disabled={!newFollowUpForm.customerId}
                  >
                    <option value="">Select Appliance</option>
                    {(() => {
                      const selectedCust = customers.find(c => c._id === newFollowUpForm.customerId);
                      if (!selectedCust || !selectedCust.appliances) return null;
                      return selectedCust.appliances.map(app => (
                        <option key={app._id} value={app._id}>{app.name}</option>
                      ));
                    })()}
                  </select>
                  {!newFollowUpForm.customerId && (
                    <p className="text-[10px] text-slate-500 mt-1">Please select a customer first to load their appliances.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Due Date *</label>
                  <input
                    required
                    type="date"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
                    value={newFollowUpForm.dueAt}
                    onChange={e => setNewFollowUpForm({ ...newFollowUpForm, dueAt: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Notes / Description *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Enter instructions, remarks or agenda for this follow-up..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                    value={newFollowUpForm.noteText}
                    onChange={e => setNewFollowUpForm({ ...newFollowUpForm, noteText: e.target.value })}
                  />
                </div>
              </div>
              <div className="bg-slate-850 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowCreateFollowUp(false)} 
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-5 rounded-lg text-sm cursor-pointer shadow-md transition"
                >
                  Schedule Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow-up Notes Thread Modal */}
      {selectedFollowUpNotes && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-white text-lg">Follow-up Notes Thread</h3>
                <p className="text-xs text-slate-400 mt-0.5 capitalize">
                  Category: {selectedFollowUpNotes.category} • Due: {new Date(selectedFollowUpNotes.dueAt).toLocaleDateString('en-GB')}
                </p>
              </div>
              <button 
                onClick={() => setSelectedFollowUpNotes(null)} 
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-955/20">
              {(!selectedFollowUpNotes.notes || selectedFollowUpNotes.notes.length === 0) ? (
                <p className="text-center text-slate-500 py-8 text-sm italic">No comments or notes added yet.</p>
              ) : (
                selectedFollowUpNotes.notes.map((note, index) => (
                  <div key={note._id || index} className="bg-slate-850/65 border border-slate-800/80 p-3.5 rounded-xl space-y-1.5 shadow-xs">
                    <div className="flex justify-between items-center text-xs text-slate-450">
                      <span className="font-bold text-violet-400">{note.author}</span>
                      <span>{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-200 whitespace-pre-wrap">{note.text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={submitFollowUpNote} className="p-4 bg-slate-900 border-t border-slate-800/85 space-y-3">
              <div>
                <textarea
                  required
                  rows={2}
                  placeholder="Type a new comment or update to the thread..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setSelectedFollowUpNotes(null)} 
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer font-semibold"
                >
                  Close Thread
                </button>
                <button 
                  type="submit" 
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-4 rounded-lg text-xs cursor-pointer shadow-md transition"
                >
                  Add Note
                </button>
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
                <h3 className="font-extrabold text-white text-lg">{selectedTicket.ticketNumber || 'Ticket'} Details</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-xs text-slate-400 capitalize">
                    Type: <span className="font-semibold text-white">{selectedTicket.type || 'Service'}</span> ({selectedTicket.type === 'service' ? (selectedTicket.serviceType || selectedTicket.serviceDetails?.serviceType || 'In Warranty') : (selectedTicket.installationType || selectedTicket.installationDetails?.installationType || 'Free Installation')}) • Status: {(selectedTicket.status || '').replace('_', ' ')}
                  </p>
                  <span className="text-slate-600 text-xs">•</span>
                  {(() => {
                    const creator = selectedTicket.createdBy;
                    const dealer = selectedTicket.dealer;
                    const source = selectedTicket.source;

                    let creatorType = 'Dealer';
                    let creatorName = dealer?.name || 'Dealer';
                    let creatorCode = dealer?.code ? ` (${dealer.code})` : '';
                    let badgeColor = 'bg-purple-950/70 text-purple-300 border-purple-800/50';

                    if (source === 'admin' || creator?.role === 'admin') {
                      creatorType = 'Admin';
                      creatorName = creator?.name || 'Admin User';
                      creatorCode = '';
                      badgeColor = 'bg-blue-950/70 text-blue-300 border-blue-800/50';
                    } else if (source === 'technician' || creator?.role === 'technician') {
                      creatorType = 'Technician';
                      creatorName = creator?.name || 'Technician';
                      creatorCode = creator?.code ? ` (${creator.code})` : '';
                      badgeColor = 'bg-teal-950/70 text-teal-300 border-teal-800/50';
                    } else if (creator?.role === 'dealer') {
                      creatorType = 'Dealer';
                      creatorName = creator?.name || dealer?.name || 'Dealer';
                      creatorCode = creator?.code ? ` (${creator.code})` : (dealer?.code ? ` (${dealer.code})` : '');
                      badgeColor = 'bg-purple-950/70 text-purple-300 border-purple-800/50';
                    }

                    return (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md border ${badgeColor}`}>
                        <span className="text-slate-400 font-normal">Created by:</span>
                        <span className="font-bold">{creatorName}{creatorCode}</span>
                        <span className="text-[10px] uppercase tracking-wider opacity-75 font-mono">[{creatorType}]</span>
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    fetchAppliances();
                    fetchBrands();
                    fetchTechnicians();
                    fetchDealers();
                    setEditingTicket(selectedTicket);
                  }}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-1.5 px-3.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition"
                  title="Edit Ticket Details"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Ticket</span>
                </button>
                <button 
                  onClick={() => { setSelectedTicket(null); setShowCancelForm(false); setCancelReason(''); fetchData(); fetchDashboardData(); }} 
                  className="text-slate-400 hover:text-slate-200 cursor-pointer p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
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
                      <p className="font-bold text-slate-200">{selectedTicket.customer?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">Mobile</p>
                      <p className="font-medium">{selectedTicket.customer?.mobile || 'N/A'} {selectedTicket.customer?.alternateMobile && ` / ${selectedTicket.customer.alternateMobile}`}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 font-semibold">Address</p>
                      <p>{selectedTicket.customer?.address || 'N/A'}{selectedTicket.customer?.city ? `, ${selectedTicket.customer.city}` : ''}{selectedTicket.customer?.pincode ? ` - ${selectedTicket.customer.pincode}` : ''}</p>
                    </div>
                  </div>
                </div>

                {/* Product details */}
                <div className="bg-slate-800/40 border border-slate-850 p-5 rounded-2xl">
                  <h4 className="font-bold text-white mb-3 text-sm border-b border-slate-700 pb-2">Product & Service Scope</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">Product Name</p>
                      <p className="font-semibold text-slate-200">{selectedTicket.product?.name || 'N/A'} ({selectedTicket.product?.category || 'N/A'})</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">Model / Serial Number</p>
                      <p>{selectedTicket.product?.modelNumber || 'N/A'} • {selectedTicket.product?.serialNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">Invoice Number & Purchase Date</p>
                      <p>{selectedTicket.product?.invoiceNumber || 'N/A'} • {selectedTicket.product?.purchaseDate ? new Date(selectedTicket.product.purchaseDate).toLocaleDateString() : 'N/A'}</p>
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
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">Priority Level</p>
                      {(() => {
                        const pri = selectedTicket.installationDetails?.priority || selectedTicket.serviceDetails?.priority || 'medium';
                        const isHigh = pri.toLowerCase() === 'high';
                        const isLow = pri.toLowerCase() === 'low';
                        return (
                          <span className={`inline-block mt-1 text-xs font-black uppercase px-2.5 py-1 rounded-lg ${
                            isHigh ? 'bg-red-950/80 text-red-400 border border-red-800/60' :
                            isLow ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                            'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                          }`}>
                            {pri.toLowerCase() === 'medium' ? 'Mid Priority' : `${pri} Priority`}
                          </span>
                        );
                      })()}
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

                {/* Financial & Fee Breakdown Card */}
                <div className="bg-slate-800/40 border border-slate-850 p-5 rounded-2xl">
                  <h4 className="font-bold text-white mb-3 text-sm border-b border-slate-700 pb-2 flex items-center justify-between">
                    <span>Fee & Expense Details</span>
                    <span className="text-[11px] text-slate-400 font-normal capitalize">
                      {selectedTicket.type} ({selectedTicket.product?.category} - {selectedTicket.product?.name})
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Technician Earning */}
                    <div className="bg-slate-900/60 border border-emerald-900/40 p-3.5 rounded-xl">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Technician Earning</p>
                      </div>
                      <p className="text-xl font-extrabold text-emerald-300">
                        {typeof selectedTicket.technicianEarning === 'number'
                          ? `₹ ${selectedTicket.technicianEarning}`
                          : typeof selectedTicket.technicianFee === 'number'
                            ? `₹ ${selectedTicket.technicianFee}`
                            : selectedTicket.technicianEarning || 'Fee Not Configured'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Tech: {selectedTicket.assignedTechnician?.name || 'Unassigned'}
                      </p>
                    </div>

                    {/* Dealer Expense */}
                    <div className="bg-slate-900/60 border border-amber-900/40 p-3.5 rounded-xl">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <p className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Dealer Expense</p>
                      </div>
                      <p className="text-xl font-extrabold text-amber-300">
                        {typeof selectedTicket.dealerExpense === 'number'
                          ? `₹ ${selectedTicket.dealerExpense}`
                          : selectedTicket.dealerExpense || '₹ 0'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {selectedTicket.type === 'service' 
                          ? (selectedTicket.serviceType || selectedTicket.serviceDetails?.serviceType || 'In Warranty')
                          : (selectedTicket.installationType || selectedTicket.installationDetails?.installationType || 'Free Installation')}
                        {((selectedTicket.type === 'service' ? (selectedTicket.serviceType || selectedTicket.serviceDetails?.serviceType) : (selectedTicket.installationType || selectedTicket.installationDetails?.installationType)) !== 'Paid by Dealer') 
                          ? ' (₹0 Expense)' 
                          : (selectedTicket.totalPartsPrice > 0 
                              ? ` (Fee + Parts: ₹${selectedTicket.totalPartsPrice})` 
                              : ' (Paid by Dealer)')}
                      </p>
                    </div>

                    {/* Customer Fee */}
                    <div className="bg-slate-900/60 border border-violet-900/40 p-3.5 rounded-xl">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                        <p className="text-[11px] text-violet-400 font-bold uppercase tracking-wider">Customer Fee</p>
                      </div>
                      <p className="text-xl font-extrabold text-violet-300">
                        ₹ {selectedTicket.customerFee ?? (selectedTicket.type === 'installation' ? (selectedTicket.customerInstallationFee ?? selectedTicket.installationFee ?? 0) : (selectedTicket.customerServiceFee ?? selectedTicket.serviceFee ?? 0))}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Customer Billing Rate
                      </p>
                    </div>
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
                        {/* Before & After Photos */}
                        {(comp.beforePhotos && comp.beforePhotos.length > 0) || (comp.afterPhotos && comp.afterPhotos.length > 0) ? (
                          <div className="space-y-3">
                            {comp.beforePhotos && comp.beforePhotos.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
                                  <span>📷</span> Before Photos ({comp.beforePhotos.length}/2):
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {comp.beforePhotos.map((photo, i) => (
                                    <a key={i} href={photo.startsWith('http') ? photo : `${API_BASE.startsWith('http') ? new URL(API_BASE).origin : ''}/${photo}`} target="_blank" rel="noreferrer">
                                      <img src={photo.startsWith('http') ? photo : `${API_BASE.startsWith('http') ? new URL(API_BASE).origin : ''}/${photo}`} alt={`Before ${i+1}`} className="rounded-xl object-cover w-full h-24 border border-amber-800/40 hover:opacity-90 transition" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                            {comp.afterPhotos && comp.afterPhotos.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-emerald-400 mb-1.5 flex items-center gap-1.5">
                                  <span>✅</span> After Photos ({comp.afterPhotos.length}/4):
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {comp.afterPhotos.map((photo, i) => (
                                    <a key={i} href={photo.startsWith('http') ? photo : `${API_BASE.startsWith('http') ? new URL(API_BASE).origin : ''}/${photo}`} target="_blank" rel="noreferrer">
                                      <img src={photo.startsWith('http') ? photo : `${API_BASE.startsWith('http') ? new URL(API_BASE).origin : ''}/${photo}`} alt={`After ${i+1}`} className="rounded-xl object-cover w-full h-24 border border-emerald-800/40 hover:opacity-90 transition" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          comp.photos && comp.photos.length > 0 && (
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
                          )
                        )}

                        {/* Parts Used */}
                        {comp.usedParts && comp.usedParts.length > 0 && (
                          <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800 space-y-2">
                            <p className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                              📦 Spare Parts / Inventory Used
                            </p>
                            <div className="divide-y divide-slate-800 text-xs">
                              {comp.usedParts.map((item, pIdx) => {
                                const partId = typeof item.part === 'string' ? item.part : (item.part?._id || item.part);
                                const invMatch = inventory.find(inv => inv._id === partId);
                                const partName = item.part?.name || item.name || invMatch?.name || (typeof item.part === 'string' ? (invMatch?.name || item.part) : 'Spare Part');
                                const partSku = item.part?.sku || item.sku || invMatch?.sku || '';
                                return (
                                  <div key={pIdx} className="py-1.5 flex items-center justify-between text-slate-300">
                                    <div>
                                      <span className="font-semibold text-white">{partName}</span>
                                      {partSku && <span className="text-slate-500 font-mono ml-2">({partSku})</span>}
                                    </div>
                                    <span className="font-bold text-violet-300 bg-violet-950/60 px-2 py-0.5 rounded border border-violet-850">
                                      Qty: {item.quantity}
                                    </span>
                                  </div>
                                );
                              })}
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
                  {selectedTicket.status === 'new' && (() => {
                    const rawTicketPincode = (selectedTicket.customer?.pincode || '').toString().trim();
                    const ticketPincodeDigits = rawTicketPincode.replace(/\D/g, '');

                    const ticketApplianceName = (selectedTicket.product?.category || '').toString().trim().toLowerCase();
                    const cleanTicketAppName = ticketApplianceName.replace(/[^a-z0-9]/g, '');

                    const targetAppObj = appliances.find(a => {
                      if (!a || !a.name) return false;
                      const aClean = a.name.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                      return aClean === cleanTicketAppName || a.name.toString().trim().toLowerCase() === ticketApplianceName;
                    });
                    const targetAppId = targetAppObj ? targetAppObj._id.toString() : null;

                    const eligibleTechnicians = activeTechniciansForAssign.filter(tech => {
                      // 1. Flatten all pincodes (handles comma-separated strings inside array)
                      const techPincodesList = [];
                      if (Array.isArray(tech.pincodes)) {
                        tech.pincodes.forEach(item => {
                          if (typeof item === 'string') {
                            item.split(',').forEach(sub => {
                              const trimmed = sub.trim();
                              if (trimmed) techPincodesList.push(trimmed);
                            });
                          } else if (item != null) {
                            techPincodesList.push(String(item).trim());
                          }
                        });
                      } else if (typeof tech.pincodes === 'string') {
                        tech.pincodes.split(',').forEach(sub => {
                          const trimmed = sub.trim();
                          if (trimmed) techPincodesList.push(trimmed);
                        });
                      }

                      // Match Pincode (by exact string or normalized 6-digit digits)
                      const servesPincode = techPincodesList.some(p => {
                        if (!p) return false;
                        const pStr = p.toString().trim();
                        const pDigits = pStr.replace(/\D/g, '');
                        if (rawTicketPincode && pStr === rawTicketPincode) return true;
                        if (ticketPincodeDigits && pDigits === ticketPincodeDigits) return true;
                        return false;
                      });

                      // 2. Match Appliance
                      const techAppList = Array.isArray(tech.appliances) ? tech.appliances : [];
                      const servesAppliance = techAppList.some(a => {
                        if (!a) return false;
                        if (typeof a === 'object') {
                          const aName = (a.name || '').toString().trim().toLowerCase();
                          const aClean = aName.replace(/[^a-z0-9]/g, '');
                          const nameMatch = aName === ticketApplianceName || (cleanTicketAppName && aClean === cleanTicketAppName);
                          const idMatch = targetAppId && a._id && (a._id.toString() === targetAppId);
                          return nameMatch || idMatch;
                        } else if (typeof a === 'string') {
                          const aStr = a.toString().trim();
                          const aLower = aStr.toLowerCase();
                          const aClean = aLower.replace(/[^a-z0-9]/g, '');
                          return (targetAppId && aStr === targetAppId) || aLower === ticketApplianceName || (cleanTicketAppName && aClean === cleanTicketAppName);
                        }
                        return false;
                      });

                      return servesPincode && servesAppliance;
                    });

                    return (
                      <form onSubmit={handleAssign} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-slate-400">Assign Technician</label>
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            Pincode: <strong className="text-violet-400">{rawTicketPincode || 'N/A'}</strong> | Appliance: <strong className="text-violet-400">{selectedTicket.product?.category || 'N/A'}</strong>
                          </span>
                        </div>

                        {eligibleTechnicians.length > 0 ? (
                          <select 
                            required
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                            value={assignTechId}
                            onChange={e => setAssignTechId(e.target.value)}
                          >
                            <option value="">Select Technician ({eligibleTechnicians.length} available)...</option>
                            {eligibleTechnicians.map(tech => (
                              <option key={tech._id} value={tech._id}>
                                {tech.name} ({tech.code})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-3 text-xs text-amber-300 space-y-1">
                            <p className="font-bold flex items-center gap-1.5 text-amber-400">
                              <span>⚠️</span> No eligible technicians found
                            </p>
                            <p className="text-[11px] text-slate-400">
                              No active technician is configured to serve pincode <span className="font-semibold text-amber-300">{rawTicketPincode || 'N/A'}</span> for appliance <span className="font-semibold text-amber-300">{selectedTicket.product?.category || 'N/A'}</span>.
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Go to <span className="text-violet-400 font-semibold">Manage Technicians → Edit Details</span> to add this pincode and associate this appliance.
                            </p>
                          </div>
                        )}

                        <textarea
                          placeholder="Assignment notes/schedule..."
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-hidden"
                          value={assignNotes}
                          onChange={e => setAssignNotes(e.target.value)}
                        />
                        <button 
                          type="submit" 
                          disabled={eligibleTechnicians.length === 0}
                          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg text-xs cursor-pointer shadow-md transition"
                        >
                          Assign Technician
                        </button>
                      </form>
                    );
                  })()}

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
                        const cancelTimeline = Array.isArray(selectedTicket.timeline) ? selectedTicket.timeline.slice().reverse().find(item => item.status === 'cancelled') : null;
                        return cancelTimeline && <p className="italic text-slate-300 mt-1">Reason: {(cancelTimeline.note || '').replace('Ticket cancelled by Admin. Reason: ', '')}</p>;
                      })()}
                    </div>
                  )}

                  {selectedTicket.status === 'assigned' || selectedTicket.status === 'in_progress' ? (
                    <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700/50 space-y-2 text-xs">
                      <p className="font-semibold text-slate-300">Currently Assigned: {selectedTicket.assignedTechnician?.name || 'Technician'}</p>
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
                    {Array.isArray(selectedTicket.timeline) && selectedTicket.timeline.map((entry, idx) => (
                      <div key={idx} className="flex gap-3 text-xs">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                          {idx < selectedTicket.timeline.length - 1 && <div className="w-0.5 flex-1 bg-slate-700 my-1" />}
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-200 capitalize">{(entry?.status || '').replace('_', ' ')}</p>
                          <p className="text-slate-400">{entry?.note || ''}</p>
                          <p className="text-slate-500 text-[10px]">{entry?.updatedBy || 'System'} • {entry?.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}</p>
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-white text-base">Configure Brand Fees</h3>
                <p className="text-xs text-slate-400 mt-0.5">{feeForm.brandName} &bull; {feeForm.applianceName}</p>
              </div>
              <button onClick={() => setFeeForm(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveFee} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* 1. Customer Fee Section */}
              <div className="bg-slate-950/60 border border-violet-900/40 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                  <h4 className="text-xs font-bold text-violet-300 uppercase tracking-wider">1. Customer Fee</h4>
                  <span className="text-[11px] text-slate-500">(Charged to end customer)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Customer Service Fee (₹)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 250"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                      value={feeForm.customerServiceFee}
                      onChange={e => setFeeForm({ ...feeForm, customerServiceFee: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Customer Installation Fee (₹)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 500"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                      value={feeForm.customerInstallationFee}
                      onChange={e => setFeeForm({ ...feeForm, customerInstallationFee: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Dealer Fee Section */}
              <div className="bg-slate-950/60 border border-amber-900/40 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">2. Dealer Fee</h4>
                  <span className="text-[11px] text-slate-500">(Dealer expense / billing rate)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Dealer Service Fee (₹)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 200"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      value={feeForm.dealerServiceFee}
                      onChange={e => setFeeForm({ ...feeForm, dealerServiceFee: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Dealer Installation Fee (₹)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 400"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      value={feeForm.dealerInstallationFee}
                      onChange={e => setFeeForm({ ...feeForm, dealerInstallationFee: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Technician Fee Section */}
              <div className="bg-slate-950/60 border border-emerald-900/40 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">3. Technician Fee</h4>
                  <span className="text-[11px] text-slate-500">(Technician earning payout)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Technician Service Fee (₹)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 150"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      value={feeForm.technicianServiceFee}
                      onChange={e => setFeeForm({ ...feeForm, technicianServiceFee: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Technician Installation Fee (₹)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 300"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      value={feeForm.technicianInstallationFee}
                      onChange={e => setFeeForm({ ...feeForm, technicianInstallationFee: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFeeForm(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-500 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition cursor-pointer"
                >
                  Save Fee Configuration
                </button>
              </div>
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
                  <div className="relative">
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Customer Name *</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                      value={newRequestForm.customer.name}
                      onChange={e => {
                        const val = e.target.value;
                        setNewRequestForm({ 
                          ...newRequestForm, 
                          customer: { ...newRequestForm.customer, name: val } 
                        });
                        if (val.trim().length >= 2) {
                          const matches = customers.filter(c => 
                            c.name.toLowerCase().includes(val.toLowerCase()) || 
                            (c.mobile && c.mobile.includes(val))
                          );
                          setCustSuggestions(matches);
                        } else {
                          setCustSuggestions([]);
                        }
                      }}
                      onBlur={() => setTimeout(() => setCustSuggestions([]), 350)}
                    />
                    {custSuggestions.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-40 overflow-y-auto divide-y divide-slate-700">
                        {custSuggestions.map(c => (
                          <button
                            key={c.mobile}
                            type="button"
                            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-violet-600 transition flex justify-between items-center cursor-pointer"
                            onClick={() => {
                              setNewRequestForm({
                                ...newRequestForm,
                                customer: {
                                  name: c.name || '',
                                  mobile: c.mobile || '',
                                  alternateMobile: c.alternateMobile || '',
                                  address: c.address || '',
                                  city: c.city || '',
                                  pincode: c.pincode || ''
                                }
                              });
                              setCustSuggestions([]);
                            }}
                          >
                            <span className="font-bold">{c.name}</span>
                            <span className="text-xs text-slate-450">{c.mobile} ({c.city})</span>
                          </button>
                        ))}
                      </div>
                    )}
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
              {newRequestForm.type === 'service' ? (
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">Service Request Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Service Type *</label>
                      <select 
                        required 
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white cursor-pointer font-medium"
                        value={newRequestForm.serviceType || newRequestForm.serviceDetails?.serviceType || 'In Warranty'}
                        onChange={e => setNewRequestForm({ 
                          ...newRequestForm, 
                          serviceType: e.target.value,
                          serviceDetails: { ...newRequestForm.serviceDetails, serviceType: e.target.value } 
                        })}
                      >
                        <option value="In Warranty">In Warranty</option>
                        <option value="Out Warranty">Out Warranty</option>
                        <option value="Paid by Dealer">Paid by Dealer</option>
                      </select>
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
                    <div className="md:col-span-3">
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
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">Installation Request Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Installation Type *</label>
                      <select 
                        required 
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white cursor-pointer font-medium"
                        value={newRequestForm.installationType || newRequestForm.installationDetails?.installationType || 'Free Installation'}
                        onChange={e => setNewRequestForm({ 
                          ...newRequestForm, 
                          installationType: e.target.value,
                          installationDetails: { 
                            ...newRequestForm.installationDetails, 
                            installationType: e.target.value 
                          } 
                        })}
                      >
                        <option value="Free Installation">Free Installation</option>
                        <option value="Paid Installation">Paid Installation</option>
                        <option value="Paid by Dealer">Paid by Dealer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Priority *</label>
                      <select 
                        required 
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white cursor-pointer"
                        value={newRequestForm.installationDetails?.priority || 'medium'}
                        onChange={e => setNewRequestForm({ 
                          ...newRequestForm, 
                          installationDetails: { 
                            ...newRequestForm.installationDetails, 
                            priority: e.target.value 
                          } 
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

              {/* Live Fee & Expense Breakdown */}
              {(() => {
                const selectedBrand = brands.find(b => {
                  const appObj = appliances.find(a => a.name === newRequestForm.product.category);
                  return appObj && (b.appliance === appObj._id || b.appliance?._id === appObj._id) && b.name === newRequestForm.product.name;
                });

                let custFee = 0;
                let dlrExpense = 0;
                const configuredCustServiceFee = selectedBrand ? (selectedBrand.customerServiceFee ?? selectedBrand.serviceFee ?? 0) : 0;
                const configuredCustInstallFee = selectedBrand ? (selectedBrand.customerInstallationFee ?? selectedBrand.installationFee ?? 0) : 0;
                const configuredDlrServiceFee = selectedBrand ? (selectedBrand.dealerServiceFee ?? selectedBrand.serviceFee ?? 0) : 0;
                const configuredDlrInstallFee = selectedBrand ? (selectedBrand.dealerInstallationFee ?? selectedBrand.installationFee ?? 0) : 0;

                const isService = newRequestForm.type === 'service';
                const sType = newRequestForm.serviceType || newRequestForm.serviceDetails?.serviceType || 'In Warranty';
                const iType = newRequestForm.installationType || newRequestForm.installationDetails?.installationType || 'Free Installation';

                if (isService) {
                  if (sType === 'Out Warranty') {
                    custFee = configuredCustServiceFee;
                    dlrExpense = 0;
                  } else if (sType === 'Paid by Dealer') {
                    custFee = 0;
                    dlrExpense = configuredDlrServiceFee;
                  } else {
                    custFee = 0;
                    dlrExpense = 0;
                  }
                } else {
                  if (iType === 'Paid Installation') {
                    custFee = configuredCustInstallFee;
                    dlrExpense = 0;
                  } else if (iType === 'Paid by Dealer') {
                    custFee = 0;
                    dlrExpense = configuredDlrInstallFee;
                  } else {
                    custFee = 0;
                    dlrExpense = 0;
                  }
                }

                return (
                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span>💰</span> Applicable Fee & Expense Details
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {isService ? sType : iType}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Customer Fee */}
                      <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Customer Fee</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {custFee > 0 ? 'To be collected from customer' : (isService ? (sType === 'In Warranty' ? 'Free (In Warranty)' : 'Covered by Dealer') : (iType === 'Free Installation' ? 'Free Installation' : 'Covered by Dealer'))}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-base font-black ${custFee > 0 ? 'text-violet-400' : 'text-slate-400'}`}>
                            ₹ {custFee}
                          </span>
                        </div>
                      </div>

                      {/* Dealer Expense */}
                      <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dealer Expense</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {dlrExpense > 0 ? 'Incurred by dealer on completion' : 'No dealer expense incurred'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-base font-black ${dlrExpense > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                            ₹ {dlrExpense}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

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

      {/* Dealer Video Upload Modal */}
      {dealerVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-violet-400" />
                Upload Monthly Dealer Video
              </h3>
              <button 
                onClick={() => setDealerVideoModalOpen(false)} 
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDealerVideo} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Target Month & Year *
                </label>
                <input
                  required
                  type="month"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-violet-500 cursor-pointer"
                  value={dealerVideoForm.monthYear}
                  onChange={e => setDealerVideoForm({ ...dealerVideoForm, monthYear: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Video Title / Topic *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. August 2026 Monthly Product Briefing & Policies"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-violet-500"
                  value={dealerVideoForm.title}
                  onChange={e => setDealerVideoForm({ ...dealerVideoForm, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Description / Key Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Short note or summary of what is covered in this video..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-violet-500"
                  value={dealerVideoForm.description}
                  onChange={e => setDealerVideoForm({ ...dealerVideoForm, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Select Video File (.mp4, .mov, .webm) *
                </label>
                <input
                  type="file"
                  required={!dealerVideoForm.videoUrl}
                  accept="video/mp4,video/quicktime,video/webm,video/x-matroska,video/*"
                  onChange={handleDealerVideoFileUpload}
                  disabled={isUploadingDealerVideo}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-violet-600 file:text-white hover:file:bg-violet-500 cursor-pointer disabled:opacity-50"
                />
                {isUploadingDealerVideo && (
                  <p className="text-xs text-violet-400 mt-1.5 flex items-center gap-1.5">
                    <span className="inline-block animate-spin">⏳</span> Uploading video file... please wait
                  </p>
                )}
                {!isUploadingDealerVideo && dealerVideoForm.videoUrl && (
                  <p className="text-xs text-emerald-400 mt-1.5 font-semibold">
                    ✓ Video file uploaded successfully
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDealerVideoModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingDealerVideo || !dealerVideoForm.videoUrl}
                  className="bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md cursor-pointer transition"
                >
                  Save & Publish Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {activePlayingVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base truncate">
                  {activePlayingVideo.title}
                </h3>
                <p className="text-xs text-slate-400">
                  Month: {activePlayingVideo.monthYear} • Uploaded by: {activePlayingVideo.uploadedByName || 'Admin'}
                </p>
              </div>
              <button 
                onClick={() => setActivePlayingVideo(null)} 
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                <video 
                  controls 
                  autoPlay
                  className="w-full h-full object-contain"
                  src={`${API_BASE}/${activePlayingVideo.videoUrl}`}
                >
                  Your browser does not support the video tag.
                </video>
              </div>

              {activePlayingVideo.description && (
                <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Description / Notes</h4>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{activePlayingVideo.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Library Add / Edit Modal */}
      {videoLibraryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-violet-400" />
                {videoLibraryModal === 'edit' ? 'Edit Video Library Item' : 'Add Video to Library'}
              </h3>
              <button 
                onClick={() => setVideoLibraryModal(false)} 
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVideoLibraryItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Video Title *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Inverter AC Installation Standard Operating Procedure"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-violet-500"
                  value={videoLibraryForm.title}
                  onChange={e => setVideoLibraryForm({ ...videoLibraryForm, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Select Appliance *
                  </label>
                  <select
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-violet-500 cursor-pointer"
                    value={videoLibraryForm.appliance}
                    onChange={e => {
                      const appVal = e.target.value;
                      const availableBrands = brands.filter(b => (b.appliance?._id || b.appliance) === appVal);
                      setVideoLibraryForm({ 
                        ...videoLibraryForm, 
                        appliance: appVal,
                        brand: availableBrands[0]?._id || ''
                      });
                    }}
                  >
                    <option value="">-- Choose Appliance --</option>
                    {appliances.map(app => (
                      <option key={app._id} value={app._id}>{app.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Select Brand *
                  </label>
                  <select
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-violet-500 cursor-pointer"
                    value={videoLibraryForm.brand}
                    onChange={e => setVideoLibraryForm({ ...videoLibraryForm, brand: e.target.value })}
                  >
                    <option value="">-- Choose Brand --</option>
                    {brands
                      .filter(b => !videoLibraryForm.appliance || (b.appliance?._id || b.appliance) === videoLibraryForm.appliance)
                      .map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Video Link (URL or Embed) *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. https://www.youtube.com/watch?v=... or https://..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-violet-500 font-mono text-xs"
                  value={videoLibraryForm.videoUrl}
                  onChange={e => setVideoLibraryForm({ ...videoLibraryForm, videoUrl: e.target.value })}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports YouTube, Vimeo, direct MP4, or cloud video links.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                  Description / Topic Notes
                </label>
                <textarea
                  rows="3"
                  placeholder="Key steps, timestamp highlights, or diagnostic points covered in this video..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-violet-500"
                  value={videoLibraryForm.description}
                  onChange={e => setVideoLibraryForm({ ...videoLibraryForm, description: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setVideoLibraryModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md cursor-pointer transition"
                >
                  {videoLibraryModal === 'edit' ? 'Update Video' : 'Save to Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Library Player Modal */}
      {activePlayingLibraryVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800/40">
                    {activePlayingLibraryVideo.appliance?.name || 'Appliance'}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {activePlayingLibraryVideo.brand?.name || 'Brand'}
                  </span>
                </div>
                <h3 className="font-bold text-white text-base truncate">
                  {activePlayingLibraryVideo.title}
                </h3>
              </div>
              <button 
                onClick={() => setActivePlayingLibraryVideo(null)} 
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                {(() => {
                  const url = activePlayingLibraryVideo.videoUrl || '';
                  // Check for YouTube URL
                  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
                  if (ytMatch && ytMatch[1]) {
                    return (
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`}
                        title={activePlayingLibraryVideo.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    );
                  }
                  // Check for Vimeo URL
                  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/);
                  if (vimeoMatch && vimeoMatch[3]) {
                    return (
                      <iframe
                        className="w-full h-full"
                        src={`https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1`}
                        title={activePlayingLibraryVideo.title}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    );
                  }
                  // Native HTML5 video or direct link
                  const videoSrc = url.startsWith('http') ? url : `${API_BASE}/${url}`;
                  return (
                    <video 
                      controls 
                      autoPlay
                      className="w-full h-full object-contain"
                      src={videoSrc}
                    >
                      Your browser does not support the video tag.
                    </video>
                  );
                })()}
              </div>

              {activePlayingLibraryVideo.description && (
                <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Description / Notes</h4>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{activePlayingLibraryVideo.description}</p>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <span>Link: <a href={activePlayingLibraryVideo.videoUrl} target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">{activePlayingLibraryVideo.videoUrl}</a></span>
                <span>Added: {new Date(activePlayingLibraryVideo.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Evaluation Modal (Create / Edit) */}
      {evaluationModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
            <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">
                    {evaluationModal.id ? 'Edit Performance Evaluation' : 'New Monthly Performance Evaluation'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Rate the technician from 1 to 10 across key service performance criteria
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEvaluationModal(null)} 
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Lock Warning if finalized */}
              {evaluationModal.isLocked && (
                <div className="bg-amber-950/40 border border-amber-800/50 p-4 rounded-xl flex items-center justify-between text-xs text-amber-300">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>This evaluation is <strong>FINALIZED</strong> and locked. As an Admin, you can edit and re-save or unlock it.</span>
                  </div>
                </div>
              )}

              {/* Technician, Month, Year Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Technician *
                  </label>
                  <select
                    disabled={Boolean(evaluationModal.id)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 disabled:opacity-60"
                    value={evaluationModal.technicianId}
                    onChange={e => {
                      const techId = e.target.value;
                      const tech = technicians.find(t => (t._id === techId || t.id === techId));
                      setEvaluationModal({
                        ...evaluationModal,
                        technicianId: techId,
                        technicianName: tech ? tech.name : '',
                        technicianCode: tech ? tech.code : ''
                      });
                    }}
                  >
                    <option value="">Select Technician</option>
                    {technicians.map(t => (
                      <option key={t._id || t.id} value={t._id || t.id}>
                        {t.name} {t.code ? `(${t.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Evaluation Month *
                  </label>
                  <select
                    disabled={Boolean(evaluationModal.id)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 disabled:opacity-60"
                    value={evaluationModal.month}
                    onChange={e => setEvaluationModal({ ...evaluationModal, month: e.target.value })}
                  >
                    {MONTHS_LIST.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Year *
                  </label>
                  <select
                    disabled={Boolean(evaluationModal.id)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 disabled:opacity-60"
                    value={evaluationModal.year}
                    onChange={e => setEvaluationModal({ ...evaluationModal, year: Number(e.target.value) })}
                  >
                    {YEARS_LIST.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live Final Score Banner */}
              {(() => {
                const totalRatings = evaluationModal.ratings || [];
                const sum = totalRatings.reduce((acc, r) => acc + Number(r.rating || 0), 0);
                const avgScore = totalRatings.length > 0 ? (sum / totalRatings.length).toFixed(1) : '0.0';
                const scoreNum = Number(avgScore);

                let bandLabel = 'Average';
                let bandStyle = 'bg-amber-950 text-amber-400 border border-amber-800/60';
                if (scoreNum >= 9.0) {
                  bandLabel = 'Excellent';
                  bandStyle = 'bg-emerald-950 text-emerald-300 border border-emerald-800/60';
                } else if (scoreNum >= 7.5) {
                  bandLabel = 'Good';
                  bandStyle = 'bg-blue-950 text-blue-300 border border-blue-800/60';
                } else if (scoreNum < 5.0) {
                  bandLabel = 'Needs Improvement';
                  bandStyle = 'bg-rose-950 text-rose-300 border border-rose-800/60';
                }

                return (
                  <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950/40 p-4 rounded-2xl border border-violet-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                    <div className="space-y-0.5 text-center sm:text-left">
                      <span className="text-[11px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1 justify-center sm:justify-start">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Real-time Calculated Final Score
                      </span>
                      <p className="text-xs text-slate-400">
                        Final Score = Average of all {totalRatings.length} evaluated criteria ratings
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700/80 text-center">
                        <span className="text-2xl font-black text-white">{avgScore}</span>
                        <span className="text-xs text-slate-400 ml-1">/ 10</span>
                      </div>
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${bandStyle}`}>
                        {bandLabel}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Performance Areas Ratings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    Performance Criteria Ratings (1 – 10)
                  </h4>
                  <span className="text-[11px] text-slate-500">1: Poor &bull; 10: Outstanding</span>
                </div>

                <div className="space-y-3">
                  {(evaluationModal.ratings || []).map((r, idx) => {
                    const ratingVal = Number(r.rating) || 1;
                    return (
                      <div key={r.areaId || idx} className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl space-y-3 hover:border-slate-700/80 transition">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="font-bold text-white text-sm">{r.areaName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400">Rating:</span>
                            <span className="font-black text-sm px-2.5 py-0.5 rounded-lg bg-violet-950/80 text-violet-300 border border-violet-800/40">
                              {ratingVal} / 10
                            </span>
                          </div>
                        </div>

                        {/* 1-10 Pill Buttons */}
                        <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                            const isSelected = ratingVal === num;
                            let btnColor = 'bg-slate-800/90 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border-slate-700/60';
                            if (isSelected) {
                              if (num >= 9) btnColor = 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30 border-emerald-500';
                              else if (num >= 7) btnColor = 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30 border-blue-500';
                              else if (num >= 5) btnColor = 'bg-amber-600 text-white font-black shadow-md shadow-amber-600/30 border-amber-500';
                              else btnColor = 'bg-rose-600 text-white font-black shadow-md shadow-rose-600/30 border-rose-500';
                            }

                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => {
                                  const newRatings = [...evaluationModal.ratings];
                                  newRatings[idx] = { ...newRatings[idx], rating: num };
                                  setEvaluationModal({ ...evaluationModal, ratings: newRatings });
                                }}
                                className={`py-1.5 sm:py-2 text-xs font-bold rounded-lg border transition cursor-pointer text-center ${btnColor}`}
                              >
                                {num}
                              </button>
                            );
                          })}
                        </div>

                        {/* Optional notes for this area */}
                        <input
                          type="text"
                          placeholder={`Add specific remark for ${r.areaName} (Optional)...`}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                          value={r.comments || ''}
                          onChange={e => {
                            const newRatings = [...evaluationModal.ratings];
                            newRatings[idx] = { ...newRatings[idx], comments: e.target.value };
                            setEvaluationModal({ ...evaluationModal, ratings: newRatings });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Overall Remarks / Feedback */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Admin Remarks & Improvement Feedback
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter overall feedback, commendations, areas of improvement, or notes..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={evaluationModal.remarks || ''}
                  onChange={e => setEvaluationModal({ ...evaluationModal, remarks: e.target.value })}
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-t border-slate-800 gap-3">
              <button 
                type="button" 
                onClick={() => setEvaluationModal(null)} 
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              
              <div className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => saveEvaluation('draft')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs border border-slate-700 cursor-pointer transition flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5 text-amber-400" />
                  Save as Draft
                </button>
                <button 
                  type="button" 
                  onClick={() => saveEvaluation('finalized')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md cursor-pointer transition flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Submit & Finalize
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Technician Performance Profile & Trend Modal */}
      {selectedTechProfile && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-850 px-6 py-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-black text-white text-xl shadow-lg shrink-0">
                  {selectedTechProfile.technician?.name?.charAt(0).toUpperCase() || 'T'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-white text-xl">
                      {selectedTechProfile.technician?.name}
                    </h3>
                    <span className="font-mono text-xs bg-slate-800 text-violet-400 px-2.5 py-0.5 rounded-lg border border-slate-700">
                      {selectedTechProfile.technician?.code || 'TECH'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Mobile: {selectedTechProfile.technician?.mobile || 'N/A'} &bull; Email: {selectedTechProfile.technician?.email || 'N/A'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTechProfile(null)} 
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Summary Stats Card Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Lifetime Avg Score</span>
                    <p className="text-2xl font-black text-amber-400 mt-1">
                      {selectedTechProfile.lifetimeAverageScore} <span className="text-xs text-slate-400 font-normal">/ 10</span>
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-amber-400/30 fill-amber-400/20" />
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overall Rating Band</span>
                    <p className="text-base font-extrabold text-white mt-1">
                      {selectedTechProfile.currentBand}
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-violet-400/30" />
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Months Evaluated</span>
                    <p className="text-2xl font-black text-white mt-1">
                      {selectedTechProfile.totalEvaluations}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-slate-600" />
                </div>
              </div>

              {/* Monthly Performance Trend Section */}
              <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-violet-400" />
                    Monthly Score Progression & Trend
                  </h4>
                  <span className="text-xs text-slate-500">Historical performance timeline</span>
                </div>

                {(!selectedTechProfile.monthlyTrend || selectedTechProfile.monthlyTrend.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">No monthly evaluations recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {selectedTechProfile.monthlyTrend.map((item, idx) => {
                        const prev = idx > 0 ? selectedTechProfile.monthlyTrend[idx - 1] : null;
                        const diff = prev ? (item.finalScore - prev.finalScore).toFixed(1) : null;

                        return (
                          <div key={item.id || idx} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-2 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-300">{item.month} {item.year}</span>
                              {diff !== null && (
                                <span className={`text-[10px] font-bold ${Number(diff) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {Number(diff) >= 0 ? `+${diff}` : diff}
                                </span>
                              )}
                            </div>
                            <div className="flex items-baseline justify-between">
                              <span className="text-xl font-black text-white">{item.finalScore} <span className="text-[10px] text-slate-400 font-normal">/10</span></span>
                              <span className="text-[10px] uppercase font-bold text-slate-400">{item.performanceBand}</span>
                            </div>
                            {/* Score Progress Bar */}
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full" 
                                style={{ width: `${(item.finalScore / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Performance Criteria Averages Breakdown */}
              <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  Area-wise Average Ratings Across Evaluations
                </h4>

                {(!selectedTechProfile.areaAverages || selectedTechProfile.areaAverages.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">No area breakdown data available.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedTechProfile.areaAverages.map(area => (
                      <div key={area.areaName} className="bg-slate-900 border border-slate-800/80 p-3.5 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-300">{area.areaName}</span>
                          <span className="font-black text-white">{area.averageRating} / 10</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              area.averageRating >= 8.5 ? 'bg-emerald-500' :
                              area.averageRating >= 7.0 ? 'bg-blue-500' :
                              area.averageRating >= 5.0 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${(area.averageRating / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Evaluations Table */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Evaluation Records & Remarks History
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase">
                        <th className="p-3">Period</th>
                        <th className="p-3 text-center">Final Score</th>
                        <th className="p-3">Rating Band</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Evaluator</th>
                        <th className="p-3">Remarks / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {(selectedTechProfile.evaluations || []).map(ev => (
                        <tr key={ev._id} className="hover:bg-slate-900/40">
                          <td className="p-3 font-bold text-white">{ev.month} {ev.year}</td>
                          <td className="p-3 text-center font-black text-amber-400">{ev.finalScore} / 10</td>
                          <td className="p-3 uppercase text-[10px] font-bold">{ev.performanceBand}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ev.status === 'finalized' ? 'text-emerald-400 bg-emerald-950' : 'text-amber-400 bg-amber-950'}`}>
                              {ev.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">{ev.evaluatedBy}</td>
                          <td className="p-3 text-slate-300 italic">{ev.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-slate-850 px-6 py-4 flex items-center justify-end border-t border-slate-800">
              <button 
                onClick={() => setSelectedTechProfile(null)} 
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-5 rounded-xl text-xs cursor-pointer shadow-md transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configure Performance Areas Modal */}
      {showAreasConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[85vh]">
            <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Sliders className="w-5 h-5 text-violet-400" />
                <div>
                  <h3 className="font-extrabold text-white text-base">Configure Performance Areas</h3>
                  <p className="text-xs text-slate-400">Add, rename, or manage evaluation rating criteria</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAreasConfigModal(false)} 
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Existing Areas List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Performance Criteria</h4>
                <div className="space-y-2">
                  {performanceAreas.map((area, idx) => (
                    <div key={area._id || idx} className="bg-slate-950/40 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-white text-sm">{area.name}</p>
                        {area.description && <p className="text-xs text-slate-400 mt-0.5">{area.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => deletePerformanceAreaHandler(area._id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                          title="Delete Area"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Area Form */}
              <form onSubmit={savePerformanceAreaHandler} className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-violet-400" /> Add New Performance Criterion
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Criterion Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Communication Skills, Tool Maintenance..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                    value={newAreaForm.name}
                    onChange={e => setNewAreaForm({ ...newAreaForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="Brief description of what is evaluated..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                    value={newAreaForm.description}
                    onChange={e => setNewAreaForm({ ...newAreaForm, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Save Criterion
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-slate-850 px-6 py-4 flex items-center justify-end border-t border-slate-800">
              <button 
                onClick={() => setShowAreasConfigModal(false)} 
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-5 rounded-xl text-xs cursor-pointer transition border border-slate-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Add/Edit Modal */}
      <EmployeeModal
        isOpen={employeeModalOpen}
        onClose={() => {
          setEmployeeModalOpen(false);
          setEmployeeForm(null);
        }}
        employeeForm={employeeForm}
        setEmployeeForm={setEmployeeForm}
        onSave={handleSaveEmployee}
        saving={employeeSaving}
        API_BASE={API_BASE}
      />

      {/* Employee Details Modal */}
      <EmployeeDetailsModal
        isOpen={Boolean(viewingEmployeeData)}
        onClose={() => setViewingEmployeeData(null)}
        employee={viewingEmployeeData?.employee}
        recentAttendance={viewingEmployeeData?.recentAttendance}
        onEdit={(emp) => {
          setViewingEmployeeData(null);
          setEmployeeForm({
            id: emp._id,
            employeeId: emp.employeeId,
            name: emp.name,
            phone: emp.phone,
            password: '',
            address: emp.address,
            status: emp.status,
            profilePic: emp.profilePic,
            aadhar: emp.aadhar,
            drivingLicense: emp.drivingLicense,
            insurance: emp.insurance
          });
          setEmployeeModalOpen(true);
        }}
        API_BASE={API_BASE}
      />

      {/* Correct Attendance Modal */}
      <CorrectAttendanceModal
        isOpen={Boolean(correctingAttendance)}
        onClose={() => setCorrectingAttendance(null)}
        attendance={correctingAttendance}
        onSaveCorrection={handleSaveAttendanceCorrection}
        saving={correctingSaving}
      />

      {/* OpenStreetMap Location Modal */}
      <LocationMapModal
        isOpen={Boolean(mapAttendance)}
        onClose={() => setMapAttendance(null)}
        attendance={mapAttendance}
      />

      {/* Selfie Photo Preview Modal */}
      {viewSelfiePhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 max-w-sm w-full space-y-3 relative shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Clock-In Selfie</span>
              <button
                onClick={() => setViewSelfiePhoto(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={viewSelfiePhoto} alt="Clock-in selfie full" className="w-full rounded-2xl object-cover max-h-96" />
          </div>
        </div>
      )}

      {/* Edit Ticket Modal for Admin */}
      <EditTicketModal
        isOpen={Boolean(editingTicket)}
        onClose={() => setEditingTicket(null)}
        ticket={editingTicket}
        onSave={handleSaveEditTicket}
        saving={editTicketSaving}
        appliances={appliances}
        brands={brands}
        dealers={dealers}
        technicians={technicians}
        cities={cities}
        API_BASE={API_BASE}
      />
    </div>
  );
}

