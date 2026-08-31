import React from "react";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Power, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function EmployeesTab({
  employees = [],
  stats = {},
  search = "",
  setSearch,
  statusFilter = "all",
  setStatusFilter,
  page = 1,
  setPage,
  onAddEmployee,
  onEditEmployee,
  onViewEmployee,
  onToggleStatus,
  onDeleteEmployee,
  loading = false,
  API_BASE
}) {
  const itemsPerPage = 20;

  const filteredEmployees = employees.filter((emp) => {
    const s = search.toLowerCase().trim();
    const matchesSearch = !s || (
      (emp.name && emp.name.toLowerCase().includes(s)) ||
      (emp.employeeId && emp.employeeId.toLowerCase().includes(s)) ||
      (emp.phone && emp.phone.toLowerCase().includes(s))
    );
    const matchesStatus = statusFilter === "all" || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const paginatedEmployees = filteredEmployees.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-400" />
            <span>Employee Management</span>
          </h1>
          <p className="text-slate-400 mt-1">
            Register and manage company employees, verification documents, and portal credentials
          </p>
        </div>
        <button
          onClick={onAddEmployee}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-2.5 px-5 rounded-2xl shadow-lg shadow-violet-600/20 text-xs flex items-center gap-2 cursor-pointer transition self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Employee</span>
        </button>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Staff</div>
          <div className="text-2xl font-black text-white font-mono">{stats.totalEmployees || 0}</div>
          <div className="text-[10px] text-slate-500">Registered records</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Active Staff</div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{stats.activeEmployees || 0}</div>
          <div className="text-[10px] text-slate-500">Authorized login</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Inactive</div>
          <div className="text-2xl font-black text-rose-400 font-mono">{stats.inactiveEmployees || 0}</div>
          <div className="text-[10px] text-slate-500">Access disabled</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">Present Today</div>
          <div className="text-2xl font-black text-violet-400 font-mono">{stats.presentToday || 0}</div>
          <div className="text-[10px] text-slate-500">Logged attendance</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">Clocked In Now</div>
          <div className="text-2xl font-black text-teal-400 font-mono">{stats.currentlyClockedIn || 0}</div>
          <div className="text-[10px] text-slate-500">Currently on duty</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Not Clocked In</div>
          <div className="text-2xl font-black text-amber-400 font-mono">{stats.notClockedIn || 0}</div>
          <div className="text-[10px] text-slate-500">Pending today</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Employee Name, ID (EMP-XXXX), or Mobile Number..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer w-full sm:w-auto"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Employee List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Address</th>
                <th className="py-3.5 px-4">Documents Status</th>
                <th className="py-3.5 px-4">Portal Access</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 text-xs">
                    {loading ? "Loading employee directory..." : "No matching employees found."}
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp) => {
                  const avatarUrl = emp.profilePic
                    ? (emp.profilePic.startsWith("http") ? emp.profilePic : `${API_BASE}/${emp.profilePic}`)
                    : null;

                  const hasAadhar = Boolean(emp.aadhar);
                  const hasDL = Boolean(emp.drivingLicense);
                  const hasInsurance = Boolean(emp.insurance);

                  return (
                    <tr key={emp._id} className="hover:bg-slate-800/30 transition">
                      {/* Employee Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center font-bold text-violet-400 shrink-0">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt={emp.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{emp.name.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-white text-sm">{emp.name}</div>
                            <div className="text-[11px] text-violet-400 font-mono font-bold">{emp.employeeId}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {emp.phone}
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                        {emp.address || "—"}
                      </td>

                      {/* Document Badges */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            hasAadhar ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60" : "bg-slate-800 text-slate-500"
                          }`}>
                            Aadhaar {hasAadhar ? "✓" : "—"}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            hasDL ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60" : "bg-slate-800 text-slate-500"
                          }`}>
                            DL {hasDL ? "✓" : "—"}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            hasInsurance ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60" : "bg-slate-800 text-slate-500"
                          }`}>
                            Insurance {hasInsurance ? "✓" : "—"}
                          </span>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => onToggleStatus(emp._id)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                            emp.status === "active"
                              ? "bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-700/60"
                              : "bg-rose-950/80 hover:bg-rose-900 text-rose-400 border border-rose-700/60"
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{emp.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewEmployee(emp._id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-violet-600 text-slate-400 hover:text-white transition cursor-pointer"
                            title="View Full Profile & Documents"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditEmployee(emp)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white transition cursor-pointer"
                            title="Edit Employee & Password"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteEmployee(emp._id, emp.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition cursor-pointer"
                            title="Delete Employee"
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

        {/* Pagination Bar */}
        {filteredEmployees.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40 text-xs text-slate-400">
            <span>
              Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 font-mono font-bold text-white">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
