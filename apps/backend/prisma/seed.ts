/**
 * Mwazn — Production Seed Script
 * Milestone 7: Rich Saudi AR/EN dummy data, investor-demo-ready
 */

import { PrismaClient, CompanyType, Role, VerificationStatus, SubscriptionPlan, RFQStatus, QuoteStatus, DealStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────────────
const hash = (pw: string) => bcrypt.hashSync(pw, 10);
const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randPrice = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

// ── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { nameAr: 'مواد البناء', nameEn: 'Building Materials', slug: 'building-materials' },
  { nameAr: 'الأثاث والديكور', nameEn: 'Furniture & Decor', slug: 'furniture-decor' },
  { nameAr: 'المعدات الصناعية', nameEn: 'Industrial Equipment', slug: 'industrial-equipment' },
  { nameAr: 'التقنية والإلكترونيات', nameEn: 'Technology & Electronics', slug: 'technology-electronics' },
  { nameAr: 'الغذاء والمشروبات', nameEn: 'Food & Beverages', slug: 'food-beverages' },
  { nameAr: 'الخدمات اللوجستية', nameEn: 'Logistics & Transport', slug: 'logistics-transport' },
  { nameAr: 'الكيماويات والمواد الخام', nameEn: 'Chemicals & Raw Materials', slug: 'chemicals-raw-materials' },
  { nameAr: 'الأجهزة الطبية', nameEn: 'Medical Devices', slug: 'medical-devices' },
  { nameAr: 'الطاقة والبترول', nameEn: 'Energy & Petroleum', slug: 'energy-petroleum' },
  { nameAr: 'الملابس والنسيج', nameEn: 'Clothing & Textiles', slug: 'clothing-textiles' },
  { nameAr: 'السلامة والأمن', nameEn: 'Safety & Security', slug: 'safety-security' },
  { nameAr: 'الزراعة والأغذية', nameEn: 'Agriculture & Food', slug: 'agriculture-food' },
  { nameAr: 'خدمات تقنية المعلومات', nameEn: 'IT Services', slug: 'it-services' },
  { nameAr: 'المعدات الكهربائية', nameEn: 'Electrical Equipment', slug: 'electrical-equipment' },
  { nameAr: 'معدات التبريد والتكييف', nameEn: 'HVAC Equipment', slug: 'hvac-equipment' },
  { nameAr: 'المركبات والسيارات', nameEn: 'Vehicles & Automotive', slug: 'vehicles-automotive' },
  { nameAr: 'الورق والطباعة', nameEn: 'Paper & Printing', slug: 'paper-printing' },
  { nameAr: 'معدات المطاعم', nameEn: 'Restaurant Equipment', slug: 'restaurant-equipment' },
  { nameAr: 'الأدوات والعدد', nameEn: 'Tools & Hardware', slug: 'tools-hardware' },
  { nameAr: 'المنظفات ومستلزمات التنظيف', nameEn: 'Cleaning Supplies', slug: 'cleaning-supplies' },
  { nameAr: 'الإنشاءات والمقاولات', nameEn: 'Construction & Contracting', slug: 'construction-contracting' },
  { nameAr: 'معدات المختبرات', nameEn: 'Laboratory Equipment', slug: 'laboratory-equipment' },
  { nameAr: 'التغليف والتعبئة', nameEn: 'Packaging & Wrapping', slug: 'packaging-wrapping' },
  { nameAr: 'المعدات المكتبية', nameEn: 'Office Equipment', slug: 'office-equipment' },
  { nameAr: 'خدمات الاستشارات', nameEn: 'Consulting Services', slug: 'consulting-services' },
];

