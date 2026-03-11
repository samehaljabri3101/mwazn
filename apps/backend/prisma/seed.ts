/**
 * Mwazn — Demo Marketplace Seed (v4)
 * 200 companies · 900+ listings · 400 RFQs · 600+ quotes
 * 200 deals · 2000+ messages · 300+ ratings
 * Images: curated Unsplash direct CDN URLs, product-type level manifest.
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const hash = (pw: string) => bcrypt.hashSync(pw, 10);
const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randPrice = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;
// ── Product image manifest ─────────────────────────────────────────────────────
// Verified working Unsplash CDN URLs (timestamp-hash format, HTTP 200 confirmed).
// Relevance > uniqueness — same image reused for similar products is acceptable.
const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=80`;

// Verified working IDs (all return HTTP 200):
const IMG = {
  // Technology / computers
  laptop:      '1517336714731-489689fd1ca8',
  laptop2:     '1496181133206-80ce9b88a853',
  coding:      '1498050108023-c5249f4df085',
  server:      '1593642632559-0c6d3fc62b89',
  tech:        '1605289982774-9a6fef564df8',
  // Industrial machinery
  machinery:   '1558618666-fcd25c85cd64',
  industrial:  '1581091226825-a6a2a5aee158',
  mech:        '1504917595217-d4dc5ebe6122',
  pipe:        '1519389950473-47ba0277781c',
  // Building & construction
  construct:   '1504307651254-35680f356dfd',
  construct2:  '1530041539828-114de669390e',
  tiles:       '1578575437130-527eed3abbec',
  paint:       '1572635196237-14b3f281503f',
  // Medical
  hospital:    '1576091160399-112ba8d25d1d',
  medical:     '1542282088-fe8426682b8f',
  clinic:      '1631815589968-fdb09a223b1e',
  monitor:     '1611532736597-de2d4265fba3',
  // Food
  food:        '1462206092226-f46025ffe607',
  oliveoil:    '1474979266404-7eaacbcd87c5',
  fooditem:    '1590856029826-c7a73142bbf1',
  grain:       '1512621776951-a57141f2eefd',
  // Furniture / office
  chair:       '1524758631624-e2822e304c36',
  sofa:        '1555041469-a586c61ea9bc',
  desk:        '1501854140801-50d01698950b',
  boardroom:   '1441986380878-c4248f5b8b5b',
  cabinet:     '1556742049-0cfed4f6a45d',
  lobby:       '1507003211169-0a1dd7228f2d',
  office2:     '1556742031-c6961e8560b0',
  // Electrical / energy
  elecpanel:   '1559209172-0ff8f6d49ff7',
  solar:       '1497435334941-8c899ee9e8e9',
  electrical:  '1635070041078-e363dbe005cb',
  // Chemicals / materials
  chemical:    '1532187643603-ba119ca4109e',
  chemical2:   '1585776245991-cf89dd7fc73a',
  // General / misc
  misc1:       '1581578731548-c64695cc6952',
  misc2:       '1586528116311-ad8dd3c8310d',
  misc3:       '1516975080664-ed2fc6a32937',
};

const PRODUCT_IMAGE_MAP: Record<string, [string, string]> = {
  // ── Industrial Equipment ──────────────────────────────────────────────────
  'Hydraulic Forklift 3-Ton':               [U(IMG.industrial),  U(IMG.machinery)],
  'Industrial Air Compressor 200L':          [U(IMG.machinery),   U(IMG.mech)],
  'Diesel Generator 50 kW':                  [U(IMG.machinery),   U(IMG.industrial)],
  'High-Pressure Industrial Water Pump':     [U(IMG.pipe),        U(IMG.machinery)],
  'Factory Conveyor Belt System':            [U(IMG.industrial),  U(IMG.machinery)],
  'Automated Welding Station':               [U(IMG.industrial),  U(IMG.mech)],
  'Industrial Hydraulic Pump':               [U(IMG.machinery),   U(IMG.mech)],
  'Automated Filling & Packing Line':        [U(IMG.industrial),  U(IMG.machinery)],
  '100-Ton Hydraulic Press':                 [U(IMG.machinery),   U(IMG.industrial)],
  'Industrial Rubber Conveyor Belt':         [U(IMG.industrial),  U(IMG.machinery)],
  'Industrial Electric Motor 30 kW':        [U(IMG.machinery),   U(IMG.mech)],
  '500L Pressurized Storage Tank':           [U(IMG.pipe),        U(IMG.industrial)],
  // ── Building Materials ────────────────────────────────────────────────────
  'Rebar Steel 16mm Grade 60':               [U(IMG.construct),   U(IMG.construct2)],
  'Sulphate-Resistant Portland Cement':      [U(IMG.construct2),  U(IMG.construct)],
  'High-Quality Hollow Red Brick':           [U(IMG.construct),   U(IMG.construct2)],
  'Washed Fine Concrete Sand':               [U(IMG.construct2),  U(IMG.construct)],
  'Ceramic Floor Tile 60×60 cm':             [U(IMG.tiles),       U(IMG.construct)],
  'Gypsum Board 12mm':                       [U(IMG.construct),   U(IMG.construct2)],
  'PVC Drainage Pipes':                      [U(IMG.pipe),        U(IMG.construct)],
  'Heat-Resistant Thermal Insulation':       [U(IMG.construct),   U(IMG.construct2)],
  'Weather-Resistant Exterior Paint':        [U(IMG.paint),       U(IMG.construct)],
  'A-Grade Treated Structural Lumber':       [U(IMG.construct2),  U(IMG.construct)],
  'Washed Gravel 20mm':                      [U(IMG.construct),   U(IMG.construct2)],
  'Steel Reinforcement Mesh 200×200':        [U(IMG.construct2),  U(IMG.construct)],
  // ── Technology & Electronics ──────────────────────────────────────────────
  'Dell Latitude i7 Business Laptop':        [U(IMG.laptop),      U(IMG.laptop2)],
  '32" 4K Professional Monitor':             [U(IMG.laptop),      U(IMG.coding)],
  'Network A3 Color Laser Printer':          [U(IMG.tech),        U(IMG.laptop)],
  'Dell PowerEdge R750 Server':              [U(IMG.server),      U(IMG.tech)],
  '8-Camera IP CCTV System':                 [U(IMG.misc3),       U(IMG.industrial)],
  '3 KVA UPS Power Backup':                  [U(IMG.server),      U(IMG.elecpanel)],
  'HD VoIP IP Office Phone':                 [U(IMG.laptop),      U(IMG.coding)],
  '4000 Lumen Conference Projector':         [U(IMG.boardroom),   U(IMG.lobby)],
  'Cisco Enterprise Network Router':         [U(IMG.server),      U(IMG.tech)],
  'Samsung Galaxy Tab Business':             [U(IMG.laptop2),     U(IMG.laptop)],
  'Wi-Fi 6 Enterprise Access Point':         [U(IMG.server),      U(IMG.tech)],
  '4TB Enterprise SSD Storage':              [U(IMG.server),      U(IMG.coding)],
  // ── Food & Beverages ──────────────────────────────────────────────────────
  'Saudi Extra Virgin Olive Oil':            [U(IMG.oliveoil),    U(IMG.food)],
  'Premium Grade-A Sukkari Dates':           [U(IMG.fooditem),    U(IMG.grain)],
  'Authentic Arabic Coffee with Cardamom':   [U(IMG.grain),       U(IMG.food)],
  'Premium Indian Basmati Rice':             [U(IMG.grain),       U(IMG.food)],
  'Natural Yemeni Sidr Honey':               [U(IMG.fooditem),    U(IMG.oliveoil)],
  'Refined Palm Oil for Industry':           [U(IMG.oliveoil),    U(IMG.food)],
  'Premium Gulf Mixed Spice Blend':          [U(IMG.food),        U(IMG.grain)],
  'Premium Bakery Wheat Flour':              [U(IMG.grain),       U(IMG.food)],
  'Packaged Water 500ml (Carton)':           [U(IMG.food),        U(IMG.grain)],
  'Natural Restaurant Packaged Juices':      [U(IMG.fooditem),    U(IMG.food)],
  'Full-Fat UHT Milk':                       [U(IMG.food),        U(IMG.grain)],
  'Fine Industrial White Sugar':             [U(IMG.grain),       U(IMG.food)],
  // ── Chemicals & Raw Materials ─────────────────────────────────────────────
  'Pool & Water Treatment Chlorine':         [U(IMG.chemical),    U(IMG.pipe)],
  'High-Grade Industrial Epoxy Resin':       [U(IMG.chemical),    U(IMG.chemical2)],
  'Hydrochloric Acid 33%':                   [U(IMG.chemical2),   U(IMG.chemical)],
  'Boiler Water Treatment Chemical':         [U(IMG.chemical),    U(IMG.pipe)],
  'Concentrated Industrial Dyes':            [U(IMG.paint),       U(IMG.chemical)],
  'Specialized Industrial Lubricants':       [U(IMG.machinery),   U(IMG.chemical)],
  'High-Resistance Industrial Adhesive':     [U(IMG.chemical),    U(IMG.machinery)],
  'HDPE Raw Plastic Polymer':                [U(IMG.chemical2),   U(IMG.chemical)],
  'Industrial Carbon Black Powder':          [U(IMG.chemical),    U(IMG.industrial)],
  'Industrial Packaging Adhesive':           [U(IMG.chemical),    U(IMG.chemical2)],
  'Sodium Hydroxide Solution':               [U(IMG.chemical2),   U(IMG.pipe)],
  'Chemical Tank Insulation Material':       [U(IMG.chemical),    U(IMG.pipe)],
  // ── Electrical Equipment ──────────────────────────────────────────────────
  'Heat-Resistant Copper Electrical Cable':  [U(IMG.elecpanel),   U(IMG.electrical)],
  'Main Electrical Panel with Breakers':     [U(IMG.elecpanel),   U(IMG.electrical)],
  '100 KVA Power Transformer':               [U(IMG.elecpanel),   U(IMG.machinery)],
  '200W Industrial LED High Bay Light':      [U(IMG.solar),       U(IMG.elecpanel)],
  '100A Automatic Circuit Breaker':          [U(IMG.elecpanel),   U(IMG.electrical)],
  'Electrical Distribution Board with Meter':[U(IMG.elecpanel),   U(IMG.electrical)],
  '100 kW Emergency Power Generator':        [U(IMG.machinery),   U(IMG.elecpanel)],
  'Certified Smoke & Fire Detector':         [U(IMG.misc3),       U(IMG.elecpanel)],
  'Industrial Power Factor Capacitor':       [U(IMG.elecpanel),   U(IMG.electrical)],
  'Industrial PLC Control Unit':             [U(IMG.server),      U(IMG.elecpanel)],
  'Safe Electrical Earthing System':         [U(IMG.elecpanel),   U(IMG.electrical)],
  '400W Solar Panel Module':                 [U(IMG.solar),       U(IMG.elecpanel)],
  // ── Medical Devices ───────────────────────────────────────────────────────
  'Adjustable Electric Hospital Bed':        [U(IMG.hospital),    U(IMG.clinic)],
  'Digital Blood Pressure Monitor':          [U(IMG.medical),     U(IMG.hospital)],
  'Medical Clinic Furniture Set':            [U(IMG.hospital),    U(IMG.clinic)],
  'Volumetric IV Infusion Pump':             [U(IMG.hospital),    U(IMG.medical)],
  '100mA Portable X-Ray Machine':            [U(IMG.monitor),     U(IMG.hospital)],
  'Sterile Emergency Surgical Kit':          [U(IMG.medical),     U(IMG.hospital)],
  'Complete Dental Chair Unit':              [U(IMG.clinic),      U(IMG.hospital)],
  '12-Channel ECG Machine':                  [U(IMG.monitor),     U(IMG.medical)],
  'Steam Autoclave Sterilizer':              [U(IMG.medical),     U(IMG.hospital)],
  'Medical Personal Protective Equipment':   [U(IMG.medical),     U(IMG.clinic)],
  'Blood Glucose Monitoring System':         [U(IMG.medical),     U(IMG.monitor)],
  'Foldable Medical Examination Table':      [U(IMG.hospital),    U(IMG.clinic)],
  // ── Furniture & Decor ─────────────────────────────────────────────────────
  'Executive Leather Office Chair':          [U(IMG.chair),       U(IMG.lobby)],
  'L-Shaped Executive Manager Desk':         [U(IMG.desk),        U(IMG.chair)],
  '12-Person Boardroom Table':               [U(IMG.boardroom),   U(IMG.lobby)],
  '4-Drawer Metal Filing Cabinet':           [U(IMG.cabinet),     U(IMG.office2)],
  '3-Seat Leather Reception Sofa':           [U(IMG.sofa),        U(IMG.lobby)],
  'Adjustable Office Partition Panel':       [U(IMG.desk),        U(IMG.chair)],
  'Premium Wooden Wall Bookcase':            [U(IMG.office2),     U(IMG.desk)],
  'Comfortable Metal-Frame Waiting Chair':   [U(IMG.chair),       U(IMG.sofa)],
  'Modern Reception Counter Desk':           [U(IMG.lobby),       U(IMG.sofa)],
  '6-Section Staff Locker Cabinet':          [U(IMG.cabinet),     U(IMG.desk)],
  'Office Kitchen Dining Table':             [U(IMG.desk),        U(IMG.boardroom)],
  'Retail Product Display Shelf':            [U(IMG.cabinet),     U(IMG.lobby)],
};

// Category-level fallback when product title is not in the map
const CAT_FALLBACK_IMAGES: Record<string, [string, string]> = {
  'industrial-equipment':     [U(IMG.machinery),   U(IMG.industrial)],
  'building-materials':       [U(IMG.construct),   U(IMG.construct2)],
  'furniture-decor':          [U(IMG.chair),       U(IMG.sofa)],
  'technology-electronics':   [U(IMG.laptop),      U(IMG.server)],
  'food-beverages':           [U(IMG.food),        U(IMG.oliveoil)],
  'chemicals-raw-materials':  [U(IMG.chemical),    U(IMG.chemical2)],
  'electrical-equipment':     [U(IMG.elecpanel),   U(IMG.solar)],
  'medical-devices':          [U(IMG.hospital),    U(IMG.medical)],
  'logistics-transport':      [U(IMG.industrial),  U(IMG.misc1)],
  'safety-security':          [U(IMG.misc3),       U(IMG.industrial)],
  'energy-petroleum':         [U(IMG.solar),       U(IMG.elecpanel)],
  'agriculture-food':         [U(IMG.food),        U(IMG.oliveoil)],
  'it-services':              [U(IMG.server),      U(IMG.laptop)],
  'clothing-textiles':        [U(IMG.misc2),       U(IMG.paint)],
  'vehicles-automotive':      [U(IMG.misc1),       U(IMG.industrial)],
  'paper-printing':           [U(IMG.tech),        U(IMG.laptop)],
  'restaurant-equipment':     [U(IMG.food),        U(IMG.machinery)],
  'tools-hardware':           [U(IMG.machinery),   U(IMG.mech)],
  'cleaning-supplies':        [U(IMG.paint),       U(IMG.misc2)],
  'construction-contracting': [U(IMG.construct),   U(IMG.construct2)],
  'laboratory-equipment':     [U(IMG.chemical),    U(IMG.server)],
  'packaging-wrapping':       [U(IMG.misc1),       U(IMG.machinery)],
  'office-equipment':         [U(IMG.laptop),      U(IMG.tech)],
  'hvac-equipment':           [U(IMG.machinery),   U(IMG.pipe)],
  'consulting-services':      [U(IMG.boardroom),   U(IMG.lobby)],
};

function getProductImages(titleEn: string, catSlug: string): [string, string] {
  return (
    PRODUCT_IMAGE_MAP[titleEn] ??
    CAT_FALLBACK_IMAGES[catSlug] ??
    [U('dRMQiAubdws'), U('VQGGmDWclBM')]
  );
}

const logoImg = (s: number) => `https://picsum.photos/seed/company-logo-${s}/200/200`;

// ── Categories ────────────────────────────────────────────────────────────────
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

// ── Product Catalog by Category ────────────────────────────────────────────────
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
    { ar: 'وحدة تحكم PLC صناعي', en: 'Industrial PLC Control Unit', minP: 1800, maxP: 12000, unit: 'unit' },
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

// ── Supplier Name Templates for Auto-Generation ────────────────────────────────
const SUP_AR_PREFIX = ['شركة', 'مؤسسة', 'مجموعة', 'شركة'];
const SUP_AR_MIDFIX_BY_CAT: Record<string, string[]> = {
  'building-materials': ['العمران', 'الإنشاء', 'البنيان', 'الأساس', 'المواد'],
  'furniture-decor': ['الأثاث', 'الديكور', 'المفروشات', 'الراحة', 'التصميم'],
  'industrial-equipment': ['الصناعة', 'المعدات', 'التقنية الصناعية', 'الميكانيك', 'التشغيل'],
  'technology-electronics': ['التقنية', 'الإلكترونيات', 'الذكاء', 'المعلوماتية', 'الابتكار'],
  'food-beverages': ['الأغذية', 'المواد الغذائية', 'الإنتاج الغذائي', 'التموين', 'الطعام'],
  'chemicals-raw-materials': ['الكيماويات', 'المواد الكيماوية', 'التحويل الكيماوي', 'المواد الخام', 'البتروكيماويات'],
  'electrical-equipment': ['الكهرباء', 'الطاقة', 'الأنظمة الكهربائية', 'الطاقة الكهربائية', 'القدرة'],
  'medical-devices': ['الطب', 'الأجهزة الطبية', 'الرعاية الصحية', 'الصحة', 'المستلزمات الطبية'],
  'hvac-equipment': ['التبريد والتكييف', 'الأنظمة الحرارية', 'المناخ', 'التهوية', 'التكييف'],
  'logistics-transport': ['الخدمات اللوجستية', 'النقل', 'الشحن', 'التوزيع', 'المواصلات'],
  'safety-security': ['السلامة', 'الأمن', 'الحماية', 'السلامة والأمان', 'الأنظمة الأمنية'],
  'agriculture-food': ['الزراعة', 'المزارع', 'الإنتاج الزراعي', 'الأغذية الزراعية', 'المحاصيل'],
  'it-services': ['خدمات تقنية المعلومات', 'الحلول الرقمية', 'البرمجيات', 'الأنظمة', 'الشبكات'],
  'clothing-textiles': ['الملابس', 'النسيج', 'الأقمشة', 'الأزياء', 'الملبوسات'],
  'vehicles-automotive': ['السيارات', 'المركبات', 'قطع الغيار', 'النقل', 'الميكانيك'],
  'paper-printing': ['الورق', 'الطباعة', 'المطبوعات', 'التغليف الورقي', 'الورق والطباعة'],
  'restaurant-equipment': ['معدات المطاعم', 'التموين والطهي', 'الطهي', 'المطابخ', 'الأجهزة الفندقية'],
  'tools-hardware': ['الأدوات', 'العدد الصناعية', 'الأدوات اليدوية', 'الحديد والأدوات', 'المعدات اليدوية'],
  'cleaning-supplies': ['التنظيف', 'مستلزمات النظافة', 'البيئة والنظافة', 'الصرف الصحي', 'النظافة'],
  'construction-contracting': ['المقاولات', 'الإنشاء والتعمير', 'البناء', 'المشاريع الإنشائية', 'التطوير'],
  'laboratory-equipment': ['المختبرات', 'معدات الأبحاث', 'التحليل المختبري', 'الأجهزة العلمية', 'المعامل'],
  'packaging-wrapping': ['التغليف', 'التعبئة والتغليف', 'صناعة الأكياس', 'الحاويات', 'التغليف الصناعي'],
  'office-equipment': ['المعدات المكتبية', 'اللوازم المكتبية', 'الأجهزة المكتبية', 'تجهيزات المكاتب', 'الأثاث المكتبي'],
  'energy-petroleum': ['الطاقة', 'البترول', 'الطاقة والبترول', 'الموارد الطبيعية', 'التنقيب'],
  'consulting-services': ['الاستشارات', 'الحلول الاستشارية', 'الخبرات الإدارية', 'الخدمات الاستشارية', 'الإدارة'],
};
const SUP_AR_SUFFIX = [
  'السعودية', 'الخليجية', 'العربية', 'للمملكة', 'للتجارة والتوريد',
  'للتوريد والتشغيل', 'المتخصصة', 'المتميزة', 'المتكاملة', 'للخدمات',
];

const SAUDI_CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar', 'Jubail', 'Abha', 'Tabuk', 'Qassim', 'Hail', 'Al-Ahsa'];
const LEGAL_FORMS = ['LLC', 'LLC', 'ESTABLISHMENT', 'LLC', 'CORPORATION', 'JOINT_STOCK'];
const SIZE_RANGES = ['1-10', '11-50', '11-50', '51-200', '51-200', '201-500', '500+'];
const PAYMENT_TERMS_OPTIONS = [
  ['Cash on Delivery', 'Net 30'],
  ['Net 30', 'Net 60'],
  ['Cash on Delivery', 'Net 30', '50% Advance'],
  ['Letter of Credit', 'Net 60', 'Net 90'],
  ['Net 30', '50% Advance', 'Letter of Credit'],
  ['Cash on Delivery'],
];

// ── 8 Named Demo Suppliers (frontend-visible slugs) ──────────────────────────
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
  legalForm?: string;
  establishmentYear?: number;
  companySizeRange?: string;
  sectors?: string[];
  keyClients?: string[];
  regionsServed?: string[];
  paymentTermsAccepted?: string[];
  productionCapacity?: string;
}

const DEMO_SUPPLIERS: SupplierSpec[] = [
  {
    slug: 'demo-1', nameAr: 'شركة الخليج للمعدات الصناعية', nameEn: 'Gulf Industrial Equipment Co.',
    city: 'Riyadh', plan: SubscriptionPlan.PRO, status: VerificationStatus.VERIFIED,
    primaryCategory: 'industrial-equipment', phone: '+966512345001', website: 'https://gulf-industrial.sa',
    legalForm: 'LLC', establishmentYear: 2008, companySizeRange: '51-200',
    sectors: ['Industrial Equipment', 'Manufacturing', 'Heavy Machinery'],
    keyClients: ['Saudi Aramco', 'SABIC', 'Maaden'],
    regionsServed: ['Riyadh', 'Eastern Province', 'Mecca'],
    paymentTermsAccepted: ['Net 30', 'Net 60', 'Letter of Credit'],
    productionCapacity: '500 units/month',
  },
  {
    slug: 'demo-2', nameAr: 'مؤسسة العمران للمواد الإنشائية', nameEn: 'Al-Omran Construction Materials',
    city: 'Jeddah', plan: SubscriptionPlan.PRO, status: VerificationStatus.VERIFIED,
    primaryCategory: 'building-materials', phone: '+966512345002', website: 'https://alomran-const.sa',
    legalForm: 'ESTABLISHMENT', establishmentYear: 2012, companySizeRange: '11-50',
    sectors: ['Building Materials', 'Construction & Contracting'],
    keyClients: ['Dar Al-Arkan', 'Emaar Saudi'],
    regionsServed: ['Mecca', 'Medina', 'Jizan'],
    paymentTermsAccepted: ['Cash on Delivery', 'Net 30', '50% Advance'],
    productionCapacity: '1000 tons/month',
  },
  {
    slug: 'demo-3', nameAr: 'الشركة الوطنية للأثاث المكتبي', nameEn: 'National Office Furniture Company',
    city: 'Riyadh', plan: SubscriptionPlan.FREE, status: VerificationStatus.VERIFIED,
    primaryCategory: 'furniture-decor', phone: '+966512345003',
    legalForm: 'LLC', establishmentYear: 2015, companySizeRange: '11-50',
    sectors: ['Furniture & Decor', 'Office Equipment'],
    regionsServed: ['Riyadh', 'Qassim'],
    paymentTermsAccepted: ['Cash on Delivery', 'Net 30'],
  },
  {
    slug: 'demo-4', nameAr: 'تقنية المستقبل للحلول الرقمية', nameEn: 'Future Tech Digital Solutions',
    city: 'Dammam', plan: SubscriptionPlan.PRO, status: VerificationStatus.VERIFIED,
    primaryCategory: 'technology-electronics', phone: '+966512345004', website: 'https://futuretech-sa.com',
    legalForm: 'LLC', establishmentYear: 2018, companySizeRange: '51-200',
    sectors: ['Technology & Electronics', 'IT Services'],
    keyClients: ['STC', 'Mobily', 'Ministry of Education'],
    regionsServed: ['Eastern Province', 'Riyadh', 'Mecca', 'Medina'],
    paymentTermsAccepted: ['Net 30', 'Net 60'],
    productionCapacity: '200 units/month',
  },
  {
    slug: 'demo-5', nameAr: 'شركة الأصيل للأغذية والمشروبات', nameEn: 'Al-Aseel Food & Beverages',
    city: 'Riyadh', plan: SubscriptionPlan.PRO, status: VerificationStatus.VERIFIED,
    primaryCategory: 'food-beverages', phone: '+966512345005', website: 'https://alaseel-food.sa',
    legalForm: 'LLC', establishmentYear: 2010, companySizeRange: '201-500',
    sectors: ['Food & Beverages', 'Agriculture & Food'],
    keyClients: ['Panda Retail', 'Carrefour KSA', 'Al-Sadhan'],
    regionsServed: ['Riyadh', 'Mecca', 'Medina', 'Jizan', 'Asir'],
    paymentTermsAccepted: ['Cash on Delivery', 'Net 30', 'Net 60'],
    productionCapacity: '50 tons/day',
  },
  {
    slug: 'demo-6', nameAr: 'مجموعة النهضة للكيماويات', nameEn: 'Al-Nahda Chemical Group',
    city: 'Jubail', plan: SubscriptionPlan.PRO, status: VerificationStatus.VERIFIED,
    primaryCategory: 'chemicals-raw-materials', phone: '+966512345006', website: 'https://alnahda-chem.sa',
    legalForm: 'CORPORATION', establishmentYear: 2005, companySizeRange: '201-500',
    sectors: ['Chemicals & Raw Materials', 'Energy & Petroleum'],
    keyClients: ['Saudi Aramco', 'SABIC', 'National Industrialization Co.'],
    regionsServed: ['Eastern Province', 'Riyadh', 'Jubail'],
    paymentTermsAccepted: ['Letter of Credit', 'Net 60', 'Net 90'],
    productionCapacity: '500 tons/month',
  },
  {
    slug: 'demo-7', nameAr: 'الفهد للمعدات الكهربائية', nameEn: 'Al-Fahd Electrical Equipment',
    city: 'Riyadh', plan: SubscriptionPlan.FREE, status: VerificationStatus.VERIFIED,
    primaryCategory: 'electrical-equipment', phone: '+966512345007',
    legalForm: 'ESTABLISHMENT', establishmentYear: 2016, companySizeRange: '1-10',
    sectors: ['Electrical Equipment'],
    regionsServed: ['Riyadh', 'Qassim', 'Hail'],
    paymentTermsAccepted: ['Cash on Delivery', '50% Advance'],
  },
  {
    slug: 'demo-8', nameAr: 'شركة السلامة للطب والرعاية', nameEn: 'Al-Salama Medical & Care',
    city: 'Khobar', plan: SubscriptionPlan.PRO, status: VerificationStatus.VERIFIED,
    primaryCategory: 'medical-devices', phone: '+966512345008', website: 'https://alsalama-medical.sa',
    legalForm: 'LLC', establishmentYear: 2013, companySizeRange: '51-200',
    sectors: ['Medical Devices', 'Safety & Security'],
    keyClients: ['King Faisal Hospital', 'Ministry of Health', 'Dr. Sulaiman Al-Habib'],
    regionsServed: ['Eastern Province', 'Riyadh', 'Mecca', 'Medina', 'Khobar'],
    paymentTermsAccepted: ['Net 30', 'Net 60', 'Letter of Credit'],
    productionCapacity: '100 units/month',
  },
  // Pending (unverified demo)
  {
    nameAr: 'شركة المورّد الجديد', nameEn: 'New Supplier Co.',
    city: 'Medina', plan: SubscriptionPlan.FREE, status: VerificationStatus.PENDING,
  },
];

// ── 80 Named Buyer Companies ───────────────────────────────────────────────────
const BUYER_NAMES: Array<{ nameAr: string; nameEn: string }> = [
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
  { nameAr: 'شركة دار الأركان للتطوير', nameEn: 'Dar Al-Arkan Development' },
  { nameAr: 'مجموعة MBC الإعلامية', nameEn: 'MBC Media Group' },
  { nameAr: 'شركة سابك للبتروكيماويات', nameEn: 'SABIC Petrochemical Co.' },
  { nameAr: 'مجموعة فلكون للطيران', nameEn: 'Falcon Aviation Group' },
  { nameAr: 'شركة المياه الوطنية', nameEn: 'National Water Co.' },
  { nameAr: 'هيئة الاستثمار السعودية', nameEn: 'Saudi Investment Authority' },
  { nameAr: 'شركة بنزة للتجزئة', nameEn: 'Banza Retail Co.' },
  { nameAr: 'مجموعة الراجحي المالية', nameEn: 'Al-Rajhi Financial Group' },
  { nameAr: 'شركة اليمامة للصناعات', nameEn: 'Al-Yamamah Industries' },
  { nameAr: 'شركة النور للخدمات', nameEn: 'Al-Nour Services Co.' },
  { nameAr: 'مجموعة طيران السعودية', nameEn: 'Saudi Airlines Group' },
  { nameAr: 'شركة القدية للترفيه', nameEn: 'Qiddiya Entertainment' },
  { nameAr: 'مشاريع NEOM الضخمة', nameEn: 'NEOM Development Projects' },
  { nameAr: 'شركة الفارس للاستثمار', nameEn: 'Al-Faris Investment Co.' },
  { nameAr: 'شركة الحرس الوطني للتموين', nameEn: 'National Guard Supply Co.' },
  { nameAr: 'شركة مدينة الملك عبدالله', nameEn: 'KAEC Development Co.' },
  { nameAr: 'مجموعة البنك الأهلي', nameEn: 'Al-Ahli Bank Group' },
  { nameAr: 'شركة الكيان للإسكان', nameEn: 'Kayan Housing Co.' },
  { nameAr: 'شركة الصفوة للفنادق', nameEn: 'Al-Safwa Hotels' },
  { nameAr: 'مجموعة جدوى للاستثمار', nameEn: 'Jadwa Investment Group' },
  { nameAr: 'شركة التقنيات الطبية', nameEn: 'Medical Technologies Co.' },
  { nameAr: 'شركة الدرع للأمن', nameEn: 'Al-Daraa Security Co.' },
  { nameAr: 'مجموعة اليسر للتمويل', nameEn: 'Al-Yusr Finance Group' },
  { nameAr: 'شركة الشرق للإنتاج', nameEn: 'Al-Sharq Production Co.' },
  { nameAr: 'شركة النهضة للتعليم', nameEn: 'Al-Nahda Education Co.' },
  { nameAr: 'شركة الوفاء للبناء', nameEn: 'Al-Wafa Construction' },
  { nameAr: 'مجموعة السوق للتجزئة', nameEn: 'Al-Souk Retail Group' },
  { nameAr: 'شركة ذروة للمقاولات', nameEn: 'Thurwa Contracting Co.' },
  { nameAr: 'شركة الأمانة للتوريد', nameEn: 'Al-Amana Supply Co.' },
  { nameAr: 'مجموعة الريم للاستثمار', nameEn: 'Al-Reem Investment Group' },
  { nameAr: 'شركة الخير للزراعة', nameEn: 'Al-Khair Agriculture Co.' },
  { nameAr: 'مجموعة التقدم للصناعة', nameEn: 'Al-Takadum Industrial Group' },
  { nameAr: 'شركة الحكمة للاستشارات', nameEn: 'Al-Hikma Consulting' },
  { nameAr: 'مجموعة الفجر للتجارة', nameEn: 'Al-Fajr Trading Group' },
  { nameAr: 'شركة البركة للغذاء', nameEn: 'Al-Baraka Food Co.' },
  { nameAr: 'شركة التوفيق للإنشاء', nameEn: 'Al-Tawfiq Construction' },
  { nameAr: 'مجموعة العز للحديد', nameEn: 'Al-Ezz Steel Group' },
  { nameAr: 'شركة الحضارة للتطوير', nameEn: 'Al-Hadara Development' },
  { nameAr: 'شركة الوسيم للتجارة', nameEn: 'Al-Waseem Trading' },
  { nameAr: 'مجموعة الأفق للاستثمار', nameEn: 'Al-Ofok Investment Group' },
  { nameAr: 'شركة الثقة للخدمات', nameEn: 'Al-Thiqa Services' },
  { nameAr: 'شركة الرائد للمواد', nameEn: 'Al-Raed Materials Co.' },
  { nameAr: 'مجموعة الأصالة للتجارة', nameEn: 'Al-Asalah Trading Group' },
  { nameAr: 'شركة المدينة للتطوير', nameEn: 'Al-Madinah Development' },
  { nameAr: 'شركة الإشراق للطاقة', nameEn: 'Al-Ishraq Energy Co.' },
  { nameAr: 'مجموعة الغد للصناعة', nameEn: 'Al-Ghad Industrial Group' },
  { nameAr: 'شركة الحصن للأمن', nameEn: 'Al-Hisn Security Co.' },
  { nameAr: 'شركة البيان للمقاولات', nameEn: 'Al-Bayan Contracting' },
  { nameAr: 'مجموعة الإمارات السعودية', nameEn: 'Saudi-Emirates Group' },
  { nameAr: 'شركة الواحة للاستثمار', nameEn: 'Al-Waha Investment' },
  { nameAr: 'شركة الأجيال للتعليم', nameEn: 'Al-Ajyal Education' },
  { nameAr: 'مجموعة الهلال للتجارة', nameEn: 'Al-Hilal Trading Group' },
  { nameAr: 'شركة المروة للفنادق', nameEn: 'Al-Marwa Hotels' },
  { nameAr: 'شركة القمة للإنشاء', nameEn: 'Al-Qimma Construction' },
  { nameAr: 'مجموعة الدوحة للمقاولات', nameEn: 'Al-Doha Contracting Group' },
  { nameAr: 'شركة الرواق للتصميم', nameEn: 'Al-Rawwaq Design Co.' },
  { nameAr: 'مجموعة الزهور للتجارة', nameEn: 'Al-Zuhoor Trading Group' },
  { nameAr: 'شركة السحاب للخدمات', nameEn: 'Al-Sahab Services Co.' },
  { nameAr: 'شركة التوج للاستثمار', nameEn: 'Al-Taj Investment Co.' },
  { nameAr: 'مجموعة الموج للمقاولات', nameEn: 'Al-Mawj Contracting Group' },
  { nameAr: 'شركة الزهراء للرعاية', nameEn: 'Al-Zahra Care Co.' },
  { nameAr: 'شركة العقيق للتطوير', nameEn: 'Al-Aqeeq Development' },
  { nameAr: 'مجموعة الإنجاز للبناء', nameEn: 'Al-Injaz Construction Group' },
];

const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

const RFQ_PROJECT_TYPES = ['PRODUCT', 'SERVICE', 'MANUFACTURING', 'CONSULTANCY'];
const RFQ_CERTIFICATIONS = ['ISO 9001', 'SASO', 'IECEE', 'SABER', 'CE', 'GS', 'UL', 'SFDA'];

const RFQ_TITLES_AR = [
  'طلب توريد مواد بناء لمشروع سكني',
  'توريد معدات صناعية للمصنع الجديد',
  'طلب توريد مواد غذائية لفندق',
  'توريد مواد كيماوية للمختبر',
  'طلب خدمات تكنولوجيا المعلومات',
  'توريد ملابس عمل للموظفين',
  'طلب توريد منتجات تنظيف',
  'توريد أثاث مكتبي للشركة',
  'طلب توريد معدات كهربائية',
  'توريد مواد تغليف للمنتجات',
  'طلب خدمات الاستشارات المالية',
  'توريد معدات السلامة للمنشأة',
  'طلب توريد خوادم ومعدات شبكات',
  'توريد أجهزة طبية متطورة',
  'طلب توريد مولدات كهربائية',
  'توريد رافعات شوكية للمستودعات',
  'طلب توريد أنظمة مراقبة',
  'توريد لوازم مطبخ تجاري',
  'طلب توريد مضخات صناعية',
  'توريد أدوات وعدد يدوية',
];
const RFQ_TITLES_EN = [
  'Request for Office Furniture Supply',
  'Laptops and Computing Equipment RFQ',
  'Logistics Services for Monthly Deliveries',
  'Medical Devices for Clinic Setup',
  'HVAC System Installation and Supply',
  'Security System Installation',
  'Restaurant Kitchen Equipment',
  'Building Materials for Warehouse',
  'Vehicle Fleet Procurement',
  'Office Supplies and Stationery',
  'Laboratory Equipment Supply',
  'Agricultural Products Supply',
  'Cleaning Services Contract',
  'Construction Materials for Bridge Project',
  'Food Processing Equipment Supply',
  'Solar Panels and Energy Solutions',
  'Industrial Safety Equipment',
  'Packaging Materials for Factory',
  'IT Infrastructure Setup',
  'Heavy Machinery Procurement',
];

const STOCK_STATUSES = ['IN_STOCK', 'IN_STOCK', 'IN_STOCK', 'LIMITED', 'OUT_OF_STOCK'];
const QUOTE_PAYMENT_TERMS = ['Net 30', 'Net 60', 'Cash on Delivery', '50% Advance', 'Letter of Credit'];
const DEAL_STATUSES_WEIGHTED: DealStatus[] = [
  DealStatus.AWARDED, DealStatus.IN_PROGRESS, DealStatus.DELIVERED,
  DealStatus.COMPLETED, DealStatus.COMPLETED, DealStatus.COMPLETED,
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
  'الدفع عند التسليم مع فاتورة ضريبية',
  'Delivery scheduled within agreed timeframe',
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
  'خدمة ما بعد البيع ممتازة',
  'Outstanding technical support',
  'سعر تنافسي جداً مع جودة عالية',
  'Will definitely use again for future orders',
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
  'متى يمكن التسليم؟ لدينا موعد نهائي',
  'Do you have stock available for immediate delivery?',
  'نطلب تأكيد العرض خلال 24 ساعة',
  'Please confirm your price validity period.',
  'هل تغطي الضمان؟ ما هي الشروط؟',
  'What is your warranty policy for this product?',
  'نشكركم على سرعة الاستجابة',
  'Your after-sales support is excellent.',
  'تم الاتفاق على الشروط، ننتظر العقد',
  'We look forward to a long-term partnership.',
];

const SEED_ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    || 'admin@mwazn.sa';
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@1234';
const SEED_SUP_PASSWORD   = process.env.SEED_SUP_PASSWORD   || 'Supplier@1234';
const SEED_BUY_PASSWORD   = process.env.SEED_BUY_PASSWORD   || 'Buyer@1234';

// ── Main Seed ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('Mwazn v4 seed starting (curated image manifest)...');

  // Clean up in FK-safe order
  await prisma.analyticsEvent.deleteMany().catch(() => {});
  await prisma.invoice.deleteMany().catch(() => {});
  await prisma.companyVerificationDocument.deleteMany().catch(() => {});
  await prisma.auditLog.deleteMany();
  await prisma.fileUpload.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.rFQInvite.deleteMany();
  await prisma.rfqImage.deleteMany();
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
  console.log(`  + ${categories.length} categories`);
  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  // ── 2. Platform Admin ─────────────────────────────────────────────────────
  console.log('  Creating platform admin...');
  await prisma.company.create({
    data: {
      nameAr: 'موازن - الإدارة', nameEn: 'Mwazn Platform',
      crNumber: '0000000001', type: CompanyType.BUYER,
      verificationStatus: VerificationStatus.VERIFIED, plan: SubscriptionPlan.PRO, city: 'Riyadh',
      users: {
        create: { email: SEED_ADMIN_EMAIL, passwordHash: hash(SEED_ADMIN_PASSWORD), fullName: 'Platform Admin', role: Role.PLATFORM_ADMIN },
      },
    },
  });

  // ── 3. Supplier Companies (demo + auto-generated = ~120) ─────────────────
  console.log('  Creating supplier companies...');
  const supplierCompanies: any[] = [];

  // 3a. 9 named demo suppliers
  for (let i = 0; i < DEMO_SUPPLIERS.length; i++) {
    const s = DEMO_SUPPLIERS[i];
    const cr = String(1000000010 + i).padStart(10, '0');
    const email = `admin@supplier${i + 1}.sa`;
    const vatNum = `3${String(1000000010 + i).padStart(9, '0')}00003`;
    const company = await prisma.company.create({
      data: {
        nameAr: s.nameAr, nameEn: s.nameEn, crNumber: cr,
        slug: s.slug ?? null, type: CompanyType.SUPPLIER,
        verificationStatus: s.status, plan: s.plan, city: s.city,
        phone: s.phone ?? `+9665${randInt(10000000, 99999999)}`,
        website: s.website ?? null,
        logoUrl: s.status === VerificationStatus.VERIFIED ? logoImg(i + 10) : null,
        descriptionAr: `نحن ${s.nameAr} — نقدم منتجات وخدمات عالية الجودة في المملكة العربية السعودية. نلتزم بأعلى معايير الجودة والخدمة لعملائنا.`,
        descriptionEn: `${s.nameEn} — delivering premium products and services across Saudi Arabia. Committed to the highest quality standards.`,
        vatNumber: vatNum, crExpiryDate: new Date(Date.now() + randInt(365, 1095) * 86400_000),
        legalForm: s.legalForm ?? rand(LEGAL_FORMS), establishmentYear: s.establishmentYear ?? randInt(2005, 2020),
        companySizeRange: s.companySizeRange ?? rand(SIZE_RANGES), sectors: s.sectors ?? [],
        keyClients: s.keyClients ?? [], regionsServed: s.regionsServed ?? [s.city],
        paymentTermsAccepted: s.paymentTermsAccepted ?? rand(PAYMENT_TERMS_OPTIONS),
        productionCapacity: s.productionCapacity ?? null,
        users: {
          create: { email, passwordHash: hash(SEED_SUP_PASSWORD), fullName: `مدير ${s.nameAr}`.slice(0, 50), role: Role.SUPPLIER_ADMIN },
        },
      },
      include: { users: true },
    });
    supplierCompanies.push(company);
  }

  // 3b. Auto-generate ~111 more suppliers (total ~120)
  const extraSupplierCount = 111;
  for (let i = 0; i < extraSupplierCount; i++) {
    const idx = DEMO_SUPPLIERS.length + i;
    const catSlug = CATEGORY_SLUGS[i % CATEGORY_SLUGS.length];
    const midfix = SUP_AR_MIDFIX_BY_CAT[catSlug] ?? ['التجارة'];
    const nameAr = `${rand(SUP_AR_PREFIX)} ${rand(midfix)} ${rand(SUP_AR_SUFFIX)}`;
    const nameEn = `${rand(['Al-', 'Saudi ', 'Gulf ', 'Arabian ', 'National '])}${rand(['Trade', 'Supply', 'Industry', 'Solutions', 'Group', 'Co.', 'Est.'])} ${i + 10}`;
    const cr = String(1000000010 + idx).padStart(10, '0');
    const email = `admin@supplier${idx + 1}.sa`;
    const vatNum = `3${String(1000000010 + idx).padStart(9, '0')}00003`;
    const isPro = Math.random() < 0.4;
    const city = rand(SAUDI_CITIES);
    const company = await prisma.company.create({
      data: {
        nameAr, nameEn, crNumber: cr, type: CompanyType.SUPPLIER,
        verificationStatus: VerificationStatus.VERIFIED,
        plan: isPro ? SubscriptionPlan.PRO : SubscriptionPlan.FREE,
        city, phone: `+9665${randInt(10000000, 99999999)}`,
        logoUrl: logoImg(idx + 1),
        descriptionAr: `${nameAr} — شركة سعودية متخصصة في توريد المنتجات والخدمات بأعلى معايير الجودة.`,
        descriptionEn: `${nameEn} — Saudi company specialized in premium product supply and services.`,
        vatNumber: vatNum, crExpiryDate: new Date(Date.now() + randInt(180, 1095) * 86400_000),
        legalForm: rand(LEGAL_FORMS), establishmentYear: randInt(2003, 2022),
        companySizeRange: rand(SIZE_RANGES), sectors: [catBySlug[catSlug]?.nameEn ?? catSlug],
        regionsServed: [city, rand(SAUDI_CITIES)].filter((v, i, a) => a.indexOf(v) === i),
        paymentTermsAccepted: rand(PAYMENT_TERMS_OPTIONS),
        users: {
          create: { email, passwordHash: hash(SEED_SUP_PASSWORD), fullName: nameAr.slice(0, 50), role: Role.SUPPLIER_ADMIN },
        },
      },
      include: { users: true },
    });
    supplierCompanies.push(company);
  }
  console.log(`  + ${supplierCompanies.length} supplier companies`);

  // ── 4. Buyer Companies (80 total) ─────────────────────────────────────────
  console.log('  Creating buyer companies...');
  const buyerCompanies: any[] = [];
  for (let i = 0; i < BUYER_NAMES.length; i++) {
    const b = BUYER_NAMES[i];
    const cr = String(2000000010 + i).padStart(10, '0');
    const email = `admin@buyer${i + 1}.sa`;
    const company = await prisma.company.create({
      data: {
        nameAr: b.nameAr, nameEn: b.nameEn, crNumber: cr,
        type: CompanyType.BUYER, verificationStatus: VerificationStatus.VERIFIED,
        plan: SubscriptionPlan.FREE, city: rand(SAUDI_CITIES),
        phone: `+9665${randInt(10000000, 99999999)}`,
        users: {
          create: { email, passwordHash: hash(SEED_BUY_PASSWORD), fullName: `مدير ${b.nameAr}`.slice(0, 50), role: Role.BUYER_ADMIN },
        },
      },
      include: { users: true },
    });
    buyerCompanies.push(company);
  }
  console.log(`  + ${buyerCompanies.length} buyer companies`);

  const verifiedSuppliers = supplierCompanies.filter((s) => s.verificationStatus === VerificationStatus.VERIFIED);

  // ── 5. Listings (~7 per verified supplier = 840+) ─────────────────────────
  console.log('  Creating listings...');
  let listingCount = 0;
  let imgSeed = 100;
  const allListings: any[] = [];

  for (let i = 0; i < verifiedSuppliers.length; i++) {
    const company = verifiedSuppliers[i];
    const specIdx = i < DEMO_SUPPLIERS.length ? i : null;
    const primaryCatSlug = specIdx !== null ? DEMO_SUPPLIERS[specIdx]?.primaryCategory : CATEGORY_SLUGS[i % CATEGORY_SLUGS.length];
    const count = randInt(6, 9);

    for (let j = 0; j < count; j++) {
      let cat: (typeof categories)[0];
      if (primaryCatSlug && j < Math.ceil(count * 0.6)) {
        cat = catBySlug[primaryCatSlug] ?? rand(categories);
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

      const sku = `SKU-${cat.slug.slice(0, 3).toUpperCase()}-${String(imgSeed).padStart(4, '0')}`;
      const vatPct = rand([0, 15, 15, 15]);
      const requestQuoteOnly = price > 50000 && Math.random() < 0.3;
      const specs = [
        { key: 'Brand', value: rand(['Saudi Made', 'Imported', 'Gulf Product', 'European Brand']) },
        { key: 'Warranty', value: `${randInt(1, 3)} year${randInt(1, 3) > 1 ? 's' : ''}` },
        { key: 'Origin', value: rand(['Saudi Arabia', 'UAE', 'China', 'Germany', 'USA', 'Korea']) },
      ];

      const listing = await prisma.listing.create({
        data: {
          titleAr, titleEn,
          descriptionAr: `${titleAr} عالي الجودة من ${company.nameAr}. مطابق للمعايير السعودية، مثالي للشركات والمؤسسات.`,
          descriptionEn: `Premium ${titleEn} from ${company.nameEn}. Saudi-standard compliant, ideal for B2B procurement.`,
          price: requestQuoteOnly ? undefined : price,
          priceTo: requestQuoteOnly ? undefined : (Math.random() < 0.3 ? price * 1.2 : undefined),
          currency: 'SAR', unit, minOrderQty: randInt(1, 50), leadTimeDays: randInt(3, 30),
          supplierId: company.id, categoryId: cat.id, status: 'ACTIVE',
          sku, vatPercent: vatPct, stockAvailability: rand(STOCK_STATUSES),
          requestQuoteOnly, specsJson: specs,
          images: {
            create: (() => {
              const [primary, detail] = getProductImages(titleEn, cat.slug);
              return [
                { url: primary, alt: titleEn, isPrimary: true, sortOrder: 0 },
                { url: detail, alt: `${titleEn} detail`, isPrimary: false, sortOrder: 1 },
              ];
            })(),
          },
        },
      });
      allListings.push(listing);
      imgSeed++;
      listingCount++;
    }
  }
  console.log(`  + ${listingCount} listings`);

  // ── 6. RFQs (400 total) ────────────────────────────────────────────────────
  console.log('  Creating RFQs...');
  const rfqs: any[] = [];
  for (let i = 0; i < 400; i++) {
    const buyer = rand(buyerCompanies);
    const cat = rand(categories);
    const isOpen = i < 150; // first 150 OPEN, rest mixed
    const budgetBase = randPrice(10000, 500000);
    const budgetMin = Math.round(budgetBase * 0.7);
    const budgetMax = Math.round(budgetBase * 1.3);
    const titleList = i % 2 === 0 ? RFQ_TITLES_AR : RFQ_TITLES_EN;
    const rfqCerts = Math.random() < 0.4
      ? [rand(RFQ_CERTIFICATIONS), rand(RFQ_CERTIFICATIONS)].filter((v, idx, arr) => arr.indexOf(v) === idx)
      : [];
    const rfq = await prisma.rFQ.create({
      data: {
        title: titleList[i % titleList.length],
        description: `نطلب تقديم عروض أسعار لـ ${titleList[i % titleList.length]}. يجب أن تتوافق المنتجات مع المعايير السعودية وتكون معتمدة من الجهات المختصة.`,
        categoryId: cat.id, buyerId: buyer.id,
        quantity: randInt(10, 1000), unit: rand(['unit', 'ton', 'piece', 'box', 'meter', 'sqm', 'set']),
        budget: budgetBase, budgetMin, budgetMax,
        budgetUndisclosed: Math.random() < 0.15, currency: 'SAR',
        vatIncluded: Math.random() < 0.5,
        deadline: new Date(Date.now() + randInt(7, 60) * 86400_000),
        expectedStartDate: new Date(Date.now() + randInt(30, 90) * 86400_000),
        projectType: rand(RFQ_PROJECT_TYPES),
        ndaRequired: Math.random() < 0.25,
        siteVisitRequired: Math.random() < 0.2,
        locationRequirement: Math.random() < 0.2 ? rand(SAUDI_CITIES) : null,
        requiredCertifications: rfqCerts,
        visibility: Math.random() < 0.85 ? 'PUBLIC' : 'INVITE_ONLY',
        allowPartialBids: Math.random() < 0.7,
        status: isOpen
          ? RFQStatus.OPEN
          : rand([RFQStatus.AWARDED, RFQStatus.AWARDED, RFQStatus.CLOSED, RFQStatus.CANCELLED]),
      },
    });
    rfqs.push(rfq);
  }
  console.log(`  + ${rfqs.length} RFQs`);

  // ── 7. Quotes (400+ total) ────────────────────────────────────────────────
  console.log('  Creating quotes...');
  const quotes: any[] = [];
  const openOrAwarded = rfqs.filter((r) => r.status === RFQStatus.OPEN || r.status === RFQStatus.AWARDED);
  const usedPairs = new Set<string>();

  for (const rfq of openOrAwarded) {
    const quoteCount = randInt(2, 5);
    const shuffled = [...verifiedSuppliers].sort(() => Math.random() - 0.5);
    let submitted = 0;
    for (const supplier of shuffled) {
      if (submitted >= quoteCount) break;
      const pairKey = `${rfq.id}-${supplier.id}`;
      if (usedPairs.has(pairKey)) continue;
      usedPairs.add(pairKey);

      const status = rfq.status === RFQStatus.AWARDED
        ? rand([QuoteStatus.ACCEPTED, QuoteStatus.REJECTED, QuoteStatus.PENDING])
        : QuoteStatus.PENDING;

      const quote = await prisma.quote.create({
        data: {
          rfqId: rfq.id, supplierId: supplier.id,
          price: randPrice(Number(rfq.budget) * 0.5, Number(rfq.budget) * 1.2),
          currency: 'SAR', deliveryDays: randInt(3, 30),
          notes: rand(QUOTE_NOTES), status,
          validUntil: new Date(Date.now() + randInt(14, 30) * 86400_000),
          vatPercent: 15,
          paymentTerms: rand(QUOTE_PAYMENT_TERMS),
          warrantyMonths: rand([0, 12, 24, 36]),
          afterSalesSupport: Math.random() < 0.5
            ? 'Technical support provided for 12 months post-delivery' : null,
          technicalProposal: Math.random() < 0.4
            ? 'We propose a phased delivery approach ensuring quality at each stage.' : null,
        },
      });
      quotes.push(quote);
      submitted++;
    }
  }
  console.log(`  + ${quotes.length} quotes`);

  // ── 8. Deals ──────────────────────────────────────────────────────────────
  console.log('  Creating deals...');
  const deals: any[] = [];
  const usedQuoteIds = new Set<string>();

  // First create deals from accepted quotes
  const acceptedQuotes = quotes.filter((q) => q.status === QuoteStatus.ACCEPTED);
  for (const q of acceptedQuotes) {
    if (usedQuoteIds.has(q.id)) continue;
    usedQuoteIds.add(q.id);
    const rfq = rfqs.find((r) => r.id === q.rfqId);
    if (!rfq) continue;
    deals.push(await prisma.deal.create({
      data: {
        quoteId: q.id, buyerId: rfq.buyerId, supplierId: q.supplierId,
        totalAmount: q.price, currency: q.currency,
        status: rand(DEAL_STATUSES_WEIGHTED), notes: rand(DEAL_NOTES),
      },
    }));
  }

  // Backfill deals from any quote to reach 200
  for (const q of quotes) {
    if (deals.length >= 200) break;
    if (usedQuoteIds.has(q.id)) continue;
    usedQuoteIds.add(q.id);
    const rfq = rfqs.find((r) => r.id === q.rfqId);
    if (!rfq) continue;
    deals.push(await prisma.deal.create({
      data: {
        quoteId: q.id, buyerId: rfq.buyerId, supplierId: q.supplierId,
        totalAmount: q.price, currency: q.currency,
        status: rand(DEAL_STATUSES_WEIGHTED), notes: rand(DEAL_NOTES),
      },
    }));
  }
  console.log(`  + ${deals.length} deals`);

  // ── 9. Ratings (two-way: buyer ↔ supplier for COMPLETED deals) ────────────
  console.log('  Creating ratings...');
  const completedDeals = deals.filter((d) => d.status === DealStatus.COMPLETED);
  let ratingCount = 0;
  for (const deal of completedDeals) {
    // Buyer rates supplier
    await prisma.rating.create({
      data: {
        dealId: deal.id, raterId: deal.buyerId, ratedId: deal.supplierId,
        score: randInt(3, 5), comment: rand(RATING_COMMENTS),
      },
    });
    ratingCount++;
    // Supplier rates buyer (80% of the time)
    if (Math.random() < 0.8) {
      await prisma.rating.create({
        data: {
          dealId: deal.id, raterId: deal.supplierId, ratedId: deal.buyerId,
          score: randInt(3, 5), comment: rand(RATING_COMMENTS),
        },
      });
      ratingCount++;
    }
  }
  // Backfill ratings to reach 300+ — rate on DELIVERED deals too
  const deliveredDeals = deals.filter((d) => d.status === DealStatus.DELIVERED);
  const usedRatingDealIds = new Set(completedDeals.map((d: any) => d.id));
  for (const deal of deliveredDeals) {
    if (ratingCount >= 320) break;
    if (usedRatingDealIds.has(deal.id)) continue;
    usedRatingDealIds.add(deal.id);
    await prisma.rating.create({
      data: {
        dealId: deal.id, raterId: deal.buyerId, ratedId: deal.supplierId,
        score: randInt(3, 5), comment: rand(RATING_COMMENTS),
      },
    });
    ratingCount++;
    if (Math.random() < 0.7) {
      await prisma.rating.create({
        data: {
          dealId: deal.id, raterId: deal.supplierId, ratedId: deal.buyerId,
          score: randInt(3, 5), comment: rand(RATING_COMMENTS),
        },
      });
      ratingCount++;
    }
  }
  console.log(`  + ${ratingCount} ratings`);

  // ── 10. Conversations & Messages ──────────────────────────────────────────
  console.log('  Creating conversations and messages...');
  const convPairs = new Set<string>();
  let convCount = 0;
  let msgCount = 0;

  // Create conversations for all deals (deal-context chat)
  for (const deal of deals) {
    const key = `${deal.buyerId}-${deal.supplierId}`;
    if (convPairs.has(key)) continue;
    convPairs.add(key);

    const rfq = rfqs.find((r) => r.id === quotes.find((q) => q.id === deal.quoteId)?.rfqId);
    const subject = rfq ? `مراسلة بشأن: ${rfq.title}` : `مراسلة بشأن صفقة رقم ${convCount + 1}`;
    const buyer = buyerCompanies.find((b) => b.id === deal.buyerId);
    const supplier = verifiedSuppliers.find((s) => s.id === deal.supplierId);
    if (!buyer || !supplier) continue;

    const conv = await prisma.conversation.create({
      data: {
        subject,
        participants: { connect: [{ id: deal.buyerId }, { id: deal.supplierId }] },
      },
    });
    convCount++;

    const buyerUser = buyer.users[0];
    const supplierUser = supplier.users[0];
    const numMsgs = randInt(4, 10);
    for (let m = 0; m < numMsgs; m++) {
      const sender = m % 2 === 0 ? buyerUser : supplierUser;
      await prisma.message.create({
        data: {
          conversationId: conv.id, senderId: sender.id,
          body: rand(MSG_BODIES), isRead: m < numMsgs - 1,
        },
      });
      msgCount++;
    }
  }

  // Additional general inquiry conversations (target 2000+ total messages)
  const targetExtraConvs = 350;
  let attempts = 0;
  while (convCount < deals.length + targetExtraConvs && attempts < 2000) {
    attempts++;
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
    const numMsgs = randInt(3, 7);
    for (let m = 0; m < numMsgs; m++) {
      const sender = m % 2 === 0 ? buyerUser : supplierUser;
      await prisma.message.create({
        data: {
          conversationId: conv.id, senderId: sender.id,
          body: rand(MSG_BODIES), isRead: m < numMsgs - 1,
        },
      });
      msgCount++;
    }
  }
  console.log(`  + ${convCount} conversations, ${msgCount} messages`);

  // ── 11. Run initial supplier scoring ──────────────────────────────────────
  console.log('  Computing initial supplier scores...');
  for (const sup of verifiedSuppliers) {
    // Simple inline score (full scoring runs via cron in production)
    const listingCountForSup = allListings.filter((l) => l.supplierId === sup.id).length;
    const dealsForSup = deals.filter((d) => d.supplierId === sup.id);
    const completedForSup = dealsForSup.filter((d) => d.status === DealStatus.COMPLETED).length;
    const completionRate = dealsForSup.length > 0 ? completedForSup / dealsForSup.length : 0;
    const ratingsForSup = await prisma.rating.findMany({ where: { ratedId: sup.id } });
    const avgRating = ratingsForSup.length > 0
      ? ratingsForSup.reduce((s, r) => s + r.score, 0) / ratingsForSup.length : 0;

    let score = sup.verificationStatus === VerificationStatus.VERIFIED ? 30 : 0;
    if (sup.plan === SubscriptionPlan.PRO) score += 20;
    score += Math.min(avgRating * 5, 25);
    score += Math.min(completionRate * 15, 15);
    score += Math.min(listingCountForSup, 10);

    await prisma.company.update({
      where: { id: sup.id },
      data: { supplierScore: Math.round(score), scoreUpdatedAt: new Date() },
    });
  }
  console.log('  + supplier scores computed');

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\nMwazn v3 seed complete!');
  console.log('-'.repeat(60));
  console.log('Demo Credentials:');
  console.log(`  Admin     -> ${SEED_ADMIN_EMAIL}  /  ${SEED_ADMIN_PASSWORD}`);
  console.log(`  Buyer     -> admin@buyer1.sa  /  ${SEED_BUY_PASSWORD}`);
  console.log(`  Supplier (PRO+Verified)  -> admin@supplier1.sa  /  ${SEED_SUP_PASSWORD}`);
  console.log(`  Supplier (FREE+Verified) -> admin@supplier3.sa  /  ${SEED_SUP_PASSWORD}`);
  console.log(`  Supplier (Unverified)    -> admin@supplier9.sa  /  ${SEED_SUP_PASSWORD}`);
  console.log('-'.repeat(60));
  console.log('Showroom URLs:');
  console.log('  http://localhost:3000/en/suppliers/demo-1  (Gulf Industrial)');
  console.log('  http://localhost:3000/en/suppliers/demo-8  (Al-Salama Medical)');
  console.log('-'.repeat(60));
  console.log(`Categories:    ${categories.length}`);
  console.log(`Suppliers:     ${supplierCompanies.length} (${verifiedSuppliers.length} verified)`);
  console.log(`Buyers:        ${buyerCompanies.length}`);
  console.log(`Listings:      ${listingCount}`);
  console.log(`RFQs:          ${rfqs.length}`);
  console.log(`Quotes:        ${quotes.length}`);
  console.log(`Deals:         ${deals.length} (${completedDeals.length} completed)`);
  console.log(`Ratings:       ${ratingCount}`);
  console.log(`Conversations: ${convCount}`);
  console.log(`Messages:      ${msgCount}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
