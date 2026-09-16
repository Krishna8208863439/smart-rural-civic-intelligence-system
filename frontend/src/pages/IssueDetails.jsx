import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import ReliabilityBadge from '../components/ReliabilityBadge';
import { getAiWorkerRecommendation } from '../utils/aiWorkerMatcher';
import { translateData, translateCategory, translateReliability, translatePriority, translateAuditType } from '../utils/translateData';
import { formatDate, formatShortTime } from '../utils/formatDate';
import { getAccurateLivePosition, reverseGeocodeCoords, formatDetectionTime } from '../utils/geolocation';
import {

  MapPin,
  Clock,
  User,
  Users,
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Star,
  XCircle,
  Wrench,
  Sparkles,
  ArrowLeft,
  Calendar,
  Send,
  Upload,
  Check,
  Eye,
  Navigation,
  Crosshair,
  ExternalLink,
  Save,
  RefreshCw,
  Search,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_LAYERS, DEFAULT_MAP_LAYER } from '../maps/mapLayers';
import MapLayerSelector from '../maps/MapLayerSelector';

// Custom high-visibility SVG pin icons
const incidentPinIcon = L.divIcon({
  className: 'custom-incident-pin',
  html: `
    <div style="position: relative; width: 36px; height: 36px; transform: translate(-50%, -100%); cursor: pointer;">
      <div style="position: absolute; inset: 0; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: linear-gradient(135deg, #f43f5e 0%, #e11d48 50%, #be123c 100%); border: 2.5px solid white; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.45); display: flex; align-items: center; justify-content: center;">
        <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3.5" fill="white"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
        </div>
      </div>
      <div style="position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 12px; height: 4px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(1.5px);"></div>
    </div>
  `,
  iconSize: [0, 0],
});

const liveUserPinIcon = L.divIcon({
  className: 'custom-live-user-pin',
  html: `
    <div style="position: relative; width: 32px; height: 32px; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(14, 165, 233, 0.25); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(14, 165, 233, 0.4);"></div>
      <div style="position: relative; width: 16px; height: 16px; border-radius: 50%; background: #0284c7; border: 2.5px solid white; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.6);"></div>
    </div>
  `,
  iconSize: [0, 0],
});

const adjustedPinIcon = L.divIcon({
  className: 'custom-adjusted-pin',
  html: `
    <div style="position: relative; width: 36px; height: 36px; transform: translate(-50%, -100%); cursor: pointer;">
      <div style="position: absolute; inset: 0; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: 2.5px solid white; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.5); display: flex; align-items: center; justify-content: center;">
        <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>
      <div style="position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 12px; height: 4px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(1.5px);"></div>
    </div>
  `,
  iconSize: [0, 0],
});

