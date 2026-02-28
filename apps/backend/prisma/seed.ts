/**
 * Mwazn — Production Seed Script
 * Rich Saudi AR/EN dummy data, investor-demo-ready
 * Suppliers demo-1..demo-8 match the frontend hardcoded supplier list exactly.
 * Images use picsum.photos with stable seeds — no local files needed.
 */

import {
  PrismaClient,
  CompanyType,
  Role,
  VerificationStatus,
  SubscriptionPlan,
  RFQStatus,
  QuoteStatus,
  DealStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────────────
const hash = (pw: string) => bcrypt.hashSync(pw, 10);
const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randPrice = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;
/** Deterministic picsum image — same seed → same image every run */
const productImg = (s: number) =>
  `https://picsum.photos/seed/mwazn-${s}/800/600`;

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

// ── Realistic product catalog by category ────────────────────────────────────
type ProductSpec = { ar: string; en: string; minP: number; maxP: number; unit: string };

const PRODUCTS: Record<string, ProductSpec[]> = {
  'industrial-equipment': [
    { ar: 'رافعة شوكية هيدروليكية 3 طن', en: 'Hydraulic Forklift 3-Ton', minP: 28000, maxP: 120000, unit: 'unit' },
    { ar: 'ضاغط هواء صناعي 200 لتر', en: 'Industrial Air Compressor 200L', minP: 4500, maxP: 22000, unit: 'unit' },
    { ar: 'مولد كهربائي ديزل 50 كيلوواط', en: 'Diesel Generator 50 kW', minP: 18000, maxP: 65000, unit: 'unit' },
    { ar: 'مضخة مياه صناعية عالية الضغط', en: 'High-Pressure Industrial Water Pump', minP: 2500, maxP: 14000, unit: 'unit' },
    { ar: 'سيور ناقلة للمصانع', en: 'Factory Conveyor Belt System', minP: 12000, maxP: 85000, unit: 'meter' },
    { ar: 'محطة لحام آلية', en: 'Automated Welding Station', minP: 8000, maxP: 45000, unit: 'unit' },
    { ar: 'مضخة هيدروليكية صناعية', en: 'Industrial Hydraulic Pump', minP: 3000, maxP: 18000, unit: 'unit' },
    { ar: 'خط تعبئة وتغليف أوتوماتيكي', en: 'Automated Filling & Packing Line', minP: 55000, maxP: 280000, unit: 'set' },
    { ar: 'آلة ضغط هيدروليكي 100 طن', en: '100-Ton Hydraulic Press', minP: 22000, maxP: 95000, unit: 'unit' },
    { ar: 'حزام ناقل مطاط صناعي', en: 'Industrial Rubber Conveyor Belt', minP: 500, maxP: 3500, unit: 'meter' },
    { ar: 'محرك كهربائي صناعي 30 كيلوواط', en: 'Industrial Electric Motor 30 kW', minP: 2800, maxP: 15000, unit: 'unit' },
    { ar: 'خزان ضغط مضغوط 500 لتر', en: '500L Pressurized Storage Tank', minP: 5500, maxP: 28000, unit: 'unit' },
  ],
  'building-materials': [
    { ar: 'حديد تسليح قياس 16 مم', en: 'Rebar Steel 16mm Grade 60', minP: 1200, maxP: 1900, unit: 'ton' },
    { ar: 'أسمنت بورتلاندي مقاوم', en: 'Sulphate-Resistant Portland Cement', minP: 18, maxP: 28, unit: 'bag' },
    { ar: 'طوب أحمر مفرغ عالي الجودة', en: 'High-Quality Hollow Red Brick', minP: 380, maxP: 550, unit: 'thousand' },
    { ar: 'رمل ناعم مغسول للخرسانة', en: 'Washed Fine Concrete Sand', minP: 75, maxP: 130, unit: 'ton' },
    { ar: 'بلاط سيراميك 60×60 سم', en: 'Ceramic Floor Tile 60×60 cm', minP: 45, maxP: 130, unit: 'sqm' },
    { ar: 'لوح جبس بورد 12 مم', en: 'Gypsum Board 12mm', minP: 28, maxP: 55, unit: 'sheet' },
    { ar: 'أنابيب PVC للصرف الصحي', en: 'PVC Drainage Pipes', minP: 15, maxP: 90, unit: 'meter' },
    { ar: 'عازل حراري مقاوم للحرارة', en: 'Heat-Resistant Thermal Insulation', minP: 40, maxP: 100, unit: 'sqm' },
    { ar: 'دهان خارجي مقاوم للعوامل', en: 'Weather-Resistant Exterior Paint', minP: 130, maxP: 380, unit: 'gallon' },
    { ar: 'خشب بناء مدروس A-Grade', en: 'A-Grade Treated Structural Lumber', minP: 900, maxP: 2800, unit: 'cubic meter' },
    { ar: 'حصى مغسولة 20 مم', en: 'Washed Gravel 20mm', minP: 65, maxP: 110, unit: 'ton' },
    { ar: 'شبكة تسليح 200×200', en: 'Steel Reinforcement Mesh 200×200', minP: 250, maxP: 550, unit: 'sheet' },
  ],
  'furniture-decor': [
    { ar: 'كرسي مكتبي تنفيذي جلد', en: 'Executive Leather Office Chair', minP: 900, maxP: 5000, unit: 'unit' },
    { ar: 'مكتب مدير فاخر L-شكل', en: 'L-Shaped Executive Manager Desk', minP: 2800, maxP: 14000, unit: 'unit' },
    { ar: 'طاولة اجتماعات 12 شخص', en: '12-Person Boardroom Table', minP: 4500, maxP: 22000, unit: 'unit' },
    { ar: 'خزانة ملفات معدنية 4 أدراج', en: '4-Drawer Metal Filing Cabinet', minP: 500, maxP: 2200, unit: 'unit' },
    { ar: 'أريكة استقبال ثلاثية جلد', en: '3-Seat Leather Reception Sofa', minP: 2000, maxP: 9000, unit: 'unit' },
    { ar: 'حاجز مكتبي قابل للتعديل', en: 'Adjustable Office Partition Panel', minP: 220, maxP: 900, unit: 'meter' },
    { ar: 'مكتبة جدارية خشبية فاخرة', en: 'Premium Wooden Wall Bookcase', minP: 1400, maxP: 7000, unit: 'unit' },
    { ar: 'كرسي انتظار مريح بإطار معدني', en: 'Comfortable Metal-Frame Waiting Chair', minP: 380, maxP: 1800, unit: 'unit' },
    { ar: 'منضدة استقبال حديثة', en: 'Modern Reception Counter Desk', minP: 3500, maxP: 18000, unit: 'unit' },
    { ar: 'خزانة ملابس موظفين ستة أقسام', en: '6-Section Staff Locker Cabinet', minP: 700, maxP: 3000, unit: 'unit' },
    { ar: 'طاولة طعام مطبخ مكتبي', en: 'Office Kitchen Dining Table', minP: 600, maxP: 3500, unit: 'unit' },
    { ar: 'رف عرض منتجات ومتاجر', en: 'Retail Product Display Shelf', minP: 400, maxP: 2500, unit: 'unit' },
  ],
  'technology-electronics': [
    { ar: 'لاب توب أعمال Dell Latitude i7', en: 'Dell Latitude i7 Business Laptop', minP: 3800, maxP: 9000, unit: 'unit' },
    { ar: 'شاشة مهنية 32 بوصة 4K', en: '32" 4K Professional Monitor', minP: 900, maxP: 4000, unit: 'unit' },
    { ar: 'طابعة ليزر ملونة A3 شبكية', en: 'Network A3 Color Laser Printer', minP: 3500, maxP: 14000, unit: 'unit' },
    { ar: 'خادم Dell PowerEdge R750', en: 'Dell PowerEdge R750 Server', minP: 18000, maxP: 90000, unit: 'unit' },
    { ar: 'نظام كاميرات مراقبة IP 8 كاميرات', en: '8-Camera IP CCTV System', minP: 3000, maxP: 28000, unit: 'set' },
    { ar: 'جهاز UPS لا انقطاع للتيار 3 KVA', en: '3 KVA UPS Power Backup', minP: 1000, maxP: 7000, unit: 'unit' },
    { ar: 'هاتف VoIP مكتبي عالي الجودة', en: 'HD VoIP IP Office Phone', minP: 350, maxP: 1800, unit: 'unit' },
    { ar: 'بروجيكتر مؤتمرات 4000 لومن', en: '4000 Lumen Conference Projector', minP: 2800, maxP: 18000, unit: 'unit' },
    { ar: 'راوتر شبكة مؤسسي Cisco', en: 'Cisco Enterprise Network Router', minP: 1500, maxP: 12000, unit: 'unit' },
    { ar: 'تابلت Samsung Galaxy Tab Business', en: 'Samsung Galaxy Tab Business', minP: 1400, maxP: 5000, unit: 'unit' },
    { ar: 'نقطة وصول Wi-Fi 6 مؤسسية', en: 'Wi-Fi 6 Enterprise Access Point', minP: 800, maxP: 4500, unit: 'unit' },
    { ar: 'ذاكرة تخزين SSD سيرفر 4TB', en: '4TB Enterprise SSD Storage', minP: 1200, maxP: 6000, unit: 'unit' },
  ],
  'food-beverages': [
    { ar: 'زيت زيتون سعودي أصيل اكسترا', en: 'Saudi Extra Virgin Olive Oil', minP: 50, maxP: 95, unit: 'liter' },
    { ar: 'تمر سكري مميز درجة أولى', en: 'Premium Grade-A Sukkari Dates', minP: 90, maxP: 280, unit: 'kg' },
    { ar: 'قهوة عربية أصيلة بالهيل', en: 'Authentic Arabic Coffee with Cardamom', minP: 130, maxP: 500, unit: 'kg' },
    { ar: 'أرز بسمتي هندي ممتاز', en: 'Premium Indian Basmati Rice', minP: 16, maxP: 40, unit: 'kg' },
    { ar: 'عسل سدر طبيعي من اليمن', en: 'Natural Yemeni Sidr Honey', minP: 220, maxP: 900, unit: 'kg' },
    { ar: 'زيت نخيل صافي للصناعات', en: 'Refined Palm Oil for Industry', minP: 9, maxP: 20, unit: 'liter' },
    { ar: 'توابل خليجية مشكلة فاخرة', en: 'Premium Gulf Mixed Spice Blend', minP: 28, maxP: 95, unit: 'kg' },
    { ar: 'دقيق قمح فاخر للمخابز', en: 'Premium Bakery Wheat Flour', minP: 3, maxP: 9, unit: 'kg' },
    { ar: 'مياه معبأة 500 مل (كرتون)', en: 'Packaged Water 500ml (Carton)', minP: 18, maxP: 30, unit: 'case' },
    { ar: 'عصائر طبيعية معبأة للمطاعم', en: 'Natural Restaurant Packaged Juices', minP: 9, maxP: 22, unit: 'liter' },
    { ar: 'حليب UHT كامل الدسم', en: 'Full-Fat UHT Milk', minP: 4, maxP: 9, unit: 'liter' },
    { ar: 'سكر أبيض ناعم للصناعة', en: 'Fine Industrial White Sugar', minP: 2, maxP: 5, unit: 'kg' },
  ],
  'chemicals-raw-materials': [
    { ar: 'كلور للمسابح وتنقية المياه', en: 'Pool & Water Treatment Chlorine', minP: 28, maxP: 70, unit: 'kg' },
    { ar: 'راتنج إيبوكسي صناعي عالي الجودة', en: 'High-Grade Industrial Epoxy Resin', minP: 40, maxP: 140, unit: 'kg' },
    { ar: 'حمض الهيدروكلوريك 33%', en: 'Hydrochloric Acid 33%', minP: 12, maxP: 35, unit: 'liter' },
    { ar: 'كيماوي معالجة مياه الغلايات', en: 'Boiler Water Treatment Chemical', minP: 15, maxP: 45, unit: 'kg' },
    { ar: 'أصباغ صناعية مركزة', en: 'Concentrated Industrial Dyes', minP: 90, maxP: 400, unit: 'kg' },
    { ar: 'مواد تشحيم صناعي متخصصة', en: 'Specialized Industrial Lubricants', minP: 30, maxP: 100, unit: 'liter' },
    { ar: 'مادة لاصقة صناعية عالية المقاومة', en: 'High-Resistance Industrial Adhesive', minP: 45, maxP: 180, unit: 'kg' },
    { ar: 'بوليمر بلاستيكي خام HDPE', en: 'HDPE Raw Plastic Polymer', minP: 9, maxP: 30, unit: 'kg' },
    { ar: 'مسحوق كربون أسود للصناعة', en: 'Industrial Carbon Black Powder', minP: 18, maxP: 55, unit: 'kg' },
    { ar: 'صمغ صناعي للتغليف', en: 'Industrial Packaging Adhesive', minP: 20, maxP: 80, unit: 'kg' },
    { ar: 'محلول هيدروكسيد الصوديوم', en: 'Sodium Hydroxide Solution', minP: 8, maxP: 22, unit: 'liter' },
    { ar: 'مواد عازلة كيماوية للخزانات', en: 'Chemical Tank Insulation Material', minP: 35, maxP: 120, unit: 'sqm' },
  ],
  'electrical-equipment': [
    { ar: 'كابل كهربائي نحاسي مقاوم للحرارة', en: 'Heat-Resistant Copper Electrical Cable', minP: 18, maxP: 95, unit: 'meter' },
    { ar: 'لوحة كهربائية رئيسية مع قواطع', en: 'Main Electrical Panel with Breakers', minP: 2800, maxP: 18000, unit: 'unit' },
    { ar: 'محول كهربائي 100 KVA', en: '100 KVA Power Transformer', minP: 9000, maxP: 40000, unit: 'unit' },
    { ar: 'أضواء LED صناعية 200 واط', en: '200W Industrial LED High Bay Light', minP: 180, maxP: 950, unit: 'unit' },
    { ar: 'قاطع كهربائي أوتوماتيكي 100A', en: '100A Automatic Circuit Breaker', minP: 90, maxP: 550, unit: 'unit' },
    { ar: 'لوحة توزيع كهربائي مع أميتر', en: 'Electrical Distribution Board with Meter', minP: 1400, maxP: 9500, unit: 'unit' },
    { ar: 'مولد طوارئ كهربائي 100 كيلوواط', en: '100 kW Emergency Power Generator', minP: 14000, maxP: 90000, unit: 'unit' },
    { ar: 'كاشف دخان وحريق معتمد', en: 'Certified Smoke & Fire Detector', minP: 90, maxP: 400, unit: 'unit' },
    { ar: 'مكثف كهربائي صناعي', en: 'Industrial Power Factor Capacitor', minP: 350, maxP: 2500, unit: 'unit' },
    { ar: 'وحدة تحكم PLCصناعي', en: 'Industrial PLC Control Unit', minP: 1800, maxP: 12000, unit: 'unit' },
    { ar: 'نظام أرضي كهربائي آمن', en: 'Safe Electrical Earthing System', minP: 800, maxP: 5000, unit: 'set' },
    { ar: 'خلية شمسية سكنية 400 واط', en: '400W Solar Panel Module', minP: 700, maxP: 1800, unit: 'unit' },
  ],
  'medical-devices': [
    { ar: 'سرير طبي كهربائي قابل للتعديل', en: 'Adjustable Electric Hospital Bed', minP: 4000, maxP: 20000, unit: 'unit' },
    { ar: 'جهاز قياس ضغط الدم الرقمي', en: 'Digital Blood Pressure Monitor', minP: 130, maxP: 900, unit: 'unit' },
    { ar: 'مجموعة أثاث عيادة طبية', en: 'Medical Clinic Furniture Set', minP: 2200, maxP: 14000, unit: 'set' },
    { ar: 'مضخة تسريب وريدي بالحجم', en: 'Volumetric IV Infusion Pump', minP: 1800, maxP: 7000, unit: 'unit' },
    { ar: 'جهاز أشعة سينية محمول 100mA', en: '100mA Portable X-Ray Machine', minP: 28000, maxP: 140000, unit: 'unit' },
    { ar: 'طقم جراحة طارئة معقم', en: 'Sterile Emergency Surgical Kit', minP: 900, maxP: 6000, unit: 'set' },
    { ar: 'وحدة كرسي طبيب أسنان كاملة', en: 'Complete Dental Chair Unit', minP: 14000, maxP: 65000, unit: 'unit' },
    { ar: 'جهاز تخطيط القلب 12 قناة', en: '12-Channel ECG Machine', minP: 3500, maxP: 20000, unit: 'unit' },
    { ar: 'جهاز تعقيم بالبخار Autoclave', en: 'Steam Autoclave Sterilizer', minP: 2200, maxP: 18000, unit: 'unit' },
    { ar: 'مستلزمات حماية شخصية طبية', en: 'Medical Personal Protective Equipment', minP: 60, maxP: 600, unit: 'box' },
    { ar: 'جهاز قياس سكر الدم', en: 'Blood Glucose Monitoring System', minP: 150, maxP: 1200, unit: 'unit' },
    { ar: 'سرير فحص طبي قابل للطي', en: 'Foldable Medical Examination Table', minP: 1200, maxP: 6500, unit: 'unit' },
  ],
};

// ── Supplier Companies — demo-1..demo-8 MUST MATCH frontend/suppliers/page.tsx ──
interface SupplierSpec {
  slug?: string;
  nameAr: string;
  nameEn: string;
  city: string;
  plan: SubscriptionPlan;
  status: VerificationStatus;
  primaryCategory?: string;
  phone?: string;
  website?: string;
}

const SUPPLIERS: SupplierSpec[] = [
  // ── These 8 match the hardcoded DEMO_SUPPLIERS in apps/frontend/src/app/[locale]/suppliers/page.tsx ──
  {
    slug: 'demo-1',
    nameAr: 'شركة الخليج للمعدات الصناعية',
    nameEn: 'Gulf Industrial Equipment Co.',
    city: 'Riyadh',
    plan: SubscriptionPlan.PRO,
    status: VerificationStatus.VERIFIED,
    primaryCategory: 'industrial-equipment',
    phone: '+966512345001',
    website: 'https://gulf-industrial.sa',
  },
  {
    slug: 'demo-2',
    nameAr: 'مؤسسة العمران للمواد الإنشائية',
    nameEn: 'Al-Omran Construction Materials',
    city: 'Jeddah',
    plan: SubscriptionPlan.PRO,
    status: VerificationStatus.VERIFIED,
    primaryCategory: 'building-materials',
    phone: '+966512345002',
    website: 'https://alomran-const.sa',
  },
  {
    slug: 'demo-3',
    nameAr: 'الشركة الوطنية للأثاث المكتبي',
    nameEn: 'National Office Furniture Company',
    city: 'Riyadh',
    plan: SubscriptionPlan.FREE,
    status: VerificationStatus.VERIFIED,
    primaryCategory: 'furniture-decor',
    phone: '+966512345003',
  },
  {
    slug: 'demo-4',
    nameAr: 'تقنية المستقبل للحلول الرقمية',
    nameEn: 'Future Tech Digital Solutions',
    city: 'Dammam',
    plan: SubscriptionPlan.PRO,
    status: VerificationStatus.VERIFIED,
    primaryCategory: 'technology-electronics',
    phone: '+966512345004',
    website: 'https://futuretech-sa.com',
  },
  {
    slug: 'demo-5',
    nameAr: 'شركة الأصيل للأغذية والمشروبات',
    nameEn: 'Al-Aseel Food & Beverages',
    city: 'Riyadh',
    plan: SubscriptionPlan.PRO,
    status: VerificationStatus.VERIFIED,
    primaryCategory: 'food-beverages',
    phone: '+966512345005',
    website: 'https://alaseel-food.sa',
  },
  {
    slug: 'demo-6',
    nameAr: 'مجموعة النهضة للكيماويات',
    nameEn: 'Al-Nahda Chemical Group',
    city: 'Jubail',
    plan: SubscriptionPlan.PRO,
    status: VerificationStatus.VERIFIED,
    primaryCategory: 'chemicals-raw-materials',
    phone: '+966512345006',
    website: 'https://alnahda-chem.sa',
  },
  {
    slug: 'demo-7',
    nameAr: 'الفهد للمعدات الكهربائية',
    nameEn: 'Al-Fahd Electrical Equipment',
    city: 'Riyadh',
    plan: SubscriptionPlan.FREE,
    status: VerificationStatus.VERIFIED,
    primaryCategory: 'electrical-equipment',
    phone: '+966512345007',
  },
  {
    slug: 'demo-8',
    nameAr: 'شركة السلامة للطب والرعاية',
    nameEn: 'Al-Salama Medical & Care',
    city: 'Khobar',
    plan: SubscriptionPlan.PRO,
    status: VerificationStatus.VERIFIED,
    primaryCategory: 'medical-devices',
    phone: '+966512345008',
    website: 'https://alsalama-medical.sa',
  },
  // ── Additional suppliers ──────────────────────────────────────────────────
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
  // Pending (unverified demo)
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

// ── Seed credentials from environment (fallback to dev defaults) ───────────────
const SEED_ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    || 'admin@mwazn.sa';
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@1234';
const SEED_SUP_PASSWORD   = process.env.SEED_SUP_PASSWORD   || 'Supplier@1234';
const SEED_BUY_PASSWORD   = process.env.SEED_BUY_PASSWORD   || 'Buyer@1234';

// ── Main Seed ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting Mwazn seed...');

  // Clean up in FK-safe order
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
  await prisma.company.create({
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
          email: SEED_ADMIN_EMAIL,
          passwordHash: hash(SEED_ADMIN_PASSWORD),
          fullName: 'Platform Admin',
          role: Role.PLATFORM_ADMIN,
        },
      },
    },
    include: { users: true },
  });
  console.log(`  ✓ Admin: ${SEED_ADMIN_EMAIL}`);

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
        slug: s.slug ?? null,
        type: CompanyType.SUPPLIER,
        verificationStatus: s.status,
        plan: s.plan,
        city: s.city,
        phone: s.phone ?? `+9665${randInt(10000000, 99999999)}`,
        website: s.website ?? null,
        descriptionAr: `نحن ${s.nameAr} — نقدم منتجات وخدمات عالية الجودة في المملكة العربية السعودية منذ سنوات. نلتزم بأعلى معايير الجودة والخدمة لعملائنا.`,
        descriptionEn: `${s.nameEn} — delivering premium products and services across Saudi Arabia. We are committed to the highest quality and service standards.`,
        users: {
          create: {
            email,
            passwordHash: hash(SEED_SUP_PASSWORD),
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
            passwordHash: hash(SEED_BUY_PASSWORD),
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

  // ── 5. Listings (8–12 per verified supplier, with real images) ────────────
  console.log('  Creating listings...');
  let listingCount = 0;
  // Stable picsum seed counter so images differ per product
  let imgSeed = 100;

  for (let i = 0; i < supplierCompanies.length; i++) {
    const company = supplierCompanies[i];
    if (company.verificationStatus !== VerificationStatus.VERIFIED) continue;

    const spec = SUPPLIERS[i];
    const count = randInt(8, 12);

    for (let j = 0; j < count; j++) {
      // 70% from primary category, 30% random
      let cat: (typeof categories)[0];
      if (spec.primaryCategory && j < Math.ceil(count * 0.7)) {
        cat = categories.find((c) => c.slug === spec.primaryCategory) ?? rand(categories);
      } else {
        cat = rand(categories);
      }

      const catProducts = PRODUCTS[cat.slug];
      let titleAr: string, titleEn: string, price: number, unit: string;

      if (catProducts && catProducts.length > 0) {
        const p = catProducts[j % catProducts.length];
        titleAr = p.ar;
        titleEn = p.en;
        price = randPrice(p.minP, p.maxP);
        unit = p.unit;
      } else {
        titleAr = `منتج ${cat.nameAr} ${j + 1}`;
        titleEn = `${cat.nameEn} Product ${j + 1}`;
        price = randPrice(500, 50000);
        unit = rand(['piece', 'box', 'ton', 'meter', 'set', 'unit']);
      }

      await prisma.listing.create({
        data: {
          titleAr,
          titleEn,
          descriptionAr: `${titleAr} عالي الجودة من ${company.nameAr}. مطابق للمعايير السعودية، مثالي للشركات والمؤسسات.`,
          descriptionEn: `Premium ${titleEn} from ${company.nameEn}. Saudi-standard compliant, ideal for B2B procurement.`,
          price,
          currency: 'SAR',
          unit,
          minOrderQty: randInt(1, 50),
          supplierId: company.id,
          categoryId: cat.id,
          status: 'ACTIVE',
          images: {
            create: {
              // Stable picsum seed — same image each seed run for same product
              url: productImg(imgSeed),
              alt: titleEn,
              isPrimary: true,
              sortOrder: 0,
            },
          },
        },
      });
      imgSeed++;
      listingCount++;
    }
  }
  console.log(`  ✓ ${listingCount} listings`);

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
  const verifiedSuppliers = supplierCompanies.filter(
    (s) => s.verificationStatus === VerificationStatus.VERIFIED,
  );
  const openRFQs = rfqs.filter(
    (r) => r.status === RFQStatus.OPEN || r.status === RFQStatus.AWARDED,
  );
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
  const dealStatuses = [
    DealStatus.AWARDED, DealStatus.IN_PROGRESS, DealStatus.DELIVERED,
    DealStatus.COMPLETED, DealStatus.COMPLETED, DealStatus.COMPLETED,
  ];

  const usedQuoteIds = new Set<string>();
  const addDeal = async (quote: any) => {
    if (usedQuoteIds.has(quote.id)) return;
    usedQuoteIds.add(quote.id);
    const rfq = rfqs.find((r) => r.id === quote.rfqId);
    if (!rfq) return;
    const deal = await prisma.deal.create({
      data: {
        quoteId: quote.id,
        buyerId: rfq.buyerId,
        supplierId: quote.supplierId,
        totalAmount: quote.price,
        currency: quote.currency,
        status: rand(dealStatuses),
        notes: rand(DEAL_NOTES),
      },
    });
    deals.push(deal);
  };

  for (const q of acceptedQuotes.slice(0, 25)) await addDeal(q);
  // Backfill to reach 25 deals
  for (const q of quotes) {
    if (deals.length >= 25) break;
    await addDeal(q);
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
    const numMsgs = randInt(2, 6);
    for (let m = 0; m < numMsgs; m++) {
      const sender = m % 2 === 0 ? buyerUser : supplierUser;
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: sender.id,
          body: rand(MSG_BODIES),
          isRead: m < numMsgs - 1,
        },
      });
      msgCount++;
    }
  }
  console.log(`  ✓ ${convCount} conversations, ${msgCount} messages`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!');
  console.log('─'.repeat(55));
  console.log('Demo Credentials (passwords set via SEED_* env vars):');
  console.log(`  Admin     → ${SEED_ADMIN_EMAIL}`);
  console.log('  Buyer     → admin@buyer1.sa');
  console.log('  Supplier (PRO, Verified) → admin@supplier1.sa');
  console.log('  Supplier (FREE)          → admin@supplier3.sa');
  console.log('  Supplier (Unverified)    → admin@supplier24.sa');
  console.log('─'.repeat(55));
  console.log('Showroom URLs (after docker restart):');
  console.log('  http://localhost:3000/en/suppliers/demo-1   Gulf Industrial');
  console.log('  http://localhost:3000/en/suppliers/demo-8   Al-Salama Medical');
  console.log('─'.repeat(55));
  console.log(`Categories: ${categories.length}`);
  console.log(`Suppliers:  ${supplierCompanies.length}`);
  console.log(`Buyers:     ${buyerCompanies.length}`);
  console.log(`Listings:   ${listingCount}`);
  console.log(`RFQs:       ${rfqs.length}`);
  console.log(`Quotes:     ${quotes.length}`);
  console.log(`Deals:      ${deals.length}`);
  console.log(`Ratings:    ${ratingCount}`);
  console.log(`Messages:   ${msgCount}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
