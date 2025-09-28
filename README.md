# Prosperous Universe MVP

A Next.js application for managing inventory, calculating burn rates, and visualizing profit data for Prosperous Universe.

## Tech Stack

- **Framework**: Next.js 15.5.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Code Quality**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged
- **CI/CD**: GitHub Actions + Vercel

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
├── app/                # Next.js App Router pages and components
├── public/             # Static assets
├── .github/            # GitHub Actions workflows
├── .husky/             # Git hooks
├── tailwind.config.js  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
├── .eslintrc.json      # ESLint configuration
├── .prettierrc.json    # Prettier configuration
└── vercel.json         # Vercel deployment configuration
```

## Deployment

This project is configured for automatic deployment to Vercel:

- **Production**: Pushes to `main` branch deploy to production
- **Preview**: Pull requests create preview deployments

## Features (Planned)

- [ ] Display user's current inventory
- [ ] Calculate burn rate and materials needed
- [ ] Show profit per day and related charts
- [ ] Stable baseline schema and API integration

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Ensure all tests pass and linting is clean
4. Create a pull request

Pre-commit hooks will automatically run linting and formatting checks.
