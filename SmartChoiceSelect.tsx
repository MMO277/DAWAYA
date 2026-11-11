import React, { useState, useEffect, useMemo } from 'react';
import { CleanUiIcon } from './DawayaVectorIcons';

export interface SmartChoiceOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
}

export interface SmartChoiceSelectProps {
  value: string;
  onChange: (newValue: string) => void;
  options: SmartChoiceOption[];
  placeholder?: string;
  modalTitle?: string;
  modalSubtitle?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  className?: string;
}

const HUMAN_ROLE_FALLBACKS: Record<
  string,
  { label: string; description: string; badge: string; icon: string }
> = {
  super_admin: {
    label: 'المدير التنفيذي الأعلى للشبكة (Super Admin)',
    description: 'تحكم شامل في الشبكة الوطنية، تراخيص الصيدليات، عقود الفرنشايز، والأمان',
    badge: 'SUPER ADMIN',
    icon: 'shield',
  },
  owner: {
    label: 'مالك المنصة (Platform Owner)',
    description: 'تحكم كامل في الشركاء والظهور والصلاحيات والربط البرمجي',
    badge: 'OWNER',
    icon: 'shield',
  },
  admin: {
    label: 'مدير النظام (System Admin)',
    description: 'إدارة الشركاء والعمليات الإدارية الكاملة واعتماد الصيدليات',
    badge: 'ADMIN',
    icon: 'shield',
  },
  regional_manager: {
    label: 'مدير إقليمي للمحافظات (Regional Manager)',
    description: 'مراجعة وتوثيق صيدليات المحافظات ومتابعة التغطية الجغرافية والمخزون الإقليمي',
    badge: 'REGIONAL MANAGER',
    icon: 'office_desk',
  },
  reviewer: {
    label: 'مراجع علمي وسريري (Clinical Reviewer)',
    description: 'اعتماد الأدوية والمونوجرافات السريرية ومراجعة التوثيق العلمي للشركاء',
    badge: 'REVIEWER',
    icon: 'check',
  },
  editor: {
    label: 'محرر محتوى وكتالوج (Content Editor)',
    description: 'إضافة وتعديل مسودات الشركاء والكتالوج والمقالات بدون تغيير إعدادات الأمان',
    badge: 'EDITOR',
    icon: 'edit',
  },
  pharmacy_owner: {
    label: 'مالك صيدلية معتمد (Pharmacy Owner)',
    description: 'إدارة كاملة لبوابة الصيدلية، المخزون، التشغيلات، الطلبات، الموظفين، والتقارير المالية',
    badge: 'PHARMACY OWNER',
    icon: 'home',
  },
  pharmacy_manager: {
    label: 'مدير فرع صيدلية (Pharmacy Manager)',
    description: 'إدارة مخزون الفرع، تواريخ الصلاحية، تأكيد الطلبات، وإدارة فريق الصيدلية',
    badge: 'PHARMACY MANAGER',
    icon: 'office_desk',
  },
  pharmacist: {
    label: 'صيدلي معتمد (Licensed Pharmacist)',
    description: 'مراجعة وتأكيد طلبات الأدوية وصرف البدائل وتحديث حالة توفر الأصناف والتشغيلات',
    badge: 'PHARMACIST',
    icon: 'check',
  },
  employee: {
    label: 'موظف صيدلية / تجهيز طلبات (Pharmacy Staff)',
    description: 'تجهيز الطلبات المعتمدة ومتابعة حالة التوصيل والعمليات اليومية داخل الصيدلية',
    badge: 'STAFF',
    icon: 'user',
  },
  viewer: {
    label: 'مشاهد تقارير فقط (Read-Only Viewer)',
    description: 'صلاحية قراءة ومطالعة فقط للوحة الإدارة والإحصائيات دون تعديل البيانات',
    badge: 'VIEWER',
    icon: 'user',
  },
  customer: {
    label: 'عميل / مريض (Customer & Patient)',
    description: 'طلب الأدوية من الصيدليات المعتمدة وإدارة الجواز الطبي والجدول اليومي',
    badge: 'CUSTOMER',
    icon: 'user',
  },
  user: {
    label: 'مستخدم عام (Standard User)',
    description: 'استخدام أدوات الفحص الدوائي والجواز الطبي ودليل الأدوية',
    badge: 'USER',
    icon: 'user',
  },
};

