import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  FileText, Plus, Trash2, Printer, ArrowLeft, ArrowRight, Save,
  CheckCircle2, Building2, User, MapPin, Wallet, FileSignature,
  Eye, Pencil, Hash, Languages, Sparkles, Receipt, Hotel, UtensilsCrossed, Car,
  Undo2, Redo2, Plane
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Undo/Redo history hook — wraps any state value with a
// bounded history stack (max 20 steps back/forward).
// ─────────────────────────────────────────────────────────────
function useHistoryState(initial) {
  const [state, setState] = useState(initial);
  const past = useRef([]);
  const future = useRef([]);
  const skipNext = useRef(false);
  const [, bump] = useState(0); // force re-render when stacks change without value change

  const set = useCallback((next) => {
    setState((curr) => {
      const resolved = typeof next === 'function' ? next(curr) : next;
      if (!skipNext.current) {
        past.current = [...past.current.slice(-19), curr];
        future.current = [];
      }
      skipNext.current = false;
      bump((n) => n + 1);
      return resolved;
    });
  }, []);

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    setState((curr) => {
      const prev = past.current[past.current.length - 1];
      past.current = past.current.slice(0, -1);
      future.current = [curr, ...future.current].slice(0, 20);
      skipNext.current = true;
      bump((n) => n + 1);
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    setState((curr) => {
      const next = future.current[0];
      future.current = future.current.slice(1);
      past.current = [...past.current.slice(-19), curr];
      skipNext.current = true;
      bump((n) => n + 1);
      return next;
    });
  }, []);

  const reset = useCallback((next) => {
    past.current = [];
    future.current = [];
    setState(next);
    bump((n) => n + 1);
  }, []);

  return {
    value: state,
    set,
    undo,
    redo,
    reset,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}

// ─────────────────────────────────────────────────────────────
// Sample data from the uploaded Abdul Manaf TA Bill (T.R.25-A)
// ─────────────────────────────────────────────────────────────
const SAMPLE = {
  subBillNo: '',
  name: 'T.P Abdul Manaf',
  designation: 'Coastal Police Constable B.No.32',
  payAtTour: '37500',
  headquarters: 'Airport Security Unit, Agatti',
  purpose: 'Aviation security Training Institution CISF Chennai',
  orderRef: 'F.NO.01/04/SB/2025 Pol/284 Dated 24.02.2026 of Superintendent of Police PHQ Kavaratti',
  tourFrom: '26.02.2026 FN',
  tourTo: '17.03.2026 AN',
  approvingAuthority: 'Superintendent of Police',
  approvingOffice: 'UTL, Kavaratti',
  // Journey legs
  legs: [
    { depDateTime: '26/02/2026 1100 hrs', depFrom: 'APSU, Agatti', arrDateTime: '26/02/2026 1200 hrs', arrTo: 'Agatti Jetty', mode: 'Taxi', fare: '400', distance: '6 KM', halt: '', purpose: 'Aviation security Training Institution CISF Chennai' },
    { depDateTime: '26/02/2026 1200 hrs', depFrom: 'Agatti', arrDateTime: '27/02/2026 1000 hrs', arrTo: 'W Island Wharf', mode: 'Ship L/sea', fare: '580', distance: '', halt: '', purpose: '' },
    { depDateTime: '27/02/2026 1030 hrs', depFrom: 'W Island Wharf', arrDateTime: '27/02/2026 1100 hrs', arrTo: 'Ernakulam Lodge', mode: 'Taxi', fare: '450', distance: '10 KM', halt: '', purpose: '' },
    { isHaltRow: true, haltText: 'Halt at Ernakulam from 27.02.2026 FN to 28.02.2026 FN', haltDays: '01 days' },
    { depDateTime: '28/02/2026 0600 hrs', depFrom: 'Ernakulam Lodge', arrDateTime: '28/02/2026 0700 hrs', arrTo: 'EKM Jn. Railway Station', mode: 'Taxi', fare: '450', distance: '10 KM', halt: '', purpose: '' },
    { depDateTime: '28/02/2026 0725 hrs', depFrom: 'EKM Jn. Railway Station', arrDateTime: '28/02/2026 2200 hrs', arrTo: 'Chennai CTL Railway Station', mode: 'Train', fare: '1068', distance: '', halt: '', purpose: '' },
    { depDateTime: '28/02/2026 2200 hrs', depFrom: 'Chennai CTL Railway Station', arrDateTime: '28/02/2026 2300 hrs', arrTo: 'Lodge Chennai', mode: 'Taxi', fare: '500', distance: '15 KM', halt: '', purpose: '' },
    { isHaltRow: true, haltText: 'Halt at Chennai on 28.02.2026 AN to 11.03.2026 FN', haltDays: '11 days' },
    { depDateTime: '11/03/2026 1400 hrs', depFrom: 'Lodge Chennai', arrDateTime: '11/03/2026 1520 hrs', arrTo: 'Chennai CTL Railway Station', mode: 'Taxi', fare: '500', distance: '15 KM', halt: '', purpose: '' },
    { depDateTime: '11/03/2026 1520 hrs', depFrom: 'Chennai CTL Railway Station', arrDateTime: '12/03/2026 0245 hrs', arrTo: 'EKM Jn. Railway Station', mode: 'Train', fare: '1122', distance: '', halt: '', purpose: '' },
    { depDateTime: '12/03/2026 0245 hrs', depFrom: 'EKM Jn. Railway Station', arrDateTime: '12/03/2026 0345 hrs', arrTo: 'Ernakulam Lodge', mode: 'Taxi', fare: '450', distance: '10 KM', halt: '', purpose: '' },
    { isHaltRow: true, haltText: 'Halt at Ernakulam from 12.03.2026 FN to 16.03.2026 AN', haltDays: '05 days' },
    { depDateTime: '16/03/2026 0930 hrs', depFrom: 'Ernakulam Lodge', arrDateTime: '16/03/2026 0930 hrs', arrTo: 'W Island Wharf', mode: 'Taxi', fare: '450', distance: '10 KM', halt: '', purpose: '' },
    { depDateTime: '16/03/2026 1230 hrs', depFrom: 'W Island Wharf', arrDateTime: '17/03/2026 1730 hrs', arrTo: 'Agatti Jetty', mode: 'Ship', fare: '580', distance: '', halt: '', purpose: '' },
    { depDateTime: '17/03/2026 1730 hrs', depFrom: 'Agatti Jetty', arrDateTime: '17/03/2026 1800 hrs', arrTo: 'Residence', mode: 'Taxi', fare: '400', distance: '6 KM', halt: '', purpose: '' },
  ],
  // Hotel stays (DA Section 9)
  hotelStays: [
    { from: '26.02.2026 FN', to: '17.03.2026 AN', hotel: 'Being my food charge', rate: '625', days: '20', amount: '12500' },
    { from: '27.02.2026 FN', to: '28.02.2026 FN', hotel: 'Ernakulam Lodge', rate: '800', days: '01', amount: '800' },
    { from: '28.02.2026 AN', to: '11.03.2026 FN', hotel: 'Lodge Chennai', rate: '800', days: '11', amount: '8800' },
    { from: '12.03.2026 FN', to: '16.03.2026 AN', hotel: 'Royal Four Lodge', rate: '800', days: '05', amount: '4000' },
  ],
  // Hotel-only certificate stays
  hotelCertStays: [
    { from: '27.02.2026 FN', to: '28.02.2026 FN', hotel: 'Ernakulam Lodge', rate: '800', days: '01', amount: '800' },
    { from: '28.02.2026 AN', to: '11.03.2026 FN', hotel: 'Lodge Chennai', rate: '800', days: '11', amount: '8800' },
    { from: '12.03.2026 FN', to: '16.03.2026 AN', hotel: 'Royal Four Lodge', rate: '800', days: '05', amount: '4000' },
  ],
  foodDays: '20',
  foodRate: '625',
  // Transport
  transports: [
    { date: '26.02.2026', from: 'APSU', to: 'Jetty', mode: 'By Taxi', regNo: 'LD-02-3848', km: '6', amount: '400' },
    { date: '27.02.2026', from: 'Ernakulam Wharf', to: 'EKM Lodge', mode: 'By Taxi', regNo: 'KL.07.CH8899', km: '10', amount: '450' },
    { date: '28.02.2026', from: 'EKM Lodge', to: 'EKM Railway Station', mode: 'By Taxi', regNo: 'KL.07.CH8899', km: '3', amount: '450' },
    { date: '28.02.2026', from: 'Chennai Railway Station', to: 'Chennai Lodge', mode: 'By Taxi', regNo: 'TN-32-AL-4138', km: '15', amount: '500' },
    { date: '11.03.2026', from: 'Chennai Lodge', to: 'Chennai Railway Station', mode: 'By Taxi', regNo: 'TN-32-AL-5253', km: '15', amount: '500' },
    { date: '12.03.2026', from: 'EKM Railway Station', to: 'EKM Lodge', mode: 'By Taxi', regNo: 'KL.07.CH6459', km: '10', amount: '450' },
    { date: '16.03.2026', from: 'EKM Lodge', to: 'Ernakulam Wharf', mode: 'By Taxi', regNo: 'KL.07.CH1150', km: '10', amount: '450' },
    { date: '17.03.2026', from: 'Agatti Jetty', to: 'Residence', mode: 'By Taxi', regNo: 'LD-02-3848', km: '6', amount: '400' },
  ],
  advance: '',
  declarationDate: '17.03.2026',
};

// ─────────────────────────────────────────────────────────────
// LTC Advance — sample data
// ─────────────────────────────────────────────────────────────
const LTC_SAMPLE = {
  name: 'T.P Abdul Manaf',
  designation: 'Coastal Police Constable B.No.32',
  payAtTour: '37500',
  headquarters: 'Airport Security Unit, Agatti',
  ltcBlockYear: '2025-2026',
  homeTownDeclared: 'Kozhikode, Kerala',
  destinationDeclared: 'Kozhikode, Kerala (Home Town)',
  familyMembers: [
    { name: 'Fathima Manaf', relation: 'Wife', age: '34' },
    { name: 'Ayesha Manaf', relation: 'Daughter', age: '9' },
    { name: 'Yusuf Manaf', relation: 'Son', age: '5' },
  ],
  modeOfTravel: 'Air / Train (Shortest route)',
  fromStation: 'Agatti',
  toStation: 'Kozhikode',
  proposedDeparture: '10.07.2026',
  proposedReturn: '24.07.2026',
  classEntitled: 'Economy (Air) / AC III Tier (Rail)',
  estimatedFareSelf: '9500',
  estimatedFareFamily: '21400',
  advanceRequired: '24000',
  lastLtcAvailed: 'Hometown LTC availed in 2023-2024 block',
  declarationDate: '23.06.2026',
};


// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const num = (v) => {
  const n = parseFloat(String(v || '').replace(/[^\d.-]/g, ''));
  return isNaN(n) ? 0 : n;
};

const fmtRs = (n) => {
  if (n === 0 || !n) return '';
  return n.toLocaleString('en-IN');
};

// Convert a number to Indian-style words (for the certificate)
const numToWords = (num) => {
  if (!num || num === 0) return 'Zero';
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n/10)] + (n%10 ? ' ' + a[n%10] : '');
    if (n < 1000) return a[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' and ' + inWords(n%100) : '');
    if (n < 100000) return inWords(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + inWords(n%1000) : '');
    if (n < 10000000) return inWords(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' ' + inWords(n%100000) : '');
    return inWords(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' ' + inWords(n%10000000) : '');
  };
  return inWords(Math.floor(num));
};

