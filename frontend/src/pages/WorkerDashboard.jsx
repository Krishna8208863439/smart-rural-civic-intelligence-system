import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { translateData, translateCategory } from '../utils/translateData';
import {
  Wrench,
  Clock,
  CheckCircle2,
  MapPin,
  AlertCircle,
  Play,
  Upload,
  FileCheck,
  Users,
  Sparkles,
  Calendar,
  Camera,
  Navigation,
  Key,
  X,
  Check,
  RefreshCw,
} from 'lucide-react';

export default function WorkerDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ myTasks: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);

  // Modals
  const [progressModalTask, setProgressModalTask] = useState(null);
  const [progressNote, setProgressNote] = useState('');
  const [progressImage, setProgressImage] = useState('');

  const [completeModalTask, setCompleteModalTask] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionImage, setCompletionImage] = useState('');
  const [gpsLocation, setGpsLocation] = useState({ latitude: '', longitude: '' });
  const [gpsLoading, setGpsLoading] = useState(false);

  // Password update modal for mustChangePassword
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Fetch worker tasks
      const res = await api.get('/tasks/my').catch(async () => {
        // Fallback to assigned issues if task API is empty
        const fallbackRes = await api.get('/workers/assigned');
        return {
          data: {
            tasks: (fallbackRes.data?.issues || []).map((i) => ({
              _id: i._id,
              taskId: `TSK-${i._id.slice(-4).toUpperCase()}`,
              title: i.title,
              category: i.category,
              priority: i.priority?.level || 'Medium',
              description: i.description,
              location: i.location,
              deadline: i.deadline || null,
              status:
                i.status === 'UNDER ACTION'
                  ? 'IN PROGRESS'
                  : i.status === 'ACTION COMPLETED'
                  ? 'COMPLETED'
                  : i.status === 'VERIFIED RESOLVED'
                  ? 'VERIFIED'
                  : i.status,
              beforeImage: i.images?.[0]?.url || '',
              afterImage: i.completionDetails?.images?.[0]?.url || '',
              workerNotes: i.completionDetails?.notes || '',
              assignedWorker: i.assignedWorker,
            })),
            stats: fallbackRes.data?.stats
              ? {
                  myTasks: fallbackRes.data.stats.total,
                  pending: fallbackRes.data.stats.pending,
                  inProgress: fallbackRes.data.stats.inProgress,
                  completed: fallbackRes.data.stats.completed,
                  overdue: 0,
                }
              : { myTasks: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 },
          },
        };
      });

      setTasks(res.data?.tasks || []);
      setStats(
        res.data?.stats || { myTasks: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 }
      );
    } catch (err) {
      console.error('Fetch worker tasks error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Worker Action 1: Accept Task
  const handleAcceptTask = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}/accept`).catch(() => {
        // fallback
        return api.put(`/workers/issues/${taskId}/progress`, { note: 'Worker accepted task.' });
      });
      await fetchTasks();
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
      await fetchTasks();
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
      await fetchTasks();
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
      (err) => {
        alert('Could not retrieve GPS coordinates. Defaulting to village coordinates.');
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
      await fetchTasks();
      alert('Task completion proof submitted! Pending Admin Verification.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit completion proof');
    } finally {
      setSubmitting(false);
    }
  };

  // Worker Password Update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg('Passwords do not match.');
      return;
    }
    try {
      await api.put('/auth/update-password', { newPassword });
      setShowPasswordModal(false);
      alert('Password updated successfully!');
    } catch (err) {
      setPasswordMsg(err.response?.data?.message || 'Failed to update password.');
    }
  };

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold mb-2">
            <Wrench className="w-3.5 h-3.5 text-emerald-600" />
            <span>Gram Panchayat Chandoli — Field Worker Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome, {user?.name || 'Field Specialist'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View assigned work orders, accept tasks, update progress notes, and upload resolution proof upon completion.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user?.workerId && (
            <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 font-mono text-xs font-bold">
              ID: {user.workerId}
            </div>
          )}
          {user?.assignedArea && (
            <div className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold">
              Area: {user.assignedArea}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5"
          >
            <Key className="w-3.5 h-3.5 text-amber-600" />
            <span>Change Password</span>
          </button>
        </div>
      </div>

      {/* Mandatory Password Change Banner */}
      {user?.mustChangePassword && (
        <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold block">First Login Security Alert: Temporary Password Active</span>
              <span className="text-amber-700 text-[11px]">
                Please update your temporary password to secure your field account.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 transition"
          >
            Update Password Now
          </button>
        </div>
      )}

      {/* FEATURE 5 — WORKER SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            MY TASKS
          </div>
          <div className="text-3xl font-black text-slate-900 mt-1.5">{stats.myTasks}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">Assigned to me</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            PENDING
          </div>
          <div className="text-3xl font-black text-amber-600 mt-1.5">{stats.pending}</div>
          <div className="text-[10px] text-amber-600 mt-1 font-medium">Ready to accept</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            IN PROGRESS
          </div>
          <div className="text-3xl font-black text-sky-600 mt-1.5">{stats.inProgress}</div>
          <div className="text-[10px] text-sky-600 mt-1 font-medium">Active work on site</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            COMPLETED
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-1.5">{stats.completed}</div>
          <div className="text-[10px] text-emerald-600 mt-1 font-medium">Verified / submitted</div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft col-span-2 sm:col-span-1">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            OVERDUE
          </div>
          <div className="text-3xl font-black text-rose-600 mt-1.5">{stats.overdue}</div>
          <div className="text-[10px] text-rose-600 mt-1 font-medium">Past deadline</div>
        </div>
      </div>

      {/* SECTION: "My Assigned Tasks" */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            My Assigned Tasks
          </h2>
          <button
            type="button"
            onClick={fetchTasks}
            className="text-xs text-emerald-700 font-bold hover:underline flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Tasks</span>
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            Loading assigned civic tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="font-bold text-slate-700">No active tasks assigned to your account right now.</p>
            <p className="text-slate-400">Panchayat admin will assign civic tasks when reported.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tasks.map((task) => {
              const isAssigned = task.status === 'ASSIGNED';
              const isAccepted = task.status === 'ACCEPTED';
              const isInProgress = task.status === 'IN PROGRESS';
              const isCompleted = ['COMPLETED', 'ACTION COMPLETED'].includes(task.status);
              const isVerified = ['VERIFIED', 'VERIFIED RESOLVED'].includes(task.status);
              const isReopened = task.status === 'REOPENED';

              return (
                <div
                  key={task._id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-soft space-y-4 flex flex-col justify-between hover:border-emerald-400 transition duration-200"
                >
                  <div className="space-y-3">
                    {/* Top Row: Task ID, Priority, Category, Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {task.taskId || `#${task._id.slice(-6)}`}
                        </span>
                        <PriorityBadge level={task.priority} />
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {task.category}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isVerified
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCompleted
                            ? 'bg-amber-100 text-amber-800'
                            : isInProgress
                            ? 'bg-sky-100 text-sky-800'
                            : isAccepted
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isCompleted ? 'Pending Admin Verification' : task.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{task.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>

                    {/* Location & Deadline */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1 text-slate-600">
                      <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{task.location?.landmark || task.location?.address || 'Chandoli Village'}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>
                          Deadline:{' '}
                          {task.deadline
                            ? new Date(task.deadline).toLocaleDateString()
                            : 'Within 48 hours'}
                        </span>
                      </div>
                    </div>

                    {/* Before Photo if available */}
                    {task.beforeImage && (
                      <div className="flex items-center space-x-2 pt-1">
                        <span className="text-[11px] font-bold text-slate-500">Issue Photo:</span>
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-300">
                          <img
                            src={task.beforeImage}
                            alt="Issue"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* Completion Photo Proof if submitted */}
                    {task.afterImage && (
                      <div className="flex items-center space-x-2 pt-1">
                        <span className="text-[11px] font-bold text-emerald-700">Submitted Proof:</span>
                        <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-xs">
                          <img
                            src={task.afterImage}
                            alt="Completion proof"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FEATURE 5 — WORKER ACTIONS */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    {/* Status 1: ASSIGNED */}
                    {isAssigned && (
                      <button
                        type="button"
                        onClick={() => handleAcceptTask(task._id)}
                        className="w-full py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept Task</span>
                      </button>
                    )}

                    {/* Status 2: ACCEPTED */}
                    {isAccepted && (
                      <button
                        type="button"
                        onClick={() => handleStartTask(task._id)}
                        className="w-full py-2.5 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-1.5"
                      >
                        <Play className="w-4 h-4" />
                        <span>Start Task</span>
                      </button>
                    )}

                    {/* Status 3: IN PROGRESS */}
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

                    {/* Status 4: COMPLETED (Pending verification) */}
                    {isCompleted && (
                      <div className="w-full py-2 px-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-center font-bold text-xs">
                        ⏳ Proof Submitted — Pending Admin Verification
                      </div>
                    )}

                    {/* Status 5: VERIFIED */}
                    {isVerified && (
                      <div className="w-full py-2 px-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-bold text-xs flex items-center justify-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✓ Verified & Resolved by Panchayat Admin</span>
                      </div>
                    )}

                    {/* Status 6: REOPENED */}
                    {isReopened && (
                      <div className="w-full space-y-2">
                        <div className="py-1 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-center font-bold text-xs">
                          ⚠️ Task Reopened by Admin for Rework
                        </div>
                        <button
                          type="button"
                          onClick={() => handleStartTask(task._id)}
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
      </div>

      {/* UPDATE PROGRESS MODAL */}
      {progressModalTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200 text-xs">
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
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200"
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
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200"
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
                  className="px-5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200 text-xs">
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
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200"
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
                    className="flex-1 px-3.5 py-2 rounded-2xl border border-slate-200"
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
                    className="px-3 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold"
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
                  className="px-6 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md shadow-emerald-700/20"
                >
                  {submitting ? 'Submitting...' : 'Submit for Admin Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">Change Account Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordMsg && (
              <div className="p-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                {passwordMsg}
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200"
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
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
