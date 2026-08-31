import React from "react";
import { X, User, Phone, MapPin, ShieldCheck, FileText, ExternalLink, Calendar, Clock, Edit } from "lucide-react";

export default function EmployeeDetailsModal({ isOpen, onClose, employee, recentAttendance = [], onEdit, API_BASE }) {
  if (!isOpen || !employee) return null;

  const profileImgUrl = employee.profilePic
    ? (employee.profilePic.startsWith("http") ? employee.profilePic : `${API_BASE}/${employee.profilePic}`)
    : null;

  const getDocUrl = (docPath) => {
    if (!docPath) return null;
    return docPath.startsWith("http") ? docPath : `${API_BASE}/${docPath}`;
  };

  const aadharUrl = getDocUrl(employee.aadhar);
  const dlUrl = getDocUrl(employee.drivingLicense);
  const insuranceUrl = getDocUrl(employee.insurance);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-violet-600/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Employee Profile & Verification</h3>
              <p className="text-xs text-slate-400 font-mono">{employee.employeeId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Main Info Box */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-slate-950/60 p-5 rounded-3xl border border-slate-800">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-violet-500/50 overflow-hidden flex items-center justify-center shadow-lg shrink-0">
              {profileImgUrl ? (
                <img src={profileImgUrl} alt={employee.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-violet-400">{employee.name?.charAt(0)}</span>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-black text-white">{employee.name}</h2>
                  <span className="text-xs text-violet-400 font-mono font-bold">{employee.employeeId}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-center sm:self-auto ${
                  employee.status === "active" ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60" : "bg-rose-950/80 text-rose-400 border border-rose-800/60"
                }`}>
                  {employee.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-300">
                  <Phone className="w-4 h-4 text-violet-400 shrink-0" />
                  <span className="font-mono">{employee.phone}</span>
                </div>
                {employee.address && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-300">
                    <MapPin className="w-4 h-4 text-violet-400 shrink-0" />
                    <span>{employee.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Uploaded Verification Documents */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-violet-400" />
              <span>Official Verification Documents</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Aadhaar */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Aadhaar Card</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      aadharUrl ? "bg-emerald-950 text-emerald-400 border border-emerald-800/50" : "bg-slate-800 text-slate-500"
                    }`}>
                      {aadharUrl ? "Uploaded" : "Pending"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Identity document verification</p>
                </div>
                {aadharUrl ? (
                  <a
                    href={aadharUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span>View Document</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <div className="text-xs text-slate-500 italic py-1 text-center">No document uploaded</div>
                )}
              </div>

              {/* Driving License */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Driving Licence</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      dlUrl ? "bg-emerald-950 text-emerald-400 border border-emerald-800/50" : "bg-slate-800 text-slate-500"
                    }`}>
                      {dlUrl ? "Uploaded" : "Pending"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Driver licensing verification</p>
                </div>
                {dlUrl ? (
                  <a
                    href={dlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span>View Document</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <div className="text-xs text-slate-500 italic py-1 text-center">No document uploaded</div>
                )}
              </div>

              {/* Insurance */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Insurance Document</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      insuranceUrl ? "bg-emerald-950 text-emerald-400 border border-emerald-800/50" : "bg-slate-800 text-slate-500"
                    }`}>
                      {insuranceUrl ? "Uploaded" : "Pending"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Medical/Vehicle policy</p>
                </div>
                {insuranceUrl ? (
                  <a
                    href={insuranceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span>View Document</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <div className="text-xs text-slate-500 italic py-1 text-center">No document uploaded</div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Attendance Summary */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Recent Attendance Logs</span>
            </h4>

            {recentAttendance.length === 0 ? (
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-500">
                No attendance logs found for this employee.
              </div>
            ) : (
              <div className="bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">In Time</th>
                      <th className="py-2.5 px-3">Out Time</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300 font-mono">
                    {recentAttendance.slice(0, 5).map((att) => (
                      <tr key={att._id} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 font-bold text-white">{att.date}</td>
                        <td className="py-2 px-3">
                          {att.clockInTime ? new Date(att.clockInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td className="py-2 px-3">
                          {att.clockOutTime ? new Date(att.clockOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">
                          {att.durationMinutes ? `${Math.floor(att.durationMinutes / 60)}h ${att.durationMinutes % 60}m` : "—"}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-400">
                            {att.status.replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-t border-slate-800 shrink-0">
          <button
            onClick={() => {
              onClose();
              if (onEdit) onEdit(employee);
            }}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Employee Details</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
