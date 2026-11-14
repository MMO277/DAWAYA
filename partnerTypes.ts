import { Bi } from './types';

// ============================================================================
// ADMINISTRATIVE ROLES & PERMISSIONS
// ============================================================================
export type PartnerAdminRole =
  | 'owner'
  | 'super_admin'
  | 'admin'
  | 'regional_manager'
  | 'editor'
  | 'reviewer'
  | 'pharmacy_owner'
  | 'pharmacy_manager'
  | 'pharmacist'
  | 'employee'
  | 'viewer'
  | 'customer';

export interface RolePermissionMatrix {
  canViewDashboard: boolean;
  canCreateDraft: boolean;
  canEditContent: boolean;
  canPublishOrHide: boolean;
  canVerifyPartner: boolean;
  canManageCategories: boolean;
  canManageIntegrations: boolean;
  canManageRoles: boolean;
  canDeleteOrArchive: boolean;
  canViewAuditLogs: boolean;
}

export function getRolePermissions(role: string | null | undefined): RolePermissionMatrix {
  const r = (role || '').toLowerCase();
  if (r === 'owner' || r === 'super_admin' || r === 'admin') {
    return {
      canViewDashboard: true,
      canCreateDraft: true,
      canEditContent: true,
      canPublishOrHide: true,
      canVerifyPartner: true,
      canManageCategories: true,
      canManageIntegrations: true,
      canManageRoles: true,
      canDeleteOrArchive: true,
      canViewAuditLogs: true,
    };
  }
  if (r === 'reviewer' || r === 'regional_manager') {
    return {
      canViewDashboard: true,
      canCreateDraft: true,
      canEditContent: true,
      canPublishOrHide: true,
      canVerifyPartner: true,
      canManageCategories: false,
      canManageIntegrations: false,
      canManageRoles: false,
      canDeleteOrArchive: false,
      canViewAuditLogs: true,
    };
  }
  if (r === 'editor' || r === 'pharmacy_owner' || r === 'pharmacy_manager') {
    return {
      canViewDashboard: true,
      canCreateDraft: true,
      canEditContent: true,
      canPublishOrHide: false,
      canVerifyPartner: false,
      canManageCategories: false,
      canManageIntegrations: false,
      canManageRoles: false,
      canDeleteOrArchive: false,
      canViewAuditLogs: false,
    };
  }
  if (r === 'viewer') {
    return {
      canViewDashboard: true,
      canCreateDraft: false,
      canEditContent: false,
      canPublishOrHide: false,
      canVerifyPartner: false,
      canManageCategories: false,
      canManageIntegrations: false,
      canManageRoles: false,
      canDeleteOrArchive: false,
      canViewAuditLogs: false,
    };
  }
  return {
    canViewDashboard: false,
    canCreateDraft: false,
    canEditContent: false,
    canPublishOrHide: false,
    canVerifyPartner: false,
    canManageCategories: false,
    canManageIntegrations: false,
    canManageRoles: false,
    canDeleteOrArchive: false,
    canViewAuditLogs: false,
  };
}

// ============================================================================
// STATUS SEPARATION (STRICTLY INDEPENDENT)
// ============================================================================
export type PartnershipStatus = 'draft' | 'pending' | 'active' | 'inactive' | 'suspended' | 'expired' | 'archived';
export type VerificationStatus = 'unverified' | 'pending_verification' | 'verified' | 'revoked';
export type PublicationStatus = 'draft' | 'scheduled' | 'published' | 'hidden' | 'archived';
export type VisibilityStatus = 'hidden' | 'visible' | 'temporarily_suspended' | 'scheduled_campaign';
export type ApiIntegrationStatus = 'none' | 'manual_only' | 'external_link_only' | 'configured_pending' | 'active_healthy' | 'degraded' | 'disabled';

export type IntegrationMethodType =
  | 'external_website_link'
  | 'external_ordering_link'
  | 'manual_partner_info'
  | 'manual_availability'
  | 'authorized_api'
  | 'authorized_webhook'
  | 'custom_adapter';

export type PlacementLocationId =
  | 'homepage_featured'
  | 'partner_directory'
  | 'pharmacy_directory'
  | 'medication_search_results'
  | 'medication_detail_page'
  | 'medication_purchase_suggestions'
  | 'nearby_pharmacy_results'
  | 'dedicated_partner_page'
  | 'healthcare_service_pages';

export type GeographicScopeType =
  | 'all_egypt'
  | 'specific_governorates'
  | 'specific_cities'
  | 'specific_districts'
  | 'selected_branches_only';

// ============================================================================
// DYNAMIC PARTNER CATEGORIES
// ============================================================================
export interface PartnerCategoryRecord {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  color: string;
  displayOrder: number;
  active: boolean;
  isPharmacyType: boolean;
  supportsBranches: boolean;
  supportsMedicationMapping: boolean;
  supportsOrdering: boolean;
  createdAtIso: string;
  updatedAtIso: string;
  updatedBy: string;
}

// ============================================================================
// VISIBILITY & PLACEMENT MANAGEMENT (OWNER-CONTROLLED)
// ============================================================================
export interface PartnerVisibilitySettings {
  partnerId: string;
  // A. Main Visibility Toggles
  showOnWebsite: boolean;
  publishPartnerProfile: boolean;
  showInPartnerDirectory: boolean;
  showOnHomepage: boolean;
  showInMedicationSearch: boolean;
  showInMedicationDetails: boolean;
  showInNearbyPharmacies: boolean;
  showInRelevantServiceSections: boolean;

  // B. Placement Controls
  allowedPlacements: PlacementLocationId[];

  // C. Geographic Visibility
  geographicScope: GeographicScopeType;
  allowedGovernorates: string[]; // governorate IDs
  allowedCities: string[]; // city names or IDs
  allowedDistricts: string[]; // district names
  selectedBranchIdsOnly: string[];

  // D. Display Priority (Never overrides clinical safety)
  displayOrder: number;
  priorityLevel: 'normal' | 'high' | 'featured' | 'top_partner';
  featuredPlacement: boolean;
  recommendedStatus: boolean;
  homepagePriority: number;
  searchResultPriority: number;
  isSponsoredPlacement: boolean; // Clear distinction between paid/sponsored and ordinary listings

  // E. Temporary & Scheduled Visibility
  scheduledPublishAtIso: string | null;
  scheduledDeactivateAtIso: string | null;
  temporarilySuspended: boolean;
  suspensionReason: string;
  campaignStartDateIso: string | null;
  campaignEndDateIso: string | null;
  campaignBannerAr: string;
  campaignBannerEn: string;

  updatedAtIso: string;
  updatedBy: string;
}

// ============================================================================
// DISPLAY CUSTOMIZATION SETTINGS
// ============================================================================
export type PartnerCardTheme = 'standard_medical' | 'featured_teal' | 'compact_directory' | 'highlight_navy';

export interface PartnerDisplayCustomization {
  cardDesign: PartnerCardTheme;
  showLogo: boolean;
  showCoverImage: boolean;
  showDescription: boolean;
  showContactInfo: boolean;
  showPhoneButton: boolean;
  showWhatsappButton: boolean;
  showBranchInfo: boolean;
  showWorkingHours: boolean;
  showDeliveryIndicator: boolean;
  showExternalOrderingButton: boolean;
  showWebsiteButton: boolean;
  showSpecialOffers: boolean;
  showFeaturedBadge: boolean;
  showVerificationBadge: boolean; // Enforced in code: only renders if verificationStatus === 'verified'
  customCtaTextAr: string;
  customCtaTextEn: string;
  customTaglineAr: string;
  customTaglineEn: string;
  specialOfferTitleAr: string;
  specialOfferTitleEn: string;
  specialOfferCode: string;
}

// ============================================================================
// CORE PUBLIC PARTNER PROFILE & PRIVATE ADMIN RECORD
// ============================================================================
export interface PartnerSocialLinks {
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  linkedin?: string;
  tiktok?: string;
  hotline?: string;
}

export interface PartnerPublicRecord {
  id: string;
  // A. Basic Information
  name: string; // Primary display fallback
  nameAr: string;
  nameEn: string;
  logoUrl: string;
  coverImageUrl: string;
  descriptionAr: string;
  descriptionEn: string;
  categoryId: string;
  partnerType: string; // e.g., 'chain_pharmacy', 'independent_pharmacy', 'online_platform', 'laboratory', etc.
  phone: string;
  hotline: string;
  publicEmail: string;
  websiteUrl: string;
  externalOrderingUrl: string;
  socialLinks: PartnerSocialLinks;

  // B. Business & Service Information
  servicesOfferedAr: string[];
  servicesOfferedEn: string[];
  supportedGovernorates: string[];
  supportedCities: string[];
  supportedDistricts: string[];
  deliveryAvailable: boolean;
  deliveryCoverageAr: string;
  deliveryCoverageEn: string;
  workingHoursAr: string;
  workingHoursEn: string;
  is24Hours: boolean;
  supportsOnlineOrdering: boolean;
  requiresPrescriptionForAntibiotics: boolean;

  // C. Public Status Flags (Strictly separated)
  partnershipStatus: PartnershipStatus;
  verificationStatus: VerificationStatus;
  publicationStatus: PublicationStatus;
  visibilityStatus: VisibilityStatus;
  apiIntegrationStatus: ApiIntegrationStatus;
  integrationMethod: IntegrationMethodType;

  // Synchronization Metadata (Publicly transparent, never faked)
  availabilitySyncEnabled: boolean;
  priceSyncEnabled: boolean;
  orderSyncEnabled: boolean;
  lastSuccessfulSyncIso: string | null;
  syncSourceLabelAr: string;
  syncSourceLabelEn: string;

  // Embedded Visibility & Display for fast public evaluation
  visibility: PartnerVisibilitySettings;
  display: PartnerDisplayCustomization;

  createdAtIso: string;
  updatedAtIso: string;
}

/**
 * Private administrative data stored in `partnerPrivateAdmin/{partnerId}`
 * NEVER exposed to unauthenticated/ordinary public users.
 */
export interface PartnerPrivateAdminRecord {
  partnerId: string;
  contactPersonName: string;
  contactPersonRole: string;
  administrativePhone: string;
  administrativeEmail: string;
  partnershipStartDateIso: string;
  partnershipExpirationDateIso: string | null;
  contractReference: string;
  internalNotes: string;
  integrationNotes: string;
  providerAdapterId: string;
  webhookEndpointUrl: string;
  // Note: Secret API keys are never stored in public Firestore; only server-side reference IDs
  serverCredentialVaultRef: string;
  createdBy: string;
  updatedBy: string;
  updatedAtIso: string;
}

// Combined object used inside Admin Dashboard
export interface PartnerFullAdminRecord extends PartnerPublicRecord {
  privateAdmin: PartnerPrivateAdminRecord;
}

// ============================================================================
// PHARMACY & PARTNER BRANCHES (`partnerBranches`)
// ============================================================================
export type BranchStatus = 'active' | 'inactive' | 'temporarily_closed' | 'draft';

export interface PartnerBranchRecord {
  id: string;
  partnerId: string;
  nameAr: string;
  nameEn: string;
  addressAr: string;
  addressEn: string;
  governorateId: string;
  city: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  whatsapp: string;
  workingHoursAr: string;
  workingHoursEn: string;
  is24Hours: boolean;
  deliveryAvailable: boolean;
  deliveryCoverageAr: string;
  deliveryCoverageEn: string;
  serviceGovernorates: string[];
  serviceCities: string[];
  serviceDistricts: string[];
  branchStatus: BranchStatus;
  published: boolean; // Selective branch publication
  branchOrderingUrl: string;
  googleMapsUrl: string;
  createdAtIso: string;
  updatedAtIso: string;
  updatedBy: string;
}

// ============================================================================
// MEDICATION-TO-PHARMACY MAPPING (`partnerMedicationMappings`)
// ============================================================================
export type StockVerificationState =
  | 'in_stock_verified'
  | 'low_stock_verified'
  | 'out_of_stock_verified'
  | 'requires_confirmation';

