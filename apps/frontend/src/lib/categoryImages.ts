/**
 * Category-specific product image utility.
 *
 * For investor-demo quality: all listing images are resolved to
 * category-accurate Unsplash photos regardless of what is stored in the DB.
 * This guarantees visual coherence across all catalog surfaces.
 *
 * Mirrors the image manifest in apps/backend/prisma/seed.ts.
 */

const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=80`;

// 5-6 images per category for meaningful variation across product cards.
const CATEGORY_IMAGES: Record<string, string[]> = {
  'industrial-equipment': [
    U('1581091226825-a6a2a5aee158'), U('1558618666-fcd25c85cd64'),
    U('1504917595217-d4dc5ebe6122'), U('1565982308-c0b8-4f8b-8c97-f6fb6a621e5a'),
    U('1485827404703-89b55fcc595e'), U('1504328345951-1a09de2b4e6f'),
  ],
  'building-materials': [
    U('1504307651254-35680f356dfd'), U('1530041539828-114de669390e'),
    U('1578575437130-527eed3abbec'), U('1509803874385-db7a23559753'),
    U('1506905925346-21bda4d32df4'), U('1541888946425-d81bb19240f5'),
  ],
  'furniture-decor': [
    U('1524758631624-e2822e304c36'), U('1555041469-a586c61ea9bc'),
    U('1501854140801-50d01698950b'), U('1493663284031-b7c3b07c5ac3'),
    U('1540518614846-7eded433c457'), U('1586023492125-27b2c045efd3'),
  ],
  'technology-electronics': [
    U('1517336714731-489689fd1ca8'), U('1593642632559-0c6d3fc62b89'),
    U('1605289982774-9a6fef564df8'), U('1498049794561-7780e7231661'),
    U('1518770660439-4636190af475'), U('1561883088-039e53143d73'),
  ],
  'food-beverages': [
    U('1462206092226-f46025ffe607'), U('1474979266404-7eaacbcd87c5'),
    U('1512621776951-a57141f2eefd'), U('1490818715544-2e4a5f6e3e80'),
    U('1606914501449-3b9f5c6a6a00'), U('1559839734-2b71ea197ec2'),
  ],
  'chemicals-raw-materials': [
    U('1532187643603-ba119ca4109e'), U('1585776245991-cf89dd7fc73a'),
    U('1519389950473-47ba0277781c'), U('1507003211169-0a1dd7228f2d'),
    U('1550159930-40066082a4fc'), U('1560785477-d43d2b1a4aef'),
  ],
  'electrical-equipment': [
    U('1559209172-0ff8f6d49ff7'), U('1497435334941-8c899ee9e8e9'),
    U('1635070041078-e363dbe005cb'), U('1558611439-7b4b7f1b5b3a'),
    U('1567427363823-a61161e6e3b1'), U('1581092918056-0c4c3acd3789'),
  ],
  'medical-devices': [
    U('1576091160399-112ba8d25d1d'), U('1542282088-fe8426682b8f'),
    U('1631815589968-fdb09a223b1e'), U('1584036553516-bf83210aa96c'),
    U('1612349317150-e413f6a5b16d'), U('1530026186672-2cd00ffc50d7'),
  ],
  'energy-petroleum': [
    U('1497435334941-8c899ee9e8e9'), U('1559209172-0ff8f6d49ff7'),
    U('1558618666-fcd25c85cd64'), U('1504328345951-1a09de2b4e6f'),
    U('1466611653911-0628d2cc08ce'), U('1581091226825-a6a2a5aee158'),
  ],
  'logistics-transport': [
    U('1581091226825-a6a2a5aee158'), U('1519389950473-47ba0277781c'),
    U('1581578731548-c64695cc6952'), U('1504917595217-d4dc5ebe6122'),
    U('1558618666-fcd25c85cd64'), U('1578575437130-527eed3abbec'),
  ],
  'safety-security': [
    U('1516975080664-ed2fc6a32937'), U('1581091226825-a6a2a5aee158'),
    U('1558618666-fcd25c85cd64'), U('1504917595217-d4dc5ebe6122'),
    U('1526374965328-7f61d4dc18c5'), U('1559209172-0ff8f6d49ff7'),
  ],
  'agriculture-food': [
    U('1462206092226-f46025ffe607'), U('1512621776951-a57141f2eefd'),
    U('1474979266404-7eaacbcd87c5'), U('1574943320219-4f9e4f5e9a59'),
    U('1531261996826-a9e38a6b9f69'), U('1559839734-2b71ea197ec2'),
  ],
  'it-services': [
    U('1593642632559-0c6d3fc62b89'), U('1517336714731-489689fd1ca8'),
    U('1605289982774-9a6fef564df8'), U('1498049794561-7780e7231661'),
    U('1519389950473-47ba0277781c'), U('1561883088-039e53143d73'),
  ],
  'hvac-equipment': [
    U('1558618666-fcd25c85cd64'), U('1519389950473-47ba0277781c'),
    U('1581091226825-a6a2a5aee158'), U('1504917595217-d4dc5ebe6122'),
    U('1559209172-0ff8f6d49ff7'), U('1585776245991-cf89dd7fc73a'),
  ],
  'vehicles-automotive': [
    U('1581578731548-c64695cc6952'), U('1504917595217-d4dc5ebe6122'),
    U('1558618666-fcd25c85cd64'), U('1519389950473-47ba0277781c'),
    U('1485827404703-89b55fcc595e'), U('1565982308-c0b8-4f8b-8c97-f6fb6a621e5a'),
  ],
  'paper-printing': [
    U('1605289982774-9a6fef564df8'), U('1517336714731-489689fd1ca8'),
    U('1586528116311-ad8dd3c8310d'), U('1498049794561-7780e7231661'),
    U('1501854140801-50d01698950b'), U('1593642632559-0c6d3fc62b89'),
  ],
  'restaurant-equipment': [
    U('1462206092226-f46025ffe607'), U('1558618666-fcd25c85cd64'),
    U('1504917595217-d4dc5ebe6122'), U('1474979266404-7eaacbcd87c5'),
    U('1512621776951-a57141f2eefd'), U('1490818715544-2e4a5f6e3e80'),
  ],
  'tools-hardware': [
    U('1504917595217-d4dc5ebe6122'), U('1558618666-fcd25c85cd64'),
    U('1581091226825-a6a2a5aee158'), U('1565982308-c0b8-4f8b-8c97-f6fb6a621e5a'),
    U('1485827404703-89b55fcc595e'), U('1504328345951-1a09de2b4e6f'),
  ],
  'cleaning-supplies': [
    U('1572635196237-14b3f281503f'), U('1586528116311-ad8dd3c8310d'),
    U('1581578731548-c64695cc6952'), U('1585776245991-cf89dd7fc73a'),
    U('1532187643603-ba119ca4109e'), U('1519389950473-47ba0277781c'),
  ],
  'construction-contracting': [
    U('1504307651254-35680f356dfd'), U('1530041539828-114de669390e'),
    U('1558618666-fcd25c85cd64'), U('1509803874385-db7a23559753'),
    U('1578575437130-527eed3abbec'), U('1506905925346-21bda4d32df4'),
  ],
  'laboratory-equipment': [
    U('1532187643603-ba119ca4109e'), U('1593642632559-0c6d3fc62b89'),
    U('1605289982774-9a6fef564df8'), U('1576091160399-112ba8d25d1d'),
    U('1584036553516-bf83210aa96c'), U('1530026186672-2cd00ffc50d7'),
  ],
  'packaging-wrapping': [
    U('1581578731548-c64695cc6952'), U('1586528116311-ad8dd3c8310d'),
    U('1504917595217-d4dc5ebe6122'), U('1572635196237-14b3f281503f'),
    U('1558618666-fcd25c85cd64'), U('1519389950473-47ba0277781c'),
  ],
  'office-equipment': [
    U('1517336714731-489689fd1ca8'), U('1501854140801-50d01698950b'),
    U('1605289982774-9a6fef564df8'), U('1593642632559-0c6d3fc62b89'),
    U('1498049794561-7780e7231661'), U('1561883088-039e53143d73'),
  ],
  'clothing-textiles': [
    U('1586528116311-ad8dd3c8310d'), U('1572635196237-14b3f281503f'),
    U('1516975080664-ed2fc6a32937'), U('1512201796-0be9d9f6b0df'),
    U('1558769132-98efccf72e8a'), U('1515886657613-9f3515b0c78f'),
  ],
  'consulting-services': [
    U('1441986380878-c4248f5b8b5b'), U('1507003211169-0a1dd7228f2d'),
    U('1524758631624-e2822e304c36'), U('1522202176988-66273c2fd55f'),
    U('1560472354-b33ff0c44a43'), U('1519389950473-47ba0277781c'),
  ],
};

const DEFAULT_IMAGES = [
  U('1581578731548-c64695cc6952'),
  U('1586528116311-ad8dd3c8310d'),
  U('1516975080664-ed2fc6a32937'),
  U('1504917595217-d4dc5ebe6122'),
  U('1558618666-fcd25c85cd64'),
  U('1519389950473-47ba0277781c'),
];

/**
 * Stable non-cryptographic hash of a string → non-negative integer.
 * Used to pick a deterministic but varied image index per product ID.
 */
function stableHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) & 0x7fffffff;
  }
  return h;
}

/** @deprecated No longer needed — all images now go through category resolution. */
export function isPicsumPlaceholder(url: string): boolean {
  return url.includes('picsum.photos');
}

/**
 * Gets a category-appropriate image URL.
 * @param categorySlug - e.g. 'building-materials'
 * @param index - cycles through the pool; or pass productId via resolveListingImage for stable hash
 */
export function getCategoryImage(categorySlug: string, index = 0): string {
  const pool = CATEGORY_IMAGES[categorySlug] ?? DEFAULT_IMAGES;
  return pool[index % pool.length];
}

/**
 * Resolves the display image for a listing.
 *
 * Always returns a category-accurate image for investor-demo quality.
 * The stored `imageUrl` is ignored — all catalog surfaces use curated
 * Unsplash photos mapped to the product category.
 *
 * @param imageUrl   - ignored (kept for call-site compatibility)
 * @param categorySlug - product category slug for image selection
 * @param index      - fallback index if productId is not provided
 * @param productId  - product/listing ID for stable hash-based variety
 */
export function resolveListingImage(
  imageUrl: string | null | undefined,
  categorySlug: string | null | undefined,
  index = 0,
  productId?: string,
): string {
  const pool = CATEGORY_IMAGES[categorySlug ?? ''] ?? DEFAULT_IMAGES;
  const i = productId !== undefined ? stableHash(productId) : index;
  return pool[i % pool.length];
}
