import { analyzeMedicineImageWithVision } from './geminiApi';
import { DawayaCompactIndexItem } from './dawayaDrugDatabaseService';
import { Lang } from './types';

export interface BlisterStripMatchCandidate {
  item: DawayaCompactIndexItem;
  score: number;
  matchedFragment: string;
}

const STOP_TOKENS = new Set([
  'tablet', 'tablets', 'tab', 'tabs', 'capsule', 'capsules', 'cap', 'caps',
  'syrup', 'suspension', 'ampoule', 'amp', 'vial', 'cream', 'ointment', 'gel',
  'drops', 'spray', 'oral', 'film', 'coated', 'f.c.t', 'fct', 's.r', 'mg', 'gm',
  'ml', 'mcg', 'iu', 'pharma', 'pharmaceutical', 'egypt', 'cairo', 'price',
  'batch', 'exp', 'mfg', 'lot', 'for', 'use', 'only', 'keep', 'store',
  'اقراص', 'قرص', 'كبسول', 'كبسولات', 'شراب', 'معلق', 'امبول', 'فيال',
  'كريم', 'مرهم', 'جل', 'نقط', 'بخاخ', 'مجم', 'جم', 'مل', 'شركة', 'ادوية',
]);

function normalizeStripToken(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Matches even partial/cut-off 3+ letter fragments printed on a cut blister strip
 * (e.g., "AUGM", "CONC 5", "CATAF", "PANAD", "GLUCOP", "كونكو", "أوجمن")
 * against all 26,562 Egyptian medicines.
 */
export function findCutBlisterStripCandidates(
  rawText: string,
  indexItems: DawayaCompactIndexItem[],
  maxResults = 6
): BlisterStripMatchCandidate[] {
  const clean = normalizeStripToken(rawText);
  if (!clean || clean.length < 3 || !indexItems || indexItems.length === 0) {
    return [];
  }

  const rawTokens = clean.split(' ').filter(Boolean);
  const wordFragments = rawTokens.filter(
    (w) => w.length >= 3 && !/^\d+$/.test(w) && !STOP_TOKENS.has(w)
  );
  const numberTokens = (clean.match(/\b\d+(?:\.\d+)?\b/g) || []).filter(
    (n) => n.length <= 4
  );

  if (wordFragments.length === 0) return [];

  const scored: BlisterStripMatchCandidate[] = [];

  for (let i = 0; i < indexItems.length; i++) {
    const it = indexItems[i];
    const enNorm = normalizeStripToken(it.n);
    const arNorm = normalizeStripToken(it.a);
    const genNorm = normalizeStripToken(it.g);
    const strNorm = normalizeStripToken(it.s);

    const enFirstWord = enNorm.split(' ')[0] || '';
    const arFirstWord = arNorm.split(' ')[0] || '';

    let score = 0;
    let bestFrag = '';

    for (const frag of wordFragments) {
      // 1. Exact first-word match on brand name
      if (enFirstWord === frag || arFirstWord === frag) {
        if (150 + frag.length * 4 > score) {
          score = 150 + frag.length * 4;
          bestFrag = frag;
        }
      }
      // 2. Prefix or suffix match on brand first word (cut blister strip edge!)
      else if (
        frag.length >= 4 &&
        ((enFirstWord.length >= 4 && (enFirstWord.startsWith(frag) || enFirstWord.endsWith(frag))) ||
          (arFirstWord.length >= 4 && (arFirstWord.startsWith(frag) || arFirstWord.endsWith(frag))))
      ) {
        const candScore = 115 + frag.length * 4;
        if (candScore > score) {
          score = candScore;
          bestFrag = frag;
        }
      }
      // 3. Substring match inside brand name or active ingredient
      else if (
        frag.length >= 4 &&
        (enNorm.includes(frag) || arNorm.includes(frag) || genNorm.includes(frag))
      ) {
        const candScore = (enNorm.includes(frag) || arNorm.includes(frag) ? 95 : 80) + frag.length * 3;
        if (candScore > score) {
          score = candScore;
          bestFrag = frag;
        }
      }
      // 4. 3-letter prefix match when accompanied by a strength number (e.g. "CON 5" -> Concor 5mg)
      else if (
        frag.length === 3 &&
        numberTokens.length > 0 &&
        (enFirstWord.startsWith(frag) || arFirstWord.startsWith(frag))
      ) {
        const candScore = 82;
        if (candScore > score) {
          score = candScore;
          bestFrag = frag;
        }
      }
    }

    if (score > 0) {
      // Bonus if strength number on blister strip matches (e.g., 500, 1000, 5, 10, 20)
      for (const num of numberTokens) {
        if (
          strNorm.split(' ').includes(num) ||
          enNorm.split(' ').includes(num) ||
          arNorm.split(' ').includes(num)
        ) {
          score += 25;
        }
      }
      // Prefer tablets/capsules for blister strip scans
      if (it.f === 'tablet' || it.f === 'capsule') {
        score += 6;
      }
      scored.push({ item: it, score, matchedFragment: bestFrag });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  // Deduplicate by brand first word + strength so the user sees distinct candidates
  const unique: BlisterStripMatchCandidate[] = [];
  const seenKeys = new Set<string>();
  for (const cand of scored) {
    const key = `${cand.item.n.toLowerCase().slice(0, 12)}_${cand.item.s}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      unique.push(cand);
      if (unique.length >= maxResults) break;
    }
  }

  return unique;
}

/**
 * Enhances a blister strip photo by boosting contrast to suppress metallic aluminum foil glare
 * and extracts text using Native TextDetector, AI Vision, or Local Tesseract OCR.
 */
export async function extractTextFromBlisterOrBoxImage(
  file: File,
  lang: Lang = 'ar'
): Promise<{
  extractedText: string;
  detectedBarcode: string | null;
  dataUrl: string;
}> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = new Image();
  img.src = dataUrl;
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
  });

  const maxDim = 950;
  let w = img.width || 640;
  let h = img.height || 640;
  if (w > maxDim || h > maxDim) {
    if (w > h) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { extractedText: '', detectedBarcode: null, dataUrl };
  }
  ctx.drawImage(img, 0, 0, w, h);

  // 1. Check Native BarcodeDetector first
  let detectedBarcode: string | null = null;
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const bcDet = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'code_128', 'qr_code', 'data_matrix', 'upc_a'],
      });
      const codes = await bcDet.detect(canvas);
      if (codes && codes.length > 0 && codes[0].rawValue) {
        detectedBarcode = String(codes[0].rawValue).trim();
      }
    } catch {
      /* ignore */
    }
  }

  const collectedTexts: string[] = [];

  // 2. Check Native Chromium/Android WebView TextDetector (instant on-device OCR)
  if (typeof window !== 'undefined' && 'TextDetector' in window) {
    try {
      const txtDet = new (window as any).TextDetector();
      const blocks = await txtDet.detect(canvas);
      if (Array.isArray(blocks) && blocks.length > 0) {
        const joined = blocks.map((b: { rawValue?: string }) => b.rawValue || '').join(' ');
        if (joined.trim()) collectedTexts.push(joined.trim());
      }
    } catch {
      /* ignore */
    }
  }

  // 3. Create a high-contrast foil-glare-suppressed canvas for blister strips
  const contrastCanvas = document.createElement('canvas');
  contrastCanvas.width = w;
  contrastCanvas.height = h;
  const cCtx = contrastCanvas.getContext('2d');
  if (cCtx) {
    cCtx.filter = 'contrast(175%) grayscale(100%) brightness(105%)';
    cCtx.drawImage(img, 0, 0, w, h);
  }
  const normalizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
  const contrastDataUrl = cCtx ? contrastCanvas.toDataURL('image/jpeg', 0.88) : normalizedDataUrl;

  // 4. Try AI Vision Proxy if online
  const base64Data = normalizedDataUrl.split(',')[1] || '';
  if (base64Data) {
    try {
      const aiRes = await analyzeMedicineImageWithVision(base64Data, 'image/jpeg', lang);
      if (aiRes.detectedDrugName) collectedTexts.push(aiRes.detectedDrugName);
      if (aiRes.rawExtractedText) collectedTexts.push(aiRes.rawExtractedText);
    } catch {
      /* offline or proxy unavailable */
    }
  }

  // 5. If still empty, run local Tesseract.js on the foil-contrast-enhanced image
  if (collectedTexts.join(' ').trim().length < 3) {
    try {
      const win = window as any;
      if (!win.Tesseract) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('OCR_LOAD_FAILED'));
          document.head.appendChild(script);
        });
      }
      if (win.Tesseract) {
        const res = await win.Tesseract.recognize(contrastDataUrl, 'eng+ara', {
          logger: () => {},
        });
        if (res?.data?.text) {
          collectedTexts.push(res.data.text);
        }
      }
    } catch {
      /* ignore */
    }
  }

  return {
    extractedText: collectedTexts.join(' ').trim(),
    detectedBarcode,
    dataUrl: normalizedDataUrl,
  };
}