export interface PartnerMedicationMappingRecord {
  id: string;
  partnerId: string;
  // Strict clinical matching fields (never match by vague brand similarity alone)
  productId: string; // e.g. 'EG-ABX-001'
  activeIngredientId: string; // e.g. 'amoxicillin-clavulanic-acid'
  tradeNameAr: string;
  tradeNameEn: string;
  strength: string;
  dosageForm: string;
  // Availability & Pricing (Never invented)
  stockStatus: StockVerificationState;
  verifiedPriceEgp: number | null;
  priceSourceAr: string;
  priceSourceEn: string;
  lastVerifiedAtIso: string | null;
  directProductOrderingUrl: string;
  requiresPrescription: boolean;
  pharmacistReviewNoteAr: string;
  pharmacistReviewNoteEn: string;
  published: boolean;
  availableBranchIds: string[]; // Empty = all active branches of partner
  updatedAtIso: string;
  updatedBy: string;
}

// ============================================================================
// ORDERING & ORDER TRACKING (`partnerOrders`)
// ============================================================================
export type PartnerOrderStatus =
  | 'pending'
  | 'under_pharmacy_review'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface PartnerOrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  partnerId: string;
  partnerNameAr: string;
  partnerNameEn: string;
  branchId: string | null;
  branchNameAr: string;
  branchNameEn: string;
  // Medication Details
  productId: string;
  activeIngredientId: string;
  medicationNameAr: string;
  medicationNameEn: string;
  strength: string;
  dosageForm: string;
  quantityPacks: number | null; // null in public projection so quantities are never fabricated
  // Patient / Delivery Details
  patientName: string;
  patientPhone: string;
  governorateId: string;
  city: string;
  deliveryAddress: string;
  patientNotes: string;
  // Prescription Compliance
  requiresPrescription: boolean;
  prescriptionReferenceNumber: string;
  prescriptionUploadedFileUrl: string;
  prescriberName: string;
  pharmacistVerificationNote: string;
  // Status & Tracking
  status: PartnerOrderStatus;
  statusHistory: Array<{
    status: PartnerOrderStatus;
    timestampIso: string;
    noteAr: string;
    noteEn: string;
    updatedBy: string;
  }>;
  externalRedirectUsed: boolean;
  externalCheckoutUrl: string;
  createdAtIso: string;
  updatedAtIso: string;
}

// ============================================================================
// AUDIT LOG & CHANGE HISTORY (`adminAuditLogs`)
// ============================================================================
export type AuditActionType =
  | 'partner_added'
  | 'partner_edited'
  | 'partner_published'
  | 'partner_hidden'
  | 'partner_suspended'
  | 'partner_activated'
  | 'partner_deactivated'
  | 'partner_archived'
  | 'partner_verified'
  | 'visibility_settings_changed'
  | 'display_settings_changed'
  | 'branch_added'
  | 'branch_edited'
  | 'branch_deleted'
  | 'category_added'
  | 'category_edited'
  | 'medication_mapping_saved'
  | 'medication_mapping_deleted'
  | 'integration_updated'
  | 'order_status_updated';

export interface AdminAuditLogRecord {
  id: string;
  action: AuditActionType;
  partnerId: string;
  partnerName: string;
  adminUid: string;
  adminRole: string;
  timestampIso: string;
  summaryAr: string;
  summaryEn: string;
  changeDetails: Record<string, unknown>;
}

// ============================================================================
// EGYPTIAN GOVERNORATES & CITIES REFERENCE DATA
// ============================================================================
export interface EgyptianGovernorateInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  majorCities: Array<{ id: string; ar: string; en: string; districts: string[] }>;
}

