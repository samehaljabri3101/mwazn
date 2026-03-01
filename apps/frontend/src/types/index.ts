export type Role = 'BUYER_ADMIN' | 'SUPPLIER_ADMIN' | 'PLATFORM_ADMIN';
export type CompanyType = 'BUYER' | 'SUPPLIER';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type SubscriptionPlan = 'FREE' | 'PRO';
export type ListingStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type RFQStatus = 'OPEN' | 'CLOSED' | 'AWARDED' | 'CANCELLED';
export type QuoteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
export type DealStatus = 'AWARDED' | 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
export type StockAvailability = 'IN_STOCK' | 'OUT_OF_STOCK' | 'LIMITED';
export type MessageType = 'GENERAL' | 'CLARIFICATION' | 'NEGOTIATION' | 'TECHNICAL' | 'COMMERCIAL';
export type MessagePriority = 'NORMAL' | 'URGENT';
export type RFQVisibility = 'PUBLIC' | 'INVITE_ONLY';
export type RFQProjectType = 'PRODUCT' | 'SERVICE' | 'MANUFACTURING' | 'CONSULTANCY';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: Role;
  isActive: boolean;
  companyId: string;
  createdAt: string;
}

export interface Company {
  id: string;
  nameAr: string;
  nameEn: string;
  crNumber: string;
  type: CompanyType;
  verificationStatus: VerificationStatus;
  plan: SubscriptionPlan;
  planExpiresAt?: string;
  city?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  quotesUsedThisMonth: number;
  isActive: boolean;
  // Legal & compliance
  vatNumber?: string;
  crExpiryDate?: string;
  legalForm?: string;
  establishmentYear?: number;
  companySizeRange?: string;
  sectors?: string[];
  contactJobTitle?: string;
  // Supplier extras
  keyClients?: string[];
  regionsServed?: string[];
  paymentTermsAccepted?: string[];
  productionCapacity?: string;
  isoUrl?: string;
  chamberCertUrl?: string;
  taxCertUrl?: string;
  // Admin
  adminNotes?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  iconUrl?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  _count?: { listings: number };
}

export interface ListingImage {
  id: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
}

export interface SpecEntry { key: string; value: string; }

export interface Listing {
  id: string;
  slug?: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  sku?: string;
  price?: number;
  priceTo?: number;
  currency: string;
  unit?: string;
  minOrderQty?: number;
  leadTimeDays?: number;
  tags?: string[];
  certifications?: string[];
  specsJson?: SpecEntry[];
  requestQuoteOnly?: boolean;
  vatPercent?: number;
  stockAvailability?: StockAvailability;
  status: ListingStatus;
  viewCount?: number;
  supplierId: string;
  categoryId: string;
  images: ListingImage[];
  category?: Category;
  supplier?: Pick<Company, 'id' | 'nameAr' | 'nameEn' | 'logoUrl' | 'city' | 'verificationStatus' | 'plan'> & {
    slug?: string;
    phone?: string;
    website?: string;
    descriptionEn?: string;
    descriptionAr?: string;
    _count?: { ratingsReceived: number; listings: number };
  };
  _count?: { quotes: number };
  createdAt: string;
}

export interface RfqImage {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  sortOrder: number;
  rfqId: string;
  createdAt: string;
}

export interface RFQ {
  id: string;
  title: string;
  description: string;
  projectType?: RFQProjectType;
  quantity?: number;
  unit?: string;
  budget?: number;
  budgetMin?: number;
  budgetMax?: number;
  budgetUndisclosed?: boolean;
  currency: string;
  vatIncluded?: boolean;
  deadline?: string;
  expectedStartDate?: string;
  locationRequirement?: string;
  siteVisitRequired?: boolean;
  ndaRequired?: boolean;
  requiredCertifications?: string[];
  visibility?: RFQVisibility;
  allowPartialBids?: boolean;
  status: RFQStatus;
  buyerId: string;
  categoryId: string;
  category?: Category;
  buyer?: Pick<Company, 'id' | 'nameAr' | 'nameEn'>;
  images?: RfqImage[];
  _count?: { quotes: number };
  createdAt: string;
}

export interface QuoteLineItem {
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
}

export interface Quote {
  id: string;
  price: number;
  currency: string;
  deliveryDays?: number;
  notes?: string;
  status: QuoteStatus;
  validUntil?: string;
  vatPercent?: number;
  paymentTerms?: string;
  warrantyMonths?: number;
  afterSalesSupport?: string;
  technicalProposal?: string;
  lineItems?: QuoteLineItem[];
  rfqId: string;
  supplierId: string;
  supplier?: Pick<Company, 'id' | 'nameAr' | 'nameEn' | 'logoUrl' | 'city' | 'plan'>;
  rfq?: RFQ;
  createdAt: string;
}

export interface Deal {
  id: string;
  status: DealStatus;
  totalAmount: number;
  currency: string;
  notes?: string;
  quoteId: string;
  buyerId: string;
  supplierId: string;
  quote?: Quote & { rfq?: RFQ };
  buyer?: Pick<Company, 'id' | 'nameAr' | 'nameEn'>;
  supplier?: Pick<Company, 'id' | 'nameAr' | 'nameEn'>;
  rating?: Rating | null;
  ratings?: Rating[];
  createdAt: string;
}

export interface Rating {
  id: string;
  score: number;
  comment?: string;
  dealId: string;
  ratedId: string;
  raterId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  body: string;
  isRead: boolean;
  messageType?: MessageType;
  priority?: MessagePriority;
  conversationId: string;
  senderId: string;
  sender?: Pick<User, 'id' | 'fullName' | 'avatarUrl'> & { companyId: string };
  createdAt: string;
}

export interface Conversation {
  id: string;
  subject?: string;
  rfqId?: string;
  participants: Pick<Company, 'id' | 'nameAr' | 'nameEn' | 'logoUrl'>[];
  messages?: Message[];
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface AuthState {
  user: User | null;
  company: Company | null;
  accessToken: string | null;
  isLoading: boolean;
}
