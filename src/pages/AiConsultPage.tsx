import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  User,
  ChevronLeft,
  X,
  RotateCcw,
  Calculator,
  Camera,
  PhoneCall,
  FileText,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Globe,
  Paperclip,
  Lightbulb,
  HelpCircle,
  PanelLeftClose,
  PanelLeft,
  Plus,
  Settings,
  Home,
  Send,
  Trash2,
  Scan,
  Share2,
  Factory,
  BookOpen,
  Upload,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Layers,
  ArrowRight,
  Info,
  ShoppingCart,
  Eye,
  Crosshair,
  SwitchCamera,
  MessageSquare,
} from 'lucide-react';
import { apiUrl } from '../config/apiConfig';
import { toPersianDigits, formatPrice } from '../utils/formatters';
import { renderEngineeringMarkdown } from '../utils/engineeringMarkdown';
import { CognivoGeometricLogo } from '../components/common/AiFloatingButton';
import {
  aiVisualSearchService,
  AiPartAnalysisResult,
  MatchedPartItem,
  INDUSTRIAL_PRESET_SAMPLES,
  IndustrialPresetSample,
} from '../services/aiVisualSearchService';
import { useCart } from '../context/CartContext';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  suggestedAction?: {
    label: string;
    link?: string;
  };
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: Message[];
}

const STORAGE_KEY = 'forza_industrial_chat_sessions_v2';
const ACTIVE_SESSION_KEY = 'forza_active_session_id_v2';

// Industrial Category Selector for Visual Part Search Prior Guidance
interface PartCategoryOption {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  defaultApplication: string;
  recommendedParams: string;
}

const PART_CATEGORIES: PartCategoryOption[] = [
  {
    id: 'belts',
    title: 'تسمه‌های انتقال قدرت و تایمینگ',
    subtitle: 'V-Belt، تایمینگ PU و کلروپرن، شیاردار، جوشی',
    iconName: 'belts',
    defaultApplication: 'سیستم‌های انتقال قدرت الکتروموتور و شفت',
    recommendedParams: 'طول اسمی (Li/Lp)، عرض مقطع (mm)، گام دندانه',
  },
  {
    id: 'pulleys',
    title: 'پولی‌ها و چرخ‌تسمه‌های صنعتی',
    subtitle: 'تایمینگ دندانه‌دار، گوه، تیپرلاک FORZA، چدنی',
    iconName: 'pulleys',
    defaultApplication: 'شفت الکتروموتور و گیربکس خطوط تولید',
    recommendedParams: 'قطر خارجی، تعداد دندانه یا شیار، قطر سوراخ شفت',
  },
  {
    id: 'bearings',
    title: 'بلبرینگ‌ها و یاتاقان‌ها',
    subtitle: 'شیار عمیق، رولربیرینگ، یاتاقان بلبرینگ صنعتی',
    iconName: 'bearings',
    defaultApplication: 'محورها و شفت‌های دوار با دور بالا',
    recommendedParams: 'قطر داخلی (d)، قطر خارجی (D)، پهنا (B)',
  },
  {
    id: 'chains',
    title: 'زنجیرها، چرخ‌دنده‌ها و کوپلینگ‌ها',
    subtitle: 'زنجیر تک‌ردیفه و دوبل، دنده‌زنجیر، کوپلینگ رابر',
    iconName: 'chains',
    defaultApplication: 'انتقال گشتاور و نوار نقاله‌های بار سنگین',
    recommendedParams: 'گام زنجیر (اینچ/میلیمتر)، تعداد دندانه، مدل کوپلینگ',
  },
  {
    id: 'kiln',
    title: 'قطعات خطوط کوره، کاشی و سرامیک',
    subtitle: 'رولیک نسوز، لاستیک کوره، تسمه‌های حرارتی',
    iconName: 'kiln',
    defaultApplication: 'کوره رولری پخت کاشی و خطوط لعاب‌کاری',
    recommendedParams: 'طول رولیک، قطر خارجی، دمای کارکرد (C°)',
  },
  {
    id: 'other',
    title: 'سایر قطعات مکانیکی و ساختنی',
    subtitle: 'کاسه‌نمد، بوش‌های برنزی، واشرها و قطعات خاص',
    iconName: 'other',
    defaultApplication: 'آب‌بندی و نگهداری تخصصی تجهیزات کارخانه',
    recommendedParams: 'ابعاد سه‌گانه، متریال (NBR / فولاد / پلی‌یورتان)',
  },
];

const INDUSTRY_DOMAINS = [
  { id: 'general', label: 'عمومی و خطوط انتقال قدرت' },
  { id: 'ceramic', label: 'کاشی، سرامیک و کوره‌های رولری' },
  { id: 'textile', label: 'نساجی، ریسندگی و بافندگی' },
  { id: 'cement', label: 'سیمان، فولاد و معادن سنگین' },
  { id: 'food', label: 'صنایع غذایی و بسته‌بندی' },
];