export const EGYPTIAN_GOVERNORATES: EgyptianGovernorateInfo[] = [
  {
    "id": "dakahlia",
    "nameAr": "الدقهلية",
    "nameEn": "Dakahlia",
    "majorCities": [
      {
        "id": "aga",
        "ar": "مركز ومدينة أجا",
        "en": "Aga Markaz",
        "districts": [
          "مدينة أجا",
          "نوسا البحر",
          "نوسا الغيط",
          "شبراويش",
          "طنبول الكبرى",
          "طنبول الصغرى",
          "صهرجت الصغرى",
          "ميت عامل",
          "برج النور الحمص",
          "تلبنت أجا",
          "فيشا بنا",
          "سنجيد",
          "بقطارس",
          "منية سمنود",
          "شيوة",
          "ميت أبو الحسين",
          "ميت دمسيس",
          "المندرة",
          "كفر عوض السنيطة",
          "ميت فضالة",
          "ميت معاند",
          "ميت مسعود",
          "ديرب بقطارس",
          "سمنود الدقهلية",
          "قرموط البهو",
          "البهو فريك",
          "سبك الأحد",
          "جراح",
          "كفر الشراقوة",
          "اخبارية",
          "السلامية"
        ]
      },
      {
        "id": "mansoura",
        "ar": "مدينة ومركز المنصورة",
        "en": "Mansoura City & Markaz",
        "districts": [
          "حي غرب المنصورة",
          "حي شرق المنصورة",
          "حي الجامعة",
          "توريل الجديدة والقديمة",
          "المشاية السفلية والعلوية",
          "شارع قناة السويس",
          "جديلة",
          "سندوب",
          "قولونجيل",
          "كفر البدماص",
          "أويش الحجر",
          "ميت خميس",
          "شها",
          "برق العز",
          "ميت علي",
          "بدواي",
          "البرامون",
          "سلامون القماش",
          "منية سندوب",
          "نقيطة",
          "كوم الدربي",
          "ميت الصارم",
          "ميت مزاح",
          "تلبانة",
          "ميت بدر خميس",
          "الخيارية",
          "الريدانية",
          "ميت جراح",
          "طماخا",
          "منية بدواي"
        ]
      },
      {
        "id": "talkha",
        "ar": "مركز ومدينة طلخا",
        "en": "Talkha Markaz",
        "districts": [
          "مدينة طلخا",
          "تقسيم غنام",
          "بطرة",
          "بساط كريم الدين",
          "ميت عنتر",
          "كتامة الغابة",
          "كفر دميرة الجديد",
          "كفر دميرة القديم",
          "المنيل",
          "ديسط",
          "ميت الكرماء",
          "جوجر",
          "كفر الطويلة",
          "شرنقاش",
          "ميت نابت",
          "دميرة",
          "كفر العرب",
          "كفر الخوازم",
          "الأورمان"
        ]
      },
      {
        "id": "mit_ghamr",
        "ar": "مركز ومدينة ميت غمر",
        "en": "Mit Ghamr Markaz",
        "districts": [
          "مدينة ميت غمر",
          "دقادوس",
          "كوم النور",
          "سنتماي",
          "بشلا",
          "صهرجت الكبرى",
          "ميت محسن",
          "أتميدة",
          "ميت الفرماوي",
          "ميت يعيش",
          "هلا",
          "دنديط",
          "تفوه",
          "أوليلة",
          "الرحمانية",
          "سرحان",
          "ميت ناجي",
          "ميت أبو خالد",
          "ميت غريطة",
          "جصفا",
          "المعصرة",
          "كفر سرنجا",
          "سنفا",
          "ميت العز"
        ]
      },
      {
        "id": "sinbillawin",
        "ar": "مركز ومدينة السنبلاوين",
        "en": "El Sinbillawin Markaz",
        "districts": [
          "مدينة السنبلاوين",
          "برهمتوش",
          "طماي الزهايرة",
          "ميت غريطة",
          "شبرا سندي",
          "المقاطعة",
          "كفر غنام",
          "البكارية",
          "طوخ الأقلام",
          "الحصاينة",
          "قرقيرة",
          "أبو قراميط",
          "تمد الحجر",
          "الحجايزة",
          "الزهايرة",
          "كفر عزام",
          "نوب طريف",
          "شبرا قبالة"
        ]
      },
      {
        "id": "belqas",
        "ar": "مركز ومدينة بلقاس وجمصة",
        "en": "Belqas & Gamasa",
        "districts": [
          "مدينة بلقاس",
          "مدينة جمصة",
          "الستاموني",
          "المعصرة",
          "شرباص",
          "كفر دملاش",
          "قلبشو",
          "الحفير والأمل",
          "بسنديلة",
          "الزهراء",
          "أبو دشيشة",
          "الجوادية",
          "عزبة راغب",
          "كفر الغاب"
        ]
      },
      {
        "id": "dekernes",
        "ar": "مركز ومدينة دكرنس",
        "en": "Dekernes Markaz",
        "districts": [
          "مدينة دكرنس",
          "دموه",
          "ميت طريف",
          "نجير",
          "أشمون الرمان",
          "الربيعة",
          "ديمشلت",
          "كفر أبو ناصر",
          "المحمودية",
          "ميت السودان",
          "ميت ضافر",
          "الخشاشنة",
          "كفر الباز"
        ]
      },
      {
        "id": "sherbin",
        "ar": "مركز ومدينة شربين",
        "en": "Sherbin Markaz",
        "districts": [
          "مدينة شربين",
          "رأس الخليج",
          "كفر الأطرش",
          "كفر الترعة القديم",
          "كفر الترعة الجديد",
          "بساط النصارى",
          "أبو جلال",
          "الحصص",
          "محلة إنجاق",
          "دنجواي",
          "كفر الحاج شربيني",
          "الأحمدية",
          "الشناوي"
        ]
      },
      {
        "id": "manzala",
        "ar": "مركز ومدينة المنزلة",
        "en": "El Manzala Markaz",
        "districts": [
          "مدينة المنزلة",
          "العزيزة",
          "البصراط",
          "الفروسات",
          "ميت شريف",
          "الأحمدية",
          "النسايمة",
          "العامرة",
          "العمارنة",
          "كفر حجاج",
          "الحوتة"
        ]
      },
      {
        "id": "minyat_elnasr",
        "ar": "مركز منية النصر والكردي",
        "en": "Minyat El Nasr & El Kurdi",
        "districts": [
          "مدينة منية النصر",
          "مدينة الكردي",
          "برمبال الجديدة",
          "برمبال القديمة",
          "ميت عاصم",
          "ميت تمامة",
          "البجلات",
          "الرياض",
          "كفر قنيش",
          "الدراكسة"
        ]
      },
      {
        "id": "nabaroh",
        "ar": "مركز ومدينة نبروه",
        "en": "Nabaroh Markaz",
        "districts": [
          "مدينة نبروه",
          "درين",
          "نشا",
          "طيبة",
          "كفر الأبحر",
          "تيره",
          "كفر بهوت",
          "بهوت",
          "بانوب",
          "أبستو"
        ]
      },
      {
        "id": "tami_elamdid",
        "ar": "مركز تمي الأمديد",
        "en": "Tami El Amdid",
        "districts": [
          "مدينة تمي الأمديد",
          "الربع",
          "ظفر",
          "صدقا",
          "الميهي",
          "البيضاء",
          "أبو داود",
          "كفر سنجاب",
          "الخمسة"
        ]
      },
      {
        "id": "gamaliya_matariya",
        "ar": "مركز الجمالية والمطرية وميت سلسيل",
        "en": "El Gamaliya, El Matariya & Mit Salsil",
        "districts": [
          "مدينة الجمالية",
          "مدينة المطرية",
          "مدينة ميت سلسيل",
          "العصافرة",
          "ميت مرجا سلسيل",
          "الجوابر",
          "الكفر الجديد"
        ]
      },
      {
        "id": "bani_ebeid_mahalet_damana",
        "ar": "مركز بني عبيد ومحلة دمنة",
        "en": "Bani Ebeid & Mahalet Damana",
        "districts": [
          "مدينة بني عبيد",
          "مدينة محلة دمنة",
          "الصلاحات",
          "ميت سويد",
          "ديرب الخضر",
          "الزهيري",
          "كفر الصلاحات",
          "منشأة عبد الرحمن"
        ]
      }
    ]
  },
  {
    "id": "cairo",
    "nameAr": "القاهرة",
    "nameEn": "Cairo",
    "majorCities": [
      {
        "id": "nasr_city",
        "ar": "حي مدينة نصر (شرق وغرب)",
        "en": "Nasr City",
        "districts": [
          "الحي الأول",
          "الحي السابع",
          "الحي الثامن",
          "الحي العاشر",
          "مكرم عبيد",
          "عباس العقاد",
          "زهراء مدينة نصر",
          "رابعة العدوية",
          "الوفاء والأمل",
          "المنطقة الأولى",
          "المنطقة السادسة",
          "الحى السويسري",
          "صقر قريش"
        ]
      },
      {
        "id": "heliopolis_nozha",
        "ar": "مصر الجديدة والنزهة",
        "en": "Heliopolis & El Nozha",
        "districts": [
          "الكوربة",
          "ميدان الحجاز",
          "روكسي",
          "النزهة الجديدة",
          "مساكن شيراتون",
          "أرض الجولف",
          "الميرغني",
          "الماظة",
          "ميدان سفير",
          "ميدان تريومف",
          "سانت فاتيما"
        ]
      },
      {
        "id": "new_cairo",
        "ar": "القاهرة الجديدة (التجمع والرحاب ومدينتي)",
        "en": "New Cairo, Rehab & Madinaty",
        "districts": [
          "التجمع الخامس",
          "التجمع الأول",
          "التجمع الثالث",
          "مدينة الرحاب",
          "مدينتي",
          "النرجس",
          "الياسمين",
          "البنفسج",
          "اللوتس",
          "بيت الوطن",
          "القطامية",
          "المستثمرين"
        ]
      },
      {
        "id": "maadi_basatin",
        "ar": "المعادي والبساتين ودار السلام",
        "en": "Maadi, Basatin & Dar El Salam",
        "districts": [
          "المعادي السرايات",
          "زهراء المعادي",
          "دجلة المعادي",
          "حدائق المعادي",
          "كورنيش المعادي",
          "البساتين",
          "دار السلام",
          "المعصرة",
          "طره"
        ]
      },
      {
        "id": "shubra_rod_elfarag",
        "ar": "شبرا وروض الفرج والساحل",
        "en": "Shubra, Rod El Farag & El Sahel",
        "districts": [
          "شبرا مصر",
          "روض الفرج",
          "الساحل",
          "الخلفاوي",
          "سانت تريزا",
          "مسرة",
          "المظلات",
          "الشرابية",
          "الزاوية الحمراء",
          "حدائق القبة",
          "الوايلي",
          "العباسية"
        ]
      },
      {
        "id": "downtown_zamalek",
        "ar": "وسط البلد والزمالك والمنيل",
        "en": "Downtown, Zamalek & Manial",
        "districts": [
          "وسط البلد",
          "التحرير",
          "رمسيس",
          "الزمالك",
          "جاردن سيتي",
          "المنيل",
          "مصر القديمة",
          "السيدة زينب",
          "الحسين والجمالية",
          "عابدين",
          "باب الشعرية",
          "الموسكي",
          "بولاق أبو العلا"
        ]
      },
      {
        "id": "ain_shams_marg_mataria",
        "ar": "عين شمس والمرج والمطرية والسلام",
        "en": "Ain Shams, El Marg, Mataria & El Salam",
        "districts": [
          "عين شمس الشرقية",
          "عين شمس الغربية",
          "ألف مسكن",
          "حلمية الزيتون",
          "حدائق الزيتون",
          "المطرية",
          "المرج الجديدة",
          "المرج القديمة",
          "عزبة النخل",
          "مدينة السلام",
          "النهضة",
          "جسر السويس"
        ]
      },
      {
        "id": "mokattam_helwan_shorouk",
        "ar": "المقطم وحلوان والشروق وبدر",
        "en": "Mokattam, Helwan, Shorouk & Badr",
        "districts": [
          "المقطم (شارع 9)",
          "الهضبة الوسطى",
          "الهضبة السفلى",
          "حلوان",
          "حدائق حلوان",
          "وادي حوف",
          "15 مايو",
          "التبين",
          "مدينة الشروق",
          "مدينة بدر",
          "العاصمة الإدارية الجديدة"
        ]
      }
    ]
  },
  {
    "id": "giza",
    "nameAr": "الجيزة",
    "nameEn": "Giza",
    "majorCities": [
      {
        "id": "dokki_mohandessin_agouza",
        "ar": "الدقي والمهندسين والعجوزة",
        "en": "Dokki, Mohandessin & Agouza",
        "districts": [
          "الدقي",
          "المهندسين",
          "العجوزة",
          "شارع جامعة الدول",
          "ميدان المساحة",
          "ميدان لبنان",
          "البحوث",
          "الكيت كات",
          "أرض اللواء",
          "بين السرايات"
        ]
      },
      {
        "id": "haram_faisal_omrania",
        "ar": "الهرم وفيصل والعمرانية",
        "en": "Haram, Faisal & Omrania",
        "districts": [
          "شارع الهرم",
          "شارع فيصل",
          "حدائق الأهرام",
          "المريوطية",
          "الطالبية",
          "العمرانية",
          "التعاون",
          "العريش",
          "المطبعة",
          "الطوابق",
          "كفر طهرمس",
          "المنصورية"
        ]
      },
      {
        "id": "october_zayed",
        "ar": "6 أكتوبر والشيخ زايد وحدائق أكتوبر",
        "en": "6th of October & Sheikh Zayed",
        "districts": [
          "الحصري",
          "الحي الأول بأكتوبر",
          "الحي السابع",
          "الحي الثامن",
          "الحي المتميز",
          "غرب سوميد",
          "الشيخ زايد",
          "بيفرلي هيلز",
          "حدائق أكتوبر",
          "أكتوبر الجديدة"
        ]
      },
      {
        "id": "giza_imbaba_bulaq",
        "ar": "جنوب الجيزة وإمبابة وبولاق والوراق",
        "en": "Giza Square, Imbaba, Bulaq & Warraq",
        "districts": [
          "ميدان الجيزة",
          "المنيب",
          "ساقية مكي",
          "جزيرة الدهب",
          "إمبابة",
          "القومية العربية",
          "الوراق",
          "بولاق الدكرور",
          "صفط اللبن",
          "ناهيا"
        ]
      },
      {
        "id": "badrashein_hawamdia_ayat",
        "ar": "مراكز البدرشين والحوامدية والعياط والصف",
        "en": "Badrashein, Hawamdia, Ayat & El Saff",
        "districts": [
          "مدينة الحوامدية",
          "أم خنان",
          "مدينة البدرشين",
          "سقارة",
          "ميت رهينة",
          "دهشور",
          "العزيزية",
          "أبو صير",
          "مدينة العياط",
          "طهما",
          "المتانيا",
          "مدينة الصف",
          "أطفيح",
          "القبابات"
        ]
      },
      {
        "id": "kirdasa_osim_abunomros",
        "ar": "مراكز كرداسة وأوسيم وأبو النمرس ومنشأة القناطر",
        "en": "Kirdasa, Osim, Abu El Nomros & Manshiyat El Qanater",
        "districts": [
          "مدينة كرداسة",
          "أبو رواش",
          "بني مجدول",
          "المعتمدية",
          "مدينة أوسيم",
          "برطس",
          "بشتيل",
          "الكوم الأحمر",
          "أبو النمرس",
          "ترسا",
          "شبرامنت",
          "منشأة القناطر",
          "وردان",
          "نكلا",
          "الواحات البحرية"
        ]
      }
    ]
  },
  {
    "id": "alexandria",
    "nameAr": "الإسكندرية",
    "nameEn": "Alexandria",
    "majorCities": [
      {
        "id": "montaza",
        "ar": "حي المنتزه (أول وثان)",
        "en": "El Montaza",
        "districts": [
          "ميامي",
          "سيدي بشر",
          "العصافرة بحري وقبلي",
          "المندرة",
          "المعمورة",
          "أبو قير",
          "طوسون",
          "فيكتوريا",
          "الساعة",
          "دربالة",
          "الفلكي"
        ]
      },
      {
        "id": "east_alex",
        "ar": "حي شرق (سموحة وسيدي جابر ولوران)",
        "en": "East Alexandria (Smouha & Sidi Gaber)",
        "districts": [
          "سموحة",
          "سيدي جابر",
          "كليوباترا",
          "سبورتنج",
          "الإبراهيمية",
          "كامب شيزار",
          "لوران",
          "سان ستيفانو",
          "زيزينيا",
          "جليم",
          "ستانلي",
          "رشدي",
          "كفر عبده",
          "مصطفى كامل",
          "باكوس",
          "شدس",
          "جناكليس"
        ]
      },
      {
        "id": "central_west_alex",
        "ar": "حي وسط وغرب والجمرك",
        "en": "Central, West & Gomrok",
        "districts": [
          "محطة الرمل",
          "المنشية",
          "بحري والأنفوشي",
          "محرم بك",
          "اللبان",
          "كرموز",
          "غيط العنب",
          "مينا البصل",
          "الورديان",
          "القباري",
          "أبيس"
        ]
      },
      {
        "id": "agami_amriya_borg",
        "ar": "العجمي والعامرية وبرج العرب",
        "en": "El Agami, Amriya & Borg El Arab",
        "districts": [
          "الهانوفيل",
          "البيطاش",
          "أبو يوسف",
          "الكيلو 21",
          "الدخيلة",
          "العامرية أول وثان",
          "النهضة",
          "كينج مريوط",
          "برج العرب القديمة",
          "برج العرب الجديدة",
          "بهيج"
        ]
      }
    ]
  },
  {
    "id": "sharkia",
    "nameAr": "الشرقية",
    "nameEn": "Sharkia",
    "majorCities": [
      {
        "id": "zagazig",
        "ar": "مركز ومدينة الزقازيق والقنايات",
        "en": "Zagazig & El Qanayat",
        "districts": [
          "حي أول الزقازيق",
          "حي ثان الزقازيق",
          "القومية",
          "فلل الجامعة",
          "المنتزه",
          "مدينة القنايات",
          "بردين",
          "شوبك بسطة",
          "الطيبة",
          "الزنكلون",
          "شيبة النكارية",
          "بيشة قايد",
          "العصلوجي",
          "هرية رزنة"
        ]
      },
      {
        "id": "belbeis_tenth",
        "ar": "مركز بلبيس والعاشر من رمضان",
        "en": "Belbeis & 10th of Ramadan",
        "districts": [
          "مدينة العاشر من رمضان",
          "مدينة بلبيس",
          "أنشاص الرمل",
          "العدلية",
          "غيتة",
          "ميت جابر",
          "شبرا النخلة",
          "الزوامل",
          "أولاد سيف",
          "بساتين الإسماعيلية"
        ]
      },
      {
        "id": "minya_elqamh_mashtoul",
        "ar": "مركز منيا القمح ومشتول السوق",
        "en": "Minya El Qamh & Mashtoul El Souk",
        "districts": [
          "مدينة منيا القمح",
          "التلين",
          "شينبارة الميمونة",
          "سنهوا",
          "الجديدة",
          "السعديين",
          "العزيزية",
          "ميت يزيد",
          "ملامس",
          "مدينة مشتول السوق",
          "الصحافة",
          "كفر إبراش"
        ]
      },
      {
        "id": "faqous_abukabir_hehya",
        "ar": "مراكز فاقوس وأبو كبير وههيا والإبراهيمية",
        "en": "Faqous, Abu Kabir, Hehya & Ibrahimiya",
        "districts": [
          "مدينة فاقوس",
          "الصالحية الجديدة",
          "الديدامون",
          "أكياد",
          "السماعنة",
          "مدينة أبو كبير",
          "الحصوة",
          "طوخ القراموص",
          "هربيط",
          "مدينة ههيا",
          "الشبراوين",
          "المهدية",
          "مدينة الإبراهيمية",
          "الحلوات"
        ]
      },
      {
        "id": "abu_hammad_deyerb_kafr_saqr",
        "ar": "مراكز ديرب نجم وأبو حماد وكفر صقر والحسينية",
        "en": "Deyerb Negm, Abu Hammad, Kafr Saqr & Husseiniya",
        "districts": [
          "مدينة ديرب نجم",
          "بهنباي",
          "صافور",
          "جميزة بني عمرو",
          "مدينة أبو حماد",
          "العباسة",
          "بحطيط",
          "القرين",
          "مدينة كفر صقر",
          "أولاد صقر",
          "مدينة الحسينية",
          "صان الحجر",
          "منشأة أبو عمر"
        ]
      }
    ]
  },
  {
    "id": "gharbia",
    "nameAr": "الغربية",
    "nameEn": "Gharbia",
    "majorCities": [
      {
        "id": "tanta",
        "ar": "مركز ومدينة طنطا",
        "en": "Tanta City & Markaz",
        "districts": [
          "حي أول طنطا (شارع البحر والنادي)",
          "حي ثان طنطا (الاستاد والكورنيش)",
          "سيجر",
          "سبرباي",
          "برما",
          "محلة منوف",
          "شوني",
          "دفرة",
          "فيشا سليم",
          "ميت حبيش البحرية",
          "محلة روح",
          "اخناواي",
          "نواج",
          "تلبنت قيصر"
        ]
      },
      {
        "id": "mahalla",
        "ar": "مركز ومدينة المحلة الكبرى",
        "en": "El Mahalla El Kubra",
        "districts": [
          "حي أول المحلة",
          "حي ثان المحلة",
          "ششتا",
          "محلة أبو علي",
          "البنوان",
          "صفط تراب",
          "الجبابري",
          "دمرو",
          "بلقينا",
          "سامول",
          "المعتمدية",
          "ميت الليث",
          "الهياتم",
          "بشبيش",
          "الجابرية"
        ]
      },
      {
        "id": "zefta_samanoud",
        "ar": "مركز زفتى ومركز سمنود",
        "en": "Zefta & Samanoud",
        "districts": [
          "مدينة زفتى",
          "سنباط",
          "سندبسط",
          "شرشابة",
          "نهطاي",
          "الغريب",
          "تفجير",
          "حانون",
          "شبراملس",
          "مدينة سمنود",
          "الراهبين",
          "أبو صير بنا",
          "بهبيت الحجارة",
          "ميت عساس",
          "محلة زياد"
        ]
      },
      {
        "id": "kafr_elzayat_basyoun",
        "ar": "مركز كفر الزيات ومركز بسيون",
        "en": "Kafr El Zayat & Basyoun",
        "districts": [
          "مدينة كفر الزيات",
          "إبيار",
          "الدلجمون",
          "قليب إبيار",
          "أبو الغر",
          "كفر ديما",
          "مشلة",
          "مدينة بسيون",
          "صالحجر",
          "قرانشو",
          "كتامة الغابة الغربية",
          "شفا وقرون"
        ]
      },
      {
        "id": "qutour_santa",
        "ar": "مركز السنطة ومركز قطور",
        "en": "El Santa & Qutour",
        "districts": [
          "مدينة السنطة",
          "ميت حواي",
          "الجميزة",
          "الجعفرية",
          "شبرابيل",
          "مسهلة",
          "اشناواي",
          "مدينة قطور",
          "دماط",
          "بلتاج",
          "سجين الكوم",
          "ابشواي الملق"
        ]
      }
    ]
  },
  {
    "id": "qalyubia",
    "nameAr": "القليوبية",
    "nameEn": "Qalyubia",
    "majorCities": [
      {
        "id": "banha_kafr_shukr",
        "ar": "مركز ومدينة بنها وكفر شكر",
        "en": "Banha & Kafr Shukr",
        "districts": [
          "مدينة بنها (الفلل وبنها الجديدة)",
          "أتريب",
          "المنشية",
          "شبلنجة",
          "بطا",
          "الرملة",
          "طحلة",
          "مرصفا",
          "ميت العطار",
          "دمويا",
          "كفر الجزار",
          "سندنهور",
          "مدينة كفر شكر",
          "أسنيت",
          "البقاشين"
        ]
      },
      {
        "id": "toukh_qaha",
        "ar": "مركز ومدينة طوخ وقها",
        "en": "Toukh & Qaha",
        "districts": [
          "مدينة طوخ",
          "مدينة قها",
          "مشتهر",
          "بلتان",
          "العمار الكبرى",
          "ترسا",
          "برشوم",
          "نامول",
          "أجهور الكبرى",
          "الدير",
          "كفر منصور",
          "ميت كنانة",
          "امياي"
        ]
      },
      {
        "id": "qalyub_qanater",
        "ar": "مركز قليوب والقناطر الخيرية",
        "en": "Qalyub & El Qanater El Khayreya",
        "districts": [
          "مدينة قليوب",
          "ميت حلفا",
          "ناي",
          "كوم أشفين",
          "بلقس",
          "طنان",
          "سنديون",
          "صنافير",
          "مدينة القناطر الخيرية",
          "شلقان",
          "باسوس",
          "أبو الغيط",
          "الخرقانية",
          "المنيرة"
        ]
      },
      {
        "id": "shubra_khanka_obour",
        "ar": "شبرا الخيمة والخانكة والعبور وشبين القناطر",
        "en": "Shubra El Kheima, Khanka, Obour & Shebin El Qanater",
        "districts": [
          "حي غرب شبرا الخيمة",
          "حي شرق شبرا الخيمة (بهتيم ومسطرد)",
          "مدينة الخصوص",
          "مدينة العبور",
          "مدينة الخانكة",
          "أبو زعبل",
          "القلج",
          "سرياقوس",
          "الجبل الأصفر",
          "مدينة شبين القناطر",
          "نوى",
          "طحانوب",
          "الأحراز",
          "المريج"
        ]
      }
    ]
  },
  {
    "id": "menofia",
    "nameAr": "المنوفية",
    "nameEn": "Menofia",
    "majorCities": [
      {
        "id": "shebin_elkom",
        "ar": "مركز ومدينة شبين الكوم",
        "en": "Shebin El Kom",
        "districts": [
          "حي شرق شبين الكوم",
          "حي غرب شبين الكوم",
          "البتانون",
          "المصيلحة",
          "ميت خلف",
          "ميت خاقان",
          "البندارية",
          "اصطباري",
          "شبراباص",
          "بخاتي",
          "شنوان",
          "طوخ طنبشا"
        ]
      },
      {
        "id": "menouf_sadat_sers",
        "ar": "مركز منوف وسرس الليان ومدينة السادات",
        "en": "Menouf, Sers El Layan & Sadat City",
        "districts": [
          "مدينة منوف",
          "مدينة سرس الليان",
          "مدينة السادات",
          "فيشا الكبرى",
          "الحامول",
          "تتا",
          "زاوية رزين",
          "برهيم",
          "سدود",
          "طملوها",
          "الخطاطبة",
          "كفر داود"
        ]
      },
      {
        "id": "ashmoun_bagour",
        "ar": "مركز أشمون ومركز الباجور",
        "en": "Ashmoun & El Bagour",
        "districts": [
          "مدينة أشمون",
          "شما",
          "سنتريس",
          "جريس",
          "سبك الأحد المنوفية",
          "طليا",
          "طهواي",
          "سمادون",
          "ساقية أبو شعرة",
          "مدينة الباجور",
          "جروان",
          "مشيرف",
          "اسطنها",
          "بي العرب",
          "تلبنت أبشيش"
        ]
      },
      {
        "id": "quesna_berket_elsaba_tala",
        "ar": "مراكز قويسنا وبركة السبع وتلا والشهداء",
        "en": "Quesna, Berket El Saba, Tala & El Shohada",
        "districts": [
          "مدينة قويسنا",
          "أم خنان المنوفية",
          "عرب الرمل",
          "ميت بره",
          "طه شبرا",
          "إبنهس",
          "مدينة بركة السبع",
          "طوخ طنبشا",
          "جنزور",
          "هورين",
          "شنتنا الحجر",
          "مدينة تلا",
          "بابل",
          "زاوية بمم",
          "مدينة الشهداء",
          "دنشواي",
          "زاوية الناعورة"
        ]
      }
    ]
  },
  {
    "id": "beheira",
    "nameAr": "البحيرة",
    "nameEn": "Beheira",
    "majorCities": [
      {
        "id": "damanhour",
        "ar": "مركز ومدينة دمنهور",
        "en": "Damanhour",
        "districts": [
          "مدينة دمنهور (شبرا وأبو الريش)",
          "سنهور",
          "زاوية غزال",
          "دسونس أم دينار",
          "نكلا العنب",
          "أفلاقة",
          "الصفاصيف",
          "قراقص",
          "شرنوب"
        ]
      },
      {
        "id": "kafr_eldawar_abu_hommos",
        "ar": "مركز كفر الدوار وأبو حمص",
        "en": "Kafr El Dawar & Abu Hommos",
        "districts": [
          "مدينة كفر الدوار",
          "دفشو",
          "بولين",
          "سيدي غازي",
          "كوم البركة",
          "الأمراء",
          "مدينة أبو حمص",
          "بركة غطاس",
          "بسنتواي",
          "قافلة",
          "بلقطر",
          "دمسنا"
        ]
      },
      {
        "id": "itay_kom_hamada_delengat",
        "ar": "مراكز إيتاي البارود وكوم حمادة والدلنجات",
        "en": "Itay El Baroud, Kom Hamada & Delengat",
        "districts": [
          "مدينة إيتاي البارود",
          "صفط الحرية",
          "ششت الأنعام",
          "قليشان",
          "نكلا العنب",
          "مدينة كوم حمادة",
          "واقد",
          "الطود",
          "خربتا",
          "دست الأشراف",
          "البريجات",
          "مدينة الدلنجات",
          "الوفائية",
          "المسين"
        ]
      },
      {
        "id": "rashid_edko_mahmoudia_shabrakhit",
        "ar": "مراكز رشيد وإدكو والمحمودية وشبراخيت والرحمانية",
        "en": "Rashid, Edko, Mahmoudia, Shabrakhit & Rahmaniya",
        "districts": [
          "مدينة رشيد",
          "إدفينا",
          "برج رشيد",
          "مدينة إدكو",
          "المعدية",
          "مدينة المحمودية",
          "فيشا بلخة",
          "أريمون",
          "مدينة شبراخيت",
          "لقانة",
          "أورين",
          "مدينة الرحمانية",
          "حوش عيسى",
          "أبو المطامير",
          "وادي النطرون",
          "النوبارية الجديدة"
        ]
      }
    ]
  },
  {
    "id": "kafr_el_sheikh",
    "nameAr": "كفر الشيخ",
    "nameEn": "Kafr El Sheikh",
    "majorCities": [
      {
        "id": "kfs_qallin",
        "ar": "مركز ومدينة كفر الشيخ وقلين",
        "en": "Kafr El Sheikh & Qallin",
        "districts": [
          "مدينة كفر الشيخ",
          "سخا",
          "القنطرة البيضاء",
          "مسير",
          "أبو تمادة",
          "الحمراوي",
          "أريمون كفر الشيخ",
          "دقلت",
          "محلة موسى",
          "مدينة قلين",
          "شبراطو",
          "كفر المرازقة",
          "البكاتوش"
        ]
      },
      {
        "id": "desouk_fuwwah_motobas",
        "ar": "مراكز دسوق وفوه ومطوبس",
        "en": "Desouk, Fuwwah & Motobas",
        "districts": [
          "مدينة دسوق",
          "شباص الشهداء",
          "سنهور المدينة",
          "العجوزين",
          "محلة دياي",
          "شابة",
          "كفر مجر",
          "مدينة فوه",
          "قبريط",
          "السالمية",
          "مدينة مطوبس",
          "برج مغيزل",
          "الجزيرة الخضراء"
        ]
      },
      {
        "id": "baltim_biyla_hamoul_sidi_salem",
        "ar": "مراكز بلطيم وبيلا والحامول وسيدي سالم والرياض",
        "en": "Baltim, Biyla, El Hamoul, Sidi Salem & El Riyad",
        "districts": [
          "مدينة بلطيم",
          "مصيف بلطيم",
          "البرج",
          "الشهابية",
          "مدينة بيلا",
          "إبشان",
          "الجرايدة",
          "الكوم الطويل",
          "مدينة الحامول",
          "الزعفران",
          "البنا",
          "مدينة سيدي سالم",
          "الورق",
          "تيدا",
          "مدينة الرياض"
        ]
      }
    ]
  },
  {
    "id": "damietta",
    "nameAr": "دمياط",
    "nameEn": "Damietta",
    "majorCities": [
      {
        "id": "damietta_ras_elbar",
        "ar": "مركز ومدينة دمياط ورأس البر ودمياط الجديدة",
        "en": "Damietta, Ras El Bar & New Damietta",
        "districts": [
          "مدينة دمياط (الأعصر وباب الحرس)",
          "مدينة دمياط الجديدة",
          "مصيف رأس البر",
          "عزبة البرج",
          "الشعراء",
          "الخياطة",
          "البصارطة",
          "العنانية",
          "السنانية",
          "شطا"
        ]
      },
      {
        "id": "faraskour_zarqa_kafr_saad",
        "ar": "مراكز فارسكور والزرقا وكفر سعد وكفر البطيخ",
        "en": "Faraskour, El Zarqa, Kafr Saad & Kafr El Battikh",
        "districts": [
          "مدينة فارسكور",
          "الرحامنة",
          "الروضة",
          "الحوراني",
          "شرباص دمياط",
          "مدينة الزرقا",
          "سرو",
          "ميت الخولي عبد الله",
          "دقهلة",
          "مدينة كفر سعد",
          "ميت أبو غالب",
          "كفر الوسطاني",
          "مدينة كفر البطيخ",
          "الركابية"
        ]
      }
    ]
  },
  {
    "id": "port_said",
    "nameAr": "بورسعيد",
    "nameEn": "Port Said",
    "majorCities": [
      {
        "id": "port_said_quarters",
        "ar": "أحياء مدينة بورسعيد وبورفؤاد",
        "en": "Port Said & Port Fouad Districts",
        "districts": [
          "حي الشرق",
          "حي العرب",
          "حي المناخ",
          "حي الزهور",
          "حي الضواحي",
          "حي الجنوب (بحر البقر والكاب)",
          "حي الغرب (الجرابعة والمناصرة)",
          "مدينة بورفؤاد"
        ]
      }
    ]
  },
  {
    "id": "ismailia",
    "nameAr": "الإسماعيلية",
    "nameEn": "Ismailia",
    "majorCities": [
      {
        "id": "ismailia_center",
        "ar": "مدينة ومركز الإسماعيلية",
        "en": "Ismailia City & Markaz",
        "districts": [
          "حي أول الإسماعيلية",
          "حي ثان الإسماعيلية",
          "حي ثالث (الشيخ زايد)",
          "نفيشة",
          "الفردان",
          "أبو عطوة",
          "الضبعية",
          "عين غصين"
        ]
      },
      {
        "id": "qantara_fayed_tal_elkabir",
        "ar": "مراكز القنطرة وفايد والتل الكبير وأبو صوير والقصاصين",
        "en": "Qantara, Fayed, Tal El Kabir, Abu Suwir & Kassassin",
        "districts": [
          "مدينة القنطرة غرب",
          "مدينة القنطرة شرق",
          "أبو خليفة",
          "الرياح",
          "مدينة فايد",
          "سرابيوم",
          "فنارة",
          "أبو سلطان",
          "مدينة التل الكبير",
          "القرين الجديدة",
          "الجزيرة الخضراء",
          "مدينة أبو صوير",
          "المستقبل",
          "مدينة القصاصين"
        ]
      }
    ]
  },
  {
    "id": "suez",
    "nameAr": "السويس",
    "nameEn": "Suez",
    "majorCities": [
      {
        "id": "suez_quarters",
        "ar": "أحياء محافظة السويس",
        "en": "Suez Districts & Villages",
        "districts": [
          "حي السويس (بورتوفيق)",
          "حي الأربعين",
          "حي فيصل (الصباح والسلام)",
          "حي عتاقة",
          "حي الجناين (قرية عامر والشلوفة وكبريت)",
          "العين السخنة"
        ]
      }
    ]
  },
  {
    "id": "fayoum",
    "nameAr": "الفيوم",
    "nameEn": "Fayoum",
    "majorCities": [
      {
        "id": "fayoum_center",
        "ar": "مركز ومدينة الفيوم",
        "en": "Fayoum City & Markaz",
        "districts": [
          "مدينة الفيوم (المشتل والسلخانة وكيمان فارس)",
          "الفيوم الجديدة",
          "دمو",
          "اللاهون",
          "تلات",
          "دسيا",
          "سنوفر",
          "العدوة",
          "بيهمو",
          "زاوية الكرداسة",
          "هوارة المقطعة"
        ]
      },
      {
        "id": "sinnuris_tamia",
        "ar": "مركز سنورس ومركز طامية",
        "en": "Sinnuris & Tamia",
        "districts": [
          "مدينة سنورس",
          "سنهور القبلية",
          "سنهور البحرية",
          "فديمين",
          "ترسا الفيوم",
          "مطرطارس",
          "جبلة",
          "بيهمو",
          "مدينة طامية",
          "الروضة",
          "فرقص",
          "قصر رشوان",
          "سرسيو",
          "دار السلام"
        ]
      },
      {
        "id": "itsa_ibshaway_youssef",
        "ar": "مراكز إطسا وأبشواي ويوسف الصديق",
        "en": "Itsa, Ibshaway & Youssef El Seddik",
        "districts": [
          "مدينة إطسا",
          "دفنو",
          "تطون",
          "منية الحيط",
          "قلمشاة",
          "جردو",
          "مطول",
          "مدينة أبشواي",
          "طبهار",
          "العجميين",
          "شكشوك",
          "أبو كساه",
          "مركز يوسف الصديق (الشواشنة)",
          "النزلة",
          "قرية تونس",
          "قارون"
        ]
      }
    ]
  },
  {
    "id": "beni_suef",
    "nameAr": "بني سويف",
    "nameEn": "Beni Suef",
    "majorCities": [
      {
        "id": "benisuef_wasta_nasser",
        "ar": "مراكز بني سويف والواسطى وناصر",
        "en": "Beni Suef, El Wasta & Nasser",
        "districts": [
          "مدينة بني سويف",
          "مدينة بني سويف الجديدة (شرق النيل)",
          "بلفيا",
          "تزمنت الشرقية",
          "إهناسيا الخضراء",
          "باروط",
          "ابشنا",
          "مدينة الواسطى",
          "الميمون",
          "قمن العروس",
          "أطواب",
          "انفسط",
          "ميدوم",
          "مدينة ناصر (بوش)",
          "دلاص",
          "أشمنت",
          "بهبشين"
        ]
      },
      {
        "id": "beba_ehnasia_sumusta_fashn",
        "ar": "مراكز ببا وإهناسيا وسمسطا والفشن",
        "en": "Beba, Ehnasia, Sumusta & El Fashn",
        "districts": [
          "مدينة ببا",
          "سدس الأمراء",
          "طنسا بني مالو",
          "هلية",
          "قمبش",
          "مدينة إهناسيا",
          "العواونة",
          "براوة",
          "ننا",
          "قاي",
          "مدينة سمسطا",
          "بدهل",
          "مازورة",
          "الشنطور",
          "مدينة الفشن",
          "الفنت",
          "تلت",
          "أبسوج",
          "دلهانس"
        ]
      }
    ]
  },
  {
    "id": "minya",
    "nameAr": "المنيا",
    "nameEn": "Minya",
    "majorCities": [
      {
        "id": "minya_samalut_matay",
        "ar": "مراكز المنيا وسمالوط ومطاي",
        "en": "Minya, Samalut & Matay",
        "districts": [
          "مدينة المنيا",
          "مدينة المنيا الجديدة",
          "تلة",
          "البرجاية",
          "بني أحمد الغربية",
          "دمشير",
          "صفط الخمار",
          "طوخ الخيل",
          "نزلة حسين",
          "مدينة سمالوط",
          "البيهو",
          "قلوصنا",
          "شوشة",
          "دفش",
          "بني غني",
          "جبل الطير",
          "مدينة مطاي",
          "أبو عزيز",
          "بردنوها",
          "منبال"
        ]
      },
      {
        "id": "mallawi_deir_mawas_abou_qurqas",
        "ar": "مراكز ملوي وأبو قرقاص ودير مواس",
        "en": "Mallawi, Abu Qurqas & Deir Mawas",
        "districts": [
          "مدينة ملوي",
          "تندة",
          "الروضة ملوي",
          "نواي",
          "قلندول",
          "البياضية",
          "ديروط أم نخلة",
          "الأشمونين",
          "مدينة أبو قرقاص (الفكرية)",
          "أتليدم",
          "بني عبيد المنيا",
          "جريس المنيا",
          "الكرم",
          "مدينة دير مواس",
          "دلجا",
          "تل بني عمران",
          "كفر خزام"
        ]
      },
      {
        "id": "maghagha_beni_mazar_adwa",
        "ar": "مراكز مغاغة وبني مزار والعدوة",
        "en": "Maghagha, Beni Mazar & El Adwa",
        "districts": [
          "مدينة مغاغة",
          "أبا الوقف",
          "شارونة",
          "طنبوب",
          "شم البحرية",
          "برطباط",
          "مدينة بني مزار",
          "القيس",
          "صندفا",
          "البهنسا",
          "أبو جرج",
          "شلقام",
          "مدينة العدوة",
          "صفانية",
          "عطف حيدر",
          "البسقلون"
        ]
      }
    ]
  },
  {
    "id": "assiut",
    "nameAr": "أسيوط",
    "nameEn": "Assiut",
    "majorCities": [
      {
        "id": "assiut_center",
        "ar": "مدينة ومركز أسيوط وأسيوط الجديدة",
        "en": "Assiut City & Markaz",
        "districts": [
          "حي غرب أسيوط",
          "حي شرق أسيوط",
          "مدينة أسيوط الجديدة",
          "درنكة",
          "منقباد",
          "ريفـا",
          "موشا",
          "بني غالب",
          "نجع سبع",
          "المطيعة",
          "الزاوية"
        ]
      },
      {
        "id": "dayrout_qusia_manfalut",
        "ar": "مراكز ديروط والقوصية ومنفلوط",
        "en": "Dayrout, El Qusia & Manfalut",
        "districts": [
          "مدينة ديروط",
          "دشلوط",
          "صنبو",
          "بني يحيى",
          "جرف سرحان",
          "مسارة",
          "كوم بوها",
          "مدينة القوصية",
          "مير",
          "فزارة",
          "بني قرة",
          "التتالية",
          "المنشأة الكبرى",
          "مدينة منفلوط",
          "بني عديات",
          "الحواتكة",
          "نزة قرار",
          "العزية",
          "أم القصور"
        ]
      },
      {
        "id": "abnoub_fateh_abchtig_sedfa_badari",
        "ar": "مراكز أبنوب والفتح وأبو تيج وصدفا والبداري والغنايم وساحل سليم",
        "en": "Abnoub, El Fateh, Abu Tig, Sedfa & El Badari",
        "districts": [
          "مدينة أبنوب",
          "الحمام أبنوب",
          "بني محمديات",
          "المعابدة",
          "مدينة الفتح (الناصرية)",
          "الواسطى أسيوط",
          "بني مر",
          "بصرة",
          "مدينة أبو تيج",
          "النخيلة",
          "دوينة",
          "باويط",
          "مدينة صدفا",
          "البربا",
          "مجريس",
          "مدينة الغنايم",
          "مدينة ساحل سليم",
          "الشامية",
          "مدينة البداري",
          "النواورة",
          "العقال البحري والقبلي"
        ]
      }
    ]
  },
  {
    "id": "sohag",
    "nameAr": "سوهاج",
    "nameEn": "Sohag",
    "majorCities": [
      {
        "id": "sohag_akhmim_maragha",
        "ar": "مراكز سوهاج وأخميم والمراغة",
        "en": "Sohag, Akhmim & El Maragha",
        "districts": [
          "حي شرق سوهاج",
          "حي غرب سوهاج",
          "مدينة سوهاج الجديدة",
          "جزيرة شندويل",
          "بلصفورة",
          "تونس سوهاج",
          "الكوامل",
          "روافع القصير",
          "مدينة أخميم",
          "الحواويش",
          "نيدة",
          "الكولا",
          "السلاموني",
          "مدينة المراغة",
          "شندويل البلد",
          "البطاخ",
          "بناويط",
          "الغريزات"
        ]
      },
      {
        "id": "tahta_tama_juhayna",
        "ar": "مراكز طهطا وطما وجهينة",
        "en": "Tahta, Tama & Juhayna",
        "districts": [
          "مدينة طهطا",
          "شطورة",
          "الصفيحة",
          "بنهو",
          "بنجا",
          "نزلة القاضي",
          "الشيخ زين الدين",
          "مدينة طما",
          "مشطا",
          "المدمر",
          "أم دومة",
          "كوم أشقاو",
          "رياينة المعلق",
          "مدينة جهينة",
          "جهينة الشرقية",
          "الطليحات",
          "عنيبس"
        ]
      },
      {
        "id": "girga_baliana_monshaa_dar_elsalam",
        "ar": "مراكز جرجا والبلينا والمنشأة ودار السلام وساقلتة",
        "en": "Girga, El Baliana, El Monshaa, Dar El Salam & Saqultah",
        "districts": [
          "مدينة جرجا",
          "بيت داود",
          "البربا جرجا",
          "المجابرة",
          "خارجية جرجا",
          "مدينة البلينا",
          "عرابة أبيدوس",
          "برديس",
          "أولاد عليو",
          "بني حميل",
          "مدينة المنشأة",
          "أولاد حمزة",
          "الدويرات",
          "الزارة",
          "مدينة دار السلام (أولاد طوق)",
          "أولاد يحيى",
          "الخيام",
          "الكشح",
          "مدينة ساقلتة",
          "سفلاق",
          "الجلاوية"
        ]
      }
    ]
  },
  {
    "id": "qena",
    "nameAr": "قنا",
    "nameEn": "Qena",
    "majorCities": [
      {
        "id": "qena_qeft_quos_naqada",
        "ar": "مراكز قنا وقفط وقوص ونقادة",
        "en": "Qena, Qeft, Qus & Naqada",
        "districts": [
          "مدينة قنا",
          "مدينة قنا الجديدة",
          "دندرة",
          "الأشراف",
          "أبنود",
          "القناوية",
          "المحروسة",
          "الطويرات",
          "مدينة قفط",
          "القلعة",
          "البراهمة",
          "الكلاحين",
          "مدينة قوص",
          "حجازة قبلي وبحري",
          "خزام",
          "جراجوس",
          "الكراتية",
          "المسيد",
          "مدينة نقادة",
          "طوخ نقادة",
          "الأوسط قمولا",
          "الخطارة"
        ]
      },
      {
        "id": "nag_hammadi_deshna_farshout_abu_tesht",
        "ar": "مراكز نجع حمادي ودشنا وفرشوط وأبو تشت والوقف",
        "en": "Nag Hammadi, Deshna, Farshout, Abu Tesht & El Waqf",
        "districts": [
          "مدينة نجع حمادي",
          "بهجورة",
          "هو",
          "أولاد نجم",
          "الحلفاية بحري",
          "القصر",
          "الرحمانية قبلي",
          "مدينة دشنا",
          "أبو مناع بحري وقبلي",
          "فاو قبلي",
          "السمطا",
          "العزازية",
          "مدينة فرشوط",
          "العركي",
          "الكوم الأحمر فرشوط",
          "مدينة أبو تشت",
          "بخانس",
          "الأميرية",
          "السمهود",
          "الكرنك أبو تشت",
          "مدينة الوقف",
          "المراشدة"
        ]
      }
    ]
  },
  {
    "id": "luxor",
    "nameAr": "الأقصر",
    "nameEn": "Luxor",
    "majorCities": [
      {
        "id": "luxor_bayadiya_zeinia_qurna",
        "ar": "مدينة الأقصر ومراكز البياضية والزينية والقرنة والطود",
        "en": "Luxor, El Bayadiya, El Zeinia, El Qurna & El Tod",
        "districts": [
          "مدينة الأقصر",
          "الكرنك",
          "العوامية",
          "منشأة العماري",
          "مدينة البياضية",
          "البغدادي",
          "الحبيل",
          "مدينة الزينية",
          "الزينية بحري",
          "المدامود",
          "العشي",
          "مدينة القرنة (البر الغربي)",
          "البعيرات",
          "الأقالتة",
          "الطارف",
          "مدينة الطود",
          "العديسات بحري وقبلي",
          "المريس"
        ]
      },
      {
        "id": "esna_armant",
        "ar": "مركز ومدينة إسنا ومركز ومدينة أرمنت",
        "en": "Esna & Armant",
        "districts": [
          "مدينة إسنا",
          "الدير إسنا",
          "الحلة",
          "الكيمان",
          "أصفون المطاعنة",
          "النجوع بحري",
          "طفنيس",
          "النمسا",
          "القرايا",
          "توماس وعافية",
          "مدينة أرمنت (الوابورات والحائط)",
          "الرزيقات",
          "المحاميد",
          "الرياينة"
        ]
      }
    ]
  },
  {
    "id": "aswan",
    "nameAr": "أسوان",
    "nameEn": "Aswan",
    "majorCities": [
      {
        "id": "aswan_daraw",
        "ar": "مركز ومدينة أسوان ومركز دراو",
        "en": "Aswan & Daraw",
        "districts": [
          "مدينة أسوان",
          "مدينة أسوان الجديدة",
          "أبو الريش",
          "الأعقاب",
          "غرب أسوان",
          "جزيرة سهيل",
          "صحاري",
          "مدينة دراو",
          "بنبان",
          "المنصورية أسوان",
          "الجعافرة",
          "الشطب"
        ]
      },
      {
        "id": "kom_ombo_edfu_nasr_elnuba",
        "ar": "مراكز كوم أمبو وإدفو ونصر النوبة",
        "en": "Kom Ombo, Edfu & Nasr El Nuba",
        "districts": [
          "مدينة كوم أمبو",
          "العباسية كوم أمبو",
          "اقليت",
          "الكفور",
          "فارس",
          "المنشية الجديدة",
          "سلوا بحري وقبلي",
          "مدينة إدفو",
          "البصيلية",
          "السباعية",
          "الرمادي قبلي وبحري",
          "كلح الجبل",
          "الرديسية",
          "وادي الصعايدة",
          "مدينة نصر النوبة",
          "بلانة",
          "كلابشة",
          "أبو سمبل السياحية"
        ]
      }
    ]
  },
  {
    "id": "red_sea",
    "nameAr": "البحر الأحمر",
    "nameEn": "Red Sea",
    "majorCities": [
      {
        "id": "hurghada_gouna_safaga",
        "ar": "الغردقة وسفاجا والقصير ومرسى علم ورأس غارب",
        "en": "Hurghada, Safaga, Quseir, Marsa Alam & Ras Ghareb",
        "districts": [
          "مدينة الغردقة (الدهار والسقالة والكوثر)",
          "الجونة",
          "سهل حشيش",
          "مكادي باي",
          "مدينة رأس غارب",
          "الزعفرانة",
          "مدينة سفاجا",
          "أم الحويطات",
          "مدينة القصير",
          "مدينة مرسى علم",
          "برنيس",
          "مدينة الشلاتين",
          "أبو رماد",
          "مدينة حلايب"
        ]
      }
    ]
  },
  {
    "id": "south_sinai",
    "nameAr": "جنوب سيناء",
    "nameEn": "South Sinai",
    "majorCities": [
      {
        "id": "sharm_tor_dahab_nuweiba",
        "ar": "شرم الشيخ والطور ودهب ونويبع ورأس سدر",
        "en": "Sharm El Sheikh, El Tor, Dahab, Nuweiba & Ras Sudr",
        "districts": [
          "مدينة شرم الشيخ (خليج نعمة والهضبة ونبق)",
          "مدينة الطور (طور سيناء)",
          "قرية الوادي",
          "الجبيل",
          "مدينة دهب (العصيدة والمسبط)",
          "مدينة نويبع",
          "طابا",
          "مدينة سانت كاترين",
          "مدينة رأس سدر",
          "أبو صويرة",
          "مدينة أبو زنيمة",
          "مدينة أبو رديس"
        ]
      }
    ]
  },
  {
    "id": "north_sinai",
    "nameAr": "شمال سيناء",
    "nameEn": "North Sinai",
    "majorCities": [
      {
        "id": "arish_bir_elabd_sheikh_zuweid",
        "ar": "العريش وبئر العبد والشيخ زويد والحسنة ونخل",
        "en": "El Arish, Bir El Abd, Sheikh Zuweid, Hasana & Nakhl",
        "districts": [
          "مدينة العريش (حي الضاحية والمساعيد والريسة)",
          "الميدان",
          "السبيل",
          "مدينة بئر العبد",
          "رابعة",
          "رمانة",
          "بالوظة",
          "قبر عمير",
          "مدينة الشيخ زويد",
          "الجورة",
          "مدينة رفح",
          "مدينة الحسنة",
          "القسيمة",
          "مدينة نخل"
        ]
      }
    ]
  },
  {
    "id": "matrouh",
    "nameAr": "مطروح والساحل الشمالي",
    "nameEn": "Matrouh & North Coast",
    "majorCities": [
      {
        "id": "marsa_matrouh_alamein_hammam_siwa",
        "ar": "مرسى مطروح والعلمين والحمام والضبعة وسيوة",
        "en": "Marsa Matrouh, Alamein, El Hammam, El Dabaa & Siwa",
        "districts": [
          "مدينة مرسى مطروح",
          "علم الروم",
          "عجيبة",
          "القصر مطروح",
          "أم الرخم",
          "رأس الحكمة",
          "مدينة العلمين الجديدة",
          "سيدي عبد الرحمن",
          "مارينا",
          "مدينة الحمام",
          "قرى البنجر",
          "مدينة الضبعة",
          "جلالة",
          "فوكة",
          "مدينة سيدي براني",
          "مدينة السلوم",
          "مدينة النجيلة",
          "واحة سيوة (أغورمي وبهي الدين)"
        ]
      }
    ]
  },
  {
    "id": "new_valley",
    "nameAr": "الوادي الجديد",
    "nameEn": "New Valley",
    "majorCities": [
      {
        "id": "kharga_dakhla_farafra_baris",
        "ar": "مراكز الخارجة والداخلة والفرافرة وباريس وبلاط",
        "en": "Kharga, Dakhla, Farafra, Baris & Balat",
        "districts": [
          "مدينة الخارجة",
          "المنيرة الخارجة",
          "بولاق الوادي",
          "جناح",
          "فلسطين",
          "صنعاء",
          "مدينة موط (الداخلة)",
          "القصر الداخلة",
          "الجديدة الداخلة",
          "الموشية",
          "بدخلو",
          "الراشدة",
          "عزب القصر",
          "الهنداو",
          "مدينة الفرافرة",
          "أبو منقار",
          "اللواء صبيح",
          "الكفاح",
          "مدينة باريس",
          "بغداد",
          "مدينة بلاط",
          "تنيدة"
        ]
      }
    ]
  }
];

