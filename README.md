# Studio AI - Images & Video Creation App

A beautiful mobile app inspired by Krea AI for generating images and videos using artificial intelligence.

## Overview

Studio AI is an iOS-optimized React Native app that provides a sleek interface for AI-powered image and video generation. The app features a modern, dark-themed UI with smooth animations and an intuitive user experience, closely matching the Krea AI design aesthetic.

## Features

### Authentication Screen
- **Beautiful gradient background** with dark blue tones
- **3D graphic hero section** with colorful gradient placeholder
- **Three sign-in options:**
  - Sign in with email
  - Continue with Apple (black button)
  - Continue with Google (white button)
- Sign up and forgot password links
- Username display (@machineforms12)

### Home Screen
- **Blurred header (fixed position):**
  - Menu icon, Model selector dropdown (Krea 1), Profile avatar
  - Beautiful blur effect matching Krea AI style
- **Prompt Input Section:**
  - Large bold heading: "What do you want to create today?" (3xl)
  - Multi-line text input with dark gray background (#2d2d2d)
  - Quick options with black rounded buttons: Image/Video mode selector (toggles between modes), aspect ratio selector (with iOS native bottom sheet modal)
  - Mode selector switches between "Image" and "Video" with corresponding icons
  - Additional controls: add button and inspiration bulb
  - Aspect ratios: 4:3, 3:2, 16:9, 2.35:1, 1:1, 4:5, 2:3, 9:16
- **Tool Categories (Large rounded icons with beautiful gradients):**
  - All tools (purple to blue gradient)
  - Image (cyan to blue gradient)
  - Video (amber to orange gradient)
  - Edit (purple to pink gradient)
  - Enhance (gray gradient)
- **Content Sections:**
  - Aesthetic Shot: Two-column image grid with random placeholder images from Picsum
  - Voxel: Horizontal scrolling gallery with random placeholder images
- Fully scrollable interface with keyboard handling
- Bold typography matching Krea design

## Tech Stack

- **Expo SDK 53** with React Native 0.76.7
- **TypeScript** for type safety
- **React Navigation** (Native Stack) for navigation
- **NativeWind** (Tailwind CSS) for styling
- **Expo Linear Gradient** for gradient backgrounds
- **Expo Vector Icons** for iconography
- **Safe Area Context** for proper screen insets

## App Structure

```
src/
├── screens/
│   ├── LoginScreen.tsx       # Authentication screen with 3D hero and social login
│   ├── HomeScreen.tsx         # Main studio interface with prompt input
│   ├── ExploreScreen.tsx      # Explore placeholder screen
│   ├── CreateScreen.tsx       # Create placeholder screen
│   ├── LibraryScreen.tsx      # Library placeholder screen
│   └── ProfileScreen.tsx      # Profile placeholder screen
└── navigation/
    ├── RootNavigator.tsx      # App navigation configuration
    └── TabNavigator.tsx       # Bottom tab navigation (5 tabs)
```

## Screens

### Login Screen (`src/screens/LoginScreen.tsx`)
- Dark gradient background (blue tones)
- Colorful gradient hero graphic (purple, pink, orange)
- Three authentication buttons with proper styling
- Sign up and forgot password links
- Username credit display

### Home Screen (`src/screens/HomeScreen.tsx`)
- Centered header with model selector dropdown
- Large prompt input with multi-line support
- Tool category selector with icons
- Content gallery sections (Aesthetic Shot, Voxel)
- Horizontal scrolling voxel gallery
- Keyboard-aware layout
- Clean, minimalist design matching Krea AI

## Navigation Flow

1. **Login Screen** - Initial screen with authentication options
2. **Home Screen** - Main studio interface after sign-in

## Design Philosophy

The app follows the Krea AI design system with:
- Pure black background (#000000) for deep contrast
- Purple (#a855f7) as the primary brand color
- Gray-900 (#111827) for elevated surfaces
- Rounded corners (rounded-2xl, rounded-full)
- Smooth press interactions with opacity feedback
- Proper spacing and hierarchy
- Safe area insets for notched devices

## Current Status

✅ Login screen matching Krea AI design
✅ Home screen with exact layout from design
✅ Centered header with model selector
✅ Tool category navigation
✅ Content gallery sections
✅ Voxel section with gray rounded buttons
✅ **5 bottom navigation tabs** (Home, Explore, Create, Library, Profile)
✅ Dark theme UI optimized for OLED
✅ Keyboard handling for text input
✅ Exact spacing and sizing to match design

## Next Steps

To extend the app, consider adding:
- Actual image generation API integration
- Gallery view for generated content
- Individual tool screens (Image, Video, Edit, Assets)
- Settings and profile management
- Project history with local storage
- Export and sharing capabilities
- Real-time generation progress

## Notes

- All authentication is frontend-only (no backend integration)
- The app is optimized for iOS devices
- Built with Expo and React Native
- Placeholder graphics for demonstration
