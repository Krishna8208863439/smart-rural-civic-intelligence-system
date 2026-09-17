import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Copy,
  Check,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  Send,
  ArrowRight,
  Sparkles,
  Calendar,
  ExternalLink,
  Edit,
  Power,
  Key,
} from 'lucide-react';

const CHART_COLORS = ['#059669', '#0284c7', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function WorkerManagement() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Data states
  const [workers, setWorkers] = useState([]);
  const [summary, setSummary] = useState({
    totalWorkers: 0,
    activeWorkers: 0,
    availableWorkers: 0,
    workersOnTask: 0,
    completedTasks: 0,
  });
  const [activity, setActivity] = useState({
    activeWorkers: 0,
    workersCurrentlyOnTask: 0,
    completedTasksToday: 0,
    overdueTasks: 0,
    pendingVerification: 0,
  });
  const [workerPerformance, setWorkerPerformance] = useState([]);
  const [taskCompletionChart, setTaskCompletionChart] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [openIssues, setOpenIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [areaFilter, setAreaFilter] = useState('All');
  const [taskStatusFilter, setTaskStatusFilter] = useState('All');

  // Modals
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [createdCredentialsModal, setCreatedCredentialsModal] = useState(null);
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [inspectTaskModal, setInspectTaskModal] = useState(null);
  const [viewWorkerModal, setViewWorkerModal] = useState(null);
  const [editWorkerModal, setEditWorkerModal] = useState(null);

  // Form states for Add Worker
  const [workerForm, setWorkerForm] = useState({
    name: '',
    phone: '',
    email: '',
    workerId: '',
    password: '',
    confirmPassword: '',
    assignedArea: 'Chandoli',
    workerRole: 'Field Worker',
    status: 'Active',
  });
  const [isCustomArea, setIsCustomArea] = useState(false);
  const [customAreaName, setCustomAreaName] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedState, setCopiedState] = useState(false);

  // Dynamic available areas
  const defaultAreas = ['Chandoli', 'Ward 1', 'Ward 2', 'Ward 3', 'Ward 4'];
  const allAreas = Array.from(
    new Set([...defaultAreas, ...workers.map((w) => w.assignedArea).filter(Boolean)])
  );

  // Form states for Assign Task
  const [taskForm, setTaskForm] = useState({
    workerId: '',
    issueId: '',
    title: '',
    category: 'Drainage blockage',
    priority: 'High',
    description: '',
    location: 'Chandoli Main Road',
    deadline: '',
    requiredAction: 'Inspect the drainage blockage, clear the obstruction, upload before/after photos, and update resolution status.',
    beforeImage: '',
  });

  // Fetch all worker data and monitoring metrics
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (roleFilter !== 'All') params.append('role', roleFilter);
      if (areaFilter !== 'All') params.append('assignedArea', areaFilter);
      if (search) params.append('search', search);

      const [workersRes, activityRes, tasksRes, issuesRes] = await Promise.all([
        api.get(`/workers?${params.toString()}`).catch(() => ({ data: { workers: [], summary: {} } })),
        api.get('/workers/stats/activity').catch(() => ({ data: {} })),
        api.get('/tasks').catch(() => ({ data: { tasks: [] } })),
        api.get('/issues?limit=50').catch(() => ({ data: { issues: [] } })),
      ]);

      setWorkers(workersRes.data?.workers || []);
      setSummary(
        workersRes.data?.summary || {
          totalWorkers: 0,
          activeWorkers: 0,
          availableWorkers: 0,
          workersOnTask: 0,
          completedTasks: 0,
        }
      );

      if (activityRes.data) {
        setActivity(activityRes.data.activity || {});
        setWorkerPerformance(activityRes.data.workerPerformance || []);
        setTaskCompletionChart(activityRes.data.taskCompletionChart || []);
      }

      setAllTasks(tasksRes.data?.tasks || []);
      setOpenIssues(
        (issuesRes.data?.issues || []).filter((i) => !['VERIFIED RESOLVED'].includes(i.status))
      );
    } catch (err) {
      console.error('Fetch worker management data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [statusFilter, roleFilter, areaFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAllData();
  };

  // Helper to generate a random strong password on demand
  const handleGeneratePassword = () => {
    const prefixes = ['GramSetu', 'Chandoli', 'Karya', 'Seva'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const pwd = `${prefix}@${randomDigits}`;
    setGeneratedPassword(pwd);
    setWorkerForm((prev) => ({ ...prev, password: pwd, confirmPassword: pwd }));
  };

  // Open Add Worker modal with pre-generated Worker ID & Password
  const openAddWorker = () => {
    const nextNum = String(workers.length + 1).padStart(3, '0');
    const prefixes = ['GramSetu', 'Chandoli', 'Karya'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const pwd = `${prefix}@${randomDigits}`;

    setWorkerForm({
      name: '',
      phone: '',
      email: '',
      workerId: `GRAM-WKR-${nextNum}`,
      password: pwd,
      confirmPassword: pwd,
      assignedArea: 'Chandoli',
      workerRole: 'Field Worker',
      status: 'Active',
    });
    setIsCustomArea(false);
    setCustomAreaName('');
    setGeneratedPassword(pwd);
    setFormError('');
    setShowAddWorkerModal(true);
  };

  // Submit Worker Registration
  const handleCreateWorker = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!workerForm.name.trim()) {
      setFormError('Please enter the worker full name.');
      return;
    }

    const cleanPhone = workerForm.phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setFormError('Please provide a valid 10-digit Indian mobile number.');
      return;
    }

    if (workerForm.password !== workerForm.confirmPassword) {
      setFormError('Passwords do not match. Please verify password and confirmation.');
      return;
    }

    const finalArea = isCustomArea ? customAreaName.trim() : workerForm.assignedArea;
    if (!finalArea) {
      setFormError('Please select or type an assigned area name.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/workers', {
        ...workerForm,
        assignedArea: finalArea,
        phone: cleanPhone,
      });

      setShowAddWorkerModal(false);
      setCreatedCredentialsModal(res.data.worker);
      await fetchAllData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create worker account');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle active/inactive
  const handleToggleStatus = async (workerId) => {
    try {
      await api.put(`/workers/${workerId}/toggle`);
      await fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  // Reset worker password
  const handleResetPassword = async (workerId) => {
    if (!window.confirm('Generate and assign a new temporary password for this worker?')) return;
    try {
      const res = await api.post(`/workers/${workerId}/reset-password`);
      setCreatedCredentialsModal({
        name: res.data.credentials.name,
        workerId: res.data.credentials.workerId,
        mobile: res.data.credentials.mobile,
        email: res.data.credentials.email,
        temporaryPassword: res.data.credentials.temporaryPassword,
      });
      await fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Password reset failed');
    }
  };

  // Open Assign Task modal
  const openAssignTask = (worker = null, issue = null) => {
    setTaskForm({
      workerId: worker?._id || (workers[0]?._id || ''),
      issueId: issue?._id || '',
      title: issue ? issue.title : 'Drainage blockage inspection near Chandoli Main Road',
      category: issue ? issue.category : 'Drainage blockage',
      priority: issue ? issue.priority?.level || 'High' : 'High',
      description: issue
        ? issue.description
        : 'Inspect the drainage blockage, clear the obstruction, upload before/after photos, and update the resolution status.',
      location: issue ? issue.location?.landmark || issue.location?.address : 'Chandoli Main Road',
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
      requiredAction:
        'Inspect site, rectify civic breakdown, upload before/after resolution photos, and mark completed.',
      beforeImage: issue?.images?.[0]?.url || '',
    });
    setShowAssignTaskModal(true);
  };

  // Submit Assign Task
  const handleAssignTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.workerId) {
      alert('Please select a field worker.');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/tasks', taskForm);
      setShowAssignTaskModal(false);
      await fetchAllData();
      alert('Field task assigned successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign field task');
    } finally {
      setSubmitting(false);
    }
  };

  // Admin Task Verification
  const handleVerifyTask = async (taskId) => {
    const notes = window.prompt('Enter admin verification note:', 'Panchayat Admin verified field resolution proof.');
    if (notes === null) return;
    try {
      await api.put(`/tasks/${taskId}/verify`, { notes });
      setInspectTaskModal(null);
      await fetchAllData();
      alert('Task verified and resolved successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  // Admin Reopen Task
  const handleReopenTask = async (taskId) => {
    const reason = window.prompt('Enter reason for reopening task (requesting rework):', 'Work incomplete or requires further rectification.');
    if (!reason) return;
    try {
      await api.put(`/tasks/${taskId}/reopen`, { reason });
      setInspectTaskModal(null);
      await fetchAllData();
      alert('Task reopened and sent back to worker.');
    } catch (err) {
      alert(err.response?.data?.message || 'Reopening failed');
    }
  };

  // Copy credentials helper
  const copyCredentialsToClipboard = () => {
    if (!createdCredentialsModal) return;
    const text = `*GramSetu AI — Field Worker Login Credentials*
----------------------------------------
Worker Name: ${createdCredentialsModal.name}
Worker ID: ${createdCredentialsModal.workerId}
Mobile: ${createdCredentialsModal.mobile}
Email: ${createdCredentialsModal.email}
Temporary Password: ${createdCredentialsModal.temporaryPassword}
Portal Login: ${window.location.origin}/worker/login
----------------------------------------
*Note:* Please change your password on first login.`;

    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 3000);
  };

  // Send credentials via WhatsApp
  const sendCredentialsWhatsApp = () => {
    if (!createdCredentialsModal) return;
    const text = `GramSetu AI — Field Worker Login Credentials
Worker Name: ${createdCredentialsModal.name}
Worker ID: ${createdCredentialsModal.workerId}
Mobile: ${createdCredentialsModal.mobile}
Temporary Password: ${createdCredentialsModal.temporaryPassword}
Login URL: ${window.location.origin}/worker/login`;

    const phone = createdCredentialsModal.mobile.replace(/\D/g, '');
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Filtered workers by taskStatus client-side if selected
  const displayedWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (taskStatusFilter === 'Available') return w.activeTasks === 0;
      if (taskStatusFilter === 'On Task') return w.activeTasks > 0;
      return true;
    });
  }, [workers, taskStatusFilter]);

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Gram Panchayat Chandoli — Field Workforce Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Field Worker Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create, manage, assign, and monitor Gram Panchayat field workers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => openAssignTask()}
            className="px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs shadow-xs transition flex items-center space-x-2"
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-700" />
            <span>Assign Field Task</span>
          </button>

          <button
            type="button"
            onClick={openAddWorker}
            className="px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Worker</span>
          </button>
        </div>
      </div>

      {/* Top KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            TOTAL WORKERS
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1.5">{summary.totalWorkers}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Registered field staff</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            ACTIVE WORKERS
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-1.5">{summary.activeWorkers}</div>
          <div className="text-[10px] text-emerald-600 mt-1 font-semibold">Ready for deployment</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            AVAILABLE WORKERS
          </div>
          <div className="text-3xl font-black text-teal-600 mt-1.5">{summary.availableWorkers}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">0 active tasks assigned</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            WORKERS ON TASK
          </div>
          <div className="text-3xl font-black text-sky-600 mt-1.5">{summary.workersOnTask}</div>
          <div className="text-[10px] text-sky-600 mt-1 font-semibold">Active in field repairs</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft col-span-2 sm:col-span-1">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            COMPLETED TASKS
          </div>
          <div className="text-3xl font-black text-indigo-700 mt-1.5">{summary.completedTasks}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Verified village repairs</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-soft space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workers by Name, Worker ID, Email, or Mobile..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none"
            >
              <option value="All">All Roles</option>
              <option value="Field Worker">Field Worker</option>
              <option value="Sanitation Worker">Sanitation Worker</option>
              <option value="Water Maintenance Worker">Water Maintenance Worker</option>
              <option value="Road Maintenance Worker">Road Maintenance Worker</option>
              <option value="Electrical/Streetlight Worker">Electrical/Streetlight Worker</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
              Assigned Area
            </label>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none"
            >
              <option value="All">All Areas</option>
              {allAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
              Task Status
            </label>
            <select
              value={taskStatusFilter}
              onChange={(e) => setTaskStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none"
            >
              <option value="All">All Workloads</option>
              <option value="Available">Available (0 Active)</option>
              <option value="On Task">On Task (&gt;0 Active)</option>
            </select>
          </div>
        </div>
      </div>

      {/* FEATURE 2 — WORKER LIST TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-extrabold text-slate-900">
              Gram Panchayat Field Workers
            </h2>
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              {displayedWorkers.length} Workers
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            Loading field workforce data...
          </div>
        ) : displayedWorkers.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            No workers found matching your query. Click <b>+ Add Worker</b> to register a field specialist.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Worker ID</th>
                  <th className="py-3 px-4">Worker Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Assigned Area</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Active Tasks</th>
                  <th className="py-3 px-4 text-center">Completed</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {displayedWorkers.map((worker) => (
                  <tr key={worker._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                      {worker.workerId}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {worker.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {worker.phone || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {worker.email}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">
                      {worker.assignedArea}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {worker.workerRole}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          worker.activeTasks > 0
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {worker.activeTasks}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                        {worker.completedTasks}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                          worker.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            worker.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        ></span>
                        <span>{worker.isActive ? 'Active' : 'Inactive'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => openAssignTask(worker)}
                          title="Assign Task"
                          className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold transition flex items-center space-x-1"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>Assign</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setViewWorkerModal(worker)}
                          title="View Details"
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResetPassword(worker._id)}
                          title="Reset Password"
                          className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(worker._id)}
                          title={worker.isActive ? 'Deactivate Worker' : 'Activate Worker'}
                          className={`p-1.5 rounded-xl transition ${
                            worker.isActive
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FEATURE 4 & 6 — WORKER ACTIVITY & MONITORING SECTION */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-emerald-700" />
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Worker Activity & Performance Monitoring
          </h2>
        </div>

        {/* Activity Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
            <div className="text-[10px] font-extrabold uppercase text-slate-400">
              Active Workers
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {activity.activeWorkers}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
            <div className="text-[10px] font-extrabold uppercase text-slate-400">
              Workers on Task
            </div>
            <div className="text-2xl font-black text-sky-600 mt-1">
              {activity.workersCurrentlyOnTask}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
            <div className="text-[10px] font-extrabold uppercase text-slate-400">
              Completed Today
            </div>
            <div className="text-2xl font-black text-indigo-700 mt-1">
              {activity.completedTasksToday}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft">
            <div className="text-[10px] font-extrabold uppercase text-slate-400">
              Overdue Tasks
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {activity.overdueTasks}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft col-span-2 sm:col-span-1">
            <div className="text-[10px] font-extrabold uppercase text-slate-400">
              Pending Verification
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {activity.pendingVerification}
            </div>
          </div>
        </div>

        {/* Performance Table & Completion Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Worker Performance Table */}
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Field Worker Performance Ledger
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-2">Worker</th>
                    <th className="pb-2">Role</th>
                    <th className="pb-2 text-center">Assigned</th>
                    <th className="pb-2 text-center">In Progress</th>
                    <th className="pb-2 text-center">Completed</th>
                    <th className="pb-2 text-center">Overdue</th>
                    <th className="pb-2 text-right">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workerPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        No performance history recorded yet.
                      </td>
                    </tr>
                  ) : (
                    workerPerformance.map((wp, idx) => (
                      <tr key={wp._id || `${wp.workerId || 'w'}-${idx}`} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 pr-2 font-bold text-slate-900">
                          <div>{wp.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{wp.workerId}</div>
                        </td>
                        <td className="py-2.5 pr-2 text-slate-600">{wp.role}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-800">{wp.assigned}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-sky-600">{wp.inProgress}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-emerald-600">{wp.completed}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-rose-600">{wp.overdue}</td>
                        <td className="py-2.5 pl-2 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <span className="font-extrabold text-slate-900">{wp.completionRate}%</span>
                            <div className="w-12 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-600"
                                style={{ width: `${wp.completionRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Completion Chart (Recharts) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-1">
                Worker Task Completion
              </h3>
              <p className="text-xs text-slate-500 mb-4">Completed civic tasks categorized by specialty</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskCompletionChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="completed" fill="#059669" radius={[8, 8, 0, 0]}>
                      {taskCompletionChart.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 text-center pt-2 border-t border-slate-100">
              Gram Panchayat Chandoli Civic Task Ledger
            </div>
          </div>
        </div>
      </div>

      {/* FEATURE 4 — RECENT FIELD TASKS TRACKING TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-extrabold text-slate-900">
              Active Field Task Tracking & Verification
            </h2>
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {allTasks.length} Total Tasks
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Assigned Worker</th>
                <th className="py-3 px-4">Title / Issue</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {allTasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No field tasks assigned yet. Click <b>Assign Field Task</b> to dispatch workers.
                  </td>
                </tr>
              ) : (
                allTasks.slice(0, 10).map((task) => (
                  <tr key={task._id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {task.taskId}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {task.workerId?.name || 'Assigned Worker'}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {task.workerId?.workerId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 max-w-[200px] truncate">
                      {task.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {task.category}
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge level={task.priority} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-[150px] truncate">
                      {task.location?.landmark || task.location?.address}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          task.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : task.status === 'COMPLETED'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : task.status === 'IN PROGRESS'
                            ? 'bg-sky-100 text-sky-800'
                            : task.status === 'ACCEPTED'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setInspectTaskModal(task)}
                        className="px-3 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition"
                      >
                        Inspect & Track
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FEATURE 1 MODAL — ADD WORKER REGISTRATION FORM */}
      {showAddWorkerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">Add New Field Worker</h3>
                  <p className="text-xs text-slate-500">Gram Panchayat Chandoli Field Staff Portal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddWorkerModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateWorker} className="space-y-4 text-xs">
              {/* Field 1: Worker Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Worker Full Name *</label>
                <input
                  type="text"
                  value={workerForm.name}
                  onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Shankar Patil"
                  required
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Field 2 & 3: Mobile & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mobile Number (10 digits) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-slate-400 font-mono font-bold">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={workerForm.phone}
                      onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                      placeholder="9876543210"
                      maxLength={10}
                      required
                      className="w-full pl-12 pr-3.5 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={workerForm.email}
                    onChange={(e) => setWorkerForm({ ...workerForm, email: e.target.value })}
                    placeholder="worker@grampanchayat.in"
                    required
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Field 4: Worker ID (Auto-generated) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Worker ID (Automatically Generated)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={workerForm.workerId}
                    onChange={(e) => setWorkerForm({ ...workerForm, workerId: e.target.value })}
                    className="flex-1 px-3.5 py-2 rounded-2xl border border-slate-200 bg-slate-50 font-mono font-bold text-emerald-800"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(100 + Math.random() * 900);
                      setWorkerForm({ ...workerForm, workerId: `GRAM-WKR-${rand}` });
                    }}
                    className="px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* Field 5 & 6: Password & Generator */}
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Password Configuration</label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="px-3 py-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] transition flex items-center space-x-1"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-700" />
                    <span>Generate Strong Password</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={workerForm.password}
                      onChange={(e) =>
                        setWorkerForm({ ...workerForm, password: e.target.value })
                      }
                      placeholder="Temporary password"
                      required
                      className="w-full px-3.5 pr-9 py-2 rounded-2xl border border-slate-200 bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={workerForm.confirmPassword}
                      onChange={(e) =>
                        setWorkerForm({ ...workerForm, confirmPassword: e.target.value })
                      }
                      placeholder="Confirm password"
                      required
                      className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 bg-white focus:outline-none"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  Temporary password will be shown upon creation. Workers are required to update it on first login.
                </p>
              </div>

              {/* Field 7, 8 & 9: Area, Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">Assigned Area</label>
                    {isCustomArea && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomArea(false);
                          setWorkerForm({ ...workerForm, assignedArea: 'Chandoli' });
                          setCustomAreaName('');
                        }}
                        className="text-[10px] font-bold text-emerald-700 hover:underline"
                      >
                        ← Choose Existing
                      </button>
                    )}
                  </div>
                  <select
                    value={isCustomArea ? 'OTHER' : workerForm.assignedArea}
                    onChange={(e) => {
                      if (e.target.value === 'OTHER') {
                        setIsCustomArea(true);
                        setCustomAreaName('');
                        setWorkerForm({ ...workerForm, assignedArea: '' });
                      } else {
                        setIsCustomArea(false);
                        setCustomAreaName('');
                        setWorkerForm({ ...workerForm, assignedArea: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-white font-medium text-slate-800"
                  >
                    {allAreas.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                    <option value="OTHER">➕ Other (Create New Area...)</option>
                  </select>

                  {isCustomArea && (
                    <div className="mt-2 space-y-1">
                      <input
                        type="text"
                        value={customAreaName}
                        onChange={(e) => {
                          setCustomAreaName(e.target.value);
                          setWorkerForm({ ...workerForm, assignedArea: e.target.value });
                        }}
                        placeholder="Enter other / new area name (e.g. Ward 5, Shivaji Chowk)..."
                        required
                        autoFocus
                        className="w-full px-3 py-2 rounded-2xl border-2 border-emerald-500 bg-emerald-50/20 text-slate-800 text-xs font-semibold focus:outline-none placeholder:text-slate-400"
                      />
                      <p className="text-[10px] text-emerald-700 font-semibold">
                        ✓ New area will be created and saved to system
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Worker Role</label>
                  <select
                    value={workerForm.workerRole}
                    onChange={(e) => setWorkerForm({ ...workerForm, workerRole: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-white"
                  >
                    <option value="Field Worker">Field Worker</option>
                    <option value="Sanitation Worker">Sanitation Worker</option>
                    <option value="Water Maintenance Worker">Water Maintenance Worker</option>
                    <option value="Road Maintenance Worker">Road Maintenance Worker</option>
                    <option value="Electrical/Streetlight Worker">Electrical/Streetlight Worker</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={workerForm.status}
                    onChange={(e) => setWorkerForm({ ...workerForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddWorkerModal(false)}
                  className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md shadow-emerald-700/20 transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POST-CREATION SUCCESS & CREDENTIALS MODAL */}
      {createdCredentialsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                Worker account created successfully.
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Provide these credentials to the worker to enable portal login.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 text-left text-xs space-y-2.5 font-mono">
              <div className="flex justify-between border-b border-slate-200 pb-1.5 font-sans">
                <span className="text-slate-500 font-bold">Worker Name:</span>
                <span className="font-extrabold text-slate-900">{createdCredentialsModal.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-bold font-sans">Worker ID:</span>
                <span className="font-extrabold text-emerald-800">{createdCredentialsModal.workerId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-bold font-sans">Mobile:</span>
                <span className="font-extrabold text-slate-800">{createdCredentialsModal.mobile}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-bold font-sans">Email:</span>
                <span className="font-extrabold text-slate-800 truncate max-w-[200px]">
                  {createdCredentialsModal.email}
                </span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-slate-500 font-bold font-sans">Temporary Password:</span>
                <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 font-black text-xs border border-amber-300">
                  {createdCredentialsModal.temporaryPassword}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={copyCredentialsToClipboard}
                className={`w-full py-3 rounded-full text-xs font-bold transition flex items-center justify-center space-x-2 ${
                  copiedState
                    ? 'bg-emerald-800 text-white'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-700/20'
                }`}
              >
                {copiedState ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedState ? 'Login Credentials Copied!' : 'Copy Login Credentials'}</span>
              </button>

              <button
                type="button"
                onClick={sendCredentialsWhatsApp}
                className="w-full py-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition flex items-center justify-center space-x-2"
              >
                <Send className="w-3.5 h-3.5 text-emerald-700" />
                <span>Send Credentials (WhatsApp / SMS)</span>
              </button>

              <button
                type="button"
                onClick={() => setCreatedCredentialsModal(null)}
                className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FEATURE 3 MODAL — ASSIGN FIELD TASK */}
      {showAssignTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">Assign Field Task</h3>
                  <p className="text-xs text-slate-500">Dispatch repair task to Panchayat field worker</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignTaskModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignTaskSubmit} className="space-y-4 text-xs">
              {/* Select Worker */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">1. Select Worker *</label>
                <select
                  value={taskForm.workerId}
                  onChange={(e) => setTaskForm({ ...taskForm, workerId: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 font-bold text-slate-800 bg-slate-50"
                >
                  <option value="">-- Choose Field Specialist --</option>
                  {workers.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.workerId}) — {w.workerRole} [{w.activeTasks} Active Tasks]
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional: Link to Open Citizen Complaint */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  2. Link to Reported Issue / Complaint (Optional)
                </label>
                <select
                  value={taskForm.issueId}
                  onChange={(e) => {
                    const selected = openIssues.find((i) => i._id === e.target.value);
                    if (selected) {
                      setTaskForm({
                        ...taskForm,
                        issueId: selected._id,
                        title: selected.title,
                        category: selected.category,
                        priority: selected.priority?.level || 'Medium',
                        description: selected.description,
                        location: selected.location?.landmark || selected.location?.address,
                        beforeImage: selected.images?.[0]?.url || '',
                      });
                    } else {
                      setTaskForm({ ...taskForm, issueId: '' });
                    }
                  }}
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 bg-white"
                >
                  <option value="">-- Standalone Field Work Order / Custom --</option>
                  {openIssues.map((issue) => (
                    <option key={issue._id} value={issue._id}>
                      #{issue._id.slice(-6)}: {issue.title} ({issue.category} - {issue.priority?.level})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">3. Issue Category</label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200"
                  >
                    <option value="Waste accumulation">Waste accumulation</option>
                    <option value="Drainage blockage">Drainage blockage</option>
                    <option value="Water leakage">Water leakage</option>
                    <option value="Damaged road">Damaged road</option>
                    <option value="Streetlight failure">Streetlight failure</option>
                    <option value="Water supply">Water supply</option>
                    <option value="Sanitation">Sanitation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">4. Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Task Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Drainage blockage reported near Chandoli Main Road"
                  required
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200"
                />
              </div>

              {/* Description & Required Action */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">5. Task Description *</label>
                  <textarea
                    rows={3}
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">8. Required Action</label>
                  <textarea
                    rows={3}
                    value={taskForm.requiredAction}
                    onChange={(e) => setTaskForm({ ...taskForm, requiredAction: e.target.value })}
                    placeholder="e.g. Inspect the drainage blockage, clear the obstruction, upload before/after photos..."
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Location & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">6. Location *</label>
                  <input
                    type="text"
                    value={taskForm.location}
                    onChange={(e) => setTaskForm({ ...taskForm, location: e.target.value })}
                    placeholder="e.g. Chandoli Main Road near Bus Stop"
                    required
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">7. Deadline</label>
                  <input
                    type="date"
                    value={taskForm.deadline}
                    onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200"
                  />
                </div>
              </div>


              {/* Buttons */}
              <div className="pt-4 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignTaskModal(false)}
                  className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md shadow-emerald-700/20 disabled:opacity-50"
                >
                  {submitting ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FEATURE 4 MODAL — TASK TRACKING & INSPECTION */}
      {inspectTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-black text-sm text-emerald-800">
                    {inspectTaskModal.taskId}
                  </span>
                  <PriorityBadge level={inspectTaskModal.priority} />
                </div>
                <h3 className="font-black text-lg text-slate-900 mt-1">
                  {inspectTaskModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectTaskModal(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Lifecycle Progress Bar */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-[10px] uppercase text-slate-400">
                Task Progression Pipeline
              </span>
              <div className="flex items-center justify-between text-[11px] font-extrabold">
                {['ASSIGNED', 'ACCEPTED', 'IN PROGRESS', 'COMPLETED', 'VERIFIED'].map(
                  (step, idx) => {
                    const stepOrder = ['ASSIGNED', 'ACCEPTED', 'IN PROGRESS', 'COMPLETED', 'VERIFIED'];
                    const currentIdx = stepOrder.indexOf(inspectTaskModal.status);
                    const isPassed = currentIdx >= idx;
                    const isCurrent = inspectTaskModal.status === step;
                    return (
                      <div key={step} className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                            isPassed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span
                          className={`mt-1 text-[9px] ${
                            isCurrent
                              ? 'text-emerald-800 font-black'
                              : isPassed
                              ? 'text-slate-700'
                              : 'text-slate-400'
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Task Details Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px]">Worker Name:</span>
                <span className="font-bold text-slate-800">
                  {inspectTaskModal.workerId?.name} ({inspectTaskModal.workerId?.workerRole || 'Field Specialist'})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Category:</span>
                <span className="font-bold text-slate-800">{inspectTaskModal.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Location:</span>
                <span className="font-bold text-slate-800">
                  {inspectTaskModal.location?.landmark || inspectTaskModal.location?.address}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Deadline:</span>
                <span className="font-bold text-slate-800">
                  {inspectTaskModal.deadline
                    ? new Date(inspectTaskModal.deadline).toLocaleDateString()
                    : 'Not specified'}
                </span>
              </div>
            </div>

            {/* Before vs After Photos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-2">Before Image (Issue)</span>
                {inspectTaskModal.beforeImage ? (
                  <div className="h-40 rounded-xl overflow-hidden border border-slate-300">
                    <img
                      src={inspectTaskModal.beforeImage}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-40 rounded-xl bg-slate-200/50 flex items-center justify-center text-slate-400">
                    No before photo
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-2">After Image (Resolution Proof)</span>
                {inspectTaskModal.afterImage ? (
                  <div className="h-40 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-xs">
                    <img
                      src={inspectTaskModal.afterImage}
                      alt="After proof"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-40 rounded-xl bg-slate-200/50 flex items-center justify-center text-slate-400">
                    Pending worker completion proof
                  </div>
                )}
              </div>
            </div>

            {/* Worker Notes */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="font-bold text-slate-700 block mb-1">Worker Resolution Notes:</span>
              <p className="text-slate-600 italic">
                {inspectTaskModal.workerNotes || 'No notes submitted yet.'}
              </p>
            </div>

            {/* Admin Actions */}
            <div className="pt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleReopenTask(inspectTaskModal._id)}
                  className="px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold transition"
                >
                  Reopen Task
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setInspectTaskModal(null)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Close
                </button>

                {['COMPLETED', 'ACTION COMPLETED'].includes(inspectTaskModal.status) && (
                  <button
                    type="button"
                    onClick={() => handleVerifyTask(inspectTaskModal._id)}
                    className="px-5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-sm transition flex items-center space-x-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>Verify Completed Task</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW WORKER PROFILE MODAL */}
      {viewWorkerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  {viewWorkerModal.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">{viewWorkerModal.name}</h3>
                  <span className="font-mono text-emerald-800 font-bold">{viewWorkerModal.workerId}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewWorkerModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Mobile Number:</span>
                <span className="font-bold text-slate-800 font-mono">{viewWorkerModal.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Email:</span>
                <span className="font-bold text-slate-800">{viewWorkerModal.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Assigned Area:</span>
                <span className="font-bold text-slate-800">{viewWorkerModal.assignedArea}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Worker Role:</span>
                <span className="font-bold text-slate-800">{viewWorkerModal.workerRole}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Active Tasks:</span>
                <span className="font-extrabold text-sky-700">{viewWorkerModal.activeTasks}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Completed Tasks:</span>
                <span className="font-extrabold text-emerald-700">{viewWorkerModal.completedTasks}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  const target = viewWorkerModal;
                  setViewWorkerModal(null);
                  openAssignTask(target);
                }}
                className="px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                Assign Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