// ============================================================================
// INITIAL 10 DYNAMIC PARTNER CATEGORIES (EXPANDABLE BY OWNER)
// ============================================================================
export const DEFAULT_PARTNER_CATEGORIES: PartnerCategoryRecord[] = [
  {
    id: 'cat_pharmacy_chains',
    slug: 'pharmacy-chains',
    nameAr: 'سلاسل الصيدليات الكبرى',
    nameEn: 'Pharmacy Chains',
    descriptionAr: 'سلاسل الصيدليات المرخصة ذات الفروع المتعددة وخدمات التوصيل المنزلي في المحافظات المصرية.',
    descriptionEn: 'Licensed multi-branch pharmacy chains providing medication dispensing and delivery across Egypt.',
    icon: '🏥',
    color: '#0d9488',
    displayOrder: 1,
    active: true,
    isPharmacyType: true,
    supportsBranches: true,
    supportsMedicationMapping: true,
    supportsOrdering: true,
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    updatedBy: 'system',
  },
  {
    id: 'cat_independent_pharmacies',
    slug: 'independent-pharmacies',
    nameAr: 'الصيدليات المستقلة والمحلية',
    nameEn: 'Independent Pharmacies',
    descriptionAr: 'صيدليات المجتمع المرخصة التي تخدم الأحياء والمدن والمراكز المحلية بكفاءة صيدلانية مباشرة.',
    descriptionEn: 'Licensed community and neighborhood pharmacies serving local districts and cities.',
    icon: '💊',
    color: '#0284c7',
    displayOrder: 2,
    active: true,
    isPharmacyType: true,
    supportsBranches: true,
    supportsMedicationMapping: true,
    supportsOrdering: true,
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    updatedBy: 'system',
  },
  {
    id: 'cat_online_pharmacy_platforms',
    slug: 'online-pharmacy-platforms',
    nameAr: 'منصات وتطبيقات الصيدليات الرقمية',
    nameEn: 'Online Pharmacy Platforms',
    descriptionAr: 'منصات رقمية مرخصة تربط المرضى بالصيدليات المعتمدة لصرف الروشتات وتوصيل الأدوية.',
    descriptionEn: 'Authorized digital healthcare platforms connecting patients with licensed pharmacies.',
    icon: '📱',
    color: '#4f46e5',
    displayOrder: 3,
    active: true,
    isPharmacyType: true,
    supportsBranches: false,
    supportsMedicationMapping: true,
    supportsOrdering: true,
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    updatedBy: 'system',
  },
  {
    id: 'cat_medical_laboratories',
    slug: 'medical-laboratories',
    nameAr: 'معامل التحاليل الطبية والميكروبيولوجي',
    nameEn: 'Medical Laboratories',
    descriptionAr: 'معامل التحاليل الطبية وإجراء المزارع البكتيرية واختبارات الحساسية للمضادات الحيوية (Culture & Sensitivity).',
    descriptionEn: 'Diagnostic laboratories offering bacterial cultures, antibiograms, and clinical pathology.',
    icon: '🔬',
    color: '#7c3aed',
    displayOrder: 4,
    active: true,
    isPharmacyType: false,
    supportsBranches: true,
    supportsMedicationMapping: false,
    supportsOrdering: true,
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    updatedBy: 'system',
  },
  {
    id: 'cat_radiology_centers',
    slug: 'radiology-centers',
    nameAr: 'مراكز الأشعة التشخيصية',
    nameEn: 'Radiology Centers',
    descriptionAr: 'مراكز الأشعة المقطعية والرنين المغناطيسي والموجات فوق الصوتية المعتمدة.',
    descriptionEn: 'Diagnostic imaging centers offering X-ray, CT, MRI, and ultrasound services.',
    icon: '🩻',
    color: '#0369a1',
    displayOrder: 5,
    active: true,
    isPharmacyType: false,
    supportsBranches: true,
    supportsMedicationMapping: false,
    supportsOrdering: true,
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    updatedBy: 'system',
  },
  {
    id: 'cat_hospitals',
    slug: 'hospitals',
    nameAr: 'المستشفيات والمراكز الطبية المتخصصة',
    nameEn: 'Hospitals',
    descriptionAr: 'المستشفيات الجامعية والخاصة والمراكز المعتمدة للرعاية الحرجة ومكافحة العدوى.',
    descriptionEn: 'Accredited hospitals and tertiary care medical centers.',
    icon: '🏨',
    color: '#dc2626',
    displayOrder: 6,
    active: true,
    isPharmacyType: false,
    supportsBranches: true,
    supportsMedicationMapping: false,
    supportsOrdering: false,
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    updatedBy: 'system',
  },
  {
    id: 'cat_medical_clinics',
    slug: 'medical-clinics',
    nameAr: 'العيادات الطبية التخصصية',
    nameEn: 'Medical Clinics',
    descriptionAr: 'عيادات الأطباء والمراكز التخصصية المعتمدة للكشف السريري ووصف العلاج الدقيق.',
    descriptionEn: 'Outpatient medical clinics and specialist polyclinics.',
    icon: '🩺',
    color: '#15803d',
    displayOrder: 7,
    active: true,
    isPharmacyType: false,
    supportsBranches: true,
    supportsMedicationMapping: false,
    supportsOrdering: true,
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    updatedBy: 'system',
  },
  {
    id: 'cat_medical_delivery',
    slug: 'medical-delivery-companies',
    nameAr: 'شركات التوصيل واللوجستيات الطبية',
    nameEn: 'Medical Delivery Companies',
    descriptionAr: 'خدمات النقل المبرد والآمن للأدوية والعينات الطبية وفق معايير سلاسل التبريد.',
    descriptionEn: 'Cold-chain and compliant healthcare logistics and delivery providers.',
    icon: '🚚',
    color: '#d97706',
    displayOrder: 8,
    active: true,
    isPharmacyType: false,
    supportsBranches: true,
    supportsMedicationMapping: false,
    supportsOrdering: true,
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    updatedBy: 'system',
  },
  {
    id: 'cat_healthcare_organizations',
    slug: 'healthcare-organizations',
    nameAr: 'الهيئات والجمعيات العلمية والصحية',
    nameEn: 'Healthcare Organizations',
    descriptionAr: 'النقابات الطبية والصيدلانية والجمعيات العلمية ومبادرات ترشيد المضادات الحيوية.',
    descriptionEn: 'Medical syndicates, scientific societies, and AMR stewardship organizations.',
    icon: '🏛️',
    color: '#0f766e',
    displayOrder: 9,
    active: true,
    isPharmacyType: false,
    supportsBranches: false,
    supportsMedicationMapping: false,
    supportsOrdering: false,
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    updatedBy: 'system',
  },
  {
    id: 'cat_other',
    slug: 'other-partners',
    nameAr: 'شركاء وخدمات صحية أخرى',
    nameEn: 'Other Healthcare Partners',
    descriptionAr: 'مبادرات الرعاية الصحية والتوعية المجتمعية والخدمات المساندة.',
    descriptionEn: 'Other healthcare initiatives, wellness programs, and supporting services.',
    icon: '🤝',
    color: '#64748b',
    displayOrder: 10,
    active: true,
    isPharmacyType: false,
    supportsBranches: true,
    supportsMedicationMapping: false,
    supportsOrdering: false,
    createdAtIso: '2026-10-01T00:00:00.000Z',
    updatedAtIso: '2026-10-01T00:00:00.000Z',
    updatedBy: 'system',
  },
];

