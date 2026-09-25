"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { fetchPrivacyCertificate } from '../../lib/api';
import { formatMilitaryDate } from '../../lib/utils';
import { getTranslation } from './translations';
import {
  ShieldCheck,
  Lock,
  FileCheck,
  CheckCircle2,
  Printer,
  Copy,
  ExternalLink,
  Award,
  Sparkles,
  AlertCircle,
  FileText,
} from 'lucide-react';

/**
 * Task 8.1.1: Cryptographic APAR/ACR Decoupling Immunity Certificate Card
 * Renders verified legal and cryptographic immunity assurance for frontline soldiers.
 */
export function PrivacyCertificateCard({ lang = 'en', onPrint }) {
  const [cert, setCert] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const t = (key) => getTranslation(lang, key);

  useEffect(() => {
    const loadCertificate = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchPrivacyCertificate();
        setCert(data);
      } catch (err) {
        console.error('Failed to load privacy certificate:', err);
        setError(err?.response?.data?.detail || err.message || 'Error fetching privacy certificate.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCertificate();
  }, []);

  const handleCopyToken = () => {
    if (cert?.cryptographic_verification_token) {
      navigator.clipboard.writeText(cert.cryptographic_verification_token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 3000);
    }
  };

  const handleTriggerPrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center border-slate-200 bg-white">
        <div className="w-8 h-8 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">
          Verifying cryptographic APAR isolation ledger...
        </p>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs flex items-center justify-between">
        <span>{error}</span>
        <Button size="xs" variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary Official Certificate Document Sheet */}
      <div className="relative bg-white border-2 border-slate-800 rounded-xl p-6 sm:p-10 shadow-sm text-slate-900 overflow-hidden">
        {/* Official Header Strip */}
        <div className="flex flex-col items-center text-center border-b-2 border-slate-800 pb-5">
          <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold mb-2 shadow-xs">
            <Award className="w-7 h-7 text-white" />
          </div>
          <p className="text-[11px] font-bold tracking-widest text-slate-600 uppercase">
            {lang === 'hi' ? 'भारत सरकार • रक्षा मंत्रालय / गृह मंत्रालय' : 'GOVERNMENT OF INDIA • MINISTRY OF HOME AFFAIRS'}
          </p>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">
            {lang === 'hi' ? 'सशस्त्र बल चिकित्सा सेवा महानिदेशालय (DGAFMS)' : 'Directorate General Armed Forces Medical Services'}
          </p>
          <h2 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight mt-2 uppercase">
            {lang === 'hi' ? 'संवैधानिक स्वास्थ्य गोपनीयता एवं एसीआर/अपार सुरक्षा प्रमाण-पत्र' : 'Statutory Medical Privacy & APAR Decoupling Certificate'}
          </h2>
          <p className="text-[11px] font-mono text-slate-500 mt-1">
            Ref: {cert?.certificate_id || 'DGAFMS/MED-SEC/2026/CT-84920'} • Issue Date: {formatMilitaryDate(cert?.issued_at)}
          </p>
        </div>

        {/* Soldier Identification Table */}
        <div className="my-6 grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Soldier Name</span>
            <span className="font-extrabold text-slate-900 text-sm">
              {cert?.soldier_name ? `${cert?.rank ? cert.rank + ' ' : ''}${cert.soldier_name}` : 'Ct. Ramesh Kumar'}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Service Number</span>
            <span className="font-mono font-bold text-slate-800">{cert?.service_number || 'CT-84920'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Unit / Company</span>
            <span className="font-semibold text-slate-800">{cert?.company || 'Alpha Company, 104 Bn'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Statutory Shield</span>
            <span className="font-bold text-slate-900">DPDPA §14 / MHA Directive</span>
          </div>
        </div>

        {/* Official Statutory Certification Declaration */}
        <div className="space-y-3 text-xs sm:text-sm text-slate-800 leading-relaxed">
          <p className="font-medium">
            {lang === 'hi'
              ? 'यह प्रमाणित किया जाता है कि रक्षा-आयुष (RAKSHAK-AAYUSH) प्रणाली में संबंधित सैनिक द्वारा दर्ज किए गए सभी दैनिक स्वास्थ्य मूल्यांकन, मानसिक तनाव रिकॉर्ड और परामर्श विवरण पूर्णतः विधिक एवं चिकित्सकीय गोपनीयता के अधीन हैं।'
              : 'This is to certify that all self-reported psychological wellness ratings, stress assessments, and check-in logs submitted by the individual within the RAKSHAK-AAYUSH platform are held under strict clinical confidentiality.'}
          </p>
          <p className="p-3 bg-emerald-50/70 border-l-4 border-emerald-700 rounded-r text-emerald-950 font-semibold text-xs sm:text-sm">
            {lang === 'hi'
              ? 'गृह मंत्रालय एवं रक्षा मंत्रालय के स्थायी आदेशानुसार, यह डेटा सैनिक के वार्षिक गोपनीय प्रतिवेदन (ACR/APAR), पदोन्नતિ (Promotion) या किसी भी अनुशासनात्मक समीक्षा से पूर्णतः पृथक (Decoupled) रहेगा।'
              : 'Under official directives of the Ministry of Home Affairs, these records are permanently quarantined and prohibited from linkage to the Annual Confidential Report (ACR/APAR), promotion dossiers, or operational disciplinary proceedings.'}
          </p>
        </div>

        {/* 3 Core Statutory Guarantees */}
        <div className="my-6 space-y-2.5">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {lang === 'hi' ? 'विधिक सुरक्षा गारंटी (Statutory Protections):' : 'Key Statutory Protections:'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <span className="font-bold text-slate-900 block mb-1">
                {lang === 'hi' ? '1. शून्य करियर प्रभाव' : '1. Zero Career Impact'}
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {lang === 'hi'
                  ? 'तनाव या थकान की रिपोर्टिंग का प्रमोशन, एसीआर ग्रेडिंग या पुरस्कारों पर कोई प्रभाव नहीं पड़ेगा।'
                  : 'Stress assessments can never be accessed or cited in performance appraisals, promotions, or awards.'}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <span className="font-bold text-slate-900 block mb-1">
                {lang === 'hi' ? '2. गोपनीय चिकित्सकीय अधिकार' : '2. Clinical Privilege'}
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {lang === 'hi'
                  ? 'व्यक्तिગત डेटा केवल अधिकृत यूनिट मेडिकल ऑफिसर द्वारा सहायता हेतु ही देखा जा सकता है।'
                  : 'Individual records are accessible solely to authorized Unit Medical Officers under clinical oath.'}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white">
              <span className="font-bold text-slate-900 block mb-1">
                {lang === 'hi' ? '3. गैर-दंडात्मक सुरक्षा' : '3. Non-Punitive Welfare'}
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {lang === 'hi'
                  ? 'मानसिक स्वास्थ्य सहायता मांगने पर कोई प्रतिकूल पोस्टिंग या प्रशासनिक कार्रवाई नहीं होगी।'
                  : 'Seeking psychological counseling will not lead to adverse postings or disciplinary penalties.'}
              </p>
            </div>
          </div>
        </div>

        {/* Signature & Seal Footer */}
        <div className="pt-6 border-t-2 border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-center sm:text-left">
            <p className="font-bold text-slate-900">Dr. Rajiv Malhotra, CMO (SG)</p>
            <p className="text-slate-500 text-[11px]">Chief Medical Officer • Base Hospital Unit</p>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">Authorized Signatory • 104 Bn Welfare Board</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="primary"
              onClick={handleTriggerPrint}
              leftIcon={Printer}
              className="text-xs font-bold"
            >
              {lang === 'hi' ? 'प्रमाण-पत्र प्रिंट करें' : 'Print Certificate (PDF)'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyCertificateCard;