// ── Supplier Companies ────────────────────────────────────────────────────────
const SUPPLIERS = [
  { nameAr: 'شركة الإنشاءات السعودية', nameEn: 'Saudi Construction Co.', city: 'Riyadh', plan: SubscriptionPlan.PRO, status: VerificationStatus.VERIFIED },
  { nameAr: 'مجموعة التقنيات المتقدمة', nameEn: 'Advanced Tech Group', city: 'Jeddah', plan: SubscriptionPlan.PRO, status: VerificationStatus.VERIFIED },
  { nameAr: 'شركة النخبة للمعدات', nameEn: 'Elite Equipment Co.', city: 'Dammam', plan: SubscriptionPlan.FREE, status: VerificationStatus.VERIFIED },
  { nameAr: 'مؤسسة الخليج الصناعية', nameEn: 'Gulf Industrial Est.', city: 'Riyadh', plan: SubscriptionPlan.PRO, status: VerificationStatus.VERIFIED },
  { nameAr: 'شركة الأثاث الملكي', nameEn: 'Royal Furniture Co.', city: 'Jeddah', plan: SubscriptionPlan.FREE, status: VerificationStatus.VERIFIED },
  { nameAr: 'شركة المواد الغذائية المتحدة', nameEn: 'United Food Materials', city: 'Riyadh', plan: SubscriptionPlan.PRO, status: VerificationStatus.VERIFIED },
  { nameAr: 'مجموعة اللوجستيات السعودية', nameEn: 'Saudi Logistics Group', city: 'Jeddah', plan: SubscriptionPlan.FREE, status: VerificationStatus.VERIFIED },
  { nameAr: 'شركة الكيماويات العربية', nameEn: 'Arabian Chemicals Co.', city: 'Jubail', plan: SubscriptionPlan.PRO, status: VerificationStatus.VERIFIED },
  { nameAr: 'مستشفيات ومعدات طبية', nameEn: 'MedEquip Arabia', city: 'Riyadh', plan: SubscriptionPlan.FREE, status: VerificationStatus.VERIFIED },
  { nameAr: 'شركة الطاقة والنفط', nameEn: 'EnergyOil Solutions', city: 'Dhahran', plan: SubscriptionPlan.PRO, status: VerificationStatus.VERIFIED },
  { nameAr: 'دار الأزياء السعودية', nameEn: 'Saudi Fashion House', city: 'Jeddah', plan: SubscriptionPlan.FREE, status: VerificationStatus.VERIFIED },
  { nameAr: 'شركة الأمن والسلامة المتكاملة', nameEn: 'Integrated Safety Systems', city: 'Riyadh', plan: SubscriptionPlan.PRO, status: VerificationStatus.VERIFIED },
  { nameAr: 'مزارع الخير الزراعية', nameEn: 'Al-Khair Farms', city: 'Al-Ahsa', plan: SubscriptionPlan.FREE, status: VerificationStatus.VERIFIED },
  { nameAr: 'حلول تقنية المعلومات', nameEn: 'IT Solutions Arabia', city: 'Riyadh', plan: SubscriptionPlan.PRO, status: VerificationStatus.VERIFIED },
  { nameAr: 'شركة الكهرباء والأنظمة', nameEn: 'Elec & Systems Co.', city: 'Dammam', plan: SubscriptionPlan.FREE, status: VerificationStatus.VERIFIED },
  { nameAr: 'شركة تكييف الخليج', nameEn: 'Gulf HVAC Solutions', city: 'Jeddah', plan: SubscriptionPlan.PRO, status: VerificationStatus.VERIFIED },
  { nameAr: 'مؤسسة السيارات الحديثة', nameEn: 'Modern Auto Est.', city: 'Riyadh', plan: SubscriptionPlan.FREE, status: VerificationStatus.VERIFIED },
  { nameAr: 'شركة الطباعة والنشر', nameEn: 'Print & Publish Arabia', city: 'Jeddah', plan: SubscriptionPlan.PRO, status: VerificationStatus.VERIFIED },
  { nameAr: 'معدات المطاعم المتميزة', nameEn: 'Premier Restaurant Equip.', city: 'Riyadh', plan: SubscriptionPlan.FREE, status: VerificationStatus.VERIFIED },
  { nameAr: 'شركة الأدوات الصناعية', nameEn: 'Industrial Tools Co.', city: 'Jubail', plan: SubscriptionPlan.PRO, status: VerificationStatus.VERIFIED },
  { nameAr: 'شركة النظافة والبيئة', nameEn: 'Clean & Green Arabia', city: 'Riyadh', plan: SubscriptionPlan.FREE, status: VerificationStatus.VERIFIED },
  { nameAr: 'مقاولات الوطن', nameEn: 'Al-Watan Contractors', city: 'Mecca', plan: SubscriptionPlan.PRO, status: VerificationStatus.VERIFIED },
  { nameAr: 'معامل ومختبرات متطورة', nameEn: 'Advanced Labs Est.', city: 'Riyadh', plan: SubscriptionPlan.FREE, status: VerificationStatus.VERIFIED },
  { nameAr: 'شركة التغليف الذكي', nameEn: 'Smart Pack Arabia', city: 'Dammam', plan: SubscriptionPlan.PRO, status: VerificationStatus.VERIFIED },
  // Pending verification (unverified supplier demo)
  { nameAr: 'شركة المورّد الجديد', nameEn: 'New Supplier Co.', city: 'Medina', plan: SubscriptionPlan.FREE, status: VerificationStatus.PENDING },
];

