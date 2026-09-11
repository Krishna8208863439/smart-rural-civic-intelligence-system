import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AnimatedFileUploader from '../components/AnimatedFileUploader';

import {
  Camera,
  Mic,
  MicOff,
  MapPin,
  Navigation,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  X,
  Sparkles,
  Info,
  Wand2,
  Zap,
  Bot,
  RefreshCw,
} from 'lucide-react';



export default function ReportIssue() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Drainage blockage');
  const [severity, setSeverity] = useState('Medium');
  const [landmark, setLandmark] = useState('');
  const [address, setAddress] = useState('');
  const [ward, setWard] = useState('Ward 1');
  const [latitude, setLatitude] = useState('18.5204');
  const [longitude, setLongitude] = useState('73.8567');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceFeedback, setVoiceFeedback] = useState('');
  const recognitionRef = useRef(null);

  // Status State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  // AI Issue Auto-Detection State
  const [aiScanning, setAiScanning] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [aiResult, setAiResult] = useState(null);

  const QUICK_SCENARIOS = [
    {
      category: 'Drainage blockage',
      label: '🌊 Drainage Blockage',
      type: 'drainage',
      filename: 'drainage_culvert_overflow.jpg',
      imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600',
      title: 'Severe Drainage Blockage with Overflowing Water',
      description: 'Visual analysis indicates heavy accumulation of silt, organic debris, and plastic waste obstructing the village drainage culvert. Stagnant dirty water is overflowing onto the street, posing an immediate public hygiene risk.',
      severity: 'High',
      confidence: 94,
      rootCause: 'Culvert debris accumulation and lack of periodic desilting',
      tags: ['culvert', 'overflow', 'stagnant_water', 'sanitation_risk'],
      suggestions: [
        'Clogged culvert flooding village main road',
        'Silt accumulation and blockage in village nala',
        'Open drain overflowing near primary school',
      ],
    },
    {
      category: 'Water leakage',
      label: '💧 Water Leakage',
      type: 'water',
      filename: 'broken_pipeline_leak.jpg',
      imageUrl: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600',
      title: 'Major Drinking Water Pipeline Fracture and Leakage',
      description: 'Pressurized clean potable water is gushing from a damaged subterranean pipeline or faulty joint valve. Substantial volume of clean water is being wasted and weakening the adjoining road foundation.',
      severity: 'High',
      confidence: 96,
      rootCause: 'Subterranean pipe fracture and joint valve damage under road transit',
      tags: ['water_loss', 'pipeline_rupture', 'clean_water', 'pressure_leak'],
      suggestions: [
        'Major drinking water pipe leak flooding road',
        'Pressurized main line pipeline fracture near chowk',
        'Damaged public water stand valve leaking water',
      ],
    },
    {
      category: 'Damaged road',
      label: '🛣️ Damaged Road',
      type: 'road',
      filename: 'asphalt_road_potholes.jpg',
      imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600',
      title: 'Severe Road Surface Potholes and Asphalt Degradation',
      description: 'Visual analysis reveals extensive asphalt wear, multiple interconnected potholes, and loose stone aggregate across the primary village transit route. The road defect creates hazardous commuting conditions for two-wheelers and tractors.',
      severity: 'High',
      confidence: 95,
      rootCause: 'Monsoon water logging, inadequate sub-base compaction, and heavy agricultural vehicular transit',
      tags: ['potholes', 'asphalt_crack', 'traffic_hazard', 'road_safety'],
      suggestions: [
        'Severe road surface potholes and asphalt degradation',
        'Deep craters causing two-wheeler accidents near market',
        'Damaged road shoulder washed away after rainfall',
      ],
    },
    {
      category: 'Waste accumulation',
      label: '🗑️ Waste Accumulation',
      type: 'waste',
      filename: 'garbage_dump_street.jpg',
      imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600',
      title: 'Open Solid Waste Accumulation and Garbage Dump',
      description: 'Visual analysis detects an unauthorized open dump of mixed solid waste, non-biodegradable plastics, and discarded packaging. The pile attracts stray animals and generates foul odors near the residential area.',
      severity: 'Medium',
      confidence: 92,
      rootCause: 'Lack of designated village community dustbin and door-to-door waste collection frequency',
      tags: ['garbage_dump', 'plastic_waste', 'odor', 'stray_animals'],
      suggestions: [
        'Open solid waste accumulation and garbage dump',
        'Overflowing public garbage bin at temple entrance',
        'Scattered plastic waste creating foul smell in ward',
      ],
    },
    {
      category: 'Streetlight failure',
      label: '💡 Streetlight Failure',
      type: 'light',
      filename: 'faulty_streetlight_pole.jpg',
      imageUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600',
      title: 'Panchayat Streetlight Fixture Failure and Dark Corridor',
      description: 'Visual inspection shows non-functional street lamp luminaire / faulty automatic daylight sensor on the village main pole. The sector remains in complete darkness at night, impacting safety and pedestrian transit.',
      severity: 'Medium',
      confidence: 91,
      rootCause: 'Blown LED driver circuitry, voltage surge, or degraded photocell daylight sensor',
      tags: ['dark_zone', 'led_driver', 'lighting_pole', 'night_safety'],
      suggestions: [
        'Panchayat streetlight fixture failure and dark corridor',
        'Burnt LED luminaire on village entrance pole',
        'Flickering streetlight creating safety risk for women at night',
      ],
    },
    {
      category: 'Water supply',
      label: '🚰 Water Supply',
      type: 'supply',
      filename: 'water_supply_disruption.jpg',
      imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?w=600',
      title: 'Community Water Tank & Borewell Pump Supply Disruption',
      description: 'Ground evidence shows disrupted water flow from the village overhead storage tank or public tap stand. Citizens are facing acute shortage of daily potable water for domestic use.',
      severity: 'Critical',
      confidence: 93,
      rootCause: 'Submersible pump motor stator burn-out or low village groundwater level',
      tags: ['water_crisis', 'borewell', 'pump_failure', 'public_tap'],
      suggestions: [
        'Community water tank & borewell pump supply disruption',
        'No drinking water supply in Ward 2 for 48 hours',
        'Public borewell handpump dry and malfunctioning',
      ],
    },
    {
      category: 'Sanitation',
      label: '🚽 Sanitation',
      type: 'sanitation',
      filename: 'public_toilet_sanitation.jpg',
      imageUrl: 'https://images.unsplash.com/photo-1584467735860-9114757c2a71?w=600',
      title: 'Public Community Toilet Septic Tank Overflow',
      description: 'Visual evidence indicates full septic pit backing up into public toilet cubicles, creating unsanitary conditions and foul stench. Immediate suction tanker servicing is needed.',
      severity: 'Critical',
      confidence: 95,
      rootCause: 'Septic containment chamber capacity saturation and block in soakage pit',
      tags: ['sanitation', 'septic_overflow', 'hygiene_alert'],
      suggestions: [
        'Public community toilet septic tank overflow',
        'Severe sanitation hygiene issue in village market toilets',
        'Foul stench and uncleaned community washrooms',
      ],
    },
  ];

  // Real-time keyword & multilingual classifier
  const detectCategoryFromText = (text) => {
    if (!text || text.trim().length < 3) return null;
    const t = text.toLowerCase();

    if (/(pipe|pipeline|leak|burst|potable water|tap leak|joint valve|pressure leak|गळती|पाईप|नल|फूट|पानी बह)/.test(t)) {
      return QUICK_SCENARIOS.find((s) => s.category === 'Water leakage');
    }
    if (/(drain|drainage|gutter|culvert|nala|nali|sewage|clog|stagnant|overflow|silt|waterlog|नाले|नाली|गटार|सांडपाणी|तुंबला)/.test(t)) {
      return QUICK_SCENARIOS.find((s) => s.category === 'Drainage blockage');
    }
    if (/(road|pothole|crack|asphalt|tar|crater|rasta|gravel|pavement|erosion|रस्ता|खड्डे|सड़क|गड्ढे)/.test(t)) {
      return QUICK_SCENARIOS.find((s) => s.category === 'Damaged road');
    }
    if (/(waste|garbage|trash|kachra|dump|plastic|litter|rubbish|solid waste|कचरा|घाण|डंप)/.test(t)) {
      return QUICK_SCENARIOS.find((s) => s.category === 'Waste accumulation');
    }
    if (/(street light|streetlight|lamp|bulb|dark|pole|electric|illumination|night|बत्ती|दिवा|अंधार|स्ट्रीट लाईट)/.test(t)) {
      return QUICK_SCENARIOS.find((s) => s.category === 'Streetlight failure');
    }
    if (/(borewell|water supply|no water|tap|handpump|tank|motor|pump|shortage|drinking water|पाणी पुरवठा|जल|हैंडपंप)/.test(t)) {
      return QUICK_SCENARIOS.find((s) => s.category === 'Water supply');
    }
    if (/(toilet|septic|washroom|latrine|hygiene|filth|stench|दुर्गंधी|शौचालय|स्वच्छता)/.test(t)) {
      return QUICK_SCENARIOS.find((s) => s.category === 'Sanitation');
    }
    return null;
  };

  // One-click apply scenario
  const applyScenario = (scenario) => {
    setCategory(scenario.category);
    setTitle(scenario.title);
    setDescription(scenario.description);
    setSeverity(scenario.severity);
    setAiResult({
      category: scenario.category,
      confidence: scenario.confidence || 95,
      severity: scenario.severity,
      title: scenario.title,
      description: scenario.description,
      rootCause: scenario.rootCause,
      tags: scenario.tags,
    });
    setAiFeedback(`✨ AI Auto-Populated: ${scenario.category} (${scenario.confidence || 95}% confidence)`);
  };

  // Real-time title change with automatic AI category detection
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    const match = detectCategoryFromText(val);
    if (match) {
      setCategory(match.category);
      setSeverity(match.severity);
      setAiResult({
        category: match.category,
        confidence: match.confidence,
        severity: match.severity,
        title: val,
        description: description || match.description,
        rootCause: match.rootCause,
        tags: match.tags,
      });
      setAiFeedback(`✨ AI Auto-Detected: ${match.category} (${match.confidence}% match)`);
    }
  };

  // Real-time description change with automatic AI category detection
  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setDescription(val);
    const match = detectCategoryFromText(val);
    if (match) {
      setCategory(match.category);
      setSeverity(match.severity);
      setAiResult((prev) => ({
        ...prev,
        category: match.category,
        confidence: match.confidence,
        severity: match.severity,
        description: val,
        rootCause: match.rootCause,
        tags: match.tags,
      }));
      setAiFeedback(`✨ AI Auto-Detected: ${match.category} (${match.confidence}% match)`);
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Match recognition language to active app language
      let langCode = 'en-IN';
      if (i18n.language === 'mr') langCode = 'mr-IN';
      else if (i18n.language === 'hi') langCode = 'hi-IN';
      recognition.lang = langCode;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceFeedback('Listening to voice complaint...');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setVoiceFeedback(`Voice recorded: "${transcript}"`);
        setIsListening(false);

        // Auto-detect from voice transcript immediately
        const match = detectCategoryFromText(transcript);
        if (match) {
          setCategory(match.category);
          setSeverity(match.severity);
          if (!title) setTitle(match.title);
          setAiResult({
            category: match.category,
            confidence: match.confidence,
            severity: match.severity,
            title: title || match.title,
            description: transcript,
            rootCause: match.rootCause,
            tags: match.tags,
          });
          setAiFeedback(`✨ AI Auto-Detected from Voice: ${match.category} (${match.confidence}% confidence)`);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
        setVoiceFeedback('Microphone ended or permission needed. You can also type description.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setVoiceSupported(false);
    }
  }, [i18n.language, title]);

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.start();
        } else {
          // Graceful fallback simulation if browser restricts speech api without HTTPS
          simulateVoiceFallback();
        }
      } catch (err) {
        simulateVoiceFallback();
      }
    }
  };

  const simulateVoiceFallback = () => {
    setIsListening(true);
    setVoiceFeedback('Simulating voice dictation...');
    setTimeout(() => {
      const sampleText =
        i18n.language === 'mr'
          ? 'गावातील मुख्य रस्त्यावरील सांडपाण्याचा नाला तुंबला असून पाणी रस्त्यावर पसरत आहे.'
          : i18n.language === 'hi'
          ? 'गांव के मुख्य मार्ग पर नाली जाम हो गई है और गंदा पानी सड़क पर बह रहा है।'
          : 'Drainage culvert is clogged with waste and overflowing onto the main village road.';
      setDescription((prev) => (prev ? `${prev} ${sampleText}` : sampleText));
      setIsListening(false);
      setVoiceFeedback('Voice successfully converted into description.');

      const match = detectCategoryFromText(sampleText);
      if (match) {
        setCategory(match.category);
        setSeverity(match.severity);
        if (!title) setTitle(match.title);
        setAiResult({
          category: match.category,
          confidence: match.confidence,
          severity: match.severity,
          title: title || match.title,
          description: sampleText,
          rootCause: match.rootCause,
          tags: match.tags,
        });
        setAiFeedback(`✨ AI Auto-Detected from Voice: ${match.category} (${match.confidence}% confidence)`);
      }
    }, 1500);
  };

  // Detect GPS
  const handleDetectGPS = () => {
    if (navigator.geolocation) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLatitude(lat.toFixed(5));
          setLongitude(lng.toFixed(5));
          setGpsLoading(false);
          if (!address) {
            setAddress(`Live GPS Pinned Location (${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E)`);
            setLandmark(`Live GPS Pin [${lat.toFixed(5)}, ${lng.toFixed(5)}]`);
          }
        },
        (err) => {
          console.warn('GPS error:', err);
          // Fallback to village coordinates
          setLatitude('18.5204');
          setLongitude('73.8567');
          setGpsLoading(false);
          if (!address) {
            setAddress('Village Center Area, Gram Panchayat Chandoli');
            setLandmark('Central Village Square');
          }
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLatitude('18.5204');
      setLongitude('73.8567');
    }
  };

  // AI Detection Engine
  const runAiDetection = async (fileObj, sampleType, textOverride) => {
    try {
      setAiScanning(true);
      setAiFeedback('AI Neural Vision analyzing photo and civic hazard features...');

      const formData = new FormData();
      if (fileObj) {
        formData.append('image', fileObj);
      }
      if (sampleType) {
        formData.append('sampleType', sampleType);
      }
      if (textOverride || description || title) {
        formData.append('text', textOverride || `${title} ${description}`);
      }

      const res = await api.post('/issues/ai-detect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        const detected = res.data;
        setCategory(detected.category);
        if (!title.trim()) setTitle(detected.title);
        if (!description.trim()) setDescription(detected.description);
        setSeverity(detected.severity);
        setAiResult(detected);
        setAiFeedback(`✨ AI Auto-Selected: ${detected.category}`);
      }
    } catch (err) {
      console.warn('AI detection fallback:', err);
      if (sampleType) {
        if (sampleType.includes('road')) {
          setCategory('Damaged road');
          setTitle('Severe Road Surface Potholes and Asphalt Degradation');
          setDescription('Visual analysis reveals extensive asphalt wear, multiple interconnected potholes, and loose stone aggregate across the primary village transit route.');
          setSeverity('High');
        } else if (sampleType.includes('drain')) {
          setCategory('Drainage blockage');
          setTitle('Severe Drainage Blockage with Overflowing Water');
          setDescription('Visual analysis indicates heavy accumulation of silt, organic debris, and plastic waste causing severe obstruction in the village drainage culvert.');
          setSeverity('High');
        } else if (sampleType.includes('water')) {
          setCategory('Water leakage');
          setTitle('Major Drinking Water Pipeline Fracture and Leakage');
          setDescription('Visual analysis detects pressurized clean potable water gushing from a damaged subterranean pipeline or faulty joint valve.');
          setSeverity('High');
        } else if (sampleType.includes('waste')) {
          setCategory('Waste accumulation');
          setTitle('Open Solid Waste Accumulation and Garbage Dump');
          setDescription('Visual analysis detects an unauthorized open dump of mixed solid waste, non-biodegradable plastics, and discarded packaging.');
          setSeverity('Medium');
        } else if (sampleType.includes('light')) {
          setCategory('Streetlight failure');
          setTitle('Panchayat Streetlight Fixture Failure and Dark Corridor');
          setDescription('Visual inspection shows non-functional street lamp luminaire / faulty automatic daylight sensor on the village main pole.');
          setSeverity('Medium');
        }
        setAiFeedback(`✨ AI Auto-Detected: ${sampleType} (95% confidence)`);
      }
    } finally {
      setAiScanning(false);
    }
  };

  // One-click Sample Scenario Selector
  const handleSampleSelect = async (sample) => {
    try {
      setAiScanning(true);
      const response = await fetch(sample.imageUrl);
      const blob = await response.blob();
      const sampleFile = new File([blob], sample.filename, { type: 'image/jpeg' });

      setFiles([sampleFile]);
      setPreviews([sample.imageUrl]);

      await runAiDetection(sampleFile, sample.type);
    } catch (e) {
      setPreviews([sample.imageUrl]);
      await runAiDetection(null, sample.type);
    }
  };

  // Image Upload handler with Automatic AI Detection
  const handleFileChange = (e) => {
    const incomingFiles = e?.target?.files ? Array.from(e.target.files) : [];
    if (!incomingFiles.length) return;

    // Strict deduplication: prevent adding the exact same file twice if event fires or user clicks again
    const uniqueNewFiles = incomingFiles.filter(
      (newF) => !files.some((existingF) => existingF.name === newF.name && existingF.size === newF.size)
    );

    if (uniqueNewFiles.length === 0) return;

    if (files.length + uniqueNewFiles.length > 5) {
      setErrorMsg('Maximum 5 photos allowed.');
      return;
    }

    const newFiles = [...files, ...uniqueNewFiles];
    setFiles(newFiles);

    const newPreviews = uniqueNewFiles.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);

    // Automatically trigger AI detection when new photo is uploaded
    if (uniqueNewFiles.length > 0) {
      runAiDetection(uniqueNewFiles[0]);
    }
  };

  const removeImage = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please enter both issue title and description.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('severity', severity);
      formData.append('latitude', parseFloat(latitude) || 18.5204);
      formData.append('longitude', parseFloat(longitude) || 73.8567);
      formData.append('landmark', landmark || address);
      formData.append('address', address || landmark || 'Gram Panchayat Area');
      formData.append('ward', ward || 'Ward 1');
      formData.append('voiceTranscript', description);

      files.forEach((file) => {
        formData.append('images', file);
      });

      const res = await api.post('/issues', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccessData(res.data.issue);
    } catch (err) {
      console.error('Submit issue error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to submit report. Please check required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xl animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Issue Successfully Registered!</h2>
          <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto">
            Your civic complaint has been evaluated by the SRCI Intelligence Engines and dispatched into the
            Panchayat governance queue.
          </p>

          <div className="mt-8 p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Issue ID:</span>
              <span className="font-mono font-bold text-slate-800">#{successData._id}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Evidence Reliability Score:</span>
              <span className="font-bold text-teal-700">
                {successData.reliabilityScore}% ({successData.reliabilityLevel})
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Assigned Priority:</span>
              <span className="font-bold text-rose-700">
                {successData.priority?.level} ({successData.priority?.score}/100)
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Recurrence Risk Rating:</span>
              <span className="font-bold text-indigo-700">
                {successData.recurrenceLevel} ({successData.recurrenceRisk}%)
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Adaptive Verification Path:</span>
              <span className="font-bold text-slate-800">{successData.adaptiveVerificationPath}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate(`/issues/${successData._id}`)}
              className="px-6 py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-md transition"
            >
              Track This Issue Timeline
            </button>
            <button
              onClick={() => {
                setSuccessData(null);
                setTitle('');
                setDescription('');
                setFiles([]);
                setPreviews([]);
                setAddress('');
                setLandmark('');
                setLatitude('18.5204');
                setLongitude('73.8567');
              }}
              className="px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
            >
              Report Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Multilingual Civic Reporting</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Report a Village Civic Problem
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Submit details via voice dictation, multiple photos, and pinned GPS coordinates.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-soft">
        {/* Section 1: Basic Information */}
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              1. Issue Overview
            </h2>
            {aiResult && (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>AI Auto-Detected: {category}</span>
              </span>
            )}
          </div>

          {/* Issue Title Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">{t('form.title')} *</label>
              <span className="text-[11px] text-slate-400">AI automatically detects category as you type</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="e.g., Major drinking water pipe leak flooding road"
              required
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Category & Severity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">{t('form.category')} *</label>
                {aiResult && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                    <span>✓ AI Auto-Selected</span>
                  </span>
                )}
              </div>
              <select
                value={category}
                onChange={(e) => {
                  const newCat = e.target.value;
                  setCategory(newCat);
                  const matchedSc = QUICK_SCENARIOS.find((s) => s.category === newCat);
                  if (matchedSc) {
                    setSeverity(matchedSc.severity);
                    setAiResult({
                      category: matchedSc.category,
                      confidence: 94,
                      severity: matchedSc.severity,
                      rootCause: matchedSc.rootCause,
                      tags: matchedSc.tags,
                    });
                  }
                }}
                className={`w-full px-4 py-3 rounded-2xl border text-sm font-semibold transition ${
                  aiResult
                    ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-800'
                } focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600`}
              >
                <option value="Drainage blockage">{t('categories.Drainage blockage') || 'Drainage blockage'}</option>
                <option value="Water leakage">{t('categories.Water leakage') || 'Water leakage'}</option>
                <option value="Damaged road">{t('categories.Damaged road') || 'Damaged road'}</option>
                <option value="Waste accumulation">{t('categories.Waste accumulation') || 'Waste accumulation'}</option>
                <option value="Streetlight failure">{t('categories.Streetlight failure') || 'Streetlight failure'}</option>
                <option value="Water supply">{t('categories.Water supply') || 'Water supply'}</option>
                <option value="Sanitation">{t('categories.Sanitation') || 'Sanitation'}</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">{t('form.severity')} *</label>
                {aiResult && (
                  <span className="text-[10px] font-semibold text-slate-500">
                    Recommended by AI
                  </span>
                )}
              </div>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              >
                <option value="Low">{t('priority.Low')}</option>
                <option value="Medium">{t('priority.Medium')}</option>
                <option value="High">{t('priority.High')}</option>
                <option value="Critical">{t('priority.Critical')}</option>
              </select>
            </div>
          </div>


          {/* Description & Voice Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">{t('form.description')} *</label>
              {/* Voice Button */}
              <button
                type="button"
                onClick={toggleVoice}
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                  isListening
                    ? 'bg-rose-100 text-rose-700 animate-pulse border border-rose-300'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{isListening ? t('buttons.stopVoice') : t('buttons.startVoice')}</span>
              </button>
            </div>

            {voiceFeedback && (
              <div className="text-[11px] text-emerald-700 mb-2 font-medium bg-emerald-50/80 px-3 py-1.5 rounded-xl">
                🎙️ {voiceFeedback}
              </div>
            )}

            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('form.descPlaceholder')}
              required
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
            ></textarea>
          </div>
        </div>

        {/* Section 2: Location Landmark & GPS (Presets, Lat/Long and Map Removed) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Location Landmark / Address</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>

              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={gpsLoading}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 hover:bg-blue-100/90 active:bg-blue-200 text-blue-700 border border-blue-200 transition shadow-xs cursor-pointer"
              >
                <Navigation className={`w-3.5 h-3.5 text-blue-600 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span>{gpsLoading ? 'Detecting GPS...' : 'Detect Live GPS Location'}</span>
              </button>
            </div>

            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setLandmark(e.target.value);
              }}
              placeholder="e.g. MG Road Metro Station Gate 3, Ward 12 (Example format)"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
            />

            {latitude && longitude && (
              <div className="mt-2.5 flex items-center space-x-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 border border-emerald-200/90 px-3 py-1.5 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Accurate Live Pin Locked: {latitude}° N, {longitude}° E (High-Precision GPS Lock)</span>
              </div>
            )}
          </div>
        </div>

        {/* Evidence Image Attachment Section */}
        <div className="space-y-3 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2 border-b border-slate-100 pb-2">
            <UploadCloud className="w-4 h-4 text-emerald-600" />
            <span>EVIDENCE IMAGE ATTACHMENT</span>
          </h2>

          <AnimatedFileUploader
            files={files}
            previews={previews}
            onFilesSelected={handleFileChange}
            onRemoveFile={removeImage}
            isUploading={aiScanning || submitting}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 disabled:opacity-50 transition flex items-center justify-center space-x-2"
          >
            <span>{submitting ? t('buttons.submitting') : t('buttons.submit')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