// Map helper components
function MapPanController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 17, { animate: true, duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

function MapPinClickHandler({ onPinAdjust }) {
  useMapEvents({
    click(e) {
      if (onPinAdjust) {
        onPinAdjust([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

export default function IssueDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const { user, role, demoLogin } = useAuth();

  const [issue, setIssue] = useState(null);
  const [history, setHistory] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);

  // Action states
  const [voteComment, setVoteComment] = useState('');
  const [voting, setVoting] = useState(false);
  const [validations, setValidations] = useState([]);
  const [hasVotedSuccess, setHasVotedSuccess] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');

  // Worker progress states
  const [progressNote, setProgressNote] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionFiles, setCompletionFiles] = useState([]);
  const [samplePreviewUrl, setSamplePreviewUrl] = useState('');

  // Admin verification state
  const [adminVerifyNotes, setAdminVerifyNotes] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Citizen feedback state
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackSatisfied, setFeedbackSatisfied] = useState(true);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [reopenRequested, setReopenRequested] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);

  const [liveUserCoords, setLiveUserCoords] = useState(null); // [lat, lng]
  const [liveAccuracy, setLiveAccuracy] = useState(null); // meters
  const [liveTiming, setLiveTiming] = useState(() => formatDetectionTime(new Date()).display);
  const [liveAddress, setLiveAddress] = useState('');
  const [liveSource, setLiveSource] = useState('');
  const [detectionStatus, setDetectionStatus] = useState('');
  const [detectingLive, setDetectingLive] = useState(false);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [liveError, setLiveError] = useState('');
  const [customPinCoords, setCustomPinCoords] = useState(null); // [lat, lng] if user adjusted pin
  const [isPinAdjustMode, setIsPinAdjustMode] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [saveLocationSuccess, setSaveLocationSuccess] = useState('');
  const [searchLocationQuery, setSearchLocationQuery] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [showManualCoords, setShowManualCoords] = useState(false);

  // Live ticking Indian Standard Time (IST) clock
  const [liveTickingClock, setLiveTickingClock] = useState(() => {
    return new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  });
  const [liveTickingDate, setLiveTickingDate] = useState(() => {
    return new Date().toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  });

  useEffect(() => {
    const clockTimer = setInterval(() => {
      const now = new Date();
      setLiveTickingClock(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setLiveTickingDate(
        now.toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Automatic live GPS detection on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const acc = Math.round(pos.coords.accuracy);
          setLiveUserCoords([lat, lng]);
          setLiveAccuracy(acc);
          setLiveSource('Device Live GPS Fix');
          reverseGeocodeCoords(lat, lng).then((rev) => {
            if (rev?.address) setLiveAddress(rev.address);
          });
        },
        (err) => console.log('Auto GPS mount note:', err.message),
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
      );
    }
  }, []);

  const handleQuickVillageSelect = async (name, lat, lng) => {
    const newCoords = [lat, lng];
    const timingStr = `${liveTickingDate}, ${liveTickingClock} (IST)`;
    setCustomPinCoords(newCoords);
    setMapCenter(newCoords);
    setLiveTiming(timingStr);
    setLiveAccuracy(5);
    setLiveSource(`Direct Village Pin (${name})`);
    try {
      const rev = await reverseGeocodeCoords(lat, lng);
      const addr = rev?.address || `${name}, Maharashtra, India`;
      setLiveAddress(addr);
      await handleSaveLivePin(newCoords, addr, name, timingStr, 5);
    } catch (e) {
      await handleSaveLivePin(newCoords, `${name}, Maharashtra, India`, name, timingStr, 5);
    }
  };

  const handleManualCoordsSubmit = async (e) => {
    if (e) e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setLiveError('Please enter valid numerical latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }
    const newCoords = [lat, lng];
    const timingStr = `${liveTickingDate}, ${liveTickingClock} (IST)`;
    setCustomPinCoords(newCoords);
    setMapCenter(newCoords);
    setLiveTiming(timingStr);
    setLiveAccuracy(3);
    setLiveSource('Manual GPS Coordinate Lock');
    try {
      const rev = await reverseGeocodeCoords(lat, lng);
      const addr = rev?.address || `Coordinates (${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E)`;
      setLiveAddress(addr);
      await handleSaveLivePin(newCoords, addr, rev?.landmark || 'Custom Pin', timingStr, 3);
    } catch (e) {
      await handleSaveLivePin(newCoords, undefined, undefined, timingStr, 3);
    }
  };
  const [mapCenter, setMapCenter] = useState(null);
  const [mapLayer, setMapLayer] = useState(DEFAULT_MAP_LAYER);
  const watchIdRef = useRef(null);

  const getGroundDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const handleStartLiveTracking = async () => {
    setLiveError('');
    setDetectingLive(true);
    setIsLiveTracking(true);
    setDetectionStatus('Acquiring high-precision live satellite fix...');

    try {
      const result = await getAccurateLivePosition({
        onStatusChange: (statusMsg) => setDetectionStatus(statusMsg),
        defaultCoords: (issue?.location?.coordinates && Array.isArray(issue.location.coordinates))
          ? [issue.location.coordinates[1], issue.location.coordinates[0]]
          : [16.73180, 73.90790]
      });

      if (result) {
        setLiveUserCoords([result.lat, result.lng]);
        setLiveAccuracy(result.accuracy);
        setLiveTiming(result.timing.display || result.timing.dateTime);
        setLiveSource(result.source);
        if (result.addressData?.address) {
          setLiveAddress(result.addressData.address);
        }
        setMapCenter([result.lat, result.lng]);
      }
    } catch (err) {
      console.warn('Live location error:', err);
      setLiveError('Live GPS search timed out. You can click "🎯 Adjust Pin on Map" to pinpoint your exact spot on the satellite map.');
    } finally {
      setDetectingLive(false);
      setDetectionStatus('');
    }

    if (navigator.geolocation) {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const acc = Math.round(pos.coords.accuracy);
          setLiveUserCoords([lat, lng]);
          setLiveAccuracy(acc);
          setLiveTiming(formatDetectionTime(new Date()).display);
        },
        (err) => console.warn('Geolocation watch error:', err),
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
      );
    }
  };

  const handleStopLiveTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLiveTracking(false);
  };

  const handleToggleLiveTracking = () => {
    if (isLiveTracking) {
      handleStopLiveTracking();
    } else {
      handleStartLiveTracking();
    }
  };

  const handleSearchLocation = async (e) => {
    if (e) e.preventDefault();
    const query = searchLocationQuery.trim();
    if (!query) return;

    try {
      setSearchingLocation(true);
      setLiveError('');
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=in&limit=5`,
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'SmartRuralCivicIntelligence/2.0',
          },
        }
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const first = results[0];
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.lon);
          const newCoords = [lat, lng];
          const timingStr = formatDetectionTime(new Date()).display;

          setCustomPinCoords(newCoords);
          setMapCenter(newCoords);
          setLiveTiming(timingStr);
          setLiveAddress(first.display_name);
          setLiveAccuracy(8);
          setLiveSource('Accurate Locality Search');

          // Automatically save the accurate searched location
          await handleSaveLivePin(newCoords, first.display_name, first.display_name.split(',')[0], timingStr, 8);
        } else {
          setLiveError(`No results found for "${query}". Try adding district or taluka name (e.g. "${query}, Maharashtra").`);
        }
      }
    } catch (err) {
      console.warn('Search location error:', err);
      setLiveError('Search failed. Please drag the pin on the map or check internet connection.');
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleDetectLivePin = async () => {
    setLiveError('');
    setDetectingLive(true);
    setDetectionStatus('Connecting to high-precision live GPS & Wi-Fi triangulation...');

    try {
      const result = await getAccurateLivePosition({
        onStatusChange: (statusMsg) => setDetectionStatus(statusMsg),
        defaultCoords: (issue?.location?.coordinates && Array.isArray(issue.location.coordinates))
          ? [issue.location.coordinates[1], issue.location.coordinates[0]]
          : [16.73180, 73.90790]
      });

      if (!result) return;

      const newCoords = [result.lat, result.lng];
      setLiveUserCoords(newCoords);
      setLiveAccuracy(result.accuracy);
      const timeStr = result.timing.display || result.timing.dateTime;
      setLiveTiming(timeStr);
      setLiveSource(result.source);

      const newAddress = result.addressData?.address || `Live Pinned Location (${result.lat.toFixed(5)}°N, ${result.lng.toFixed(5)}°E)`;
      const newLandmark = result.addressData?.landmark || `Live GPS Pin [${result.lat.toFixed(5)}, ${result.lng.toFixed(5)}]`;
      setLiveAddress(newAddress);
      setMapCenter(newCoords);

      // Automatically save and record the accurate live pin & acquisition timing
      await handleSaveLivePin(newCoords, newAddress, newLandmark, timeStr, result.accuracy);
    } catch (err) {
      console.warn('Live detect pin error:', err);
      setLiveError('Live GPS acquisition timed out. You can click "🎯 Adjust Pin on Map" to drop the pin manually on your exact spot.');
    } finally {
      setDetectingLive(false);
      setDetectionStatus('');
    }
  };

  const handlePinAdjust = async (newCoords) => {
    setCustomPinCoords(newCoords);
    setMapCenter(newCoords);
    const timeStr = formatDetectionTime(new Date()).display;
    setLiveTiming(timeStr);
    try {
      const rev = await reverseGeocodeCoords(newCoords[0], newCoords[1]);
      if (rev?.address) {
        setLiveAddress(rev.address);
      }
    } catch (e) {
      console.warn('Reverse geocode error on adjust:', e);
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const handleSaveLivePin = async (targetCoords, overrideAddress, overrideLandmark, overrideTiming, overrideAccuracy) => {
    const lat = targetCoords ? targetCoords[0] : (customPinCoords ? customPinCoords[0] : liveUserCoords ? liveUserCoords[0] : null);
    const lng = targetCoords ? targetCoords[1] : (customPinCoords ? customPinCoords[1] : liveUserCoords ? liveUserCoords[1] : null);

    if (!lat || !lng) return;

    const nowTiming = overrideTiming || liveTiming || formatDetectionTime(new Date()).display;
    const addr = overrideAddress || liveAddress || undefined;
    const lmark = overrideLandmark || (addr ? addr.split(',')[0] : undefined);
    const acc = overrideAccuracy || liveAccuracy || 4;

    try {
      setSavingLocation(true);
      setSaveLocationSuccess('');
      const res = await api.put(`/issues/${id}/location`, {
        latitude: lat,
        longitude: lng,
        address: addr,
        landmark: lmark,
        timing: nowTiming,
        accuracy: acc,
        detectedAt: new Date().toISOString()
      });
      if (res.data?.issue) {
        setIssue(res.data.issue);
      }
      setCustomPinCoords(null);
      setIsPinAdjustMode(false);
      setLiveTiming(nowTiming);
      setSaveLocationSuccess(`✓ Accurate live pin [${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E] & Timing (${nowTiming}) saved successfully!`);
      setTimeout(() => setSaveLocationSuccess(''), 6000);
      await fetchIssueData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update live pin location');
    } finally {
      setSavingLocation(false);
    }
  };

  const fetchIssueData = async () => {
    try {
      setLoading(true);
      const [res, valRes] = await Promise.all([
        api.get(`/issues/${id}`),
        api.get(`/issues/${id}/validations`).catch(() => null),
      ]);
      setIssue(res.data.issue);
      if (res.data.issue?.location?.timing) {
        setLiveTiming(res.data.issue.location.timing);
      }
      if (res.data.issue?.location?.accuracy) {
        setLiveAccuracy(res.data.issue.location.accuracy);
      }
      setHistory(res.data.history || []);
      setEvidence(res.data.evidence || []);
      setNewStatus(res.data.issue.status);
      if (valRes?.data?.validations) {
        setValidations(valRes.data.validations);
      }

      if (role === 'admin') {
        const workersRes = await api.get('/workers').catch(() => null);
        if (workersRes?.data?.workers) {
          const list = workersRes.data.workers;
          setWorkers(list);
          if (!res.data.issue.assignedWorker) {
            const match = getAiWorkerRecommendation(res.data.issue.category, list);
            if (match?.worker) {
              setSelectedWorker(match.worker._id);
            }
          }
        }
      }
    } catch (err) {
      console.error('Fetch issue error:', err);
    } finally {
      setLoading(false);
    }
  };

  // AI Recommended Worker based on detected issue category
  const aiWorkerMatch = useMemo(() => {
    return getAiWorkerRecommendation(issue?.category, workers);
  }, [issue?.category, workers]);

  useEffect(() => {
    fetchIssueData();
  }, [id, role]);

  // Citizen Community Validation Vote
  const handleVote = async (responseType) => {
    try {
      setVoting(true);
      await api.post(`/issues/${id}/validate`, {
        response: responseType,
        comment: voteComment,
      });
      setVoteComment('');
      setHasVotedSuccess(true);
      setTimeout(() => setHasVotedSuccess(false), 5000);
      await fetchIssueData();
    } catch (err) {
      alert(err.response?.data?.message || 'Validation submission failed');
    } finally {
      setVoting(false);
    }
  };

  // Admin Status Update
  const handleStatusChange = async (e) => {
    e.preventDefault();
    try {
      setStatusUpdating(true);
      await api.put(`/issues/${id}/status`, {
        status: newStatus,
        comment: statusComment,
      });
      setStatusComment('');
      await fetchIssueData();
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Admin Worker Assignment
  const handleAssignWorker = async () => {
    if (!selectedWorker) return;
    try {
      await api.put(`/admin/assign-worker/${id}`, { workerId: selectedWorker });
      await fetchIssueData();
    } catch (err) {
      alert(err.response?.data?.message || 'Worker assignment failed');
    }
  };

  // Worker Progress Note
  const handleAddProgress = async (startWork = false) => {
    try {
      await api.put(`/workers/issues/${id}/progress`, {
        note: progressNote || (startWork ? 'Work initiated on site' : 'Field inspection conducted'),
        startWork,
      });
      setProgressNote('');
      await fetchIssueData();
    } catch (err) {
      alert(err.response?.data?.message || 'Progress update failed');
    }
  };

  // Worker Mark Complete
  const handleCompleteWork = async (e) => {
    e?.preventDefault();
    try {
      const formData = new FormData();
      formData.append('notes', completionNotes || 'Civic problem solved to standard.');
      completionFiles.forEach((f) => formData.append('images', f));
      if (samplePreviewUrl && completionFiles.length === 0) {
        formData.append('sampleImageUrl', samplePreviewUrl);
      }

      await api.post(`/workers/issues/${id}/completion-evidence`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCompletionNotes('');
      setCompletionFiles([]);
      setSamplePreviewUrl('');
      await fetchIssueData();
      alert('✓ Resolution proof image submitted successfully for Admin verification!');
    } catch (err) {
      alert(err.response?.data?.message || 'Completion report failed');
    }
  };

  // Admin Verify Worker Resolution & Publish to Citizen
  const handleAdminVerify = async (e) => {
    e?.preventDefault();
    try {
      setVerifying(true);
      await api.put(`/issues/${id}/admin-verify`, {
        notes: adminVerifyNotes || 'Panchayat Administration verified field work and approved resolution proof.',
      });
      setAdminVerifyNotes('');
      await fetchIssueData();
      alert('✓ Resolution proof verified and published to Citizen successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  // Citizen Submit Feedback
  const handleSubmitFeedback = async (e) => {
    e?.preventDefault();
    try {
      setSubmittingFeedback(true);
      await api.post(`/issues/${id}/feedback`, {
        rating: feedbackRating,
        satisfied: feedbackSatisfied,
        comment: feedbackComment,
        reopen: reopenRequested,
      });
      setFeedbackSuccess('Thank you! Your feedback has been recorded.');
      setIsEditingFeedback(false);
      await fetchIssueData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getLifecycleStep = () => {
    if (!issue) return 1;
    if (issue.citizenFeedback?.submittedAt) return 5;
    if (issue.status === 'VERIFIED RESOLVED') return 4;
    if (issue.completionDetails?.completedAt || ['ACTION COMPLETED', 'MONITORING'].includes(issue.status)) return 3;
    if (issue.assignedWorker || ['ASSIGNED', 'UNDER ACTION'].includes(issue.status)) return 2;
    return 1;
  };
  const currentStep = getLifecycleStep();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-sm">Loading civic intelligence records...</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Issue record not found</h2>
        <button
          onClick={() => navigate('/issues')}
          className="mt-4 px-5 py-2 rounded-full bg-emerald-700 text-white text-xs font-semibold"
        >
          Back to Issues
        </button>
      </div>
    );
  }

  const coords = issue.location?.coordinates || [73.8567, 18.5204];
  const mapPos = [coords[1], coords[0]];

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Navigation & Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-4 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('common.back')}</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <StatusBadge status={issue.status} />
              <PriorityBadge level={issue.priority?.level} score={issue.priority?.score} showScore />
              <ReliabilityBadge level={issue.reliabilityLevel} score={issue.reliabilityScore} />
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                {translateCategory(issue.category, i18n.language)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {translateData(issue.title, i18n.language)}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-2">
              <span>{t('common.reportedBy', { name: issue.createdBy?.name || t('common.citizen') })}</span>
              <span>•</span>
              <span className="flex items-center space-x-1.5 font-medium text-slate-700">
                <Clock className="w-3.5 h-3.5 text-emerald-600 inline" />
                <span>Reported: {formatDate(issue.createdAt)}</span>
              </span>
              <span>•</span>
              <span className="font-mono text-slate-400">{t('common.id')}: #{issue._id.slice(-6)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Step Lifecycle Resolution Stepper */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>{t('issueDetails.lifecycleTitle')}</span>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            {t('issueDetails.currentStage', {
              current: currentStep,
              stage: currentStep === 1 ? t('issueDetails.stages.citizenReported') :
                     currentStep === 2 ? t('issueDetails.stages.workerDispatched') :
                     currentStep === 3 ? t('issueDetails.stages.repairsSolved') :
                     currentStep === 4 ? t('issueDetails.stages.adminVerified') :
                     t('issueDetails.stages.citizenFeedbackRecorded')
            })}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {/* Step 1 */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            currentStep >= 1 ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className="flex items-center space-x-2 font-bold text-xs mb-1">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep > 1 ? 'bg-emerald-600 text-white' : currentStep === 1 ? 'bg-emerald-700 text-white ring-2 ring-emerald-300' : 'bg-slate-200 text-slate-600'
              }`}>
                {currentStep > 1 ? '✓' : '1'}
              </span>
              <span>{t('issueDetails.steps.step1Title')}</span>
            </div>
            <p className="text-[11px] text-slate-600">{t('issueDetails.steps.step1Desc')}</p>
          </div>

          {/* Step 2 */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            currentStep >= 2 ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className="flex items-center space-x-2 font-bold text-xs mb-1">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep > 2 ? 'bg-emerald-600 text-white' : currentStep === 2 ? 'bg-emerald-700 text-white ring-2 ring-emerald-300' : 'bg-slate-200 text-slate-600'
              }`}>
                {currentStep > 2 ? '✓' : '2'}
              </span>
              <span>{t('issueDetails.steps.step2Title')}</span>
            </div>
            <p className="text-[11px] text-slate-600">
              {issue.assignedWorker ? t('issueDetails.steps.step2DescAssigned', { name: issue.assignedWorker.name }) : t('issueDetails.steps.step2DescAwaiting')}
            </p>
          </div>

          {/* Step 3 */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            currentStep >= 3 ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className="flex items-center space-x-2 font-bold text-xs mb-1">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep > 3 ? 'bg-emerald-600 text-white' : currentStep === 3 ? 'bg-amber-600 text-white ring-2 ring-amber-300 animate-pulse' : 'bg-slate-200 text-slate-600'
              }`}>
                {currentStep > 3 ? '✓' : '3'}
              </span>
              <span>{t('issueDetails.steps.step3Title')}</span>
            </div>
            <p className="text-[11px] text-slate-600">
              {issue.completionDetails?.completedAt ? t('issueDetails.steps.step3DescProof') : t('issueDetails.steps.step3DescRepairs')}
            </p>
          </div>

          {/* Step 4 */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            currentStep >= 4 ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className="flex items-center space-x-2 font-bold text-xs mb-1">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep > 4 ? 'bg-emerald-600 text-white' : currentStep === 4 ? 'bg-emerald-700 text-white ring-2 ring-emerald-300' : 'bg-slate-200 text-slate-600'
              }`}>
                {currentStep > 4 ? '✓' : '4'}
              </span>
              <span>{t('issueDetails.steps.step4Title')}</span>
            </div>
            <p className="text-[11px] text-slate-600">
              {issue.adminVerification?.verifiedAt ? t('issueDetails.steps.step4DescVerified') : t('issueDetails.steps.step4DescQuality')}
            </p>
          </div>

          {/* Step 5 */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            currentStep >= 5 ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className="flex items-center space-x-2 font-bold text-xs mb-1">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 5 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {currentStep === 5 ? '✓' : '5'}
              </span>
              <span>{t('issueDetails.steps.step5Title')}</span>
            </div>
            <p className="text-[11px] text-slate-600">
              {issue.citizenFeedback?.rating ? t('issueDetails.steps.step5DescSubmitted', { rating: issue.citizenFeedback.rating }) : t('issueDetails.steps.step5DescReview')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Details & Right Intelligence/Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Photos, Description, Location, Timeline */}
        <div className="lg:col-span-2 space-y-8">
          {/* Photos Gallery */}
          {issue.images && issue.images.length > 0 && (
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-soft">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {issue.images.map((img, idx) => (
                  <div key={idx} className="h-64 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                    <img src={img.url} alt={translateData(issue.title, i18n.language)} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description & Location */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-soft space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
              {t('issueDetails.descriptionAndLocation')}
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {translateData(issue.description, i18n.language)}
            </p>

            {issue.voiceTranscript && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 font-medium">
                🎙️ {t('issueDetails.voiceDictationRecord')}: "{translateData(issue.voiceTranscript, i18n.language)}"
              </div>
            )}

            <div className="pt-2 space-y-3">
              {/* Real-time Indian Standard Time (IST) Digital Clock Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-md border border-slate-700/80">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-inner">
                    <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Real-Time Indian Standard Time (IST)</span>
                    </div>
                    <div className="text-sm font-extrabold font-mono text-white tracking-wide">
                      {liveTickingDate} • {liveTickingClock}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>100% Real-Time Clock Active</span>
                  </span>
                </div>
              </div>

              {/* Landmark, Address and Accurate Coordinates readout */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200">
                <div className="flex items-start space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {translateData(issue.location?.landmark || '', i18n.language)} — {translateData(issue.location?.address, i18n.language)}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {issue.location?.ward} • {issue.location?.village || 'Gram Panchayat Chandoli'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Pin: {mapPos[0].toFixed(5)}°N, {mapPos[1].toFixed(5)}°E</span>
                  </div>
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      Locked: {liveTiming || issue.location?.timing || `${liveTickingDate}, ${liveTickingClock} (IST)`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instant Village Search Bar */}
              <form onSubmit={handleSearchLocation} className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchLocationQuery}
                    onChange={(e) => setSearchLocationQuery(e.target.value)}
                    placeholder="Search any village/city in Maharashtra (e.g. Chandoli, Devrai, Pune, Kolhapur, Sangli, Satara)..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searchingLocation || !searchLocationQuery.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 active:bg-black text-white shadow-xs transition cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {searchingLocation ? 'Searching...' : '🔍 Pin Village'}
                </button>
              </form>

              {/* Quick Village Pills for Instant 1-Click Pin Placement */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                <span className="font-semibold text-slate-500 text-[11px]">Quick Pin:</span>
                <button
                  type="button"
                  onClick={() => handleQuickVillageSelect('Gram Panchayat Chandoli', 16.73180, 73.90790)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition"
                >
                  📍 Chandoli
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickVillageSelect('Devrai Manvad', 16.73250, 73.90920)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition"
                >
                  📍 Devrai
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickVillageSelect('Sangli City', 16.85240, 74.58150)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition"
                >
                  📍 Sangli
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickVillageSelect('Kolhapur Central', 16.70500, 74.24330)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition"
                >
                  📍 Kolhapur
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickVillageSelect('Satara', 17.68050, 73.99300)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition"
                >
                  📍 Satara
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickVillageSelect('Pune Central', 18.52040, 73.85670)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition"
                >
                  📍 Pune
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualCoords(!showManualCoords)}
                  className="ml-auto text-[11px] text-blue-600 hover:text-blue-800 font-bold underline"
                >
                  {showManualCoords ? 'Hide Lat/Lng' : '⚙️ Enter Lat/Lng'}
                </button>
              </div>

              {/* Manual Exact Latitude & Longitude Input Form */}
              {showManualCoords && (
                <form onSubmit={handleManualCoordsSubmit} className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Manual GPS:</span>
                  <input
                    type="number"
                    step="any"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    placeholder="Latitude (e.g. 16.73180)"
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs w-36 focus:outline-none"
                  />
                  <input
                    type="number"
                    step="any"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    placeholder="Longitude (e.g. 73.90790)"
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs w-36 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
                  >
                    Set Pin
                  </button>
                </form>
              )}

              {/* Action Toolbar: Detect Live GPS Pin, Open in Google Maps, Adjust Pin */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* 1. Detect Live GPS Pin Button */}
                <button
                  type="button"
                  onClick={handleDetectLivePin}
                  disabled={detectingLive}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs transition cursor-pointer disabled:opacity-60"
                  title="Auto-detect current live GPS and lock timing"
                >
                  <Navigation className={`w-3.5 h-3.5 ${detectingLive ? 'animate-spin' : ''}`} />
                  <span>{detectingLive ? (detectionStatus || 'Detecting Live Pin...') : '📍 Auto-Detect & Set Live Pin'}</span>
                </button>

                {/* 2. Toggle Fine-Tune / Adjust Pin Mode */}
                <button
                  type="button"
                  onClick={() => setIsPinAdjustMode(!isPinAdjustMode)}
                  className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer shadow-xs ${
                    isPinAdjustMode
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                  title="Drag or click map to reposition accurate pin"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>{isPinAdjustMode ? '✓ Pin Mode Active (Drag or Click Map)' : '🎯 Adjust / Drag Pin on Map'}</span>
                </button>

                {/* Center buttons */}
                {liveUserCoords && (
                  <button
                    type="button"
                    onClick={() => setMapCenter(liveUserCoords)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition cursor-pointer"
                  >
                    <span>Center My Live Pin</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMapCenter(mapPos)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                >
                  <span>Center Problem Pin</span>
                </button>
              </div>

              {/* Status & Feedback Alerts */}
              {typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname.includes('pythonanywhere.com') && (
                <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-medium flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>Browsers require HTTPS for live device GPS. Switch to secure HTTPS mode for maximum GPS accuracy:</span>
                  </div>
                  <a
                    href={window.location.href.replace('http:', 'https:')}
                    className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg transition shrink-0"
                  >
                    🔒 Switch to HTTPS
                  </a>
                </div>
              )}

              {liveError && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{liveError}</span>
                </div>
              )}

              {saveLocationSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{saveLocationSuccess}</span>
                </div>
              )}

              {/* Live User Distance, Accurate Timing & Save Prompt */}
              {liveUserCoords && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 to-sky-50/90 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-blue-900 flex flex-wrap items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
                      <span>Accurate Live GPS Pin Detected ({liveUserCoords[0].toFixed(5)}°N, {liveUserCoords[1].toFixed(5)}°E)</span>
                      {liveSource && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          {liveSource}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-blue-700 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>
                        GPS Precision: {liveAccuracy && liveAccuracy > 500 ? `±${Math.round(liveAccuracy/1000)}km (Desktop IP estimate • Click map or village for ±2m)` : `±${liveAccuracy || 4}m`}
                      </span>
                      <span>•</span>
                      <span>Ground Distance: {getGroundDistance(liveUserCoords[0], liveUserCoords[1], mapPos[0], mapPos[1])}m from incident spot</span>
                      {liveTiming && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-blue-900 flex items-center space-x-1">
                            <Clock className="w-3 h-3 inline text-blue-600" />
                            <span>Live Lock Timing: {liveTiming}</span>
                          </span>
                        </>
                      )}
                    </div>
                    {liveAddress && (
                      <div className="text-[11px] text-slate-600 font-medium">
                        📍 {liveAddress}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveLivePin(liveUserCoords)}
                    disabled={savingLocation}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md transition self-start sm:self-auto cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingLocation ? 'Saving...' : '💾 Set as Accurate Issue Pin'}</span>
                  </button>
                </div>
              )}

              {/* Adjusted Pin Banner */}
              {customPinCoords && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-amber-900 flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      <span>New Custom Accurate Pin: {customPinCoords[0].toFixed(5)}°N, {customPinCoords[1].toFixed(5)}°E</span>
                    </div>
                    <div className="text-[11px] text-amber-700 flex flex-wrap items-center gap-x-2">
                      <span>Shifted by {getGroundDistance(customPinCoords[0], customPinCoords[1], mapPos[0], mapPos[1])}m from original spot</span>
                      {liveTiming && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-amber-900 flex items-center space-x-1">
                            <Clock className="w-3 h-3 inline text-amber-700" />
                            <span>Adjust Timing: {liveTiming}</span>
                          </span>
                        </>
                      )}
                    </div>
                    {liveAddress && (
                      <div className="text-[11px] text-amber-800 font-medium">
                        📍 {liveAddress}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setCustomPinCoords(null)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveLivePin(customPinCoords)}
                      disabled={savingLocation}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingLocation ? 'Saving...' : '💾 Save Adjusted Pin'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Leaflet Map with Interactive Accurate Pins & Satellite Imagery */}
              <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                {isPinAdjustMode && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg border border-white/20 flex items-center space-x-1.5 pointer-events-none animate-bounce">
                    <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                    <span>Click anywhere on the map to drop accurate pin</span>
                  </div>
                )}

                {/* Floating Map Layer Selector (Satellite, Hybrid, Street, Terrain) */}
                <div className="absolute top-3 right-3 z-[1000]">
                  <MapLayerSelector currentLayer={mapLayer} onSelectLayer={setMapLayer} />
                </div>

                {/* Floating Live Location Tracking Button directly on Map */}
                <div className="absolute top-3 left-14 z-[1000] flex items-center space-x-1.5 pointer-events-auto">
                  <button
                    type="button"
                    onClick={handleToggleLiveTracking}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg backdrop-blur-md border transition-all cursor-pointer select-none ${
                      isLiveTracking
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-300 ring-2 ring-emerald-400/50 shadow-emerald-500/30 animate-pulse'
                        : 'bg-slate-900/85 hover:bg-slate-900 text-white border-white/20 hover:border-white/40'
                    }`}
                    title="Live Location Track करा (Live GPS)"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${isLiveTracking ? 'text-amber-300 animate-spin' : 'text-sky-400'}`} />
                    <span>{isLiveTracking ? '🟢 Live GPS Active' : '📍 Track My Live Location'}</span>
                  </button>

                  {liveUserCoords && (
                    <button
                      type="button"
                      onClick={() => setMapCenter(liveUserCoords)}
                      className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/85 hover:bg-slate-900 text-white border border-white/20 backdrop-blur-md shadow-md cursor-pointer"
                      title="Maza Live Location Center करा"
                    >
                      <Crosshair className="w-3 h-3 text-sky-400" />
                      <span>Center Me</span>
                    </button>
                  )}
                </div>

                {/* Live Tracking GPS Status Pill on Map */}
                {liveUserCoords && (
                  <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[11px] font-semibold shadow-lg border border-white/20 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                    <span className="text-sky-400 font-bold">Maza Live Location:</span>
                    <span className="font-mono text-slate-100">
                      {liveUserCoords[0].toFixed(5)}°N, {liveUserCoords[1].toFixed(5)}°E
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      ({liveAccuracy && liveAccuracy > 500 ? `Desktop IP ±${Math.round(liveAccuracy/1000)}km` : `±${liveAccuracy || 4}m`})
                    </span>
                  </div>
                )}

                <MapContainer center={mapPos} zoom={16} scrollWheelZoom={false} className="h-full w-full">
                  <TileLayer
                    key={mapLayer}
                    attribution={MAP_LAYERS[mapLayer]?.attribution}
                    url={MAP_LAYERS[mapLayer]?.url}
                    maxZoom={MAP_LAYERS[mapLayer]?.maxZoom || 19}
                    subdomains={MAP_LAYERS[mapLayer]?.subdomains || ['a', 'b', 'c']}
                  />
                  
                  <MapPanController center={mapCenter} />
                  <MapPinClickHandler onPinAdjust={handlePinAdjust} />

                  {/* 1. Problem Incident Pin (Draggable when Adjust Mode is active) */}
                  <Marker
                    position={customPinCoords || mapPos}
                    icon={incidentPinIcon}
                    draggable={isPinAdjustMode}
                    eventHandlers={{
                      dragend: (e) => {
                        const marker = e.target;
                        const pos = marker.getLatLng();
                        handlePinAdjust([pos.lat, pos.lng]);
                      },
                    }}
                  >
                    <Popup>
                      <div className="p-1.5 text-xs space-y-1">
                        <div className="font-bold text-slate-900">{issue.title}</div>
                        <div className="text-slate-600 text-[11px]">{issue.location?.landmark || issue.location?.address}</div>
                        <div className="text-emerald-700 font-mono text-[10px] font-semibold">
                          📍 {(customPinCoords || mapPos)[0].toFixed(5)}°N, {(customPinCoords || mapPos)[1].toFixed(5)}°E
                        </div>
                        <div className="text-blue-700 text-[10px] font-medium flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-blue-500 inline shrink-0" />
                          <span>Recorded: {liveTiming || issue.location?.timing || (issue.updatedAt ? new Date(issue.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }))} (IST)</span>
                        </div>
                        {isPinAdjustMode && (
                          <div className="text-[10px] text-amber-600 font-semibold italic">
                            🎯 Pin is draggable! Drag to any road or building.
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>

                  {/* 2. Accurate Live User Position Pin */}
                  {liveUserCoords && (
                    <>
                      <Marker position={liveUserCoords} icon={liveUserPinIcon}>
                        <Popup>
                          <div className="p-1.5 text-xs space-y-1">
                            <div className="font-bold text-sky-900 flex items-center space-x-1.5">
                              <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></span>
                              <span>🔵 Maza Live Location (You are here)</span>
                            </div>
                            <div className="text-slate-600 text-[11px]">Accuracy: ±{liveAccuracy || 4}m</div>
                            <div className="text-sky-700 font-mono text-[10px] font-bold">
                              📍 {liveUserCoords[0].toFixed(5)}°N, {liveUserCoords[1].toFixed(5)}°E
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSaveLivePin(liveUserCoords)}
                              disabled={savingLocation}
                              className="w-full mt-1.5 py-1 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] shadow-xs cursor-pointer text-center"
                            >
                              {savingLocation ? 'Saving...' : '💾 Set as Issue Location'}
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                      {liveAccuracy && (
                        <Circle
                          center={liveUserCoords}
                          radius={Math.min(liveAccuracy, 200)}
                          pathOptions={{ color: '#0284c7', fillColor: '#38bdf8', fillOpacity: 0.25, weight: 2 }}
                        />
                      )}
                    </>
                  )}

                  {/* 3. Fine-tuned Adjusted Pin */}
                  {customPinCoords && (
                    <Marker position={customPinCoords} icon={adjustedPinIcon}>
                      <Popup>
                        <div className="p-1 text-xs">
                          <div className="font-bold text-emerald-900">🟢 Adjusted Accurate Pin</div>
                          <div className="text-emerald-700 font-mono text-[10px] mt-1 font-semibold">
                            {customPinCoords[0].toFixed(5)}°N, {customPinCoords[1].toFixed(5)}°E
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>
          </div>

          {/* Before & After Photo Comparison & Proof of Resolution */}
          {(issue.completionDetails?.images?.length > 0 || issue.completionDetails?.completedAt) && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-emerald-500/30 shadow-soft space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('issueDetails.resolutionProofBadge')}</span>
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {t('issueDetails.resolutionProofTitle')}
                  </h2>
                </div>
                {issue.adminVerification?.forwardedToCitizen ? (
                  <div className="text-left sm:text-right">
                    <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-xs">
                      <span>{t('issueDetails.verifiedByAdmin')}</span>
                    </span>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {t('issueDetails.forwardedOn', { date: new Date(issue.adminVerification.verifiedAt).toLocaleDateString() })}
                    </div>
                  </div>
                ) : (
                  <div className="text-left sm:text-right">
                    <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                      <Clock className="w-3 h-3 text-amber-700" />
                      <span>{t('issueDetails.awaitingAdmin')}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Side-by-side Before vs After photos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BEFORE */}
                <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                      <span>{t('issueDetails.beforeTitle')}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{t('issueDetails.byCitizen')}</span>
                  </div>
                  <div className="h-64 rounded-xl overflow-hidden bg-slate-200 border border-rose-100">
                    <img
                      src={issue.images?.[0]?.url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600'}
                      alt="Before Repair"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-slate-600">
                    {t('common.reportedBy', { name: issue.createdBy?.name || t('common.citizen') })} • {new Date(issue.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* AFTER */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      <span>{t('issueDetails.afterTitle')}</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono">{t('issueDetails.byFieldLead')}</span>
                  </div>
                  <div className="h-64 rounded-xl overflow-hidden bg-slate-200 border border-emerald-100">
                    <img
                      src={issue.completionDetails?.images?.[0]?.url || 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600'}
                      alt="After Repair"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-slate-900">{t('issueDetails.workerNotes')} </span>
                    <span>{translateData(issue.completionDetails?.notes || 'Repairs completed to standard.', i18n.language)}</span>
                  </div>
                </div>
              </div>

              {/* Admin Verification remarks if any */}
              {issue.adminVerification?.notes && (
                <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-900">
                  <span className="font-bold">{t('issueDetails.adminRemarks')} </span>
                  <span>{translateData(issue.adminVerification.notes, i18n.language)}</span>
                </div>
              )}
            </div>
          )}

          {/* Citizen Feedback & Satisfaction Form */}
          {['ACTION COMPLETED', 'VERIFIED RESOLVED', 'REOPENED'].includes(issue.status) && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-soft space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>{t('issueDetails.feedbackTitle')}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('issueDetails.feedbackSubtitle')}
                  </p>
                </div>
                {issue.citizenFeedback?.submittedAt && !isEditingFeedback && (role === 'citizen' || (!['admin', 'worker'].includes(role) && user)) && (
                  <button
                    type="button"
                    onClick={() => setIsEditingFeedback(true)}
                    className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    ✏️ {i18n.language === 'mr' ? 'अभिप्राय संपादित करा' : i18n.language === 'hi' ? 'प्रतिक्रिया संपादित करें' : 'Edit / Re-submit'}
                  </button>
                )}
              </div>

              {feedbackSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  ✓ {t('issueDetails.feedbackSuccess')}
                </div>
              )}

              {/* Case 1: Feedback HAS been submitted by citizen -> Visible to Admin, Worker, and Citizen */}
              {issue.citizenFeedback?.submittedAt && !isEditingFeedback ? (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= (issue.citizenFeedback.rating || 5)
                                ? 'text-amber-500 fill-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-extrabold text-slate-900">
                        {issue.citizenFeedback.rating}/5 Stars
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        issue.citizenFeedback.satisfied
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {issue.citizenFeedback.satisfied ? t('issueDetails.satisfiedBadge') : t('issueDetails.unsatisfiedBadge')}
                    </span>
                  </div>

                  {issue.citizenFeedback.comment && (
                    <p className="text-xs text-slate-700 italic bg-white/70 p-3 rounded-xl border border-emerald-100">
                      "{issue.citizenFeedback.comment}"
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-emerald-200/60">
                    <span>
                      {t('issueDetails.feedbackRecorded', { date: new Date(issue.citizenFeedback.submittedAt).toLocaleDateString() })}
                    </span>
                    {role === 'admin' ? (
                      <span className="inline-flex items-center space-x-1.5 font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300 shadow-2xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Panchayat Admin Checked & Verified</span>
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">
                        ✓ Recorded in Village Digital Memory
                      </span>
                    )}
                  </div>
                </div>
              ) : (role === 'citizen' || (!['admin', 'worker'].includes(role) && user)) ? (
                /* Case 2: Citizen viewing unsubmitted form -> Citizen fills and submits */
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      {t('issueDetails.howSatisfied')}
                    </label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 focus:outline-none transition transform hover:scale-125"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              star <= (hoverRating || feedbackRating)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-600 ml-2">
                        {feedbackRating === 5
                          ? t('issueDetails.ratingExcellent')
                          : feedbackRating === 4
                          ? t('issueDetails.ratingVeryGood')
                          : feedbackRating === 3
                          ? t('issueDetails.ratingGood')
                          : feedbackRating === 2
                          ? t('issueDetails.ratingFair')
                          : t('issueDetails.ratingPoor')}
                      </span>
                    </div>
                  </div>

                  {/* Thumbs up / down satisfaction */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      {t('issueDetails.isProblemSolved')}
                    </label>
                    <div className="grid grid-cols-2 gap-3 max-w-md">
                      <button
                        type="button"
                        onClick={() => setFeedbackSatisfied(true)}
                        className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                          feedbackSatisfied
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${feedbackSatisfied ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{t('issueDetails.yesProblemSolved')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFeedbackSatisfied(false)}
                        className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                          !feedbackSatisfied
                            ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <ThumbsDown className={`w-4 h-4 ${!feedbackSatisfied ? 'text-rose-600' : 'text-slate-400'}`} />
                        <span>{t('issueDetails.noIssuePersists')}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('issueDetails.citizenRemarks')}
                    </label>
                    <textarea
                      rows={2}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder={t('issueDetails.citizenRemarksPlaceholder')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    ></textarea>
                  </div>

                  {!feedbackSatisfied && (
                    <div className="flex items-center space-x-2 text-xs text-rose-700">
                      <input
                        type="checkbox"
                        id="reopenCheck"
                        checked={reopenRequested}
                        onChange={(e) => setReopenRequested(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <label htmlFor="reopenCheck" className="font-semibold cursor-pointer">
                        {t('issueDetails.reopenRequest')}
                      </label>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="px-6 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                  >
                    {submittingFeedback ? t('issueDetails.submittingFeedback') : t('issueDetails.submitFeedback')}
                  </button>
                </form>
              ) : (
                /* Case 3: Admin or Worker viewing before citizen has submitted -> Do NOT show input form! Show waiting notice */
                <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-950">
                      {role === 'admin'
                        ? 'Panchayat Admin Review — Awaiting Citizen Ground Feedback'
                        : 'Field Operations — Awaiting Citizen Ground Feedback'}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Repair work is marked completed. The feedback rating form is active for the citizen to inspect on-site and confirm resolution. Once submitted, the citizen's satisfaction rating and ground remarks will appear here for Admin review and audit.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Complete Lifecycle Audit Trail (History) */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-soft space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>{t('issueDetails.auditTrailTitle', { count: history.length })}</span>
              </h2>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                Full Lifecycle History
              </span>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {history.map((event) => {
                const isCompleted = event.eventType === 'ACTION_COMPLETED';
                const isVerified = event.eventType === 'RESOLUTION_VERIFIED';
                const isFeedback = event.eventType === 'CITIZEN_FEEDBACK';
                const isAssigned = event.eventType === 'WORKER_ASSIGNED';
                const isReopened = event.eventType === 'REOPENED';
                const isValidation = event.eventType === 'COMMUNITY_VALIDATED';
                const isEvidence = event.eventType === 'EVIDENCE_ADDED';

                const dotBg = isVerified || isCompleted
                  ? 'bg-emerald-600'
                  : isFeedback
                  ? 'bg-amber-500'
                  : isReopened
                  ? 'bg-rose-600'
                  : isAssigned
                  ? 'bg-indigo-600'
                  : isValidation
                  ? 'bg-purple-600'
                  : 'bg-teal-600';

                return (
                  <div key={event._id} className="relative group p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-sm transition space-y-2">
                    <div className={`absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full ${dotBg} border-2 border-white shadow-xs`}></div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-slate-900 flex items-center space-x-1.5">
                          {isCompleted && <span>📸</span>}
                          {isVerified && <span>✅</span>}
                          {isFeedback && <span>⭐</span>}
                          {isAssigned && <span>👷</span>}
                          {isReopened && <span>⚠️</span>}
                          {isValidation && <span>👥</span>}
                          {isEvidence && <span>📷</span>}
                          <span>{translateAuditType(event.eventType, i18n.language)}</span>
                        </span>

                        {event.previousState && event.newState && event.previousState !== event.newState && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-700 font-mono border border-slate-200">
                            {event.previousState} ➔ {event.newState}
                          </span>
                        )}
                      </div>

                      <span className="text-slate-400 font-mono text-[11px]">
                        {formatShortTime(event.timestamp || event.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {translateData(event.comment, i18n.language)}
                    </p>

                    {/* Rich Metadata Display: Evidence Photos */}
                    {event.metadata?.images && event.metadata.images.length > 0 && (
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        {event.metadata.images.map((imgUrl, idx) => (
                          <a key={idx} href={imgUrl} target="_blank" rel="noreferrer" className="block w-16 h-16 rounded-xl overflow-hidden border border-emerald-300 shadow-2xs hover:scale-105 transition">
                            <img src={imgUrl} alt="History Evidence" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Rich Metadata Display: Star Rating */}
                    {isFeedback && (
                      <div className="pt-1 flex items-center space-x-2">
                        <div className="flex items-center text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= (event.metadata?.rating || issue.citizenFeedback?.rating || 5)
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-extrabold text-slate-800">
                          {(event.metadata?.rating || issue.citizenFeedback?.rating || 5)}/5 Stars
                        </span>
                        {(event.metadata?.satisfied ?? issue.citizenFeedback?.satisfied) && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                            ✓ Satisfied (Problem Solved)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Rich Metadata Display: Community Validation response */}
                    {isValidation && event.metadata?.response && (
                      <div className="pt-0.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          event.metadata.response === 'CONFIRM'
                            ? 'bg-teal-50 border-teal-300 text-teal-800'
                            : event.metadata.response === 'RESOLVED'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-rose-50 border-rose-300 text-rose-800'
                        }`}>
                          Response: {event.metadata.response}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {t('issueDetails.loggedBy', { name: event.userName, role: event.userRole })}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-[9px] uppercase ${
                        event.userRole === 'admin'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : event.userRole === 'worker'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {event.userRole === 'admin' ? '🏛️ Admin' : event.userRole === 'worker' ? '👷 Worker' : '👤 Citizen'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Intelligence Metrics, Community Validation, Admin & Worker Controls */}
        <div className="space-y-6">
          {/* Intelligence Metrics Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft space-y-5">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{t('issueDetails.intelligenceTitle')}</span>
            </div>

            {/* Evidence Reliability */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-600">{t('issueDetails.evidenceReliability')}</span>
                <span className="font-bold text-teal-700">
                  {issue.reliabilityScore}% ({translateReliability(issue.reliabilityLevel, i18n.language)})
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-teal-600 h-2 rounded-full"
                  style={{ width: `${issue.reliabilityScore}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                {t('issueDetails.pathLabel')} <span className="font-semibold text-slate-700">{translateData(issue.adaptiveVerificationPath, i18n.language)}</span>. {translateData(issue.reliabilityFactors?.summary, i18n.language)}
              </p>
            </div>

            {/* Dynamic Priority */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-600">{t('issueDetails.dynamicPriority')}</span>
                <span className="font-bold text-rose-700">
                  {issue.priority?.score}% ({translatePriority(issue.priority?.level, i18n.language)})
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rose-600 h-2 rounded-full"
                  style={{ width: `${issue.priority?.score || 50}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                {t('issueDetails.factorsLabel')} {translateData(issue.priority?.factors?.explanation || 'Multi-factor weighted calculation', i18n.language)}
              </p>
            </div>

            {/* Recurrence Risk */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-600">{t('issueDetails.recurrenceRisk')}</span>
                <span className="font-bold text-indigo-700">
                  {issue.recurrenceRisk}% ({translatePriority(issue.recurrenceLevel, i18n.language)})
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${issue.recurrenceRisk || 20}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                {translateData(issue.recurrenceFactors?.summary || 'Cluster recurrence evaluation', i18n.language)}
              </p>
            </div>

            {/* Probable Root Causes */}
            {issue.rootCauses && issue.rootCauses.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {t('issueDetails.probableRootCauses')}
                </div>
                <div className="space-y-2">
                  {issue.rootCauses.slice(0, 2).map((cause, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>{translateData(cause.cause, i18n.language)}</span>
                        <span className="text-violet-700 font-mono">{cause.confidence}%</span>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Community Validation Card — Role-Aware Workflow */}
          {(() => {
            const confirmsCount = issue.communityValidationStats?.confirms || 0;
            const stillExistsCount = issue.communityValidationStats?.stillExists || 0;
            const resolvedCount = issue.communityValidationStats?.resolved || 0;
            const totalValidations = confirmsCount + stillExistsCount + resolvedCount;

            const validationHistoryEvents = (history || [])
              .filter((h) => h.eventType === 'COMMUNITY_VALIDATED')
              .map((h) => ({
                _id: h._id,
                userName: h.userName || 'Community Citizen',
                response: h.metadata?.response || 'CONFIRM',
                comment: h.metadata?.comment || (h.comment?.includes('Note: "') ? h.comment.split('Note: "')[1]?.replace(/"$/, '') : ''),
                timestamp: h.timestamp || h.createdAt,
              }));

            const allValidations = [...validations, ...validationHistoryEvents.filter((vh) => !validations.some((v) => v._id === vh._id))];

            if (role === 'admin') {
              // ADMIN VIEW: Input form is NOT shown. Shows awaiting status if empty, or full submitted citizen report once sent.
              if (totalValidations === 0 && allValidations.length === 0) {
                return (
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft space-y-3">
                    <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
                        <Users className="w-4 h-4 text-emerald-700" />
                        <span>{t('issueDetails.communityValidation')}</span>
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Admin Review
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-slate-800">Awaiting Citizen Community Validation</div>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                        Citizens have not submitted ground corroboration or validation votes yet. Once citizens submit their feedback, their votes and observations will be displayed here for administrative review.
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="bg-white p-6 rounded-3xl border border-emerald-500/30 shadow-soft space-y-4">
                  <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center space-x-1.5">
                      <Users className="w-4 h-4 text-emerald-700" />
                      <span>Citizen Community Validation Report</span>
                    </h3>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {totalValidations || allValidations.length} Citizen Response{(totalValidations || allValidations.length) > 1 ? 's' : ''} Received
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    Ground validation and corroboration responses submitted by verified local citizens:
                  </p>

                  {/* Validation Stats Breakdown */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-2xl bg-teal-50/80 border border-teal-200 shadow-xs">
                      <div className="text-base font-extrabold text-teal-800">{confirmsCount}</div>
                      <div className="text-[10px] font-bold text-teal-700">👍 Confirmed</div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-rose-50/80 border border-rose-200 shadow-xs">
                      <div className="text-base font-extrabold text-rose-800">{stillExistsCount}</div>
                      <div className="text-[10px] font-bold text-rose-700">❌ Still Exists</div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-xs">
                      <div className="text-base font-extrabold text-emerald-800">{resolvedCount}</div>
                      <div className="text-[10px] font-bold text-emerald-700">🟢 Resolved</div>
                    </div>
                  </div>

                  {/* List of Citizen Submissions */}
                  {allValidations.length > 0 ? (
                    <div className="space-y-2 pt-1 max-h-56 overflow-y-auto">
                      {allValidations.map((val, idx) => (
                        <div key={val._id || idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{val.userName || 'Verified Resident'}</span>
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              val.response === 'CONFIRM' ? 'bg-teal-100 text-teal-800' :
                              val.response === 'STILL_EXISTS' ? 'bg-rose-100 text-rose-800' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>
                              {val.response === 'CONFIRM' ? '✓ Confirmed Problem' :
                               val.response === 'STILL_EXISTS' ? '⚠️ Problem Still Exists' : '✓ Confirmed Resolved'}
                            </span>
                          </div>
                          {val.comment && (
                            <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-xl border border-slate-100">
                              "{val.comment}"
                            </p>
                          )}
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(val.timestamp || val.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                      ✓ Recorded {confirmsCount} community corroboration vote{confirmsCount > 1 ? 's' : ''} in village registry.
                    </div>
                  )}
                </div>
              );
            }

            // CITIZEN VIEW: Interactive voting form
            return (
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                  <span>{t('issueDetails.communityValidation')}</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    {t('issueDetails.confirmsCount', { count: confirmsCount })}
                  </span>
                </h3>

                <p className="text-xs text-slate-600">
                  {t('issueDetails.communitySubtitle')}
                </p>

                {hasVotedSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>✓ Your community validation has been recorded and submitted to Panchayat Admin!</span>
                  </div>
                )}

                <textarea
                  rows={2}
                  value={voteComment}
                  onChange={(e) => setVoteComment(e.target.value)}
                  placeholder={t('issueDetails.voteCommentPlaceholder')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                ></textarea>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={voting}
                    onClick={() => handleVote('CONFIRM')}
                    className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition flex flex-col items-center justify-center space-y-1 cursor-pointer disabled:opacity-60"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-teal-600" />
                    <span>{t('issueDetails.btnConfirm')}</span>
                  </button>

                  <button
                    type="button"
                    disabled={voting}
                    onClick={() => handleVote('STILL_EXISTS')}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition flex flex-col items-center justify-center space-y-1 cursor-pointer disabled:opacity-60"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{t('issueDetails.btnStillExists')}</span>
                  </button>

                  <button
                    type="button"
                    disabled={voting}
                    onClick={() => handleVote('RESOLVED')}
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex flex-col items-center justify-center space-y-1 cursor-pointer disabled:opacity-60"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('issueDetails.btnResolved')}</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Admin Control Panel (if role === 'admin') */}
          {role === 'admin' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-slate-100 pb-2">
                🏛️ Admin Control & Verification
              </h3>

              {/* Verify & Forward Worker Proof to Citizen */}
              {['ACTION COMPLETED', 'MONITORING'].includes(issue.status) && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-3 shadow-xs">
                  <div className="flex items-center space-x-2 text-amber-950 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Worker Uploaded Proof — Review & Verify</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-snug">
                    Field worker completed work and submitted resolution proof. Inspect the photo evidence below and approve to publish directly to the citizen.
                  </p>

                  {/* Worker Resolution Proof Preview */}
                  {issue.completionDetails?.images?.[0]?.url && (
                    <div className="rounded-xl overflow-hidden border border-amber-300 h-36 bg-slate-100">
                      <img
                        src={issue.completionDetails.images[0].url}
                        alt="Worker Proof"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {issue.completionDetails?.notes && (
                    <div className="text-[11px] text-slate-800 bg-white p-2.5 rounded-xl border border-amber-200 space-y-0.5">
                      <span className="font-bold text-slate-900">Worker Repair Notes:</span>
                      <p className="italic text-slate-700">"{issue.completionDetails.notes}"</p>
                    </div>
                  )}

                  <input
                    type="text"
                    value={adminVerifyNotes}
                    onChange={(e) => setAdminVerifyNotes(e.target.value)}
                    placeholder="Admin verification note (e.g. Inspected on-site and approved)..."
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />

                  <button
                    type="button"
                    onClick={handleAdminVerify}
                    disabled={verifying}
                    className="w-full py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{verifying ? 'Verifying...' : '✓ Verify Resolution & Forward to Citizen'}</span>
                  </button>
                </div>
              )}

              {issue.status === 'VERIFIED RESOLVED' && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>✓ Resolution Verified & Published to Citizen</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Admin verified worker resolution photo on {issue.adminVerification?.verifiedAt ? new Date(issue.adminVerification.verifiedAt).toLocaleDateString() : 'recent'}. Forwarded to citizen for feedback.
                  </p>
                </div>
              )}

              {/* Assign Worker with AI Category Auto-Detection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Assign Field Worker</label>
                  {aiWorkerMatch && (
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>AI Auto-Match Ready</span>
                    </span>
                  )}
                </div>

                {/* AI Auto-Matched Specialist Banner */}
                {aiWorkerMatch && !issue.assignedWorker && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-xs font-black text-emerald-950">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
                        <span>AI Auto-Detected Specialist:</span>
                        <span className="text-emerald-800 underline decoration-emerald-400 font-extrabold">
                          {aiWorkerMatch.worker.name}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] shadow-2xs">
                        {aiWorkerMatch.confidence}% Match
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-900 leading-snug">
                      Detected category <strong className="font-bold text-emerald-950">"{issue.category}"</strong> automatically matched specialist <strong className="font-bold text-emerald-950">{aiWorkerMatch.worker.name}</strong> ({aiWorkerMatch.worker.specialization}).
                    </p>
                    <div className="text-[10px] text-emerald-700 italic">
                      💡 {aiWorkerMatch.reason}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedWorker || issue.assignedWorker?._id || ''}
                    onChange={(e) => setSelectedWorker(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">Select worker...</option>
                    {workers.map((w) => {
                      const isAiMatch = aiWorkerMatch?.worker?._id === w._id;
                      return (
                        <option key={w._id} value={w._id}>
                          {w.name} ({w.specialization}) {isAiMatch ? '⭐ [AI Recommended Specialist]' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    onClick={handleAssignWorker}
                    disabled={!selectedWorker && !issue.assignedWorker?._id}
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5 shrink-0 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Assign Worker</span>
                  </button>
                </div>
              </div>

              {/* Status Override */}
              <form onSubmit={handleStatusChange} className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-700">Transition Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="NEW">NEW</option>
                  <option value="VALIDATED">VALIDATED</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="UNDER ACTION">UNDER ACTION</option>
                  <option value="ACTION COMPLETED">ACTION COMPLETED</option>
                  <option value="MONITORING">MONITORING</option>
                  <option value="VERIFIED RESOLVED">VERIFIED RESOLVED</option>
                  <option value="REOPENED">REOPENED</option>
                </select>

                <input
                  type="text"
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  placeholder="Reason / Gram Panchayat audit note..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />

                <button
                  type="submit"
                  disabled={statusUpdating}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition"
                >
                  Update Status & Audit Log
                </button>
              </form>
            </div>
          )}

          {/* Worker Workflow Panel (if role === 'worker' or role === 'admin') */}
          {(role === 'worker' || role === 'admin') && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center space-x-1.5">
                  <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                  <span>👷 Worker Execution Panel</span>
                </h3>
                {role === 'admin' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200">
                    Supervisor Mode
                  </span>
                )}
              </div>

              {issue.status === 'ASSIGNED' && (
                <button
                  onClick={() => handleAddProgress(true)}
                  className="w-full py-3 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition"
                >
                  Start Work On-Site (Sets Status to UNDER ACTION)
                </button>
              )}

              {/* Add Progress Note */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Add Progress Update</label>
                <textarea
                  rows={2}
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  placeholder="Material arrived, excavation started..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                ></textarea>
                <button
                  type="button"
                  onClick={() => handleAddProgress(false)}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                >
                  Post Progress Update
                </button>
              </div>

              {/* Upload Completion Proof */}
              <form onSubmit={handleCompleteWork} className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    📸 {i18n.language === 'mr' ? 'समस्या निवारण पुरावा फोटो अपलोड करा' : i18n.language === 'hi' ? 'समस्या समाधान फोटो प्रमाण अपलोड करें' : 'Upload Problem Solved Proof Image'}
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                    Proof of Resolution
                  </span>
                </div>

                {/* Local file input */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {i18n.language === 'mr' ? 'कॅमेरा / डिव्हाइसवरून फोटो अपलोड करा:' : i18n.language === 'hi' ? 'कैमरा / डिवाइस से फोटो अपलोड करें:' : 'Upload file from camera / device:'}
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setCompletionFiles(files);
                      if (files[0]) {
                        setSamplePreviewUrl(URL.createObjectURL(files[0]));
                      } else {
                        setSamplePreviewUrl('');
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>

                {/* Live Preview of Attached File */}
                {samplePreviewUrl && completionFiles.length > 0 && (
                  <div className="relative rounded-2xl overflow-hidden border border-emerald-300 h-40 bg-slate-100 shadow-xs">
                    <img src={samplePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs p-1.5 text-[11px] text-white font-medium text-center">
                      ✓ Selected Photo: {completionFiles[0]?.name}
                    </div>
                  </div>
                )}

                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder={i18n.language === 'mr' ? 'दुरुस्तीचे काम पूर्ण झाले... (उदा. पाईप बदलला, गळती पूर्ण बंद केली)' : i18n.language === 'hi' ? 'मरम्मत कार्य पूरा हुआ... (उदा. पाइप बदला, रिसाव बंद किया)' : 'Work completed description (e.g. Pipe replaced and joint sealed)...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                ></textarea>

                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-md transition flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>
                    {i18n.language === 'mr' ? 'समस्या निवारण पुरावा सादर करा' : i18n.language === 'hi' ? 'समाधान प्रमाण प्रस्तुत करें' : 'Submit Problem Solved Proof Image'}
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