// ── Buyer Companies ───────────────────────────────────────────────────────────
const BUYERS = [
  { nameAr: 'شركة الاتحاد للتطوير', nameEn: 'Union Development Co.' },
  { nameAr: 'مجموعة الرياض التجارية', nameEn: 'Riyadh Commercial Group' },
  { nameAr: 'شركة أرامكو للخدمات', nameEn: 'Aramco Services Co.' },
  { nameAr: 'مجموعة العثيم للتجزئة', nameEn: 'Othaim Retail Group' },
  { nameAr: 'شركة التشييد العمراني', nameEn: 'Urban Construction Co.' },
  { nameAr: 'مستشفيات المملكة', nameEn: 'Kingdom Hospitals' },
  { nameAr: 'شركة الفنادق الذهبية', nameEn: 'Golden Hotels Corp.' },
  { nameAr: 'مجموعة الاتصالات السعودية', nameEn: 'Saudi Telecom Group' },
  { nameAr: 'شركة الأغذية الوطنية', nameEn: 'National Food Co.' },
  { nameAr: 'شركة بن لادن للمقاولات', nameEn: 'Binladin Contracting' },
  { nameAr: 'شركة الجزيرة للإنشاء', nameEn: 'Al-Jazira Construction' },
  { nameAr: 'مجموعة الوطنية للنقل', nameEn: 'National Transport Group' },
  { nameAr: 'شركة المصافي العربية', nameEn: 'Arabian Refining Co.' },
  { nameAr: 'جامعة الملك عبدالعزيز', nameEn: 'King Abdulaziz University' },
  { nameAr: 'شركة التأمين الأهلية', nameEn: 'Ahlia Insurance Co.' },
];

const SAUDI_CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar', 'Jubail', 'Abha'];

const RFQ_TITLES = [
  'طلب توريد مواد بناء لمشروع سكني',
  'Request for Office Furniture Supply',
  'توريد معدات صناعية للمصنع',
  'Laptops and Computing Equipment RFQ',
  'طلب توريد مواد غذائية لفندق',
  'Logistics Services for Monthly Deliveries',
  'توريد مواد كيماوية للمختبر',
  'Medical Devices for Clinic Setup',
  'طلب خدمات تكنولوجيا المعلومات',
  'HVAC System Installation and Supply',
  'توريد ملابس عمل للموظفين',
  'Security System Installation',
  'طلب توريد منتجات تنظيف',
  'Restaurant Kitchen Equipment',
  'توريد أثاث مكتبي للشركة',
  'Building Materials for Warehouse',
  'طلب توريد معدات كهربائية',
  'Vehicle Fleet Procurement',
  'توريد مواد تغليف للمنتجات',
  'Office Supplies and Stationery',
  'طلب خدمات الاستشارات المالية',
  'Laboratory Equipment Supply',
  'توريد معدات السلامة للمنشأة',
  'Agricultural Products Supply',
  'طلب توريد خوادم ومعدات شبكات',
  'Cleaning Services Contract',
  'توريد أجهزة طبية متطورة',
  'Construction Materials for Bridge Project',
  'طلب توريد مولدات كهربائية',
  'Food Processing Equipment Supply',
];

