import React, { useState, useEffect } from 'react';
import { CleanUiIcon } from './DawayaVectorIcons';

export interface SmartChoiceOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
  badge?: string;
}

export interface SmartChoiceSelectProps {
  value: string;
  onChange: (newValue: string) => void;
  options: SmartChoiceOption[];
  placeholder?: string;
  modalTitle?: string;
  modalSubtitle?: string;
  style?: React.CSSProperties;
}

function renderSmartOptionIcon(iconProp?: string, val?: string, size = 20) {
  // Check if value or icon maps to clean vector icon
  const v = (val || '').toLowerCase();
  if (
    [
      'driver_transport',
      'machinery_factory',
      'office_desk',
      'student',
      'homemaker',
      'general',
      'other',
      'male',
      'female',
      'normal',
      'impaired',
    ].includes(v)
  ) {
    return (
      <span
        style={{
          width: size + 14,
          height: size + 14,
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.1)',
          color: '#059669',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <CleanUiIcon name={v} size={size} />
      </span>
    );
  }
  if (!iconProp) return null;
  // Strip noisy emojis or render clean subtle badge
  return (
    <span
      style={{
        width: size + 12,
        height: size + 12,
        borderRadius: '10px',
        background: 'rgba(15, 23, 42, 0.05)',
        color: '#0f172a',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1rem',
        flexShrink: 0,
      }}
    >
      <CleanUiIcon name="shield" size={size - 2} color="#059669" />
    </span>
  );
}

export default function SmartChoiceSelect({
  value,
  onChange,
  options,
  placeholder = 'اختر من القائمة',
  modalTitle = 'اختر من القائمة',
  modalSubtitle,
  style,
}: SmartChoiceSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Strip leading emojis from titles for clean enterprise typography
  const cleanText = (txt?: string) =>
    (txt || '').replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\s]+/gu, '').trim();

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="dawaya-smart-select-trigger"
        style={style}
      >
        <div className="dawaya-smart-select-value">
          {selectedOption ? (
            <>
              <CleanUiIcon name={selectedOption.value} size={17} color="#059669" />
              <span className="dawaya-smart-select-text">{cleanText(selectedOption.label)}</span>
            </>
          ) : (
            <span className="dawaya-smart-select-placeholder">{cleanText(placeholder)}</span>
          )}
        </div>
        <span className="dawaya-smart-select-arrow" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div
          className="dawaya-smart-select-backdrop"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="dawaya-smart-select-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dawaya-smart-select-handle" />
            <div className="dawaya-smart-select-header">
              <div>
                <h3 className="dawaya-smart-select-title">{cleanText(modalTitle)}</h3>
                {modalSubtitle && (
                  <p className="dawaya-smart-select-sub">{cleanText(modalSubtitle)}</p>
                )}
              </div>
              <button
                type="button"
                className="dawaya-smart-select-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="dawaya-smart-select-grid">
              {options.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`dawaya-choice-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        {renderSmartOptionIcon(opt.icon, opt.value, 20)}
                        <div style={{ textAlign: 'start', flex: 1 }}>
                          <b className="choice-title">{cleanText(opt.label)}</b>
                          {opt.description && (
                            <span className="choice-desc">{cleanText(opt.description)}</span>
                          )}
                        </div>
                      </div>
                      {isSelected ? (
                        <span className="dawaya-choice-check">✓</span>
                      ) : (
                        <span className="dawaya-choice-uncheck" />
                      )}
                    </div>
                    {opt.badge && <span className="choice-badge">{cleanText(opt.badge)}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