// ============================================================================
// LABELS & UI HELPERS
// ============================================================================
export const PLACEMENT_LOCATION_LABELS: Record<PlacementLocationId, Bi> = {
  homepage_featured: {
    ar: 'الصفحة الرئيسية (قسم الشركاء المعتمدين)',
    en: 'Homepage (Featured Partners Section)',
  },
  partner_directory: {
    ar: 'دليل الشركاء ومقدمي الرعاية الصحية العام',
    en: 'Main Healthcare Partner Directory',
  },
  pharmacy_directory: {
    ar: 'شبكة الصيدليات المعتمدة',
    en: 'Participating Pharmacy Network',
  },
  medication_search_results: {
    ar: 'نتائج البحث عن الأدوية (السجل الدوائي)',
    en: 'Medication Search Results',
  },
  medication_detail_page: {
    ar: 'صفحات تفاصيل الدواء («اعثر على دوائك»)',
    en: 'Medication Detail Pages ("Find This Medication")',
  },
  medication_purchase_suggestions: {
    ar: 'اقتراحات منافذ الصرف والبدائل (حاسبة التوفير)',
    en: 'Medication Dispensing & Cost Saver Suggestions',
  },
  nearby_pharmacy_results: {
    ar: 'نتائج البحث الجغرافي عن أقرب صيدلية / فرع',
    en: 'Nearby Pharmacy & Branch Discovery Results',
  },
  dedicated_partner_page: {
    ar: 'صفحة الملف التعريفي المستقلة للشريك',
    en: 'Dedicated Public Partner Profile Page',
  },
  healthcare_service_pages: {
    ar: 'صفحات الخدمات والأدوات الصحية ذات الصلة',
    en: 'Relevant Healthcare Service & Clinical Pages',
  },
};