const QUOTE_NOTES = [
  'يشمل العرض التوصيل والتركيب',
  'Price includes delivery to site',
  'الضمان لمدة سنتين على جميع المنتجات',
  'All items are ISO certified',
  'يمكن تعديل الكمية حسب الطلب',
  'Flexible payment terms available',
  'التسليم خلال 7 أيام عمل',
  'Express delivery available',
  'منتجات أصلية بشهادات جودة',
  'Competitive pricing with volume discounts',
];

const DEAL_NOTES = [
  'تم الاتفاق على شروط التسليم',
  'Payment terms: 50% upfront, 50% on delivery',
  'الفاتورة الضريبية ستُرسل عبر البريد',
  'Regular progress updates will be shared',
];

const RATING_COMMENTS = [
  'خدمة ممتازة وتسليم في الوقت المحدد',
  'Great quality products, highly recommended',
  'موردون محترفون وسريعو الاستجابة',
  'Products met all specifications',
  'جودة عالية وسعر مناسب',
  'Excellent communication throughout the process',
  'ستتعامل معهم مرة أخرى بالتأكيد',
  'Delivered on time and within budget',
  'جيد بشكل عام لكن التواصل كان بطيئاً',
  'Good supplier, minor delays but resolved quickly',
];

const MSG_BODIES = [
  'مرحباً، هل يمكنكم توضيح مواصفات المنتج؟',
  'Hello, can you provide more details about delivery timelines?',
  'شكراً على عرضكم، لدينا بعض الاستفسارات',
  'Thank you for your quick response.',
  'هل يمكنكم تخفيض السعر قليلاً؟',
  'Can you offer a discount for bulk orders?',
  'تم استلام البضاعة بحالة ممتازة',
  'We are very satisfied with the quality.',
  'نحتاج إلى نسخة إضافية من الفاتورة',
  'Please send the invoice to our accounts team.',
];

