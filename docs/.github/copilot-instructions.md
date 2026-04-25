# AI Assistant Instructions for EdiPro Frontend

This document guides AI coding assistants in working with the EdiPro frontend codebase.

## Project Architecture

- **Next.js App Router**: Using the modern `/app` directory structure with React Server Components
- **TypeScript**: Strict mode enabled, with path aliases (`@/*` maps to `./src/*`)
- **TailwindCSS**: Used for styling with custom theme variables (see `globals.css`)
- **Font System**: Geist and Geist Mono fonts via `next/font/google`

## Key Development Workflows

```bash
# Development (with Turbopack)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Linting
npm run lint
```

## Project Conventions

### File Structure
- `src/app/`: Contains all pages and layouts using Next.js 13+ file-based routing
- Pages follow the route structure directly (e.g., `app/about/page.tsx` → `/about`)
- Layouts are defined in `layout.tsx` files and apply to all child routes

### Styling
- Use TailwindCSS classes for styling
- Dark mode support via `prefers-color-scheme` media query
- Custom CSS variables in `globals.css` define theme colors:
  ```css
  --background: #ffffff (dark: #0a0a0a)
  --foreground: #171717 (dark: #ededed)
  ```

### Component Patterns
- Use TypeScript's `Readonly` type for props to enforce immutability
- Font optimization via `next/font/google` with variable fonts
- Image optimization using `next/image` component

### Code Quality
- ESLint configured with Next.js and TypeScript rules
- Core Web Vitals checks enabled
- Strict TypeScript mode with all strict flags enabled

## Common Operations

### Adding a New Page
1. Create new file at `src/app/[route]/page.tsx`
2. Export default React component
3. Use route layout if needed (`layout.tsx`)

### Styling Components
1. Use Tailwind classes primarily
2. For custom styles, extend theme in `globals.css`
3. Follow responsive design patterns (sm:, md:, lg: breakpoints)

### Working with Images
1. Place static images in `public/`
2. Use `next/image` component with required props:
   ```tsx
   <Image
     src="/image.png"
     alt="Description"
     width={100}
     height={100}
   />
   ```

## Key Dependencies
- React 19.1.0
- Next.js 15.5.6 with Turbopack
- TailwindCSS 4.x
- TypeScript 5.x

## Getting Help
- Check Next.js docs: https://nextjs.org/docs
- TailwindCSS docs: https://tailwindcss.com/docs
- Project README.md for basic setup