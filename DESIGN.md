---
name: CourseNFound
description: A warm university prospectus for thoughtful course exploration.
colors:
  primary: '#245744'
  primary-hover: '#163e30'
  primary-light: '#41765d'
  primary-soft: '#e6ede4'
  bg-main: '#f5f2e9'
  white: '#fffdf7'
  text-main: '#24362d'
  text-muted: '#5c6559'
  border-color: '#cccdbf'
  danger: '#a52d25'
  danger-soft: '#f8e7e2'
  panel-ink: '#fffdf0'
  panel-muted: '#d5e4d5'
  panel-rule: '#668571'
  assessment-button: '#f0edcf'
  assessment-button-ink: '#213e2c'
  dark-primary: '#a7d4b5'
  dark-primary-hover: '#c4e7ce'
  dark-primary-light: '#91c59e'
  dark-primary-soft: '#283f31'
  dark-bg-main: '#17251e'
  dark-white: '#223329'
  dark-text-main: '#f0f0df'
  dark-text-muted: '#bac5b5'
  dark-border-color: '#4d6051'
  dark-danger: '#ffb6a8'
  dark-danger-soft: '#4d2d29'
  panel-evergreen: '#245744'
typography:
  display:
    fontFamily: Noto Serif, Georgia, serif
    fontSize: clamp(2.6rem, 4.6vw, 4rem)
    fontWeight: 400
    lineHeight: 1.18
    letterSpacing: -.035em
  headline:
    fontFamily: Noto Serif, Georgia, serif
    fontSize: clamp(1.7rem, 2.5vw, 2.1rem)
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: -.025em
  title:
    fontFamily: Noto Serif, Georgia, serif
    fontSize: 1.35rem
    fontWeight: 400
    lineHeight: 1.4
  body:
    fontFamily: Open Sans, sans-serif
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: Open Sans, sans-serif
    fontSize: .875rem
    fontWeight: 600
rounded:
  panel: 2px
  tag: 3px
  control: 4px
  card: 8px
  modal: 12px
spacing:
  half: .5rem
  three-quarter: .75rem
  one: 1rem
  one-half: 1.5rem
  two: 2rem
  two-half: 2.5rem
  three: 3rem
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.bg-main}'
    rounded: '{rounded.control}'
    padding: .75rem 1rem
    height: 48px
  button-primary-hover:
    backgroundColor: '{colors.primary-hover}'
  button-secondary:
    textColor: '{colors.text-main}'
    rounded: '{rounded.control}'
    padding: .75rem 1rem
    height: 48px
  input-search:
    backgroundColor: '{colors.white}'
    textColor: '{colors.text-main}'
    rounded: '{rounded.control}'
    padding: .7rem 1rem
    height: 48px
  tag:
    backgroundColor: '{colors.primary-soft}'
    textColor: '{colors.primary}'
    rounded: '{rounded.tag}'
    padding: .4rem .65rem
  result-card:
    backgroundColor: '{colors.white}'
    rounded: '{rounded.card}'
    padding: 1.5rem
  assessment-panel:
    backgroundColor: '{colors.panel-evergreen}'
    textColor: '{colors.panel-ink}'
    rounded: '{rounded.panel}'
    padding: clamp(1.5rem, 3vw, 2.5rem)
  assessment-button:
    backgroundColor: '{colors.assessment-button}'
    textColor: '{colors.assessment-button-ink}'
    rounded: '{rounded.tag}'
    padding: .85rem 1.2rem
  course-row:
    textColor: '{colors.text-main}'
    typography: '{typography.title}'
    padding: 1.5rem 0
  navigation-action:
    textColor: '{colors.text-main}'
    padding: .6rem
    height: 44px
---

# Design System: CourseNFound

## Overview

**Creative North Star: "The University Prospectus"**

The University Prospectus gives CourseNFound a calm, credible editorial character. Warm paper, evergreen actions, serif headings, and readable sans-serif controls support deliberate exploration. Preserve the CourseNFound name and supplied logo.

Hierarchy comes from alignment, generous section spacing, fine rules, and clear labels. Course information reads as a structured index; focused tasks use restrained bordered controls. Dark mode preserves that hierarchy with deep forest surfaces and pale green actions.

**Key Characteristics:**
- Warm paper and forest green, with a fixed evergreen assessment panel.
- Serif editorial headings paired with practical sans-serif controls.
- Ruled lists and tonal surfaces; elevation reserved for overlays.
- Responsive stacking with visible keyboard focus.

## Colors

The palette pairs warm paper neutrals with forest green. Frontmatter records the implemented values; dark-prefixed entries are the overrides under `:root[data-theme='dark']`.

### Primary
- **Evergreen:** `primary` drives actions, selected answers, links, and focus; `primary-hover` deepens interactive states. `primary-light` colors the scrollbar.
- **Soft Sage:** `primary-soft` supports selected or informational surfaces and subtle navigation hover.
- **Assessment Cream:** `assessment-button` and its ink form the pale action within the evergreen assessment panel. The assessment and authentication panels deliberately retain their light-theme evergreen, panel ink, muted text, and rule colors in both themes.

