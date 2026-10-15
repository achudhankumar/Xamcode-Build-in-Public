# Xamcode - Build in Public

A transparent development dashboard for the Xamcode project.

## Project Location

```
C:\Users\asus1\Documents\Xamcode-Build-in-Public
```

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Available Pages

- `/` - Home page with hero section and feature highlights
- `/progress` - Live development progress dashboard
- `/roadmap` - Public roadmap
- `/changelog` - Version history and release notes
- `/community` - Community discussions
- `/suggestions` - Feature suggestions and voting
- `/early-access` - Waitlist signup
- `/about` - About Xamcode
- `/privacy` - Privacy policy

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Icons:** Inline SVG (no external dependencies)

## Configuration

1. Copy `.env.example` to `.env.local`
2. Configure environment variables as needed
3. For demo mode, set `NEXT_PUBLIC_DEMO_MODE=true`

## Features

- ✅ Dark theme with premium aesthetic
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Static site generation for fast loading
- ✅ SEO metadata (OpenGraph, Twitter cards)
- ✅ No external API calls in demo mode

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_DEMO_MODE` | Enable demo mode without database | `true` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (optional) | - |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (optional) | - |
| `GITHUB_TOKEN` | GitHub personal access token (optional) | - |
| `GITHUB_REPO` | GitHub repository (optional) | - |

## Development

This is a demonstration project showing the Xamcode build-in-public concept.
The site displays placeholder data and does not connect to real development metrics
until properly configured with external services.

## License

Private - All rights reserved
