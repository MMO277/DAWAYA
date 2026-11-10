import React, { useState, useEffect } from 'react';

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

export default function SmartChoiceSelect({
  value,
  onChange,
  options,
  placeholder = '— اختر —',
  modalTitle = 'اختر من القائمة',
  modalSubtitle,
  style,
}: SmartChoiceSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Close on Escape key
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
      {/* Sleek Single-Line Trigger Button (Matches normal input field) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="dawaya-smart-select-trigger"
        style={style}
      >
        <div className="dawaya-smart-select-value">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <span className="dawaya-smart-select-icon">{selectedOption.icon}</span>
              )}
              <span className="dawaya-smart-select-text">{selectedOption.label}</span>
            </>
          ) : (
            <span className="dawaya-smart-select-placeholder">{placeholder}</span>
          )}
        </div>
        <span className="dawaya-smart-select-arrow" aria-hidden="true">
          ▾
        </span>
      </button>

      {/* Popup Choice Cards Modal when Trigger is Clicked */}
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
            {/* Drag Handle & Header */}
            <div className="dawaya-smart-select-handle" />
            <div className="dawaya-smart-select-header">
              <div>
                <h3 className="dawaya-smart-select-title">{modalTitle}</h3>
                {modalSubtitle && (
                  <p className="dawaya-smart-select-sub">{modalSubtitle}</p>
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

            {/* Choice Cards Grid inside Popup */}
            <div
              className={`dawaya-smart-select-grid ${
                options.length <= 3 ? 'cols-single-or-pair' : 'cols-grid'
              }`}
            >
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
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        {opt.icon && (
                          <span style={{ fontSize: '1.65rem', flexShrink: 0 }}>{opt.icon}</span>
                        )}
                        <div style={{ textAlign: 'start', flex: 1 }}>
                          <b className="choice-title">{opt.label}</b>
                          {opt.description && (
                            <span className="choice-desc">{opt.description}</span>
                          )}
                        </div>
                      </div>
                      {isSelected ? (
                        <span className="dawaya-choice-check">✓</span>
                      ) : (
                        <span className="dawaya-choice-uncheck" />
                      )}
                    </div>
                    {opt.badge && <span className="choice-badge">{opt.badge}</span>}
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
