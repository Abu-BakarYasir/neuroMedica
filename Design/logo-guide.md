# Logo Guide for Neuro Medica

## Overview
This guide provides recommendations for logo design and implementation for **Neuro Medica** - an Explainable AI platform for Medical Education.

---

## Logo Types & Recommendations

### 1. **Wordmark Logo** (Text-Based)
**Best for:** Navigation bar, headers, professional branding

**Design Elements:**
- Font: Modern, clean sans-serif (Inter font family matches your app)
- Style: Bold or semibold weight
- Color: 
  - Primary: `#212121` (dark gray) for light backgrounds
  - Gradient: Use your brand gradient (`#FFA8C8` → `#FF4F34`) for emphasis
- Size: Responsive, typically 24-32px height

**Current Implementation:**
- Navigation bar uses text-only: "Neuro Medica"
- Sidebar uses SVG logo: `/assets/icons/Logo.svg` (156px × 24px)

---

### 2. **Symbol/Icon Logo** (Pictorial)
**Best for:** Favicon, app icon, collapsed sidebar, mobile apps

**Design Concepts:**
- **Brain/Neural Network**: Abstract brain shape with neural connections
- **Medical Cross + AI**: Stylized medical cross integrated with circuit/neural patterns
- **Neural Network**: Interconnected nodes representing AI and medical data
- **Abstract Geometric**: Modern geometric shapes suggesting both medical precision and AI intelligence

**Recommended Style:**
- Minimalist, recognizable at small sizes (16x16px)
- Works in monochrome (for favicons)
- Scalable to large sizes (app icons)

---

### 3. **Combination Logo** (Symbol + Wordmark)
**Best for:** Main branding, landing pages, marketing materials

**Layout Options:**
- **Horizontal**: Symbol on left, text on right (best for navigation)
- **Vertical**: Symbol on top, text below (best for centered headers)
- **Stacked**: Symbol above text (best for mobile)

**Current Usage:**
- Sidebar uses combination logo (156px × 24px)
- Navigation uses text-only (can be upgraded to combination)

---

### 4. **Lettermark Logo** (Monogram)
**Best for:** Favicon, social media profile pictures, compact spaces

**Design:**
- "NM" monogram
- Stylized letters with medical/AI theme
- Works at very small sizes (16x16px)

---

## Design Recommendations

### Color Palette
Based on your existing brand colors:

**Primary Colors:**
- Orange: `#E55A2A` (Primary brand color)
- Gradient: `#FFA8C8` → `#F58947` → `#F47325` → `#FF4F34`
- Dark Gray: `#212121` (Text)
- Medium Gray: `#525252` (Secondary text)

**Logo Color Options:**
1. **Full Color**: Use gradient for symbol, dark text for wordmark
2. **Monochrome**: Single color version for dark/light mode
3. **Gradient**: Apply gradient to entire logo for emphasis

### Typography
- **Font Family**: Inter (already in use)
- **Weights**: 
  - Semibold (600) for logo text
  - Bold (700) for emphasis
- **Letter Spacing**: 0.5% (matches your design system)

### Style Guidelines
- **Modern & Clean**: Reflects medical precision and AI sophistication
- **Professional**: Appropriate for healthcare/education context
- **Scalable**: Works from 16px (favicon) to 200px+ (hero sections)
- **Versatile**: Works on light and dark backgrounds

---

## Logo Formats & Sizes

### Required Logo Files

#### 1. **SVG (Scalable Vector Graphics)** ⭐ Recommended
**Use for:** Main logo, navigation, sidebar
- **Advantages**: Scalable, small file size, crisp at any size
- **File**: `Logo.svg`
- **Current**: `/assets/icons/Logo.svg` (156px × 24px)

#### 2. **PNG (Raster Images)**
**Use for:** Fallback, email signatures, documents
- **Sizes needed:**
  - `logo-16.png` (16×16) - Favicon
  - `logo-32.png` (32×32) - Favicon
  - `logo-64.png` (64×64) - App icon
  - `logo-128.png` (128×128) - App icon
  - `logo-256.png` (256×256) - High-res app icon
  - `logo-512.png` (512×512) - App store icon
  - `logo-full.png` (800×200) - Full logo for documents

#### 3. **Favicon**
**Use for:** Browser tab icon
- **Sizes**: 16×16, 32×32, 48×48
- **Format**: `.ico` or `.png`
- **Current**: `/app/favicon.ico`

#### 4. **Apple Touch Icon**
**Use for:** iOS home screen
- **Size**: 180×180px
- **File**: `apple-touch-icon.png`
- **Location**: `/public/` or `/app/`

#### 5. **Open Graph Image**
**Use for:** Social media sharing (Facebook, Twitter, LinkedIn)
- **Size**: 1200×630px
- **File**: `og-image.png` or `opengraph-image.png`
- **Current**: `/app/opengraph-image.png`

---

## Where to Add Logos in Your App

### 1. **Navigation Bar** (Landing Page)
**Current:** Text-only "Neuro Medica"
**Location:** `components/landing/navigation.tsx` (line 51-56)

**Implementation:**
```tsx
<Link href="/" className="flex items-center gap-2">
  <Image
    src="/assets/icons/Logo.svg"
    alt="Neuro Medica"
    width={140}
    height={24}
    className="object-contain"
  />
</Link>
```

---

### 2. **Sidebar** (Dashboard)
**Current:** Uses `/assets/icons/Logo.svg` ✅
**Location:** `components/doctors/sidebar.tsx` (line 149-155)

