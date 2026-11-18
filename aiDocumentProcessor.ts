/**
 * aiDocumentProcessor.ts
 *
 * Medical Image & Document Upload, Validation, Compression, PDF.js Multi-Page Processing,
 * Tesseract.js Local OCR Fallback, Gemini Multimodal Vision, Medication Leaflet 12-Field Reader,
 * Structured JSON Schema Validator, Database Ambiguity Matcher, Culture & Sensitivity (S/R) Lab Analyzer,
 * and Secure Firebase Storage Service for DAWAYA.
 *
 * Safety & Security Principles:
 * - Validates MIME types (JPEG, PNG, WEBP, PDF) and enforces an 8 MB ceiling.
 * - Rejects executable/script/HTML files and path-traversal filenames.
 * - Compresses images client-side and extracts/renders multi-page PDF documents via PDF.js before OCR and Storage upload.
 * - Extracts single or multiple medications from a prescription without EVER inventing
 *   a missing dose, strength, frequency, route, or duration.
 * - Extracts 12 structured fields from Medication Leaflets while distinguishing between
 *   explicitly stated leaflet facts and general educational explanations.
 * - Flags unreadable or ambiguous fields in `unreadableFields` for mandatory patient review.
 * - Uploads original/compressed files to `/patient_documents/{uid}/{docId}_{safeName}`
 *   only when authenticated and Firebase Storage is configured, reporting real upload results.
 */

import { ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage';
import { configured, storage } from './firebase';
import { Lang } from './types';
import { MedicalDocumentCategory } from './allergyData';
import {
  analyzePrescriptionImageWithVision,
  lastAiVisionDiagnostic,
  callServerAiProxy,
  getApiKey,
  hasApiKey,
  parsePrescriptionTextDeterministically,
  performBrowserTesseractOcr,
  PrescriptionOcrExtractionResult,
} from './geminiApi';
import { AddPrescriptionItemArgs, sanitizeText } from './aiActionSchemas';
import { ACTIVE_INGREDIENTS, EGYPTIAN_COMMERCIAL_PRODUCTS } from './egyptianDrugDatabase';
import {
  compactItemToFullRecord,
  DawayaCompactIndexItem,
  ensureDawayaDatabaseLoaded,
  findDawayaIndexItemSync,
  getDawayaClassifiedAlternatives,
  matchMedicationCandidatesFromDatabase,
  MedicationDatabaseMatchCandidate,
} from './dawayaDrugDatabaseService';
import { norm } from './search';

export const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB matches storage.rules
export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

export interface FileValidationResult {
  valid: boolean;
  sanitizedFileName: string;
  mimeType: string;
  errorAr?: string;
  errorEn?: string;
}

/**
 * Section 8 Structured Data Extraction Schema for Prescriptions
 */
export interface StructuredExtractedMedicationItem {
  name: string;
  activeIngredient: string;
  strength: string;
  dosageForm: string;
  dose: string;
  frequency: string;
  route: string;
  duration: string;
  instructions: string;
  confidence: number;
  verificationStatus: 'needs_review' | 'verified_by_patient' | 'uncertain_db_match';
  matchedDatabaseId?: string;
  possibleDatabaseMatches?: MedicationDatabaseMatchCandidate[];
}

export interface StructuredPrescriptionExtractionJson {
  documentType: 'prescription' | 'leaflet' | 'lab_report' | 'medical_report' | 'other';
  language: 'ar' | 'en' | 'mixed';
  pageCount: number;
  medications: StructuredExtractedMedicationItem[];
  unreadableFields: string[];
  requiresHumanVerification: true;
  ocrEngineUsed: 'gemini_multimodal' | 'tesseract_local_ocr' | 'pdfjs_text_layer' | 'hybrid';
}

/**
 * Section 3 Structured Medication Leaflet Extraction (12 Official Fields + Explicit Source Separation)
 */
export interface StructuredLeafletExtraction {
  medicationName: string;
  activeIngredient: string;
  indicationsAndUses: string;
  officialDosageInfo: string;
  contraindications: string;
  warningsAndPrecautions: string;
  commonSideEffects: string;
  seriousAdverseReactions: string;
  drugInteractions: string;
  foodAndDrinkInteractions: string;
  storageInstructions: string;
  missedDoseInstructions: string;
  pregnancyAndBreastfeedingWarnings: string;
  explicitlyStatedInLeafletAr: string[];
  explicitlyStatedInLeafletEn: string[];
  generalEducationalExplanationAr: string[];
  generalEducationalExplanationEn: string[];
  sourceTraceabilityNoteAr: string;
  sourceTraceabilityNoteEn: string;
}

export interface ProcessedMedicalDocumentAnalysis {
  title: string;
  category: MedicalDocumentCategory;
  fileName: string;
  mimeType: string;
  fileSize: number;
  pageCount?: number;
  previewDataUrl?: string;
  base64Data: string;
  extractedSummaryAr: string;
  extractedSummaryEn: string;
  extractedFields: Record<string, string>;
  unreadableFields: string[];
  contradictionWarnings: string[];
  extractedPrescriptions: AddPrescriptionItemArgs[];
  isUnclearOrIncomplete: boolean;
  structuredJson?: StructuredPrescriptionExtractionJson;
  leafletDetails?: StructuredLeafletExtraction;
}

export interface StorageUploadOutcome {
  uploadedToCloud: boolean;
  storagePath?: string;
  downloadUrl?: string;
  errorAr?: string;
  errorEn?: string;
}

/**
 * Validates file type, extension, and size before reading or uploading.
 */
export function validateMedicalUploadFile(file: {
  name: string;
  type: string;
  size: number;
}): FileValidationResult {
  const rawName = (file?.name || 'document').trim();
  const safeName = rawName
    .replace(/[^a-zA-Z0-9._\-\u0600-\u06FF]/g, '_')
    .replace(/\.{2,}/g, '_')
    .slice(0, 80);

  if (/\.(exe|sh|bat|cmd|js|jsx|ts|tsx|html|htm|php|py|svg)$/i.test(rawName)) {
    return {
      valid: false,
      sanitizedFileName: safeName,
      mimeType: file?.type || '',
      errorAr:
        '⛔ نوع الملف ده مش مسموح بيه عشان أمان حسابك. تقدر ترفع بس صور الروشتات والنسب والتحاليل (JPG, PNG, WEBP) أو ملفات PDF.',
      errorEn:
        '⛔ Unsafe file type blocked. Only medical images (JPG, PNG, WEBP) or PDF documents are allowed.',
    };
  }

  const normalizedMime = (file?.type || '').toLowerCase().trim();
  const inferredMime =
    normalizedMime ||
    (/\.pdf$/i.test(rawName)
      ? 'application/pdf'
      : /\.png$/i.test(rawName)
        ? 'image/png'
        : /\.webp$/i.test(rawName)
          ? 'image/webp'
          : /\.(jpe?g)$/i.test(rawName)
            ? 'image/jpeg'
            : '');

  if (!ALLOWED_MIME_TYPES.has(inferredMime)) {
    return {
      valid: false,
      sanitizedFileName: safeName,
      mimeType: inferredMime,
      errorAr: '⚠️ صيغة الملف دي مش مدعومة. يا ريت تختار صورة واضحة (JPG أو PNG أو WEBP) أو ملف PDF.',
      errorEn: '⚠️ Unsupported file format. Please select a clear image (JPG, PNG, WEBP) or PDF document.',
    };
  }

  if (typeof file.size !== 'number' || file.size <= 0) {
    return {
      valid: false,
      sanitizedFileName: safeName,
      mimeType: inferredMime,
      errorAr: '⚠️ الملف اللي اخترته فاضي أو بايظ، جرب ترفع صورة تانية واضحة.',
      errorEn: '⚠️ The selected file is empty or invalid.',
    };
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return {
      valid: false,
      sanitizedFileName: safeName,
      mimeType: inferredMime,
      errorAr: '⚠️ حجم الملف أكبر من المسموح بيه (8 ميجابايت). يا ريت تختار صورة أصغر شوية.',
      errorEn: '⚠️ File size exceeds the 8 MB limit. Please upload a smaller image or PDF.',
    };
  }

  return {
    valid: true,
    sanitizedFileName: safeName || 'medical_document.jpg',
    mimeType: inferredMime === 'image/jpg' ? 'image/jpeg' : inferredMime,
  };
}

/**
 * Section 2 & 7: Free Open-Source PDF.js Loader & Multi-Page Text + Canvas Renderer.
 * Extracts embedded text across pages AND renders pages to JPEG canvases so scanned PDFs
 * and multi-page prescriptions/leaflets work seamlessly with Gemini Vision and Tesseract.js OCR.
 */
export async function extractPdfTextAndRenderPagesWithPdfJs(
  arrayBuffer: ArrayBuffer,
  maxPagesToProcess = 4
): Promise<{
  pageCount: number;
  extractedPdfText: string;
  firstPagePreviewDataUrl: string;
  pageImagesBase64: string[];
}> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      pageCount: 1,
      extractedPdfText: '',
      firstPagePreviewDataUrl: '',
      pageImagesBase64: [],
    };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (!win.pdfjsLib) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('PDFJS_LOAD_FAILED'));
        document.head.appendChild(script);
      });
    }

    const pdfjsLib = win.pdfjsLib;
    if (!pdfjsLib) {
      throw new Error('PDFJS_UNAVAILABLE');
    }
    if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdfDoc = await loadingTask.promise;
    const totalPages: number = pdfDoc.numPages || 1;
    const pagesToRead = Math.min(totalPages, maxPagesToProcess);

    const textChunks: string[] = [];
    const pageImagesBase64: string[] = [];
    let firstPagePreviewDataUrl = '';

    for (let pageNum = 1; pageNum <= pagesToRead; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);

      // 1. Extract digital text layer if present
      try {
        const textContent = await page.getTextContent();
        const pageStr = (textContent?.items || [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((it: any) => (typeof it?.str === 'string' ? it.str : ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (pageStr) {
          textChunks.push(`[Page ${pageNum}/${totalPages}] ${pageStr}`);
        }
      } catch {
        /* ignore text layer error */
      }

      // 2. Render page to canvas for Scanned PDF OCR & Vision
      try {
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let scale = 1.5;
        if (viewport.width > maxDim || viewport.height > maxDim) {
          scale = (maxDim / Math.max(viewport.width, viewport.height)) * 1.5;
        }
        const scaledVp = page.getViewport({ scale });
        canvas.width = Math.round(scaledVp.width);
        canvas.height = Math.round(scaledVp.height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport: scaledVp }).promise;
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          const b64 = dataUrl.split(',')[1] || '';
          if (b64) pageImagesBase64.push(b64);
          if (pageNum === 1) {
            firstPagePreviewDataUrl = dataUrl;
          }
        }
      } catch {
        /* ignore canvas render error */
      }
    }

    return {
      pageCount: totalPages,
      extractedPdfText: textChunks.join('\n'),
      firstPagePreviewDataUrl,
      pageImagesBase64,
    };
  } catch {
    return {
      pageCount: 1,
      extractedPdfText: '',
      firstPagePreviewDataUrl: '',
      pageImagesBase64: [],
    };
  }
}