export const PARTNERSHIP_STATUS_LABELS: Record<PartnershipStatus, Bi & { color: string; bg: string }> = {
  draft: { ar: 'مسودة (Draft)', en: 'Draft', color: '#475569', bg: '#f1f5f9' },
  pending: { ar: 'قيد المراجعة (Pending)', en: 'Pending Approval', color: '#b45309', bg: '#fef3c7' },
  active: { ar: 'شريك نشط (Active)', en: 'Active Partner', color: '#166534', bg: '#dcfce7' },
  inactive: { ar: 'غير نشط (Inactive)', en: 'Inactive', color: '#64748b', bg: '#e2e8f0' },
  suspended: { ar: 'موقوف مؤقتاً (Suspended)', en: 'Suspended', color: '#991b1b', bg: '#fee2e2' },
  expired: { ar: 'منتهي الصلاحية (Expired)', en: 'Expired', color: '#9a3412', bg: '#ffedd5' },
  archived: { ar: 'مؤرشف (Archived)', en: 'Archived', color: '#334155', bg: '#cbd5e1' },
};

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, Bi & { color: string; bg: string }> = {
  unverified: { ar: 'غير موثق بعد', en: 'Unverified', color: '#64748b', bg: '#f1f5f9' },
  pending_verification: { ar: 'قيد التحقق من التراخيص', en: 'Pending Verification', color: '#b45309', bg: '#fef3c7' },
  verified: { ar:'جهة مرخصة وموثقة', en:'Verified Organization', color:'#0369a1', bg:'#e0f2fe'},
  revoked: { ar: 'تم إلغاء التوثيق', en: 'Verification Revoked', color: '#991b1b', bg: '#fee2e2' },
};