// ─────────────────────────────────────────────────────────────
// Translations (English + Malayalam)
// ─────────────────────────────────────────────────────────────
const T = {
  en: {
    appName: 'Smart Bill',
    tagline: 'Government Document Compiler',
    newBill: 'New Bill',
    dashboard: 'Dashboard',
    drafts: 'Drafts',
    history: 'History',
    templates: 'Templates',
    settings: 'Settings',
    preview: 'Preview & Print',
    edit: 'Edit',
    print: 'Print / Save as PDF',
    next: 'Next',
    back: 'Back',
    saveDraft: 'Save Draft',
    employee: 'Officer Details',
    journey: 'Journey Details',
    expenses: 'Expenses & DA',
    transport: 'Local Transport',
    review: 'Review & Generate',
    loadSample: 'Load sample data',
    clearAll: 'Clear all',
    logout: 'Sign out',
    undo: 'Undo',
    redo: 'Redo',
    chooseBillType: 'What would you like to create?',
    taBillTitle: 'Tour (TA) Bill',
    taBillDesc: 'T.R.25-A — full 6-document packet for official tours',
    ltcBillTitle: 'LTC Advance',
    ltcBillDesc: 'Leave Travel Concession advance request for self & family',
    comingSoon: 'Coming soon',
  },
  ml: {
    appName: 'Smart Bill',
    tagline: 'സ്മാർട്ട് ഗവൺമെന്റ് ഡോക്യുമെന്റ് ടൂൾ',
    newBill: 'പുതിയ ബിൽ',
    dashboard: 'ഡാഷ്‌ബോർഡ്',
    drafts: 'കരടുകൾ',
    history: 'ചരിത്രം',
    templates: 'ടെംപ്ലേറ്റുകൾ',
    settings: 'ക്രമീകരണങ്ങൾ',
    preview: 'പ്രിവ്യൂ & പ്രിന്റ്',
    edit: 'എഡിറ്റ്',
    print: 'പ്രിന്റ് / PDF',
    next: 'അടുത്തത്',
    back: 'പുറകോട്ട്',
    saveDraft: 'കരട് സേവ് ചെയ്യുക',
    employee: 'ഓഫീസർ വിവരങ്ങൾ',
    journey: 'യാത്രാ വിവരങ്ങൾ',
    expenses: 'ചെലവുകൾ & DA',
    transport: 'പ്രാദേശിക ഗതാഗതം',
    review: 'അവലോകനം & തയ്യാറാക്കുക',
    loadSample: 'സാമ്പിൾ ഡാറ്റ',
    clearAll: 'എല്ലാം മായ്ക്കുക',
    logout: 'പുറത്തുകടക്കുക',
    undo: 'അൺഡു',
    redo: 'റീഡു',
    chooseBillType: 'നിങ്ങൾ എന്താണ് സൃഷ്ടിക്കാൻ ആഗ്രഹിക്കുന്നത്?',
    taBillTitle: 'ടൂർ (TA) ബിൽ',
    taBillDesc: 'T.R.25-A — ഔദ്യോഗിക യാത്രകൾക്കുള്ള 6 രേഖകൾ',
    ltcBillTitle: 'LTC അഡ്വാൻസ്',
    ltcBillDesc: 'സ്വയം & കുടുംബത്തിനായുള്ള യാത്രാ ആനുകൂല്യ അഡ്വാൻസ്',
    comingSoon: 'ഉടൻ വരുന്നു',
  },
};

