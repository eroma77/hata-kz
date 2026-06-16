# Hata.kz — Brand & Design Guidelines

## Tech Stack
* Core: HTML5, Vanilla CSS3, Vanilla JavaScript (ES6)

## Brand Identity & Design System

### Colors
* **Primary Background (`--bg-primary`)**: `#252736` (Deep blue-gray / slate)
* **Accent Violet (`--accent-violet`)**: `#7e52ff` (Vibrant purple for primary buttons, highlights, hover effects)
* **Accent Lime (`--accent-lime`)**: `#b8ff00` (Electric lime for warnings, positive status, micro-highlights, and badges)
* **Text Primary (`--text-primary`)**: `#ffffff` (Pure white)
* **Text Secondary (`--text-secondary`)**: `#a5a7b5` (Muted light gray-blue)
* **Card Background (`--bg-card`)**: rgba(255, 255, 255, 0.03) with backdrop filter or a slightly lighter shade of dark slate `#2d3042`

### Typography
* **Font Family**: Montserrat (Google Fonts)
  * Standard weights: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold)

### Visual Style
* **Glassmorphism**: Soft background blur (`backdrop-filter: blur(12px)`), semi-transparent borders.
* **Rounded Corners**: Generous card radii (`border-radius: 20px` to `24px`).
* **Neon Glows**: Dynamic radial gradient background blobs to emulate ambient lighting in deep violet/blue.
* **Animations**: Gentle scaling (`transform: scale(1.02)`) on hover, smooth transitions (`all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`).

## Development Rules
* Use clean semantic HTML5 markup.
* Style using modern CSS variables defined in `:root`.
* Every interactive element must have a unique ID.
* Maintain clean documentation inside files.
