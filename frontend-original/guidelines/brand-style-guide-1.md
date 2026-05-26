---
name: Eco-Punk Functionalism
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#404944'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0ef'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#496173'
  on-secondary: '#ffffff'
  secondary-container: '#cce6fb'
  on-secondary-container: '#4f6779'
  tertiary: '#2e2e29'
  on-tertiary: '#ffffff'
  tertiary-container: '#45443f'
  on-tertiary-container: '#b3b1ab'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#cce6fb'
  secondary-fixed-dim: '#b0cade'
  on-secondary-fixed: '#021e2d'
  on-secondary-fixed-variant: '#314a5a'
  tertiary-fixed: '#e5e2db'
  tertiary-fixed-dim: '#c9c6c0'
  on-tertiary-fixed: '#1c1c18'
  on-tertiary-fixed-variant: '#474742'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e5e2e1'
  pure-black: '#000000'
  pure-white: '#FFFFFF'
  earth-gray: '#7C95A8'
  bone-white: '#ECE9E2'
typography:
  headline-xl:
    fontFamily: Be Vietnam Pro
    fontSize: 64px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 40px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.6'
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-bold:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
spacing:
  unit: 4px
  gutter: 24px
  margin: 32px
  shadow-offset: 4px
  shadow-offset-lg: 8px
---

## Brand & Style

This design system executes a "Sustainable Meets Punk-Rock" aesthetic, merging the eco-conscious values of natural materials with the aggressive, unapologetic structuralism of Neubrutalism. The brand personality is bold, transparent, and functional, stripping away the softness of typical sustainable brands in favor of raw, high-contrast visuals. 

The design style is **Neubrutalist**. It relies on heavy stroke weights, high-contrast intersections, and hard-edged shadows to create a UI that feels physically constructed and impactful. By utilizing a rigid grid and stark outlines, the system communicates a sense of honesty and durability—mirroring the longevity and resilience of sustainable products.

## Colors

The palette is built on extreme contrast. **Deep Emerald (#064E3B)** serves as the primary brand anchor, representing the "eco" core with a sophisticated, saturated tone. This is balanced against a stark background of **Pure White (#FFFFFF)** and a deep **Pure Black (#000000)** used for all structural borders and shadows.

To soften the industrial edge, muted earth tones—**Earth Gray (#7C95A8)** and **Bone White (#ECE9E2)**—are utilized for secondary accents, background sections, and informational surfaces. These colors provide a textural depth reminiscent of raw wool and recycled materials without sacrificing the high-impact functionalism of the overall design. All chromatic colors must be paired with black outlines to maintain the Neubrutalist structure.

## Typography

This design system uses **Be Vietnam Pro** across all levels to ensure full Vietnamese character support while maintaining a contemporary, geometric feel. 

Headlines are set with an extra-bold weight (800) and tight letter spacing to create "walls of text" that feel structural and solid. Large display type should be used aggressively to command attention. Body text prioritizes legibility with a generous line height (1.6) and a medium weight (400-500) to stand up against the heavy borders of the containers. Labels and utility text are often uppercase and bold, functioning more like navigational signage than traditional prose.

## Layout & Spacing

The layout follows a **fluid grid system** based on a 12-column architecture for desktop and a 4-column architecture for mobile. Spacing is strictly mathematical, built on a **4px base unit**. 

Key spacing principles:
- **Gutters and Margins:** Consistent 24px gutters ensure that heavy outlines do not bleed into each other, maintaining visual clarity.
- **Hard Offsets:** Element positioning is influenced by the "hard shadow" rule—if a component has an 8px shadow, the layout must account for that extra footprint to prevent overlapping.
- **Container-First:** Content is always housed within outlined containers. Negative space is used strategically to separate these "blocks" rather than individual text elements.

## Elevation & Depth

Depth is conveyed through **hard-edge shadows** and **black outlines**, rather than blurs or gradients. 

- **Level 0 (Flat):** Used for background surfaces and passive decorative elements.
- **Level 1 (Standard):** 2px black border with a 4px black hard shadow offset to the bottom-right.
- **Level 2 (Active/Hover):** 2px black border with an 8px black hard shadow.
- **Interactions:** When a component is clicked or pressed, it should "depress" into the page by moving the element 4px down and 4px right, effectively hiding the shadow and simulating physical contact.
- **No Gradients:** Colors are always flat; depth is purely a result of geometry and occlusion.

## Shapes

The shape language is strictly **sharp-edged (0px radius)**. Every container, button, input, and image frame must use 90-degree corners. This evokes a sense of raw construction, architectural blueprinting, and "punk" DIY aesthetics. The only exception is for circular elements such as user avatars, which should still be enclosed in a square black frame to maintain consistency with the grid.

## Components

### Buttons
Buttons are high-contrast blocks. The primary button uses a **Deep Emerald** background with **Pure White** text, a 2px black border, and an 8px black hard shadow. On hover, the shadow increases or the button shifts position. Secondary buttons use a **Bone White** background with black text and a 4px shadow.

### Cards
Cards are the primary container for information. They feature a 2px black border and a white or Earth Gray background. Titles within cards are always bold. Large cards (product cards) use the 8px shadow, while smaller utility cards use 4px.

### Input Fields
Inputs use a white background, 3px thick black borders, and sharp corners. The label is placed directly above in a bold, uppercase font. On focus, the border weight may increase or the background color may shift to a very light gray (#ECE9E2) to indicate activity.

### Chips & Tags
Used for sustainability certifications or product categories. These are small, sharp rectangles with 1px black borders and no shadows to distinguish them from actionable buttons.

### Checkboxes & Radios
Custom-styled as sharp squares and diamonds. When selected, they fill with Deep Emerald and a black "X" or "check" mark, rather than soft ticks.