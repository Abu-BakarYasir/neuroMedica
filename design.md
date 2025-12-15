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