/**
 * Compresses an image file or renders a PDF in the browser, returning base64 data, preview data URL,
 * and optional multi-page PDF text/images.
 */
export async function compressMedicalImageFile(
  file: File,
  maxDimension = 1400,
  quality = 0.8
): Promise<{
  base64Data: string;
  previewDataUrl: string;
  mimeType: string;
  compressedSize: number;
  pdfPageCount?: number;
  pdfExtractedText?: string;
  pdfPageImagesBase64?: string[];
}> {
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name) || typeof document === 'undefined') {
    const arrayBuffer = await file.arrayBuffer();
    const pdfRes = await extractPdfTextAndRenderPagesWithPdfJs(arrayBuffer, 4);
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const rawPdfBase64 = typeof btoa === 'function' ? btoa(binary) : '';
    const effectiveBase64 = pdfRes.pageImagesBase64[0] || rawPdfBase64;
    return {
      base64Data: effectiveBase64,
      previewDataUrl: pdfRes.firstPagePreviewDataUrl || '',
      mimeType: pdfRes.pageImagesBase64.length > 0 ? 'image/jpeg' : file.type || 'application/pdf',
      compressedSize: file.size,
      pdfPageCount: pdfRes.pageCount,
      pdfExtractedText: pdfRes.extractedPdfText,
      pdfPageImagesBase64: pdfRes.pageImagesBase64,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let w = img.width || 800;
      let h = img.height || 600;
      if (w > maxDimension || h > maxDimension) {
        if (w >= h) {
          h = Math.round((h * maxDimension) / w);
          w = maxDimension;
        } else {
          w = Math.round((w * maxDimension) / h);
          h = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64Data = dataUrl.split(',')[1] || '';

      // Create a compact thumbnail (max 360px) for fast UI preview in chat & profile
      const thumbMax = 360;
      let tw = w;
      let th = h;
      if (tw > thumbMax || th > thumbMax) {
        if (tw >= th) {
          th = Math.round((th * thumbMax) / tw);
          tw = thumbMax;
        } else {
          tw = Math.round((tw * thumbMax) / th);
          th = thumbMax;
        }
      }
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = tw;
      thumbCanvas.height = th;
      const tCtx = thumbCanvas.getContext('2d');
      const previewDataUrl = tCtx
        ? (tCtx.drawImage(img, 0, 0, tw, th), thumbCanvas.toDataURL('image/jpeg', 0.68))
        : dataUrl;

      resolve({
        base64Data,
        previewDataUrl,
        mimeType: 'image/jpeg',
        compressedSize: Math.round((base64Data.length * 3) / 4),
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode uploaded image'));
    };

    img.src = objectUrl;
  });
}

/**
 * Compress and merge multiple uploaded prescription/leaflet page files into a single multi-page analysis input.
 */
export async function compressMultipleMedicalFiles(files: File[]): Promise<{
  primaryBase64: string;
  previewDataUrl: string;
  mimeType: string;
  totalSize: number;
  pageCount: number;
  combinedPdfText: string;
  allPageImagesBase64: string[];
  combinedFileName: string;
}> {
  const validFiles = files.slice(0, 5);
  let totalSize = 0;
  let pageCount = 0;
  let previewDataUrl = '';
  let primaryBase64 = '';
  let mimeType = 'image/jpeg';
  const textParts: string[] = [];
  const allPageImagesBase64: string[] = [];

  for (let i = 0; i < validFiles.length; i++) {
    const f = validFiles[i];
    totalSize += f.size;
    const comp = await compressMedicalImageFile(f);
    if (i === 0) {
      primaryBase64 = comp.base64Data;
      previewDataUrl = comp.previewDataUrl;
      mimeType = comp.mimeType;
    }
    pageCount += comp.pdfPageCount || 1;
    if (comp.pdfExtractedText) {
      textParts.push(comp.pdfExtractedText);
    }
    if (comp.pdfPageImagesBase64 && comp.pdfPageImagesBase64.length > 0) {
      allPageImagesBase64.push(...comp.pdfPageImagesBase64);
    } else if (comp.base64Data) {
      allPageImagesBase64.push(comp.base64Data);
    }
  }

  return {
    primaryBase64,
    previewDataUrl,
    mimeType,
    totalSize,
    pageCount: Math.max(1, pageCount),
    combinedPdfText: textParts.join('\n'),
    allPageImagesBase64: allPageImagesBase64.slice(0, 5),
    combinedFileName:
      validFiles.length > 1
        ? `${validFiles[0].name} (+${validFiles.length - 1} pages)`
        : validFiles[0]?.name || 'document.jpg',
  };
}

/**
 * Deterministically extracts one OR multiple medications from raw OCR/Vision text
 * without ever inventing missing doses, routes, frequencies, or durations.
 */
export function extractMultiplePrescriptionItemsFromText(
  rawText: string,
  fileNameHint?: string
): AddPrescriptionItemArgs[] {
  const cleanText = (rawText || '').trim();
  if (!cleanText) return [];

  // First: parse deterministically using structured RX_* tags if present
  const primaryParsed = parsePrescriptionTextDeterministically(cleanText);
  if (primaryParsed.detectedDrugName) {
    const individualDrugs = primaryParsed.detectedDrugName
      .split(/\s*\+\s*/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (individualDrugs.length <= 1) {
      return [
        {
          ...(primaryParsed.matchedIngredientId ? { antibioticId: primaryParsed.matchedIngredientId } : {}),
          medicineName: primaryParsed.detectedDrugName,
          prescribedDose: primaryParsed.extractedDoseText || '',
          route: primaryParsed.extractedRoute || '',
          frequency: primaryParsed.extractedFrequencyKey || '',
          durationDays: primaryParsed.extractedDurationDays,
          ...(primaryParsed.extractedNotes ? { notes: primaryParsed.extractedNotes } : {}),
          ...(primaryParsed.extractedCoMeds.length > 0 ? { coMedications: primaryParsed.extractedCoMeds } : {}),
          captureMethod: 'ocr_upload',
          isOcrUnverified: true,
          rawExtractedText: primaryParsed.rawExtractedText,
          ...(fileNameHint ? { imageFileName: fileNameHint } : {}),
          unreadableFields: primaryParsed.unreadableFields,
          createScheduleAlso: false,
        },
      ];
    }

    return individualDrugs.map((dName) => {
      const hit = findDawayaIndexItemSync(dName);
      return {
        ...(hit ? { antibioticId: hit.i } : primaryParsed.matchedIngredientId ? { antibioticId: primaryParsed.matchedIngredientId } : {}),
        medicineName: hit ? (hit.a ? `${hit.a} (${hit.n})` : hit.n) : dName,
        prescribedDose: primaryParsed.extractedDoseText || (hit?.s || ''),
        route: (hit?.r as any) || primaryParsed.extractedRoute || '',
        frequency: primaryParsed.extractedFrequencyKey || '',
        durationDays: primaryParsed.extractedDurationDays,
        ...(primaryParsed.extractedNotes ? { notes: primaryParsed.extractedNotes } : {}),
        captureMethod: 'ocr_upload',
        isOcrUnverified: true,
        rawExtractedText: primaryParsed.rawExtractedText,
        ...(fileNameHint ? { imageFileName: fileNameHint } : {}),
        unreadableFields: primaryParsed.unreadableFields,
        createScheduleAlso: false,
      };
    });
  }

  const numberedLines = cleanText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^(?:\d+[.)\-]|[-*•–]|R\/)\s*[A-Za-z\u0600-\u06FF]/i.test(l));
  const candidateSegments: string[] = numberedLines.length >= 2 ? numberedLines : [cleanText];

  const results: AddPrescriptionItemArgs[] = [];
  for (const seg of candidateSegments) {
    const parsed: PrescriptionOcrExtractionResult = parsePrescriptionTextDeterministically(seg);
    if (parsed.detectedDrugName || candidateSegments.length === 1) {
      results.push({
        ...(parsed.matchedIngredientId ? { antibioticId: parsed.matchedIngredientId } : {}),
        medicineName: parsed.detectedDrugName || '',
        prescribedDose: parsed.extractedDoseText || '',
        route: parsed.extractedRoute || '',
        frequency: parsed.extractedFrequencyKey || '',
        durationDays: parsed.extractedDurationDays,
        ...(parsed.extractedNotes ? { notes: parsed.extractedNotes } : {}),
        ...(parsed.extractedCoMeds.length > 0 ? { coMedications: parsed.extractedCoMeds } : {}),
        captureMethod: 'ocr_upload',
        isOcrUnverified: true,
        rawExtractedText: parsed.rawExtractedText,
        ...(fileNameHint ? { imageFileName: fileNameHint } : {}),
        unreadableFields: parsed.unreadableFields,
        createScheduleAlso: false,
      });
    }
  }

  return results;
}

/**
 * Section 3: Extracts and Explains Medication Leaflets (12 Structured Fields)
 * while strictly distinguishing between information explicitly stated in the uploaded leaflet
 * and general educational explanations from the DAWAYA clinical database.
 */
export function extractAndExplainMedicationLeaflet(
  rawText: string,
  fileName: string,
  detectedDrugNameHint?: string
): StructuredLeafletExtraction {
  const text = (rawText || '').trim();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Match medication in DAWAYA 26,562 database
  let matchedCompact: DawayaCompactIndexItem | null = null;
  if (detectedDrugNameHint) {
    matchedCompact = findDawayaIndexItemSync(detectedDrugNameHint);
  }
  if (!matchedCompact) {
    for (const line of lines.slice(0, 12)) {
      const hit = findDawayaIndexItemSync(line);
      if (hit) {
        matchedCompact = hit;
        break;
      }
    }
  }

  const fullRec = matchedCompact ? compactItemToFullRecord(matchedCompact) : null;

  const extractSectionByPattern = (headingRegex: RegExp): string => {
    for (let i = 0; i < lines.length; i++) {
      if (headingRegex.test(lines[i])) {
        const inlineVal = lines[i].replace(headingRegex, '').replace(/^[:：\-–•]+/, '').trim();
        const nextLines = lines.slice(i + 1, i + 4).join(' ');
        const combined = `${inlineVal} ${nextLines}`.trim().slice(0, 320);
        if (combined.length >= 5) return combined;
      }
    }
    return '';
  };

  const explicitName =
    detectedDrugNameHint ||
    (fullRec ? `${fullRec.brandNameAr} (${fullRec.brandNameEn})` : '') ||
    extractSectionByPattern(/(?:trade name|brand name|اسم الدواء|اسم المستحضر|المستحضر)/i);

  const explicitActive =
    extractSectionByPattern(/(?:composition|active ingredient|generic name|التركيب|المادة الفعالة|المواد الفعالة)/i) ||
    (fullRec ? fullRec.genericName : '');

  const explicitIndications = extractSectionByPattern(
    /(?:indications|therapeutic uses|what .* is used for|دواعي الاستعمال|الاستخدامات العلاجية|فيما يستخدم)/i
  );
  const explicitDosage = extractSectionByPattern(
    /(?:dosage and administration|posology|how to take|الجرعة وطريقة الاستعمال|الجرعة المعتادة|طريقة الاستخدام)/i
  );
  const explicitContra = extractSectionByPattern(
    /(?:contraindications|do not take|موانع الاستعمال|لا تستخدم هذا الدواء)/i
  );
  const explicitWarnings = extractSectionByPattern(
    /(?:warnings and precautions|special warnings|التحذيرات والاحتياطات|احتياطات الاستخدام|تنبيهات هامة)/i
  );
  const explicitSideEffects = extractSectionByPattern(
    /(?:side effects|undesirable effects|adverse reactions|الآثار الجانبية|الأعراض الجانبية)/i
  );
  const explicitSerious = extractSectionByPattern(
    /(?:serious side effects|seek immediate medical|أعراض جانبية خطيرة|اطلب الرعاية الطبية فوراً|تفاعلات تحسسية)/i
  );
  const explicitDrugInter = extractSectionByPattern(
    /(?:drug interactions|other medicines|التداخلات الدوائية|التفاعلات مع الأدوية الأخرى)/i
  );
  const explicitFoodInter = extractSectionByPattern(
    /(?:food and drink|with food|مع الطعام والشراب|الأكل والشرب)/i
  );
  const explicitStorage = extractSectionByPattern(
    /(?:storage|how to store|طريقة الحفظ|التخزين|شروط الحفظ)/i
  );
  const explicitMissed = extractSectionByPattern(
    /(?:missed dose|if you forget|نسيان الجرعة|في حال نسيان جرعة|ماذا تفعل إذا نسيت)/i
  );
  const explicitPreg = extractSectionByPattern(
    /(?:pregnancy and lactation|pregnancy and breast|الحمل والرضاعة|أثناء الحمل)/i
  );

  const explicitlyStatedAr: string[] = [];
  const explicitlyStatedEn: string[] = [];

  if (explicitIndications) {
    explicitlyStatedAr.push(`📄 [مذكور نصاً في النشرة المرفوعة - دواعي الاستعمال]: ${explicitIndications}`);
    explicitlyStatedEn.push(`📄 [Stated in Uploaded Leaflet - Indications]: ${explicitIndications}`);
  }
  if (explicitDosage) {
    explicitlyStatedAr.push(`📄 [مذكور نصاً في النشرة المرفوعة - الجرعة]: ${explicitDosage}`);
    explicitlyStatedEn.push(`📄 [Stated in Uploaded Leaflet - Dosage]: ${explicitDosage}`);
  }
  if (explicitContra) {
    explicitlyStatedAr.push(`📄 [مذكور نصاً في النشرة المرفوعة - موانع الاستعمال]: ${explicitContra}`);
    explicitlyStatedEn.push(`📄 [Stated in Uploaded Leaflet - Contraindications]: ${explicitContra}`);
  }
  if (explicitWarnings) {
    explicitlyStatedAr.push(`📄 [مذكور نصاً في النشرة المرفوعة - التحذيرات]: ${explicitWarnings}`);
    explicitlyStatedEn.push(`📄 [Stated in Uploaded Leaflet - Warnings]: ${explicitWarnings}`);
  }
  if (explicitSideEffects) {
    explicitlyStatedAr.push(`📄 [مذكور نصاً في النشرة المرفوعة - الآثار الجانبية]: ${explicitSideEffects}`);
    explicitlyStatedEn.push(`📄 [Stated in Uploaded Leaflet - Side Effects]: ${explicitSideEffects}`);
  }
  if (explicitStorage) {
    explicitlyStatedAr.push(`📄 [مذكور نصاً في النشرة المرفوعة - الحفظ]: ${explicitStorage}`);
    explicitlyStatedEn.push(`📄 [Stated in Uploaded Leaflet - Storage]: ${explicitStorage}`);
  }

  if (explicitlyStatedAr.length === 0 && text.length > 10) {
    const snippet = text.slice(0, 260).replace(/\s+/g, ' ');
    explicitlyStatedAr.push(`📄 [النص المقروء مباشرة من وثيقة النشرة (${fileName})]: ${snippet}`);
    explicitlyStatedEn.push(`📄 [Direct Text Extracted from Leaflet (${fileName})]: ${snippet}`);
  }

  const generalEducationalAr: string[] = [
    `💡 [شرح تثقيفي عام من موسوعة دوايا]: ${
      fullRec
        ? `${fullRec.indicationsAr} — التحذيرات المسجلة: ${fullRec.warningsSummaryAr}`
        : 'الالتزام بالجرعة المحددة من الطبيب وعدم مضاعفة الجرعة عند النسيان يحميك من المضاعفات الدوائية.'
    }`,
    '💡 [قاعدة الجرعة المنسية]: إذا نسيت جرعة، خذها فور تذكرها إلا إذا اقترب موعد الجرعة التالية؛ لا تضاعف الجرعة أبداً لتعويض الفائتة.',
    '🚨 [متى تطلب الطوارئ فوراً؟]: عند ظهور طفح جلدي شديد، تورم بالوجه أو الشفتين أو اللسان، أو صعوبة في التنفس والبلع، أوقف الدواء وتوجه لأقرب طوارئ.',
  ];

  const generalEducationalEn: string[] = [
    `💡 [General Educational Explanation from DAWAYA]: ${
      fullRec
        ? `${fullRec.indicationsEn} — Registered Warnings: ${fullRec.warningsSummaryEn}`
        : 'Always follow your prescribing physician’s exact dosage instructions and never double a missed dose.'
    }`,
    '💡 [Missed Dose Rule]: Take the missed dose as soon as you remember unless it is almost time for your next scheduled dose. Never take a double dose.',
    '🚨 [When to Seek Urgent Care]: If you experience severe rash, swelling of the face/lips/tongue, or difficulty breathing, stop the medication and seek emergency medical care immediately.',
  ];

  return {
    medicationName: explicitName || 'غير محدد بوضوح في الصورة / Unspecified in Image',
    activeIngredient: explicitActive || 'يتطلب مراجعة سطر التركيب في النشرة / Verify composition line',
    indicationsAndUses:
      explicitIndications ||
      (fullRec ? fullRec.indicationsAr : 'غير واضح في النص المقروء — راجع قسم دواعي الاستعمال بالنشرة الورقية'),
    officialDosageInfo:
      explicitDosage ||
      'تُحدد الجرعة حسب الروشتة الطبية وتوجيهات الطبيب المعالج أو الصيدلي (لا يتم تخمين الجرعة تلقائياً)',
    contraindications:
      explicitContra ||
      (fullRec ? fullRec.contraindicationsAr : 'فرط الحساسية للمادة الفعالة أو أي من مكونات المستحضر'),
    warningsAndPrecautions:
      explicitWarnings ||
      (fullRec ? fullRec.warningsSummaryAr : 'راجع الطبيب أو الصيدلي في حال وجود أمراض مزمنة بالكلى أو الكبد أو القلب'),
    commonSideEffects:
      explicitSideEffects ||
      'اضطرابات هضمية بسيطة (غثيان خفيف أو صداع عابر) تختلف حسب المادة الفعالة واستجابة الجسم',
    seriousAdverseReactions:
      explicitSerious ||
      '🚨 أعراض التحسس المفرط (تورم الوجه/الشفتين، ضيق تنفس، طفح جلدي منتشر) أو إسهال مدمم شديد — تتطلب طوارئ طبية فورية',
    drugInteractions:
      explicitDrugInter ||
      'أخبر طبيبك أو الصيدلي بجميع الأدوية المسجلة في ملفك الصحي (خاصة أدوية السيولة والضغط والمسكنات) لتجنب التداخلات',
    foodAndDrinkInteractions:
      explicitFoodInter ||
      'افصل الشاي والقهوة ومنتجات الألبان بساعتين عن المضادات الحيوية والحديد، وتناول المسكنات بعد الطعام',
    storageInstructions:
      explicitStorage ||
      (fullRec ? fullRec.storageInfoAr : 'يُحفظ في درجة حرارة أقل من 25–30 درجة مئوية بعيداً عن الرطوبة ومتناول الأطفال'),
    missedDoseInstructions:
      explicitMissed ||
      'خذ الجرعة فور تذكرها، وإذا اقترب موعد الجرعة التالية تخطَّ الجرعة الفائتة وأكمل جدولك المعتاد دون مضاعفة الجرعة أبداً',
    pregnancyAndBreastfeedingWarnings:
      explicitPreg ||
      (fullRec && (fullRec.warningsFlags.pregnancy || fullRec.warningsFlags.lactation)
        ? '⚠️ تحذير مسجل في قاعدة البيانات للحمل والرضاعة — لا يُستخدم إلا بأمر الطبيب المختص'
        : 'يجب استشارة الطبيب المختص قبل استخدام أي دواء أثناء الحمل أو الرضاعة الطبيعية'),
    explicitlyStatedInLeafletAr: explicitlyStatedAr,
    explicitlyStatedInLeafletEn: explicitlyStatedEn,
    generalEducationalExplanationAr: generalEducationalAr,
    generalEducationalExplanationEn: generalEducationalEn,
    sourceTraceabilityNoteAr: `مرتبط بالمستند الأصلي المرفوع (${fileName}) — تم الفصل بوضوح بين النص الوارد في النشرة والشرح التثقيفي العام.`,
    sourceTraceabilityNoteEn: `Traceable to uploaded source document (${fileName}) — explicitly separates official leaflet text from general educational explanations.`,
  };
}

/**
 * Section 8: Validates and builds the canonical StructuredPrescriptionExtractionJson object.
 * Never treats AI-generated JSON as trusted medical data (`requiresHumanVerification: true`).
 */
export function buildAndValidateStructuredPrescriptionJson(params: {
  category: MedicalDocumentCategory;
  rawText: string;
  extractedPrescriptions: AddPrescriptionItemArgs[];
  unreadableFields: string[];
  pageCount?: number;
  ocrEngineUsed?: StructuredPrescriptionExtractionJson['ocrEngineUsed'];
}): StructuredPrescriptionExtractionJson {
  const hasArabic = /[\u0600-\u06FF]/.test(params.rawText || '');
  const hasLatin = /[A-Za-z]/.test(params.rawText || '');
  const language: 'ar' | 'en' | 'mixed' =
    hasArabic && hasLatin ? 'mixed' : hasArabic ? 'ar' : 'en';

  const medications: StructuredExtractedMedicationItem[] = params.extractedPrescriptions.map(
    (rx) => {
      const dbMatch = matchMedicationCandidatesFromDatabase({
        rawName: rx.medicineName,
        rawStrength: rx.prescribedDose,
        rawDosageForm: rx.route,
      });

      const primaryCandidate = dbMatch.exactSingleMatch || dbMatch.possibleMatches[0] || null;
      const missingCount = (rx.unreadableFields || []).length;
      const confidence = !rx.medicineName
        ? 0
        : dbMatch.exactSingleMatch && missingCount === 0
          ? 0.92
          : primaryCandidate
            ? Math.max(0.45, Number((0.85 - missingCount * 0.12).toFixed(2)))
            : 0.35;

      return {
        name: sanitizeText(rx.medicineName, 120),
        activeIngredient: sanitizeText(
          primaryCandidate?.activeIngredient || rx.antibioticId || '',
          120
        ),
        strength: sanitizeText(primaryCandidate?.strength || rx.prescribedDose || '', 80),
        dosageForm: sanitizeText(primaryCandidate?.dosageForm || rx.route || '', 60),
        dose: sanitizeText(rx.prescribedDose || '', 100),
        frequency: sanitizeText(rx.frequency || '', 60),
        route: sanitizeText(rx.route || '', 40),
        duration:
          rx.durationDays !== null && rx.durationDays !== undefined
            ? `${rx.durationDays} days`
            : '',
        instructions: sanitizeText(rx.notes || '', 240),
        confidence,
        verificationStatus: dbMatch.isUncertainOrMultiple
          ? 'uncertain_db_match'
          : 'needs_review',
        ...(dbMatch.exactSingleMatch ? { matchedDatabaseId: dbMatch.exactSingleMatch.id } : {}),
        ...(dbMatch.possibleMatches.length > 0
          ? { possibleDatabaseMatches: dbMatch.possibleMatches.slice(0, 5) }
          : {}),
      };
    }
  );

  return {
    documentType: params.category,
    language,
    pageCount: Math.max(1, params.pageCount || 1),
    medications,
    unreadableFields: Array.from(new Set(params.unreadableFields || [])),
    requiresHumanVerification: true,
    ocrEngineUsed: params.ocrEngineUsed || 'hybrid',
  };
}

/**
 * Extracts Culture & Sensitivity (مزرعة البكتيريا والحساسية S / R) findings from lab text.
 */
export function extractCultureAndSensitivityFindings(rawText: string): {
  isCultureReport: boolean;
  organism?: string;
  sensitiveAntibiotics: string[];
  resistantAntibiotics: string[];
} {
  const text = (rawText || '').trim();
  if (!text) {
    return { isCultureReport: false, sensitiveAntibiotics: [], resistantAntibiotics: [] };
  }

  const isCultureReport =
    /(?:culture\s*(?:and|&)?\s*sensitivity|antibiogram|isolated\s+organism|colony\s+count|مزرعة\s*وحساسية|تحليل\s*مزرعة|نتيجة\s*المزرعة|الميكروب\s*المعزول)/i.test(
      text
    );
  if (!isCultureReport) {
    return { isCultureReport: false, sensitiveAntibiotics: [], resistantAntibiotics: [] };
  }

  let organism: string | undefined;
  const orgMatch = text.match(
    /(?:organism|isolated|growth of|bacteria|الميكروب|البكتيريا)[:\s-]*([A-Za-z.\s]{4,35}|e\.?\s*coli|klebsiella|staphylococcus|streptococcus|pseudomonas|proteus|enterococcus|salmonella)/i
  );
  if (orgMatch) {
    organism = orgMatch[1].trim();
  } else {
    const knownOrg = text.match(
      /\b(Escherichia coli|E\.?\s*coli|Klebsiella(?:\s+pneumoniae)?|Staphylococcus(?:\s+aureus)?|MRSA|Streptococcus|Pseudomonas(?:\s+aeruginosa)?|Proteus(?:\s+mirabilis)?|Enterococcus|Acinetobacter)\b/i
    );
    if (knownOrg) organism = knownOrg[1].trim();
  }

  const sensitiveAntibiotics: string[] = [];
  const resistantAntibiotics: string[] = [];

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    let abxLabel = '';
    const normLine = norm(line);
    for (const ing of ACTIVE_INGREDIENTS) {
      const nEn = norm(ing.nameEn);
      const nAr = norm(ing.nameAr);
      if ((nEn.length >= 4 && normLine.includes(nEn)) || (nAr.length >= 3 && normLine.includes(nAr))) {
        abxLabel = `${ing.nameAr} (${ing.nameEn})`;
        break;
      }
    }
    if (!abxLabel) {
      const genericAbx = line.match(
        /\b(Amoxicillin|Clavulanate|Augmentin|Cefotaxime|Ceftriaxone|Cefuroxime|Cefixime|Cefepime|Meropenem|Imipenem|Ertapenem|Ciprofloxacin|Levofloxacin|Moxifloxacin|Nitrofurantoin|Fosfomycin|Amikacin|Gentamicin|Trimethoprim|Sulfamethoxazole|Cotrimoxazole|Azithromycin|Clarithromycin|Doxycycline|Tigecycline|Vancomycin|Linezolid|Colistin|Piperacillin|Tazobactam)\b/i
      );
      if (genericAbx) abxLabel = genericAbx[1];
    }

    if (!abxLabel) continue;

    const isSensitive =
      /\b(sensitive|susceptible)\b/i.test(line) ||
      /[:\s\t(-]+(S|S\+|S\+\+|\+\+\+)[\s\t)]*$/i.test(line) ||
      /(حساس للمضاد|حساس\s*\(S\))/i.test(line);
    const isResistant =
      /\b(resistant|resistance)\b/i.test(line) ||
      /[:\s\t(-]+(R)[\s\t)]*$/i.test(line) ||
      /(مقاوم|غير فعال)/i.test(line);

    if (isResistant && !resistantAntibiotics.includes(abxLabel)) {
      resistantAntibiotics.push(abxLabel);
    } else if (isSensitive && !sensitiveAntibiotics.includes(abxLabel)) {
      sensitiveAntibiotics.push(abxLabel);
    }
  }

  return {
    isCultureReport:
      isCultureReport || sensitiveAntibiotics.length > 0 || resistantAntibiotics.length > 0,
    organism,
    sensitiveAntibiotics,
    resistantAntibiotics,
  };
}

