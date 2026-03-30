# NyayaLens AI - Design System & UI/UX Guidelines

## 1. Design Philosophy
NyayaLens AI embraces a "Digital Jurist" aesthetic—professional, authoritative, and clean. It balances the traditional gravity of Indian Law with modern, highly interactive web application paradigms. The interface is designed for long reading sessions, complex data comparisons, and cognitive ease.

## 2. Typography
The typography scale utilizes two highly legible, modern fonts to distinguish between structural UI elements and long-form document reading.
- **Headlines / Serif text:** `Newsreader` (serif) - Used for primary headings, case names, exact clause extracts, and places where a traditional legal document feel is desired.
- **Body / UI Elements:** `Plus Jakarta Sans` (sans-serif) - Used for all interface elements, sidebars, navigation, buttons, and metadata.

## 3. Color Palette
The application uses a meticulously crafted color token system (based on Material 3 guidelines but heavily customized):
- **Background & Surfaces:**
  - `surface` / `background`: `#f9f9fb` (Slightly warm off-white for comfortable reading)
  - `surface-container-lowest`: `#ffffff`
  - `surface-container-low`: `#f3f3f5`
  - `surface-container`: `#eeeef0`
- **Typography Colors:**
  - `on-surface`: `#1a1c1d` (Near-black for high contrast readability)
  - `on-surface-variant`: `#454652` (Muted dark gray for secondary text/metadata)
- **Primary Accents (Earthy / Leather / Binding tones):**
  - `primary`: `#2d1500`
  - `primary-container`: `#4c2600`
  - `surface-tint`: `#8f4e00`
- **Secondary (Trust / Authority / Legal Blue):**
  - `secondary`: `#4c56af`
  - Deep Indigo variants (`text-indigo-900`, `text-indigo-950`) heavily used in prominent branding elements and navigation.
- **Semantic Feedback:**
  - `error`: `#ba1a1a` (High severity conflicts, deletions)
  - `tertiary` (Greens): Additions, positive compliance, secure transmissions.
  - `amber/orange` (`text-amber-700`): Warnings, medium risk.

## 4. Iconography
- **Library:** Google Material Symbols Outlined.
- **Styling:** Specifically customized with `font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24`. 
- **Filled State:** Important or active icons utilize `'FILL' 1` for emphasis.

## 5. UI Components & Layouts

### 5.1 Global App Shell
- **Sidebar (`w-64`):** Fixed left navigation. Contains the NyayaLens branding ("The Digital Jurist"), a prominent "New Case Analysis" action button, and categorized navigation links (Legal Chat, Conflict Detection, Amendment Tracker, Knowledge Graph).
- **Top App Bar (`h-16`):** Sticky top bar featuring a prominent global search input (with a `/20` opacity primary/indigo focus ring), notification/history icons, and user profile indicators.

### 5.2 Dashboard & Data Visualization
- **Bento Grid Layouts:** Dashboards utilize asymmetric grid layouts (`grid-cols-12`) to surface high-level metrics (e.g., "Retrieval Accuracy", "Active Conflicts Detected").
- **Stat Cards:** Employ thick left-borders (`border-l-4`) colored semantically (e.g., error red for conflicts) to draw immediate attention to severity.

### 5.3 Legal Chat Workspace
- **Split View:** Left/Center pane for conversational AI interface; Right pane (`w-80`) acting as a dynamic "Referenced Clauses" index that populates as the AI cites specific sections or precedents.
- **AI Formatting:** AI responses use the `Newsreader` serif font for legal citations and employ internal tags (e.g., Confidence Scores: `94% CONFIDENCE`).

### 5.4 Document Comparison & Conflict Detection
- **Side-by-Side Diffing:** Split views (`grid-cols-2`) for comparing clauses (e.g., IPC vs. BNS). Changes are highlighted with semantic backgrounds (`bg-red-100` for deletions, `bg-emerald-100` for additions).
- **Conflict Cards:** List-based cards indicating severity ("High Risk", "Medium Risk") with source-to-target mapping.

### 5.5 Knowledge Graph Explorer
- **Visual Nodes:** Circular nodes representing Acts, connected to specific clauses and precedents using SVG dashed lines.
- **Detail Drawer:** A sliding right-panel (`w-96`) that appears when a graph node is clicked, revealing deep relationship stats, timeline history, and AI insights.
- **Canvas Details:** Uses a custom `.graph-bg` dot grid background for spatial orientation.

## 6. Micro-Interactions & Textures
- **Paper Texture:** Subtle radial gradient dot pattern (`radial-gradient(#d1d5db 0.5px, transparent 0.5px)`) applied to reading surfaces via `.paper-texture`.
- **Shadows:** Soft, diffused shadows (`box-shadow: 0px 12px 32px rgba(26, 28, 29, 0.04)`) to lift cards off the surface, termed `.editorial-shadow`.
- **Hover States:** Interactive elements scale slightly active (`transform: scale(0.95)`), text links underline, and cards gain structural borders.

## 7. Accessibility & Responsive Design
- Fully responsive using standard CSS media queries (`@media (min-width: ...)`).
- High contrast text meets WCAG standards for prolonged reading.