function resolveIconType(iconProp?: string, val?: string): string {
  const v = (val || iconProp || '').toLowerCase();
  if (v.includes('driver') || v.includes('delivery') || v.includes('out_for_delivery')) return 'driver_transport';
  if (v.includes('factory') || v.includes('machinery')) return 'machinery_factory';
  if (v.includes('office') || v.includes('manager') || v.includes('admin') || v.includes('regional')) return 'office_desk';
  if (v.includes('student') || v.includes('easy') || v.includes('medium') || v.includes('hard')) return 'student';
  if (v.includes('home') || v.includes('pharmacy_owner') || v.includes('branch')) return 'home';
  if (v.includes('male') || v.includes('female') || v.includes('user') || v.includes('customer') || v.includes('employee') || v.includes('viewer')) return 'user';
  if (v.includes('normal') || v.includes('approved') || v.includes('available') || v.includes('delivered') || v.includes('paid') || v.includes('check') || v.includes('reviewer') || v.includes('pharmacist')) return 'check';
  if (v.includes('impaired') || v.includes('rejected') || v.includes('cancelled') || v.includes('out_of_stock') || v.includes('overdue') || v.includes('suspended') || v.includes('alert') || v.includes('danger')) return 'alert';
  if (v.includes('clock') || v.includes('pending') || v.includes('preparing') || v.includes('low_stock') || v.includes('under_verification')) return 'clock';
  if (v.includes('edit') || v.includes('draft') || v.includes('editor')) return 'edit';
  return 'shield';
}

function renderSmartOptionIcon(iconProp?: string, val?: string, size = 20) {
  const resolved = resolveIconType(iconProp, val);
  const isDanger = resolved === 'alert';
  const isWarn = resolved === 'clock';
  const bg = isDanger
    ? 'rgba(239, 68, 68, 0.1)'
    : isWarn
      ? 'rgba(245, 158, 11, 0.12)'
      : 'rgba(16, 185, 129, 0.1)';
  const fg = isDanger ? '#dc2626' : isWarn ? '#d97706' : '#059669';

  return (
    <span
      style={{
        width: size + 16,
        height: size + 16,
        borderRadius: '12px',
        background: bg,
        color: fg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <CleanUiIcon name={resolved} size={size} color={fg} />
    </span>
  );
}

// Strip leading emojis from titles for clean enterprise typography
const cleanText = (txt?: string) =>
  (txt || '')
    .replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\s]+/gu, '')
    .trim();