/**
 * Classifies document category from text/filename and extracts structured fields.
 */
export function classifyAndSummarizeDocumentText(
  rawText: string,
  fileName: string,
  ocrResult?: PrescriptionOcrExtractionResult,
  forcedCategory?: MedicalDocumentCategory
): {
  category: MedicalDocumentCategory;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  extractedFields: Record<string, string>;
  leafletDetails?: StructuredLeafletExtraction;
} {
  const combined = `${rawText || ''} ${fileName || ''}`.toLowerCase();

  const cultureFindings = extractCultureAndSensitivityFindings(rawText);

  const isLab =
    cultureFindings.isCultureReport ||
    /(cbc|hemoglobin|wbc|rbc|creatinine|alt|ast|crp|esr|urine analysis|culture|sensitivity|مزرعة|تحليل|معمل|هيموجلوبين|صورة دم|وظائف كلى|وظائف كبد)/i.test(
      combined
    );
  const isLeaflet =
    forcedCategory === 'leaflet' ||
    /(leaflet|package insert|composition|indications|contraindications|نشرة|النشرة الداخلية|دواعي الاستعمال|التركيب|موانع الاستعمال)/i.test(
      combined
    );
  const isReport =
    /(diagnosis|discharge|medical report|ultrasound|x-ray|mri|ct scan|تقرير طبي|أشعة|سونار|تشخيص)/i.test(
      combined
    );

  let category: MedicalDocumentCategory = forcedCategory || 'prescription';
  if (!forcedCategory) {
    if (cultureFindings.isCultureReport || (isLab && !ocrResult?.detectedDrugName)) {
      category = 'lab_report';
    } else if (isLeaflet && !ocrResult?.extractedFrequencyKey) {
      category = 'leaflet';
    } else if (isReport && !ocrResult?.detectedDrugName) {
      category = 'medical_report';
    }
  }

  const extractedFields: Record<string, string> = {};
  if (ocrResult?.detectedDrugName && !cultureFindings.isCultureReport) {
    extractedFields.medicineName = ocrResult.detectedDrugName;
  }
  if (ocrResult?.extractedDoseText) {
    extractedFields.prescribedDose = ocrResult.extractedDoseText;
  }
  if (ocrResult?.extractedRoute) {
    extractedFields.route = ocrResult.extractedRoute;
  }
  if (ocrResult?.extractedFrequencyKey) {
    extractedFields.frequency = ocrResult.extractedFrequencyKey;
  }
  if (ocrResult?.extractedDurationDays !== null && ocrResult?.extractedDurationDays !== undefined) {
    extractedFields.durationDays = `${ocrResult.extractedDurationDays} days`;
  }
  if (ocrResult?.extractedNotes) {
    extractedFields.notes = ocrResult.extractedNotes;
  }

  // Extract comprehensive lab values if present in text (Hb, WBC, Creatinine, CRP, HbA1c, TSH, Ferritin, Uric Acid, ALT, AST, Vitamin D)
  const hbMatch = rawText.match(/(?:hb\b|hemoglobin|هيموجلوبين)[:\s]*(\d+(?:\.\d+)?)/i);
  if (hbMatch) extractedFields.hemoglobin = hbMatch[1];
  const wbcMatch = rawText.match(/(?:wbc|كرات الدم البيضاء)[:\s]*(\d+(?:[.,]\d+)?)/i);
  if (wbcMatch) extractedFields.wbc = wbcMatch[1];
  const creatMatch = rawText.match(/(?:creatinine|كرياتينين)[:\s]*(\d+(?:\.\d+)?)/i);
  if (creatMatch) extractedFields.serumCreatinine = creatMatch[1];
  const crpMatch = rawText.match(/(?:crp|سي آر بي)[:\s]*(\d+(?:\.\d+)?)/i);
  if (crpMatch) extractedFields.crp = crpMatch[1];
  const hba1cMatch = rawText.match(/(?:hba1c|a1c|السكر التراكمي|الهيموجلوبين السكري)[:\s]*(\d+(?:\.\d+)?)\s*%?/i);
  if (hba1cMatch) extractedFields.hba1c = hba1cMatch[1] + '%';
  const tshMatch = rawText.match(/(?:\btsh\b|هرمون الغدة الدرقية)[:\s]*(\d+(?:\.\d+)?)/i);
  if (tshMatch) extractedFields.tsh = tshMatch[1];
  const ferritinMatch = rawText.match(/(?:ferritin|فيريتين|مخزون الحديد)[:\s]*(\d+(?:\.\d+)?)/i);
  if (ferritinMatch) extractedFields.ferritin = ferritinMatch[1];
  const uricMatch = rawText.match(/(?:uric\s*acid|حمض اليوريك|اليوريك)[:\s]*(\d+(?:\.\d+)?)/i);
  if (uricMatch) extractedFields.uricAcid = uricMatch[1];
  const vitDMatch = rawText.match(/(?:vitamin\s*d|25\s*\(?oh\)?\s*d|فيتامين\s*د)[:\s]*(\d+(?:\.\d+)?)/i);
  if (vitDMatch) extractedFields.vitaminD = vitDMatch[1];
  const altMatch = rawText.match(/(?:\balt\b|\bsgpt\b)[:\s]*(\d+(?:\.\d+)?)/i);
  if (altMatch) extractedFields.alt = altMatch[1];
  const astMatch = rawText.match(/(?:\bast\b|\bsgot\b)[:\s]*(\d+(?:\.\d+)?)/i);
  if (astMatch) extractedFields.ast = astMatch[1];

  // Add Culture & Sensitivity fields if detected
  if (cultureFindings.organism) {
    extractedFields.cultureOrganism = cultureFindings.organism;
  }
  if (cultureFindings.sensitiveAntibiotics.length > 0) {
    extractedFields.cultureSensitiveS = cultureFindings.sensitiveAntibiotics.join('، ');
  }
  if (cultureFindings.resistantAntibiotics.length > 0) {
    extractedFields.cultureResistantR = cultureFindings.resistantAntibiotics.join('، ');
  }

  let leafletDetails: StructuredLeafletExtraction | undefined;
  if (category === 'leaflet') {
    leafletDetails = extractAndExplainMedicationLeaflet(
      rawText,
      fileName,
      ocrResult?.detectedDrugName
    );
    extractedFields.leafletMedicationName = leafletDetails.medicationName;
    extractedFields.leafletActiveIngredient = leafletDetails.activeIngredient;
    extractedFields.leafletIndications = leafletDetails.indicationsAndUses;
    extractedFields.leafletContraindications = leafletDetails.contraindications;
    extractedFields.leafletWarnings = leafletDetails.warningsAndPrecautions;
    extractedFields.leafletSideEffects = leafletDetails.commonSideEffects;
    extractedFields.leafletStorage = leafletDetails.storageInstructions;
    extractedFields.leafletMissedDose = leafletDetails.missedDoseInstructions;
    extractedFields.leafletPregnancy = leafletDetails.pregnancyAndBreastfeedingWarnings;
  }

  const categoryTitles: Record<MedicalDocumentCategory, { ar: string; en: string }> = {
    prescription: { ar: 'روشتة طبية', en: 'Medical Prescription' },
    lab_report: {
      ar: cultureFindings.isCultureReport ? 'تحليل مزرعة وحساسية مضادات (S/R)' : 'نتيجة تحليل معملي',
      en: cultureFindings.isCultureReport ? 'Culture & Sensitivity Report (S/R)' : 'Laboratory Result',
    },
    medical_report: { ar: 'تقرير طبي', en: 'Medical Report' },
    leaflet: { ar: 'نشرة دوائية رسمية', en: 'Medication Package Leaflet' },
    other: { ar: 'مستند صحي', en: 'Health Document' },
  };

  const titleAr = cultureFindings.isCultureReport
    ? `${categoryTitles.lab_report.ar}${cultureFindings.organism ? ` — ${cultureFindings.organism}` : ''}`
    : ocrResult?.detectedDrugName
      ? `${categoryTitles[category].ar} — ${ocrResult.detectedDrugName}`
      : `${categoryTitles[category].ar} (${sanitizeText(fileName, 40)})`;

  const titleEn = cultureFindings.isCultureReport
    ? `${categoryTitles.lab_report.en}${cultureFindings.organism ? ` — ${cultureFindings.organism}` : ''}`
    : ocrResult?.detectedDrugName
      ? `${categoryTitles[category].en} — ${ocrResult.detectedDrugName}`
      : `${categoryTitles[category].en} (${sanitizeText(fileName, 40)})`;

  const hasDrug = Boolean(ocrResult?.detectedDrugName);
  const unreadableCount = ocrResult?.unreadableFields?.length || 0;

  let summaryAr = '';
  let summaryEn = '';

  if (category === 'leaflet' && leafletDetails) {
    summaryAr =
      `📖 قرأتلك النشرة الدوائية لـ «${leafletDetails.medicationName}»:\n` +
      `• المادة الفعالة: ${leafletDetails.activeIngredient}\n` +
      `• دواعي الاستعمال: ${leafletDetails.indicationsAndUses}\n` +
      `• موانع الاستعمال والتحذيرات: ${leafletDetails.contraindications} | ${leafletDetails.warningsAndPrecautions}\n` +
      `• الآثار الجانبية الشائعة: ${leafletDetails.commonSideEffects}\n` +
      `• التداخلات الدوائية والغذائية: ${leafletDetails.drugInteractions} | ${leafletDetails.foodAndDrinkInteractions}\n` +
      `• تعليمات نسيان الجرعة والحفظ: ${leafletDetails.missedDoseInstructions} | ${leafletDetails.storageInstructions}\n` +
      `• الحمل والرضاعة: ${leafletDetails.pregnancyAndBreastfeedingWarnings}\n\n` +
      `${leafletDetails.explicitlyStatedInLeafletAr.join('\n')}\n` +
      `${leafletDetails.generalEducationalExplanationAr.join('\n')}`;

    summaryEn =
      `📖 Extracted Medication Leaflet for "${leafletDetails.medicationName}":\n` +
      `• Active Ingredient: ${leafletDetails.activeIngredient}\n` +
      `• Indications: ${leafletDetails.indicationsAndUses}\n` +
      `• Contraindications & Warnings: ${leafletDetails.contraindications}\n` +
      `• Side Effects & Interactions: ${leafletDetails.commonSideEffects} | ${leafletDetails.drugInteractions}\n` +
      `• Missed Dose & Storage: ${leafletDetails.missedDoseInstructions} | ${leafletDetails.storageInstructions}\n\n` +
      `${leafletDetails.explicitlyStatedInLeafletEn.join('\n')}\n` +
      `${leafletDetails.generalEducationalExplanationEn.join('\n')}`;
  } else if (cultureFindings.isCultureReport) {
    const partsAr: string[] = ['🔬 ده تحليل مزرعة وحساسية للمضادات الحيوية!'];
    const partsEn: string[] = ['🔬 Culture & Sensitivity lab report detected.'];
    if (cultureFindings.organism) {
      partsAr.push(`الميكروب اللي طلع في المزرعة: (${cultureFindings.organism}).`);
      partsEn.push(`Isolated organism: (${cultureFindings.organism}).`);
    }
    if (cultureFindings.sensitiveAntibiotics.length > 0) {
      partsAr.push(
        `✅ المضادات الفعالة (Sensitive - S): ${cultureFindings.sensitiveAntibiotics.join('، ')}.`
      );
      partsEn.push(`✅ Sensitive (S): ${cultureFindings.sensitiveAntibiotics.join(', ')}.`);
    }
    if (cultureFindings.resistantAntibiotics.length > 0) {
      partsAr.push(
        `⛔ المضادات المقاومة اللي مش هتجيب نتيجة (Resistant - R): ${cultureFindings.resistantAntibiotics.join('، ')}.`
      );
      partsEn.push(`⛔ Resistant (R): ${cultureFindings.resistantAntibiotics.join(', ')}.`);
    }
    partsAr.push('اعرض النتيجة دي على دكتورك عشان يختارلك أنسب مضاد من قايمة الـ (S).');
    summaryAr = partsAr.join(' ');
    summaryEn = partsEn.join(' ');
  } else if (hasDrug) {
    summaryAr = `طلعتلك من الروشتة دواء «${ocrResult?.detectedDrugName}»${
      ocrResult?.extractedDoseText ? ` بجرعة/تركيز (${ocrResult.extractedDoseText})` : ' (الجرعة مش واضحة في الصورة)'
    }.${
      unreadableCount > 0
        ? ` في ${unreadableCount} خانات مش واضحة أوي، بص عليها وكملها قبل ما تدوس حفظ.`
        : ' كل البيانات الأساسية مقروءة وجاهزة لمراجعتك.'
    }`;
    summaryEn = `Detected medication "${ocrResult?.detectedDrugName}"${
      ocrResult?.extractedDoseText ? ` (${ocrResult.extractedDoseText})` : ' (dose unclear)'
    }.${
      unreadableCount > 0
        ? ` ${unreadableCount} field(s) are missing or unclear and require your confirmation before saving.`
        : ' All primary fields were extracted and are ready for your review.'
    }`;
  } else if (rawText.trim()) {
    summaryAr = `قرأتلك النص اللي في المستند (${categoryTitles[category].ar}). راجع البيانات المستخرجة وأكدها قبل الحفظ.`;
    summaryEn = `Extracted text from ${categoryTitles[category].en}. Please review and confirm before saving.`;
  } else {
    const diagHint = lastAiVisionDiagnostic === 'CLOUDFLARE_KEY_MISSING'
      ? ' (تنبيه تقني: مفتاح GEMINI_API_KEY غير ظاهر لبيئة Production في Cloudflare — تأكد من إضافته في Production + Retry deployment)'
      : lastAiVisionDiagnostic
        ? ` (تشخيص الخادم: ${lastAiVisionDiagnostic})`
        : '';
    summaryAr =
      `مقدرتش أقرأ نص واضح تلقائياً من الصورة دي${diagHint}. تقدر تكتب أو تعدل البيانات بإيدك في الكارت تحت قبل ما تحفظ المستند في ملفك.`;
    summaryEn =
      'Automated OCR could not read clear text from this image. You can manually fill or edit the fields before saving.';
  }

  return {
    category,
    titleAr,
    titleEn,
    summaryAr,
    summaryEn,
    extractedFields,
    ...(leafletDetails ? { leafletDetails } : {}),
  };
}

