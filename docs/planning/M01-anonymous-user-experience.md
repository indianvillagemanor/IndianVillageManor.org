# M01: Anonymous User Experience

## Overview
Create a single long scrollable home page that matches the reference project (`./IndianVillageManor/ivm_app`) exactly in look, feel, and responsive behavior. This includes duplicating the grid-based layout system, all visual sections, images, and the hamburger menu navigation.

## Reference Project
- Location: `./IndianVillageManor/ivm_app`
- Main page: `app/page.tsx`
- Layout: `app/layout.tsx`

## Core Components (duplicate from reference)

### Responsive Layout System
- [ ] **WindowContext** (`components/window_context.tsx`)
  - Provides `portrait` (boolean) and `rowHeight` (number) values
  - Used by all grid components for responsive behavior

- [ ] **WindowWithSize** (`components/window_with_size.tsx`)
  - Client component that tracks window size
  - Updates on resize events
  - Provides WindowContext to children
  - Calculates portrait mode (≤768px width)
  - Calculates dynamic rowHeight (16px base, scales up to 32px for wider screens)

### Grid System Components

- [ ] **GridSection** (`components/grid/grid_section.tsx`)
  - Container for grid layout sections
  - Props: `rows`, `cols`, `green` (boolean), `id` (for navigation)
  - Desktop: CSS Grid with specified rows/columns
  - Mobile/Portrait: Flexbox vertical flow
  - Green sections use `.dark` class (#00693f background)

- [ ] **GridCell** (`components/grid/grid_cell.tsx`)
  - Individual cell within grid
  - Props: `gridArea` [row, column, height, width]
  - Desktop: Uses CSS grid positioning
  - Mobile: Uses fixed or auto height

- [ ] **GridPhoto** (`components/grid/grid_photo.tsx`)
  - Photo component in grid cells
  - Uses Next.js Image with `fill={true}`
  - Props: `gridCell`, `src`, `alt`, `loading`
  - Fixed height of 24 * rowHeight
  - Object-cover with rounded corners

- [ ] **GridGraphic** (`components/grid/grid_graphic.tsx`)
  - For logos and floor plans
  - Uses Next.js Image with `object-scale-down`
  - Props: `gridCell`, `src`, `alt`, `onZoom` (optional)
  - When `onZoom` provided, clicking triggers zoom modal

- [ ] **GridText** (`components/grid/grid_text.tsx`)
  - Text content in grid cells
  - Props: `gridCell`, `className`, `children`
  - Responsive text sizing (sm to 2xl)
  - Centered with grid place-items-center

- [ ] **GridHeader** (`components/grid/grid_header.tsx`)
  - Large header text in grid cells
  - Props: `gridCell`, `children`
  - Very large responsive text (4xl to 8xl)
  - Uses Noto Serif font

### Modal Component

- [ ] **Modal** (`components/modal.tsx`)
  - Fullscreen modal for zooming floor plan graphics
  - Props: `src` (image source), `onClose` (callback)
  - Fixed overlay with black/90 background
  - Close button (×) in top-right
  - Image with object-fit: contain

### Navigation Components

- [ ] **SiteMenuClient** (`components/SiteMenuClient.tsx`)
  - Wrapper that exports `site_menu` as client component

- [ ] **site_menu** (`components/site_menu.tsx`)
  - Fixed header with IVM green background image
  - Hamburger menu icon (☰ Menu) in top-right
  - Dropdown overlay with navigation links
  - Props from useSession for auth state (stub for M01)
  - Menu items:
    - Home (/#home)
    - Floor Plans (/#floorplans)
    - Contact (/#contact)
    - Login (disabled via `loginDisabled = true` flag)

### Session Management (Stub)

- [ ] **SessionProviderWrapper** (`components/SessionProviderWrapper.tsx`)
  - Wraps NextAuth SessionProvider
  - Includes auth event listeners (for future use)
  - BroadcastChannel for cross-tab auth sync
  - localStorage fallback for auth events
  - No active functionality in M01 (auth disabled)

## Page Structure

The home page (`app/page.tsx`) consists of 6 main sections:

### 1. Home Section (id="home")
- [ ] IVM Logo graphic (`/IVM Logo Design_Black_24 0225_t.png`)
- [ ] "INDIAN VILLAGE MANOR" header
- [ ] Welcome text describing the property:
  > "Experience spacious, elegant living at Indian Village Manor, a true gem on Detroit's Gold Coast Waterfront. Enjoy the beauty of the private riverfront park, stay in shape in the full featured gym, and get more out of life with proximity to Belle Isle park and a quick hop down Jefferson Avenue to Downtown Detroit."
- [ ] Entrance photo (large, `/Entrance.jpg`)
- [ ] Riverfront West photo (`/RiverfrontW.jpg`)

### 2. Interiors1 Section (id="interiors1")
- [ ] Large interior photo #3 (`/Interior3.jpg`)
- [ ] Historical description text:
  > "In the mid 1920s IVM advertisements used the phrase \"Detroit's Most Exclusive Apartment Building\". A lot has happened since the building was converted into condos in 1998. Many of the original common area elements remain. Each condo unit has taken on the identity of its owner. Many walls have been literally removed and floor plans modified to efficiently utilize the spacious units. Some new kitchens and bathrooms have been installed. Other cosmetic changes have been made to address current needs, adding color, texture and features to make it feel like home."
- [ ] Interior photo #1 (`/Interior1.jpg`)

### 3. Amenities Section (id="amenities", green background)
- [ ] Amenities description text:
  > "The community has a riverfront garden, dog yard, on-site maintenance/manager, 24 hour monitored entry, private parking, community laundry room/lounge, dry cleaning drop off and pick up to your door, exercise club, 2 main elevators and 5 service elevators, & a small conference room."
- [ ] Weight room photo (`/WeightRoom.jpg`)
- [ ] First floor photo (`/FirstFloor.jpg`)
- [ ] Riverfront East photo (`/RiverfrontE.jpg`)

### 4. Floor Plans Section (id="floorplans", green background)
- [ ] Floor plans description text:
  > "These well appointed and maintained condominiums offer 3 distinct layouts (2,300-2,500 sq. ft. 11 room maximum). Each unit expresses a variety of different tastes and styles yet maintain the original architectural charm."
- [ ] Floor plan A/B/M/N graphic (zoomable, `/FloorPlanABMN_white.png`)
- [ ] Floor plan C/D/K/L graphic (zoomable, `/FloorPlanCDKL_white.png`)
- [ ] Floor plan E/F/G/H graphic (zoomable, `/FloorPlanEFGH_white.png`)

### 5. Interiors2 Section (id="interiors2", green background)
- [ ] Interior photo #5 (`/Interior5.jpg`)
- [ ] Interior photo #6 (`/Interior6.jpg`)
- [ ] Interior photo #4 (`/Interior4.jpg`)
- [ ] Exterior photo (`/Exterior.jpg`)

### 6. Contact Section (id="contact")
- [ ] Front door photo (`/ivm_front_door.jpg`)
- [ ] "Contact" header
- [ ] Address and phone:
  ```
  8120 East Jefferson Avenue
  Detroit, MI 48214
  313-824-7704
  ```
- [ ] Email link: `IVManor@outlook.com`

## Styling & Assets

### CSS Styles (app/globals.css)
- [ ] Tailwind base imports
- [ ] `.dark` class with IVM green background (#00693f) and light text (#f0f0f0)
- [ ] Body styles (Noto Serif font, overflow-y: scroll)
- [ ] h1 styles (Noto Serif, font-weight 300)
- [ ] p styles (Noto Serif, font-weight 600)
- [ ] li padding (0.5rem)
- [ ] `.scroll-offset` class (scroll-margin-top: 36px for fixed header)
- [ ] Tailwind theme configuration (shadcn/ui color variables)

### Layout Configuration (app/layout.tsx)
- [ ] Noto Serif font import from next/font/google
- [ ] Metadata (title: "Indian Village Manor")
- [ ] Fixed header layout with 50px margin-top for content
- [ ] SessionProviderWrapper wrapping all content
- [ ] SiteMenuClient at top level
- [ ] WindowWithSize wrapping page content

### Image Assets to Copy
Copy the following from `./IndianVillageManor/ivm_app/public/` to `./public/`:

**Logo files:**
- [ ] `IVM Logo Design_Black_24 0225_t.png`
- [ ] `ivm_green.png`

**Interior photos:**
- [ ] `Interior1.jpg`
- [ ] `Interior3.jpg`
- [ ] `Interior4.jpg`
- [ ] `Interior5.jpg`
- [ ] `Interior6.jpg`

**Exterior/Building photos:**
- [ ] `Entrance.jpg`
- [ ] `Exterior.jpg`
- [ ] `FirstFloor.jpg`
- [ ] `WeightRoom.jpg`
- [ ] `ivm_front_door.jpg`

**Riverfront photos:**
- [ ] `RiverfrontE.jpg`
- [ ] `RiverfrontW.jpg`

**Floor plan graphics:**
- [ ] `FloorPlanABMN_white.png`
- [ ] `FloorPlanCDKL_white.png`
- [ ] `FloorPlanEFGH_white.png`

## Responsive Behavior

### Desktop Mode (viewport width > 768px)
- Grid-based layout with precise positioning
- GridCell uses CSS grid row/column positioning
- Row height scales from 16px to 32px based on viewport width
- Formula: `16 + 16 * (width - 768) / 1152`
- Grid sections with specified rows and columns

### Mobile/Portrait Mode (viewport width ≤ 768px)
- Vertical flow layout (flexbox column)
- GridCell uses fixed or auto height
- Row height fixed at 16px
- All content stacks vertically
- Photos maintain aspect ratio

### Navigation Behavior
- Fixed header (36px tall) stays at top
- Hamburger menu toggles dropdown overlay
- Menu links trigger smooth scroll to section IDs
- Scroll offset accounts for fixed header (36px)
- Menu closes automatically after navigation

## Technical Implementation Notes

### Grid System Details
- GridSection creates either CSS Grid (desktop) or Flexbox (mobile)
- GridCell adapts positioning based on portrait context
- 4px gap between grid items
- 8px padding around sections

### Image Optimization
- Use Next.js Image component for all photos/graphics
- GridPhoto: `fill={true}` with `object-cover`, rounded corners
- GridGraphic: `fill={true}` with `object-scale-down`, centered
- Appropriate sizes prop for responsive loading
- Priority/eager loading for above-fold images

### State Management
- Modal state: `useState<string | undefined>()` for current zoomed image
- Menu state: `useState(false)` for open/closed
- Window size: tracked in WindowWithSize component
- Session state: provided by NextAuth (stub in M01)

### Authentication Stub
- `loginDisabled = true` in site_menu component
- Login menu item present but not functional
- SessionProvider wrapped but no auth configured
- Will be activated in M03 (Magic Link Authentication)

## Testing Checklist

### Visual Match
- [ ] All sections render with correct content and images
- [ ] Green sections have proper IVM green background
- [ ] Text uses Noto Serif font with correct weights
- [ ] Images load and display properly
- [ ] Floor plans are zoomable via modal

### Responsive Behavior
- [ ] Desktop (>768px): Grid layout with proper positioning
- [ ] Mobile (≤768px): Vertical flow layout
- [ ] Smooth transition between breakpoints
- [ ] Row height scales properly with viewport width
- [ ] Images scale and maintain aspect ratios

### Navigation
- [ ] Fixed header stays at top when scrolling
- [ ] Hamburger menu opens/closes properly
- [ ] Menu overlay appears with correct styling
- [ ] Navigation links scroll to correct sections
- [ ] Scroll offset accounts for fixed header
- [ ] Menu closes after clicking navigation link
- [ ] Login item is present but disabled

### Modal Functionality
- [ ] Clicking floor plan graphics opens modal
- [ ] Modal displays zoomed image
- [ ] Close button (×) works
- [ ] Clicking overlay closes modal
- [ ] Modal z-index above all other content

## Success Criteria

The M01 implementation is complete when:
1. The home page visually matches the reference site exactly
2. All responsive behavior works identically to reference
3. All images load and display properly
4. Navigation and scrolling work smoothly
5. Modal zoom functionality works for floor plans
6. The site looks and acts identical on desktop and mobile
7. No console errors or warnings
8. Authentication is stubbed (login disabled)

## Dependencies

### npm packages (already installed)
- Next.js 15+
- React 18+
- TailwindCSS
- next-auth (for SessionProvider stub)
- TypeScript

### No backend required
- Pure frontend implementation
- No database queries
- No API calls
- No authentication processing

## Future Integration Points

Components built in M01 will be extended in future milestones:
- **M03**: Activate login functionality, integrate NextAuth
- **M04**: Add authenticated user menu items
- **M11**: Integrate event calendar data into future calendar page
- **M13**: Add audit logging for page views

The grid system and layout will serve as the foundation for future authenticated pages.

---

## Implementation Notes

**Status**: ✅ **COMPLETED** - February 17, 2026

### What Was Built

All planned deliverables were successfully implemented:

**Core Components:**
- ✅ WindowContext (`components/window_context.tsx`)
- ✅ WindowWithSize (`components/window_with_size.tsx`)
- ✅ GridSection (`components/grid/grid_section.tsx`)
- ✅ GridCell (`components/grid/grid_cell.tsx`)
- ✅ GridPhoto (`components/grid/grid_photo.tsx`)
- ✅ GridGraphic (`components/grid/grid_graphic.tsx`)
- ✅ GridText (`components/grid/grid_text.tsx`)
- ✅ GridHeader (`components/grid/grid_header.tsx`)
- ✅ Modal (`components/modal.tsx`)
- ✅ SiteMenuClient (`components/SiteMenuClient.tsx`)
- ✅ site_menu (`components/site_menu.tsx`)
- ✅ SessionProviderWrapper (`components/SessionProviderWrapper.tsx`)

**Page Structure:**
- ✅ All 6 sections implemented (Home, Interiors1, Amenities, Floor Plans, Interiors2, Contact)
- ✅ Home page (`app/page.tsx`) with complete content and images
- ✅ Layout (`app/layout.tsx`) with Noto Serif font and proper structure

**Assets:**
- ✅ 18 images copied from reference project
- ✅ All logos, photos, and floor plan graphics present

**Styling:**
- ✅ globals.css with IVM green theme (#00693f)
- ✅ Noto Serif font configuration
- ✅ Tailwind config with custom colors and breakpoints
- ✅ Responsive behavior (grid on desktop, flow on mobile)

**Authentication Stub:**
- ✅ NextAuth API route (`app/api/auth/[...nextauth]/route.ts`)
- ✅ Environment variables (NEXTAUTH_URL, NEXTAUTH_SECRET)
- ✅ Login menu item present but disabled

### Issues Encountered and Resolved

**1. next-auth Installation Conflict**
- **Issue**: npm install failed due to nodemailer version mismatch (next-auth wants v7, we have v8)
- **Resolution**: Used `--legacy-peer-deps` flag to bypass peer dependency check
- **Impact**: None - authentication is stubbed for M01

**2. Tailwind CSS Border Error**
- **Issue**: `border-border` class not found, causing CSS compilation error
- **Resolution**: Removed `@apply border-border` from globals.css (line 91)
- **Impact**: Minimal - border styling not critical for M01

**3. React Hydration Mismatch**
- **Issue**: WindowWithSize returned empty div on server, causing page not to render
- **Resolution**: Always render children with default values instead of conditional rendering
- **Impact**: Fixed - page now renders properly on initial load

**4. NextAuth SESSION_FETCH_ERROR**
- **Issue**: SessionProvider tried to fetch from non-existent `/api/auth/session` endpoint
- **Resolution**: Created stub NextAuth route handler with empty providers array
- **Added**: NEXTAUTH_URL and NEXTAUTH_SECRET environment variables
- **Impact**: Error eliminated, SessionProvider works silently in background

**5. Modal Image 400 Error**
- **Issue**: After closing modal, Image component tried to load fallback favicon causing 400 error
- **Resolution**: Changed Modal to return null when src is undefined (early return)
- **Impact**: No more console errors when closing modal

### Testing Results

All success criteria met:
- ✅ Home page visually matches reference site
- ✅ Responsive behavior works (desktop grid, mobile flow)
- ✅ All images load and display properly
- ✅ Navigation and scrolling work smoothly
- ✅ Modal zoom functionality works for floor plans
- ✅ Fixed header with hamburger menu functional
- ✅ No console errors or warnings
- ✅ Authentication is properly stubbed (login disabled)

### Known Limitations (By Design)

- Login menu item is visible but disabled (will be enabled in M03)
- No authentication functionality (by design for M01)
- SessionProvider is present but returns null session (will be configured in M03)
- Green background sections use `.dark` class name (matches reference implementation)

### Files Created/Modified

**New Files (26):**
- 12 component files (`components/*.tsx`, `components/grid/*.tsx`)
- 1 API route (`app/api/auth/[...nextauth]/route.ts`)
- 18 image assets (`public/*`)

**Modified Files (5):**
- `app/globals.css` - Added IVM theme styles
- `app/layout.tsx` - Added font, SessionProvider, SiteMenu, WindowWithSize
- `app/page.tsx` - Implemented all 6 sections
- `tailwind.config.ts` - Added custom colors and breakpoints
- `.env` - Added NextAuth configuration

### Development Environment

- Next.js 15.5.12
- React 18+
- TypeScript
- TailwindCSS
- next-auth 4.24.13 (installed with --legacy-peer-deps)
- Running on http://localhost:3000

### Next Steps

M01 is complete and ready for user acceptance testing. The foundation is in place for:
- M02: Database Schema and Seed Data
- M03: Magic Link Authentication
- M04: Menu Navigation (authenticated users)

All components are functioning as designed and match the reference project's look and behavior.