export const AiConsultPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Mode Switcher: Engineering Chat OR Visual Part Identification Studio
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'chat' | 'visual_studio'>('chat');

  // Chat sessions state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);

  // Chat Input & stream state
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<Record<string, 'up' | 'down'>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isDeeperResearchActive, setIsDeeperResearchActive] = useState(false);

  // Settings State
  const [selectedIndustry, setSelectedIndustry] = useState('general');
  const [calculationStandard, setCalculationStandard] = useState<'din' | 'fast'>('din');

  // =========================================================================
  // VISUAL PART IDENTIFICATION STUDIO STATE
  // =========================================================================
  const [selectedPartCategory, setSelectedPartCategory] = useState<string>('belts');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Visual Studio Fine-tuning parameters
  const [dimensionLength, setDimensionLength] = useState<string>('');
  const [dimensionWidth, setDimensionWidth] = useState<string>('');
  const [dimensionPitch, setDimensionPitch] = useState<string>('');
  const [partApplication, setPartApplication] = useState<string>('');
  const [partMarking, setPartMarking] = useState<string>('');

  // Analysis result state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AiPartAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [addedCartCode, setAddedCartCode] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamAbortControllerRef = useRef<AbortController | null>(null);

  // Interactive Belt Length Calculator State
  const [calcC, setCalcC] = useState<string>('500');
  const [calcD, setCalcD] = useState<string>('200');
  const [calcd, setCalcd] = useState<string>('100');
  const [calcResult, setCalcResult] = useState<{
    length: number;
    ratio: number;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load Sessions from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: ChatSession[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          const savedActiveId = localStorage.getItem(ACTIVE_SESSION_KEY);
          const matched = parsed.find(s => s.id === savedActiveId) || parsed[0];
          setActiveSessionId(matched.id);
          setMessages(matched.messages || []);
          return;
        }
      }
    } catch {}

    createNewSession(false);
  }, []);

  const saveSessionsToStorage = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
    } catch {}
  };

  const createNewSession = (autoFocus = true) => {
    const newId = 'session-' + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: 'گفتگوی جدید',
      timestamp: Date.now(),
      messages: [],
    };
    const updated = [newSession, ...sessions.filter(s => s.messages.length > 0)];
    saveSessionsToStorage(updated);
    setActiveSessionId(newId);
    try {
      localStorage.setItem(ACTIVE_SESSION_KEY, newId);
    } catch {}
    setMessages([]);
    setInputQuery('');
    setActiveWorkspaceTab('chat');
    setIsMobileDrawerOpen(false);
    if (autoFocus) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const switchSession = (sessionId: string) => {
    const target = sessions.find(s => s.id === sessionId);
    if (target) {
      setActiveSessionId(target.id);
      try {
        localStorage.setItem(ACTIVE_SESSION_KEY, target.id);
      } catch {}
      setMessages(target.messages || []);
      setActiveWorkspaceTab('chat');
      setIsMobileDrawerOpen(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== sessionId);
    saveSessionsToStorage(updated);
    if (activeSessionId === sessionId) {
      if (updated.length > 0) {
        switchSession(updated[0].id);
      } else {
        createNewSession(false);
      }
    }
  };

  const clearAllHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    setSessions([]);
    createNewSession(false);
    setShowSettingsModal(false);
  };

  // Recalculate Belt Formula
  useEffect(() => {
    const C = parseFloat(calcC);
    const D = parseFloat(calcD);
    const d = parseFloat(calcd);
    if (!isNaN(C) && !isNaN(D) && !isNaN(d) && C > 0 && D > 0 && d > 0 && D >= d) {
      const length = 2 * C + 1.57 * (D + d) + Math.pow(D - d, 2) / (4 * C);
      const ratio = D / d;
      setCalcResult({
        length: Math.round(length),
        ratio: Math.round(ratio * 100) / 100,
      });
    } else {
      setCalcResult(null);
    }
  }, [calcC, calcD, calcd]);

  // Clean camera stream on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // =========================================================================
  // CAMERA HANDLING
  // =========================================================================
  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setCameraFacing(facing);
    } catch (err: any) {
      console.warn('Camera failed:', err);
      setCameraError('دسترسی به دوربین در این مرورگر مقدور نشد یا مجوز داده نشد. می‌توانید از بارگذاری فایل استفاده نمایید.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    startCamera(nextFacing);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 960;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCapturedImage(reader.result);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetSample = (sample: IndustrialPresetSample) => {
    setCapturedImage(sample.imageUrl);
    stopCamera();
    if (sample.length) setDimensionLength(sample.length.toString());
    if (sample.width) setDimensionWidth(sample.width.toString());
    if (sample.pitch) setDimensionPitch(sample.pitch.toString());
    if (sample.application) setPartApplication(sample.application);
    if (sample.features) setPartMarking(sample.features);
  };

  // Run AI Part Analysis via Gemini Vision API
  const runAiPartAnalysis = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    const selectedCategoryObj = PART_CATEGORIES.find(c => c.id === selectedPartCategory);
    const categoryPromptHint = selectedCategoryObj
      ? `[دسته‌بندی اعلامی قطعه: ${selectedCategoryObj.title} - ${selectedCategoryObj.subtitle}] `
      : '';
    const markingHint = partMarking ? `کد و مارکینگ حک‌شده روی بدنه قطعه: ${partMarking}. ` : '';
    const fullFeatures = `${categoryPromptHint}${markingHint}`;

    try {
      const result = await aiVisualSearchService.analyzePartWithAi({
        imageBase64: capturedImage,
        mimeType: 'image/jpeg',
        length: dimensionLength ? parseFloat(dimensionLength) : undefined,
        width: dimensionWidth ? parseFloat(dimensionWidth) : undefined,
        pitch: dimensionPitch ? parseFloat(dimensionPitch) : undefined,
        application: partApplication || selectedCategoryObj?.defaultApplication,
        features: fullFeatures,
        stage: 'refined',
      });

      setAnalysisResult(result);
    } catch (err: any) {
      console.error('Part analysis error:', err);
      setAnalysisError(
        err?.message || 'خطا در ارتباط با موتور هوش مصنوعی فورزا. لطفاً مجدداً تلاش نمایید.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Transfer matched part to Chat for continuing consultation
  const transferAnalysisToChat = (item?: MatchedPartItem) => {
    setActiveWorkspaceTab('chat');
    const targetItem = item || analysisResult?.matchedProducts?.[0];
    if (targetItem) {
      handleSend(
        `در خصوص قطعه شناسایی‌شده «${targetItem.name}» با کد فنی ${targetItem.code} (${targetItem.brand}): لطفاً موجودی انبار مرکزی اطلس، قیمت دقیق و شرایط صدور پیش‌فاکتور رسمی را اعلام فرمایید.`
      );
    } else if (analysisResult?.summary) {
      handleSend(
        `هوش مصنوعی فورزا قطعه را به عنوان «${analysisResult.summary.detectedPartType}» با پروفیل «${analysisResult.summary.detectedProfile}» شناسایی کرده است. لطفاً توصیه‌های فنی و مدل‌های موجود در کاتالوگ را بررسی کنید.`
      );
    }
  };

  // =========================================================================
  // CHAT SEND MESSAGE
  // =========================================================================
  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend) return;

    if (streamAbortControllerRef.current) {
      streamAbortControllerRef.current.abort();
      streamAbortControllerRef.current = null;
    }
    const abortCtrl = new AbortController();
    streamAbortControllerRef.current = abortCtrl;

    const userMessageId = 'u-' + Date.now();
    const uniqueResponseId = `resp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timeNow = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    const newUserMessage: Message = {
      id: userMessageId,
      sender: 'user',
      text: textToSend,
      time: timeNow,
    };

    const aiMessageId = `ai-${uniqueResponseId}`;
    const initialAiMessage: Message = {
      id: aiMessageId,
      sender: 'ai',
      text: '',
      time: timeNow,
    };

    const updatedMessages = [...messages, newUserMessage, initialAiMessage];
    setMessages(updatedMessages);
    setInputQuery('');
    setLoading(true);

    const currentSession = sessions.find(s => s.id === activeSessionId);
    let sessionTitle = currentSession?.title || 'گفتگوی فنی';
    if (messages.length === 0 || sessionTitle === 'گفتگوی جدید') {
      sessionTitle = textToSend.slice(0, 32) + (textToSend.length > 32 ? '...' : '');
    }

    try {
      const historyPayload = messages
        .filter(m => m.id !== aiMessageId)
        .slice(-6)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text,
        }));

      const industryPrefix =
        selectedIndustry !== 'general'
          ? `[حوزه صنعتی: ${
              INDUSTRY_DOMAINS.find(d => d.id === selectedIndustry)?.label || 'عمومی'
            }] `
          : '';

      const queryWithContext = `${industryPrefix}${
        isDeeperResearchActive ? '[تحلیل عمیق و استاندارد فنی] ' : ''
      }${textToSend}`;

      let streamSucceeded = false;
      let finalAiText = '';

      try {
        const res = await fetch(apiUrl('/api/ai/consult-stream'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortCtrl.signal,
          body: JSON.stringify({
            query: queryWithContext,
            history: historyPayload,
            responseId: uniqueResponseId,
            includeAudio: false,
          }),
        });

        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let accumulatedText = '';
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              try {
                const data = JSON.parse(trimmed.slice(5).trim());
                if (data.type === 'text_chunk') {
                  streamSucceeded = true;
                  accumulatedText = data.textSoFar || accumulatedText + (data.chunk || '');
                  finalAiText = accumulatedText;
                  setMessages(prev =>
                    prev.map(m => (m.id === aiMessageId ? { ...m, text: accumulatedText } : m))
                  );
                } else if (data.type === 'done') {
                  streamSucceeded = true;
                  accumulatedText = data.fullText || accumulatedText;
                  finalAiText = accumulatedText;
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === aiMessageId
                        ? {
                            ...m,
                            text: accumulatedText,
                            suggestedAction: data.suggestedAction,
                          }
                        : m
                    )
                  );
                }
              } catch {}
            }
          }
        }
      } catch {}

      if (!streamSucceeded) {
        const res = await fetch(apiUrl('/api/ai/consult'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: queryWithContext,
            history: historyPayload,
            includeSpeech: false,
          }),
        });

        if (!res.ok) throw new Error('خطا در دریافت پاسخ');
        const data = await res.json();
        finalAiText =
          data.reply ||
          'توصیه مهندسی FORZA: با توجه به کاتالوگ صنعتی اطلس، استفاده از قطعات اورجینال دارای گواهینامه معتبر پیشنهاد می‌شود.';

        setMessages(prev =>
          prev.map(m =>
            m.id === aiMessageId
              ? {
                  ...m,
                  text: finalAiText,
                  suggestedAction: data.suggestedAction,
                }
              : m
          )
        );
      }

      const finalMessagesList = [
        ...messages,
        newUserMessage,
        {
          id: aiMessageId,
          sender: 'ai' as const,
          text: finalAiText,
          time: timeNow,
        },
      ];
      const updatedSessions = sessions.map(s =>
        s.id === activeSessionId
          ? {
              ...s,
              title: sessionTitle,
              timestamp: Date.now(),
              messages: finalMessagesList,
            }
          : s
      );
      saveSessionsToStorage(updatedSessions);
    } catch {
      const fallbackText = `### پاسخ مشاور مهندسی FORZA:
در انتخاب قطعات انتقال قدرت، توان الکتروموتور، دور ورودی و خروجی، فاصله مراکز شفت‌ها و دمای محیطی کارکرد تعیین‌کننده است.

جهت استعلام موجودی انبار مرکزی و پیش‌فاکتور رسمی مودیان با کدهای استاندارد کالا، همکاران فنی ما در خدمت شما هستند.`;

      const finalMessagesList = [
        ...messages,
        newUserMessage,
        {
          id: aiMessageId,
          sender: 'ai' as const,
          text: fallbackText,
          time: timeNow,
          suggestedAction: {
            label: 'مشاهده کاتالوگ قطعات صنعتی',
            link: '/products',
          },
        },
      ];
      setMessages(finalMessagesList);

      const updatedSessions = sessions.map(s =>
        s.id === activeSessionId
          ? {
              ...s,
              title: sessionTitle,
              timestamp: Date.now(),
              messages: finalMessagesList,
            }
          : s
      );
      saveSessionsToStorage(updatedSessions);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyChatLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2500);
  };

  // Group sessions by Date (Today, Yesterday, Older)
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const todaySessions = sessions.filter(s => now - s.timestamp < oneDay && s.messages.length > 0);
  const yesterdaySessions = sessions.filter(
    s => now - s.timestamp >= oneDay && now - s.timestamp < 2 * oneDay && s.messages.length > 0
  );
  const olderSessions = sessions.filter(s => now - s.timestamp >= 2 * oneDay && s.messages.length > 0);

  // Render Sidebar
  const renderSidebarContent = () => (
    <div className="h-full flex flex-col justify-between select-none bg-[#DEE2E5] border-l border-[#CBD2D8]">
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#CBD2D8] bg-[#E8ECEF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFFFFF] border border-[#CBD2D8] flex items-center justify-center shrink-0 shadow-2xs">
              <CognivoGeometricLogo className="w-5 h-5 text-[#E06518]" />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-[#2B313A]">
                هوش مصنوعی FORZA
              </span>
              <span className="block text-[10px] text-[#777A7D] font-medium">
                میزکار تخصصی مشاوره صنعتی
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsSidebarOpen(false);
              setIsMobileDrawerOpen(false);
            }}
            title="بستن منو"
            className="p-1.5 rounded-lg text-[#55565A] hover:text-[#2B313A] hover:bg-[#CBD2D8]/50 transition-colors cursor-pointer"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Workspace Navigation Tabs */}
        <div className="p-3 space-y-1.5">
          <button
            type="button"
            onClick={() => createNewSession()}
            className="w-full py-2.5 px-3.5 rounded-xl bg-[#E06518] hover:bg-[#C95210] active:scale-98 text-white font-bold text-xs flex items-center justify-between shadow-xs transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>گفتگوی جدید</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-white font-mono text-[10px] tracking-wide">
              ⌘ N
            </span>
          </button>

          {/* Mode Switcher Buttons */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setActiveWorkspaceTab('chat');
                setIsMobileDrawerOpen(false);
              }}
              className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeWorkspaceTab === 'chat'
                  ? 'bg-[#FFFFFF] border-[#E06518] text-[#E06518] shadow-2xs'
                  : 'bg-[#E8ECEF] border-[#CBD2D8] text-[#55565A] hover:bg-[#FFFFFF]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>گفتگوی متنی</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveWorkspaceTab('visual_studio');
                setIsMobileDrawerOpen(false);
              }}
              className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeWorkspaceTab === 'visual_studio'
                  ? 'bg-[#FFFFFF] border-[#E06518] text-[#E06518] shadow-2xs'
                  : 'bg-[#E8ECEF] border-[#CBD2D8] text-[#55565A] hover:bg-[#FFFFFF]'
              }`}
            >
              <Scan className="w-3.5 h-3.5 text-[#E06518]" />
              <span>استودیوی بصری</span>
            </button>
          </div>
        </div>

        {/* Live Call to AI FORZA */}
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={() => {
              setIsMobileDrawerOpen(false);
              navigate('/ai-forza');
            }}
            className="w-full py-2 px-3 rounded-xl bg-[#FFFFFF] border border-[#CBD2D8] hover:border-[#E06518] hover:text-[#E06518] flex items-center justify-between text-right transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <span className="text-xs font-bold text-[#55565A] group-hover:text-[#E06518]">
                تماس زنده چهره‌به‌چهره
              </span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black">
              FORZA
            </span>
          </button>
        </div>

        {/* Quick Tools */}
        <div className="px-3 py-1 space-y-1 text-xs font-semibold text-[#55565A] border-t border-[#CBD2D8] pt-2">
          <button
            type="button"
            onClick={() => {
              setIsMobileDrawerOpen(false);
              setShowCalculatorModal(true);
            }}
            className="w-full py-1.5 px-3 rounded-lg hover:bg-[#CBD2D8]/60 flex items-center gap-2.5 transition-colors text-right cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-[#E06518]" />
            <span>محاسبه‌گر طول تسمه (DIN 2215)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMobileDrawerOpen(false);
              setActiveWorkspaceTab('chat');
              handleSend('پایگاه دانش مهندسی هایپر صنعت: راهنمای انتخاب تسمه و پولی');
            }}
            className="w-full py-1.5 px-3 rounded-lg hover:bg-[#CBD2D8]/60 flex items-center gap-2.5 transition-colors text-right cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#55565A]" />
            <span>پایگاه دانش فنی قطعات</span>
          </button>
        </div>

        {/* Saved Conversations History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {todaySessions.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-[#777A7D] tracking-wider">امروز</div>
              {todaySessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => switchSession(session.id)}
                  className={`w-full py-2 px-3 rounded-xl text-right text-xs flex items-center justify-between transition-all cursor-pointer group ${
                    activeSessionId === session.id && activeWorkspaceTab === 'chat'
                      ? 'bg-[#FFFFFF] shadow-2xs text-[#E06518] font-bold border border-[#CBD2D8]'
                      : 'text-[#55565A] hover:bg-[#FFFFFF] hover:text-[#2B313A]'
                  }`}
                >
                  <span className="truncate flex-1 pl-2">{session.title}</span>
                  <button
                    type="button"
                    onClick={e => deleteSession(session.id, e)}
                    title="حذف این گفتگو"
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#777A7D] hover:text-rose-600 rounded transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {yesterdaySessions.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-[#777A7D] tracking-wider">دیروز</div>
              {yesterdaySessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => switchSession(session.id)}
                  className={`w-full py-2 px-3 rounded-xl text-right text-xs flex items-center justify-between transition-all cursor-pointer group ${
                    activeSessionId === session.id && activeWorkspaceTab === 'chat'
                      ? 'bg-[#FFFFFF] shadow-2xs text-[#E06518] font-bold border border-[#CBD2D8]'
                      : 'text-[#55565A] hover:bg-[#FFFFFF] hover:text-[#2B313A]'
                  }`}
                >
                  <span className="truncate flex-1 pl-2">{session.title}</span>
                  <button
                    type="button"
                    onClick={e => deleteSession(session.id, e)}
                    title="حذف این گفتگو"
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#777A7D] hover:text-rose-600 rounded transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {olderSessions.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-[#777A7D] tracking-wider">
                گفتگوهای پیشین
              </div>
              {olderSessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => switchSession(session.id)}
                  className={`w-full py-2 px-3 rounded-xl text-right text-xs flex items-center justify-between transition-all cursor-pointer group ${
                    activeSessionId === session.id && activeWorkspaceTab === 'chat'
                      ? 'bg-[#FFFFFF] shadow-2xs text-[#E06518] font-bold border border-[#CBD2D8]'
                      : 'text-[#55565A] hover:bg-[#FFFFFF] hover:text-[#2B313A]'
                  }`}
                >
                  <span className="truncate flex-1 pl-2">{session.title}</span>
                  <button
                    type="button"
                    onClick={e => deleteSession(session.id, e)}
                    title="حذف این گفتگو"
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#777A7D] hover:text-rose-600 rounded transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {sessions.every(s => s.messages.length === 0) && (
            <div className="p-4 text-center text-xs text-[#777A7D]">
              هنوز گفتگویی ثبت نشده است. پرسش خود را بپرسید تا به‌صورت خودکار در این بخش ذخیره گردد.
            </div>
          )}
        </div>
      </div>

      {/* Settings & Profile Bar at Bottom */}
      <div className="p-3 border-t border-[#CBD2D8] bg-[#E8ECEF] space-y-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            setIsMobileDrawerOpen(false);
            setShowSettingsModal(true);
          }}
          className="w-full py-2 px-2.5 rounded-xl bg-[#FFFFFF] border border-[#CBD2D8] text-[#55565A] hover:text-[#2B313A] hover:border-[#E06518] flex items-center justify-between text-xs font-bold transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#55565A]" />
            <span>تنظیمات میزکار FORZA</span>
          </div>
          <span className="text-[10px] text-[#777A7D]">مدیریت</span>
        </button>

        <div className="flex items-center justify-between p-2 rounded-xl bg-[#FFFFFF] border border-[#CBD2D8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#DEE2E5] border border-[#CBD2D8] flex items-center justify-center text-[#E06518] font-black text-xs">
              ف
            </div>
            <div className="text-right leading-tight">
              <div className="font-bold text-xs text-[#2B313A]">مهندس ناظر کارخانه</div>
              <span className="text-[10px] text-[#E06518] font-bold">میزکار فعال FORZA</span>
            </div>
          </div>
          <Factory className="w-4 h-4 text-[#777A7D]" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen h-screen flex flex-col bg-[#F4F4F5] text-[#55565A] overflow-hidden" dir="rtl">
      {/* Top Hairline Orange Accent Line */}
      <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#E06518] to-transparent opacity-90 shrink-0" />

      <div className="flex-1 flex overflow-hidden">
        {/* 1. DESKTOP SIDEBAR */}
        <aside
          className={`${
            isSidebarOpen ? 'w-72 xl:w-80' : 'w-0 hidden'
          } transition-all duration-300 ease-in-out hidden lg:flex flex-col shrink-0 overflow-hidden z-20`}
        >
          {renderSidebarContent()}
        </aside>

        {/* 2. MOBILE SLIDE-OVER DRAWER */}
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-[#2B313A]/50 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileDrawerOpen(false)}
            />
            <div className="relative w-76 max-w-[85vw] h-full shadow-2xl flex flex-col z-50">
              {renderSidebarContent()}
            </div>
          </div>
        )}

        {/* 3. MAIN WORKSPACE CONTAINER */}
        <main className="flex-1 flex flex-col bg-[#F4F4F5] overflow-hidden min-w-0">
          {/* Workspace Top Header Bar */}
          <header className="h-14 px-3 sm:px-6 border-b border-[#CBD2D8] flex items-center justify-between shrink-0 bg-[#FFFFFF] z-10 shadow-2xs">
            <div className="flex items-center gap-2.5">
              {/* Mobile Drawer Button */}
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="lg:hidden p-2 rounded-xl text-[#55565A] hover:bg-[#DEE2E5] cursor-pointer"
                title="تاریخچه و منو"
              >
                <PanelLeft className="w-5 h-5" />
              </button>

              {/* Desktop Toggle Button */}
              {!isSidebarOpen && (
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  title="نمایش تاریخچه"
                  className="hidden lg:flex p-2 rounded-xl text-[#55565A] hover:text-[#2B313A] hover:bg-[#DEE2E5] transition-colors cursor-pointer"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>
              )}

              {/* Workspace Title */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#DEE2E5] border border-[#CBD2D8] flex items-center justify-center shrink-0">
                  <CognivoGeometricLogo className="w-4 h-4 text-[#E06518]" />
                </div>
                <span className="font-black text-sm text-[#2B313A] tracking-tight">
                  میزکار هوشمند FORZA
                </span>
              </div>

              {/* Top Segmented Controls: Toggle between Chat & Visual Studio */}
              <div className="hidden sm:flex items-center gap-1 p-1 bg-[#DEE2E5] rounded-xl border border-[#CBD2D8] mr-2">
                <button
                  type="button"
                  onClick={() => setActiveWorkspaceTab('chat')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeWorkspaceTab === 'chat'
                      ? 'bg-[#FFFFFF] text-[#E06518] shadow-2xs'
                      : 'text-[#55565A] hover:text-[#2B313A]'
                  }`}
                >
                  گفتگوی مهندسی
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWorkspaceTab('visual_studio')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeWorkspaceTab === 'visual_studio'
                      ? 'bg-[#FFFFFF] text-[#E06518] shadow-2xs'
                      : 'text-[#55565A] hover:text-[#2B313A]'
                  }`}
                >
                  <Scan className="w-3.5 h-3.5 text-[#E06518]" />
                  <span>استودیوی شناسایی قطعه</span>
                </button>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Toggle to Visual Studio on Mobile */}
              <button
                type="button"
                onClick={() =>
                  setActiveWorkspaceTab(activeWorkspaceTab === 'chat' ? 'visual_studio' : 'chat')
                }
                className="sm:hidden px-2.5 py-1.5 rounded-xl border border-[#CBD2D8] bg-[#FFFFFF] text-[#55565A] text-xs font-bold flex items-center gap-1"
              >
                {activeWorkspaceTab === 'chat' ? (
                  <>
                    <Scan className="w-3.5 h-3.5 text-[#E06518]" />
                    <span>شناسایی قطعه</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-3.5 h-3.5 text-[#E06518]" />
                    <span>چت مهندسی</span>
                  </>
                )}
              </button>

              {/* Live AI FORZA Voice Call */}
              <button
                type="button"
                onClick={() => navigate('/ai-forza')}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                title="مکالمه زنده و چهره‌به‌چهره با هوش مصنوعی FORZA"
              >
                <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
                <span>تماس زنده FORZA</span>
              </button>

              {/* Back to Store */}
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#CBD2D8] hover:border-[#E06518] hover:text-[#E06518] bg-[#FFFFFF] text-[#55565A] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer hidden md:flex"
                title="بازگشت به فروشگاه هایپر صنعت"
              >
                <Home className="w-3.5 h-3.5" />
                <span>فروشگاه</span>
              </button>

              {/* Settings */}
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                title="تنظیمات میزکار"
                className="p-2 rounded-xl text-[#55565A] hover:text-[#2B313A] hover:bg-[#DEE2E5] transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Share */}
              <button
                type="button"
                onClick={handleCopyChatLink}
                title="اشتراک‌گذاری"
                className="p-2 rounded-xl text-[#55565A] hover:text-[#2B313A] hover:bg-[#DEE2E5] transition-colors cursor-pointer hidden sm:flex"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Share Toast */}
          {showShareToast && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#2B313A] text-white text-xs font-bold rounded-full shadow-xl flex items-center gap-2 z-40 animate-in fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>لینک صفحه با موفقیت کپی شد!</span>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 1: VISUAL PART IDENTIFICATION STUDIO (استودیوی شناسایی قطعه)   */}
          {/* ================================================================= */}
          {activeWorkspaceTab === 'visual_studio' ? (
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6 max-w-5xl mx-auto w-full">
              {/* Studio Header Banner */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#FFFFFF] border border-[#CBD2D8] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#E06518] text-[11px] font-black">
                      سامانه بینایی ماشین هوش مصنوعی
                    </span>
                    <span className="text-xs text-[#777A7D]">تطبیق با ۸۶۴ قطعه کاتالوگ صنعتی اطلس</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-[#2B313A]">
                    استودیوی شناسایی و تطبیق تصویری قطعات صنعتی FORZA
                  </h2>
                  <p className="text-xs text-[#55565A] mt-1">
                    با انتخاب دسته‌بندی و ارسال تصویر از طریق دوربین زنده، هوش مصنوعی پروفیل، گام دندانه و مشخصات استاندارد قطعه را با دقت بالا استخراج می‌کند.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveWorkspaceTab('chat')}
                    className="px-3 py-1.5 rounded-xl border border-[#CBD2D8] hover:border-[#E06518] text-[#55565A] hover:text-[#E06518] text-xs font-bold bg-[#FFFFFF] flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>بازگشت به چت</span>
                  </button>
                </div>
              </div>

              {/* STEP 1: CATEGORY SELECTION (انتخاب دسته‌بندی قطعات صنعتی) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#FFFFFF] border border-[#CBD2D8] shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#E06518] text-white text-xs font-black flex items-center justify-center">
                      ۱
                    </span>
                    <h3 className="font-black text-sm text-[#2B313A]">
                      انتخاب دسته‌بندی تخصصی قطعه (جهت افزایش چشمگیر دقت تحلیل)
                    </h3>
                  </div>
                  <span className="text-xs text-[#777A7D]">
                    {PART_CATEGORIES.find(c => c.id === selectedPartCategory)?.recommendedParams}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PART_CATEGORIES.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedPartCategory(category.id)}
                      className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                        selectedPartCategory === category.id
                          ? 'border-[#E06518] bg-orange-50/50 shadow-xs ring-2 ring-orange-500/20'
                          : 'border-[#CBD2D8] bg-[#FFFFFF] hover:border-[#CBD2D8] hover:bg-[#F4F4F5]'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            selectedPartCategory === category.id
                              ? 'bg-[#E06518] text-white'
                              : 'bg-[#DEE2E5] text-[#55565A]'
                          }`}
                        >
                          <Scan className="w-4 h-4" />
                        </div>
                        {selectedPartCategory === category.id && (
                          <span className="w-5 h-5 rounded-full bg-[#E06518] text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      <div>
                        <h4
                          className={`font-black text-xs ${
                            selectedPartCategory === category.id ? 'text-[#E06518]' : 'text-[#2B313A]'
                          }`}
                        >
                          {category.title}
                        </h4>
                        <p className="text-[11px] text-[#777A7D] mt-0.5 line-clamp-1">
                          {category.subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* STEP 2: CAMERA CAPTURE OR FILE UPLOAD (تصویربرداری با دوربین زنده یا فایل) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#FFFFFF] border border-[#CBD2D8] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#E06518] text-white text-xs font-black flex items-center justify-center">
                      ۲
                    </span>
                    <h3 className="font-black text-sm text-[#2B313A]">
                      ثبت تصویر قطعه (دوربین زنده صنعتی یا بارگذاری فایل)
                    </h3>
                  </div>

                  {capturedImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setCapturedImage(null);
                        setAnalysisResult(null);
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف و تصویربرداری مجدد</span>
                    </button>
                  )}
                </div>

                {/* Viewport: Live Camera vs Captured Image vs Upload Placeholder */}
                <div className="relative min-h-[300px] sm:min-h-[380px] rounded-2xl border-2 border-dashed border-[#CBD2D8] bg-[#F4F4F5] flex flex-col items-center justify-center overflow-hidden">
                  {/* Option A: Live Camera Stream Active */}
                  {isCameraActive ? (
                    <div className="relative w-full h-[360px] sm:h-[420px] bg-black flex items-center justify-center overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />

                      {/* Targeting Crosshair / Bounding Box Overlay */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="relative w-64 h-64 sm:w-80 sm:h-80 border-2 border-[#E06518]/80 rounded-3xl shadow-2xl flex items-center justify-center">
                          {/* Corner Reticles */}
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#E06518]" />
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#E06518]" />
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#E06518]" />
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#E06518]" />

                          <div className="text-center px-4 py-2 bg-black/60 rounded-xl backdrop-blur-xs text-white text-[11px] font-bold">
                            قطعه را در مرکز کادر قرار دهید
                          </div>
                        </div>
                      </div>

                      {/* Live Camera Controls */}
                      <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4 z-20">
                        <button
                          type="button"
                          onClick={toggleCameraFacing}
                          className="p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors cursor-pointer"
                          title="چرخش دوربین"
                        >
                          <SwitchCamera className="w-5 h-5" />
                        </button>

                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="w-16 h-16 rounded-full bg-[#E06518] hover:bg-[#C95210] text-white flex items-center justify-center shadow-2xl ring-4 ring-white/30 cursor-pointer active:scale-95 transition-all"
                          title="ثبت عکس"
                        >
                          <Camera className="w-8 h-8" />
                        </button>

                        <button
                          type="button"
                          onClick={stopCamera}
                          className="p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors cursor-pointer"
                          title="انصراف"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : capturedImage ? (
                    /* Option B: Image Captured / Uploaded with Analysis Status */
                    <div className="relative w-full h-[340px] sm:h-[400px] flex items-center justify-center bg-black/5 overflow-hidden">
                      <img
                        src={capturedImage}
                        alt="قطعه انتخاب‌شده"
                        className="max-h-full max-w-full object-contain"
                      />

                      {/* Laser Scanning Animation Overlay during analysis */}
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-2xs flex flex-col items-center justify-center">
                          <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#E06518] to-transparent animate-pulse absolute top-1/2 -translate-y-1/2 shadow-lg shadow-orange-500/50" />
                          <div className="px-5 py-3 rounded-2xl bg-[#FFFFFF] border border-[#CBD2D8] shadow-2xl flex items-center gap-3 z-10 animate-pulse">
                            <Sparkles className="w-5 h-5 text-[#E06518] animate-spin" />
                            <span className="font-black text-xs text-[#2B313A]">
                              هوش مصنوعی FORZA در حال اسکن هندسه و تطبیق کاتالوگ...
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Option C: Standby State - Choose Camera or File */
                    <div className="p-6 text-center space-y-4 max-w-md">
                      <div className="w-16 h-16 rounded-3xl bg-[#DEE2E5] border border-[#CBD2D8] flex items-center justify-center text-[#E06518] mx-auto">
                        <Camera className="w-8 h-8" />
                      </div>

                      <div>
                        <h4 className="font-black text-sm text-[#2B313A]">
                          تصویربرداری با دوربین زنده یا بارگذاری فایل قطعه
                        </h4>
                        <p className="text-xs text-[#777A7D] mt-1 leading-relaxed">
                          جهت بالاترین دقت، قطعه را در پس‌زمینه با کنتراست مناسب و نور کافی قرار دهید تا دندانه‌ها و مارکینگ قابل تشخیص باشد.
                        </p>
                      </div>

                      {cameraError && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-right">
                          {cameraError}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => startCamera()}
                          className="px-4 py-2.5 rounded-xl bg-[#E06518] hover:bg-[#C95210] text-white text-xs font-black flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          <Camera className="w-4 h-4" />
                          <span>باز کردن دوربین زنده</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#CBD2D8] hover:border-[#E06518] hover:text-[#E06518] text-[#55565A] text-xs font-bold flex items-center gap-2 shadow-2xs cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>انتخاب فایل عکس</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* One-Click Real Catalog Presets for Instant Testing */}
                <div className="pt-1">
                  <div className="text-xs font-bold text-[#55565A] mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#E06518]" />
                    <span>یا آزمایش فوری با نمونه‌های آماده کاتالوگ هایپر صنعت اطلس:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {INDUSTRIAL_PRESET_SAMPLES.map(sample => (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => handleSelectPresetSample(sample)}
                        className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#CBD2D8] hover:border-[#E06518] text-right transition-all cursor-pointer flex items-center gap-2 group shadow-2xs"
                      >
                        <img
                          src={sample.imageUrl}
                          alt={sample.title}
                          className="w-10 h-10 object-contain rounded-lg bg-[#F4F4F5] p-1 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="block text-[11px] font-bold text-[#2B313A] truncate group-hover:text-[#E06518]">
                            {sample.title}
                          </span>
                          <span className="block text-[10px] text-[#777A7D] truncate">
                            {sample.subtitle}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* STEP 3: TECHNICAL SPECIFICATION PROMPTS (مشخصات تکمیلی جهت بهینه‌سازی تحلیل) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#FFFFFF] border border-[#CBD2D8] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#E06518] text-white text-xs font-black flex items-center justify-center">
                      ۳
                    </span>
                    <h3 className="font-black text-sm text-[#2B313A]">
                      مشخصات تکمیلی ابعادی و کارکردی (اختیاری — جهت دقت حداکثری)
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#777A7D]">تطبیق با استانداردهای DIN</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#55565A] block mb-1">
                      طول اسمی یا محیط تقریبی (mm):
                    </label>
                    <input
                      type="number"
                      value={dimensionLength}
                      onChange={e => setDimensionLength(e.target.value)}
                      placeholder="مثال: 376 یا 1250"
                      className="w-full h-10 px-3 bg-[#F4F4F5] border border-[#CBD2D8] rounded-xl text-xs text-[#2B313A] font-mono focus:outline-none focus:border-[#E06518]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#55565A] block mb-1">
                      عرض یا پهنای مقطع (mm):
                    </label>
                    <input
                      type="number"
                      value={dimensionWidth}
                      onChange={e => setDimensionWidth(e.target.value)}
                      placeholder="مثال: 17 یا 30"
                      className="w-full h-10 px-3 bg-[#F4F4F5] border border-[#CBD2D8] rounded-xl text-xs text-[#2B313A] font-mono focus:outline-none focus:border-[#E06518]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#55565A] block mb-1">
                      گام دندانه یا شیارها (mm):
                    </label>
                    <input
                      type="number"
                      value={dimensionPitch}
                      onChange={e => setDimensionPitch(e.target.value)}
                      placeholder="مثال: 8 یا 5"
                      className="w-full h-10 px-3 bg-[#F4F4F5] border border-[#CBD2D8] rounded-xl text-xs text-[#2B313A] font-mono focus:outline-none focus:border-[#E06518]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#55565A] block mb-1">
                      کد، مارکینگ یا شماره فنی حک‌شده روی بدنه قطعه:
                    </label>
                    <input
                      type="text"
                      value={partMarking}
                      onChange={e => setPartMarking(e.target.value)}
                      placeholder="مثال: 8M-376، B-1250، NSK 6205-2RS"
                      className="w-full h-10 px-3 bg-[#F4F4F5] border border-[#CBD2D8] rounded-xl text-xs text-[#2B313A] focus:outline-none focus:border-[#E06518]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#55565A] block mb-1">
                      محل استفاده و دستگاه (کاربرد صنعتی):
                    </label>
                    <input
                      type="text"
                      value={partApplication}
                      onChange={e => setPartApplication(e.target.value)}
                      placeholder="مثال: کوره رولری پخت کاشی، خط ریسندگی نساجی"
                      className="w-full h-10 px-3 bg-[#F4F4F5] border border-[#CBD2D8] rounded-xl text-xs text-[#2B313A] focus:outline-none focus:border-[#E06518]"
                    />
                  </div>
                </div>

                {/* Primary Action Button to Start Analysis */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={runAiPartAnalysis}
                    disabled={!capturedImage || isAnalyzing}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#E06518] hover:bg-[#C95210] disabled:bg-[#CBD2D8] text-white text-sm font-black flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-98"
                  >
                    {isAnalyzing ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin text-white" />
                        <span>در حال تحلیل بینایی ماشین و تطبیق کاتالوگ هوش مصنوعی FORZA...</span>
                      </>
                    ) : (
                      <>
                        <Scan className="w-4 h-4" />
                        <span>شروع تحلیل و تطبیق هوش مصنوعی FORZA ↵</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* STEP 4: ANALYSIS RESULTS & CATALOG MATCHES (نتایج هوش مصنوعی و انطباق کاتالوگی) */}
              {analysisError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{analysisError}</span>
                </div>
              )}

              {analysisResult && (
                <div className="p-4 sm:p-6 rounded-3xl bg-[#FFFFFF] border-2 border-[#E06518]/60 shadow-lg space-y-5 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#DEE2E5] gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                          تحلیل با موفقیت انجام شد
                        </span>
                        <span className="text-xs text-[#777A7D]">
                          ضریب اطمینان تطبیق: {analysisResult.summary.confidence}٪
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-[#2B313A]">
                        {analysisResult.summary.detectedPartType}
                      </h3>
                      <p className="text-xs text-[#55565A] mt-0.5">
                        {analysisResult.summary.visualAnalysis}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => transferAnalysisToChat()}
                      className="px-4 py-2 rounded-xl bg-[#DEE2E5] hover:bg-[#E06518] hover:text-white text-[#2B313A] text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>انتقال نتیجه به چت میزکار FORZA ↵</span>
                    </button>
                  </div>

                  {/* Summary Metric Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-3 rounded-2xl bg-[#F4F4F5] border border-[#CBD2D8]">
                      <span className="text-[10px] text-[#777A7D] block">پروفیل تشخیص‌داده‌شده:</span>
                      <span className="font-bold text-[#2B313A] mt-0.5 block">
                        {analysisResult.summary.detectedProfile || 'استاندارد صنعتی'}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#F4F4F5] border border-[#CBD2D8]">
                      <span className="text-[10px] text-[#777A7D] block">جنس متریال:</span>
                      <span className="font-bold text-[#2B313A] mt-0.5 block">
                        {analysisResult.summary.material || 'رابر / پلی‌یورتان مهندسی'}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#F4F4F5] border border-[#CBD2D8]">
                      <span className="text-[10px] text-[#777A7D] block">وضعیت کاتالوگی:</span>
                      <span className="font-bold text-[#E06518] mt-0.5 block">
                        {analysisResult.summary.catalogAvailability?.statusFarsiTitle || 'انطباق در انبار مرکزی'}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#F4F4F5] border border-[#CBD2D8]">
                      <span className="text-[10px] text-[#777A7D] block">استاندارد مرجع:</span>
                      <span className="font-bold text-[#2B313A] mt-0.5 block font-mono">DIN 2215 / ISO</span>
                    </div>
                  </div>

                  {/* Technical Advice Box */}
                  {analysisResult.technicalAdvice && (
                    <div className="p-4 rounded-2xl bg-[#DEE2E5] border border-[#CBD2D8] text-xs leading-relaxed text-[#2B313A]">
                      <span className="font-black text-[#E06518] block mb-1">
                        توصیه مهندسی و بازرسی فنی FORZA:
                      </span>
                      {analysisResult.technicalAdvice}
                    </div>
                  )}

                  {/* Matched Catalog Products List */}
                  <div>
                    <h4 className="font-black text-sm text-[#2B313A] mb-3">
                      قطعات معادل و منطبق در کاتالوگ هایپر صنعت اطلس:
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysisResult.matchedProducts.map(item => (
                        <div
                          key={item.code}
                          className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#CBD2D8] hover:border-[#E06518] shadow-2xs flex flex-col justify-between space-y-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-16 rounded-xl bg-[#F4F4F5] border border-[#CBD2D8] p-1.5 flex items-center justify-center shrink-0">
                              <img
                                src={item.image || (item.catalogProduct ? item.catalogProduct.image : '')}
                                alt={item.name}
                                className="w-full h-full object-contain"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="px-1.5 py-0.2 rounded bg-orange-100 text-[#E06518] font-bold text-[10px]">
                                  {item.brand}
                                </span>
                                <span className="font-mono text-[10px] text-[#777A7D]">
                                  کد: {item.code}
                                </span>
                              </div>
                              <h5 className="font-black text-xs text-[#2B313A] line-clamp-1">
                                {item.name}
                              </h5>
                              <p className="text-[11px] text-[#55565A] mt-1 line-clamp-2">
                                {item.matchReason}
                              </p>
                            </div>
                          </div>

                          {/* Action Row for the Part */}
                          <div className="flex items-center justify-between pt-2 border-t border-[#DEE2E5]">
                            <div className="text-xs">
                              {item.catalogProduct ? (
                                <span className="font-black text-[#2B313A]">
                                  {formatPrice(
                                    item.catalogProduct.prices?.retail ||
                                      item.catalogProduct.prices?.base ||
                                      0
                                  )}
                                </span>
                              ) : (
                                <span className="text-[#777A7D] text-[11px]">استعلام قیمت رسمی</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {item.catalogProduct && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    addToCart(item.catalogProduct!);
                                    setAddedCartCode(item.code);
                                    setTimeout(() => setAddedCartCode(null), 2000);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#E06518] hover:bg-[#C95210] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  {addedCartCode === item.code ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>افزوده شد</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingCart className="w-3 h-3" />
                                      <span>خرید</span>
                                    </>
                                  )}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => transferAnalysisToChat(item)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#DEE2E5] hover:bg-[#CBD2D8] text-[#2B313A] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>مشاوره در چت</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ================================================================= */
            /* TAB 2: ENGINEERING CHAT WORKSPACE (گفتگوی مهندسی FORZA)           */
            /* ================================================================= */
            <div className="flex-1 overflow-y-auto flex flex-col justify-between">
              {messages.length === 0 ? (
                /* INITIAL WELCOME SCREEN */
                <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
                  {/* Top Banner Tag */}
                  <div className="mb-4 sm:mb-6">
                    <div className="px-4 py-1.5 rounded-full bg-[#FFFFFF] border border-[#CBD2D8] text-[#55565A] text-xs font-bold flex items-center gap-2 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-[#E06518]" />
                      <span>دسترسی آزاد به مشاور فنی خطوط تولید صنعتی اطلس</span>
                    </div>
                  </div>

                  {/* Central Geometric Brand Logo */}
                  <div className="mb-3">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                      <CognivoGeometricLogo className="w-16 h-16 sm:w-20 sm:h-20 text-[#E06518]" />
                    </div>
                  </div>

                  {/* Heading */}
                  <div className="text-center mb-5 sm:mb-7">
                    <h1 className="text-2xl sm:text-3xl font-black text-[#2B313A] tracking-tight">
                      آغاز گفتگوی فنی با هوش مصنوعی FORZA
                    </h1>
                    <p className="text-xs sm:text-sm text-[#55565A] mt-1.5 font-medium">
                      مشاوره تخصصی، مشخصات فنی و استعلام قطعات صنعتی خطوط تولید کارخانجات
                    </p>
                  </div>

                  {/* Elevated Smart Prompt Box with Website Grey Borders and Shadow */}
                  <div className="w-full bg-[#FFFFFF] rounded-3xl border border-[#CBD2D8] shadow-sm p-3.5 sm:p-4 transition-all focus-within:border-[#E06518] focus-within:ring-2 focus-within:ring-orange-500/10 mb-5">
                    <textarea
                      ref={textareaRef}
                      value={inputQuery}
                      onChange={e => setInputQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      rows={3}
                      placeholder="هر سوالی درباره انتخاب تسمه‌ها، یاتاقان‌ها، زنجیر، پولی و قطعات خط تولید دارید بنویسید..."
                      className="w-full bg-transparent text-xs sm:text-sm text-[#2B313A] placeholder-[#777A7D] resize-none focus:outline-none leading-relaxed"
                    />

                    {/* Inner Bottom Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#DEE2E5] mt-2">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => setIsDeeperResearchActive(!isDeeperResearchActive)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isDeeperResearchActive
                              ? 'bg-[#E06518] text-white'
                              : 'bg-[#DEE2E5] text-[#55565A] border border-[#CBD2D8] hover:border-[#E06518] hover:text-[#E06518]'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#E06518]" />
                          <span>تحلیل و بررسی عمیق</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveWorkspaceTab('visual_studio')}
                          title="استودیوی بینایی ماشین و شناسایی قطعه"
                          className="p-2 rounded-xl text-[#55565A] hover:text-[#E06518] hover:bg-[#DEE2E5] transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                        >
                          <Camera className="w-4 h-4 text-[#E06518]" />
                          <span className="hidden sm:inline">شناسایی قطعه با دوربین</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowCalculatorModal(true)}
                          title="فرمول‌ها و محاسبات فنی"
                          className="p-2 rounded-xl text-[#55565A] hover:text-[#2B313A] hover:bg-[#DEE2E5] transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                        >
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          <span className="hidden sm:inline">فرمول DIN</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleSend('بررسی مشخصات فنی و استعلام قیمت برندهای انحصاری SWR آلمان و FORZA ایتالیا')
                          }
                          title="جستجوی کاتالوگ صنعتی"
                          className="p-2 rounded-xl text-[#55565A] hover:text-[#2B313A] hover:bg-[#DEE2E5] transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                        >
                          <Globe className="w-4 h-4 text-[#55565A]" />
                          <span className="hidden sm:inline">کاتالوگ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSend()}
                          disabled={!inputQuery.trim() || loading}
                          className="w-9 h-9 rounded-full bg-[#E06518] hover:bg-[#C95210] disabled:bg-[#CBD2D8] text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                          title="ارسال پرسش"
                        >
                          <Send className="w-4 h-4 -rotate-45" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3 Pure Persian Suggestion Cards */}
                  <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleSend(
                          'خلاصه‌سازی و استخراج مشخصات فنی: لیست قطعات و کدهای فنی تسمه و پولی را با توضیحات خلاصه استخراج کنید.'
                        )
                      }
                      className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#CBD2D8] hover:border-[#E06518] hover:shadow-sm text-right transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#DEE2E5] group-hover:bg-orange-50 flex items-center justify-center mb-2.5 transition-colors">
                        <FileText className="w-4 h-4 text-[#55565A] group-hover:text-[#E06518]" />
                      </div>
                      <h4 className="font-black text-xs text-[#2B313A] mb-1">
                        خلاصه‌سازی و استخراج مشخصات
                      </h4>
                      <p className="text-[11px] text-[#55565A] leading-relaxed font-normal">
                        تبدیل لیست طولانی قطعات به استعلام فنی مرتب با کدهای استاندارد کالا
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSend(
                          'محاسبه و طراحی فنی: فرمول دقیق محاسبه طول اسمی تسمه، فاصله محور شفت‌ها و نسبت تبدیل دور پولی'
                        )
                      }
                      className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#CBD2D8] hover:border-[#E06518] hover:shadow-sm text-right transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#DEE2E5] group-hover:bg-orange-50 flex items-center justify-center mb-2.5 transition-colors">
                        <Calculator className="w-4 h-4 text-[#55565A] group-hover:text-[#E06518]" />
                      </div>
                      <h4 className="font-black text-xs text-[#2B313A] mb-1">
                        محاسبات فنی و فرمول‌های DIN
                      </h4>
                      <p className="text-[11px] text-[#55565A] leading-relaxed font-normal">
                        محاسبه دقیق طول تسمه بر مبنای DIN 2215، توان انتقالی و نسبت دور در چند ثانیه
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSend(
                          'پاسخ تخصصی: شرایط نگهداری، طول عمر مفید و دمای کارکرد تسمه‌های صنعتی در کوره کاشی چیست؟'
                        )
                      }
                      className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#CBD2D8] hover:border-[#E06518] hover:shadow-sm text-right transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#DEE2E5] group-hover:bg-orange-50 flex items-center justify-center mb-2.5 transition-colors">
                        <HelpCircle className="w-4 h-4 text-[#55565A] group-hover:text-[#E06518]" />
                      </div>
                      <h4 className="font-black text-xs text-[#2B313A] mb-1">
                        پاسخ به سوالات فنی مهندسی
                      </h4>
                      <p className="text-[11px] text-[#55565A] leading-relaxed font-normal">
                        بررسی شرایط حرارتی، تحمل بار و تطبیق کدهای فنی قطعات خطوط تولید
                      </p>
                    </button>
                  </div>
                </div>
              ) : (
                /* ACTIVE CONVERSATION STREAM */
                <div className="flex-1 p-3 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
                  {messages.map(m => (
                    <div
                      key={m.id}
                      className={`flex items-start gap-2.5 sm:gap-3.5 ${
                        m.sender === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm shadow-2xs ${
                          m.sender === 'user'
                            ? 'bg-[#2B313A] text-white'
                            : 'bg-[#DEE2E5] border border-[#CBD2D8] text-[#E06518]'
                        }`}
                      >
                        {m.sender === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <CognivoGeometricLogo className="w-4 h-4 text-[#E06518]" />
                        )}
                      </div>

                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-3xl p-3.5 sm:p-4.5 space-y-2.5 shadow-2xs transition-all ${
                          m.sender === 'user'
                            ? 'bg-[#2B313A] text-white rounded-tr-xs'
                            : 'bg-[#FFFFFF] text-[#55565A] border border-[#CBD2D8] rounded-tl-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] pb-1 border-b border-current/10">
                          <span className="font-bold">
                            {m.sender === 'user' ? 'شما' : 'مشاور فنی هوش مصنوعی FORZA'}
                          </span>
                          <span className="opacity-60">{m.time}</span>
                        </div>

                        <div className="text-xs sm:text-sm leading-relaxed font-normal">
                          {m.sender === 'ai' ? (
                            renderEngineeringMarkdown(m.text, false)
                          ) : (
                            <div className="whitespace-pre-wrap">{m.text}</div>
                          )}
                        </div>

                        {m.suggestedAction && m.suggestedAction.link && (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => navigate(m.suggestedAction!.link!)}
                              className="w-full py-2 px-3 rounded-xl bg-[#DEE2E5] hover:bg-[#E06518] hover:text-white text-[#2B313A] font-bold text-xs flex items-center justify-between border border-[#CBD2D8] transition-colors cursor-pointer"
                            >
                              <span>{m.suggestedAction.label}</span>
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {/* Action Bar (Copy & Feedback) */}
                        {m.sender === 'ai' && (
                          <div className="flex items-center justify-between pt-2 border-t border-[#CBD2D8]/60 text-xs">
                            <div className="text-[11px] text-[#777A7D] font-medium">
                              پاسخ کاتالوگی هایپر صنعت
                            </div>

                            <div className="flex items-center gap-1.5 text-[#55565A]">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(m.text, m.id)}
                                className="p-1 hover:text-[#2B313A] hover:bg-[#DEE2E5] rounded transition-colors flex items-center gap-1"
                                title="کپی متن پاسخ"
                              >
                                {copiedId === m.id ? (
                                  <span className="text-emerald-600 font-bold text-[10px]">کپی شد</span>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span className="text-[10px] hidden sm:inline">کپی</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFeedbackState(prev => ({ ...prev, [m.id]: 'up' }))
                                }
                                className={`p-1 rounded transition-colors ${
                                  feedbackState[m.id] === 'up'
                                    ? 'text-emerald-600'
                                    : 'hover:text-[#2B313A] hover:bg-[#DEE2E5]'
                                }`}
                                title="پاسخ مفید بود"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFeedbackState(prev => ({ ...prev, [m.id]: 'down' }))
                                }
                                className={`p-1 rounded transition-colors ${
                                  feedbackState[m.id] === 'down'
                                    ? 'text-rose-600'
                                    : 'hover:text-[#2B313A] hover:bg-[#DEE2E5]'
                                }`}
                                title="نیاز به بازنگری"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex items-center gap-2.5 p-3.5 bg-[#FFFFFF] rounded-2xl border border-[#CBD2D8] text-xs text-[#E06518] font-bold animate-pulse shadow-2xs">
                      <Sparkles className="w-4 h-4 animate-spin text-[#E06518]" />
                      <span>هوش مصنوعی FORZA در حال پردازش و استخراج پاسخ فنی...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Persistent Bottom Composer Bar */}
              {messages.length > 0 && (
                <div className="p-3 sm:p-4 bg-[#FFFFFF] border-t border-[#CBD2D8] shrink-0">
                  <div className="max-w-4xl mx-auto w-full bg-[#FFFFFF] rounded-2xl border border-[#CBD2D8] p-2.5 sm:p-3 shadow-2xs focus-within:border-[#E06518] focus-within:ring-2 focus-within:ring-orange-500/10">
                    <div className="flex items-end gap-2">
                      <textarea
                        value={inputQuery}
                        onChange={e => setInputQuery(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        rows={2}
                        placeholder="پرسش فنی یا استعلام جدید خود را بنویسید..."
                        className="flex-1 bg-transparent text-xs sm:text-sm text-[#2B313A] placeholder-[#777A7D] resize-none focus:outline-none"
                      />
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setActiveWorkspaceTab('visual_studio')}
                          className="p-2 rounded-xl text-[#55565A] hover:text-[#E06518] hover:bg-[#DEE2E5] transition-colors cursor-pointer"
                          title="شناسایی تصویری قطعه با دوربین"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSend()}
                          disabled={!inputQuery.trim() || loading}
                          className="w-9 h-9 rounded-xl bg-[#E06518] hover:bg-[#C95210] disabled:bg-[#CBD2D8] text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                          title="ارسال"
                        >
                          <Send className="w-4 h-4 -rotate-45" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Disclaimer Footer */}
          <footer className="px-4 sm:px-6 py-2.5 border-t border-[#CBD2D8] bg-[#FFFFFF] flex items-center justify-between text-[11px] text-[#777A7D]">
            <span className="truncate">
              هوش مصنوعی FORZA پاسخ‌ها را بر مبنای کاتالوگ صنعتی اطلس ارائه می‌دهد؛ مشخصات دقیق را قبل از سفارش تطبیق دهید.
            </span>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowCalculatorModal(true)}
                className="hover:text-[#2B313A] transition-colors cursor-pointer flex items-center gap-1 text-[#55565A]"
              >
                <Calculator className="w-3.5 h-3.5 text-[#E06518]" />
                <span className="hidden sm:inline">محاسبه‌گر تسمه</span>
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* Belt Calculator Modal (DIN 2215) with Website Palette */}
      {showCalculatorModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#2B313A]/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFFFF] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#CBD2D8] space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-[#DEE2E5]">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#E06518]" />
                <h3 className="font-black text-sm text-[#2B313A]">
                  فرمول محاسبه طول تسمه (DIN 2215)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCalculatorModal(false)}
                className="p-1 rounded-lg text-[#55565A] hover:text-[#2B313A] hover:bg-[#DEE2E5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#55565A] font-bold block mb-1">
                  فاصله مراکز شفت (C mm):
                </label>
                <input
                  type="number"
                  value={calcC}
                  onChange={e => setCalcC(e.target.value)}
                  className="w-full h-9 px-3 bg-[#F4F4F5] border border-[#CBD2D8] rounded-xl font-mono text-center text-[#2B313A] focus:outline-none focus:border-[#E06518]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#55565A] font-bold block mb-1">پولی بزرگ (D mm):</label>
                  <input
                    type="number"
                    value={calcD}
                    onChange={e => setCalcD(e.target.value)}
                    className="w-full h-9 px-3 bg-[#F4F4F5] border border-[#CBD2D8] rounded-xl font-mono text-center text-[#2B313A] focus:outline-none focus:border-[#E06518]"
                  />
                </div>
                <div>
                  <label className="text-[#55565A] font-bold block mb-1">پولی کوچک (d mm):</label>
                  <input
                    type="number"
                    value={calcd}
                    onChange={e => setCalcd(e.target.value)}
                    className="w-full h-9 px-3 bg-[#F4F4F5] border border-[#CBD2D8] rounded-xl font-mono text-center text-[#2B313A] focus:outline-none focus:border-[#E06518]"
                  />
                </div>
              </div>

              {calcResult && (
                <div className="p-3 bg-[#DEE2E5] border border-[#CBD2D8] rounded-2xl space-y-1.5 text-xs text-[#2B313A]">
                  <div className="flex justify-between">
                    <span className="font-medium text-[#55565A]">طول اسمی تسمه ($L_p$):</span>
                    <span className="font-mono font-black text-[#E06518]">
                      {toPersianDigits(calcResult.length)} mm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-[#55565A]">نسبت دور (Ratio):</span>
                    <span className="font-mono font-bold text-[#2B313A]">
                      ۱ به {toPersianDigits(calcResult.ratio)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCalculatorModal(false);
                      setActiveWorkspaceTab('chat');
                      handleSend(
                        `لطفاً تسمه مناسب با طول نامی ${calcResult.length} میلیمتر و نسبت دور ۱:${calcResult.ratio} را از کاتالوگ هایپر صنعت اطلس پیشنهاد دهید.`
                      );
                    }}
                    className="w-full mt-2 py-2 bg-[#E06518] hover:bg-[#C95210] text-white font-bold rounded-xl text-center cursor-pointer shadow-xs"
                  >
                    ارسال این مقادیر به مشاور FORZA ↵
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal (تنظیمات میزکار FORZA) with Website Palette */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#2B313A]/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFFFF] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#CBD2D8] space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-[#DEE2E5]">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#E06518]" />
                <h3 className="font-black text-sm text-[#2B313A]">تنظیمات میزکار هوشمند FORZA</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-[#55565A] hover:text-[#2B313A] hover:bg-[#DEE2E5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Industry Domain Selection */}
              <div>
                <label className="text-[#55565A] font-bold block mb-1.5">
                  حوزه تخصصی کارخانه یا واحد صنعتی:
                </label>
                <select
                  value={selectedIndustry}
                  onChange={e => setSelectedIndustry(e.target.value)}
                  className="w-full h-10 px-3 bg-[#F4F4F5] border border-[#CBD2D8] rounded-xl font-medium text-[#2B313A] focus:outline-none focus:border-[#E06518]"
                >
                  {INDUSTRY_DOMAINS.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#777A7D] mt-1">
                  پاسخ‌های هوش مصنوعی با اولویت استانداردهای این حوزه ارائه می‌شوند.
                </p>
              </div>

              {/* Standard vs Fast Mode */}
              <div>
                <label className="text-[#55565A] font-bold block mb-1.5">دقت محاسبات مهندسی:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCalculationStandard('din')}
                    className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                      calculationStandard === 'din'
                        ? 'border-[#E06518] bg-[#DEE2E5] text-[#E06518]'
                        : 'border-[#CBD2D8] bg-[#F4F4F5] text-[#55565A]'
                    }`}
                  >
                    استاندارد دقیق DIN 2215
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalculationStandard('fast')}
                    className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                      calculationStandard === 'fast'
                        ? 'border-[#E06518] bg-[#DEE2E5] text-[#E06518]'
                        : 'border-[#CBD2D8] bg-[#F4F4F5] text-[#55565A]'
                    }`}
                  >
                    استعلام سریع کارگاهی
                  </button>
                </div>
              </div>

              {/* Clear History */}
              <div className="pt-2 border-t border-[#DEE2E5]">
                <button
                  type="button"
                  onClick={clearAllHistory}
                  className="w-full py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>پاک‌سازی کامل تاریخچه گفتگوهای ذخیره‌شده</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-2.5 bg-[#E06518] hover:bg-[#C95210] text-white font-bold rounded-xl text-center cursor-pointer shadow-xs"
              >
                ذخیره و بازگشت به میزکار
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