export const PUBLICATION_STATUS_LABELS: Record<PublicationStatus, Bi & { color: string; bg: string }> = {
  draft: { ar: 'مسودة غير منشورة (Draft)', en: 'Unpublished Draft', color: '#475569', bg: '#f1f5f9' },
  scheduled: { ar: 'مجدول للنشر (Scheduled)', en: 'Scheduled Publication', color: '#6d28d9', bg: '#ede9fe' },
  published: { ar: 'منشور للجمهور (Published)', en: 'Published Live', color: '#15803d', bg: '#dcfce7' },
  hidden: { ar: 'مخفي من الموقع العام (Hidden)', en: 'Hidden from Public', color: '#b45309', bg: '#fef3c7' },
  archived: { ar: 'مؤرشف (Archived)', en: 'Archived', color: '#334155', bg: '#e2e8f0' },
};

export const INTEGRATION_METHOD_LABELS: Record<IntegrationMethodType, Bi> = {
  external_website_link: { ar: 'رابط الموقع الرسمي الخارجي فقط', en: 'External Official Website Link' },
  external_ordering_link: { ar: 'رابط طلب خارجي مباشر ومعتمد', en: 'Authorized External Ordering Link' },
  manual_partner_info: { ar: 'إدارة يدوية لبيانات الشريك والفروع', en: 'Manual Partner & Branch Information' },
  manual_availability: { ar: 'إدارة يدوية لحالة التوفر والأسعار الموثقة', en: 'Manually Managed Verified Availability' },
  authorized_api: { ar: 'ربط برمجي معتمد (Authorized REST API)', en: 'Authorized API Integration' },
  authorized_webhook: { ar: 'ربط إشعارات فوري (Authorized Webhook)', en: 'Authorized Webhook Integration' },
  custom_adapter: { ar: 'محول برمجي مخصص (Custom Provider Adapter)', en: 'Custom Provider Integration Adapter' },
};

// ============================================================================
// SAFE DEFAULT FACTORY FOR NEW PARTNERS
// Requirement: "Never automatically make a newly created partner public.
// Default new partners to DRAFT and hidden until I explicitly approve and publish them."
// ============================================================================
export function createDefaultVisibilitySettings(partnerId: string, uid = 'owner'): PartnerVisibilitySettings {
  const now = new Date().toISOString();
  return {
    partnerId,
    showOnWebsite: false,
    publishPartnerProfile: false,
    showInPartnerDirectory: false,
    showOnHomepage: false,
    showInMedicationSearch: false,
    showInMedicationDetails: false,
    showInNearbyPharmacies: false,
    showInRelevantServiceSections: false,
    allowedPlacements: [],
    geographicScope: 'all_egypt',
    allowedGovernorates: [],
    allowedCities: [],
    allowedDistricts: [],
    selectedBranchIdsOnly: [],
    displayOrder: 100,
    priorityLevel: 'normal',
    featuredPlacement: false,
    recommendedStatus: false,
    homepagePriority: 100,
    searchResultPriority: 100,
    isSponsoredPlacement: false,
    scheduledPublishAtIso: null,
    scheduledDeactivateAtIso: null,
    temporarilySuspended: false,
    suspensionReason: '',
    campaignStartDateIso: null,
    campaignEndDateIso: null,
    campaignBannerAr: '',
    campaignBannerEn: '',
    updatedAtIso: now,
    updatedBy: uid,
  };
}

