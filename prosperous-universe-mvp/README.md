# Prosperous Universe MVP

A Next.js application for showing user inventory, calculating burn rate and materials needed, and displaying profit charts.

## Tech Stack

- **Framework**: Next.js 15.5.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged
- **CI/CD**: GitHub Actions + Vercel

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm (comes with Node.js)

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm test` - Run tests (placeholder for now)

## Code Quality

### Pre-commit Hooks

This project uses Husky and lint-staged to ensure code quality. Before each commit:
- ESLint will check for code issues
- Prettier will format the code

### CI/CD Pipeline

GitHub Actions runs on every push and pull request to `main` and `develop` branches:
- Linting checks
- Type checking
- Build verification
- Test execution (when tests are added)

### Vercel Deployment

The project is configured for deployment on Vercel:
- Automatic preview deployments for pull requests
- Production deployments on merge to main branch

## Project Structure

```
prosperous-universe-mvp/
├── app/                # Next.js App Router pages and components
├── public/             # Static assets
├── .github/            # GitHub Actions workflows
├── .husky/             # Git hooks
├── eslint.config.js    # ESLint configuration
├── next.config.ts      # Next.js configuration
├── tailwind.config.ts  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
└── vercel.json         # Vercel deployment configuration
```

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Ensure all checks pass (`npm run lint`, `npm run format:check`, `npm run build`)
4. Create a pull request

All pull requests will trigger CI checks and Vercel preview deployments.