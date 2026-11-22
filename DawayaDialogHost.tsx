import React, { useEffect, useState } from 'react';

export interface DawayaDialogOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  tone?: 'info' | 'success' | 'danger';
}

interface ActiveDialogState {
  kind: 'confirm' | 'alert';
  message: string;
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
  resolve: (value: boolean) => void;
}

type DialogListener = (dialog: ActiveDialogState | null) => void;
const listeners = new Set<DialogListener>();
const queue: ActiveDialogState[] = [];
let currentDialog: ActiveDialogState | null = null;

function notify() {
  listeners.forEach((fn) => fn(currentDialog));
}

function showNext() {
  if (currentDialog || queue.length === 0) return;
  currentDialog = queue.shift() || null;
  notify();
}

function closeCurrent(result: boolean) {
  if (!currentDialog) return;
  const done = currentDialog.resolve;
  currentDialog = null;
  notify();
  done(result);
  setTimeout(showNext, 40);
}

function detectArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

export function dawayaConfirm(message: string, opts?: DawayaDialogOptions): Promise<boolean> {
  const isAr = detectArabic(message);
  const looksDestructive =
    opts?.danger ??
    /حذف|مسح|إزالة|إيقاف|تحذير|delete|remove|reset|clear|warning/i.test(message);

  return new Promise<boolean>((resolve) => {
    queue.push({
      kind: 'confirm',
      message,
      title: opts?.title || (isAr ? (looksDestructive ? 'تأكيد الإجراء' : 'تأكيد من دوايا') : 'Confirm Action'),
      confirmLabel: opts?.confirmLabel || (isAr ? (looksDestructive ? 'نعم، تأكيد' : 'موافق') : 'Confirm'),
      cancelLabel: opts?.cancelLabel || (isAr ? 'إلغاء' : 'Cancel'),
      danger: looksDestructive,
      resolve,
    });
    showNext();
  });
}

export function dawayaAlert(message: string, opts?: DawayaDialogOptions): Promise<void> {
  const isAr = detectArabic(message);
  const isDanger = opts?.tone === 'danger' || /فشل|تعذر|خطأ|لا يمكنك|تحذير|failed|error|cannot/i.test(message);

  return new Promise<void>((resolve) => {
    queue.push({
      kind: 'alert',
      message,
      title: opts?.title || (isAr ? (isDanger ? 'تنبيه من دوايا' : 'إشعار دوايا') : 'DAWAYA Notice'),
      confirmLabel: opts?.confirmLabel || (isAr ? 'حسناً' : 'OK'),
      cancelLabel: '',
      danger: isDanger,
      resolve: () => resolve(),
    });
    showNext();
  });
}

export default function DawayaDialogHost() {
  const [dialog, setDialog] = useState<ActiveDialogState | null>(currentDialog);

  useEffect(() => {
    const listener: DialogListener = (next) => setDialog(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!dialog) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCurrent(false);
      } else if (e.key === 'Enter' && dialog.kind === 'alert') {
        closeCurrent(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dialog]);

  if (!dialog) return null;
  const isAr = detectArabic(dialog.message);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dawaya-dialog-title"
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeCurrent(false);
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        background: 'rgba(7, 18, 34, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 24px 60px rgba(7, 18, 34, 0.38)',
          overflow: 'hidden',
        }}
      >
        {/* Top DAWAYA Unslop Header Bar */}
        <div
          style={{
            background: '#0D1F38',
            padding: '14px 18px',
            borderBottom: `3px solid ${dialog.danger ? '#E11D48' : '#138866'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: dialog.danger ? 'rgba(225, 29, 72, 0.2)' : 'rgba(19, 136, 102, 0.24)',
              border: `1px solid ${dialog.danger ? 'rgba(251, 113, 133, 0.5)' : 'rgba(36, 200, 184, 0.5)'}`,
              color: dialog.danger ? '#FDA4AF' : '#CFD29D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {dialog.danger ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#CFD29D' }}>
              {isAr ? 'دوايا | DAWAYA' : 'DAWAYA'}
            </div>
            <h3 id="dawaya-dialog-title" style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#FFFFFF' }}>
              {dialog.title}
            </h3>
          </div>
        </div>

        {/* Message Body */}
        <div
          style={{
            padding: '18px 20px',
            fontSize: '0.88rem',
            lineHeight: 1.7,
            color: '#1E293B',
            fontWeight: 600,
            whiteSpace: 'pre-line',
          }}
        >
          {dialog.message}
        </div>

        {/* Unified Action Buttons */}
        <div
          style={{
            padding: '12px 18px 16px',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          {dialog.kind === 'confirm' && (
            <button
              type="button"
              onClick={() => closeCurrent(false)}
              style={{
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                borderRadius: '11px',
                padding: '9px 18px',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {dialog.cancelLabel}
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={() => closeCurrent(true)}
            style={{
              border: 'none',
              background: dialog.danger ? '#BE123C' : '#138866',
              color: '#FFFFFF',
              borderRadius: '11px',
              padding: '9px 22px',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: dialog.danger
                ? '0 4px 12px rgba(190, 18, 60, 0.3)'
                : '0 4px 12px rgba(19, 136, 102, 0.3)',
            }}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