export function createDefaultDisplayCustomization(): PartnerDisplayCustomization {
  return {
    cardDesign: 'standard_medical',
    showLogo: true,
    showCoverImage: false,
    showDescription: true,
    showContactInfo: true,
    showPhoneButton: true,
    showWhatsappButton: false,
    showBranchInfo: true,
    showWorkingHours: true,
    showDeliveryIndicator: true,
    showExternalOrderingButton: true,
    showWebsiteButton: true,
    showSpecialOffers: false,
    showFeaturedBadge: false,
    showVerificationBadge: false,
    customCtaTextAr: 'اطلب أو استفسر الآن',
    customCtaTextEn: 'Order or Inquire Now',
    customTaglineAr: '',
    customTaglineEn: '',
    specialOfferTitleAr: '',
    specialOfferTitleEn: '',
    specialOfferCode: '',
  };
}

export function createEmptyPartnerRecord(uid = 'owner'): PartnerFullAdminRecord {
  const now = new Date().toISOString();
  const id = `partner_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    name: '',
    nameAr: '',
    nameEn: '',
    logoUrl: '',
    coverImageUrl: '',
    descriptionAr: '',
    descriptionEn: '',
    categoryId: 'cat_pharmacy_chains',
    partnerType: 'pharmacy_chain',
    phone: '',
    hotline: '',
    publicEmail: '',
    websiteUrl: '',
    externalOrderingUrl: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      whatsapp: '',
      linkedin: '',
      hotline: '',
    },
    servicesOfferedAr: ['صرف الروشتات الطبية', 'استشارة صيدلانية', 'توصيل للمنازل'],
    servicesOfferedEn: ['Prescription Dispensing', 'Pharmacist Consultation', 'Home Delivery'],
    supportedGovernorates: ['cairo', 'giza'],
    supportedCities: [],
    supportedDistricts: [],
    deliveryAvailable: true,
    deliveryCoverageAr: 'متاح التوصيل في نطاق الفروع والمحافظات المدعومة',
    deliveryCoverageEn: 'Delivery available within supported governorates and branch areas',
    workingHoursAr: 'يومياً من 9:00 صباحاً حتى 11:00 مساءً',
    workingHoursEn: 'Daily 9:00 AM – 11:00 PM',
    is24Hours: false,
    supportsOnlineOrdering: false,
    requiresPrescriptionForAntibiotics: true,
    // Strictly defaults to DRAFT & HIDDEN & UNVERIFIED
    partnershipStatus: 'draft',
    verificationStatus: 'unverified',
    publicationStatus: 'draft',
    visibilityStatus: 'hidden',
    apiIntegrationStatus: 'none',
    integrationMethod: 'manual_partner_info',
    availabilitySyncEnabled: false,
    priceSyncEnabled: false,
    orderSyncEnabled: false,
    lastSuccessfulSyncIso: null,
    syncSourceLabelAr: 'إدارة يدوية عبر لوحة التحكم (التوفر يتطلب تأكيد الصيدلية)',
    syncSourceLabelEn: 'Manually managed via Admin Center (Availability requires confirmation)',
    visibility: createDefaultVisibilitySettings(id, uid),
    display: createDefaultDisplayCustomization(),
    createdAtIso: now,
    updatedAtIso: now,
    privateAdmin: {
      partnerId: id,
      contactPersonName: '',
      contactPersonRole: '',
      administrativePhone: '',
      administrativeEmail: '',
      partnershipStartDateIso: now.slice(0, 10),
      partnershipExpirationDateIso: null,
      contractReference: '',
      internalNotes: '',
      integrationNotes: '',
      providerAdapterId: 'manual_default',
      webhookEndpointUrl: '',
      serverCredentialVaultRef: '',
      createdBy: uid,
      updatedBy: uid,
      updatedAtIso: now,
    },
  };
}

// ============================================================================
// PHASE 2–7 ENTERPRISE ECOSYSTEM DATA MODELS (PHARMACY NETWORK, INVENTORY, ORDERS, FRANCHISE & GEOGRAPHY)
// ============================================================================

export type PharmacyApplicationStatus =
  | 'draft'
  | 'pending_review'
  | 'under_verification'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'archived';

export const PHARMACY_APPLICATION_STATUS_LABELS: Record<
  PharmacyApplicationStatus,
  { ar: string; en: string; color: string; bg: string }
> = {
  draft: { ar: 'مسودة', en: 'Draft', color: '#475569', bg: '#f1f5f9' },
  pending_review: { ar: 'قيد المراجعة الأولية', en: 'Pending Review', color: '#b45309', bg: '#fef3c7' },
  under_verification: { ar: 'جاري فحص التراخيص والوثائق', en: 'Under Verification', color: '#0369a1', bg: '#e0f2fe' },
  approved: { ar: 'معتمدة ومفعلة بالشبكة', en: 'Approved & Active', color: '#15803d', bg: '#dcfce7' },
  rejected: { ar: 'مرفوضة', en: 'Rejected', color: '#b91c1c', bg: '#fee2e2' },
  suspended: { ar: 'موقوفة مؤقتاً', en: 'Suspended', color: '#9a3412', bg: '#ffedd5' },
  archived: { ar: 'مؤرشفة', en: 'Archived', color: '#64748b', bg: '#e2e8f0' },
};

export interface PharmacyVerificationHistoryEntry {
  timestampIso: string;
  actorUid: string;
  actorRole: string;
  fromStatus: PharmacyApplicationStatus;
  toStatus: PharmacyApplicationStatus;
  decisionReasonAr: string;
  decisionReasonEn?: string;
}

export interface PharmacyRegistrationApplication {
  id: string;
  applicantUid: string;
  applicantEmail: string;
  pharmacyNameAr: string;
  pharmacyNameEn: string;
  licenseNumber: string;
  commercialRegNumber: string;
  taxCardNumber?: string;
  ownerFullName: string;
  ownerSyndicateNumber: string;
  ownerNationalIdLast4: string;
  phone: string;
  whatsapp: string;
  governorateId: string;
  cityCenter: string;
  districtVillage: string;
  detailedAddressAr: string;
  latitude: number | null;
  longitude: number | null;
  workingHoursAr: string;
  is24Hours: boolean;
  deliveryAvailable: boolean;
  deliveryRadiusKm: number;
  logoUrl?: string;
  licenseDocumentUrl: string;
  syndicateCardUrl?: string;
  requestedModel: 'independent_partner' | 'dawaya_franchise';
  status: PharmacyApplicationStatus;
  adminDecisionReasonAr?: string;
  requestedInfoNoteAr?: string;
  approvedPharmacyId?: string;
  verificationHistory: PharmacyVerificationHistoryEntry[];
  createdAtIso: string;
  updatedAtIso: string;
}

export type PharmacyStockStatus =
  | 'available'
  | 'low_stock'
  | 'out_of_stock'
  | 'unconfirmed';

export const PHARMACY_STOCK_STATUS_LABELS: Record<
  PharmacyStockStatus,
  { ar: string; en: string; color: string; bg: string }
> = {
  available: { ar: 'متوفر بالصيدلية', en: 'Available in Stock', color: '#15803d', bg: '#dcfce7' },
  low_stock: { ar: 'كمية محدودة (أوشك على النفاد)', en: 'Low Stock', color: '#b45309', bg: '#fef3c7' },
  out_of_stock: { ar: 'غير متوفر حالياً', en: 'Out of Stock', color: '#b91c1c', bg: '#fee2e2' },
  unconfirmed: { ar: 'التوفر غير مؤكد (يتطلب استفسار)', en: 'Availability Unconfirmed', color: '#475569', bg: '#f1f5f9' },
};

export interface PharmacyInventoryItem {
  id: string;
  pharmacyId: string;
  pharmacyNameAr: string;
  governorateId: string;
  cityCenter: string;
  medicationId: string;
  tradeNameAr: string;
  tradeNameEn: string;
  activeIngredient: string;
  strength: string;
  dosageForm: string;
  quantityPacks: number | null; // null in public projection so quantities are never fabricated
  lowStockThreshold: number;
  stockStatus: PharmacyStockStatus;
  pharmacyPriceEgp: number;
  batchNumber: string;
  expiryDateYYYYMMDD: string;
  requiresPrescription: boolean;
  lastUpdatedAtIso: string;
  updatedByUid: string;
}

export interface PharmacyAuthorizedEmployee {
  id: string;
  pharmacyId: string;
  uid?: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'pharmacy_manager' | 'pharmacist' | 'employee';
  syndicateNumber?: string;
  canManageInventory: boolean;
  canConfirmOrders: boolean;
  canViewReports: boolean;
  active: boolean;
  addedAtIso: string;
}

export type CustomerOrderLifecycleStatus =
  | 'new_order'
  | 'pharmacy_confirmation'
  | 'preparing'
  | 'ready_for_delivery'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'rejected';

export const CUSTOMER_ORDER_STATUS_LABELS: Record<
  CustomerOrderLifecycleStatus,
  { ar: string; en: string; color: string; bg: string }
> = {
  new_order: { ar: 'طلب جديد (بانتظار قبول الصيدلية)', en: 'New Order (Awaiting Pharmacy Acceptance)', color: '#0369a1', bg: '#e0f2fe' },
  pharmacy_confirmation: { ar: 'تم قبول وتأكيد الطلب من الصيدلية', en: 'Confirmed by Pharmacy', color: '#0d9488', bg: '#ccfbf1' },
  preparing: { ar: 'جاري تحضير ومراجعة الدواء صيدلانياً', en: 'Preparing Medication', color: '#b45309', bg: '#fef3c7' },
  ready_for_delivery: { ar: 'جاهز للتوصيل / الاستلام', en: 'Ready for Delivery / Pickup', color: '#4f46e5', bg: '#e0e7ff' },
  out_for_delivery: { ar: 'مع مندوب التوصيل في الطريق إليك', en: 'Out for Delivery', color: '#7c3aed', bg: '#ede9fe' },
  delivered: { ar: 'تم التسليم بنجاح', en: 'Delivered', color: '#15803d', bg: '#dcfce7' },
  cancelled: { ar: 'ملغى من العميل', en: 'Cancelled', color: '#64748b', bg: '#f1f5f9' },
  rejected: { ar: 'معتذر عنه / مرفوض من الصيدلية', en: 'Rejected by Pharmacy', color: '#b91c1c', bg: '#fee2e2' },
};

export interface CustomerDeliveryAddress {
  id: string;
  labelAr: string; // e.g., 'المنزل', 'العمل'
  governorateId: string;
  cityCenter: string;
  districtVillage: string;
  streetAndBuilding: string;
  landmark?: string;
  phone: string;
  isDefault: boolean;
}

export interface FranchiseContractRecord {
  id: string;
  pharmacyId: string;
  pharmacyNameAr: string;
  ownerName: string;
  governorateId: string;
  cityCenter: string;
  contractNumber: string;
  legalLicenseVerified: boolean;
  syndicateApprovalRef: string;
  initialFranchiseFeeEgp: number;
  subscriptionCycle: 'monthly' | 'annual';
  subscriptionFeeEgp: number;
  royaltyPercentage: number; // Configurable %
  marketingContributionPct: number; // Configurable %
  startDateYYYYMMDD: string;
  endDateYYYYMMDD: string;
  renewalStatus: 'active' | 'pending_renewal' | 'expired' | 'terminated';
  totalReportedSalesEgp: number;
  totalPaidFeesEgp: number;
  outstandingBalanceEgp: number;
  overdueStatus: 'current' | 'due_soon' | 'overdue';
  updatedAtIso: string;
}
