import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Trash2,
  Image as ImageIcon,
  User,
  Mail,
  Building2,
  Globe,
  Lock,
  KeyRound,
  ShieldCheck,
  Check,
  Loader2,
  Crown,
  Camera,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';
import { MemberUser } from '../types';
import { updateMemberProfile, UpdateProfilePayload } from '../utils/authManager';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: MemberUser | null;
  onProfileUpdated: (updatedUser: MemberUser) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'avatar' | 'security'>('profile');
  
  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [company, setCompany] = useState('');
  const [targetWebsite, setTargetWebsite] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Security / Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize fields when modal opens or user changes
  useEffect(() => {
    if (currentUser && isOpen) {
      setName(currentUser.name || '');
      setUsername(currentUser.username || '');
      setCompany(currentUser.company || '');
      setTargetWebsite(currentUser.targetWebsite || '');
      setAvatarPreview(currentUser.avatar || null);
      setAvatarUrlInput('');
      setShowUrlInput(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  // File Upload Handler
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP, or SVG).');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 4MB. Please choose a smaller photo.');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setAvatarPreview(e.target.result as string);
        setSuccessMessage('Image loaded. Click "Save Profile Changes" to apply.');
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image file. Please try another one.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleApplyUrl = () => {
    const url = avatarUrlInput.trim();
    if (!url) {
      setErrorMessage('Please enter an image URL.');
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image/')) {
      setErrorMessage('Please enter a valid HTTP or HTTPS image URL.');
      return;
    }
    setAvatarPreview(url);
    setShowUrlInput(false);
    setAvatarUrlInput('');
    setErrorMessage(null);
    setSuccessMessage('Avatar URL preview applied. Click "Save Profile Changes" to save.');
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarUrlInput('');
    setShowUrlInput(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSuccessMessage('Profile photo removed. User initials will be displayed.');
  };

  // Submit Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters.');
      setLoading(false);
      return;
    }

    if (newPassword) {
      if (newPassword.length < 5) {
        setErrorMessage('New password must be at least 5 characters.');
        setLoading(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('New password and confirmation do not match.');
        setLoading(false);
        return;
      }
    }

    const payload: UpdateProfilePayload = {
      name: name.trim(),
      username: username.trim() || undefined,
      company: company.trim() || undefined,
      targetWebsite: targetWebsite.trim() || undefined,
      avatar: avatarPreview === null ? null : avatarPreview,
      currentPassword: currentPassword.trim() || undefined,
      newPassword: newPassword.trim() || undefined,
    };

    try {
      const res = await updateMemberProfile(payload);
      if (res.success && res.user) {
        setSuccessMessage('Profile updated successfully!');
        onProfileUpdated(res.user);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setErrorMessage(res.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (userName: string) => {
    if (!userName) return 'U';
    const parts = userName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return userName.slice(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Edit Profile & Avatar</h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {currentUser.role === 'admin' ? 'Super Admin' : `${currentUser.tier} Member`}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Customize your profile photo, organization details, and credentials</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-slate-950/40 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Details</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('avatar')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'avatar'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Profile Photo</span>
            {avatarPreview && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'security'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Security & Passkey</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* TAB 1: Profile Details */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Profile Top Summary Banner */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-4">
                {/* Visual Avatar Frame with Quick Change */}
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 p-0.5 shadow-md">
                    <div className="w-full h-full rounded-[14px] bg-slate-950 overflow-hidden flex items-center justify-center">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt={name || 'Avatar'} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-extrabold text-emerald-400 font-mono">
                          {getInitials(name || currentUser.name)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('avatar')}
                    className="absolute -bottom-1 -right-1 bg-slate-800 hover:bg-emerald-600 border border-slate-700 text-white p-1 rounded-lg shadow cursor-pointer transition-colors"
                    title="Change Photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-100 truncate">{name || currentUser.name}</h3>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                      {currentUser.tier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Total Campaigns: <span className="text-slate-300 font-mono">{currentUser.totalCampaignsRun}</span> • Total Visits: <span className="text-cyan-400 font-mono font-semibold">{(currentUser.totalVisitsGenerated || 0).toLocaleString()}</span>
                  </p>
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Full Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="text-slate-400 font-mono font-bold">@</span>
                    <span>Username</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g., alex_growth"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Email (Read-Only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Primary Account Email</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company / Organization */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Company / Team</span>
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g., Nexus Digital Agency"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Default Target Website */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    <span>Default Target Website</span>
                  </label>
                  <input
                    type="text"
                    value={targetWebsite}
                    onChange={(e) => setTargetWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Avatar & Profile Image Customizer */}
          {activeTab === 'avatar' && (
            <div className="space-y-5">
              {/* Avatar Centerpiece & Status */}
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
                {/* Large Preview Frame */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-0.5 shadow-xl">
                    <div className="w-full h-full rounded-[14px] bg-slate-900 overflow-hidden flex items-center justify-center">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-2">
                          <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                            {getInitials(name || currentUser.name)}
                          </span>
                          <span className="text-[9px] text-slate-500 mt-1 uppercase font-semibold">No Image</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {avatarPreview && (
                    <div className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-full shadow">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <h4 className="text-sm font-bold text-slate-100">
                    {avatarPreview ? 'Custom Profile Photo Active' : 'Default Initials Badge'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {avatarPreview
                      ? 'Your custom profile image will be displayed across your campaign logs, reports, and navbar.'
                      : 'Upload a picture or link an image URL. If no picture is set, your initials badge is cleanly rendered.'}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Use Image URL</span>
                    </button>

                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <ImageIcon className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-xs font-semibold text-slate-200">
                  Drag & Drop your profile picture here, or <span className="text-emerald-400">Browse Files</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports PNG, JPG, JPEG, WEBP, SVG or GIF (Max: 4MB)
                </p>
              </div>

              {/* URL Input Accordion */}
              {showUrlInput && (
                <div className="p-4 bg-slate-950 border border-cyan-500/30 rounded-xl space-y-2 animate-fadeIn">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Paste Direct Image URL</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={avatarUrlInput}
                      onChange={(e) => setAvatarUrlInput(e.target.value)}
                      placeholder="https://example.com/my-photo.jpg"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl cursor-pointer transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Security & Password */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 text-slate-200 text-xs font-bold mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Account Security & Credentials</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Update your member password or authentication credentials. Leave blank if you don't wish to change your password.
                </p>
              </div>

              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Current Password / Passkey</span>
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password (if changing)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    <span>New Password</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 5 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                    <span>Confirm New Password</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