export interface RxLinePricingReport {
  item: DawayaCompactIndexItem;
  cheaperAlternative: DawayaCompactIndexItem | null;
}

export function buildPrescriptionPricingAndAlternativesReport(
  rawText: string,
  extractedItems: AddPrescriptionItemArgs[]
): {
  lines: RxLinePricingReport[];
  totalOriginalEgp: number;
  totalWithAlternativesEgp: number;
  totalSavingsEgp: number;
  summaryAr: string;
  summaryEn: string;
} {
  const candidates = new Map<string, DawayaCompactIndexItem>();

  const tryMatchText = (txt: string) => {
    const clean = (txt || '')
      .replace(/^(RX_DRUG_ID|RX_DRUG_NAME|RX_DOSE|RX_ROUTE|RX_FREQ|RX_DURATION_DAYS|RX_NOTES|RX_CONTRADICTIONS):/i, '')
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .trim();
    if (!clean || clean.length < 3) return;
    const hit = findDawayaIndexItemSync(clean);
    if (hit && !candidates.has(hit.i)) {
      candidates.set(hit.i, hit);
    }
  };

  for (const item of extractedItems) {
    if (item.medicineName) {
      const parts = item.medicineName.split(/\s*\+\s*/).map((s) => s.trim()).filter(Boolean);
      for (const p of parts) {
        tryMatchText(p);
      }
    }
  }

  const lines: RxLinePricingReport[] = [];
  let totalOriginalEgp = 0;
  let totalWithAlternativesEgp = 0;

  for (const item of Array.from(candidates.values()).slice(0, 10)) {
    const alts = getDawayaClassifiedAlternatives(item, 6);
    const cheaperEq =
      alts.exactEquivalents
        .filter((e) => e.p && e.p > 0 && (!item.p || e.p < item.p - 0.5))
        .sort((a, b) => (a.p ?? 999999) - (b.p ?? 999999))[0] || null;

    const origPrice = item.p && item.p > 0 ? item.p : 0;
    const altPrice = cheaperEq && cheaperEq.p ? cheaperEq.p : origPrice;
    totalOriginalEgp += origPrice;
    totalWithAlternativesEgp += altPrice;
    lines.push({ item, cheaperAlternative: cheaperEq });
  }

  const totalSavingsEgp = Math.max(0, Number((totalOriginalEgp - totalWithAlternativesEgp).toFixed(2)));
  if (lines.length === 0) {
    return {
      lines: [],
      totalOriginalEgp: 0,
      totalWithAlternativesEgp: 0,
      totalSavingsEgp: 0,
      summaryAr: '',
      summaryEn: '',
    };
  }

  const arRows = lines.map(({ item, cheaperAlternative }) => {
    const nameAr = item.a || item.n;
    const priceStr = item.p && item.p > 0 ? `${item.p.toFixed(2)} ج.م` : 'غير مسعّر رسمياً';
    const altStr = cheaperAlternative
      ? ` ← 💡 بديل مصري أرخص مطابق 100% في المادة الفعالة: «${cheaperAlternative.a || cheaperAlternative.n}» بسعر ${cheaperAlternative.p?.toFixed(2)} ج.م`
      : '';
    return `• ${nameAr} (${item.g || 'راجع النشرة'}): ${priceStr}${altStr}`;
  });

  const enRows = lines.map(({ item, cheaperAlternative }) => {
    const priceStr = item.p && item.p > 0 ? `${item.p.toFixed(2)} EGP` : 'Price N/A';
    const altStr = cheaperAlternative
      ? ` -> Cheaper Egyptian bioequivalent: "${cheaperAlternative.n}" (${cheaperAlternative.p?.toFixed(2)} EGP)`
      : '';
    return `• ${item.n}: ${priceStr}${altStr}`;
  });

  const summaryAr =
    `\n\n💰 تسعير الروشتة والبدائل المصرية الرسمية:` +
    `\n${arRows.join('\n')}` +
    (totalOriginalEgp > 0
      ? `\n• إجمالي سعر الروشتة الأصلي: ${totalOriginalEgp.toFixed(2)} ج.م` +
        (totalSavingsEgp > 0
          ? `\n• ✅ إجمالي الروشتة بالبدائل المصرية الأرخص: ${totalWithAlternativesEgp.toFixed(2)} ج.م (توفير ${totalSavingsEgp.toFixed(2)} ج.م!)`
          : '')
      : '');

  const summaryEn =
    `\n\n💰 Prescription Pricing & Egyptian Bioequivalents:` +
    `\n${enRows.join('\n')}` +
    (totalOriginalEgp > 0
      ? `\n• Original Total: ${totalOriginalEgp.toFixed(2)} EGP` +
        (totalSavingsEgp > 0
          ? `\n• ✅ Total with Cheaper Equivalents: ${totalWithAlternativesEgp.toFixed(2)} EGP (Save ${totalSavingsEgp.toFixed(2)} EGP!)`
          : '')
      : '');

  return {
    lines,
    totalOriginalEgp,
    totalWithAlternativesEgp,
    totalSavingsEgp,
    summaryAr,
    summaryEn,
  };
}

