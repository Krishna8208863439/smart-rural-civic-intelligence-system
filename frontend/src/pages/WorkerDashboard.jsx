import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import {
  Wrench,
  Clock,
  CheckCircle2,
  MapPin,
  AlertCircle,
  AlertTriangle,
  Play,
  Upload,
  Sparkles,
  Calendar,
  Navigation,
  Key,
  X,
  Check,
  RefreshCw,
  ExternalLink,
  LogOut,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';

export default function WorkerDashboard() {
  const { t, i18n } = useTranslation();
  const { user, logout, updateUserData } = useAuth();
  const navigate = useNavigate();

  // Primary Data State
  const [worker, setWorker] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskScope, setTaskScope] = useState('my'); // 'my' (default) or 'all'
  const [myCount, setMyCount] = useState(0);
  const [allCount, setAllCount] = useState(0);
  const [autoSwitched, setAutoSwitched] = useState(false);
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  });

  // Screen Status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);

  // Modals
  const [progressModalTask, setProgressModalTask] = useState(null);
  const [progressNote, setProgressNote] = useState('');
  const [progressImage, setProgressImage] = useState('');

  const [completeModalTask, setCompleteModalTask] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionImage, setCompletionImage] = useState('');
  const [gpsLocation, setGpsLocation] = useState({ latitude: '16.9602', longitude: '74.2433' });
  const [gpsLoading, setGpsLoading] = useState(false);

  // First Login & Password Update Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Helper to safely format an issue/task object
  const sanitizeTask = (item) => {
    if (!item) return null;
    const rawId = item._id ? String(item._id) : item.id ? String(item.id) : '';
    const issueObj = typeof item.issueId === 'object' && item.issueId !== null ? item.issueId : {};
    const issueRawId = issueObj._id ? String(issueObj._id) : (typeof item.issueId === 'string' ? item.issueId : rawId);

    const taskId =
      item.taskId ||
      (rawId.length >= 4 ? `TSK-${rawId.slice(-4).toUpperCase()}` : `TSK-${Math.floor(1000 + Math.random() * 9000)}`);

    let normStatus = item.status || issueObj.status || 'ASSIGNED';
    if (normStatus === 'UNDER ACTION') normStatus = 'IN PROGRESS';
    if (normStatus === 'ACTION COMPLETED') normStatus = 'COMPLETED';
    if (normStatus === 'VERIFIED RESOLVED' || normStatus === 'ADMIN_VERIFIED') normStatus = 'VERIFIED';

    let priorityLevel = 'Medium';
    if (typeof item.priority === 'string') priorityLevel = item.priority;
    else if (typeof item.priority === 'object' && item.priority?.level) priorityLevel = item.priority.level;
    else if (typeof issueObj.priority === 'string') priorityLevel = issueObj.priority;
    else if (typeof issueObj.priority === 'object' && issueObj.priority?.level) priorityLevel = issueObj.priority.level;

    return {
      _id: rawId,
      id: rawId,
      taskId,
      issueId: issueRawId,
      title: item.title || issueObj.title || 'Civic Infrastructure Repair',
      category: item.category || issueObj.category || 'General',
      priority: priorityLevel,
      description: item.description || issueObj.description || 'Inspection and maintenance required.',
      location: item.location || issueObj.location || { address: worker?.assignedArea || 'Chandoli' },
      assignedDate: item.assigned_at || item.assignedAt || item.createdAt || item.assignedDate || issueObj.assignedAt || new Date().toISOString(),
      dueDate: item.due_date || item.deadline || item.dueDate || issueObj.deadline || null,
      deadline: item.due_date || item.deadline || issueObj.deadline || null,
      status: normStatus,
      beforeImage: item.beforeImage || item.images?.[0]?.url || issueObj.images?.[0]?.url || '',
      afterImage: item.afterImage || item.completionDetails?.images?.[0]?.url || issueObj.completionDetails?.images?.[0]?.url || '',
      workerNotes: item.workerNotes || item.completionDetails?.notes || issueObj.completionDetails?.notes || '',
      assignedWorker: item.assignedWorker || issueObj.assignedWorker,
      confirms: item.confirms || item.communityValidationStats?.confirms || issueObj.communityValidationStats?.confirms || issueObj.corroborationCount || 0,
      communityValidationStats: item.communityValidationStats || issueObj.communityValidationStats || null,
    };
  };

  // Fetch complete Worker Dashboard data
  const fetchDashboardData = async (scope = taskScope) => {
    try {
      setLoading(true);
      setError(null);
      setUnauthorized(false);

      // 1. Primary: Call dedicated Worker Tasks endpoint /api/worker/tasks
      let myDirectTasks = [];
      let workerData = null;

      try {
        const [workerTasksRes, workerDashRes] = await Promise.all([
          api.get('/worker/tasks'),
          api.get('/worker/dashboard').catch(() => null)
        ]);

        if (workerTasksRes.data?.success && Array.isArray(workerTasksRes.data.tasks)) {
          myDirectTasks = workerTasksRes.data.tasks.map(sanitizeTask).filter(Boolean);
        }

        if (workerDashRes?.data?.success) {
          workerData = workerDashRes.data.worker;
          if (myDirectTasks.length === 0 && Array.isArray(workerDashRes.data.tasks)) {
            myDirectTasks = workerDashRes.data.tasks.map(sanitizeTask).filter(Boolean);
          }
        }
      } catch (dashErr) {
        if (dashErr.response?.status === 401) {
          setUnauthorized(true);
          setError('Session expired. Please login again.');
          setLoading(false);
          return;
        } else if (dashErr.response?.status === 403) {
          setError('You do not have permission to access worker tasks.');
          setLoading(false);
          return;
        } else if (dashErr.response?.status === 500) {
          setError('Server error. Please try again.');
        }
        console.warn('Worker tasks API endpoint error, checking fallback:', dashErr.message);
      }

      // 2. Fetch Village tasks feed for the 'All Village Work Orders' tab
      let allVillageTasks = [];
      try {
        const allRes = await api.get('/tasks/my?scope=all').catch(() => ({ data: { tasks: [] } }));
        if (allRes.data?.tasks && Array.isArray(allRes.data.tasks)) {
          allVillageTasks = allRes.data.tasks.map(sanitizeTask).filter(Boolean);
        }
      } catch (allErr) {
        console.warn('Village tasks query error:', allErr.message);
      }

      setMyCount(myDirectTasks.length);
      setAllCount(allVillageTasks.length);

      const effectiveTasks = scope === 'my' ? myDirectTasks : allVillageTasks;
      setTasks(effectiveTasks);

      // Compute statistics based on the active tasks list
      const total = effectiveTasks.length;
      const pending = effectiveTasks.filter((t) => ['ASSIGNED', 'NEW', 'VALIDATED'].includes(t.status)).length;
      const inProgress = effectiveTasks.filter((t) =>
        ['ACCEPTED', 'IN PROGRESS', 'UNDER ACTION'].includes(t.status)
      ).length;
      const completed = effectiveTasks.filter((t) =>
        ['COMPLETED', 'VERIFIED', 'ACTION COMPLETED', 'VERIFIED RESOLVED'].includes(t.status)
      ).length;
      const now = new Date();
      const overdue = effectiveTasks.filter(
        (t) =>
          t.deadline &&
          new Date(t.deadline) < now &&
          !['COMPLETED', 'VERIFIED', 'ACTION COMPLETED', 'VERIFIED RESOLVED'].includes(t.status)
      ).length;

      setStats({
        totalTasks: total,
        pendingTasks: pending,
        inProgressTasks: inProgress,
        completedTasks: completed,
        overdueTasks: overdue,
      });

      // Resolved worker profile
      const activeUser = workerData || user || {};
      const resolvedWorker = {
        name: activeUser.name || 'Field Specialist',
        workerId: activeUser.workerId || user?.workerId || 'GRAM-WKR-001',
        email: activeUser.email || user?.email || '',
        mobile: activeUser.mobile || activeUser.phone || user?.phone || 'Not specified',
        assignedArea: activeUser.assignedArea || user?.assignedArea || 'Chandoli',
        workerRole: activeUser.workerRole || activeUser.specialization || user?.workerRole || 'Field Worker',
        status: activeUser.status || (activeUser.isActive ? 'Active' : 'Active'),
        mustChangePassword: !!activeUser.mustChangePassword || !!user?.mustChangePassword,
      };
      setWorker(resolvedWorker);

      // If first login temporary password active, show change password modal
      if (resolvedWorker.mustChangePassword) {
        setShowPasswordModal(true);
      }
    } catch (err) {
      console.error('Failed to load worker dashboard:', err);
      if (err.response?.status === 401) {
        setUnauthorized(true);
        setError('Session expired. Please login again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to access worker tasks.');
      } else {
        setError('Unable to load your assigned tasks. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(taskScope);
  }, [taskScope]);

  // Worker Action 1: Accept Task
  const handleAcceptTask = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}/accept`).catch(() => {
        return api.put(`/workers/issues/${taskId}/progress`, { note: 'Worker accepted task.' });
      });
      await fetchDashboardData(taskScope);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept task');
    }
  };

  // Worker Action 2: Start Task
  const handleStartTask = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}/start`).catch(() => {
        return api.put(`/workers/issues/${taskId}/progress`, { startWork: true });
      });
      await fetchDashboardData(taskScope);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start task');
    }
  };

  // Worker Action 3: Progress Note Submit
  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    if (!progressModalTask) return;
    try {
      setSubmitting(true);
      await api
        .put(`/tasks/${progressModalTask._id}/progress`, {
          note: progressNote,
          image: progressImage,
        })
        .catch(() => {
          return api.put(`/workers/issues/${progressModalTask._id}/progress`, {
            note: progressNote,
          });
        });
      setProgressModalTask(null);
      setProgressNote('');
      setProgressImage('');
      await fetchDashboardData(taskScope);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record progress');
    } finally {
      setSubmitting(false);
    }
  };

  // Capture GPS
  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        });
        setGpsLoading(false);
      },
      () => {
        setGpsLocation({ latitude: '16.9602', longitude: '74.2433' });
        setGpsLoading(false);
      }
    );
  };

  // Worker Action 4: Submit Completion
  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completeModalTask) return;
    if (!completionNotes.trim()) {
      alert('Please enter completion notes describing the field repair.');
      return;
    }

    try {
      setSubmitting(true);
      await api
        .post(`/tasks/${completeModalTask._id}/complete`, {
          notes: completionNotes,
          afterImage: completionImage,
          latitude: gpsLocation.latitude,
          longitude: gpsLocation.longitude,
        })
        .catch(() => {
          return api.post(`/workers/issues/${completeModalTask._id}/completion-evidence`, {
            notes: completionNotes,
            sampleImageUrl: completionImage,
          });
        });
      setCompleteModalTask(null);
      setCompletionNotes('');
      setCompletionImage('');
      await fetchDashboardData(taskScope);
      alert('Task completion proof submitted! Pending Admin Verification.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit completion proof');
    } finally {
      setSubmitting(false);
    }
  };

  // First Login Password Change Submit
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    try {
      setPasswordUpdating(true);
      // Try /change-password, fallback to /update-password
      await api
        .put('/auth/change-password', {
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        })
        .catch(() =>
          api.put('/auth/update-password', {
            currentPassword: currentPassword.trim(),
            newPassword: newPassword.trim(),
          })
        );

      if (updateUserData) {
        updateUserData({ mustChangePassword: false });
      }
      setWorker((prev) => (prev ? { ...prev, mustChangePassword: false } : null));
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      alert('Password updated successfully! Welcome to your Field Operations Portal.');
    } catch (err) {
      setPasswordMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update password. Please check your current password.',
      });
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/worker/login');
  };

  // 1. Loading State (Step 6 Requirement)
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 px-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-lg shadow-emerald-800/20 animate-pulse">
          <RefreshCw className="w-7 h-7 animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="text-base font-bold text-slate-800">Loading Worker Dashboard...</h2>
          <p className="text-xs text-slate-500 mt-1">
            Connecting to GramSetu AI Field Operations Network & synchronizing task records.
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthorized State (Step 6 Requirement)
  if (unauthorized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 px-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center shadow-md">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-base font-bold text-slate-800">Your worker session has expired.</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Please login again with your worker credentials to access your field dashboard.
          </p>
          <Link
            to="/worker/login"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition"
          >
            <span>Proceed to Worker Login</span>
          </Link>
        </div>
      </div>
    );
  }

  // 3. Error State (Step 6 Requirement)
  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 px-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shadow-md">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-base font-bold text-slate-800">Unable to load worker dashboard. Please try again.</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => fetchDashboardData(taskScope)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* ============================================================ */}
      {/* 1. HEADER (Step 8 Requirement) */}
      {/* ============================================================ */}
      <header className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-800 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-800/20 shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                GramPanchayat AI / GramSetu
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">• Field Operations</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Welcome, {worker?.name || 'Field Specialist'}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {worker?.workerId && (
            <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 font-mono text-xs font-bold flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>ID: {worker.workerId}</span>
            </div>
          )}
          {worker?.assignedArea && (
            <div className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>Area: {worker.assignedArea}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setPasswordMsg({ type: '', text: '' });
              setShowPasswordModal(true);
            }}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
          >
            <Key className="w-3.5 h-3.5 text-amber-600" />
            <span>Change Password</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition flex items-center space-x-1.5 shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Mandatory First-Login Temporary Password Banner */}
      {worker?.mustChangePassword && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-200/80 flex items-center justify-center text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs tracking-wide uppercase text-amber-900">
                Security Alert: Temporary Password Active
              </div>
              <div className="text-xs text-amber-800 mt-0.5">
                Admin generated a temporary password for your account. Please change it now to secure your field operations portal.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setPasswordMsg({ type: '', text: '' });
              setShowPasswordModal(true);
            }}
            className="px-5 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition shadow-sm"
          >
            Please Change Your Temporary Password
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. PROFILE CARD (Step 8 Requirement) */}
      {/* ============================================================ */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            <User className="w-4 h-4 text-emerald-700" />
            <span>Worker Field Profile</span>
          </div>
          <span className="text-[11px] text-slate-400">Authenticated Civic Specialist</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* 1. Full Name */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Worker Full Name</div>
            <div className="font-bold text-slate-900 text-sm">{worker?.name || '—'}</div>
          </div>

          {/* 2. Worker ID */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Worker ID</div>
            <div className="font-mono font-bold text-emerald-800 text-sm">{worker?.workerId || '—'}</div>
          </div>

          {/* 3. Email Address */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
              <Mail className="w-3 h-3 text-slate-400" />
              <span>Email Address</span>
            </div>
            <div className="font-semibold text-slate-800 truncate" title={worker?.email}>
              {worker?.email || '—'}
            </div>
          </div>

          {/* 4. Mobile Number */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>Mobile Number</span>
            </div>
            <div className="font-semibold text-slate-800 font-mono">{worker?.mobile || worker?.phone || '—'}</div>
          </div>

          {/* 5. Assigned Area */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>Assigned Area</span>
            </div>
            <div className="font-semibold text-slate-800">{worker?.assignedArea || 'Chandoli'}</div>
          </div>

          {/* 6. Worker Role */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
              <Wrench className="w-3 h-3 text-slate-400" />
              <span>Worker Role</span>
            </div>
            <div className="font-bold text-emerald-800">{worker?.workerRole || 'Field Worker'}</div>
          </div>

          {/* 7. Account Status */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
              <Activity className="w-3 h-3 text-slate-400" />
              <span>Account Status</span>
            </div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>{worker?.status || 'Active'}</span>
            </div>
          </div>

          {/* 8. Security Status */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
              <Key className="w-3 h-3 text-slate-400" />
              <span>Password Status</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-700">
              {worker?.mustChangePassword ? (
                <span className="text-amber-700 font-bold">Temporary Password Active</span>
              ) : (
                <span className="text-emerald-700 font-bold">Secured & Active</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. TASK SUMMARY CARDS (Step 8 Requirement) */}
      {/* ============================================================ */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Tasks */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Total Tasks</span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{stats.totalTasks}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Assigned civic work orders</div>
        </div>

        {/* Pending Tasks */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Tasks</span>
          </div>
          <div className="text-3xl font-black text-amber-600 mt-2">{stats.pendingTasks}</div>
          <div className="text-[10px] text-amber-700 mt-1 font-medium">Ready for worker acceptance</div>
        </div>

        {/* In Progress */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700 flex items-center space-x-1">
            <Play className="w-3.5 h-3.5 text-sky-600" />
            <span>In Progress</span>
          </div>
          <div className="text-3xl font-black text-sky-600 mt-2">{stats.inProgressTasks}</div>
          <div className="text-[10px] text-sky-700 mt-1 font-medium">Active work on site</div>
        </div>

        {/* Completed Tasks */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completed Tasks</span>
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-2">{stats.completedTasks}</div>
          <div className="text-[10px] text-emerald-700 mt-1 font-medium">Verified / proof uploaded</div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. MY TASKS LIST & CONTROLS (Step 8 Requirement) */}
      {/* ============================================================ */}
      <section className="space-y-4">
        {/* Scope selector tabs & Refresh button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAutoSwitched(false);
                setTaskScope('my');
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 ${
                taskScope === 'my'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>📋 My Direct Tasks</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  taskScope === 'my' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {myCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAutoSwitched(false);
                setTaskScope('all');
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center space-x-2 ${
                taskScope === 'all'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>🌐 All Village Work Orders</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  taskScope === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {allCount}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboardData(taskScope)}
            className="text-xs px-4 py-2 rounded-2xl border border-slate-200 bg-white text-emerald-800 font-bold hover:bg-emerald-50 flex items-center space-x-1.5 shadow-xs transition shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Tasks</span>
          </button>
        </div>

        {/* Auto switch explanation alert */}
        {autoSwitched && taskScope === 'all' && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>Showing All Village Work Orders ({allCount}):</strong> You have 0 direct tasks right now, so active civic work orders across Chandoli are displayed below for you to accept or inspect.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setAutoSwitched(false);
                setTaskScope('my');
              }}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline shrink-0"
            >
              Show My Queue (0)
            </button>
          </div>
        )}

        {/* ZERO TASKS STATE (Step 11 Requirement) */}
        {tasks.length === 0 ? (
          <div className="p-12 sm:p-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs space-y-3 shadow-soft">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <p className="font-extrabold text-slate-800 text-base">No active tasks assigned to your account right now.</p>
              <p className="text-slate-400 mt-1 max-w-md mx-auto">
                {taskScope === 'my'
                  ? 'There are currently no civic repair work orders assigned to your account. When the Gram Panchayat admin assigns a civic task to you, it will immediately appear here.'
                  : 'There are currently no active civic work orders recorded in the village system.'}
              </p>
            </div>
            {taskScope === 'my' && allCount > 0 && (
              <button
                type="button"
                onClick={() => setTaskScope('all')}
                className="px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition inline-flex items-center space-x-1.5 shadow-sm mt-2"
              >
                <span>🌐 View All Village Work Orders ({allCount})</span>
              </button>
            )}
          </div>
        ) : (
          /* MY TASKS CARDS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tasks.map((task) => {
              const isAssigned = task.status === 'ASSIGNED';
              const isAccepted = task.status === 'ACCEPTED';
              const isInProgress = task.status === 'IN PROGRESS';
              const isCompleted = ['COMPLETED', 'ACTION COMPLETED'].includes(task.status);
              const isVerified = ['VERIFIED', 'VERIFIED RESOLVED'].includes(task.status);
              const isReopened = task.status === 'REOPENED';

              const safeId = String(task._id || '');

              return (
                <div
                  key={safeId || task.taskId}
                  className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-soft space-y-4 flex flex-col justify-between hover:border-emerald-400 transition duration-200"
                >
                  <div className="space-y-3">
                    {/* Top Row: Task ID, Priority, Category, Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {task.taskId}
                        </span>
                        <PriorityBadge level={task.priority} />
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {task.category}
                        </span>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{task.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>

                    {/* Full Issue Map Link */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-0.5">
                      <Link
                        to={`/issues/${task.issueId || safeId}`}
                        className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition underline underline-offset-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Full Issue & GPS Map</span>
                      </Link>
                      {task.assignedWorker?.name && (
                        <span className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          Lead: <strong className="text-slate-700">{task.assignedWorker.name}</strong>
                        </span>
                      )}
                    </div>

                    {/* Location & Assigned Date / Due Date */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5 text-slate-600">
                      <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{task.location?.landmark || task.location?.address || 'Chandoli Village'}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px]">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            Assigned:{' '}
                            {task.assignedDate
                              ? new Date(task.assignedDate).toLocaleDateString()
                              : 'Recent'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>
                            Due:{' '}
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString()
                              : 'Within 48 hours'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Photos */}
                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      {task.beforeImage && (
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold text-slate-500">Before Photo:</span>
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-300">
                            <img src={task.beforeImage} alt="Before" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}
                      {task.afterImage && (
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold text-emerald-700">Resolution Proof:</span>
                          <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-xs">
                            <img src={task.afterImage} alt="Completion proof" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Task Action Buttons (Step 8 Requirement) */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    {isAssigned && (
                      <button
                        type="button"
                        onClick={() => handleAcceptTask(safeId)}
                        className="w-full py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept Task & Begin Work</span>
                      </button>
                    )}

                    {isAccepted && (
                      <button
                        type="button"
                        onClick={() => handleStartTask(safeId)}
                        className="w-full py-2.5 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-1.5"
                      >
                        <Play className="w-4 h-4" />
                        <span>Start Task (Move to In Progress)</span>
                      </button>
                    )}

                    {isInProgress && (
                      <div className="w-full grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setProgressModalTask(task)}
                          className="py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center space-x-1"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-600" />
                          <span>Update Progress</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCompleteModalTask(task);
                            handleCaptureGps();
                          }}
                          className="py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Completed</span>
                        </button>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="w-full py-2 px-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-center font-bold text-xs">
                        ⏳ Proof Submitted — Pending Admin Verification
                      </div>
                    )}

                    {isVerified && (
                      <div className="w-full py-2 px-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-bold text-xs flex items-center justify-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✓ Verified & Resolved by Panchayat Admin</span>
                      </div>
                    )}

                    {isReopened && (
                      <div className="w-full space-y-2">
                        <div className="py-1 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-center font-bold text-xs">
                          ⚠️ Task Reopened by Admin for Rework
                        </div>
                        <button
                          type="button"
                          onClick={() => handleStartTask(safeId)}
                          className="w-full py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                        >
                          Restart Field Work
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 5. MODALS */}
      {/* ============================================================ */}

      {/* FIRST LOGIN / PASSWORD CHANGE MODAL (Step 9 Requirement) */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {worker?.mustChangePassword
                      ? 'Please Change Your Temporary Password'
                      : 'Change Account Password'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {worker?.mustChangePassword
                      ? 'First-login security update required for field access'
                      : 'Update your field account password'}
                  </p>
                </div>
              </div>
              {!worker?.mustChangePassword && (
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {passwordMsg.text && (
              <div
                className={`p-3 rounded-2xl border text-xs font-semibold ${
                  passwordMsg.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Current Password (or Admin Temporary Password) *
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current or temporary password"
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                {!worker?.mustChangePassword && (
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={passwordUpdating}
                  className="px-6 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md shadow-emerald-700/20 transition disabled:opacity-50"
                >
                  {passwordUpdating ? 'Updating Password...' : 'Save & Unlock Portal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE PROGRESS MODAL */}
      {progressModalTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5 text-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Update Field Progress</h3>
                <span className="font-mono text-emerald-800 text-[11px] font-bold">
                  {progressModalTask.taskId}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setProgressModalTask(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProgressSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Field Progress Notes *</label>
                <textarea
                  rows={3}
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  placeholder="e.g. Cleared 20 meters of drainage blockage. Waiting for pipeline sealant to cure."
                  required
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Progress Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={progressImage}
                  onChange={(e) => setProgressImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProgressModalTask(null)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Progress'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MARK COMPLETED MODAL */}
      {completeModalTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5 text-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Submit Task Completion</h3>
                <span className="font-mono text-emerald-800 text-[11px] font-bold">
                  {completeModalTask.taskId}: {completeModalTask.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCompleteModalTask(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Completion Notes (Required) *
                </label>
                <textarea
                  rows={3}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Describe the completed repair in detail (e.g. Drainage obstruction fully cleared, wastewater flow restored, road surface sealed)."
                  required
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  2. After-Completion Photo Proof URL (Required) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={completionImage}
                    onChange={(e) => setCompletionImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    required
                    className="flex-1 px-3.5 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const sampleImages = [
                        'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800',
                        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
                        'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800',
                        'https://images.unsplash.com/photo-1507034589631-9433cc6bc453?w=800',
                      ];
                      setCompletionImage(
                        sampleImages[Math.floor(Math.random() * sampleImages.length)]
                      );
                    }}
                    className="px-3 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold shrink-0"
                  >
                    Sample Photo
                  </button>
                </div>
              </div>

              {/* GPS Coordinates */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">3. On-Site GPS Verification</label>
                  <button
                    type="button"
                    onClick={handleCaptureGps}
                    className="px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[10px] flex items-center space-x-1"
                  >
                    <Navigation className="w-3 h-3 text-emerald-700" />
                    <span>{gpsLoading ? 'Locating...' : 'Refresh GPS'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono text-[11px]">
                  <div>Lat: {gpsLocation.latitude || '16.9602'}</div>
                  <div>Lng: {gpsLocation.longitude || '74.2433'}</div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompleteModalTask(null)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md shadow-emerald-700/20 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit for Admin Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
