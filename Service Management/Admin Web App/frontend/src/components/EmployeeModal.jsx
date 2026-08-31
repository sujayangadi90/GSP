import React, { useRef, useState } from "react";
import { X, Upload, User, Phone, MapPin, Lock, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export default function EmployeeModal({ isOpen, onClose, employeeForm, setEmployeeForm, onSave, saving, API_BASE }) {
  const profilePicRef = useRef(null);
  const aadharRef = useRef(null);
  const drivingLicenseRef = useRef(null);
  const insuranceRef = useRef(null);

  const [profilePreview, setProfilePreview] = useState("");
  const [aadharFileName, setAadharFileName] = useState("");
  const [dlFileName, setDlFileName] = useState("");
  const [insuranceFileName, setInsuranceFileName] = useState("");

  if (!isOpen || !employeeForm) return null;

  const isEdit = Boolean(employeeForm.id || employeeForm._id);

  const handleProfileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEmployeeForm(prev => ({ ...prev, profilePicFile: file }));
      const reader = new FileReader();
      reader.onload = () => setProfilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDocChange = (e, field, setNameState) => {
    const file = e.target.files[0];
    if (file) {
      setEmployeeForm(prev => ({ ...prev, [field]: file }));
      setNameState(file.name);
    }
  };

  const existingProfile = employeeForm.profilePic
    ? (employeeForm.profilePic.startsWith("http") ? employeeForm.profilePic : `${API_BASE}/${employeeForm.profilePic}`)
    : "";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <h3 className="font-extrabold text-white text-lg">
              {isEdit ? `Edit Employee: ${employeeForm.name} (${employeeForm.employeeId || 'EMP'})` : "Register New Employee"}
            </h3>
            <p className="text-xs text-slate-400">
              {isEdit ? "Update employee details, credentials, and uploaded documents" : "Auto-generates unique Employee ID upon registration"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={onSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Profile Photo & Basic Info */}
          <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
            {/* Avatar Upload */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-dashed border-violet-500/60 overflow-hidden flex items-center justify-center">
                {profilePreview || existingProfile ? (
                  <img src={profilePreview || existingProfile} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-slate-500" />
                )}
              </div>
              <input
                ref={profilePicRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfileChange}
              />
              <button
                type="button"
                onClick={() => profilePicRef.current?.click()}
                className="mt-2 text-[11px] font-bold text-violet-400 hover:text-violet-300 block text-center w-full cursor-pointer"
              >
                {profilePreview || existingProfile ? "Change Photo" : "Upload Photo"}
              </button>
            </div>

            <div className="flex-1 w-full space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Employee Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={employeeForm.name || ""}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Phone Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="10-digit mobile number"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                    value={employeeForm.phone || ""}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
                    value={employeeForm.status || "active"}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="active">Active (Can Clock In)</option>
                    <option value="inactive">Inactive (Disabled)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Address & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Portal Password {isEdit ? "(Leave blank to keep unchanged)" : <span className="text-rose-400">*</span>}
              </label>
              <input
                required={!isEdit}
                type="password"
                placeholder={isEdit ? "••••••••" : "Set employee password"}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                value={employeeForm.password || ""}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Residential Address
              </label>
              <input
                type="text"
                placeholder="Street address, city, pincode"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                value={employeeForm.address || ""}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </div>

          {/* Document Uploads Section */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400">
              Employee Verification Documents (Aadhaar, Driving License, Insurance)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Aadhaar */}
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Aadhaar Card</span>
                  {employeeForm.aadhar && !employeeForm.aadharFile && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">Uploaded</span>
                  )}
                </div>
                <input
                  ref={aadharRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={(e) => handleDocChange(e, "aadharFile", setAadharFileName)}
                />
                <button
                  type="button"
                  onClick={() => aadharRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer truncate"
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{aadharFileName || "Upload Aadhaar"}</span>
                </button>
              </div>

              {/* Driving License */}
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Driving Licence</span>
                  {employeeForm.drivingLicense && !employeeForm.drivingLicenseFile && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">Uploaded</span>
                  )}
                </div>
                <input
                  ref={drivingLicenseRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={(e) => handleDocChange(e, "drivingLicenseFile", setDlFileName)}
                />
                <button
                  type="button"
                  onClick={() => drivingLicenseRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer truncate"
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{dlFileName || "Upload Licence"}</span>
                </button>
              </div>

              {/* Insurance */}
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Insurance Doc</span>
                  {employeeForm.insurance && !employeeForm.insuranceFile && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">Uploaded</span>
                  )}
                </div>
                <input
                  ref={insuranceRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={(e) => handleDocChange(e, "insuranceFile", setInsuranceFileName)}
                />
                <button
                  type="button"
                  onClick={() => insuranceRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer truncate"
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{insuranceFileName || "Upload Insurance"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-violet-600/30 transition cursor-pointer"
            >
              {saving ? "Saving Record..." : (isEdit ? "Update Employee" : "Create Employee")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