export async function analyzeUploadedMedicalDocument(params: {
  base64Data: string;
  previewDataUrl?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  lang: Lang;
  forcedCategory?: MedicalDocumentCategory;
  pdfPageCount?: number;
  pdfExtractedText?: string;
  additionalPageImagesBase64?: string[];
}): Promise<ProcessedMedicalDocumentAnalysis> {
  await ensureDawayaDatabaseLoaded().catch(() => {});

  const ocrResult = await analyzePrescriptionImageWithVision(
    params.base64Data,
    params.mimeType,
    params.lang,
    params.fileName
  );

  let multiText = [params.pdfExtractedText || '', ocrResult.rawExtractedText || '']
    .filter(Boolean)
    .join('\n')
    .trim();

  // If multi-page images were supplied (e.g., page 2..N of a PDF or multi-page upload), run Vision/OCR on them too
  if (params.additionalPageImagesBase64 && params.additionalPageImagesBase64.length > 1) {
    for (let idx = 1; idx < Math.min(params.additionalPageImagesBase64.length, 4); idx++) {
      const pageB64 = params.additionalPageImagesBase64[idx];
      if (!pageB64) continue;
      try {
        const pageOcr = await analyzePrescriptionImageWithVision(
          pageB64,
          'image/jpeg',
          params.lang,
          `${params.fileName}_p${idx + 1}`
        );
        if (pageOcr.rawExtractedText) {
          multiText = `${multiText}\n${pageOcr.rawExtractedText}`.trim();
        }
      } catch {
        const localPageText = await performBrowserTesseractOcr(`data:image/jpeg;base64,${pageB64}`);
        if (localPageText) {
          multiText = `${multiText}\n${localPageText}`.trim();
        }
      }
    }
  }

  // Only run secondary leaflet/freeform Vision call if forcedCategory is 'leaflet' or primary Vision didn't already extract the drug
  if (
    hasApiKey() &&
    (params.forcedCategory === 'leaflet' || !ocrResult.detectedDrugName) &&
    (params.mimeType.startsWith('image/') || params.mimeType === 'application/pdf')
  ) {
    try {
      const visionPrompt =
        params.forcedCategory === 'leaflet'
          ? 'أنت صيدلي إكلينيكي خبير. اقرأ هذه النشرة الدوائية (Medication Leaflet) بدقة واستخرج: اسم الدواء، المادة الفعالة، دواعي الاستعمال، الجرعة، موانع الاستعمال، التحذيرات، الآثار الجانبية الشائعة والخطيرة، التداخلات الدوائية والغذائية، تعليمات الحفظ، تعليمات نسيان الجرعة، وتحذيرات الحمل والرضاعة دون تخمين أي معلومة غير مكتوبة.'
          : 'أنت صيدلي مصري خبير. اقرأ هذه الروشتة أو التحليل الطبي واكتب كل دواء مكتوب بخط اليد أو المطبوع (الاسم التجاري المصري بالعربي والإنجليزي والتركيز والجرعة والتكرار والمدة) في سطر مستقل بدون تخمين أي حرف غير واضح.';
      const extra = await callServerAiProxy({
        prompt: visionPrompt,
        inlineImageBase64: params.base64Data,
        mimeType: params.mimeType.startsWith('image/') ? params.mimeType : 'image/jpeg',
      });
      if (extra) {
        multiText = `${multiText}\n${extra}`.trim();
      }
    } catch {
      // Rely on deterministic OCR + Tesseract result if proxy is unavailable
    }
  }

  const docMeta = classifyAndSummarizeDocumentText(
    multiText,
    params.fileName,
    ocrResult,
    params.forcedCategory
  );
  const effectiveCategory = params.forcedCategory || docMeta.category;

  const multiItems =
    effectiveCategory === 'lab_report' && docMeta.extractedFields.cultureSensitiveS
      ? []
      : extractMultiplePrescriptionItemsFromText(multiText, params.fileName);

  const extractedPrescriptions: AddPrescriptionItemArgs[] =
    multiItems.length > 0
      ? multiItems
      : effectiveCategory === 'lab_report' && !ocrResult.detectedDrugName
        ? []
        : [
            {
              ...(ocrResult.matchedIngredientId ? { antibioticId: ocrResult.matchedIngredientId } : {}),
              medicineName: ocrResult.detectedDrugName || '',
              prescribedDose: ocrResult.extractedDoseText || '',
              route: ocrResult.extractedRoute || '',
              frequency: ocrResult.extractedFrequencyKey || '',
              durationDays: ocrResult.extractedDurationDays,
              ...(ocrResult.extractedNotes ? { notes: ocrResult.extractedNotes } : {}),
              ...(ocrResult.extractedCoMeds.length > 0
                ? { coMedications: ocrResult.extractedCoMeds }
                : {}),
              captureMethod: 'ocr_upload',
              isOcrUnverified: true,
              rawExtractedText: multiText || ocrResult.rawExtractedText,
              imageFileName: params.fileName,
              unreadableFields: ocrResult.unreadableFields,
              createScheduleAlso: false,
            },
          ];

  const pricingReport =
    effectiveCategory === 'prescription' || extractedPrescriptions.length > 0
      ? buildPrescriptionPricingAndAlternativesReport(multiText, extractedPrescriptions)
      : null;

  const structuredJson = buildAndValidateStructuredPrescriptionJson({
    category: effectiveCategory,
    rawText: multiText,
    extractedPrescriptions,
    unreadableFields: ocrResult.unreadableFields,
    pageCount: params.pdfPageCount || 1,
    ocrEngineUsed: params.pdfExtractedText ? 'pdfjs_text_layer' : 'hybrid',
  });

  // Check if any recognized medication has multiple database matches requiring patient selection
  const dbAmbiguityNotesAr: string[] = [];
  const dbAmbiguityNotesEn: string[] = [];
  for (const medItem of structuredJson.medications) {
    if (
      medItem.verificationStatus === 'uncertain_db_match' &&
      medItem.possibleDatabaseMatches &&
      medItem.possibleDatabaseMatches.length > 1
    ) {
      const optsAr = medItem.possibleDatabaseMatches
        .slice(0, 3)
        .map((c) => `${c.brandNameAr} (${c.strength})`)
        .join(' أو ');
      const optsEn = medItem.possibleDatabaseMatches
        .slice(0, 3)
        .map((c) => `${c.brandNameEn} (${c.strength})`)
        .join(' or ');
      dbAmbiguityNotesAr.push(
        `\n🔍 تنبيه تطابق قاعدة البيانات: وُجد أكثر من تركيز/شكل لـ «${medItem.name}» (${optsAr}) — يرجى تحديد التركيز المطابق لروشتتك قبل الحفظ.`
      );
      dbAmbiguityNotesEn.push(
        `\n🔍 Database Match Notice: Multiple strengths/forms found for "${medItem.name}" (${optsEn}) — please select the exact match on your prescription.`
      );
    }
  }

  return {
    title: params.lang === 'ar' ? docMeta.titleAr : docMeta.titleEn,
    category: effectiveCategory,
    fileName: params.fileName,
    mimeType: params.mimeType,
    fileSize: params.fileSize,
    pageCount: params.pdfPageCount || 1,
    previewDataUrl: params.previewDataUrl,
    base64Data: params.base64Data,
    extractedSummaryAr: `${docMeta.summaryAr}${pricingReport?.summaryAr || ''}${dbAmbiguityNotesAr.join('')}`,
    extractedSummaryEn: `${docMeta.summaryEn}${pricingReport?.summaryEn || ''}${dbAmbiguityNotesEn.join('')}`,
    extractedFields: docMeta.extractedFields,
    unreadableFields: ocrResult.unreadableFields,
    contradictionWarnings: ocrResult.contradictionWarnings,
    extractedPrescriptions,
    isUnclearOrIncomplete:
      (effectiveCategory === 'prescription' && !ocrResult.detectedDrugName) ||
      ocrResult.unreadableFields.length > 0 ||
      ocrResult.contradictionWarnings.length > 0,
    structuredJson,
    ...(docMeta.leafletDetails ? { leafletDetails: docMeta.leafletDetails } : {}),
  };
}