export function parseSmartOptionText(
  rawLabel: string,
  val: string,
  groupBadge?: string
): SmartChoiceOption {
  const trimmedVal = String(val ?? '').trim();
  const cleanedRaw = cleanText(rawLabel);

  // If rawLabel is identical to a known role key (like "super_admin" or "pharmacy_owner")
  if (HUMAN_ROLE_FALLBACKS[trimmedVal] && (cleanedRaw === trimmedVal || !cleanedRaw)) {
    const fb = HUMAN_ROLE_FALLBACKS[trimmedVal];
    return {
      value: trimmedVal,
      label: fb.label,
      description: fb.description,
      badge: fb.badge,
      icon: fb.icon,
    };
  }

  // Also check if value is in HUMAN_ROLE_FALLBACKS and rawLabel starts with "CODE — "
  if (HUMAN_ROLE_FALLBACKS[trimmedVal]) {
    const fb = HUMAN_ROLE_FALLBACKS[trimmedVal];
    const dashParts = cleanedRaw.split(/\s+—\s+|\s+-\s+/);
    const bodyText = dashParts.length > 1 ? dashParts.slice(1).join(' — ') : cleanedRaw;
    const parenMatch = bodyText.match(/^(.+?)\s*\((.+)\)$/);
    if (parenMatch) {
      return {
        value: trimmedVal,
        label: parenMatch[1].trim(),
        description: parenMatch[2].trim(),
        badge: fb.badge,
        icon: fb.icon,
      };
    }
    return {
      value: trimmedVal,
      label: bodyText,
      description: fb.description,
      badge: fb.badge,
      icon: fb.icon,
    };
  }

  // Generic intelligent splitting for "PREFIX — Title (Description)" or "Title (Description)"
  let badge = groupBadge;
  let working = cleanedRaw;
  if (working.includes(' — ')) {
    const parts = working.split(' — ');
    if (parts[0].length <= 22 && /^[A-Z0-9_\s/-]+$/.test(parts[0].trim())) {
      badge = parts[0].trim();
      working = parts.slice(1).join(' — ').trim();
    }
  }

  const parenMatch = working.match(/^(.+?)\s*\(([^)]{10,})\)$/);
  if (parenMatch) {
    return {
      value: trimmedVal,
      label: parenMatch[1].trim(),
      description: parenMatch[2].trim(),
      badge,
    };
  }

  return {
    value: trimmedVal,
    label: working || trimmedVal,
    badge,
  };
}

export default function SmartChoiceSelect({
  value,
  onChange,
  options,
  placeholder = 'اختر من القائمة',
  modalTitle = 'اختر من القائمة',
  modalSubtitle,
  style,
  disabled = false,
  className = '',
}: SmartChoiceSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (opt.description || opt.badge) return opt;
      return {
        ...parseSmartOptionText(opt.label, opt.value),
        disabled: opt.disabled,
        icon: opt.icon,
      };
    });
  }, [options]);

  const selectedOption =
    normalizedOptions.find((opt) => String(opt.value) === String(value)) ||
    normalizedOptions[0];

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q)) ||
        (opt.badge && opt.badge.toLowerCase().includes(q)) ||
        String(opt.value).toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchQuery]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const resolvedTriggerIcon = resolveIconType(selectedOption?.icon, selectedOption?.value);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(true);
        }}
        className={`dawaya-smart-select-trigger ${className}`.trim()}
        style={{
          ...style,
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <div className="dawaya-smart-select-value">
          {selectedOption ? (
            <>
              <CleanUiIcon name={resolvedTriggerIcon} size={17} color="#059669" />
              <span className="dawaya-smart-select-text">{cleanText(selectedOption.label)}</span>
              {selectedOption.badge && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#047857',
                    marginInlineStart: '4px',
                    flexShrink: 0,
                  }}
                >
                  {selectedOption.badge}
                </span>
              )}
            </>
          ) : (
            <span className="dawaya-smart-select-placeholder">{cleanText(placeholder)}</span>
          )}
        </div>
        <span className="dawaya-smart-select-arrow" aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
          <div className="dawaya-smart-select-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="dawaya-smart-select-handle" />
            <div className="dawaya-smart-select-header">
              <div>
                <h3 className="dawaya-smart-select-title">{cleanText(modalTitle)}</h3>
                <p className="dawaya-smart-select-sub">
                  {cleanText(
                    modalSubtitle ||
                      `اختر من بين ${normalizedOptions.length} خيارات متاحة في القائمة`
                  )}
                </p>
              </div>
              <button
                type="button"
                className="dawaya-smart-select-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {normalizedOptions.length > 6 && (
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث سريعاً في الاختيارات..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            <div className="dawaya-smart-select-grid">
              {filteredOptions.length === 0 ? (
                <div
                  style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '0.9rem',
                  }}
                >
                  لا توجد نتائج مطابقة لبحثك
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <button
                      key={`${opt.value}-${opt.label}`}
                      type="button"
                      disabled={opt.disabled}
                      className={`dawaya-choice-card ${isSelected ? 'selected' : ''}`}
                      style={{
                        opacity: opt.disabled ? 0.5 : 1,
                        cursor: opt.disabled ? 'not-allowed' : 'pointer',
                      }}
                      onClick={() => {
                        if (opt.disabled) return;
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
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {renderSmartOptionIcon(opt.icon, opt.value, 20)}
                          <div style={{ textAlign: 'start', flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flexWrap: 'wrap',
                              }}
                            >
                              <b className="choice-title">{cleanText(opt.label)}</b>
                              {opt.badge && (
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                    background: isSelected
                                      ? 'rgba(16, 185, 129, 0.2)'
                                      : 'rgba(15, 23, 42, 0.07)',
                                    color: isSelected ? '#047857' : '#334155',
                                  }}
                                >
                                  {cleanText(opt.badge)}
                                </span>
                              )}
                            </div>
                            {opt.description && (
                              <span
                                className="choice-desc"
                                style={{
                                  display: 'block',
                                  marginTop: '3px',
                                  fontSize: '0.8rem',
                                  color: '#64748b',
                                  lineHeight: 1.4,
                                }}
                              >
                                {cleanText(opt.description)}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected ? (
                          <span className="dawaya-choice-check" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        ) : (
                          <span className="dawaya-choice-uncheck" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function flattenChildrenText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flattenChildrenText).join('');
  if (React.isValidElement(node)) {
    const el = node as React.ReactElement<{ children?: React.ReactNode }>;
    return flattenChildrenText(el.props?.children);
  }
  return '';
}

function extractOptionsFromReactChildren(
  children: React.ReactNode,
  groupLabel?: string
): SmartChoiceOption[] {
  const list: SmartChoiceOption[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const el = child as React.ReactElement<{
      children?: React.ReactNode;
      value?: string | number;
      label?: string;
      disabled?: boolean;
    }>;
    if (el.type === React.Fragment) {
      list.push(...extractOptionsFromReactChildren(el.props.children, groupLabel));
      return;
    }
    if (el.type === 'optgroup') {
      const gLabel = el.props.label ? String(el.props.label) : groupLabel;
      list.push(...extractOptionsFromReactChildren(el.props.children, gLabel));
      return;
    }
    if (el.type === 'option') {
      const rawText = flattenChildrenText(el.props.children).trim();
      const rawVal =
        el.props.value !== undefined ? String(el.props.value) : rawText;
      const parsed = parseSmartOptionText(rawText, rawVal, groupLabel);
      list.push({
        ...parsed,
        disabled: Boolean(el.props.disabled),
      });
    }
  });
  return list;
}