// ─────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState('en');
  const [view, setView] = useState('dashboard'); // dashboard | chooseType | new | newLtc | preview | previewLtc | drafts | history
  const taHistory = useHistoryState(SAMPLE);
  const ltcHistory = useHistoryState(LTC_SAMPLE);
  const [step, setStep] = useState(0);
  const t = T[lang];

  // ── Drafts: persisted via browser localStorage so they survive reloads ──
  const DRAFTS_KEY = 'smartbill:drafts';
  const [drafts, setDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [draftStatus, setDraftStatus] = useState(''); // transient "Saved!" message

  const loadDrafts = useCallback(() => {
    setDraftsLoading(true);
    try {
      const raw = localStorage.getItem(DRAFTS_KEY);
      const loaded = raw ? JSON.parse(raw) : [];
      loaded.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setDrafts(loaded);
    } catch (e) {
      setDrafts([]); // storage unavailable, corrupted, or private-browsing mode — fail quiet
    } finally {
      setDraftsLoading(false);
    }
  }, []);

  useEffect(() => { loadDrafts(); }, [loadDrafts]);

  const saveDraft = useCallback((type) => {
    const id = `${type}-${Date.now()}`;
    const payload = type === 'ta' ? taHistory.value : ltcHistory.value;
    const draft = {
      id,
      type,
      name: payload.name || 'Unnamed officer',
      summary: type === 'ta' ? (payload.purpose || '') : `${payload.fromStation || ''} → ${payload.toStation || ''}`,
      updatedAt: Date.now(),
      data: payload,
    };
    try {
      const raw = localStorage.getItem(DRAFTS_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      existing.push(draft);
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(existing));
      setDraftStatus('Draft saved');
      loadDrafts();
    } catch (e) {
      setDraftStatus('Could not save — your browser may be blocking storage');
    }
    setTimeout(() => setDraftStatus(''), 2500);
  }, [taHistory.value, ltcHistory.value, loadDrafts]);

  const openDraft = useCallback((draft) => {
    if (draft.type === 'ta') {
      taHistory.reset(draft.data);
      setStep(0);
      setView('new');
    } else {
      ltcHistory.reset(draft.data);
      setStep(0);
      setView('newLtc');
    }
  }, [taHistory, ltcHistory]);

  const deleteDraft = useCallback((id) => {
    try {
      const raw = localStorage.getItem(DRAFTS_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(existing.filter(d => d.id !== id)));
      loadDrafts();
    } catch (e) { /* ignore */ }
  }, [loadDrafts]);

  // Global Ctrl+Z / Ctrl+Shift+Z keyboard shortcuts for whichever form is active
  useEffect(() => {
    const handler = (e) => {
      const isFormView = view === 'new' || view === 'newLtc';
      if (!isFormView) return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const active = view === 'new' ? taHistory : ltcHistory;
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        active.undo();
      } else if ((e.key.toLowerCase() === 'z' && e.shiftKey) || e.key.toLowerCase() === 'y') {
        e.preventDefault();
        active.redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view, taHistory, ltcHistory]);

  if (!user) return <LoginScreen onLogin={setUser} lang={lang} setLang={setLang} t={t} />;

  return (
    <div style={{ fontFamily: "'Manrope', system-ui, sans-serif" }} className="min-h-screen bg-stone-50">
      <style>{`
        :root {
          --ink: #0B1F33;
          --ink-soft: #1E3A52;
          --paper: #FAF7F1;
          --paper-soft: #F4EFE5;
          --saffron: #C7541E;
          --gold: #B8893B;
          --line: #D9D2C2;
        }

        .serif { font-family: 'Fraunces', Georgia, serif; }
        .gov-doc {
          font-family: 'Tinos', 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.35;
          color: #000;
        }
        .gov-doc table { border-collapse: collapse; width: 100%; }
        .gov-doc td, .gov-doc th { border: 1px solid #000; padding: 4px 5px; vertical-align: top; font-size: 10.5pt; }
        .gov-doc .filled { font-weight: bold; }

        /* Paper sheet styling */
        .paper-sheet {
          width: 210mm;
          min-height: 297mm;
          padding: 18mm 18mm 18mm 20mm;
          margin: 0 auto 12px;
          background: white;
          box-shadow: 0 6px 28px rgba(15,30,50,0.12), 0 1px 3px rgba(0,0,0,0.06);
          position: relative;
        }

        @media screen {
          .paper-sheet::before {
            content: '';
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: linear-gradient(180deg, rgba(0,0,0,0.015) 0%, rgba(0,0,0,0) 50%);
          }
        }

        @media print {
          @page { size: A4; margin: 14mm 16mm 14mm 18mm; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .paper-sheet { box-shadow: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; min-height: auto !important; page-break-after: always; }
          .paper-sheet:last-child { page-break-after: auto; }
          .no-print { display: none !important; }
        }

        .underline-dots { border-bottom: 1px dotted #444; display: inline-block; min-width: 80px; padding: 0 2px; }
        .sig-line { border-top: 1px solid #000; display: inline-block; min-width: 200px; padding-top: 2px; }

        input:focus, textarea:focus, select:focus { outline: 2px solid var(--saffron); outline-offset: 1px; }

        .ink-btn {
          background: var(--ink);
          color: white;
          padding: 10px 18px;
          border-radius: 6px;
          font-weight: 600;
          transition: all 0.15s;
          font-size: 14px;
          letter-spacing: 0.01em;
        }
        .ink-btn:hover { background: var(--ink-soft); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(11,31,51,0.25); }
        .ink-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

        .ghost-btn {
          background: transparent;
          color: var(--ink);
          padding: 9px 16px;
          border-radius: 6px;
          font-weight: 500;
          border: 1px solid var(--line);
          font-size: 14px;
        }
        .ghost-btn:hover { background: var(--paper-soft); border-color: var(--ink); }
        .ghost-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .ghost-btn:disabled:hover { background: transparent; border-color: var(--line); }

        .icon-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 34px; height: 34px;
          border-radius: 6px;
          border: 1px solid var(--line);
          background: white;
          color: var(--ink);
          transition: all 0.15s;
        }
        .icon-btn:hover:not(:disabled) { background: var(--paper-soft); border-color: var(--ink); }
        .icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .field-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #5B6B7C;
          margin-bottom: 6px;
          display: block;
        }
        .field-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--line);
          border-radius: 6px;
          background: white;
          font-size: 14px;
          font-family: inherit;
          color: var(--ink);
        }
        .field-input:hover { border-color: #A8A091; }

        .step-pill {
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .emblem {
          width: 44px; height: 44px;
          background: var(--ink);
          color: white;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Fraunces', serif; font-weight: 700; font-size: 22px;
          border-radius: 6px;
          position: relative;
        }
        .emblem::after {
          content: ''; position: absolute; inset: -3px;
          border: 1px solid var(--gold); border-radius: 8px;
          pointer-events: none;
        }

        .stat-card {
          background: white; border: 1px solid var(--line);
          padding: 22px 22px; border-radius: 10px;
          transition: all 0.2s;
        }
        .stat-card:hover { border-color: var(--ink); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(11,31,51,0.08); }

        .doc-card {
          background: white; border: 1px solid var(--line); border-left: 3px solid var(--saffron);
          padding: 18px 22px; border-radius: 8px; cursor: pointer;
          transition: all 0.15s;
        }
        .doc-card:hover { transform: translateX(2px); box-shadow: 0 4px 16px rgba(11,31,51,0.08); }

        .bill-type-card {
          background: white; border: 1px solid var(--line);
          padding: 28px; border-radius: 12px; cursor: pointer;
          transition: all 0.2s; text-align: left;
        }
        .bill-type-card:hover { border-color: var(--ink); transform: translateY(-2px); box-shadow: 0 10px 28px rgba(11,31,51,0.1); }
        .bill-type-card:disabled, .bill-type-card.disabled { cursor: not-allowed; opacity: 0.55; }
        .bill-type-card.disabled:hover { transform: none; box-shadow: none; border-color: var(--line); }

        .table-row-input { border: 1px solid var(--line); border-radius: 4px; padding: 6px 8px; font-size: 13px; width: 100%; }
        .table-row-input:focus { border-color: var(--saffron); }
      `}</style>

      {view === 'preview' ? (
        <PreviewScreen data={taHistory.value} onBack={() => setView('new')} />
      ) : view === 'previewLtc' ? (
        <LtcPreviewScreen data={ltcHistory.value} onBack={() => setView('newLtc')} />
      ) : (
        <Shell user={user} setUser={setUser} t={t} lang={lang} setLang={setLang} view={view} setView={setView} draftCount={drafts.length}>
          {view === 'dashboard' && <Dashboard t={t} setView={setView} draftCount={drafts.length} />}
          {view === 'chooseType' && <ChooseBillType t={t} setView={setView} />}
          {view === 'new' && (
            <BillForm
              hist={taHistory}
              step={step}
              setStep={setStep}
              onPreview={() => setView('preview')}
              onSaveDraft={() => saveDraft('ta')}
              draftStatus={draftStatus}
              t={t}
            />
          )}
          {view === 'newLtc' && (
            <LtcBillForm
              hist={ltcHistory}
              step={step}
              setStep={setStep}
              onPreview={() => setView('previewLtc')}
              onSaveDraft={() => saveDraft('ltc')}
              draftStatus={draftStatus}
              t={t}
            />
          )}
          {(view === 'drafts' || view === 'history') && (
            <DraftsView
              drafts={drafts}
              loading={draftsLoading}
              onOpen={openDraft}
              onDelete={deleteDraft}
              mode={view}
              t={t}
            />
          )}
        </Shell>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Choose bill type screen
// ─────────────────────────────────────────────────────────────
function ChooseBillType({ t, setView }) {
  return (
    <div className="p-10 max-w-4xl">
      <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, color: 'var(--ink)', marginBottom: 8 }}>
        {t.chooseBillType}
      </h1>
      <p style={{ color: '#5B6B7C', fontSize: 14, marginBottom: 32 }}>
        Pick a document type. Each one generates a full, signature-ready packet in official format.
      </p>
      <div className="grid grid-cols-2 gap-5">
        <button className="bill-type-card" onClick={() => setView('new')}>
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--ink)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20}/>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--saffron)' }}>T.R.25-A</span>
          </div>
          <div className="serif" style={{ fontSize: 19, fontWeight: 600, color: 'var(--ink)' }}>{t.taBillTitle}</div>
          <div style={{ fontSize: 13, color: '#5B6B7C', marginTop: 6, lineHeight: 1.5 }}>{t.taBillDesc}</div>
        </button>

        <button className="bill-type-card" onClick={() => setView('newLtc')}>
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--gold)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plane size={20}/>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--gold)' }}>LTC</span>
          </div>
          <div className="serif" style={{ fontSize: 19, fontWeight: 600, color: 'var(--ink)' }}>{t.ltcBillTitle}</div>
          <div style={{ fontSize: 13, color: '#5B6B7C', marginTop: 6, lineHeight: 1.5 }}>{t.ltcBillDesc}</div>
        </button>

        {['Medical Reimbursement', 'EL Leave Application', 'CL Leave Application', 'Joining Report'].map((name, i) => (
          <div key={i} className="bill-type-card disabled">
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 44, height: 44, borderRadius: 8, background: '#E5DFD0', color: '#A8A091', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSignature size={20}/>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#A8A091' }}>{t.comingSoon}</span>
            </div>
            <div className="serif" style={{ fontSize: 19, fontWeight: 600, color: '#8C8475' }}>{name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, lang, setLang, t }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [method, setMethod] = useState('mobile');

  return (
    <div style={{ fontFamily: "'Manrope', system-ui, sans-serif" }} className="min-h-screen flex items-stretch bg-stone-100">
      {/* Left side - branding */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0B1F33 0%, #1E3A52 100%)' }}>
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 18px)'
        }}/>
        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div style={{ width: 48, height: 48, background: '#B8893B', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 26, color: '#0B1F33' }}>S</span>
            </div>
            <div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: 'white', fontWeight: 600, lineHeight: 1 }}>Smart <span style={{ color: '#B8893B' }}>Bill</span></div>
              <div style={{ fontSize: 11, color: '#9BAEC0', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>Document Compiler</div>
            </div>
          </div>

          <div className="max-w-md">
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 44, lineHeight: 1.1, color: 'white', fontWeight: 500, letterSpacing: '-0.01em' }}>
              Type once.<br/>
              <span style={{ color: '#D9C39B' }}>Print the whole packet.</span>
            </h1>
            <p style={{ color: '#9BAEC0', marginTop: 24, lineHeight: 1.6, fontSize: 15 }}>
              One TA Bill entry generates all six documents — Bill, Tour Program, Certificates, Hotel,
              Food and Transport — in exact T.R.25-A format. Ready to sign and submit.
            </p>
          </div>
        </div>

        <div className="relative">
          <div style={{ borderTop: '1px solid rgba(184,137,59,0.3)', paddingTop: 20 }}>
            <div className="flex items-center gap-6 text-xs" style={{ color: '#9BAEC0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              <span>● Pixel-perfect</span>
              <span>● Bilingual</span>
              <span>● Offline-ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex items-center gap-2 mb-10">
            <div style={{ width: 40, height: 40, background: '#0B1F33', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 22, color: '#B8893B' }}>S</span>
            </div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 600 }}>Smart <span style={{ color: '#C7541E' }}>Bill</span></div>
          </div>

          <div className="flex justify-end mb-6">
            <button
              onClick={() => setLang(lang === 'en' ? 'ml' : 'en')}
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: '#5B6B7C' }}
            >
              <Languages size={14}/> {lang === 'en' ? 'മലയാളം' : 'English'}
            </button>
          </div>

          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 500, color: '#0B1F33', letterSpacing: '-0.01em' }}>Sign in</h2>
          <p style={{ color: '#5B6B7C', fontSize: 14, marginTop: 6, marginBottom: 32 }}>
            No employee ID required. Just your name and a way to reach you.
          </p>

          <div className="flex gap-1 p-1 rounded-lg mb-5" style={{ background: '#F4EFE5' }}>
            <button
              onClick={() => setMethod('mobile')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all ${method === 'mobile' ? 'bg-white shadow-sm' : ''}`}
              style={{ color: method === 'mobile' ? '#0B1F33' : '#5B6B7C' }}
            >
              Mobile
            </button>
            <button
              onClick={() => setMethod('email')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all ${method === 'email' ? 'bg-white shadow-sm' : ''}`}
              style={{ color: method === 'email' ? '#0B1F33' : '#5B6B7C' }}
            >
              Gmail
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="field-label">Full name</label>
              <input className="field-input" placeholder="As it appears on official records" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="field-label">{method === 'mobile' ? 'Mobile number' : 'Gmail address'}</label>
              <input
                className="field-input"
                type={method === 'mobile' ? 'tel' : 'email'}
                placeholder={method === 'mobile' ? '10-digit mobile' : 'name@gmail.com'}
                value={contact}
                onChange={e => setContact(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={() => onLogin({ name: name || 'Demo User', contact: contact || 'demo@smartbill.in' })}
            className="ink-btn w-full mt-6"
          >
            Continue
          </button>

          <button
            onClick={() => onLogin({ name: 'Guest Officer', contact: 'guest' })}
            className="w-full mt-3 text-sm font-medium py-2"
            style={{ color: '#5B6B7C' }}
          >
            Continue as guest →
          </button>

          <p className="text-xs mt-10 leading-relaxed" style={{ color: '#7C8B9C' }}>
            By continuing you confirm you are entering accurate information for an official tour bill.
            Drafts are stored on this device only.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// App Shell with sidebar
// ─────────────────────────────────────────────────────────────
function Shell({ children, user, setUser, t, lang, setLang, view, setView, draftCount = 0 }) {
  const navItems = [
    { key: 'dashboard', label: t.dashboard, icon: Building2 },
    { key: 'chooseType', label: t.newBill, icon: FileText, matches: ['chooseType', 'new', 'newLtc'] },
    { key: 'drafts', label: t.drafts, icon: Save, badge: draftCount > 0 ? draftCount : null },
    { key: 'history', label: t.history, icon: Receipt },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r flex flex-col" style={{ background: 'white', borderColor: 'var(--line)' }}>
        <div className="p-5 border-b" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2.5">
            <div className="emblem">S</div>
            <div>
              <div className="serif" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1, color: 'var(--ink)' }}>
                Smart <span style={{ color: 'var(--saffron)' }}>Bill</span>
              </div>
              <div style={{ fontSize: 10, color: '#7C8B9C', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 3 }}>
                {t.tagline}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = item.matches ? item.matches.includes(view) : view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all"
                style={{
                  background: active ? 'var(--ink)' : 'transparent',
                  color: active ? 'white' : 'var(--ink)',
                }}
              >
                <span className="flex items-center gap-3">
                  <Icon size={16}/>
                  {item.label}
                </span>
                {item.badge && (
                  <span style={{
                    fontSize: 11, padding: '1px 7px', borderRadius: 999,
                    background: active ? 'rgba(255,255,255,0.15)' : 'var(--paper-soft)',
                    color: active ? 'white' : '#7C8B9C'
                  }}>{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
          <button
            onClick={() => setLang(lang === 'en' ? 'ml' : 'en')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium"
            style={{ color: '#5B6B7C' }}
          >
            <Languages size={14}/> {lang === 'en' ? 'മലയാളം' : 'English'}
          </button>
          <div className="mt-2 px-3 py-2.5 rounded-md flex items-center gap-2.5" style={{ background: 'var(--paper-soft)' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--ink)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: 'var(--ink)' }}>{user.name}</div>
              <button onClick={() => setUser(null)} className="text-xs" style={{ color: '#7C8B9C' }}>Sign out</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--paper)' }}>
        {children}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────
function Dashboard({ t, setView, draftCount = 0 }) {
  return (
    <div className="p-10 max-w-6xl">
      <div className="mb-10">
        <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--saffron)' }}>
          Welcome back
        </div>
        <h1 className="serif" style={{ fontSize: 40, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
          Your office, simplified.
        </h1>
        <p style={{ color: '#5B6B7C', marginTop: 10, maxWidth: 580, fontSize: 15, lineHeight: 1.6 }}>
          Every document you generate is print-perfect, signature-ready and matches the T.R.25-A format down to the column borders.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total bills', value: '47', sub: 'Sample · +12 this month', tone: 'ink' },
          { label: 'Drafts', value: String(draftCount), sub: draftCount > 0 ? 'saved on this device' : 'none saved yet', tone: 'gold' },
          { label: 'This quarter', value: '₹2.4L', sub: 'Sample · TA disbursed', tone: 'saffron' },
          { label: 'Time saved', value: '38 hrs', sub: 'Sample · vs manual typing', tone: 'ink' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7C8B9C' }}>
              {s.label}
            </div>
            <div className="serif mt-2" style={{ fontSize: 32, fontWeight: 600, color: 'var(--ink)', lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: '#5B6B7C', marginTop: 6 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* CTA + recent */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="rounded-xl p-7 relative overflow-hidden" style={{ background: 'var(--ink)', color: 'white' }}>
            <div className="absolute -right-8 -top-8 opacity-20">
              <FileText size={140} strokeWidth={1}/>
            </div>
            <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#B8893B' }}>
              T.R.25-A
            </div>
            <h3 className="serif" style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, marginBottom: 8 }}>
              Start a new Tour Bill
            </h3>
            <p style={{ fontSize: 13, color: '#9BAEC0', lineHeight: 1.5, marginBottom: 20 }}>
              Generates all 6 attached documents in one go.
            </p>
            <button
              onClick={() => setView('chooseType')}
              className="inline-flex items-center gap-2 text-sm font-semibold py-2.5 px-4 rounded-md"
              style={{ background: '#B8893B', color: '#0B1F33' }}
            >
              Begin <ArrowRight size={14}/>
            </button>
          </div>
        </div>

        <div className="col-span-2">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h3 className="serif" style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>Recent bills</h3>
              <div style={{ fontSize: 11, color: '#9BA6B2', marginTop: 2 }}>Sample preview — your real saved bills appear under History</div>
            </div>
            <button onClick={() => setView('history')} className="text-xs font-semibold" style={{ color: 'var(--saffron)', letterSpacing: '0.05em' }}>VIEW ALL →</button>
          </div>
          <div className="space-y-2">
            {[
              { name: 'T.P Abdul Manaf', purpose: 'CISF Training, Chennai', date: '17.03.2026', amount: '42,170', status: 'submitted' },
              { name: 'M. Saleem', purpose: 'PHQ Meeting, Kavaratti', date: '08.03.2026', amount: '18,400', status: 'approved' },
              { name: 'V. Ramesh', purpose: 'Inspection, Minicoy', date: '02.03.2026', amount: '24,800', status: 'paid' },
            ].map((b, i) => (
              <div key={i} className="doc-card flex items-center justify-between">
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: '#5B6B7C', marginTop: 2 }}>{b.purpose}</div>
                </div>
                <div className="text-right">
                  <div className="serif" style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>₹{b.amount}</div>
                  <div style={{ fontSize: 11, color: '#7C8B9C', marginTop: 2 }}>{b.date} · {b.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Drafts / History view
// ─────────────────────────────────────────────────────────────
function DraftsView({ drafts, loading, onOpen, onDelete, mode, t }) {
  const title = mode === 'drafts' ? t.drafts : t.history;
  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-10 max-w-4xl">
      <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, color: 'var(--ink)', marginBottom: 8 }}>
        {title}
      </h1>
      <p style={{ color: '#5B6B7C', fontSize: 14, marginBottom: 28 }}>
        {mode === 'drafts'
          ? 'Bills you saved partway through. Pick up exactly where you left off.'
          : 'Every bill you have saved, most recent first.'}
      </p>

      {loading ? (
        <div className="rounded-lg border p-10 text-center" style={{ borderColor: 'var(--line)', background: 'white' }}>
          <div style={{ fontSize: 13, color: '#7C8B9C' }}>Loading saved drafts…</div>
        </div>
      ) : drafts.length === 0 ? (
        <div className="rounded-lg border p-10 text-center" style={{ borderColor: 'var(--line)', background: 'white' }}>
          <FileText size={28} style={{ color: '#C9C2B0', margin: '0 auto 12px' }}/>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>No drafts yet</div>
          <div style={{ fontSize: 13, color: '#7C8B9C', marginTop: 4 }}>
            Click "Save draft" while filling in a bill, and it will show up here.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {drafts.map((d) => (
            <div key={d.id} className="doc-card flex items-center justify-between">
              <button onClick={() => onOpen(d)} className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                      padding: '2px 8px', borderRadius: 999,
                      background: d.type === 'ta' ? 'var(--paper-soft)' : '#FEF3E2',
                      color: d.type === 'ta' ? 'var(--ink)' : 'var(--gold)',
                    }}
                  >
                    {d.type === 'ta' ? 'TA Bill' : 'LTC'}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{d.name}</span>
                </div>
                {d.summary && <div style={{ fontSize: 12, color: '#5B6B7C', marginTop: 4 }}>{d.summary}</div>}
                <div style={{ fontSize: 11, color: '#9BA6B2', marginTop: 4 }}>Saved {formatDate(d.updatedAt)}</div>
              </button>
              <div className="flex items-center gap-2 pl-3">
                <button onClick={() => onOpen(d)} className="ghost-btn flex items-center gap-1.5" style={{ padding: '7px 12px' }}>
                  <Pencil size={13}/> Open
                </button>
                <button
                  onClick={() => onDelete(d.id)}
                  className="icon-btn"
                  style={{ borderColor: '#F1D5D5', color: '#B91C1C' }}
                  title="Delete draft"
                >
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bill Form (Multi-step)
// ─────────────────────────────────────────────────────────────
function BillForm({ hist, step, setStep, onPreview, onSaveDraft, draftStatus, t }) {
  const data = hist.value;
  const setData = hist.set;
  const steps = [
    { label: t.employee, icon: User },
    { label: t.journey, icon: MapPin },
    { label: t.expenses, icon: Wallet },
    { label: t.transport, icon: Car },
    { label: t.review, icon: FileSignature },
  ];

  const update = (k, v) => setData({ ...data, [k]: v });

  return (
    <div className="max-w-5xl mx-auto p-10">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h1 className="serif" style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)' }}>
            New Tour Bill <span style={{ color: '#7C8B9C', fontSize: 16, fontWeight: 400 }}>· T.R.25-A</span>
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={hist.undo}
              disabled={!hist.canUndo}
              className="icon-btn"
              title={`${t.undo} (Ctrl+Z)`}
            >
              <Undo2 size={15}/>
            </button>
            <button
              onClick={hist.redo}
              disabled={!hist.canRedo}
              className="icon-btn"
              title={`${t.redo} (Ctrl+Shift+Z)`}
            >
              <Redo2 size={15}/>
            </button>
            <button
              onClick={() => hist.reset(SAMPLE)}
              className="text-xs font-semibold tracking-wider uppercase ml-2"
              style={{ color: 'var(--saffron)' }}
            >
              <Sparkles size={12} className="inline mr-1"/> Load sample
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const active = step === i;
            const done = step > i;
            return (
              <React.Fragment key={i}>
                <button
                  onClick={() => setStep(i)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                  style={{
                    background: active ? 'var(--ink)' : done ? 'var(--paper-soft)' : 'transparent',
                    color: active ? 'white' : done ? 'var(--ink)' : '#7C8B9C',
                    border: '1px solid',
                    borderColor: active ? 'var(--ink)' : 'var(--line)'
                  }}
                >
                  {done ? <CheckCircle2 size={14}/> : <Icon size={14}/>}
                  <span>{s.label}</span>
                </button>
                {i < steps.length - 1 && <div className="flex-1 h-px" style={{ background: 'var(--line)' }}/>}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-8" style={{ borderColor: 'var(--line)' }}>
        {step === 0 && <StepEmployee data={data} update={update}/>}
        {step === 1 && <StepJourney data={data} setData={setData}/>}
        {step === 2 && <StepExpenses data={data} setData={setData}/>}
        {step === 3 && <StepTransport data={data} setData={setData}/>}
        {step === 4 && <StepReview data={data}/>}

        <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="ghost-btn flex items-center gap-2"
              style={{ opacity: step === 0 ? 0.4 : 1 }}
            >
              <ArrowLeft size={14}/> Back
            </button>
            {draftStatus && (
              <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: draftStatus.includes('not') ? '#B91C1C' : '#2F7D4F' }}>
                <CheckCircle2 size={13}/> {draftStatus}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onSaveDraft} className="ghost-btn flex items-center gap-2">
              <Save size={14}/> Save draft
            </button>
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(step + 1)} className="ink-btn flex items-center gap-2">
                Next <ArrowRight size={14}/>
              </button>
            ) : (
              <button onClick={onPreview} className="ink-btn flex items-center gap-2">
                <Eye size={14}/> Preview & Print
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 0: Employee ──────────
function StepEmployee({ data, update }) {
  return (
    <div>
      <h2 className="serif" style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)' }}>Officer Details</h2>
      <p style={{ color: '#5B6B7C', fontSize: 14, marginTop: 4, marginBottom: 24 }}>
        These details fill the header of the bill and all attached certificates.
      </p>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className="field-label">Sub-bill No</label>
          <input className="field-input" placeholder="optional" value={data.subBillNo} onChange={e => update('subBillNo', e.target.value)}/>
        </div>
        <div>
          <label className="field-label">Name</label>
          <input className="field-input" value={data.name} onChange={e => update('name', e.target.value)}/>
        </div>
        <div>
          <label className="field-label">Designation</label>
          <input className="field-input" value={data.designation} onChange={e => update('designation', e.target.value)}/>
        </div>
        <div>
          <label className="field-label">Pay at time of tour (₹)</label>
          <input className="field-input" value={data.payAtTour} onChange={e => update('payAtTour', e.target.value)}/>
        </div>
        <div className="col-span-2">
          <label className="field-label">Headquarters</label>
          <input className="field-input" value={data.headquarters} onChange={e => update('headquarters', e.target.value)}/>
        </div>
        <div className="col-span-2">
          <label className="field-label">Purpose of journey</label>
          <input className="field-input" value={data.purpose} onChange={e => update('purpose', e.target.value)}/>
        </div>
        <div className="col-span-2">
          <label className="field-label">Order reference</label>
          <textarea
            className="field-input"
            rows={2}
            value={data.orderRef}
            onChange={e => update('orderRef', e.target.value)}
            placeholder="F.No. / Date / Authority"
          />
        </div>
        <div>
          <label className="field-label">Tour from</label>
          <input className="field-input" value={data.tourFrom} onChange={e => update('tourFrom', e.target.value)} placeholder="DD.MM.YYYY FN/AN"/>
        </div>
        <div>
          <label className="field-label">Tour to</label>
          <input className="field-input" value={data.tourTo} onChange={e => update('tourTo', e.target.value)} placeholder="DD.MM.YYYY FN/AN"/>
        </div>
        <div>
          <label className="field-label">Approving authority</label>
          <input className="field-input" value={data.approvingAuthority} onChange={e => update('approvingAuthority', e.target.value)}/>
        </div>
        <div>
          <label className="field-label">Approving office</label>
          <input className="field-input" value={data.approvingOffice} onChange={e => update('approvingOffice', e.target.value)}/>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Journey ──────────
function StepJourney({ data, setData }) {
  const addLeg = () => setData({
    ...data,
    legs: [...data.legs, { depDateTime: '', depFrom: '', arrDateTime: '', arrTo: '', mode: '', fare: '', distance: '', halt: '', purpose: '' }]
  });
  const addHalt = () => setData({
    ...data,
    legs: [...data.legs, { isHaltRow: true, haltText: '', haltDays: '' }]
  });
  const removeLeg = (i) => setData({ ...data, legs: data.legs.filter((_, idx) => idx !== i) });
  const updateLeg = (i, k, v) => {
    const next = [...data.legs];
    next[i] = { ...next[i], [k]: v };
    setData({ ...data, legs: next });
  };

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)' }}>Journey Details</h2>
      <p style={{ color: '#5B6B7C', fontSize: 14, marginTop: 4, marginBottom: 24 }}>
        Each row appears in the main journey table on the bill. Use halt rows to break stays at a place.
      </p>

      <div className="space-y-2">
        {data.legs.map((leg, i) => leg.isHaltRow ? (
          <div key={i} className="rounded-lg p-4 border-2 border-dashed flex items-center gap-3" style={{ borderColor: 'var(--gold)', background: '#FEF8EE' }}>
            <div className="px-2 py-1 text-xs font-bold tracking-wider uppercase rounded" style={{ background: 'var(--gold)', color: 'white' }}>HALT</div>
            <input
              className="table-row-input flex-1"
              value={leg.haltText}
              onChange={e => updateLeg(i, 'haltText', e.target.value)}
              placeholder="e.g. Halt at Ernakulam from 27.02.2026 FN to 28.02.2026 FN"
            />
            <input
              className="table-row-input w-28"
              value={leg.haltDays}
              onChange={e => updateLeg(i, 'haltDays', e.target.value)}
              placeholder="01 days"
            />
            <button onClick={() => removeLeg(i)} className="p-1.5 rounded hover:bg-red-100" style={{ color: '#B91C1C' }}>
              <Trash2 size={14}/>
            </button>
          </div>
        ) : (
          <div key={i} className="rounded-lg border p-4" style={{ borderColor: 'var(--line)', background: 'white' }}>
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-1 text-xs font-bold" style={{ color: '#7C8B9C' }}>#{i + 1}</div>
              <input className="table-row-input col-span-2" placeholder="Dep date/time" value={leg.depDateTime} onChange={e => updateLeg(i, 'depDateTime', e.target.value)}/>
              <input className="table-row-input col-span-2" placeholder="From" value={leg.depFrom} onChange={e => updateLeg(i, 'depFrom', e.target.value)}/>
              <input className="table-row-input col-span-2" placeholder="Arr date/time" value={leg.arrDateTime} onChange={e => updateLeg(i, 'arrDateTime', e.target.value)}/>
              <input className="table-row-input col-span-2" placeholder="To" value={leg.arrTo} onChange={e => updateLeg(i, 'arrTo', e.target.value)}/>
              <input className="table-row-input col-span-2" placeholder="Mode" value={leg.mode} onChange={e => updateLeg(i, 'mode', e.target.value)}/>
              <button onClick={() => removeLeg(i)} className="col-span-1 p-1.5 rounded hover:bg-red-100" style={{ color: '#B91C1C' }}>
                <Trash2 size={14}/>
              </button>
              <input className="table-row-input col-span-2" placeholder="Fare (₹)" value={leg.fare} onChange={e => updateLeg(i, 'fare', e.target.value)}/>
              <input className="table-row-input col-span-2" placeholder="Distance" value={leg.distance} onChange={e => updateLeg(i, 'distance', e.target.value)}/>
              <input className="table-row-input col-span-7" placeholder="Purpose (optional)" value={leg.purpose} onChange={e => updateLeg(i, 'purpose', e.target.value)}/>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <button onClick={addLeg} className="ghost-btn flex items-center gap-1.5"><Plus size={14}/> Add journey row</button>
        <button onClick={addHalt} className="ghost-btn flex items-center gap-1.5" style={{ color: 'var(--gold)' }}><Plus size={14}/> Add halt</button>
      </div>
    </div>
  );
}

// ─── Step 2: Expenses (Hotel + Food) ──────────
function StepExpenses({ data, setData }) {
  const updateHotel = (i, k, v) => {
    const next = [...data.hotelStays];
    next[i] = { ...next[i], [k]: v };
    if (k === 'rate' || k === 'days') {
      const rate = num(k === 'rate' ? v : next[i].rate);
      const days = num(k === 'days' ? v : next[i].days);
      next[i].amount = String(rate * days);
    }
    setData({ ...data, hotelStays: next });
  };
  const addHotel = () => setData({ ...data, hotelStays: [...data.hotelStays, { from: '', to: '', hotel: '', rate: '', days: '', amount: '' }] });
  const removeHotel = (i) => setData({ ...data, hotelStays: data.hotelStays.filter((_, idx) => idx !== i) });

  const hotelTotal = useMemo(() => data.hotelStays.reduce((s, h) => s + num(h.amount), 0), [data.hotelStays]);

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)' }}>Expenses & Daily Allowance</h2>
      <p style={{ color: '#5B6B7C', fontSize: 14, marginTop: 4, marginBottom: 24 }}>
        These rows produce section 9 of the bill AND a separate hotel certificate. Amount auto-calculates.
      </p>

      <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--ink)' }}>
        <Hotel size={15}/> Hotel & DA entries
      </h3>
      <div className="space-y-2">
        {data.hotelStays.map((h, i) => (
          <div key={i} className="rounded-lg border p-3" style={{ borderColor: 'var(--line)', background: 'white' }}>
            <div className="grid grid-cols-12 gap-2 items-center">
              <input className="table-row-input col-span-2" placeholder="From" value={h.from} onChange={e => updateHotel(i, 'from', e.target.value)}/>
              <input className="table-row-input col-span-2" placeholder="To" value={h.to} onChange={e => updateHotel(i, 'to', e.target.value)}/>
              <input className="table-row-input col-span-3" placeholder="Hotel name / Food charge" value={h.hotel} onChange={e => updateHotel(i, 'hotel', e.target.value)}/>
              <input className="table-row-input col-span-1" placeholder="Rate" value={h.rate} onChange={e => updateHotel(i, 'rate', e.target.value)}/>
              <input className="table-row-input col-span-1" placeholder="Days" value={h.days} onChange={e => updateHotel(i, 'days', e.target.value)}/>
              <input className="table-row-input col-span-2 font-semibold" placeholder="Amount" value={h.amount} onChange={e => updateHotel(i, 'amount', e.target.value)} style={{ color: 'var(--ink)' }}/>
              <button onClick={() => removeHotel(i)} className="col-span-1 p-1.5 rounded hover:bg-red-100" style={{ color: '#B91C1C' }}>
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addHotel} className="ghost-btn flex items-center gap-1.5 mt-3"><Plus size={14}/> Add entry</button>

      <div className="mt-4 rounded-lg p-4 flex justify-between items-center" style={{ background: 'var(--ink)', color: 'white' }}>
        <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.05em' }}>Total (Section 9)</span>
        <span className="serif" style={{ fontSize: 22, fontWeight: 600 }}>₹{fmtRs(hotelTotal)}</span>
      </div>

      <div className="grid grid-cols-2 gap-5 mt-8">
        <div>
          <label className="field-label flex items-center gap-1.5"><UtensilsCrossed size={12}/> Food charge — total days</label>
          <input className="field-input" value={data.foodDays} onChange={e => setData({ ...data, foodDays: e.target.value })}/>
        </div>
        <div>
          <label className="field-label">Food charge — rate per day (₹)</label>
          <input className="field-input" value={data.foodRate} onChange={e => setData({ ...data, foodRate: e.target.value })}/>
        </div>
      </div>

      <div className="mt-5">
        <label className="field-label">TA Advance drawn (₹)</label>
        <input className="field-input max-w-xs" value={data.advance} onChange={e => setData({ ...data, advance: e.target.value })} placeholder="0 (if none)"/>
      </div>
    </div>
  );
}

// ─── Step 3: Transport ──────────
function StepTransport({ data, setData }) {
  const updateT = (i, k, v) => {
    const next = [...data.transports];
    next[i] = { ...next[i], [k]: v };
    setData({ ...data, transports: next });
  };
  const addT = () => setData({ ...data, transports: [...data.transports, { date: '', from: '', to: '', mode: 'By Taxi', regNo: '', km: '', amount: '' }] });
  const removeT = (i) => setData({ ...data, transports: data.transports.filter((_, idx) => idx !== i) });

  const total = useMemo(() => data.transports.reduce((s, t) => s + num(t.amount), 0), [data.transports]);

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)' }}>Local Transport</h2>
      <p style={{ color: '#5B6B7C', fontSize: 14, marginTop: 4, marginBottom: 24 }}>
        These entries produce the standalone Transportation Certificate (taxi receipts with vehicle reg numbers).
      </p>

      <div className="space-y-2">
        {data.transports.map((tr, i) => (
          <div key={i} className="rounded-lg border p-3" style={{ borderColor: 'var(--line)', background: 'white' }}>
            <div className="grid grid-cols-12 gap-2 items-center">
              <span className="col-span-1 text-xs font-bold" style={{ color: '#7C8B9C' }}>{i + 1}.</span>
              <input className="table-row-input col-span-2" placeholder="Date" value={tr.date} onChange={e => updateT(i, 'date', e.target.value)}/>
              <input className="table-row-input col-span-2" placeholder="From" value={tr.from} onChange={e => updateT(i, 'from', e.target.value)}/>
              <input className="table-row-input col-span-2" placeholder="To" value={tr.to} onChange={e => updateT(i, 'to', e.target.value)}/>
              <input className="table-row-input col-span-2" placeholder="Reg No" value={tr.regNo} onChange={e => updateT(i, 'regNo', e.target.value)}/>
              <input className="table-row-input col-span-1" placeholder="KM" value={tr.km} onChange={e => updateT(i, 'km', e.target.value)}/>
              <input className="table-row-input col-span-1 font-semibold" placeholder="Amount" value={tr.amount} onChange={e => updateT(i, 'amount', e.target.value)}/>
              <button onClick={() => removeT(i)} className="col-span-1 p-1.5 rounded hover:bg-red-100" style={{ color: '#B91C1C' }}>
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addT} className="ghost-btn flex items-center gap-1.5 mt-3"><Plus size={14}/> Add transport row</button>

      <div className="mt-4 rounded-lg p-4 flex justify-between items-center" style={{ background: 'var(--ink)', color: 'white' }}>
        <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.05em' }}>Transportation total</span>
        <span className="serif" style={{ fontSize: 22, fontWeight: 600 }}>₹{fmtRs(total)}</span>
      </div>
    </div>
  );
}

// ─── Step 4: Review ──────────
function StepReview({ data }) {
  const fareTotal = useMemo(() => data.legs.reduce((s, l) => s + (l.isHaltRow ? 0 : num(l.fare)), 0), [data.legs]);
  const hotelTotal = useMemo(() => data.hotelStays.reduce((s, h) => s + num(h.amount), 0), [data.hotelStays]);
  const transportTotal = useMemo(() => data.transports.reduce((s, t) => s + num(t.amount), 0), [data.transports]);
  const grossTotal = fareTotal + hotelTotal;
  const netTotal = grossTotal - num(data.advance);

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)' }}>Review & Generate</h2>
      <p style={{ color: '#5B6B7C', fontSize: 14, marginTop: 4, marginBottom: 24 }}>
        All six documents will be generated in T.R.25-A format. Final preview opens next.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg border p-5" style={{ borderColor: 'var(--line)', background: 'white' }}>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#7C8B9C' }}>Officer</h4>
          <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>{data.name}</div>
          <div style={{ fontSize: 13, color: '#5B6B7C', marginTop: 2 }}>{data.designation}</div>
          <div style={{ fontSize: 12, color: '#7C8B9C', marginTop: 6 }}>HQ: {data.headquarters}</div>
        </div>
        <div className="rounded-lg border p-5" style={{ borderColor: 'var(--line)', background: 'white' }}>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#7C8B9C' }}>Tour</h4>
          <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>{data.tourFrom} → {data.tourTo}</div>
          <div style={{ fontSize: 13, color: '#5B6B7C', marginTop: 2 }}>{data.purpose}</div>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--line)' }}>
        <div style={{ background: 'var(--ink)', color: 'white', padding: '12px 20px', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Auto-calculated totals
        </div>
        <table className="w-full">
          <tbody>
            {[
              ['Fare paid (sum of journey legs)', fareTotal],
              ['Hotel & DA (Section 9)', hotelTotal],
              ['Local transport (separate cert)', transportTotal],
              ['Gross amount (a + b)', grossTotal, true],
              ['Less: TA advance drawn', num(data.advance)],
            ].map(([label, val, bold], i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--line)' }}>
                <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: bold ? 600 : 400, color: bold ? 'var(--ink)' : '#5B6B7C' }}>{label}</td>
                <td className="serif" style={{ padding: '12px 20px', fontSize: 16, fontWeight: bold ? 700 : 500, color: 'var(--ink)', textAlign: 'right' }}>
                  ₹{fmtRs(val)}
                </td>
              </tr>
            ))}
            <tr style={{ background: '#FEF8EE', borderTop: '2px solid var(--gold)' }}>
              <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.02em' }}>NET PAYABLE</td>
              <td className="serif" style={{ padding: '14px 20px', fontSize: 22, fontWeight: 700, color: 'var(--ink)', textAlign: 'right' }}>
                ₹{fmtRs(netTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 rounded-lg flex items-start gap-3" style={{ background: 'var(--paper-soft)' }}>
        <FileText size={18} style={{ color: 'var(--saffron)', marginTop: 2 }}/>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>The following 6 documents will be generated:</div>
          <div style={{ fontSize: 12, color: '#5B6B7C', marginTop: 4, lineHeight: 1.7 }}>
            ① T.R.25-A Main Bill (Part A + Part B) &nbsp;·&nbsp;
            ② Actual Tour Program &nbsp;·&nbsp;
            ③ 14 Certificates page &nbsp;·&nbsp;
            ④ Hotel Accommodation Certificate &nbsp;·&nbsp;
            ⑤ Food Charges Certificate &nbsp;·&nbsp;
            ⑥ Transportation Certificate
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Preview Screen — generates all 6 documents in T.R.25-A format
// ─────────────────────────────────────────────────────────────
function PreviewScreen({ data, onBack }) {
  const [printNotice, setPrintNotice] = useState('');
  const fareTotal = data.legs.reduce((s, l) => s + (l.isHaltRow ? 0 : num(l.fare)), 0);
  const hotelTotal = data.hotelStays.reduce((s, h) => s + num(h.amount), 0);
  const transportTotal = data.transports.reduce((s, t) => s + num(t.amount), 0);
  const grossTotal = fareTotal + hotelTotal;
  const netTotal = grossTotal - num(data.advance);
  const hotelCertTotal = data.hotelCertStays.reduce((s, h) => s + num(h.amount), 0);
  const foodTotal = num(data.foodDays) * num(data.foodRate);

  const handlePrint = () => {
    try {
      // Small delay lets any pending re-render finish before the print snapshot is taken
      setPrintNotice('Opening print dialog…');
      setTimeout(() => {
        window.print();
        setTimeout(() => setPrintNotice(''), 1500);
      }, 80);
    } catch (e) {
      setPrintNotice('Could not open the print dialog. Try your browser menu → Print, or Ctrl/Cmd+P.');
      setTimeout(() => setPrintNotice(''), 6000);
    }
  };

  return (
    <div style={{ background: '#E8E2D4', minHeight: '100vh' }}>
      {/* Top bar */}
      <div className="no-print sticky top-0 z-10 border-b" style={{ background: 'white', borderColor: 'var(--line)' }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="ghost-btn flex items-center gap-2">
              <ArrowLeft size={14}/> Back to edit
            </button>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7C8B9C' }}>Preview</div>
              <div className="serif" style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{data.name} · {data.tourFrom} → {data.tourTo}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {printNotice && (
              <span className="text-xs font-medium" style={{ color: '#5B6B7C' }}>{printNotice}</span>
            )}
            <div className="text-right pr-3">
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7C8B9C' }}>Net payable</div>
              <div className="serif" style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>₹{fmtRs(netTotal)}</div>
            </div>
            <button onClick={handlePrint} className="ink-btn flex items-center gap-2">
              <Printer size={14}/> Print / Save as PDF
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pb-2 text-xs flex items-center gap-2" style={{ color: '#5B6B7C' }}>
          <Sparkles size={12} style={{ color: 'var(--saffron)' }}/>
          <span><strong>Tip:</strong> In the print dialog, choose <strong>Save as PDF</strong> as the destination/printer. If the dialog doesn't open, use your browser menu → Print, or the keyboard shortcut Ctrl+P (Cmd+P on Mac).</span>
        </div>
      </div>

      {/* All six documents */}
      <div className="print-area py-8">
        <Doc1MainBill data={data} fareTotal={fareTotal} hotelTotal={hotelTotal} grossTotal={grossTotal} netTotal={netTotal}/>
        <Doc2TourProgram data={data}/>
        <Doc3Certificates data={data}/>
        <Doc4HotelCert data={data} hotelCertTotal={hotelCertTotal}/>
        <Doc5FoodCert data={data} foodTotal={foodTotal}/>
        <Doc6TransportCert data={data} transportTotal={transportTotal}/>
      </div>
    </div>
  );
}

// ─── DOC 1: Main T.R.25-A Bill ──────────
function Doc1MainBill({ data, fareTotal, hotelTotal, grossTotal, netTotal }) {
  return (
    <div className="paper-sheet gov-doc">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong>T.R.25-A</strong>
        <div>Sub-bill No <span className="underline-dots">{data.subBillNo || ''}</span></div>
      </div>
      <h1 style={{ textAlign: 'center', fontSize: '13.5pt', fontWeight: 'bold', margin: '6px 0', letterSpacing: '0.02em' }}>
        TRAVELLING ALLOWANCE BILL FOR TOUR
      </h1>
      <div style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '10pt', marginBottom: 10 }}>
        (Note: This bill should be prepared in duplicate — one for payment and the other as office copy)
      </div>
      <div style={{ fontWeight: 'bold', marginBottom: 6 }}>(PART – A &nbsp;to be filled in by the Government servant)</div>

      <div style={{ paddingLeft: 20, marginBottom: 8 }}>
        <div style={{ marginBottom: 4 }}>1. Name: <span className="filled">{data.name}</span></div>
        <div style={{ marginBottom: 4 }}>2. Designation: <span className="filled">{data.designation}</span></div>
        <div style={{ marginBottom: 4 }}>3. Pay at the time of tour: <span className="filled">Rs: {num(data.payAtTour).toLocaleString('en-IN')}/-</span></div>
        <div style={{ marginBottom: 4 }}>4. Headquarters: <span className="filled">{data.headquarters}</span></div>
        <div style={{ marginBottom: 4 }}>5. Details and purpose of journey(s) performed: — <span className="filled">{data.purpose}</span></div>
        <div style={{ paddingLeft: 22, marginBottom: 8 }}><span className="filled">{data.orderRef}</span></div>
      </div>

      {/* Journey table */}
      <JourneyTable legs={data.legs}/>

      <div style={{ marginTop: 14, paddingLeft: 18 }}>
        <div>6. Mode of journey:</div>
        <div style={{ paddingLeft: 28 }}>
          <div>(I) &nbsp;&nbsp;Air: —</div>
          <div style={{ paddingLeft: 28 }}>(a) Exchange voucher arranged by officer &nbsp;&nbsp;Yes/No</div>
          <div style={{ paddingLeft: 28 }}>(b) Ticket/Exchange voucher arranged by <span className="underline-dots"></span></div>
          <div>(II) Rail: —</div>
          <div style={{ paddingLeft: 28 }}>— Whether travelled by mail/express/ordinary train?</div>
          <div style={{ paddingLeft: 28 }}>— Whether return tickets available?</div>
          <div style={{ paddingLeft: 28 }}>— If available, whether return tickets purchased? if not, state reasons.</div>
          <div>(III) Road: —</div>
          <div style={{ paddingLeft: 28 }}>Mode of conveyance used i.e. by Govt. transport / by taking a taxi, a single seat in a bus or other public conveyance / by sharing with another Govt. servant in a car belonging to him or to a third person to be specified.</div>
        </div>
        <div style={{ marginTop: 6 }}>7. Date of absence from place of halt on account of:</div>
        <div style={{ paddingLeft: 28 }}>— R.H. and C.L.</div>
        <div style={{ paddingLeft: 28 }}>— Not being actually in camp on Sundays and holidays.</div>
        <div style={{ marginTop: 6 }}>8. Dates on which free board and/or lodging provided by the state or any organization financed by state funds: —</div>
        <div style={{ paddingLeft: 28 }}>— Board only</div>
        <div style={{ paddingLeft: 28 }}>— Lodging only</div>
        <div style={{ paddingLeft: 28 }}>— Board and lodging</div>
        <div style={{ marginTop: 6 }}>9. Particulars to be furnished along with hotel receipts etc., in cases where higher rate of D.A. is claimed for stay in hotel/other establishments providing board and/or lodging at scheduled tariffs: —</div>
      </div>

      {/* Section 9 - Hotel/DA table */}
      <table style={{ marginTop: 8 }}>
        <thead>
          <tr>
            <th colSpan={2}>Period of stay</th>
            <th rowSpan={2}>Name of Hotel</th>
            <th rowSpan={2}>Daily rate of lodging charged</th>
            <th colSpan={3}>Total amount paid</th>
          </tr>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Rate</th>
            <th>Days</th>
            <th>Rs</th>
          </tr>
        </thead>
        <tbody>
          {data.hotelStays.map((h, i) => (
            <tr key={i}>
              <td className="filled">{h.from}</td>
              <td className="filled">{h.to}</td>
              <td className="filled">{h.hotel}</td>
              <td className="filled">{h.rate}/-</td>
              <td className="filled">{h.days}</td>
              <td className="filled">{fmtRs(num(h.amount))}/-</td>
            </tr>
          ))}
          <tr>
            <td colSpan={5} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Rs.</td>
            <td className="filled">{fmtRs(hotelTotal)}/-</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 14, paddingLeft: 18 }}>
        <div>10. Particulars of journey(s) for which higher class of accommodation than the one to which the Government servant is entitled was used:</div>
        <div style={{ marginTop: 4, fontStyle: 'italic' }}>(Not applicable — see attached certificate)</div>
        <div style={{ marginTop: 8 }}>11. Details of journey(s) performed by road between places connected by rail: <span style={{ fontStyle: 'italic' }}>Nil</span></div>
        <div style={{ marginTop: 8 }}>12. Amount of Advance of Travelling Allowance, if any drawn: <span className="filled">{data.advance ? `Rs. ${fmtRs(num(data.advance))}/-` : 'Nil'}</span></div>
      </div>

      <div style={{ marginTop: 12, paddingLeft: 18 }}>
        Certified that the information, as given above, is true to the best of my knowledge belief.
      </div>

      <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', paddingLeft: 18, paddingRight: 18 }}>
        <div>Date: <span className="filled">{data.declarationDate}</span></div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 36 }}>&nbsp;</div>
          <div style={{ borderTop: '1px solid #000', paddingTop: 2, minWidth: 200 }}>Signature of the Government Servant</div>
        </div>
      </div>

      {/* PART B */}
      <div style={{ marginTop: 18, fontWeight: 'bold' }}>PART – B &nbsp;&nbsp;<span style={{ fontStyle: 'italic', fontWeight: 'normal' }}>(To be filled in by the Bill Section)</span></div>
      <div style={{ marginTop: 8 }}>
        The net entitlement on account of Travelling Allowance works out to Rs. <span className="filled underline-dots">{fmtRs(netTotal)}</span>
        (Rupees <span className="filled underline-dots" style={{ minWidth: 360 }}>{numToWords(netTotal)} only</span>) as detailed below:
      </div>
      <div style={{ marginTop: 10, paddingLeft: 18, lineHeight: 1.8 }}>
        <div>(a) Railway/Air/Bus/Steamer fare: — Rs. <span className="filled">{fmtRs(fareTotal)}/-</span></div>
        <div>(b) Road mileage for <span className="underline-dots"></span> Km @ Rs. <span className="underline-dots"></span> P/Km</div>
        <div>(c) Daily Allowance</div>
        <div style={{ paddingLeft: 40 }}>(i) <span className="filled">{data.foodDays || ''}</span> days @ Rs. <span className="filled">{data.foodRate || ''}</span> per day = Rs. <span className="filled">{fmtRs(num(data.foodDays) * num(data.foodRate))}/-</span></div>
        <div>(d) Actual expenses (Hotel etc.): Rs. <span className="filled">{fmtRs(hotelTotal - (num(data.foodDays) * num(data.foodRate)))}/-</span></div>
        <div style={{ marginTop: 6 }}>Gross amount: Rs. <span className="filled">{fmtRs(grossTotal)}/-</span></div>
        <div>(e) Less Amount of T.A. advances, if any: Rs. <span className="filled">{data.advance ? fmtRs(num(data.advance)) + '/-' : 'Nil'}</span></div>
        <div style={{ marginTop: 6, fontWeight: 'bold' }}>Net Amount: Rs. {fmtRs(netTotal)}/-</div>
      </div>
      <div style={{ marginTop: 14, paddingLeft: 18 }}>The expenditure is debitable to <span className="underline-dots" style={{ minWidth: 350 }}></span></div>

      <div style={{ marginTop: 38, display: 'flex', justifyContent: 'space-between', paddingLeft: 18, paddingRight: 18 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #000', paddingTop: 2, minWidth: 130 }}>Bill Clerk</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #000', paddingTop: 2, minWidth: 180 }}>(Signature of D.D.O.)</div>
        </div>
      </div>
      <div style={{ marginTop: 28, textAlign: 'right' }}>Countersigned</div>
      <div style={{ marginTop: 32, textAlign: 'right', paddingRight: 18 }}>
        <div style={{ borderTop: '1px solid #000', paddingTop: 2, display: 'inline-block', minWidth: 220 }}>Signature of Controlling Officer</div>
      </div>
    </div>
  );
}

// ─── Reusable journey table ──────────
function JourneyTable({ legs }) {
  return (
    <table>
      <thead>
        <tr>
          <th colSpan={2}>DEPARTURE</th>
          <th colSpan={2}>ARRIVAL</th>
          <th rowSpan={2}>Mode of travel and Class of accommodation</th>
          <th rowSpan={2}>Fare paid (Rs Ps)</th>
          <th rowSpan={2}>Distance in Kms for Road mileage</th>
          <th rowSpan={2}>Duration of halt<br/><span style={{ fontWeight: 'normal' }}>Days/Hours</span></th>
          <th rowSpan={2}>Purpose of journey</th>
        </tr>
        <tr>
          <th>Date and Time</th>
          <th>From</th>
          <th>Date and Time</th>
          <th>To</th>
        </tr>
        <tr style={{ background: '#F4EFE5' }}>
          {[1,2,3,4,5,6,7,8,9].map(n => <th key={n} style={{ fontSize: '9pt' }}>{n}</th>)}
        </tr>
      </thead>
      <tbody>
        {legs.map((l, i) => l.isHaltRow ? (
          <tr key={i}>
            <td colSpan={7} className="filled" style={{ fontWeight: 'bold' }}>{l.haltText}</td>
            <td colSpan={2} className="filled" style={{ fontWeight: 'bold' }}>{l.haltDays}</td>
          </tr>
        ) : (
          <tr key={i}>
            <td className="filled">{l.depDateTime}</td>
            <td className="filled">{l.depFrom}</td>
            <td className="filled">{l.arrDateTime}</td>
            <td className="filled">{l.arrTo}</td>
            <td className="filled">{l.mode}</td>
            <td className="filled">{l.fare ? `${l.fare}/-` : ''}</td>
            <td className="filled">{l.distance}</td>
            <td></td>
            <td className="filled">{l.purpose}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── DOC 2: Tour Program ──────────
function Doc2TourProgram({ data }) {
  return (
    <div className="paper-sheet gov-doc">
      <h2 style={{ textAlign: 'center', fontSize: '12pt', fontWeight: 'bold', margin: '6px 0 14px' }}>
        Actual tour program of Shri. <span className="filled">{data.name.replace(/^T\.P\s*/, '').split(' ').slice(0, -1).join(' ') || data.name}</span>, <span className="filled">{data.designation}</span> of <span className="filled">{data.headquarters}</span> for the period from <span className="filled">{data.tourFrom}</span> to <span className="filled">{data.tourTo}</span>.
      </h2>

      <JourneyTable legs={data.legs}/>

      <div style={{ marginTop: 28 }}>Submitted for approval please:</div>
      <div style={{ marginTop: 42, fontWeight: 'bold' }}>({data.name})</div>
      <div className="filled">{data.designation}</div>

      <div style={{ marginTop: 42 }}>Approved:</div>
      <div style={{ marginTop: 28, fontWeight: 'bold' }}>{data.approvingAuthority}</div>
      <div>{data.approvingOffice}</div>
    </div>
  );
}

// ─── DOC 3: 14 Certificates ──────────
function Doc3Certificates({ data }) {
  const hotelDates = data.hotelCertStays.map(h => `from ${h.from} to ${h.to} at ${h.hotel}`).join(', and ');

  return (
    <div className="paper-sheet gov-doc">
      <h2 style={{ textAlign: 'center', fontSize: '12pt', fontWeight: 'bold', margin: '0 0 14px', textDecoration: 'underline' }}>
        CERTIFICATES FOR TOUR T.A. BILLS
      </h2>
      <div style={{ fontWeight: 'bold', marginBottom: 10 }}>Certified that: —</div>

      <ol style={{ paddingLeft: 24, lineHeight: 1.65 }}>
        <li>The amount claimed in this bill has not been drawn previously.</li>
        <li>The tour advance has been adjusted in this bill.</li>
        <li>I actually travelled by Mail/Express Train by the class of accommodation as claimed in the T.A. Bill.</li>
        <li>I was not on merely constructive in camp on Sunday and Holidays during the period for which daily allowance has been claimed.</li>
        <li>I was not on casual leave on any day for which daily allowance has charged in the bill.</li>
        <li>The distance by the road for which road mileage allowance has been claimed is correct to the best of my knowledge and belief.</li>
        <li>The halts for which daily allowance have been claimed were necessitated by the performance of duty at the place of halts.</li>
        <li>The journeys were performed in the interests of public service and no Government transport was utilized for journeys for which road mileage has been claimed.</li>
        <li>I was/not treated as State Guest during my halt and was not provided with board and lodging/lodging only at State expenses/at the expenses of the Government of India or any Organization.</li>
        <li>No return ticket (rail) were available for this journey.</li>
        <li>Return ticket (rail) were available but were not purchased because the return journey was not expected to be performed within the period for which such tickets were available.</li>
        <li>I did not perform road journeys for which mileage allowance has been claimed at the higher rates prescribed in Rule 46 of the Supplementary Rules by taking a single seat in any public conveyance (excluding) which plies regularly for hire between fixed points and charges fixed rates. I also certify that the journey was not performed in any other vehicle without payments of its hire charges or incurring its returning exercises.</li>
        <li>I availed myself of/did not avail of credit facilities for booking my air passage with the Indian Airlines Corporation / Air India International by requisition through an exchange order.</li>
        <li>I stayed <span className="filled">{hotelDates}</span> at which provides board / lodging at scheduled Tariffs.</li>
      </ol>

      <div style={{ marginTop: 32, paddingLeft: 18 }}>
        <div style={{ marginBottom: 30 }}>Signature: ___________________________</div>
        <div>Name: <span className="filled">{data.name}</span></div>
        <div>Designation: <span className="filled">{data.designation}</span></div>
      </div>
      <div style={{ marginTop: 16, fontStyle: 'italic', fontSize: '9.5pt' }}>
        NB: Certificates which are inapplicable should be struck off.
      </div>
    </div>
  );
}

// ─── DOC 4: Hotel Cert ──────────
function Doc4HotelCert({ data, hotelCertTotal }) {
  return (
    <div className="paper-sheet gov-doc">
      <h2 style={{ textAlign: 'center', fontSize: '12pt', fontWeight: 'bold', margin: '0 0 18px', textDecoration: 'underline' }}>
        Certificate
      </h2>
      <div style={{ paddingLeft: 18, lineHeight: 1.7 }}>
        I have incurred an amount of <strong>Rs. {fmtRs(hotelCertTotal)}/-</strong> (Rupees <span className="filled">{numToWords(hotelCertTotal)} only</span>) for the following Accommodation charge performed during my duty period is given below:
      </div>

      <table style={{ marginTop: 14 }}>
        <thead>
          <tr>
            <th colSpan={2}>Period of stay</th>
            <th rowSpan={2}>Name of Hotel</th>
            <th rowSpan={2}>Daily rate</th>
            <th colSpan={2}>Total amount paid</th>
          </tr>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Days</th>
            <th>Rs</th>
          </tr>
        </thead>
        <tbody>
          {data.hotelCertStays.map((h, i) => (
            <tr key={i}>
              <td className="filled">{h.from}</td>
              <td className="filled">{h.to}</td>
              <td className="filled">{h.hotel}</td>
              <td className="filled">{h.rate}/-</td>
              <td className="filled">{h.days}</td>
              <td className="filled">{fmtRs(num(h.amount))}/-</td>
            </tr>
          ))}
          <tr>
            <td colSpan={5} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Rs.</td>
            <td className="filled" style={{ fontWeight: 'bold' }}>{fmtRs(hotelCertTotal)}/-</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 64, textAlign: 'right', paddingRight: 30 }}>
        <div className="filled" style={{ fontWeight: 'bold' }}>{data.name}</div>
        <div className="filled">{data.designation}</div>
      </div>
    </div>
  );
}

// ─── DOC 5: Food Cert ──────────
function Doc5FoodCert({ data, foodTotal }) {
  return (
    <div className="paper-sheet gov-doc">
      <h2 style={{ textAlign: 'center', fontSize: '12pt', fontWeight: 'bold', margin: '0 0 24px', textDecoration: 'underline' }}>
        Certificate
      </h2>
      <div style={{ paddingLeft: 22, lineHeight: 1.85, fontSize: '11.5pt' }}>
        Certified that I have incurred an amount of <strong>Rs. {fmtRs(foodTotal)}/-</strong> (Rupees <span className="filled">{numToWords(foodTotal)} only</span>) being the food charges for ({data.foodDays} × {data.foodRate}) days during my duty period from <span className="filled">{data.tourFrom}</span> to <span className="filled">{data.tourTo}</span>.
      </div>

      <div style={{ marginTop: 80, textAlign: 'right', paddingRight: 30 }}>
        <div className="filled" style={{ fontWeight: 'bold' }}>{data.name}</div>
        <div className="filled">{data.designation}</div>
      </div>
    </div>
  );
}

// ─── DOC 6: Transport Cert ──────────
function Doc6TransportCert({ data, transportTotal }) {
  return (
    <div className="paper-sheet gov-doc">
      <h2 style={{ textAlign: 'center', fontSize: '12pt', fontWeight: 'bold', margin: '0 0 18px', textDecoration: 'underline' }}>
        Certificate
      </h2>

      <table>
        <thead>
          <tr>
            <th>Sl.No</th>
            <th>Date</th>
            <th>From</th>
            <th>To</th>
            <th>Mode of Travel</th>
            <th>Registration No.</th>
            <th>Distance (KM)</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.transports.map((t, i) => (
            <tr key={i}>
              <td className="filled">{i + 1}.</td>
              <td className="filled">{t.date}</td>
              <td className="filled">{t.from}</td>
              <td className="filled">{t.to}</td>
              <td className="filled">{t.mode}</td>
              <td className="filled">{t.regNo}</td>
              <td className="filled" style={{ fontWeight: 'bold' }}>{t.km}</td>
              <td className="filled">{fmtRs(num(t.amount))}/-</td>
            </tr>
          ))}
          <tr>
            <td colSpan={6} style={{ textAlign: 'right', fontWeight: 'bold' }}></td>
            <td style={{ fontWeight: 'bold' }}>Total</td>
            <td className="filled" style={{ fontWeight: 'bold' }}>{fmtRs(transportTotal)}/-</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 18, lineHeight: 1.7 }}>
        I have incurred an amount of <strong>Rs. {fmtRs(transportTotal)}/-</strong> (Rupees <span className="filled">{numToWords(transportTotal)} only</span>) for the following transportation charge performed during my duty period is given above.
      </div>

      <div style={{ marginTop: 60, textAlign: 'right', paddingRight: 30 }}>
        <div className="filled" style={{ fontWeight: 'bold' }}>{data.name}</div>
        <div className="filled">{data.designation}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LTC ADVANCE — multi-step form
// ─────────────────────────────────────────────────────────────
function LtcBillForm({ hist, step, setStep, onPreview, onSaveDraft, draftStatus, t }) {
  const data = hist.value;
  const setData = hist.set;
  const steps = [
    { label: t.employee, icon: User },
    { label: 'Family', icon: User },
    { label: 'Travel Plan', icon: Plane },
    { label: t.review, icon: FileSignature },
  ];

  const update = (k, v) => setData({ ...data, [k]: v });

  return (
    <div className="max-w-5xl mx-auto p-10">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h1 className="serif" style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)' }}>
            New LTC Advance <span style={{ color: '#7C8B9C', fontSize: 16, fontWeight: 400 }}>· Leave Travel Concession</span>
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={hist.undo} disabled={!hist.canUndo} className="icon-btn" title={`${t.undo} (Ctrl+Z)`}>
              <Undo2 size={15}/>
            </button>
            <button onClick={hist.redo} disabled={!hist.canRedo} className="icon-btn" title={`${t.redo} (Ctrl+Shift+Z)`}>
              <Redo2 size={15}/>
            </button>
            <button
              onClick={() => hist.reset(LTC_SAMPLE)}
              className="text-xs font-semibold tracking-wider uppercase ml-2"
              style={{ color: 'var(--saffron)' }}
            >
              <Sparkles size={12} className="inline mr-1"/> Load sample
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const active = step === i;
            const done = step > i;
            return (
              <React.Fragment key={i}>
                <button
                  onClick={() => setStep(i)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                  style={{
                    background: active ? 'var(--ink)' : done ? 'var(--paper-soft)' : 'transparent',
                    color: active ? 'white' : done ? 'var(--ink)' : '#7C8B9C',
                    border: '1px solid',
                    borderColor: active ? 'var(--ink)' : 'var(--line)'
                  }}
                >
                  {done ? <CheckCircle2 size={14}/> : <Icon size={14}/>}
                  <span>{s.label}</span>
                </button>
                {i < steps.length - 1 && <div className="flex-1 h-px" style={{ background: 'var(--line)' }}/>}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-8" style={{ borderColor: 'var(--line)' }}>
        {step === 0 && <LtcStepEmployee data={data} update={update}/>}
        {step === 1 && <LtcStepFamily data={data} setData={setData}/>}
        {step === 2 && <LtcStepTravel data={data} update={update}/>}
        {step === 3 && <LtcStepReview data={data}/>}

        <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="ghost-btn flex items-center gap-2"
              style={{ opacity: step === 0 ? 0.4 : 1 }}
            >
              <ArrowLeft size={14}/> Back
            </button>
            {draftStatus && (
              <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: draftStatus.includes('not') ? '#B91C1C' : '#2F7D4F' }}>
                <CheckCircle2 size={13}/> {draftStatus}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onSaveDraft} className="ghost-btn flex items-center gap-2">
              <Save size={14}/> Save draft
            </button>
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(step + 1)} className="ink-btn flex items-center gap-2">
                Next <ArrowRight size={14}/>
              </button>
            ) : (
              <button onClick={onPreview} className="ink-btn flex items-center gap-2">
                <Eye size={14}/> Preview & Print
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LtcStepEmployee({ data, update }) {
  return (
    <div>
      <h2 className="serif" style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)' }}>Officer Details</h2>
      <p style={{ color: '#5B6B7C', fontSize: 14, marginTop: 4, marginBottom: 24 }}>
        Same officer details format used across all Smart Bill forms.
      </p>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className="field-label">Name</label>
          <input className="field-input" value={data.name} onChange={e => update('name', e.target.value)}/>
        </div>
        <div>
          <label className="field-label">Designation</label>
          <input className="field-input" value={data.designation} onChange={e => update('designation', e.target.value)}/>
        </div>
        <div>
          <label className="field-label">Pay (₹)</label>
          <input className="field-input" value={data.payAtTour} onChange={e => update('payAtTour', e.target.value)}/>
        </div>
        <div>
          <label className="field-label">Headquarters</label>
          <input className="field-input" value={data.headquarters} onChange={e => update('headquarters', e.target.value)}/>
        </div>
        <div>
          <label className="field-label">LTC block year</label>
          <input className="field-input" value={data.ltcBlockYear} onChange={e => update('ltcBlockYear', e.target.value)} placeholder="e.g. 2025-2026"/>
        </div>
        <div>
          <label className="field-label">Last LTC availed</label>
          <input className="field-input" value={data.lastLtcAvailed} onChange={e => update('lastLtcAvailed', e.target.value)}/>
        </div>
        <div className="col-span-2">
          <label className="field-label">Declared home town</label>
          <input className="field-input" value={data.homeTownDeclared} onChange={e => update('homeTownDeclared', e.target.value)}/>
        </div>
        <div className="col-span-2">
          <label className="field-label">Destination declared for this LTC</label>
          <input className="field-input" value={data.destinationDeclared} onChange={e => update('destinationDeclared', e.target.value)}/>
        </div>
      </div>
    </div>
  );
}

function LtcStepFamily({ data, setData }) {
  const updateMember = (i, k, v) => {
    const next = [...data.familyMembers];
    next[i] = { ...next[i], [k]: v };
    setData({ ...data, familyMembers: next });
  };
  const addMember = () => setData({ ...data, familyMembers: [...data.familyMembers, { name: '', relation: '', age: '' }] });
  const removeMember = (i) => setData({ ...data, familyMembers: data.familyMembers.filter((_, idx) => idx !== i) });

  return (
    <div>
      <h2 className="serif" style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)' }}>Eligible Family Members</h2>
      <p style={{ color: '#5B6B7C', fontSize: 14, marginTop: 4, marginBottom: 24 }}>
        List dependents travelling under this LTC claim, as per service rules.
      </p>
      <div className="space-y-2">
        {data.familyMembers.map((m, i) => (
          <div key={i} className="rounded-lg border p-3" style={{ borderColor: 'var(--line)', background: 'white' }}>
            <div className="grid grid-cols-12 gap-2 items-center">
              <span className="col-span-1 text-xs font-bold" style={{ color: '#7C8B9C' }}>{i + 1}.</span>
              <input className="table-row-input col-span-5" placeholder="Name" value={m.name} onChange={e => updateMember(i, 'name', e.target.value)}/>
              <input className="table-row-input col-span-3" placeholder="Relation" value={m.relation} onChange={e => updateMember(i, 'relation', e.target.value)}/>
              <input className="table-row-input col-span-2" placeholder="Age" value={m.age} onChange={e => updateMember(i, 'age', e.target.value)}/>
              <button onClick={() => removeMember(i)} className="col-span-1 p-1.5 rounded hover:bg-red-100" style={{ color: '#B91C1C' }}>
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addMember} className="ghost-btn flex items-center gap-1.5 mt-3"><Plus size={14}/> Add family member</button>
    </div>
  );
}

function LtcStepTravel({ data, update }) {
  return (
    <div>
      <h2 className="serif" style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)' }}>Travel Plan & Estimated Fare</h2>
      <p style={{ color: '#5B6B7C', fontSize: 14, marginTop: 4, marginBottom: 24 }}>
        Advance is sanctioned against estimated fare; settlement happens after actual travel with tickets.
      </p>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className="field-label">From station</label>
          <input className="field-input" value={data.fromStation} onChange={e => update('fromStation', e.target.value)}/>
        </div>
        <div>
          <label className="field-label">To station</label>
          <input className="field-input" value={data.toStation} onChange={e => update('toStation', e.target.value)}/>
        </div>
        <div>
          <label className="field-label">Proposed departure</label>
          <input className="field-input" value={data.proposedDeparture} onChange={e => update('proposedDeparture', e.target.value)}/>
        </div>
        <div>
          <label className="field-label">Proposed return</label>
          <input className="field-input" value={data.proposedReturn} onChange={e => update('proposedReturn', e.target.value)}/>
        </div>
        <div className="col-span-2">
          <label className="field-label">Mode of travel</label>
          <input className="field-input" value={data.modeOfTravel} onChange={e => update('modeOfTravel', e.target.value)}/>
        </div>
        <div className="col-span-2">
          <label className="field-label">Class entitled</label>
          <input className="field-input" value={data.classEntitled} onChange={e => update('classEntitled', e.target.value)}/>
        </div>
        <div>
          <label className="field-label">Estimated fare — self (₹)</label>
          <input className="field-input" value={data.estimatedFareSelf} onChange={e => update('estimatedFareSelf', e.target.value)}/>
        </div>
        <div>
          <label className="field-label">Estimated fare — family (₹)</label>
          <input className="field-input" value={data.estimatedFareFamily} onChange={e => update('estimatedFareFamily', e.target.value)}/>
        </div>
        <div className="col-span-2">
          <label className="field-label">Advance required (₹)</label>
          <input className="field-input" value={data.advanceRequired} onChange={e => update('advanceRequired', e.target.value)}/>
        </div>
      </div>
    </div>
  );
}

function LtcStepReview({ data }) {
  const totalFare = num(data.estimatedFareSelf) + num(data.estimatedFareFamily);
  return (
    <div>
      <h2 className="serif" style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)' }}>Review & Generate</h2>
      <p style={{ color: '#5B6B7C', fontSize: 14, marginTop: 4, marginBottom: 24 }}>
        This produces the LTC Advance Application — ready to submit to your D.D.O.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg border p-5" style={{ borderColor: 'var(--line)', background: 'white' }}>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#7C8B9C' }}>Officer</h4>
          <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>{data.name}</div>
          <div style={{ fontSize: 13, color: '#5B6B7C', marginTop: 2 }}>{data.designation}</div>
          <div style={{ fontSize: 12, color: '#7C8B9C', marginTop: 6 }}>Block year: {data.ltcBlockYear}</div>
        </div>
        <div className="rounded-lg border p-5" style={{ borderColor: 'var(--line)', background: 'white' }}>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#7C8B9C' }}>Travel</h4>
          <div className="serif" style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>{data.fromStation} → {data.toStation}</div>
          <div style={{ fontSize: 13, color: '#5B6B7C', marginTop: 2 }}>{data.proposedDeparture} to {data.proposedReturn}</div>
          <div style={{ fontSize: 12, color: '#7C8B9C', marginTop: 6 }}>{data.familyMembers.length} family member(s) travelling</div>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--line)' }}>
        <div style={{ background: 'var(--ink)', color: 'white', padding: '12px 20px', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Fare estimate
        </div>
        <table className="w-full">
          <tbody>
            <tr>
              <td style={{ padding: '12px 20px', fontSize: 13, color: '#5B6B7C' }}>Self</td>
              <td className="serif" style={{ padding: '12px 20px', fontSize: 16, color: 'var(--ink)', textAlign: 'right' }}>₹{fmtRs(num(data.estimatedFareSelf))}</td>
            </tr>
            <tr style={{ borderTop: '1px solid var(--line)' }}>
              <td style={{ padding: '12px 20px', fontSize: 13, color: '#5B6B7C' }}>Family</td>
              <td className="serif" style={{ padding: '12px 20px', fontSize: 16, color: 'var(--ink)', textAlign: 'right' }}>₹{fmtRs(num(data.estimatedFareFamily))}</td>
            </tr>
            <tr style={{ background: '#FEF8EE', borderTop: '2px solid var(--gold)' }}>
              <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>ADVANCE REQUESTED</td>
              <td className="serif" style={{ padding: '14px 20px', fontSize: 22, fontWeight: 700, color: 'var(--ink)', textAlign: 'right' }}>₹{fmtRs(num(data.advanceRequired))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LTC PREVIEW SCREEN
// ─────────────────────────────────────────────────────────────
function LtcPreviewScreen({ data, onBack }) {
  const [printNotice, setPrintNotice] = useState('');
  const totalFare = num(data.estimatedFareSelf) + num(data.estimatedFareFamily);

  const handlePrint = () => {
    try {
      setPrintNotice('Opening print dialog…');
      setTimeout(() => {
        window.print();
        setTimeout(() => setPrintNotice(''), 1500);
      }, 80);
    } catch (e) {
      setPrintNotice('Could not open the print dialog. Try Ctrl/Cmd+P instead.');
      setTimeout(() => setPrintNotice(''), 6000);
    }
  };

  return (
    <div style={{ background: '#E8E2D4', minHeight: '100vh' }}>
      <div className="no-print sticky top-0 z-10 border-b" style={{ background: 'white', borderColor: 'var(--line)' }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="ghost-btn flex items-center gap-2">
              <ArrowLeft size={14}/> Back to edit
            </button>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7C8B9C' }}>Preview</div>
              <div className="serif" style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{data.name} · LTC Advance</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {printNotice && (
              <span className="text-xs font-medium" style={{ color: '#5B6B7C' }}>{printNotice}</span>
            )}
            <div className="text-right pr-3">
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7C8B9C' }}>Advance requested</div>
              <div className="serif" style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>₹{fmtRs(num(data.advanceRequired))}</div>
            </div>
            <button onClick={handlePrint} className="ink-btn flex items-center gap-2">
              <Printer size={14}/> Print / Save as PDF
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pb-2 text-xs flex items-center gap-2" style={{ color: '#5B6B7C' }}>
          <Sparkles size={12} style={{ color: 'var(--saffron)' }}/>
          <span><strong>Tip:</strong> In the print dialog, choose <strong>Save as PDF</strong> as the destination/printer. If the dialog doesn't open, use your browser menu → Print, or the keyboard shortcut Ctrl+P (Cmd+P on Mac).</span>
        </div>
      </div>

      <div className="print-area py-8">
        <LtcDoc data={data} totalFare={totalFare}/>
      </div>
    </div>
  );
}

function LtcDoc({ data, totalFare }) {
  return (
    <div className="paper-sheet gov-doc">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong>Form LTC-1</strong>
        <div>Block year: <span className="filled">{data.ltcBlockYear}</span></div>
      </div>
      <h1 style={{ textAlign: 'center', fontSize: '13.5pt', fontWeight: 'bold', margin: '6px 0', letterSpacing: '0.02em' }}>
        APPLICATION FOR ADVANCE OF LEAVE TRAVEL CONCESSION
      </h1>

      <div style={{ paddingLeft: 20, marginTop: 14, marginBottom: 8 }}>
        <div style={{ marginBottom: 4 }}>1. Name: <span className="filled">{data.name}</span></div>
        <div style={{ marginBottom: 4 }}>2. Designation: <span className="filled">{data.designation}</span></div>
        <div style={{ marginBottom: 4 }}>3. Pay: <span className="filled">Rs. {fmtRs(num(data.payAtTour))}/-</span></div>
        <div style={{ marginBottom: 4 }}>4. Headquarters: <span className="filled">{data.headquarters}</span></div>
        <div style={{ marginBottom: 4 }}>5. Declared home town: <span className="filled">{data.homeTownDeclared}</span></div>
        <div style={{ marginBottom: 4 }}>6. Destination proposed for this LTC: <span className="filled">{data.destinationDeclared}</span></div>
        <div style={{ marginBottom: 4 }}>7. Last LTC availed: <span className="filled">{data.lastLtcAvailed}</span></div>
      </div>

      <div style={{ marginTop: 10, fontWeight: 'bold' }}>8. Particulars of family members proposed to travel:</div>
      <table style={{ marginTop: 6 }}>
        <thead>
          <tr>
            <th>Sl.No</th>
            <th>Name</th>
            <th>Relationship</th>
            <th>Age</th>
          </tr>
        </thead>
        <tbody>
          {data.familyMembers.map((m, i) => (
            <tr key={i}>
              <td className="filled">{i + 1}.</td>
              <td className="filled">{m.name}</td>
              <td className="filled">{m.relation}</td>
              <td className="filled">{m.age}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 14, paddingLeft: 18 }}>
        <div>9. Mode of travel: <span className="filled">{data.modeOfTravel}</span></div>
        <div>10. Class of accommodation entitled: <span className="filled">{data.classEntitled}</span></div>
        <div>11. From: <span className="filled">{data.fromStation}</span> &nbsp;&nbsp; To: <span className="filled">{data.toStation}</span></div>
        <div>12. Proposed date of departure: <span className="filled">{data.proposedDeparture}</span> &nbsp;&nbsp; Return: <span className="filled">{data.proposedReturn}</span></div>
      </div>

      <table style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>Particulars</th>
            <th>Estimated fare (Rs)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Self</td>
            <td className="filled">{fmtRs(num(data.estimatedFareSelf))}/-</td>
          </tr>
          <tr>
            <td>Family ({data.familyMembers.length} member{data.familyMembers.length !== 1 ? 's' : ''})</td>
            <td className="filled">{fmtRs(num(data.estimatedFareFamily))}/-</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>Total estimated fare</td>
            <td className="filled" style={{ fontWeight: 'bold' }}>{fmtRs(totalFare)}/-</td>
          </tr>
          <tr style={{ background: '#F4EFE5' }}>
            <td style={{ fontWeight: 'bold' }}>Advance requested (up to 90% as admissible)</td>
            <td className="filled" style={{ fontWeight: 'bold' }}>{fmtRs(num(data.advanceRequired))}/-</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 16, paddingLeft: 18, lineHeight: 1.7 }}>
        Certified that I and the family members named above have not availed of this LTC for the current block year, and the particulars furnished above are true to the best of my knowledge and belief. I undertake to submit the adjustment bill along with original tickets/boarding passes within the prescribed time limit after completion of the journey, failing which the advance is liable to be recovered in lump from my salary.
      </div>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', paddingLeft: 18, paddingRight: 18 }}>
        <div>Date: <span className="filled">{data.declarationDate}</span></div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 36 }}>&nbsp;</div>
          <div style={{ borderTop: '1px solid #000', paddingTop: 2, minWidth: 220 }}>Signature of the Government Servant</div>
        </div>
      </div>

      <div style={{ marginTop: 24, fontWeight: 'bold' }}>FOR OFFICE USE</div>
      <div style={{ marginTop: 8, paddingLeft: 18 }}>
        Advance of Rs. <span className="underline-dots" style={{ minWidth: 120 }}></span>/- sanctioned vide office order No. <span className="underline-dots" style={{ minWidth: 200 }}></span> dated <span className="underline-dots" style={{ minWidth: 100 }}></span>
      </div>

      <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', paddingLeft: 18, paddingRight: 18 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #000', paddingTop: 2, minWidth: 130 }}>Bill Clerk</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #000', paddingTop: 2, minWidth: 180 }}>Signature of D.D.O.</div>
        </div>
      </div>
    </div>
  );
}

