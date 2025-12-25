# Sidebar Implementation Documentation

## Overview
This document provides a complete breakdown of the sidebar implementation used in the Lynx Flow Health application. The sidebar features a collapsible design with gradient backgrounds, layered AI alert cards, and detailed styling specifications.

---

## Table of Contents
1. [Main Container Structure](#main-container-structure)
2. [Logo Header Section](#logo-header-section)
3. [Navigation Items](#navigation-items)
4. [Active State Gradient](#active-state-gradient)
5. [Settings & Help Section](#settings--help-section)
6. [AI Predictive Alert Cards](#ai-predictive-alert-cards)
7. [Gradient Background Image](#gradient-background-image)
8. [Line Separator](#line-separator)
9. [User Profile Section](#user-profile-section)
10. [Collapsed State](#collapsed-state)
11. [Responsive Behavior](#responsive-behavior)
12. [Assets & Images](#assets--images)
13. [Color Specifications](#color-specifications)
14. [Typography](#typography)
15. [Spacing & Layout](#spacing--layout)

---

## Main Container Structure

### Base Container
```tsx
<div className={cn(
  "bg-[#F8F8F8] rounded-[24px] flex flex-col px-4 py-[10px] h-full transition-all duration-300 overflow-hidden relative",
  isCollapsed ? "w-20" : "w-[260px]",
  className
)}>
```

**Key Properties:**
- **Background Color**: `#F8F8F8` (Light gray)
- **Border Radius**: `24px` (rounded corners)
- **Padding**: 
  - Horizontal: `16px` (`px-4`)
  - Vertical: `10px` (`py-[10px]`)
- **Width**:
  - Expanded: `260px` (`w-[260px]`)
  - Collapsed: `80px` (`w-20`)
- **Height**: `100%` (full height)
- **Transition**: `duration-300` (300ms smooth transitions)
- **Overflow**: `hidden` (clips content outside bounds)
- **Position**: `relative` (for absolute positioning of child elements)

---

## Logo Header Section

### Structure
```tsx
<div className="flex items-center justify-between mb-[29px]">
  {!isCollapsed && (
    <Image
      src="/assets/icons/Logo.svg"
      alt="Lynx Flow Health"
      width={156}
      height={24}
      className="object-contain"
    />
  )}
  <button
    onClick={() => setIsCollapsed(!isCollapsed)}
    className="w-4 h-4 flex items-center justify-center hover:opacity-70 transition-opacity"
  >
    <Image
      src="/assets/icons/Vector (1).svg"
      alt="Menu"
      width={13}
      height={13}
      className="object-contain"
    />
  </button>
</div>
```

**Logo Specifications:**
- **Path**: `/assets/icons/Logo.svg`
- **Dimensions**: `156px × 24px`
- **Display**: Only visible when sidebar is expanded (`!isCollapsed`)
- **Object Fit**: `contain` (maintains aspect ratio)

**Toggle Button:**
- **Path**: `/assets/icons/Vector (1).svg`
- **Dimensions**: `13px × 13px`
- **Container Size**: `16px × 16px` (`w-4 h-4`)
- **Hover Effect**: `opacity-70` (30% opacity reduction on hover)
- **Transition**: `transition-opacity` (smooth opacity change)

**Spacing:**
- **Bottom Margin**: `29px` (`mb-[29px]`)

---

## Navigation Items

### Main Navigation Container
```tsx
<nav className="space-y-[2px] mb-3">
```

**Spacing:**
- **Vertical Gap**: `2px` between items (`space-y-[2px]`)
- **Bottom Margin**: `12px` (`mb-3`)

### Navigation Item Structure
```tsx
<Link key={item.name} href={item.href} title={isCollapsed ? item.name : undefined}>
  <div
    className={cn(
      "flex items-center px-2 rounded-[8px] transition-all h-[28px]",
      isCollapsed ? "justify-center gap-0" : "gap-1.5",
      isActive
        ? "bg-[linear-gradient(...)] shadow-[...] [box-shadow:...]"
        : "hover:bg-gray-200/50"
    )}
  >
    {/* Icon and Text */}
  </div>
</Link>
```

**Base Properties:**
- **Height**: `28px` (`h-[28px]`)
- **Horizontal Padding**: `8px` (`px-2`)
- **Border Radius**: `8px` (`rounded-[8px]`)
- **Gap**:
  - Expanded: `6px` (`gap-1.5`)
  - Collapsed: `0px` (`gap-0`)
- **Justify Content**:
  - Expanded: `flex-start` (default)
  - Collapsed: `center` (`justify-center`)
- **Hover State**: `hover:bg-gray-200/50` (50% opacity gray background)

### Icon Container
```tsx
<div className="w-[14px] h-[14px] relative flex-shrink-0">
  <Image
    src={item.icon}
    alt={item.name}
    width={14}
    height={14}
    className={cn(
      "object-contain",
      isActive ? "brightness-0 invert" : ""
    )}
    style={!isActive ? { 
      filter: 'invert(32%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(98%) contrast(89%)' 
    } : {}}
  />
</div>
```

**Icon Specifications:**
- **Size**: `14px × 14px`
- **Object Fit**: `contain`
- **Active State**: 
  - `brightness-0 invert` (makes icon white)
- **Inactive State Filter**:
  - `invert(32%)` - Inverts 32% of colors
  - `sepia(0%)` - No sepia effect
  - `saturate(0%)` - No saturation
  - `brightness(98%)` - Slightly dimmed
  - `contrast(89%)` - Reduced contrast
  - Result: Gray icon color (`#525252` equivalent)

### Navigation Text
```tsx
{!isCollapsed && (
  <span
    className={cn(
      "text-[14px] font-normal leading-[1.15]",
      isActive ? "text-white" : "text-[#525252]"
    )}
    style={{ letterSpacing: "0.5%" }}
  >
    {item.name}
  </span>
)}
```

**Typography:**
- **Font Size**: `14px` (`text-[14px]`)
- **Font Weight**: `normal` (`font-normal`)
- **Line Height**: `1.15` (`leading-[1.15]`)
- **Letter Spacing**: `0.5%` (inline style)
- **Colors**:
  - Active: `white` (`text-white`)
  - Inactive: `#525252` (dark gray)

---

## Active State Gradient

### Complete Gradient Definition
```css
background: linear-gradient(
  180deg,
  rgba(255,168,200,1) 7%,    /* Pink */
  rgba(245,137,71,1) 70%,    /* Orange */
  rgba(244,115,37,1) 88%,    /* Dark Orange */
  rgba(255,79,52,1) 100%     /* Red-Orange */
);
```

**Gradient Breakdown:**
- **Direction**: `180deg` (top to bottom)
- **Color Stops**:
  1. **7%**: `rgba(255,168,200,1)` - Light Pink (`#FFA8C8`)
  2. **70%**: `rgba(245,137,71,1)` - Orange (`#F58947`)
  3. **88%**: `rgba(244,115,37,1)` - Dark Orange (`#F47325`)
  4. **100%**: `rgba(255,79,52,1)` - Red-Orange (`#FF4F34`)

### Shadow Effects

#### Outer Shadow (Multiple Layers)
```css
box-shadow: 
  0px 1.43px 3.06px 0px rgba(0,0,0,0.04),    /* Layer 1 */
  0px 5.72px 5.72px 0px rgba(0,0,0,0.03),    /* Layer 2 */
  0px 12.87px 7.76px 0px rgba(0,0,0,0.02),   /* Layer 3 */
  0px 22.67px 9.19px 0px rgba(0,0,0,0.01),   /* Layer 4 */
  0px 35.53px 10.01px 0px rgba(0,0,0,0);     /* Layer 5 */
```

**Shadow Layers:**
1. **Layer 1**: `1.43px` offset, `3.06px` blur, `4%` opacity
2. **Layer 2**: `5.72px` offset, `5.72px` blur, `3%` opacity
3. **Layer 3**: `12.87px` offset, `7.76px` blur, `2%` opacity
4. **Layer 4**: `22.67px` offset, `9.19px` blur, `1%` opacity
5. **Layer 5**: `35.53px` offset, `10.01px` blur, `0%` opacity

#### Inner Shadow (Inset)
```css
box-shadow: 
  inset 0px 0px 8.4px 4.2px rgba(255,255,255,0.4),
  inset 0px 4px 3px 0px rgba(255,255,255,0.28);
```

**Inner Shadow Layers:**
1. **Layer 1**: `inset`, `8.4px` blur, `4.2px` spread, `40%` white opacity
2. **Layer 2**: `inset`, `4px` vertical offset, `3px` blur, `28%` white opacity

**Combined Effect**: Creates a glossy, elevated appearance with depth.

---

## Settings & Help Section

### Section Header
```tsx
{!isCollapsed && (
  <p className="text-[11px] text-[#838383] mb-1 px-2 leading-[1.15]" style={{ letterSpacing: "0.5%" }}>
    Settings & help
  </p>
)}
```

**Typography:**
- **Font Size**: `11px` (`text-[11px]`)
- **Color**: `#838383` (medium gray)
- **Line Height**: `1.15`
- **Letter Spacing**: `0.5%`
- **Padding**: `8px` horizontal (`px-2`)
- **Margin**: `4px` bottom (`mb-1`)

### Settings Navigation Items
Same structure as main navigation, but with different styling:

**Icon Filter (Inactive):**
```css
filter: 'invert(12%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(98%) contrast(89%)'
```
- **Result**: Darker gray (`#202020` equivalent)

**Text Color (Inactive):**
- `text-[#202020]` (darker than main navigation)

**Padding:**
- `px-2 py-1.5` (8px horizontal, 6px vertical)

---

## AI Predictive Alert Cards

### Container Structure
```tsx
{!isCollapsed && (
  <div className="mb-8 relative h-[120px] z-20">
    {/* Three layered cards */}
  </div>
)}
```

**Container Properties:**
- **Height**: `120px` (`h-[120px]`)
- **Bottom Margin**: `32px` (`mb-8`)
- **Position**: `relative`
- **Z-Index**: `20` (`z-20`)
- **Display**: Only visible when expanded

### Bottom Layer (Smallest)
```tsx
<div className="absolute left-1/2 -translate-x-1/2 top-[14px] w-[180px] h-[120px] bg-white border-[0.85px] border-[#EDEDED] rounded-[10px] opacity-50 shadow-sm">
```

**Properties:**
- **Position**: `absolute`
- **Horizontal Center**: `left-1/2 -translate-x-1/2`
- **Top Offset**: `14px` (`top-[14px]`)
- **Width**: `180px` (`w-[180px]`)
- **Height**: `120px` (`h-[120px]`)
- **Background**: `white` (`bg-white`)
- **Border**: `0.85px solid #EDEDED`
- **Border Radius**: `10px` (`rounded-[10px]`)
- **Opacity**: `50%` (`opacity-50`)
- **Shadow**: `shadow-sm` (small shadow)

**Content Padding:**
- `left-3 top-3` (12px from left and top)
- **Content Width**: `154px` (`w-[154px]`)

### Middle Layer
```tsx
<div className="absolute left-1/2 -translate-x-1/2 top-[7px] w-[200px] h-[120px] bg-white border-[0.85px] border-[#EDEDED] rounded-[10px] opacity-50 shadow-sm">
```

**Properties:**
- **Top Offset**: `7px` (`top-[7px]`)
- **Width**: `200px` (`w-[200px]`)
- **Content Width**: `174px` (`w-[174px]`)
- All other properties same as bottom layer

### Top Layer (Front)
```tsx
<div className="absolute left-1/2 -translate-x-1/2 top-0 bg-white border-[0.85px] border-[#EDEDED] rounded-[10px] p-3 w-[220px] h-[120px] shadow-md">
```

**Properties:**
- **Top Offset**: `0px` (`top-0`)
- **Width**: `220px` (`w-[220px]`)
- **Padding**: `12px` (`p-3`)
- **Shadow**: `shadow-md` (medium shadow)
- **Opacity**: `100%` (fully opaque)

### AI Alert Icon
```tsx
<div className="w-3 h-3 relative flex-shrink-0">
  <Image
    src="/assets/icons/message-heart-circle.png"
    alt="AI Alert"
    width={12}
    height={12}
    className="object-contain"
  />
</div>
```

**Icon Specifications:**
- **Path**: `/assets/icons/message-heart-circle.png`
- **Size**: `12px × 12px`
- **Container**: `12px × 12px` (`w-3 h-3`)

### Alert Text Content

**Header Text:**
```tsx
<span className="text-[11px] font-medium text-[#E2AB02] leading-none">
  AI Predictive Alert
</span>
```

**Properties:**
- **Font Size**: `11px` (`text-[11px]`)
- **Font Weight**: `medium` (`font-medium`)
- **Color**: `#E2AB02` (gold/yellow)
- **Line Height**: `none` (`leading-none`)

**Title Text:**
```tsx
<p className="text-[13px] font-medium text-[#070707] leading-[1.3]">
  Gathering Data for Predictive Analytics
</p>
```

**Properties:**
- **Font Size**: `13px` (`text-[13px]`)
- **Font Weight**: `medium` (`font-medium`)
- **Color**: `#070707` (near black)
- **Line Height**: `1.3` (`leading-[1.3]`)

**Description Text:**
```tsx
<p className="text-[10px] font-normal text-[#767676] leading-[1.3]">
  We're collecting patient data to enable AI-powered health predictions.
</p>
```

**Properties:**
- **Font Size**: `10px` (`text-[10px]`)
- **Font Weight**: `normal` (`font-normal`)
- **Color**: `#767676` (medium gray)
- **Line Height**: `1.3` (`leading-[1.3]`)

**Content Spacing:**
- **Gap Between Elements**: `8px` (`gap-2`)
- **Gap Within Text Groups**: `4px` (`gap-1`)

---

## Gradient Background Image

### Background Container
```tsx
<div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden rounded-b-[24px]">
  <Image
    src="/assets/icons/Group 1244832313.svg"
    alt=""
    width={276}
    height={429}
    className="w-full h-auto object-cover object-bottom"
    style={{ mixBlendMode: 'normal' }}
  />
</div>
```

**Container Properties:**
- **Position**: `absolute`
- **Positioning**: `bottom-0 left-0 right-0` (anchored to bottom)
- **Pointer Events**: `none` (doesn't interfere with clicks)
- **Overflow**: `hidden`
- **Border Radius**: `24px` bottom corners (`rounded-b-[24px]`)

**Image Properties:**
- **Path**: `/assets/icons/Group 1244832313.svg`
- **Original Dimensions**: `276px × 429px`
- **Display**: `w-full h-auto` (full width, auto height)
- **Object Fit**: `cover`
- **Object Position**: `bottom` (aligned to bottom)
- **Blend Mode**: `normal` (no special blending)

**Purpose**: Provides decorative gradient background at the bottom of the sidebar.

---

## Line Separator

### Separator Element
```tsx
{!isCollapsed && (
  <div className="mb-3 w-full h-[2px] bg-white relative z-10" />
)}
```

**Properties:**
- **Height**: `2px` (`h-[2px]`)
- **Width**: `100%` (`w-full`)
- **Background**: `white` (`bg-white`)
- **Bottom Margin**: `12px` (`mb-3`)
- **Position**: `relative`
- **Z-Index**: `10` (`z-10`)
- **Display**: Only visible when expanded

**Purpose**: Visual separator between AI alert cards and user profile section.

---

## User Profile Section

### Container
```tsx
<div className={cn(
  "flex items-center pb-1 relative z-10",
  isCollapsed ? "justify-center flex-col gap-2" : "gap-2.5"
)}>
```

**Properties:**
- **Layout**: `flex items-center`
- **Padding Bottom**: `4px` (`pb-1`)
- **Position**: `relative`
- **Z-Index**: `10` (`z-10`)
- **Gap**:
  - Expanded: `10px` (`gap-2.5`)
  - Collapsed: `8px` (`gap-2`) and `flex-col` (vertical stack)

### Avatar Container
```tsx
<div className="w-9 h-9 relative rounded-[10px] bg-white overflow-hidden flex-shrink-0">
  <Image
    src="/assets/icons/Memoji Boys 2-21.png"
    alt="User Avatar"
    width={36}
    height={36}
    className="object-cover"
  />
</div>
```

**Avatar Properties:**
- **Size**: `36px × 36px` (`w-9 h-9`)
- **Border Radius**: `10px` (`rounded-[10px]`)
- **Background**: `white`
- **Overflow**: `hidden`
- **Image Path**: `/assets/icons/Memoji Boys 2-21.png`
- **Object Fit**: `cover`

### User Information (Expanded)
```tsx
{!isCollapsed && (
  <>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-semibold text-[#202020] truncate leading-[1.15]" 
         style={{ letterSpacing: "0.5%" }} 
         title={userName || "Super Admin"}>
        {userName || "Super Admin"}
      </p>
      <p className="text-[11px] font-normal text-[#202020] truncate leading-[1.15]" 
         style={{ letterSpacing: "0.5%" }} 
         title={userEmail || ""}>
        {userEmail || ""}
      </p>
    </div>
    {/* Logout button */}
  </>
)}
```

**Name Text:**
- **Font Size**: `13px` (`text-[13px]`)
- **Font Weight**: `semibold` (`font-semibold`)
- **Color**: `#202020` (dark gray)
- **Line Height**: `1.15`
- **Letter Spacing**: `0.5%`
- **Text Overflow**: `truncate` (ellipsis for long text)

**Email Text:**
- **Font Size**: `11px` (`text-[11px]`)
- **Font Weight**: `normal` (`font-normal`)
- **Color**: `#202020`
- **Line Height**: `1.15`
- **Letter Spacing**: `0.5%`
- **Text Overflow**: `truncate`

**Container:**
- **Flex**: `flex-1` (takes available space)
- **Min Width**: `0` (allows truncation)

### Logout Button
```tsx
<button
  onClick={handleLogout}
  className="w-5 h-5 flex-shrink-0 hover:opacity-70 transition-opacity"
  title="Logout"
>
  <Image
    src="/assets/sidebar-icons/logout-icon.svg"
    alt="Logout"
    width={20}
    height={20}
    className="object-contain"
  />
</button>
```

**Button Properties:**
- **Size**: `20px × 20px` (`w-5 h-5`)
- **Hover Effect**: `opacity-70` (30% opacity reduction)
- **Transition**: `transition-opacity`
- **Icon Path**: `/assets/sidebar-icons/logout-icon.svg`
- **Icon Size**: `20px × 20px`

---

## Collapsed State

### Width Changes
- **Expanded**: `260px`
- **Collapsed**: `80px` (`w-20`)

### Hidden Elements
When collapsed, the following are hidden:
1. Logo image
2. Navigation text labels
3. Settings & Help section header
4. AI Predictive Alert cards
5. User name and email
6. Line separator

### Visible Elements
When collapsed, only these remain visible:
1. Toggle button
2. Navigation icons (centered)
3. Settings icons (centered)
4. User avatar (centered)
5. Logout button (below avatar)

### Layout Adjustments
- **Navigation Items**: `justify-center` (centered icons)
- **Gap**: `gap-0` (no gap between elements)
- **User Section**: `flex-col` (vertical stack)

---

## Responsive Behavior

### Auto-Collapse Logic
```tsx
useEffect(() => {
  const handleResize = () => {
    const shouldCollapse = window.innerWidth < 1080;
    setIsCollapsed(shouldCollapse);
  };

  handleResize(); // Check on mount
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

**Breakpoint**: `1080px`
- **Below 1080px**: Sidebar automatically collapses
- **Above 1080px**: Sidebar can be manually toggled

---

## Assets & Images

### Required Image Assets

#### Icons
1. **Logo**: `/assets/icons/Logo.svg`
   - Dimensions: `156px × 24px`

2. **Toggle Icon**: `/assets/icons/Vector (1).svg`
   - Dimensions: `13px × 13px`

3. **Navigation Icons** (all `14px × 14px`):
   - `/assets/sidebar-icons/dashboard-icon.svg`
   - `/assets/sidebar-icons/clinicals-icon.svg`
   - `/assets/sidebar-icons/patients-icon.svg`
   - `/assets/sidebar-icons/devices-icon.svg`
   - `/assets/sidebar-icons/analytics-icon.svg`
   - `/assets/sidebar-icons/support-icon.svg`
   - `/assets/sidebar-icons/settings-icon.svg`
   - `/assets/sidebar-icons/documentation-icon.svg`
   - `/assets/sidebar-icons/logout-icon.svg`

4. **AI Alert Icon**: `/assets/icons/message-heart-circle.png`
   - Dimensions: `12px × 12px`

5. **User Avatar**: `/assets/icons/Memoji Boys 2-21.png`
   - Dimensions: `36px × 36px`

6. **Gradient Background**: `/assets/icons/Group 1244832313.svg`
   - Original Dimensions: `276px × 429px`
   - Display: Full width, auto height

---

## Color Specifications

### Primary Colors
- **Lynx Primary**: `#E55A2A` (Orange)
- **Lynx Primary Light**: `#F07A4A`
- **Lynx Primary Dark**: `#C44A1A`
- **Lynx Primary Lighter**: `#F5A07A`
- **Lynx Primary Darker**: `#A03A15`

### Background Colors
- **Sidebar Background**: `#F8F8F8` (Light gray)
- **Card Background**: `white` (`#FFFFFF`)
- **Hover Background**: `rgba(229, 229, 229, 0.5)` (`gray-200/50`)

### Text Colors
- **Active Text**: `white` (`#FFFFFF`)
- **Inactive Text (Main Nav)**: `#525252` (Dark gray)
- **Inactive Text (Settings)**: `#202020` (Darker gray)
- **Section Header**: `#838383` (Medium gray)
- **Alert Header**: `#E2AB02` (Gold/Yellow)
- **Alert Title**: `#070707` (Near black)
- **Alert Description**: `#767676` (Medium gray)

### Border Colors
- **Card Border**: `#EDEDED` (Light gray)
- **Border Width**: `0.85px`

### Gradient Colors (Active State)
1. `rgba(255,168,200,1)` - `#FFA8C8` (Light Pink) - 7%
2. `rgba(245,137,71,1)` - `#F58947` (Orange) - 70%
3. `rgba(244,115,37,1)` - `#F47325` (Dark Orange) - 88%
4. `rgba(255,79,52,1)` - `#FF4F34` (Red-Orange) - 100%

---

## Typography

### Font Family
- **Primary**: `Inter`
- **Fallback**: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`

### Font Sizes
- **Logo**: Inherited from image (24px height)
- **Navigation Text**: `14px`
- **Settings Header**: `11px`
- **Settings Text**: `14px`
- **Alert Header**: `11px`
- **Alert Title**: `13px`
- **Alert Description**: `10px`
- **User Name**: `13px`
- **User Email**: `11px`

### Font Weights
- **Normal**: `400` (`font-normal`)
- **Medium**: `500` (`font-medium`)
- **Semibold**: `600` (`font-semibold`)

### Line Heights
- **Standard**: `1.15` (`leading-[1.15]`)
- **Alert Text**: `1.3` (`leading-[1.3]`)
- **Alert Header**: `none` (`leading-none`)

### Letter Spacing
- **All Text**: `0.5%` (inline style)

---

## Spacing & Layout

### Padding Values
- **Container**: `16px` horizontal, `10px` vertical (`px-4 py-[10px]`)
- **Navigation Items**: `8px` horizontal (`px-2`)
- **Settings Items**: `8px` horizontal, `6px` vertical (`px-2 py-1.5`)
- **Alert Cards**: `12px` (`p-3`)
- **User Section**: `4px` bottom (`pb-1`)

### Margin Values
- **Logo Section**: `29px` bottom (`mb-[29px]`)
- **Main Navigation**: `12px` bottom (`mb-3`)
- **Settings Section**: `12px` bottom (`mb-3`)
- **Alert Cards**: `32px` bottom (`mb-8`)
- **Line Separator**: `12px` bottom (`mb-3`)

### Gap Values
- **Navigation Items**: `2px` vertical (`space-y-[2px]`)
- **Settings Items**: `2px` vertical (`space-y-[2px]`)
- **Icon-Text Gap**: `6px` (`gap-1.5`)
- **User Section Gap**: `10px` (`gap-2.5`)
- **Alert Content Gap**: `8px` (`gap-2`)
- **Alert Text Gap**: `4px` (`gap-1`)

### Border Radius Values
- **Container**: `24px` (`rounded-[24px]`)
- **Navigation Items**: `8px` (`rounded-[8px]`)
- **Alert Cards**: `10px` (`rounded-[10px]`)
- **Avatar**: `10px` (`rounded-[10px]`)
- **Gradient Background**: `24px` bottom (`rounded-b-[24px]`)

### Height Values
- **Navigation Items**: `28px` (`h-[28px]`)
- **Alert Cards**: `120px` (`h-[120px]`)
- **Line Separator**: `2px` (`h-[2px]`)
- **Avatar**: `36px` (`h-9`)

### Width Values
- **Expanded Sidebar**: `260px` (`w-[260px]`)
- **Collapsed Sidebar**: `80px` (`w-20`)
- **Alert Cards**:
  - Bottom: `180px`
  - Middle: `200px`
  - Top: `220px`
- **Avatar**: `36px` (`w-9`)
- **Icons**: `14px` (`w-[14px]`)
- **Toggle Button**: `16px` (`w-4`)
- **Logout Button**: `20px` (`w-5`)

---

## Z-Index Layers

### Stacking Order (from bottom to top)
1. **Gradient Background**: Default (no z-index)
2. **Line Separator**: `z-10`
3. **User Profile**: `z-10`
4. **AI Alert Cards**: `z-20`

---

## Transitions & Animations

### Transition Properties
- **Container Width**: `transition-all duration-300` (300ms)
- **Navigation Items**: `transition-all` (inherits duration)
- **Button Hover**: `transition-opacity` (smooth opacity change)

### Hover Effects
- **Toggle Button**: `hover:opacity-70` (30% opacity reduction)
- **Navigation Items**: `hover:bg-gray-200/50` (50% gray background)
- **Logout Button**: `hover:opacity-70` (30% opacity reduction)

---

## Implementation Notes

### Key Dependencies
- **Next.js**: For `Image` component and routing
- **React**: For component structure and hooks
- **Tailwind CSS**: For styling
- **cn utility**: For conditional class names
- **usePathname**: For active route detection
- **useRouter**: For navigation
- **useState/useEffect**: For state management

### State Management
- **isCollapsed**: Boolean state for sidebar collapse
- **userEmail**: String state for user email
- **userName**: String state for user name

### Functions
- **handleLogout**: Async function to sign out user
- **getCurrentUserEmail**: Function to fetch user email
- **getCurrentUserName**: Function to fetch user name

---

## Complete CSS Reference

### Active Navigation Item Gradient
```css
background: linear-gradient(
  180deg,
  rgba(255,168,200,1) 7%,
  rgba(245,137,71,1) 70%,
  rgba(244,115,37,1) 88%,
  rgba(255,79,52,1) 100%
);

box-shadow: 
  0px 1.43px 3.06px 0px rgba(0,0,0,0.04),
  0px 5.72px 5.72px 0px rgba(0,0,0,0.03),
  0px 12.87px 7.76px 0px rgba(0,0,0,0.02),
  0px 22.67px 9.19px 0px rgba(0,0,0,0.01),
  0px 35.53px 10.01px 0px rgba(0,0,0,0),
  inset 0px 0px 8.4px 4.2px rgba(255,255,255,0.4),
  inset 0px 4px 3px 0px rgba(255,255,255,0.28);
```

### Icon Filters

**Inactive Main Navigation Icon:**
```css
filter: invert(32%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(98%) contrast(89%);
```

**Inactive Settings Icon:**
```css
filter: invert(12%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(98%) contrast(89%);
```

**Active Icon:**
```css
filter: brightness(0) invert(1);
```

---

## Summary Checklist

When recreating this sidebar, ensure you have:

- [ ] All image assets in correct paths
- [ ] Gradient background with exact color stops
- [ ] Multiple shadow layers (outer + inner)
- [ ] Three-layer AI alert card structure
- [ ] Proper z-index stacking
- [ ] Responsive collapse at 1080px
- [ ] Icon filters for inactive states
- [ ] Exact spacing values (using Tailwind classes)
- [ ] Typography with letter spacing
- [ ] Hover effects and transitions
- [ ] Line separator with correct z-index
- [ ] Gradient background image at bottom
- [ ] User profile section with avatar
- [ ] Logout functionality
- [ ] Active state detection via pathname

---

## Additional Notes

1. **Image Optimization**: All images use Next.js `Image` component for optimization
2. **Accessibility**: Tooltips (`title` attribute) added for collapsed state
3. **Performance**: Transitions use hardware acceleration via CSS transforms
4. **Responsive**: Auto-collapse prevents layout issues on smaller screens
5. **Consistency**: Same gradient and styling used across admin, clinical, and facility-admin sidebars

---

**Document Version**: 1.0  
**Last Updated**: Based on current codebase analysis  
**Sidebar Variants**: Admin, Clinical, Facility Admin (all share same styling)

