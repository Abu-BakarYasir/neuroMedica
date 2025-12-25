# Neuro Medica Design System

This document provides a comprehensive design system and style guide for building the **Neuro Medica** application from scratch. All design specifications, component styles, spacing conventions, and implementation guidelines are documented here to ensure consistent implementation across the entire application.

---

## Table of Contents

1. [Color Palette](#1-color-palette)
2. [Typography](#2-typography)
3. [Gradients and Visual Assets](#3-gradients-and-visual-assets)
4. [Component Styles](#4-component-styles)
5. [Spacing and Structure](#5-spacing-and-structure)
6. [Implementation Guide](#6-implementation-guide)
7. [Component Library Specifications](#7-component-library-specifications)
8. [Landing Page Design Patterns & Best Practices](#8-landing-page-design-patterns--best-practices)
9. [Dashboard/Home Page Design Patterns](#9-dashboardhome-page-design-patterns)
10. [Complete Asset Inventory](#10-complete-asset-inventory)

---

## 1. Color Palette

### Primary Colors

The brand uses an orange-based color scheme as its primary identity:

- **Primary Orange**: `#E55A2A` (HSL: `19 75% 55%`)
  - Used for: Primary buttons, active states, brand elements, links, icons
  - CSS Variable: `--neuro-primary`
- **Primary Light**: `#F07A4A`
  - Used for: Hover states, lighter variations
- **Primary Dark**: `#C44A1A` (HSL: `19 75% 45%`)
  - Used for: Hover states, darker variations, pressed states
- **Primary Lighter**: `#F5A07A`
  - Used for: Subtle highlights, backgrounds
- **Primary Darker**: `#A03A15` (HSL: `19 85% 35%`)
  - Used as: Accent color, emphasis

**Implementation**:
```css
:root {
  --neuro-primary: 19 75% 55%;       /* #E55A2A */
  --neuro-primary-dark: 19 75% 45%;  /* #C44A1A */
  --neuro-primary-light: 19 75% 65%; /* #F07A4A */
  --neuro-accent: 19 85% 35%;        /* #A03A15 */
}
```

### Secondary Colors

- **Secondary**: `#FEF7F3` (HSL: `19 30% 96%`)
  - Light orange-gray background color
  - Used for: Subtle backgrounds, card backgrounds

**Brand Color Scale** (for reference and extended use):
- `50`: `#FEF7F3` - Lightest background
- `100`: `#FEEEE6` - Very light background
- `200`: `#FDD9C7` - Light background
- `300`: `#FBC4A8` - Medium light
- `400`: `#F8A089` - Medium
- `500`: `#E55A2A` - **Primary** (main brand color)
- `600`: `#C44A1A` - Dark
- `700`: `#A03A15` - Darker
- `800`: `#7C2D10` - Very dark
- `900`: `#58200B` - Darkest

### Accent Colors

- **Accent Orange**: `#A03A15` (HSL: `19 85% 35%`)
- **Form Accent**: `#F76B15`
  - Used in: Checkboxes, links, form elements, interactive states
- **Footer**: `#6B6FD4` (optional, for footer elements)

### Background Colors

- **Primary Background**: `#FFFFFF` (White)
  - Used for: Main page backgrounds, card backgrounds
- **Secondary Background**: `#F8F8F8`
  - Used for: Sidebar backgrounds, card backgrounds, content areas, alternate sections
- **Card Background**: `#FFFBFB`
  - Used for: Card containers with subtle warmth
- **Inner Card Background**: `#FCFCFC`
  - Used for: Nested cards, inner content areas
- **Dark Card Background**: `#080808` (Black)
  - Used for: Special cards (e.g., battery indicators, dark mode elements)

**Implementation**:
```css
:root {
  --background: 0 0% 100%;        /* #FFFFFF */
  --background-secondary: 0 0% 97.3%; /* #F8F8F8 */
  --card: 0 0% 100%;             /* #FFFFFF */
  --card-inner: 0 0% 98.8%;       /* #FCFCFC */
}
```

### Text Colors

- **Primary Text**: `#212121`
  - Used for: Headings, primary text content, important labels
- **Secondary Text**: `#8D8D8D`
  - Used for: Placeholders, secondary text, muted content, helper text
- **Tertiary Text**: `#525252`
  - Used for: Sidebar navigation items (inactive), less important text
- **Dark Text**: `#202020`
  - Used for: User names, important metadata
- **Muted Text**: `#6B6C6E`
  - Used for: Statistics, less emphasized content
- **Light Text**: `#767676`
  - Used for: Descriptions, fine print
- **Very Light Text**: `#838383`
  - Used for: Section labels, minimal emphasis text

**Implementation**:
```css
:root {
  --foreground: 0 0% 3.9%;        /* #212121 */
  --foreground-secondary: 0 0% 55.3%; /* #8D8D8D */
  --foreground-muted: 0 0% 32.2%; /* #525252 */
}
```

### Border Colors

- **Primary Border**: `#EDEDED`
  - Used for: Input fields, cards, dividers, borders throughout the UI
  - Most common border color
- **Border Opacity Variant**: `rgba(107, 108, 110, 0.15)`
  - Used for: Divider lines, subtle separators

**Implementation**:
```css
:root {
  --border: 0 0% 89.8%;           /* #EDEDED */
  --border-opacity: 107 108 110 / 0.15;
}
```

### Status Colors

- **Active/Success**: 
  - Text: `#13893A`
  - Background: `#DEF8E7`
  - Used for: Active states, success messages, positive indicators
- **Warning**: 
  - Text: `#DFAD0C`
  - Background: `#FBF6E4`
  - Used for: Warning messages, caution states
- **Warning Yellow**: `#E2AB02`
  - Used for: Alert badges, warning icons
- **Inactive**: 
  - Text: `#6B6C6E`
  - Background: `#F5F5F5`
  - Used for: Disabled states, inactive items
- **Destructive/Error**: `0 84.2% 60.2%` (HSL) - Red
  - Used for: Error messages, destructive actions, delete buttons

**Implementation**:
```css
:root {
  --success: 142 76% 36%;         /* #13893A */
  --success-bg: 142 76% 95%;       /* #DEF8E7 */
  --warning: 48 96% 53%;          /* #DFAD0C */
  --warning-bg: 48 96% 96%;       /* #FBF6E4 */
  --destructive: 0 84.2% 60.2%;   /* Red */
}
```

### Dark Mode Colors

The application supports dark mode with the following adjustments:

**Implementation**:
```css
.dark {
  --background: 0 0% 3.9%;         /* Very dark gray */
  --foreground: 0 0% 98%;         /* Near white */
  --card: 0 0% 3.9%;
  --card-foreground: 0 0% 98%;
  --border: 0 0% 14.9%;
  --input: 0 0% 14.9%;
  --primary: var(--neuro-primary); /* Keep brand color */
  --primary-foreground: 0 0% 9%;  /* Dark text on primary */
}
```

---

## 2. Typography

### Font Family

- **Primary Font**: `Inter`
  - Fallback stack: `'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'`
  - Loaded from Google Fonts
  - Applied globally via `font-sans` class

**Implementation** (Next.js):
```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  variable: '--font-inter',
  display: 'swap',
  subsets: ['latin'],
});
```

**Tailwind Config**:
```typescript
fontFamily: {
  sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
}
```

### Font Sizes

- **H1 / Large Heading**: `text-2xl` (24px / 1.5rem)
  - Used for: Page titles, major headings, hero text
  - Line height: `1.2` or `leading-tight`
- **H2 / Medium Heading**: `text-xl` (20px / 1.25rem)
  - Used for: Section headings, card titles
- **H3 / Small Heading**: `text-lg` (18px / 1.125rem)
  - Used for: Subsection headings
- **Body / Default**: `text-sm` (14px / 0.875rem) or `text-[14px]`
  - Used for: Primary body text, form labels, default text
- **Small Text**: `text-xs` (12px / 0.75rem) or `text-[13px]`
  - Used for: Secondary text, captions, helper text, metadata
- **Extra Small**: `text-[11px]` or `text-[10px]`
  - Used for: Fine print, timestamps, minimal text
- **Large Stat Values**: `text-[40px]` (40px)
  - Used for: Dashboard statistics, large numbers, key metrics

**Implementation**:
```css
/* Custom font sizes */
.text-stat {
  font-size: 40px;
  line-height: 1;
  font-weight: 500;
}
```

### Font Weights

- **Semibold**: `font-semibold` (600)
  - Used for: Headings, emphasized text, links, important labels
- **Medium**: `font-medium` (500)
  - Used for: Subheadings, important labels, button text
- **Normal**: `font-normal` (400)
  - Used for: Body text, default weight, form inputs

### Text Treatments

- **Letter Spacing**: `0.5%` (applied via inline style or CSS)
  - Used in: Sidebar navigation items, user profile text, compact UI elements
- **Line Height**: 
  - `leading-[1.15]` - Tight line height for compact text (navigation, labels)
  - `leading-[1.3]` - Standard line height for body text
  - `leading-none` - No line height for single-line elements (badges, tags)
  - `leading-tight` - Tighter for headings
- **Text Transform**: 
  - `lowercase` - Used for divider text ("or")
  - `uppercase` - Optional for labels/badges
- **Text Alignment**: 
  - Center: Form headers, card content, centered layouts
  - Left: Default for body text, lists
  - Right: Numbers, statistics

**Implementation**:
```css
.text-compact {
  letter-spacing: 0.5%;
  line-height: 1.15;
}
```

### Text Color Usage

- **Headings**: `#212121` (Primary Text) - `text-[#212121]` or `text-foreground`
- **Body Text**: `#212121` or `#8D8D8D` (depending on hierarchy)
- **Placeholders**: `#8D8D8D` - `placeholder:text-[#8D8D8D]`
- **Links**: `#F76B15` with hover state `#e55a0a` - `text-[#F76B15] hover:text-[#e55a0a]`
- **Muted Text**: `#8D8D8D` or `#6B6C6E` - `text-muted-foreground`

---

## 3. Gradients and Visual Assets

### Primary Gradient

The primary gradient is the signature visual element used extensively throughout the application:

**CSS Gradient**:
```css
linear-gradient(180deg, #FFA8C8 7%, #F58947 70%, #F47325 88%, #FF4F34 100%)
```

**Visual Description**: A vertical gradient transitioning from a soft pink (`#FFA8C8`) at the top (7%), through warm orange tones (`#F58947` at 70%, `#F47325` at 88%), to a vibrant coral-red (`#FF4F34`) at the bottom (100%).

**Usage**:
- Primary action buttons (Sign in, Sign up, Continue, Submit buttons)
- Active sidebar navigation items
- Interactive elements requiring emphasis
- Call-to-action elements

**Implementation**:
```css
.gradient-primary {
  background: linear-gradient(180deg, #FFA8C8 7%, #F58947 70%, #F47325 88%, #FF4F34 100%);
}
```

**Gradient Shadow** (for buttons):
```css
.gradient-button-shadow {
  box-shadow: 
    0px 1.43px 3.06px 0px rgba(0,0,0,0.04),
    0px 5.72px 5.72px 0px rgba(0,0,0,0.03),
    0px 12.87px 7.76px 0px rgba(0,0,0,0.02),
    0px 22.67px 9.19px 0px rgba(0,0,0,0.01);
}
```

**Inset Shadow** (for active sidebar items):
```css
.gradient-inset-shadow {
  box-shadow: 
    inset 0px 0px 8.4px 4.2px rgba(255,255,255,0.4),
    inset 0px 4px 3px 0px rgba(255,255,255,0.28);
}
```

### Background Gradients

**Content Area Background**:
```css
linear-gradient(180deg, rgba(255, 202, 222, 0.35) 0%, #F8F8F8 62%)
```
- Used for: Main content areas in dashboard layouts
- Creates a subtle pink-to-light-gray transition
- Provides visual depth without distraction

**Implementation**:
```css
.content-background {
  background: linear-gradient(180deg, rgba(255, 202, 222, 0.35) 0%, #F8F8F8 62%);
  border-radius: 32px;
}
```

### Gradient Image Assets

**Required Assets**:
- **`/public/gradient.svg`**: Primary gradient background image
  - Used as: Full-page background for sign-in and sign-up pages
  - Applied with: `backgroundSize: "cover"`, `backgroundPosition: "center"`
  - Format: SVG (scalable, maintains quality)
  - Dimensions: Should cover full viewport (recommended: 1920x1080 or larger)

**Implementation**:
```tsx
<div
  className="relative min-h-screen overflow-hidden"
  style={{
    backgroundImage: "url('/gradient.svg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}
>
  {/* Content */}
</div>
```

### Other Visual Assets

**Required Assets**:

1. **Ripple Pattern**: `/public/assets/images/Ripple.png`
   - Used as: Overlay pattern on dashboard content areas
   - Position: Top right
   - Size: 900px auto (or responsive)
   - Creates subtle texture overlay
   - Format: PNG with transparency

2. **Sidebar Gradient Background**: `/public/assets/icons/Group 1244832313.svg` (or similar)
   - Used in: Sidebar footers for decorative effect
   - Position: Bottom of sidebar
   - Creates decorative gradient effect
   - Format: SVG

3. **Logo**: `/public/assets/icons/Logo.svg`
   - Brand logo for headers and sidebars
   - Format: SVG (scalable)
   - Recommended size: 156x24px (or proportional)

4. **Icons**: `/public/assets/sidebar-icons/`
   - Navigation icons for sidebar
   - Format: SVG preferred
   - Size: 14x14px for navigation items
   - Recommended icons:
     - `dashboard-icon.svg`
     - `patients-icon.svg`
     - `analytics-icon.svg`
     - `settings-icon.svg`
     - `logout-icon.svg`

**Asset Organization**:
```
public/
  ├── gradient.svg
  ├── assets/
  │   ├── images/
  │   │   └── Ripple.png
  │   ├── icons/
  │   │   ├── Logo.svg
  │   │   └── [other icons].svg
  │   └── sidebar-icons/
  │       ├── dashboard-icon.svg
  │       ├── patients-icon.svg
  │       └── [other sidebar icons].svg
```

---

## 4. Component Styles

### Sign-up/Sign-in Pages

#### Layout Structure

**Page Container**:
- Full viewport height: `min-h-screen`
- Background: Gradient SVG image covering entire page
- Centered content layout

**Form Container**:
- Width: `435px` (fixed)
- Min Height: 
  - Login: `507px`
  - Sign-up: `620px`
- Border Radius: `20px` (`rounded-[20px]`)
- Border: `1px solid #EDEDED`
- Background: White (`#FFFFFF`)
- Padding: 
  - Horizontal: `36px` (`px-[36px]`)
  - Vertical: `46px` (`py-[46px]`)
- Shadow: 
  ```css
  0px 3px 16px 0px rgba(30,37,75,0.02),
  0px 2px 2px 0px rgba(30,37,75,0.01)
  ```
- Display: Flex column (`flex flex-col`)

**Implementation**:
```tsx
<div className="w-[435px] min-h-[507px] rounded-[20px] border border-[#EDEDED] bg-white px-[36px] py-[46px] shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] flex flex-col">
  {/* Form content */}
</div>
```

#### Form Elements

**Input Fields**:
- Height: `40px` (`h-[40px]`)
- Width: `300px` (`w-[300px]`)
- Border Radius: `10px` (`rounded-[10px]`)
- Border: `1px solid #EDEDED`
- Background: White (`bg-white`)
- Padding: `12px` horizontal (`px-3`)
- Font Size: `13px` (`text-[13px]`)
- Font Weight: Normal (`font-normal`)
- Text Color: `#212121`
- Placeholder Color: `#8D8D8D` (`placeholder:text-[#8D8D8D]`)
- Shadow: Same as form container
- Focus State: Ring with primary color

**Implementation**:
```tsx
<input
  className="h-[40px] w-[300px] rounded-[10px] border border-[#EDEDED] bg-white px-3 text-[13px] font-normal text-[#212121] placeholder:text-[#8D8D8D] shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E55A2A]"
/>
```

**Buttons**:

*Primary Button* (Continue, Sign in, Submit):
- Height: `40px` (`h-[40px]`)
- Width: `300px` (`w-[300px]`)
- Border Radius: `16px` (`rounded-[16px]`)
- Background: Primary gradient (see Gradients section)
- Text Color: White
- Font Size: `14px` (`text-sm`)
- Font Weight: Normal (`font-normal`)
- Shadow: Multi-layer shadow (see Gradients section)
- Hover Effect: `brightness-110` (10% brightness increase)
- Disabled State: Maintains opacity, gradient remains visible
- Cursor: Pointer

**Implementation**:
```tsx
<button
  className="h-[40px] w-[300px] rounded-[16px] text-sm font-normal text-white shadow-[0px_1.43px_3.06px_0px_rgba(0,0,0,0.04),0px_5.72px_5.72px_0px_rgba(0,0,0,0.03),0px_12.87px_7.76px_0px_rgba(0,0,0,0.02),0px_22.67px_9.19px_0px_rgba(0,0,0,0.01)] hover:brightness-110 disabled:opacity-50"
  style={{
    background: "linear-gradient(180deg, #FFA8C8 7%, #F58947 70%, #F47325 88%, #FF4F34 100%)",
  }}
>
  Continue
</button>
```

*Secondary Button* (Sign in/up with Google, Cancel):
- Height: `40px` (`h-[40px]`)
- Width: Full width (`w-full`)
- Border Radius: `10px` (`rounded-[10px]`)
- Border: `1px solid #EDEDED`
- Background: White
- Text Color: `#212121`
- Font Size: `14px` (`text-sm`)
- Font Weight: Normal (`font-normal`)
- Hover: `hover:bg-gray-50`
- Shadow: Same as form container
- Gap: `gap-2` (8px) for icon spacing

*Ghost Button* (Password visibility toggle, icon buttons):
- Variant: `ghost`
- Text Color: `#8D8D8D`
- Hover: Transparent background (`hover:bg-transparent`)
- Size: Icon size appropriate

**Checkboxes**:
- Border Radius: `6px` (`rounded-[6px]`) or `4px` (`rounded-[4px]`)
- Border: `1px solid #EDEDED`
- Checked Background: `#F76B15`
- Checked Border: `#F76B15`
- Size: Default checkbox size (typically 16x16px)
- Transition: Smooth color transition

**Implementation**:
```tsx
<input
  type="checkbox"
  className="rounded-[6px] border border-[#EDEDED] data-[state=checked]:bg-[#F76B15] data-[state=checked]:border-[#F76B15]"
/>
```

**Dividers**:
- Height: `1px` (`h-px`)
- Background: `rgba(107,108,110,0.15)`
- Text: "or" in lowercase, `12px` font (`text-xs`), bold (`font-bold`), `#212121` color
- Spacing: `gap-3` (12px) between lines and text
- Layout: Flex with items center

**Implementation**:
```tsx
<div className="flex items-center gap-3">
  <span className="h-px flex-1 bg-[rgba(107,108,110,0.15)]" />
  <span className="text-xs font-bold text-[#212121] lowercase">or</span>
  <span className="h-px flex-1 bg-[rgba(107,108,110,0.15)]" />
</div>
```

**Links**:
- Color: `#F76B15`
- Hover Color: `#e55a0a`
- Font Weight: Semibold (`font-semibold`)
- Font Size: `13px` (`text-[13px]`)
- Text Decoration: None (underline on hover optional)

**Implementation**:
```tsx
<a className="text-[13px] font-semibold text-[#F76B15] hover:text-[#e55a0a]">
  Link Text
</a>
```

#### Form Spacing

- **Form Container Gap**: `gap-6` (24px) between form sections
- **Input Spacing**: `mt-2` (8px) between input fields
- **Button Top Margin**: `24px` (`marginTop: "24px"`)
- **Remember Me Section**: `mt-4` (16px) from password field
- **Footer Text**: `pt-6` (24px) padding top, `mt-2` (8px) between paragraphs
- **Form Header**: `space-y-3` (12px) between title and subtitle

### Sidebar Design

#### General Sidebar Structure

**Modern Sidebar** (Clinical & Facility Admin style):
- Background: `#F8F8F8`
- Border Radius: `24px` (`rounded-[24px]`)
- Width: 
  - Expanded: `260px` (`w-[260px]`)
  - Collapsed: `20px` (`w-20`)
- Padding: `16px` horizontal, `10px` vertical (`px-4 py-[10px]`)
- Height: Full height (`h-full`)
- Transition: `duration-300` for smooth collapse/expand
- Overflow: Hidden (`overflow-hidden`)

**Classic Sidebar** (Broker & User style):
- Background: White (`bg-white`)
- Width:
  - Expanded: `256px` (`w-64`)
  - Collapsed: `64px` (`w-16`)
- Padding: `16px` (`p-4`)
- Border: None (clean white background)
- Transition: `duration-300`

**Implementation** (Modern Sidebar):
```tsx
<div className={cn(
  "bg-[#F8F8F8] rounded-[24px] flex flex-col px-4 py-[10px] h-full transition-all duration-300 overflow-hidden relative",
  isCollapsed ? "w-20" : "w-[260px]"
)}>
  {/* Sidebar content */}
</div>
```

#### Sidebar Navigation Items

**Active State**:
- Background: Primary gradient (see Gradients section)
- Text Color: White
- Border Radius: `8px` (`rounded-[8px]`)
- Height: `28px` (`h-[28px]`)
- Padding: `8px` horizontal (`px-2`)
- Shadow: Multi-layer with inset highlights (see Gradients section)
- Icon: Inverted to white (`brightness-0 invert`)
- Transition: Smooth background change

**Inactive State**:
- Background: Transparent
- Text Color: `#525252` (main nav) or `#202020` (settings nav)
- Hover: `hover:bg-gray-200/50` (50% opacity gray)
- Icon: Gray filter applied
- Transition: Smooth hover effect

**Navigation Item Spacing**:
- Vertical Gap: `2px` (`space-y-[2px]`)
- Horizontal Gap: `6px` (`gap-1.5`) between icon and text
- Icon Size: `14px × 14px` (`w-[14px] h-[14px]`)

**Implementation**:
```tsx
<Link href={item.href}>
  <div
    className={cn(
      "flex items-center px-2 rounded-[8px] transition-all h-[28px]",
      isCollapsed ? "justify-center gap-0" : "gap-1.5",
      isActive
        ? "bg-[linear-gradient(180deg,rgba(255,168,200,1)_7%,rgba(245,137,71,1)_70%,rgba(244,115,37,1)_88%,rgba(255,79,52,1)_100%)] shadow-[0px_1.43px_3.06px_0px_rgba(0,0,0,0.04),0px_5.72px_5.72px_0px_rgba(0,0,0,0.03),0px_12.87px_7.76px_0px_rgba(0,0,0,0.02),0px_22.67px_9.19px_0px_rgba(0,0,0,0.01),0px_35.53px_10.01px_0px_rgba(0,0,0,0)] [box-shadow:inset_0px_0px_8.4px_4.2px_rgba(255,255,255,0.4),inset_0px_4px_3px_0px_rgba(255,255,255,0.28)]"
        : "hover:bg-gray-200/50"
    )}
  >
    <Image src={item.icon} width={14} height={14} className={isActive ? "brightness-0 invert" : ""} />
    {!isCollapsed && <span className={cn("text-[14px] font-normal leading-[1.15]", isActive ? "text-white" : "text-[#525252]")}>{item.name}</span>}
  </div>
</Link>
```

#### Sidebar Typography

- Font Size: `14px` (`text-[14px]`)
- Font Weight: Normal (`font-normal`)
- Line Height: `1.15` (`leading-[1.15]`)
- Letter Spacing: `0.5%`

#### Sidebar Sections

**Settings & Help Section**:
- Label: `11px` font, `#838383` color
- Spacing: `mb-1` (4px) below label
- Section Spacing: `mb-3` (12px) between sections

**User Profile Section**:
- Border Top: `1px solid` with `border-gray-200` (Classic sidebars)
- Separator Line: `2px` white line (`h-[2px] bg-white`) in Modern sidebars
- Avatar: `36px × 36px`, rounded `10px`
- Text: 
  - Name: `13px`, semibold, `#202020`
  - Email: `11px`, normal, `#202020`
- Spacing: `gap-2.5` (10px) between avatar and text

### Cards

**Main Card**:
- Border Radius: `20px` (`rounded-[20px]`)
- Border: `1px solid #EDEDED` or `border-0` for shadow-only
- Background: `#FFFBFB` or White
- Padding: `p-6` (24px) or `p-8` (32px)
- Shadow: 
  ```css
  0px 3px 16px 0px rgba(30,37,75,0.02),
  0px 2px 2px 0px rgba(30,37,75,0.01)
  ```

**Inner Card**:
- Border Radius: `13px` (`rounded-[13px]`)
- Border: `1px solid #EDEDED`
- Background: `#FCFCFC` or `#EBF5FF` (for highlighted cards)
- Padding: `p-4` (16px)
- Min Height: `150px` (for content cards)

---

## 5. Spacing and Structure

### Spacing Scale

The application uses a flexible spacing system with both Tailwind's default scale and custom pixel values:

**Tailwind Spacing** (based on 4px grid):
- `1` = 4px (0.25rem)
- `2` = 8px (0.5rem)
- `3` = 12px (0.75rem)
- `4` = 16px (1rem)
- `6` = 24px (1.5rem)
- `8` = 32px (2rem)

**Custom Spacing Values** (used via arbitrary values):
- `2px` - Minimal spacing (navigation items)
- `10px` - Small padding, vertical spacing
- `14px` - Icon sizes, small text
- `20px` - Button margins, section spacing
- `24px` - Section spacing, card padding
- `28px` - Navigation item height
- `36px` - Form horizontal padding
- `40px` - Input/button height
- `46px` - Form vertical padding

### Border Radius Scale

The application uses a consistent border radius scale:

- **Extra Small**: `4px` (`rounded-[4px]`) - Checkboxes, small elements
- **Small**: `6px` (`rounded-[6px]`) - Small checkboxes, badges
- **Medium**: `8px` (`rounded-[8px]`) - Navigation items, small cards
- **Default**: `10px` (`rounded-[10px]`) - Input fields, buttons, search bars, avatars
- **Large**: `13px` (`rounded-[13px]`) - Inner cards, content cards
- **Extra Large**: `16px` (`rounded-[16px]`) - Buttons, action elements
- **XXL**: `20px` (`rounded-[20px]`) - Form containers, main cards
- **XXXL**: `24px` (`rounded-[24px]`) - Sidebar containers
- **Huge**: `32px` (`rounded-3xl` / `32px`) - Content area backgrounds

### Padding Patterns

**Component Padding**:
- Form Container: `36px` horizontal, `46px` vertical
- Card Padding: `p-4` (16px), `p-6` (24px), or `p-8` (32px)
- Input Padding: `px-3` (12px horizontal)
- Button Padding: `px-4` (16px) default, `px-8` (32px) for large buttons
- Sidebar Padding: `p-4` (16px) or `px-4 py-[10px]` (16px horizontal, 10px vertical)
- Navigation Item Padding: `px-2` (8px) or `px-3` (12px)

**Section Padding**:
- Main Content: `p-6` (24px)
- Page Container: `p-4` (16px) gap between sidebar and content
- Form Sections: `gap-6` (24px) between major sections
- Input Groups: `gap-2` (8px) or `gap-3` (12px) between related inputs

### Margin Patterns

- Section Margins: `mb-6` (24px) between major sections
- Element Margins: `mt-2` (8px), `mt-4` (16px), `mt-6` (24px), `mt-8` (32px)
- Button Margins: `marginTop: "24px"` for primary actions
- Text Margins: `mb-2` (8px), `mb-3` (12px), `mb-4` (16px), `mb-6` (24px)

### Gap Patterns

- Flex Container Gaps: `gap-2` (8px), `gap-3` (12px), `gap-4` (16px), `gap-6` (24px)
- Grid Gaps: Similar to flex gaps
- Navigation Gaps: `gap-1.5` (6px) between icon and text
- Form Element Gaps: `gap-6` (24px) for major sections

### Height Patterns

- Input Fields: `40px` (`h-[40px]`)
- Buttons: `40px` (`h-[40px]`) for primary actions, `h-9` (36px) default, `h-8` (32px) small
- Navigation Items: `28px` (`h-[28px]`)
- Cards: Variable, minimum `150px` for content cards
- Sidebar: Full height (`h-full` or `h-screen`)

### Width Patterns

- Form Container: `435px` fixed width
- Form Inputs: `300px` fixed width
- Sidebar: `260px` expanded, `20px` or `64px` collapsed
- Cards: Variable, often `max-w-md` (28rem / 448px) for centered content

### Layout Structure

**Dashboard Layout**:
- Container: `flex h-screen bg-white p-4 gap-4`
- Sidebar: Fixed width, full height
- Content Area: `flex-1` (takes remaining space)
  - Background: Gradient (see Background Gradients)
  - Border Radius: `32px` (`rounded-3xl`)
  - Padding: `p-6` (24px)
  - Overflow: `overflow-y-auto` for scrolling
  - Position: Relative for overlay patterns

**Auth Page Layout**:
- Container: `min-h-screen` with gradient background
- Content: Centered with `flex items-center justify-center`
- Padding: `px-4 py-12 sm:px-6 lg:px-8` (responsive)

---

## 6. Implementation Guide

### Setup Instructions

#### 1. Project Setup (Next.js Recommended)

```bash
npx create-next-app@latest neuro-medica --typescript --tailwind --app
cd neuro-medica
```

#### 2. Install Dependencies

```bash
npm install next-themes class-variance-authority clsx tailwind-merge
npm install -D tailwindcss-animate
```

#### 3. Configure Tailwind CSS

**tailwind.config.ts**:
```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Neuro Medica Custom Colors
        neuro: {
          primary: "#E55A2A",
          "primary-light": "#F07A4A",
          "primary-dark": "#C44A1A",
          "primary-lighter": "#F5A07A",
          "primary-darker": "#A03A15",
          secondary: "hsl(var(--neuro-secondary))",
          accent: "hsl(var(--neuro-accent))",
        },
        // Brand colors for easy access
        brand: {
          50: '#FEF7F3',
          100: '#FEEEE6',
          200: '#FDD9C7',
          300: '#FBC4A8',
          400: '#F8A089',
          500: '#E55A2A',
          600: '#C44A1A',
          700: '#A03A15',
          800: '#7C2D10',
          900: '#58200B',
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // ... other shadcn/ui colors
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

#### 4. Global CSS Setup

**app/globals.css**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Neuro Medica Brand Theme Colors */
    --neuro-primary: 19 75% 55%;       /* #E55A2A */
    --neuro-primary-dark: 19 75% 45%;  /* #C44A1A */
    --neuro-secondary: 19 30% 96%;       /* #FEF7F3 */
    --neuro-accent: 19 85% 35%;         /* #A03A15 */
    
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --primary: var(--neuro-primary);
    --primary-foreground: 0 0% 98%;
    --secondary: var(--neuro-secondary);
    --secondary-foreground: 0 0% 20%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: var(--neuro-primary);
    --radius: 0.5rem;
  }
  
  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --primary: var(--neuro-primary);
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: var(--neuro-primary);
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans;
  }
}
```

#### 5. Font Setup

**app/layout.tsx**:
```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  variable: '--font-inter',
  display: 'swap',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

#### 6. Utility Functions

**lib/utils.ts**:
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### 7. Color Constants

**lib/colors.ts**:
```typescript
export const colors = {
  primary: '#E55A2A',
  primaryLight: '#F07A4A',
  primaryDark: '#C44A1A',
  primaryLighter: '#F5A07A',
  primaryDarker: '#A03A15',
  secondary: '#FEF7F3',
  accent: '#A03A15',
  formAccent: '#F76B15',
  background: '#FFFFFF',
  backgroundSecondary: '#F8F8F8',
  textPrimary: '#212121',
  textSecondary: '#8D8D8D',
  border: '#EDEDED',
} as const;
```

### Component Implementation Checklist

- [ ] Button component (Primary, Secondary, Ghost variants)
- [ ] Input component (with focus states)
- [ ] Card component (Main, Inner variants)
- [ ] Checkbox component
- [ ] Sidebar component (Modern and Classic styles)
- [ ] Navigation items
- [ ] Form components (Login, Sign-up)
- [ ] Modal/Dialog component
- [ ] Badge component
- [ ] Avatar component
- [ ] Dropdown/Menu component
- [ ] Table component
- [ ] Toast/Notification component

### Asset Requirements Checklist

- [ ] `/public/gradient.svg` - Auth page background
- [ ] `/public/assets/images/Ripple.png` - Dashboard overlay
- [ ] `/public/assets/icons/Logo.svg` - Brand logo
- [ ] `/public/assets/sidebar-icons/` - Navigation icons
- [ ] `/public/assets/icons/` - General icons

---

## 7. Component Library Specifications

### Button Component

**Variants**:
- `default` - Primary gradient button
- `secondary` - White button with border
- `outline` - Outlined button
- `ghost` - Transparent button
- `destructive` - Red error button

**Sizes**:
- `default` - `h-9 px-4`
- `sm` - `h-8 px-3 text-xs`
- `lg` - `h-10 px-8`
- `icon` - `h-9 w-9`

### Input Component

**Base Styles**:
- Height: `h-9` (default) or `h-[40px]` (form)
- Border: `border border-input`
- Border Radius: `rounded-md` or `rounded-[10px]`
- Padding: `px-3 py-1`
- Focus: Ring with primary color

### Card Component

**Variants**:
- Default - White background, border, shadow
- Inner - Lighter background, smaller radius
- Highlighted - Colored background (e.g., `#EBF5FF`)

### Sidebar Component

**Features**:
- Collapsible (expanded/collapsed states)
- Navigation items with active states
- User profile section
- Settings section
- Smooth transitions

### Form Components

**Login Form**:
- Google sign-in button
- Email/password inputs
- Remember me checkbox
- Forgot password link
- Sign up link

**Sign-up Form**:
- Google sign-up button
- First name, last name, email, password inputs
- Terms acceptance checkbox
- Sign in link

---

## 8. Landing Page Design Patterns & Best Practices

This section documents the design patterns, component structures, and best practices established for the Neuro Medica landing page. Use these guidelines when creating new landing pages or marketing pages.

### Landing Page Structure

**Optimal Section Count**: 7-8 focused sections maximum
- Too many sections create cognitive overload and reduce conversion
- Each section should have a clear purpose and value proposition
- Maintain visual hierarchy with alternating background colors

**Standard Section Order**:
1. Navigation (sticky header)
2. Hero Section
3. Problem/Solution
4. Features/Capabilities
5. How It Works
6. Stats/Social Proof
7. Use Cases
8. Final CTA
9. Footer

### Section Spacing Standards

**Vertical Padding**:
- Standard sections: `py-24` (96px / 6rem)
- Hero section: `min-h-screen` with centered content
- Footer: `py-16` (64px / 4rem)

**Horizontal Padding**:
- Standard: `px-4 sm:px-6 lg:px-8`
- Max width container: `max-w-7xl mx-auto` (most sections)
- Hero: `max-w-6xl` or `max-w-4xl` for centered content

**Section Margins**:
- Between sections: Natural flow (no extra margin needed)
- Content spacing: `mb-16` (64px) for section headers

### Background Color Alternation

**Pattern**:
- Hero: White or gradient background
- Problem/Solution: `bg-[#F8F8F8]`
- Features: `bg-white`
- How It Works: `bg-white`
- Stats: `bg-gradient-to-b from-white to-[#F8F8F8]`
- Use Cases: `bg-[#F8F8F8]`
- Social Proof: `bg-white`
- Final CTA: `bg-gradient-to-b from-white via-neuro-primary/5 to-[#F8F8F8]`
- Footer: `bg-white`

**Purpose**: Creates visual rhythm and helps users distinguish between sections

### Component Patterns

#### Hero Section Pattern

**Structure**:
- Two-column layout on desktop (content left, visual right)
- Centered single column on mobile
- Trust indicators below headline
- Primary and secondary CTAs
- Animated gradient background overlay

**Key Elements**:
- Headline: `text-4xl sm:text-5xl lg:text-6xl font-semibold`
- Subheadline: `text-lg sm:text-xl`
- Trust badges: User count, ratings, or trust indicators
- CTA buttons: Primary gradient button + secondary outline button

**Implementation Example**:
```tsx
<section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
  <div className="grid lg:grid-cols-2 gap-12 items-center">
    {/* Content Column */}
    {/* Visual Column */}
  </div>
</section>
```

#### Stats Section Pattern

**Purpose**: Display key metrics with animated counters

**Structure**:
- Grid layout: `grid-cols-2 md:grid-cols-4`
- Each stat card contains:
  - Icon in colored background circle
  - Animated counter number
  - Label text

**Animation**:
- Counters animate on scroll into view
- Use `useInView` hook from framer-motion
- 2-second animation duration
- Smooth increment effect

**Card Design**:
- Background: White with border
- Icon container: `w-16 h-16 rounded-[16px] bg-gradient-to-br from-neuro-primary/10 to-neuro-primary/5`
- Number: `text-4xl sm:text-5xl font-semibold`
- Label: `text-sm text-[#525252]`

#### Social Proof Section Pattern

**Structure**:
- Testimonials carousel with navigation dots
- Trust badges/logos (optional)
- Star ratings display

**Testimonial Card**:
- Quote text: `text-lg text-[#525252]`
- Author name: `font-semibold text-[#212121]`
- Author role: `text-sm text-[#8D8D8D]`
- Star rating: 5 stars with `#DFAD0C` color

**Carousel Navigation**:
- Dots: `w-2 h-2 rounded-full`
- Active dot: `bg-neuro-primary w-8`
- Inactive dot: `bg-[#EDEDED]`

#### Feature/Capability Grid Pattern

**Grid Layout**:
- Desktop: `lg:grid-cols-3`
- Tablet: `md:grid-cols-2`
- Mobile: Single column

**Card Structure**:
- Icon in colored container (top)
- Title (semibold)
- Description text
- Learning value section (bottom border)

**Hover Effects**:
- Shadow increase: `hover:shadow-xl`
- Border highlight: `hover:border-neuro-primary/20`
- Smooth transition: `transition-all duration-300`

**Icon Usage**:
- Use lucide-react icons (not emojis)
- Icon size: `24px` or `32px`
- Icon container: `w-12 h-12 rounded-[12px] bg-gradient-to-br from-neuro-primary/10 to-neuro-primary/5`

#### How It Works Pattern

**Structure**:
- 4 steps in horizontal flow
- Connecting lines/arrows between steps
- Step number badge
- Icon for each step
- Title and description

**Visual Flow**:
- Horizontal connecting line: `bg-gradient-to-r from-neuro-primary/10 via-neuro-primary/20 to-neuro-primary/10`
- Arrow connectors: CSS triangles pointing right
- Hidden on mobile, visible on desktop

**Step Card**:
- Centered content alignment
- Step badge: `w-14 h-14 rounded-full bg-gradient-to-br from-neuro-primary to-neuro-primary-dark`
- Icon container: `w-20 h-20 rounded-[16px]`

#### Use Cases Pattern

**Layout**:
- Grid: `md:grid-cols-2` (2 cases side by side)
- Each case card contains:
  - Title and scenario
  - Numbered step list
  - Learning outcome section

**Step List**:
- Numbered badges: `w-7 h-7 rounded-full bg-gradient-to-br from-neuro-primary/20 to-neuro-primary/10`
- Step text: `text-sm text-[#525252]`
- Spacing: `space-y-2` between steps

**Outcome Section**:
- Border top separator
- Success icon: `w-6 h-6 rounded-full bg-green-50`
- CheckCircle2 icon from lucide-react

### Animation Guidelines

#### Scroll Animations

**Standard Pattern**:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
>
```

**Staggered Animations**:
- For lists/grids: `delay: index * 0.1`
- Creates cascading effect
- Prevents overwhelming users

**Animation Timing**:
- Standard: `duration: 0.6`
- Fast: `duration: 0.3`
- Slow: `duration: 0.8`

#### Micro-interactions

**Hover States**:
- Buttons: `hover:brightness-110`
- Cards: `hover:shadow-xl hover:border-neuro-primary/20`
- Links: `hover:text-neuro-primary`
- Transitions: `transition-all duration-300`

**Button Animations**:
- Primary buttons: Gradient background with shadow
- Hover: Brightness increase
- Active: Slight scale down (optional)

### Typography Hierarchy

**Section Headers**:
- Main title: `text-3xl sm:text-4xl font-semibold text-[#212121] mb-4`
- Subtitle: `text-lg text-[#525252] max-w-2xl mx-auto`
- Spacing: `mb-16` after header

**Card Titles**:
- Large cards: `text-xl font-semibold`
- Medium cards: `text-lg font-semibold`
- Small cards: `text-base font-semibold`

**Body Text**:
- Primary: `text-sm text-[#525252] leading-relaxed`
- Secondary: `text-xs text-[#8D8D8D]`
- Line height: `leading-relaxed` for readability

### Icon Usage Standards

**Icon Library**: lucide-react (not emojis)

**Sizing**:
- Small: `size={16}` or `size={18}`
- Medium: `size={20}` or `size={24}`
- Large: `size={32}` or `size={36}`

**Color**:
- Primary: `text-neuro-primary`
- Secondary: `text-[#525252]`
- Muted: `text-[#8D8D8D]`
- Success: `text-success`
- Warning: `text-[#DFAD0C]`

**Container Backgrounds**:
- Light: `bg-gradient-to-br from-neuro-primary/10 to-neuro-primary/5`
- Medium: `bg-[#FEF7F3]`
- Dark: `bg-neuro-primary/20`

### Card Design Standards

**Standard Card**:
- Border: `border border-[#EDEDED]`
- Background: `bg-white`
- Border radius: `rounded-[20px]`
- Shadow: `shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)]`
- Padding: `p-6` or `p-8`

**Hover State**:
- Shadow: `hover:shadow-xl`
- Border: `hover:border-neuro-primary/20`
- Transition: `transition-all duration-300`

**Highlighted Card**:
- Border: `border-2 border-neuro-primary/20`
- Background: `bg-gradient-to-br from-white to-neuro-primary/5`

### Content Organization Best Practices

#### Content Reduction

**Principles**:
- Remove redundant sections
- Consolidate similar content
- Focus on conversion goals
- Keep technical details minimal on landing pages

**What to Remove**:
- Roadmap sections (shows unfinished product)
- Detailed technology specs (move to About/Technical docs)
- Excessive use cases (keep 2-3 best examples)
- Redundant trust/explainability sections

**What to Keep**:
- Clear value proposition
- Key features/capabilities
- Social proof (testimonials, stats)
- Clear CTAs
- Essential trust indicators

#### Content Hierarchy

**Priority Order**:
1. Hero (value proposition)
2. Problem/Solution (why it matters)
3. Features (what it does)
4. How It Works (how it works)
5. Social Proof (trust building)
6. Use Cases (examples)
7. Final CTA (conversion)

### Navigation Patterns

**Desktop Navigation**:
- Links: `text-sm font-normal text-[#525252] hover:text-neuro-primary`
- Spacing: `gap-6` between links
- Sticky header with backdrop blur

**Mobile Navigation**:
- Hamburger menu
- Full-width menu overlay
- Smooth open/close animation
- Links stack vertically

**Navigation Links**:
- Keep to 4-5 main sections
- Use anchor links for smooth scrolling
- Update links when sections change

### CTA Button Patterns

**Primary CTA**:
- Gradient background
- White text
- Height: `h-[48px]` (larger on hero)
- Padding: `px-8`
- Shadow: Multi-layer shadow
- Hover: `hover:brightness-110`

**Secondary CTA**:
- Outline style
- Border: `border border-[#EDEDED]`
- Background: `hover:bg-[#F8F8F8]`
- Text: `text-[#212121]`

**Placement**:
- Hero: Below headline and trust indicators
- Final CTA: Centered with social proof
- Inline: Next to primary CTA

### Trust Indicators

**Types**:
- User count: "500+ medical students"
- Ratings: Star display with score
- Testimonials: User quotes
- Trust badges: Institution logos
- Statistics: Animated counters

**Placement**:
- Hero section: Below headline
- Final CTA: Above buttons
- Dedicated section: Social proof section

**Design**:
- Icons: Users, CheckCircle2, Star
- Colors: Primary color for icons
- Typography: `text-sm font-medium`

### Responsive Design Patterns

**Breakpoints**:
- Mobile: Default (< 640px)
- Tablet: `sm:` (≥ 640px)
- Desktop: `md:` (≥ 768px)
- Large: `lg:` (≥ 1024px)

**Grid Adaptations**:
- Mobile: Single column
- Tablet: 2 columns (`md:grid-cols-2`)
- Desktop: 3-4 columns (`lg:grid-cols-3` or `lg:grid-cols-4`)

**Typography Scaling**:
- Headlines: `text-4xl sm:text-5xl lg:text-6xl`
- Body: `text-sm sm:text-base`
- Use responsive text sizes

**Spacing Adjustments**:
- Padding: `px-4 sm:px-6 lg:px-8`
- Gaps: `gap-4 sm:gap-6`
- Margins: Responsive where needed

### Performance Considerations

**Image Optimization**:
- Use Next.js Image component
- Provide proper alt text
- Lazy load images below fold

**Animation Performance**:
- Use `viewport={{ once: true }}` to prevent re-animations
- Limit simultaneous animations
- Use CSS transforms for smooth animations

**Code Splitting**:
- Component-level code splitting
- Lazy load heavy components
- Optimize bundle size

### Accessibility Standards

**Semantic HTML**:
- Use proper heading hierarchy (h1 → h2 → h3)
- Section elements for major sections
- Button elements for interactive elements

**ARIA Labels**:
- Add `aria-label` for icon-only buttons
- Use `aria-label` for carousel navigation
- Provide descriptive labels for form inputs

**Keyboard Navigation**:
- Ensure all interactive elements are keyboard accessible
- Visible focus states
- Logical tab order

**Color Contrast**:
- Text on white: `#212121` (meets WCAG AA)
- Text on gray: `#525252` (meets WCAG AA)
- Links: `#F76B15` with sufficient contrast

### Testing Checklist

**Before Launch**:
- [ ] All sections render correctly on mobile
- [ ] Animations work smoothly
- [ ] CTAs are clickable and functional
- [ ] Navigation links scroll correctly
- [ ] Images load properly
- [ ] No console errors
- [ ] Accessibility audit passed
- [ ] Performance metrics acceptable
- [ ] Cross-browser testing completed

---

## 9. Dashboard/Home Page Design Patterns

This section documents the complete design patterns for dashboard and home page components, including tables, search bars, statistics cards, and layout structures.

### Dashboard Layout Structure

**Main Container**:
- Background: Transparent (inherits from parent gradient background)
- Layout: Flex column
- Padding: `p-6` (24px)
- Overflow: `overflow-x-hidden` to prevent horizontal scroll

**Content Background** (from layout):
- Background: `linear-gradient(180deg, rgba(255, 202, 222, 0.35) 0%, #F8F8F8 62%)`
- Border Radius: `32px` (`rounded-3xl`)
- Position: Relative (for overlay patterns)
- Ripple Overlay: `/assets/images/Ripple.png` positioned top-right

### Header Section

**Welcome Header**:
- Layout: Flex row, space between
- Margin Bottom: `mb-8` (32px)

**Page Title**:
- Font: Inter Variable, 600 weight
- Font Size: `24px` (`text-2xl`)
- Line Height: `1em`
- Letter Spacing: `1%`
- Color: `#212121`
- Example: "Welcome, [username]"

**Page Subtitle**:
- Font: Inter Variable, 400 weight
- Font Size: `14px`
- Line Height: `1.15em`
- Color: `#6B6C6E`
- Example: "[Organization Name] - Organization Management Dashboard"

### Search Bar Component

**Container**:
- Border Radius: `10px` (`rounded-[10px]`)
- Border: `1px solid #EDEDED`
- Background: `#FFFFFF`
- Padding: `8px 12px`
- Height: `40px` (`h-[40px]`)
- Display: Flex, items center
- Gap: `8px` between icon and input
- Width: `240px` (or responsive)
- Shadow: Same as card shadow

**Search Icon**:
- Size: `16px × 16px` (`h-4 w-4`)
- Color: `#212121`
- Icon: Search (from lucide-react)

**Input Field**:
- Background: Transparent
- Border: None
- Outline: None
- Font: Inter Variable, 500 weight
- Font Size: `14px`
- Line Height: `1.15em`
- Letter Spacing: `0.5%`
- Color: `#212121`
- Flex: 1 (takes remaining space)
- Placeholder: "Search"

**Keyboard Shortcut Badge**:
- Border Radius: `22px` (`rounded-[22px]`)
- Background: `#F8F8F8`
- Padding: `2px 6px`
- Font Size: `12px` or `14px`
- Font: Inter Variable, 400 weight
- Color: `#212121`
- Text: "⌘ K" (or appropriate shortcut)

**Implementation**:
```tsx
<div className="flex items-center gap-2 rounded-[10px] border border-[#EDEDED] bg-white px-3 h-[40px] shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)]">
  <Search className="h-4 w-4 text-[#212121]" />
  <input 
    type="text" 
    placeholder="Search" 
    className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-[#212121]"
  />
  <div className="rounded-[22px] bg-[#F8F8F8] px-1.5 py-0.5 text-xs text-[#212121]">⌘ K</div>
</div>
```

### Statistics Cards

**Card Container**:
- Layout: Grid (`grid-cols-1 md:grid-cols-3`)
- Gap: `gap-4` (16px) or `gap-6` (24px)
- Margin Bottom: `mb-6` (24px)

**Individual Stat Card**:

*Default Card Style*:
- Border Radius: `13px` (`rounded-[13px]`)
- Border: `1px solid #EDEDED`
- Background: `#FCFCFC`
- Padding: `p-4` (16px)
- Min Height: `150px` (optional)
- Position: Relative (for pattern overlay)
- Shadow: 
  ```css
  0px 3px 16px 0px rgba(30,37,75,0.02),
  0px 2px 2px 0px rgba(30,37,75,0.01),
  inset 0px 0px 32px 0px rgba(255, 255, 255, 0.5)
  ```

*Highlighted Card Style* (first card):
- Background: `#E0E0E0` (Gray/5)
- Same shadow as default
- Pattern Overlay: `/assets/icons/Pattern.png` at 30% opacity

*Blue Accent Card* (optional):
- Background: `#EBF5FF` or `#D5EFFF`
- Same border and shadow

**Pattern Overlay**:
- Background Image: `url(/assets/icons/Pattern.png)`
- Opacity: `0.3` (30%)
- Position: Absolute, inset-0
- Repeat: Repeat
- Size: Auto

**Card Content Structure**:

1. **Header Row**:
   - Layout: Flex, justify-between
   - Margin Bottom: `mb-4` (16px)

2. **Stat Title**:
   - Font: Inter Variable, 500 weight
   - Font Size: `15px` or `14px`
   - Line Height: `1em`
   - Color: `#212121` or `#0A0A0A`

3. **Icon Container**:
   - Size: `24px × 24px` (`w-6 h-6`)
   - Icon: From `/assets/icons/` directory
   - Examples: `total-patients-icon.svg`, `active-patients-icon.svg`

4. **Stat Value**:
   - Font: Inter Variable, 700 weight (bold)
   - Font Size: `40px` or `56px` (large stats)
   - Line Height: `1` (tight)
   - Color: `#212121` or `#0A0A0A`
   - Margin Bottom: `mb-1` (4px)

5. **Comparison Text**:
   - Layout: Flex, items-center, gap-1
   - Font Size: `12px` (`text-xs`)
   - Color: `#212121` or `#0A0A0A`
   - Trend Icon: `16px × 16px`
   - Examples: `green.svg` (up), `red.svg` (down), `trend-neutral-blue.svg` (neutral)
   - Text: "vs. last month" or similar

**Implementation**:
```tsx
<div className="rounded-[13px] relative overflow-hidden p-4 border border-[#EDEDED] bg-[#FCFCFC]" style={{
  boxShadow: '0px 3px 16px 0px rgba(30,37,75,0.02), 0px 2px 2px 0px rgba(30,37,75,0.01), inset 0px 0px 32px 0px rgba(255, 255, 255, 0.5)'
}}>
  <div className="absolute inset-0 opacity-30" style={{
    backgroundImage: 'url(/assets/icons/Pattern.png)',
    backgroundRepeat: 'repeat',
    backgroundSize: 'auto'
  }}></div>
  <div className="relative z-10">
    <div className="flex items-start justify-between mb-4">
      <span className="text-[15px] font-medium text-[#212121]">Total Users</span>
      <Image src="/assets/icons/total-patients-icon.svg" alt="Icon" width={24} height={24} />
    </div>
    <div className="space-y-1">
      <div className="text-[40px] font-bold leading-none text-[#212121]">324</div>
      <div className="flex items-center gap-1 text-xs">
        <Image src="/assets/icons/green.svg" alt="Trend" width={16} height={16} />
        <span className="text-[#212121]">vs. last month</span>
      </div>
    </div>
  </div>
</div>
```

### Action Buttons

**Button Container**:
- Layout: Flex, gap-2
- Alignment: Items center

**Button Style**:
- Height: `32px` (`h-8`)
- Padding: `px-3` (12px horizontal)
- Border Radius: `10px` (`rounded-[10px]`)
- Border: `1px solid #EDEDED`
- Background: White
- Text Color: `#212121`
- Font Size: `14px` (`text-sm`)
- Font Weight: Normal (`font-normal`)
- Shadow: Same as card shadow
- Hover: `hover:bg-gray-50`
- Gap: `gap-2` (8px) between icon and text

**Icon**:
- Size: `16px × 16px`
- Source: `/assets/icons/` directory
- Examples: `user-icon.svg`, `briefcase-medical.svg`

**Implementation**:
```tsx
<Button 
  variant="outline"
  size="sm"
  className="h-8 px-3 text-sm border border-[#EDEDED] text-[#212121] bg-white hover:bg-gray-50 rounded-[10px] flex items-center gap-2"
  style={{
    boxShadow: '0px 3px 16px 0px rgba(30,37,75,0.02), 0px 2px 2px 0px rgba(30,37,75,0.01)',
  }}
>
  <Image src="/assets/icons/user-icon.svg" alt="User" width={16} height={16} />
  <span className="font-normal">Manage Clinicians</span>
</Button>
```

### Table Components

**Table Container**:
- Background: `#FFFFFF`
- Border: `1px solid #EDEDED`
- Border Radius: `20px` (`rounded-[20px]`)
- Overflow: Hidden
- Shadow: Same as card shadow

**Table Header Section**:
- Padding: `p-6` (24px)
- Border Bottom: `1px solid #EDEDED` (optional)

**Table Title**:
- Font: Inter Variable, 500 weight
- Font Size: `18px`
- Line Height: `1em`
- Letter Spacing: `1%`
- Color: `#212121`
- Margin Bottom: `mb-2` (8px)

**Table Description**:
- Font: Inter Variable, 400 weight
- Font Size: `14px`
- Line Height: `1.15em`
- Color: `#6B6C6E`

**Table Element Styles**:

*Table Wrapper*:
- Width: `100%`
- Overflow: Auto (horizontal scroll if needed)
- Position: Relative

*Table Header (thead)*:
- Border Bottom: `1px solid #EDEDED`
- Background: `#FAFAFA` (optional, for sticky header)

*Table Head (th)*:
- Height: `40px` (`h-10`)
- Padding: `px-2` (8px horizontal)
- Text Align: Left
- Font: Inter Variable, 500 weight (medium)
- Font Size: `16px`
- Color: `#212121`
- Vertical Align: Middle
- White Space: Nowrap

*Table Row (tr)*:
- Border Bottom: `1px solid #EDEDED`
- Hover: `hover:bg-muted/50` (light gray background)
- Selected: `data-[state=selected]:bg-muted` (highlighted background)
- Transition: `transition-colors`

*Table Cell (td)*:
- Padding: `p-2` (8px)
- Vertical Align: Middle
- White Space: Nowrap
- Font Size: `14px`
- Color: `#212121`

**Table Actions**:
- View Button: Small outline button
- Edit/Delete: Icon buttons or dropdown menu

**Implementation**:
```tsx
<div className="rounded-[20px] border border-[#EDEDED] bg-white overflow-hidden shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02),0px_2px_2px_0px_rgba(30,37,75,0.01)]">
  <div className="p-6 border-b border-[#EDEDED]">
    <h3 className="text-[18px] font-medium text-[#212121] mb-2">Table Title</h3>
    <p className="text-sm text-[#6B6C6E]">Table description</p>
  </div>
  <div className="relative w-full overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="border-b">
        <tr>
          <th className="h-10 px-2 text-left font-medium text-[#212121]">Column 1</th>
          <th className="h-10 px-2 text-left font-medium text-[#212121]">Column 2</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b hover:bg-gray-50 transition-colors">
          <td className="p-2">Data 1</td>
          <td className="p-2">Data 2</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### Badge Components

**Status Badges**:

*Active Badge*:
- Background: `#DEF8E7`
- Text Color: `#13893A`
- Padding: `2.5px 8px`
- Border Radius: Variable (rounded)
- Font Size: `13px`
- Font Weight: 400

*Inactive Badge*:
- Background: `#F5F5F5`
- Text Color: `#6B6C6E`
- Same padding and styling

*Warning Badge*:
- Background: `#FBF6E4`
- Text Color: `#DFAD0C`
- Same padding and styling

**Badge with Dot**:
- Layout: Flex, items-center, gap-1.5
- Dot Size: `8px × 8px`
- Dot Border Radius: `50%` (circle)
- Dot Color: Matches text color

### Battery/Device Cards

**Battery Card** (Special):
- Border Radius: `13px` (`rounded-[13px]`)
- Border: None
- Background: `#080808` (Black)
- Position: Relative
- Overflow: Hidden
- Min Height: `150px`
- Pattern Overlay: `/assets/icons/rectangle-stripe.png`

**Battery Icon**:
- Size: `20px × 20px`
- Source: `/assets/icons/battery 1.svg`, `battery 2.svg`, `battery 3.svg`
- Color: White or appropriate color

**Battery Percentage Display**:
- Font: Large, bold
- Color: White (on black background)
- Visual: Progress bar or fill indicator

### Section Cards

**Main Section Card**:
- Border Radius: `20px` (`rounded-[20px]`)
- Border: `1px solid #EDEDED`
- Background: `#FFFFFF` or `#FFFBFB`
- Padding: `p-6` (24px) or `p-4` (16px)
- Shadow: Standard card shadow
- Margin Bottom: `mb-6` (24px)

**Card Header**:
- Layout: Flex, justify-between
- Margin Bottom: `mb-4` (16px) or `mb-6` (24px)

**Card Title**:
- Font: Inter Variable, 500 or 600 weight
- Font Size: `16px` or `18px`
- Color: `#212121` or `#0A0A0A`
- Line Height: `1em`
- Letter Spacing: `1%`

**Card Subtitle/Description**:
- Font: Inter Variable, 400 weight
- Font Size: `12px` or `14px`
- Color: `#6B6C6E`
- Line Height: `1.15em`

### Content Area Background

**Gradient Background** (from layout):
```css
background: linear-gradient(180deg, rgba(255, 202, 222, 0.35) 0%, #F8F8F8 62%);
border-radius: 32px;
```

**Ripple Overlay**:
- Image: `/assets/images/Ripple.png`
- Position: Top right
- Size: `900px auto` (or responsive)
- Z-Index: 0 (behind content)
- Pointer Events: None

**Implementation**:
```tsx
<div 
  className="flex flex-1 flex-col overflow-hidden relative rounded-3xl"
  style={{
    background: 'linear-gradient(180deg, rgba(255, 202, 222, 0.35) 0%, #F8F8F8 62%)',
  }}
>
  <div 
    className="absolute inset-0 pointer-events-none"
    style={{
      backgroundImage: 'url(/assets/images/Ripple.png)',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'top right',
      backgroundSize: '900px auto',
      zIndex: 0
    }}
  ></div>
  <main className="flex-1 overflow-y-auto p-6 relative z-10">
    {/* Content */}
  </main>
</div>
```

---

## 10. Complete Asset Inventory

This section provides a comprehensive list of all required assets (images, icons, gradients) needed for the Neuro Medica application.

### Required Asset Files

#### 1. Gradient Backgrounds

**`/public/gradient.svg`** - **REQUIRED**
- **Purpose**: Full-page background for sign-in and sign-up pages
- **Format**: SVG (Scalable Vector Graphics)
- **Dimensions**: 1392 × 976 pixels (scales to any size)
- **Description**: Layered blurred ellipses creating soft pink-to-peach gradient effect
- **Colors**: 
  - Top: `#F6D5EB` (soft pink)
  - Middle: `#F9DDE5` (light pink)
  - Lower: `#F4D7E2` → `#F9DCCE` → `#FADFC0` (pink to peach)
- **Usage**: Applied as `backgroundImage: "url('/gradient.svg')"` with `backgroundSize: "cover"`

#### 2. Pattern Overlays

**`/public/assets/icons/Pattern.png`** - **REQUIRED**
- **Purpose**: Subtle pattern overlay for statistics cards
- **Format**: PNG with transparency
- **Usage**: Applied as background image at 30% opacity
- **Position**: Absolute, covering entire card
- **Repeat**: Repeat pattern

**`/public/assets/icons/rectangle-stripe.png`** - **REQUIRED**
- **Purpose**: Pattern overlay for battery/device cards
- **Format**: PNG
- **Usage**: Background pattern for dark cards

#### 3. Ripple/Texture Overlays

**`/public/assets/images/Ripple.png`** - **REQUIRED**
- **Purpose**: Overlay pattern on dashboard content areas
- **Format**: PNG with transparency
- **Position**: Top right
- **Size**: 900px auto (or responsive)
- **Z-Index**: 0 (behind content)
- **Usage**: Creates subtle texture overlay on dashboard backgrounds

**`/public/assets/images/ripple-bg.svg`** - **OPTIONAL**
- **Purpose**: Alternative ripple background (SVG version)
- **Format**: SVG

#### 4. Brand Logo

**`/public/assets/icons/Logo.svg`** - **REQUIRED**
- **Purpose**: Brand logo for headers and sidebars
- **Format**: SVG (scalable)
- **Recommended Size**: 156 × 24px (or proportional)
- **Usage**: Sidebar headers, navigation bars

#### 5. Sidebar Icons (Navigation)

**Location**: `/public/assets/sidebar-icons/`

All icons should be SVG format, 14 × 14px for navigation items:

- **`dashboard-icon.svg`** - **REQUIRED**
  - Purpose: Dashboard navigation item
  - Size: 14 × 14px

- **`clinicals-icon.svg`** - **REQUIRED**
  - Purpose: Clinicals/Staff navigation item
  - Size: 14 × 14px

- **`patients-icon.svg`** - **REQUIRED**
  - Purpose: Patients navigation item
  - Size: 14 × 14px

- **`devices-icon.svg`** - **REQUIRED**
  - Purpose: Devices navigation item
  - Size: 14 × 14px

- **`analytics-icon.svg`** - **REQUIRED**
  - Purpose: Analytics navigation item
  - Size: 14 × 14px

- **`settings-icon.svg`** - **REQUIRED**
  - Purpose: Settings navigation item
  - Size: 14 × 14px

- **`support-icon.svg`** - **REQUIRED**
  - Purpose: Support navigation item
  - Size: 14 × 14px

- **`documentation-icon.svg`** - **REQUIRED**
  - Purpose: Documentation navigation item
  - Size: 14 × 14px

- **`logout-icon.svg`** - **REQUIRED**
  - Purpose: Logout button icon
  - Size: 20 × 20px (slightly larger)

#### 6. General Icons (Dashboard & UI)

**Location**: `/public/assets/icons/`

- **`user-icon.svg`** - **REQUIRED**
  - Purpose: User/people related actions
  - Size: 16 × 16px (for buttons)
  - Usage: "Manage Clinicians" button, user-related UI

- **`briefcase-medical.svg`** - **REQUIRED**
  - Purpose: Facility/medical related actions
  - Size: 16 × 16px (for buttons)
  - Usage: "Manage Facilities" button

- **`total-patients-icon.svg`** - **REQUIRED**
  - Purpose: Total users/patients statistic icon
  - Size: 24 × 24px
  - Usage: Statistics cards

- **`active-patients-icon.svg`** - **REQUIRED**
  - Purpose: Active patients/staff statistic icon
  - Size: 24 × 24px
  - Usage: Statistics cards

- **`inactive-patients-icon.svg`** - **OPTIONAL**
  - Purpose: Inactive patients/staff statistic icon
  - Size: 24 × 24px

- **`active-staffs-icon.svg`** - **OPTIONAL**
  - Purpose: Active staff statistic icon
  - Size: 24 × 24px

- **`inactive-staffs-icon.svg`** - **OPTIONAL**
  - Purpose: Inactive staff statistic icon
  - Size: 24 × 24px

- **`total-staffs-icon.svg`** - **OPTIONAL**
  - Purpose: Total staff statistic icon
  - Size: 24 × 24px

#### 7. Trend/Status Icons

- **`green.svg`** - **REQUIRED**
  - Purpose: Upward trend indicator
  - Size: 16 × 16px
  - Usage: Statistics comparison text

- **`red.svg`** - **REQUIRED**
  - Purpose: Downward trend indicator
  - Size: 16 × 16px
  - Usage: Statistics comparison text

- **`trend-neutral-blue.svg`** - **REQUIRED**
  - Purpose: Neutral/stable trend indicator
  - Size: 16 × 16px
  - Usage: Statistics comparison text

- **`trend-up-green.svg`** - **OPTIONAL**
  - Alternative upward trend icon

- **`trend-down-red.svg`** - **OPTIONAL**
  - Alternative downward trend icon

#### 8. Battery Icons

- **`battery 1.svg`** - **REQUIRED**
  - Purpose: Battery health indicator (level 1)
  - Size: 20 × 20px
  - Usage: Battery/device cards

- **`battery 2.svg`** - **REQUIRED**
  - Purpose: Battery health indicator (level 2)
  - Size: 20 × 20px
  - Usage: Battery/device cards

- **`battery 3.svg`** - **REQUIRED**
  - Purpose: Battery health indicator (level 3)
  - Size: 20 × 20px
  - Usage: Battery/device cards

- **`battery.png`** - **OPTIONAL**
  - Alternative battery icon (PNG format)

#### 9. UI Element Icons

- **`search-icon.svg`** - **OPTIONAL**
  - Purpose: Search input icon (can use lucide-react Search icon instead)
  - Size: 16 × 16px

- **`filter-icon.svg`** - **OPTIONAL**
  - Purpose: Filter button icon
  - Size: 16 × 16px

- **`plus-icon.svg`** - **REQUIRED**
  - Purpose: Add/create actions
  - Size: 16 × 16px
  - Usage: Add buttons, create actions

- **`dots-vertical.svg`** - **OPTIONAL**
  - Purpose: More options menu
  - Size: 16 × 16px

- **`arrow-up-right.svg`** - **OPTIONAL**
  - Purpose: External link indicator
  - Size: 16 × 16px

- **`help-circle.svg`** - **OPTIONAL**
  - Purpose: Help/tooltip icon
  - Size: 16 × 16px

#### 10. Sidebar Decorative Elements

- **`Vector (1).svg`** - **REQUIRED**
  - Purpose: Sidebar collapse/expand toggle icon
  - Size: 13 × 13px
  - Usage: Sidebar header toggle button

- **`Vector.svg`** - **OPTIONAL**
  - Alternative vector icon

- **`Group 1244832313.svg`** - **REQUIRED**
  - Purpose: Sidebar gradient background (decorative footer)
  - Format: SVG
  - Usage: Bottom of sidebar for decorative effect
  - Position: Absolute bottom, full width

- **`Group 1244832316.svg`** - **OPTIONAL**
  - Alternative decorative element

#### 11. User/Avatar Images

- **`Memoji Boys 2-21.png`** - **OPTIONAL**
  - Purpose: Default user avatar
  - Format: PNG
  - Size: 36 × 36px
  - Usage: Sidebar user profile section

- **`user-avatar.png`** - **OPTIONAL**
  - Location: `/public/assets/sidebar-icons/`
  - Purpose: Alternative user avatar
  - Format: PNG

#### 12. Alert/Notification Icons

- **`message-heart-circle.png`** - **REQUIRED**
  - Purpose: AI Predictive Alert icon
  - Format: PNG
  - Size: 12 × 12px (displayed as 12px)
  - Usage: Alert cards in sidebar

#### 13. Empty State Images

- **`empty-state-clinicals.svg`** - **OPTIONAL**
  - Location: `/public/assets/images/`
  - Purpose: Empty state illustration for clinicals section
  - Format: SVG

- **`medical-box-empty-state.png`** - **OPTIONAL**
  - Location: `/public/`
  - Purpose: Empty state for medical/device sections
  - Format: PNG

#### 14. Additional Decorative Elements

- **`Frame 1244832485.svg`** - **OPTIONAL**
  - Purpose: Decorative frame element

- **`image 4.png`** / **`image 4.svg`** - **OPTIONAL**
  - Purpose: General image assets

- **`image 5.svg`** - **OPTIONAL**
  - Purpose: General image asset

- **`Line 347.png`**, **`Line 348.png`**, **`Line 349.png`** - **OPTIONAL**
  - Purpose: Decorative line elements

- **`top layer1.png`** - **OPTIONAL**
  - Purpose: Decorative layer element

- **`Subtract.png`** - **OPTIONAL**
  - Purpose: Decorative element

- **`Container (1).png`** - **OPTIONAL**
  - Purpose: Container/decorative element

- **`group.png`** - **OPTIONAL**
  - Purpose: Group/decorative element

- **`power.png`** - **OPTIONAL**
  - Purpose: Power/energy related icon

### Complete Asset Directory Structure

```
public/
├── gradient.svg                          [REQUIRED - Auth page background]
├── lynx-logo.png                        [OPTIONAL - Alternative logo]
├── medical-box-empty-state.png          [OPTIONAL - Empty state]
├── Pattern.png                          [OPTIONAL - Alternative pattern]
│
└── assets/
    ├── icons/
    │   ├── Logo.svg                     [REQUIRED - Brand logo]
    │   ├── Pattern.png                  [REQUIRED - Card pattern overlay]
    │   ├── rectangle-stripe.png         [REQUIRED - Battery card pattern]
    │   │
    │   ├── user-icon.svg                [REQUIRED - User actions]
    │   ├── briefcase-medical.svg        [REQUIRED - Facility actions]
    │   ├── briefcase-medical 2.svg      [OPTIONAL - Alternative]
    │   │
    │   ├── total-patients-icon.svg      [REQUIRED - Stats icon]
    │   ├── active-patients-icon.svg     [REQUIRED - Stats icon]
    │   ├── inactive-patients-icon.svg   [OPTIONAL - Stats icon]
    │   ├── total-staffs-icon.svg        [OPTIONAL - Stats icon]
    │   ├── active-staffs-icon.svg       [OPTIONAL - Stats icon]
    │   ├── inactive-staffs-icon.svg     [OPTIONAL - Stats icon]
    │   │
    │   ├── green.svg                    [REQUIRED - Up trend]
    │   ├── red.svg                      [REQUIRED - Down trend]
    │   ├── trend-neutral-blue.svg       [REQUIRED - Neutral trend]
    │   ├── trend-up-green.svg           [OPTIONAL - Alternative]
    │   ├── trend-down-red.svg           [OPTIONAL - Alternative]
    │   │
    │   ├── battery 1.svg                [REQUIRED - Battery icon 1]
    │   ├── battery 2.svg                [REQUIRED - Battery icon 2]
    │   ├── battery 3.svg                [REQUIRED - Battery icon 3]
    │   ├── battery.png                  [OPTIONAL - Alternative]
    │   │
    │   ├── plus-icon.svg                [REQUIRED - Add action]
    │   ├── search-icon.svg              [OPTIONAL - Search icon]
    │   ├── filter-icon.svg              [OPTIONAL - Filter icon]
    │   ├── dots-vertical.svg            [OPTIONAL - More menu]
    │   ├── arrow-up-right.svg           [OPTIONAL - External link]
    │   ├── help-circle.svg              [OPTIONAL - Help icon]
    │   ├── chat-icon.svg                [OPTIONAL - Chat icon]
    │   ├── id-badge-2 1.svg             [OPTIONAL - Badge icon]
    │   │
    │   ├── Vector (1).svg               [REQUIRED - Sidebar toggle]
    │   ├── Vector.svg                   [OPTIONAL - Alternative]
    │   ├── Group 1244832313.svg         [REQUIRED - Sidebar gradient]
    │   ├── Group 1244832316.svg         [OPTIONAL - Alternative]
    │   │
    │   ├── message-heart-circle.png     [REQUIRED - Alert icon]
    │   ├── Memoji Boys 2-21.png        [OPTIONAL - Avatar]
    │   │
    │   └── [other optional decorative icons]
    │
    ├── images/
    │   ├── Ripple.png                   [REQUIRED - Dashboard overlay]
    │   ├── ripple-bg.svg                [OPTIONAL - Alternative]
    │   ├── Group 1244832313 (1).svg     [OPTIONAL - Decorative]
    │   └── empty-state-clinicals.svg    [OPTIONAL - Empty state]
    │
    └── sidebar-icons/
        ├── dashboard-icon.svg           [REQUIRED - Nav icon]
        ├── clinicals-icon.svg           [REQUIRED - Nav icon]
        ├── patients-icon.svg            [REQUIRED - Nav icon]
        ├── devices-icon.svg             [REQUIRED - Nav icon]
        ├── analytics-icon.svg           [REQUIRED - Nav icon]
        ├── settings-icon.svg            [REQUIRED - Nav icon]
        ├── support-icon.svg             [REQUIRED - Nav icon]
        ├── documentation-icon.svg       [REQUIRED - Nav icon]
        ├── logout-icon.svg              [REQUIRED - Logout icon]
        └── user-avatar.png              [OPTIONAL - Avatar]
```

### Asset Usage Summary

**Critical Assets (Must Have)**:
1. `/public/gradient.svg` - Auth page background
2. `/public/assets/icons/Logo.svg` - Brand logo
3. `/public/assets/icons/Pattern.png` - Card pattern
4. `/public/assets/images/Ripple.png` - Dashboard overlay
5. All sidebar navigation icons (8 icons)
6. Statistics card icons (3-4 icons)
7. Trend icons (3 icons)
8. Battery icons (3 icons)
9. Action button icons (2-3 icons)
10. Sidebar decorative elements (2 icons)

**Important Assets (Should Have)**:
- User/avatar images
- Alert/notification icons
- Additional UI element icons

**Optional Assets (Nice to Have)**:
- Empty state illustrations
- Decorative elements
- Alternative icon variations

### Asset Creation Guidelines

**Icon Specifications**:
- **Format**: SVG preferred (scalable, crisp at any size)
- **Size**: Match specified dimensions (14px, 16px, 20px, 24px)
- **Color**: Monochrome or single color (will be filtered/inverted as needed)
- **Style**: Consistent line weight and style across all icons
- **Optimization**: Optimize SVG files for web (remove unnecessary metadata)

**Image Specifications**:
- **Format**: PNG for photos/patterns, SVG for illustrations
- **Transparency**: Use PNG with alpha channel where needed
- **Optimization**: Compress images for web (use tools like ImageOptim, TinyPNG)
- **Responsive**: Provide @2x versions for retina displays if needed

**Gradient SVG**:
- The gradient.svg file uses complex layered ellipses with blur filters
- Can be recreated in design tools (Figma, Illustrator) or generated programmatically
- Maintain the soft, organic blob-like appearance

---

## Design Tokens Summary

### Quick Reference

**Primary Colors**:
- Main: `#E55A2A`
- Light: `#F07A4A`
- Dark: `#C44A1A`

**Gradients**:
- Primary: `linear-gradient(180deg, #FFA8C8 7%, #F58947 70%, #F47325 88%, #FF4F34 100%)`
- Background: `linear-gradient(180deg, rgba(255, 202, 222, 0.35) 0%, #F8F8F8 62%)`

**Spacing**:
- Base: 4px grid
- Common: 8px, 12px, 16px, 24px

**Border Radius**:
- Small: 4px, 6px, 8px
- Medium: 10px, 13px
- Large: 16px, 20px, 24px, 32px

**Typography**:
- Font: Inter
- Sizes: 10px, 11px, 12px, 13px, 14px, 18px, 20px, 24px, 40px
- Weights: 400 (normal), 500 (medium), 600 (semibold)

---

*This design system is comprehensive and ready for implementation. Use this document as the single source of truth for all design decisions in the Neuro Medica application. All specifications are based on proven design patterns and can be implemented using modern web technologies (Next.js, React, Tailwind CSS).*
