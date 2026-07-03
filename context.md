# Context.md

## Project Name (Working Title)
**SnapParty** *(working name)*

---

# Project Overview

The project is a modern web-based event photo booth platform where attendees can capture photos directly from their mobile browser without installing an application.

Instead of asking guests to upload photos after the event, organizers simply provide a QR code. Guests scan the QR code, open a web camera interface, capture their allotted photos (default: **15 shots**), and each photo is automatically uploaded to the organizer's dashboard in real-time.

The vision is to transform traditional event photo collection into an interactive experience rather than just another gallery uploader.

---

# Core Problem

After events:

- Guests take hundreds of photos.
- Organizers rarely receive those photos.
- People forget to send them.
- Photos become scattered across Messenger, Instagram, Google Drive, etc.

This platform solves that problem by collecting photos immediately as they are taken.

---

# Target Events

- Weddings
- Birthdays
- Debuts
- Graduations
- Corporate Events
- Conferences
- School Events
- Festivals
- Brand Activations
- Family Reunions

---

# Target Users

## Organizer

Creates and manages events.

Responsibilities:

- Create Event
- Generate QR Code
- View Live Uploads
- Download All Photos
- Moderate Photos
- View Analytics

---

## Guest

No registration required.

Flow:

Scan QR

↓

Allow Camera Permission

↓

Take Photos

↓

Automatic Upload

↓

Thank You Page

---

# User Flow

```text
Guest

Scan QR
      │
      ▼
Landing Page
      │
      ▼
Camera Permission
      │
      ▼
Camera Interface
(15 Shots Remaining)
      │
      ▼
Capture Photos
      │
      ▼
Auto Upload
      │
      ▼
Finish
```

---

# Organizer Flow

```text
Login

↓

Dashboard

↓

Create Event

↓

Generate QR

↓

Guests Upload

↓

Live Gallery

↓

Download ZIP
```

---

# MVP Features

## Guest

- QR Code Access
- Mobile Camera
- Front / Rear Camera
- Remaining Shot Counter
- Automatic Upload
- Image Compression
- Progress Indicator
- Thank You Screen

---

## Organizer Dashboard

- Login
- Event Management
- Live Gallery
- Search Photos
- Download ZIP
- Delete Photos
- Event Statistics

---

# Technology Stack

## Frontend

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- React
- MediaDevices API

---

## Backend

Using Next.js API Routes / Route Handlers.

No separate backend server.

---

## Database

Supabase PostgreSQL

Tables:

### events

- id
- name
- slug
- qr_token
- photo_limit
- created_at

### sessions

- id
- event_id
- session_token
- shots_used
- device
- created_at

### photos

- id
- event_id
- session_id
- image_url
- uploaded_at

---

## Storage

Supabase Storage

Structure:

events/

event-id/

session-id/

photo.jpg

Images are stored in Storage while the database only stores metadata and URLs.

---

# Authentication

Only organizers require authentication.

Guests remain anonymous.

Anonymous guest sessions are identified using generated session tokens stored in browser storage.

---

# QR Code Structure

Example

https://domain.com/e/abc123

Where:

abc123 = Event Identifier

Scanning the QR code automatically creates an anonymous session.

---

# Camera Experience

Features:

- Full-screen UI
- Camera switching
- Flash (where supported)
- Remaining shots counter
- Smooth animations
- Automatic upload after every capture

No "Submit" button required.

---

# Dashboard

Should feel modern and real-time.

Widgets:

- Total Guests
- Total Photos
- Upload Activity
- Storage Used

Gallery updates instantly as new photos arrive.

---

# Future Vision

The application should evolve into an Event Experience Platform rather than simply a photo uploader.

---

# Innovative Features

## 1. Live Memory Wall ⭐⭐⭐⭐⭐

As guests upload photos, they instantly appear on a projector or TV.

Flow:

Guest

↓

Take Photo

↓

Upload

↓

(Optional Approval)

↓

Displayed Live

Perfect for:

- Weddings
- Birthdays
- Corporate Events

---

## 2. Event Frames ⭐⭐⭐⭐⭐

Automatically apply branded overlays.

Examples:

- Wedding Frame
- Birthday Theme
- Company Branding
- School Event Theme

Applied before upload.

---

## 3. Camera Challenges ⭐⭐⭐⭐☆

Example:

- Take a photo with someone new.
- Capture the funniest face.
- Find the bride.
- Take a photo with the birthday celebrant.

Gamifies participation.

---

## 4. AI Photo Strip ⭐⭐⭐⭐⭐

After completing all shots:

Automatically generate:

- Photo Strip
- Collage
- Memory Grid

Guests can download immediately.

---

## 5. Digital Guestbook ⭐⭐⭐⭐⭐

After taking photos:

Guests leave a message.

Example:

"Congratulations!
Wishing you both happiness!"

The organizer receives both photos and memories.

---

## 6. Memory Timeline

Automatically group photos by time.

Example:

2 PM

Guests Arriving

↓

3 PM

Ceremony

↓

6 PM

Dinner

↓

8 PM

Dance Party

---

## 7. Table QR Codes

Each table receives its own QR.

Benefits:

- Organize uploads
- Analytics by table
- Easier browsing

---

## 8. Live Slideshow

Continuously display newest photos.

Great for:

- LED Walls
- TVs
- Projectors

---

## 9. Event Analytics

Organizer receives insights.

Examples:

- Total Guests
- Total Photos
- Peak Upload Time
- Most Active Table
- Storage Used

---

# Product Vision

The goal is not to build another gallery uploader.

The goal is to build an **Interactive Event Experience Platform**.

Guests should feel like they are participating in an event activity instead of simply uploading files.

---

# Long-Term Roadmap

## Phase 1 (MVP)

- Event Creation
- QR Code Generation
- Camera Interface
- 15 Shot Limit
- Auto Upload
- Organizer Dashboard
- Download ZIP

---

## Phase 2

- Live Slideshow
- Event Branding
- Photo Frames
- Guestbook
- Real-time Dashboard

---

## Phase 3

- AI Photo Strip
- AI Collages
- Face Recognition (Optional)
- Analytics
- SaaS Accounts
- Subscription Plans

---

# Monetization

Possible pricing:

Free

- Limited events
- Limited storage

Basic

- More storage
- Branding

Pro

- Unlimited photos
- Live slideshow
- Analytics
- AI Photo Strip

Enterprise

- Multiple organizers
- White-label
- Custom domains
- Priority support

---

# Design Philosophy

The application should be:

- Mobile-first
- Extremely simple
- Beautiful
- Fast
- No app installation
- No guest registration
- Minimal friction

Every interaction should require as few taps as possible.

---

# Success Metric

A successful event should allow guests to:

Scan QR

↓

Take Photos

↓

Walk Away

While the organizer instantly receives every captured memory in one centralized dashboard.

The product should ultimately become the easiest and most engaging way for event organizers to collect memories from attendees.