**Status:** Already implemented correctly

---

### 3. **Favicon** (Browser Tab)
**Current:** `/app/favicon.ico`
**Location:** `app/favicon.ico`

**To Update:**
- Create favicon from your logo
- Replace existing `favicon.ico`
- Add to `app/layout.tsx` metadata if needed

---

### 4. **App Metadata**
**Current:** Basic metadata in `app/layout.tsx`
**Location:** `app/layout.tsx` (line 10-14)

**Can Add:**
```tsx
export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Neuro Medica - Healthcare Management Platform",
  description: "Neuro Medica - Healthcare Management Platform",
  icons: {
    icon: '/assets/icons/favicon.ico',
    apple: '/assets/icons/apple-touch-icon.png',
  },
  openGraph: {
    images: ['/opengraph-image.png'],
  },
};
```

---

### 5. **Email Signatures**
**Use:** PNG logo (200-300px width)
**Location:** Email templates (if applicable)

---

### 6. **PDF Reports** (Future)
**Use:** SVG or high-res PNG
**Location:** Report generation components

---

## Logo Design Concepts for Neuro Medica

### Concept 1: Neural Brain Network
- Abstract brain silhouette
- Neural network nodes and connections
- Gradient colors (orange to pink)
- Modern, tech-forward feel

### Concept 2: Medical Cross + Neural Pattern
- Stylized medical cross
- Integrated neural network pattern
- Represents both medical and AI aspects
- Professional, trustworthy

### Concept 3: Geometric Brain
- Geometric shapes forming brain outline
- Clean, minimalist design
- Works well at small sizes
- Modern and professional

### Concept 4: "NM" Monogram
- Stylized "N" and "M" letters
- Medical/AI elements integrated
- Perfect for favicon
- Versatile and recognizable

---

## Implementation Checklist

### Phase 1: Design & Assets
- [ ] Design logo concepts (2-3 options)
- [ ] Create SVG version (main logo)
- [ ] Create PNG versions (multiple sizes)
- [ ] Create favicon (16×16, 32×32)
- [ ] Create Apple touch icon (180×180)
- [ ] Create Open Graph image (1200×630)

### Phase 2: Integration
- [ ] Update navigation bar logo
- [ ] Verify sidebar logo (already done)
- [ ] Update favicon
- [ ] Add Apple touch icon
- [ ] Update metadata in `app/layout.tsx`
- [ ] Test logo visibility on all pages

### Phase 3: Optimization
- [ ] Optimize SVG file size
- [ ] Compress PNG files
- [ ] Test logo at different sizes
- [ ] Verify logo on light/dark backgrounds
- [ ] Test responsive behavior

---

## Tools & Resources

### Design Tools
- **Figma**: Professional design tool (free)
- **Canva**: Easy-to-use logo maker
- **Adobe Illustrator**: Professional vector design
- **LogoMaker**: Online logo generator

### Free Resources
- **Flaticon**: Medical and AI icons
- **Font Awesome**: Medical icons
- **Unsplash**: Medical imagery for inspiration

### Color Tools
- **Coolors.co**: Color palette generator
- **Adobe Color**: Color wheel and palettes

---

## Technical Specifications

### SVG Best Practices
```svg
<!-- Optimized SVG structure -->
<svg width="156" height="24" viewBox="0 0 156 24" xmlns="http://www.w3.org/2000/svg">
  <!-- Use paths instead of complex shapes -->
  <!-- Remove unnecessary attributes -->
  <!-- Use currentColor for flexibility -->
</svg>
```

### Next.js Image Component
```tsx
import Image from 'next/image';

<Image
  src="/assets/icons/Logo.svg"
  alt="Neuro Medica Logo"
  width={156}
  height={24}
  priority // For above-the-fold logos
  className="object-contain"
/>
```

### Responsive Logo Sizing
```tsx
// Mobile: Smaller logo
<Image
  src="/assets/icons/Logo.svg"
  alt="Neuro Medica"
  width={120}
  height={18}
  className="object-contain md:w-[156px] md:h-[24px]"
/>
```

---

## Brand Consistency

### Logo Usage Rules
1. **Minimum Size**: Never smaller than 16px height
2. **Clear Space**: Maintain padding around logo (at least 20% of logo height)
3. **Color Variations**: 
   - Full color on light backgrounds
   - Monochrome on dark backgrounds
   - Never distort or rotate logo
4. **Placement**: 
   - Top-left: Navigation, sidebar
   - Center: Hero sections, landing pages
   - Footer: Smaller version acceptable

---

## Next Steps

1. **Choose Logo Type**: Decide on wordmark, symbol, or combination
2. **Design or Commission**: Create logo design
3. **Export Formats**: Generate all required sizes/formats
4. **Implement**: Update components with new logo
5. **Test**: Verify across all pages and devices

---

## Current Logo Status

✅ **Sidebar**: Logo implemented (`/assets/icons/Logo.svg`)
⚠️ **Navigation**: Text-only (can be upgraded to logo)
⚠️ **Favicon**: Generic favicon (can be updated)
⚠️ **Metadata**: Basic (can add logo references)

---

**Last Updated**: Based on current codebase analysis
**App Name**: Neuro Medica
**Theme**: Healthcare AI Education Platform
**Primary Color**: Orange (#E55A2A)
**Gradient**: Pink to Orange (#FFA8C8 → #FF4F34)