export interface SmartNativeSelectProps {
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: { target: { value: string }; currentTarget: { value: string } } & any) => void;
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  'aria-label'?: string;
  title?: string;
  name?: string;
  required?: boolean;
}

/**
 * Universal Drop-in Replacement for native <select> tags across DAWAYA.
 * Converts any <select><option>...</option></select> into an interactive
 * DAWAYA SmartChoiceSelect card modal sheet with zero native Android radio popups.
 */
export function SmartNativeSelect({
  value,
  defaultValue,
  onChange,
  children,
  disabled,
  className,
  style,
  'aria-label': ariaLabel,
  title,
}: SmartNativeSelectProps) {
  const options = useMemo(() => extractOptionsFromReactChildren(children), [children]);
  const [internalVal, setInternalVal] = useState<string>(
    value !== undefined
      ? String(value)
      : defaultValue !== undefined
        ? String(defaultValue)
        : options[0]?.value || ''
  );

  const currentVal = value !== undefined ? String(value) : internalVal;

  return (
    <SmartChoiceSelect
      value={currentVal}
      disabled={disabled}
      className={className}
      style={style}
      options={options}
      modalTitle={ariaLabel || title || 'اختر من القائمة'}
      onChange={(newVal) => {
        setInternalVal(newVal);
        if (onChange) {
          const syntheticEvent = {
            target: { value: newVal },
            currentTarget: { value: newVal },
            preventDefault: () => {},
            stopPropagation: () => {},
          };
          onChange(syntheticEvent as any);
        }
      }}
    />
  );
}