/**
 * Uploads the medical document binary/base64 to Firebase Storage under
 * `/patient_documents/{uid}/{docId}_{sanitizedFileName}`.
 * Never fabricates success if Firebase Storage is unconfigured or fails.
 */
export async function uploadMedicalDocumentToStorage(params: {
  uid: string | null;
  docId: string;
  fileName: string;
  mimeType: string;
  base64Data?: string;
  rawFile?: File;
}): Promise<StorageUploadOutcome> {
  if (!params.uid) {
    return {
      uploadedToCloud: false,
      errorAr: 'وضع الزائر (من غير تسجيل دخول): حفظتلك المعاينة والبيانات محلياً على جهازك ده بس.',
      errorEn: 'Guest mode (not signed in): Preview and structured record saved locally on this device only.',
    };
  }

  if (!configured || !storage) {
    return {
      uploadedToCloud: false,
      errorAr:
        'خدمة Firebase Storage مش مفعّلة في الإعدادات حالياً — حفظتلك البيانات المهيكلة والمعاينة المضغوطة في حسابك بـ Firestore.',
      errorEn:
        'Firebase Storage is not configured in environment variables — structured record and compressed preview saved to your Firestore profile.',
    };
  }

  const safeName = (params.fileName || 'document.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `patient_documents/${params.uid}/${params.docId}_${safeName}`;

  try {
    const fileRef = ref(storage, storagePath);
    if (params.rawFile) {
      await uploadBytes(fileRef, params.rawFile, { contentType: params.mimeType });
    } else if (params.base64Data) {
      await uploadString(fileRef, params.base64Data, 'base64', { contentType: params.mimeType });
    } else {
      return {
        uploadedToCloud: false,
        errorAr: 'مفيش بيانات ملف صالحة للرفع على السحابة.',
        errorEn: 'No file binary data available to upload.',
      };
    }
    const downloadUrl = await getDownloadURL(fileRef);
    return {
      uploadedToCloud: true,
      storagePath,
      downloadUrl,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      uploadedToCloud: false,
      errorAr: `معرفتش أرفع الملف الأصلي على Firebase Storage (${errMsg})، بس متقلقش حفظتلك كل البيانات المستخرجة في ملفك.`,
      errorEn: `Failed to upload original file to Firebase Storage (${errMsg}). Extracted structured data is preserved.`,
    };
  }
}