### Neutral
- **Warm Paper:** `bg-main` is the application canvas; `white` is the warm field, card, and modal surface.
- **Forest Ink / Olive Gray:** `text-main` and `text-muted` distinguish primary and supporting information.
- **Fine Rule:** `border-color` separates rows and outlines controls.
- **Error Red:** `danger` and `danger-soft` identify destructive actions and validation feedback.
- Dark mode maps the same semantic CSS properties to their dark-prefixed values. Use the CSS properties rather than hard-coding the dark variants.

**The Ruled Index Rule.** Organize repeated course information with aligned rows and thin dividers.

## Typography

**Display Font:** Noto Serif, with Georgia and serif fallbacks. **Body Font:** Open Sans, with sans-serif fallback. Both are bundled locally. Serif headings use regular weight; control emphasis uses semibold Open Sans.

The frontmatter display role describes the home heading; headline describes home section headings; title describes library course names. Body follows the global baseline; label describes recurring semibold form labels. Library page headings use a separate responsive size (`clamp(2.2rem, 4vw, 3.5rem)`, regular, line-height 1.2). Assessment questions use `clamp(1.7rem, 4vw, 2.5rem)` with line-height 1.4. Supporting labels range from .75rem to .875rem. Keep descriptions readable: the home introduction is limited to 44ch, library introduction to 65ch.

**The Editorial Hierarchy Rule.** Use Noto Serif for major headings and course titles; use Open Sans for controls and supporting information.

## Layout

The home content uses a centered maximum width of 1200px with 90% viewport width. Its desktop grid pairs 1.1fr and 1fr columns with a 6% gap. Library content also caps at 1200px; results at 1000px; assessment at 840px. Repeated library rows occupy two columns with a 2.5rem gap. Sections rely on fine horizontal rules and the observed spacing scale rather than decorative containers.

At 900px, home spacing tightens. At 680px, home and library content stack, the header uses a 44px menu control, and the navigation opens as a bordered panel. Authentication stacks at 720px; assessment scores stack at 580px. The five assessment answer controls remain in one row, with smaller gaps and a 56px minimum height on small screens. Comparison columns remain adjacent on mobile. Typical action and input minimum height is 48px; header and close controls use 44px. Frontmatter component height values describe these minimum heights.

## Elevation & Depth

Ordinary content has no shadow. Border rules, filled panels, and restrained surface changes establish depth. Menus and notifications use the medium shadow; dialogs use the large shadow recorded in the sidecar. Modal backdrops use a translucent deep forest scrim. No gradients or glass effects belong to this world.

**The Flat Surface Rule.** Keep ordinary content flat; reserve shadow elevation for menus, dialogs, and notifications.

## Shapes

Shapes are nearly square: the assessment panel uses the panel radius, tags and its cream action use the tag radius, and standard controls use the control radius. Saved result cards and settings menus use the card radius; modal shells use the modal radius. One-pixel borders and rules dominate. Circles are reserved for profile avatars and the existing authentication logo treatment.

## Components

### Buttons

Primary buttons pair the semantic primary fill with canvas-colored text and semibold Open Sans. The submit-button pattern uses the frontmatter padding and minimum height, shifting to `primary-hover` on hover. Secondary authentication actions are transparent with a fine neutral border and soft sage hover. Disabled buttons have .5 opacity and an unavailable cursor. The assessment entry has a distinct cream action, including cream focus against evergreen.

### Chips

Result tags use soft sage, primary text, the tag radius, and compact padding. Coming-soon status labels are muted, outlined, and noninteractive.

### Cards / Containers

Course library entries are transparent ruled rows with serif course names; hover changes and underlines the title. Saved results are warm bordered cards with the card radius and standard section padding. The evergreen assessment panel is a purposeful filled surface rather than a floating card.

### Inputs / Fields

Search and category fields use the warm surface; authentication and profile fields use the paper canvas. All have fine neutral borders and the control radius. Validation uses error text and a soft error surface. The global keyboard focus treatment is a 3px primary outline with a 4px offset.

### Navigation

The header keeps the original logo next to the CourseNFound name, with understated inline actions. Controls gain soft sage on hover. A thin border divides profile controls from the main navigation. At the mobile breakpoint, a menu button exposes the same controls in a bordered surface. Use inline SVG icons, matching the existing 20px icon vocabulary.

### Assessment

Questions use large regular serif text above five evenly spaced numbered choices. Selection changes a choice from a bordered warm surface to primary fill with canvas-colored text. A thin 5px progress track uses a primary fill. State transitions are short and functional: color changes use .15s, progress uses .2s ease-out. Reduced-motion preferences suppress animation and transitions.

## Do's and Don'ts

### Do:
- Do preserve the CourseNFound name and supplied logo.
- Do use semantic CSS properties so controls and surfaces follow the active theme.
- Do keep course lists aligned and separated by fine rules.
- Do provide the visible focus outline and respect reduced motion.
- Do present unavailable modes with their existing coming-soon labels.

### Don't:
- Don't introduce gradients, glass effects, floating course cards, or ornamental statistics.
- Don't replace the supplied logo or add emoji icons.
- Don't use excessive rounding or decorative motion.
- Don't treat the fixed evergreen assessment panel as a theme-changing primary button.