// ── Main Seed ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting Mwazn seed...');

  // Clean up (order matters for FK constraints)
  await prisma.auditLog.deleteMany();
  await prisma.fileUpload.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.rFQ.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  await prisma.category.deleteMany();

  // ── 1. Categories ─────────────────────────────────────────────────────────
  console.log('  Creating categories...');
  const categories = await Promise.all(
    CATEGORIES.map((cat, i) =>
      prisma.category.create({ data: { ...cat, sortOrder: i, isActive: true } }),
    ),
  );
  console.log(`  ✓ ${categories.length} categories`);

  // ── 2. Platform Admin ─────────────────────────────────────────────────────
  console.log('  Creating platform admin...');
  const adminCompany = await prisma.company.create({
    data: {
      nameAr: 'موازن - الإدارة',
      nameEn: 'Mwazn Platform',
      crNumber: '0000000001',
      type: CompanyType.BUYER,
      verificationStatus: VerificationStatus.VERIFIED,
      plan: SubscriptionPlan.PRO,
      city: 'Riyadh',
      users: {
        create: {
          email: 'admin@mwazn.sa',
          passwordHash: hash('Admin@1234'),
          fullName: 'Platform Admin',
          role: Role.PLATFORM_ADMIN,
        },
      },
    },
    include: { users: true },
  });
  console.log('  ✓ Admin: admin@mwazn.sa / Admin@1234');

  // ── 3. Supplier Companies ─────────────────────────────────────────────────
  console.log('  Creating supplier companies...');
  const supplierCompanies: any[] = [];
  for (let i = 0; i < SUPPLIERS.length; i++) {
    const s = SUPPLIERS[i];
    const cr = String(1000000010 + i).padStart(10, '0');
    const email = `admin@supplier${i + 1}.sa`;
    const company = await prisma.company.create({
      data: {
        nameAr: s.nameAr,
        nameEn: s.nameEn,
        crNumber: cr,
        type: CompanyType.SUPPLIER,
        verificationStatus: s.status,
        plan: s.plan,
        city: s.city || rand(SAUDI_CITIES),
        phone: `+9665${randInt(10000000, 99999999)}`,
        descriptionAr: `نحن ${s.nameAr} — نقدم منتجات وخدمات عالية الجودة في المملكة العربية السعودية.`,
        descriptionEn: `${s.nameEn} — delivering quality products and services across Saudi Arabia.`,
        users: {
          create: {
            email,
            passwordHash: hash('Supplier@1234'),
            fullName: `مدير ${s.nameAr}`.substring(0, 50),
            role: Role.SUPPLIER_ADMIN,
          },
        },
      },
      include: { users: true },
    });
    supplierCompanies.push(company);
  }
  console.log(`  ✓ ${supplierCompanies.length} supplier companies`);
  console.log('  ✓ Verified supplier: admin@supplier1.sa / Supplier@1234');
  console.log('  ✓ Unverified supplier: admin@supplier25.sa / Supplier@1234');
  console.log('  ✓ PRO supplier: admin@supplier2.sa / Supplier@1234');

  // ── 4. Buyer Companies ────────────────────────────────────────────────────
  console.log('  Creating buyer companies...');
  const buyerCompanies: any[] = [];
  for (let i = 0; i < BUYERS.length; i++) {
    const b = BUYERS[i];
    const cr = String(2000000010 + i).padStart(10, '0');
    const email = `admin@buyer${i + 1}.sa`;
    const company = await prisma.company.create({
      data: {
        nameAr: b.nameAr,
        nameEn: b.nameEn,
        crNumber: cr,
        type: CompanyType.BUYER,
        verificationStatus: VerificationStatus.VERIFIED,
        plan: SubscriptionPlan.FREE,
        city: rand(SAUDI_CITIES),
        phone: `+9665${randInt(10000000, 99999999)}`,
        users: {
          create: {
            email,
            passwordHash: hash('Buyer@1234'),
            fullName: `مدير ${b.nameAr}`.substring(0, 50),
            role: Role.BUYER_ADMIN,
          },
        },
      },
      include: { users: true },
    });
    buyerCompanies.push(company);
  }
  console.log(`  ✓ ${buyerCompanies.length} buyer companies`);
  console.log('  ✓ Buyer: admin@buyer1.sa / Buyer@1234');

  // ── 5. Listings ──────────────────────────────────────────────────────────
  console.log('  Creating listings...');
  const verifiedSuppliers = supplierCompanies.filter(
    (s) => s.verificationStatus === VerificationStatus.VERIFIED,
  );

  const listings: any[] = [];
  for (const supplier of verifiedSuppliers) {
    const count = randInt(3, 6);
    for (let j = 0; j < count; j++) {
      const cat = rand(categories);
      const listing = await prisma.listing.create({
        data: {
          titleAr: `منتج ${supplier.nameAr} - ${cat.nameAr} ${j + 1}`,
          titleEn: `${supplier.nameEn} — ${cat.nameEn} Product ${j + 1}`,
          descriptionAr: `منتج عالي الجودة من ${supplier.nameAr} في فئة ${cat.nameAr}. مثالي للشركات والمؤسسات.`,
          descriptionEn: `Premium ${cat.nameEn} product from ${supplier.nameEn}. Ideal for B2B use cases.`,
          price: randPrice(500, 50000),
          currency: 'SAR',
          unit: rand(['piece', 'box', 'ton', 'meter', 'set', 'unit']),
          minOrderQty: randInt(1, 50),
          supplierId: supplier.id,
          categoryId: cat.id,
          status: 'ACTIVE',
          images: {
            create: {
              url: `/assets/products/product-${randInt(1, 10)}.jpg`,
              alt: `${cat.nameEn} product`,
              isPrimary: true,
              sortOrder: 0,
            },
          },
        },
      });
      listings.push(listing);
    }
  }
  console.log(`  ✓ ${listings.length} listings`);

  // ── 6. RFQs ───────────────────────────────────────────────────────────────
  console.log('  Creating RFQs...');
  const rfqs: any[] = [];
  for (let i = 0; i < 30; i++) {
    const buyer = rand(buyerCompanies);
    const cat = rand(categories);
    const isOpen = i < 20;
    const rfq = await prisma.rFQ.create({
      data: {
        title: RFQ_TITLES[i % RFQ_TITLES.length],
        description: `نطلب تقديم عروض أسعار لـ ${RFQ_TITLES[i % RFQ_TITLES.length]}. يجب أن تتوافق المنتجات مع المعايير السعودية وتكون معتمدة من الجهات المختصة.`,
        categoryId: cat.id,
        buyerId: buyer.id,
        quantity: randInt(10, 500),
        unit: rand(['unit', 'ton', 'piece', 'box', 'meter']),
        budget: randPrice(10000, 500000),
        currency: 'SAR',
        deadline: new Date(Date.now() + randInt(7, 60) * 24 * 60 * 60 * 1000),
        status: isOpen
          ? RFQStatus.OPEN
          : rand([RFQStatus.AWARDED, RFQStatus.CLOSED, RFQStatus.CANCELLED]),
      },
    });
    rfqs.push(rfq);
  }
  console.log(`  ✓ ${rfqs.length} RFQs`);

  // ── 7. Quotes ─────────────────────────────────────────────────────────────
  console.log('  Creating quotes...');
  const quotes: any[] = [];
  const openRFQs = rfqs.filter((r) => r.status === RFQStatus.OPEN || r.status === RFQStatus.AWARDED);
  const usedPairs = new Set<string>();

  for (const rfq of openRFQs) {
    const quoteCount = randInt(2, 5);
    const shuffled = [...verifiedSuppliers].sort(() => Math.random() - 0.5);
    let submitted = 0;
    for (const supplier of shuffled) {
      if (submitted >= quoteCount) break;
      const pairKey = `${rfq.id}-${supplier.id}`;
      if (usedPairs.has(pairKey)) continue;
      usedPairs.add(pairKey);

      const status =
        rfq.status === RFQStatus.AWARDED
          ? rand([QuoteStatus.ACCEPTED, QuoteStatus.REJECTED, QuoteStatus.PENDING])
          : QuoteStatus.PENDING;

      const quote = await prisma.quote.create({
        data: {
          rfqId: rfq.id,
          supplierId: supplier.id,
          price: randPrice(rfq.budget * 0.5, rfq.budget * 1.2),
          currency: 'SAR',
          deliveryDays: randInt(3, 30),
          notes: rand(QUOTE_NOTES),
          status,
          validUntil: new Date(Date.now() + randInt(14, 30) * 24 * 60 * 60 * 1000),
        },
      });
      quotes.push(quote);
      submitted++;
    }
  }
  console.log(`  ✓ ${quotes.length} quotes`);

  // ── 8. Deals ─────────────────────────────────────────────────────────────
  console.log('  Creating deals...');
  const deals: any[] = [];
  const acceptedQuotes = quotes.filter((q) => q.status === QuoteStatus.ACCEPTED);
  const dealStatuses = [DealStatus.AWARDED, DealStatus.IN_PROGRESS, DealStatus.DELIVERED, DealStatus.COMPLETED, DealStatus.COMPLETED, DealStatus.COMPLETED];

  for (const quote of acceptedQuotes.slice(0, 25)) {
    const rfq = rfqs.find((r) => r.id === quote.rfqId);
    if (!rfq) continue;
    const status = rand(dealStatuses);
    const deal = await prisma.deal.create({
      data: {
        quoteId: quote.id,
        buyerId: rfq.buyerId,
        supplierId: quote.supplierId,
        totalAmount: quote.price,
        currency: quote.currency,
        status,
        notes: rand(DEAL_NOTES),
      },
    });
    deals.push(deal);
  }

  // Backfill with artificial deals if needed
  if (deals.length < 25) {
    const used = new Set(deals.map((d) => d.quoteId));
    for (const quote of quotes) {
      if (deals.length >= 25) break;
      if (used.has(quote.id)) continue;
      const rfq = rfqs.find((r) => r.id === quote.rfqId);
      if (!rfq) continue;
      const status = rand(dealStatuses);
      const deal = await prisma.deal.create({
        data: {
          quoteId: quote.id,
          buyerId: rfq.buyerId,
          supplierId: quote.supplierId,
          totalAmount: quote.price,
          currency: quote.currency,
          status,
          notes: rand(DEAL_NOTES),
        },
      });
      deals.push(deal);
      used.add(quote.id);
    }
  }
  console.log(`  ✓ ${deals.length} deals`);

  // ── 9. Ratings ───────────────────────────────────────────────────────────
  console.log('  Creating ratings...');
  const completedDeals = deals.filter((d) => d.status === DealStatus.COMPLETED);
  let ratingCount = 0;
  for (const deal of completedDeals.slice(0, 30)) {
    await prisma.rating.create({
      data: {
        dealId: deal.id,
        raterId: deal.buyerId,
        ratedId: deal.supplierId,
        score: randInt(3, 5),
        comment: rand(RATING_COMMENTS),
      },
    });
    ratingCount++;
  }
  console.log(`  ✓ ${ratingCount} ratings`);

  // ── 10. Conversations & Messages ──────────────────────────────────────────
  console.log('  Creating conversations and messages...');
  const convPairs = new Set<string>();
  let convCount = 0;
  let msgCount = 0;

  for (let i = 0; i < 40; i++) {
    const buyer = rand(buyerCompanies);
    const supplier = rand(verifiedSuppliers);
    const key = `${buyer.id}-${supplier.id}`;
    if (convPairs.has(key)) continue;
    convPairs.add(key);

    const conv = await prisma.conversation.create({
      data: {
        subject: `استفسار عن منتجات ${supplier.nameAr}`,
        participants: { connect: [{ id: buyer.id }, { id: supplier.id }] },
      },
    });
    convCount++;

    const buyerUser = buyer.users[0];
    const supplierUser = supplier.users[0];
    const msgCount_ = randInt(2, 6);
    for (let m = 0; m < msgCount_; m++) {
      const sender = m % 2 === 0 ? buyerUser : supplierUser;
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: sender.id,
          body: rand(MSG_BODIES),
          isRead: m < msgCount_ - 1,
        },
      });
      msgCount++;
    }

    await prisma.conversation.update({ where: { id: conv.id }, data: { updatedAt: new Date() } });
  }
  console.log(`  ✓ ${convCount} conversations, ${msgCount} messages`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!');
  console.log('─'.repeat(50));
  console.log('Demo Credentials:');
  console.log('  Admin     → admin@mwazn.sa         / Admin@1234');
  console.log('  Buyer     → admin@buyer1.sa         / Buyer@1234');
  console.log('  Supplier (Verified, PRO)  → admin@supplier1.sa  / Supplier@1234');
  console.log('  Supplier (Verified, FREE) → admin@supplier3.sa  / Supplier@1234');
  console.log('  Supplier (Unverified)     → admin@supplier25.sa / Supplier@1234');
  console.log('─'.repeat(50));
  console.log(`Categories: ${categories.length}`);
  console.log(`Suppliers:  ${supplierCompanies.length}`);
  console.log(`Buyers:     ${buyerCompanies.length}`);
  console.log(`Listings:   ${listings.length}`);
  console.log(`RFQs:       ${rfqs.length}`);
  console.log(`Quotes:     ${quotes.length}`);
  console.log(`Deals:      ${deals.length}`);
  console.log(`Ratings:    ${ratingCount}`);
  console.log(`Messages:   ${msgCount}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
