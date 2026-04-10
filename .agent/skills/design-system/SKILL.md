---
name: Papelcool Design System
description: Guidelines and specifications for the Papelcool Sticker Pop-Art visual identity
---

# Papelcool Design System

This skill enforces the visual identity of the Papelcool web application. The core aesthetic is **"Sticker-Style Pop Art"**. All UI components must feel like physical, high-contrast stickers placed on a soft, cartoonish background.

## Core Aesthetic Principles
1. **High Contrast:** Use solid white or vibrant primary colors against thick black borders.
2. **Hard Shadows:** Avoid soft, blurred drop-shadows. Shadows should be solid black offsets.
3. **Rounded Geometry:** Use large border-radiuses to simulate die-cut stickers.
4. **Playful Motion:** Backgrounds should have floating, slightly rotated geometric shapes. Interactions should mimic physical pressing or peeling.

## Typography
- **Headings & Buttons:** `Fredoka`, sans-serif. Always bold (`font-weight: 700`) and heavily utilize `uppercase`.
- **Body Text:** `Montserrat`, sans-serif. Clean and legible.
- **Handwritten Accents:** `Caveat`, cursive. Used sparingly for playful annotations.

## Color Palette
The color palette is defined in the Tailwind CSS configuration:
- `sticker-yellow`: `#FFE600` (Main accents, active states)
- `sticker-pink`: `#FF4D94` (Secondary accents, badges)
- `sticker-blue`: `#407BFF` (Background elements, highlights)
- `sticker-green`: `#2ECC71` (Success actions, register buttons)
- `paper-white`: `#FFFFFF` (Base component background)
- `grid-blue`: `#D1E9FF` (Soft background tones)
- **Global Background Gradient:** `linear-gradient(135deg, #E0F2FE 0%, #F8FAFC 100%)`

## Components Settings

### UI Panels (`.ui-panel`)
Panels must **never** use glassmorphism (translucent backgrounds with blur).
```css
.ui-panel {
    background: white;
    border: 4px solid black;
    border-radius: 20px;
    box-shadow: 6px 6px 0px 0px rgba(0, 0, 0, 1);
    color: black;
}
.ui-panel:hover {
    transform: translate(2px, 2px);
    box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 1);
}
```

### Buttons (`.icon-btn`, `.active-btn`)
Buttons must look like interactive stickers. 
- **Inactive:** White background, 4px black border, 4px solid black shadow.
- **Active/Hover:** Background turns to `#FFE600` or `#FF4D94`, shadow shifts, element translates.
```css
.icon-btn {
    background: white;
    border: 4px solid black;
    border-radius: 12px;
    box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 1);
}
.icon-btn:hover {
    background: #FFE600;
    transform: translate(-1px, -1px);
    box-shadow: 6px 6px 0px 0px rgba(0, 0, 0, 1);
}
.icon-btn:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 1);
}
```

## Global Background
The `body` uses a light blue linear gradient. Behind all UI elements, there are absolute-positioned, slightly translucent, rotated polygons in Pink, Blue, and Yellow to create a chaotic "messy-fun" atmosphere. Do not apply solid dark backgrounds or detailed textures that clash with the 3D canvas.
