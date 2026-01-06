# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 **CRITICAL UPDATES IMPLEMENTED** (Latest)

### ✅ **Testing Infrastructure** - COMPLETED
- **Added**: Vitest + React Testing Library setup
- **Files**: `vite.config.ts`, `src/test/setup.ts`, `package.json` (dependencies)
- **Tests**: `src/test/App.test.tsx`, `src/test/validation.test.ts`
- **Commands**: `npm test`, `npm run test:coverage`, `npm run test:ui`

### ✅ **Error Boundary Implementation** - COMPLETED
- **Added**: `src/components/ErrorBoundary.tsx`
- **Features**: Graceful error handling, development error details, retry functionality
- **Integration**: Wrapped entire App component in `src/App.tsx`

### ✅ **Input Validation & Security** - COMPLETED
- **Enhanced**: `src/lib/validation.ts` with Zod schemas
- **Added**: Comprehensive validation for assets, beneficiaries, login, signup
- **Added**: Input sanitization functions (XSS protection)
- **Integration**: Updated `src/components/assets/AssetForm.tsx` with validation

### ✅ **API Response Standardization** - COMPLETED
- **Enhanced**: `src/lib/api.ts` with standardized error handling
- **Added**: `handleResponse()` function for consistent error parsing
- **Added**: `checkApiHealth()` function for API status monitoring
- **Improved**: Better error messages and JSON parsing safety

### ✅ **Chat System with Local LLM** - COMPLETED
- **Added**: `src/lib/llm.ts` - LLM service with Ollama integration
- **Added**: `src/lib/chatTools.ts` - Chat tools functionality
- **Integration**: Direct frontend-to-Ollama communication (no backend needed)
- **Model**: qwen3 (5.2GB) as primary, gemma2:2b as fallback
- **Fixed**: React Markdown v9+ compatibility issues
- **Environment**: `VITE_USE_LOCAL_LLM=true`, `VITE_OLLAMA_URL=http://localhost:11434`

### ✅ **Profile System Expansion** - COMPLETED
- **Database**: Comprehensive demographic fields added via Prisma migration
- **Added**: Full address, emergency contact, legacy planning fields
- **Added**: Special instructions text area for final wishes
- **Added**: Executor information (name, phone, email)
- **Fixed**: Avatar upload and rendering for local API mode
- **Enhanced**: `ProfileForm` and `ProfileView` components with modern UI

### ✅ **File Storage & Document Upload** - COMPLETED
- **Architecture**: Docker volume (`uploads_data`) for persistent storage
- **Paths**: `/app/uploads/avatars/`, `/app/uploads/documents/`
- **Fixed**: Document upload with proper snake_case/camelCase transformation
- **Fixed**: Profile picture upload, preview, and display
- **Access**: Direct URL serving via Express static middleware

## Development Commands

### Core Development
- `npm run dev` - Start Vite development server (frontend)
- `npm run build` - Build production frontend bundle
- `npm run lint` - Run ESLint for code quality
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run preview` - Preview production build locally
- `npm run type-check` - Run TypeScript type checking

### Testing (NEW)
- `npm test` - Run all tests with Vitest
- `npm run test:ui` - Run tests with UI interface
- `npm run test:coverage` - Run tests with coverage report

### Backend Development (server/)
- `cd server && npm run dev` - Start backend development server with hot reload
- `cd server && npm run build` - Build backend TypeScript to JavaScript
- `cd server && npm run start` - Start production backend server
- `cd server && npm run prisma:generate` - Generate Prisma client
- `cd server && npm run prisma:migrate` - Run database migrations
- `cd server && npm run prisma:deploy` - Deploy migrations to production

### Docker Compose (Local Development)
- `docker compose up -d` - Start all services in background (PostgreSQL, server, web, pgadmin, ollama)
- `docker compose up` - Start all services with logs visible
- `docker compose down` - Stop all services
- `docker compose ps` - Check status of all containers
- `docker compose logs [service]` - View logs (e.g., `docker compose logs server`)
- `docker compose restart [service]` - Restart a specific service
- `docker compose build` - Rebuild containers after code changes

### Supabase Local Development
- `supabase start` - Start local Supabase instance
- `supabase stop` - Stop local Supabase instance
- `supabase db reset` - Reset local database with migrations and seed data
- `supabase gen types typescript --local` - Generate TypeScript types from schema

## Development Environment Setup

### Option 1: Supabase (Cloud/Production) - Simplest
1. Create a Supabase project at supabase.com
2. Copy `.env.example` to `.env`
3. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Run `npm run dev`

### Option 2: Docker Compose (Recommended for Local Development) ⭐
**Complete local development environment with all services**

1. **Prerequisites**: Install Docker and Docker Compose
2. **Start all services**:
   ```bash
   docker compose up -d
   ```
3. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - Database: localhost:5432
   - PgAdmin: http://localhost:5050 (admin@fortivo.com / admin)
   - Ollama (AI): localhost:11434

4. **Stop services**:
   ```bash
   docker compose down
   ```

**What's included:**
- ✅ PostgreSQL 16 database (auto-configured)
- ✅ Backend Express server (with Prisma)
- ✅ Frontend Vite dev server
- ✅ PgAdmin (database management UI)
- ✅ Ollama (local LLM for AI features)

**Environment variables** are automatically configured in `docker-compose.yml`:
- `VITE_API_URL=http://localhost:8080`
- `DATABASE_URL=postgresql://postgres:postgres@db:5432/fortivo`
- `JWT_SECRET=devsecret`

### Option 3: Manual Local Setup (Advanced)
1. Set up PostgreSQL database locally
2. Copy `.env.example` to `.env` 
3. Set `VITE_API_URL=http://localhost:8080`
4. In `server/` directory, create `.env` with `DATABASE_URL` and `JWT_SECRET`
5. Run `cd server && npm run prisma:migrate && npm run dev`
6. In root directory, run `npm run dev`

## Architecture Overview

### Frontend Architecture
- **React 18** with **TypeScript** and **Vite** build system
- **Tailwind CSS** for utility-first styling
- **React Router** for client-side routing
- **Custom hooks pattern** for business logic separation
- **Context API** for authentication state management
- **Error Boundaries** for graceful error handling (NEW)
- **Zod validation** for input validation and security (NEW)
- **Vitest + Testing Library** for comprehensive testing (NEW)

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── assets/         # Asset management components
│   ├── auth/           # Authentication components
│   ├── beneficiaries/  # Beneficiary management
│   ├── chat/           # AI chat functionality
│   ├── documents/      # Document management
│   ├── layout/         # Layout and navigation
│   ├── profile/        # User profile components (ENHANCED)
│   ├── subscription/   # Subscription management
│   ├── ui/             # Generic UI components
│   └── ErrorBoundary.tsx # Error handling
├── hooks/              # Custom React hooks for data fetching
│   ├── useAssets.ts   # Asset CRUD operations
│   ├── useBeneficiaries.ts # Beneficiary management
│   ├── useProfile.ts  # Profile operations (ENHANCED)
│   ├── useChat.ts     # Chat functionality with LLM
│   ├── useSubscription.ts # Subscription management
│   └── useAssetDocuments.ts # Document operations
├── lib/                # Utility libraries and configurations
│   ├── i18n/          # Internationalization setup
│   │   └── locales/   # Translation files (en, es, pt)
│   ├── api.ts         # API client with standardized error handling
│   ├── auth.ts        # Authentication utilities
│   ├── chatCommands.ts # Chat command system
│   ├── chatTools.ts   # Chat tools functionality (NEW)
│   ├── llm.ts         # LLM service (Ollama/Gemini integration) (NEW)
│   ├── supabase.ts    # Supabase client configuration
│   ├── validation.ts  # Zod schemas and input validation
│   ├── routes.ts      # Route definitions
│   ├── stripe.ts      # Stripe payment integration
│   ├── currency.ts    # Currency formatting
│   ├── toast.ts       # Toast notification utilities
│   ├── utils.ts       # General utilities
│   └── assetParser.ts # Asset parsing utilities
├── pages/              # Route-level page components
├── test/               # Test files
│   ├── setup.ts       # Test configuration
│   ├── App.test.tsx   # App component tests
│   └── validation.test.ts # Validation function tests
└── types/              # TypeScript type definitions
    └── database.ts    # Database types (Supabase + local API)

server/                 # Backend Express server (NEW)
├── src/
│   └── index.ts       # Main server file with all endpoints
├── prisma/
│   ├── schema.prisma  # Database schema
│   └── migrations/    # Database migrations
└── uploads/           # File storage (avatars, documents)
```

### Backend Architecture
- **Triple backend support**: 
  - Supabase (cloud/production)
  - Express/Prisma with Docker Compose (recommended local development)
  - Express/Prisma manual setup (advanced local development)
- **Authentication modes**: 
  - Supabase auth (cloud): JWT tokens with automatic refresh
  - Local API auth: HTTP-only cookies with JWT
- **Row Level Security (RLS)** for data protection in Supabase mode
- **Multi-language support** (English, Spanish, Portuguese)
- **Docker Compose setup** includes: PostgreSQL, Express server, Frontend, PgAdmin, Ollama (AI)

### Key Data Models
- **Profile**: User profile with subscription tiers (free/pro/premium) and comprehensive demographics
  - Basic: full_name, date_of_birth, avatar_url
  - Contact: phone_number, email
  - Address: street_address, city, state, zip_code, country
  - Emergency Contact: name, phone, relationship
  - Legacy Planning: special_instructions, executor details
- **Asset**: Financial/physical/digital assets with beneficiary assignments
- **Beneficiary**: Asset inheritors with contact information
- **AssetDocument**: File attachments for assets (PDFs, images)
- **Subscription**: Payment and tier management

## Development Patterns

### Authentication Flow
- **Dual auth system**: Automatically detects mode based on `VITE_API_URL` env var
- **Supabase mode** (when `VITE_API_URL` is not set):
  - Uses Supabase auth with email/password
  - JWT tokens stored by Supabase client
  - Real-time auth state changes
- **Local API mode** (when `VITE_API_URL` is set):
  - Custom auth endpoints (`/auth/login`, `/auth/signup`, `/auth/logout`)
  - HTTP-only cookies for session management
  - Manual auth state polling
- `AuthProvider` context wrapper manages auth state for both modes
- `useAuth()` hook provides user, loading, and initialized states
- `PrivateRoute` component protects authenticated routes

### Data Fetching Pattern
- Custom hooks (e.g., `useAssets`, `useBeneficiaries`) handle CRUD operations
- Automatic error handling and loading states
- Real-time updates via Supabase subscriptions where applicable
- **Enhanced error handling** with standardized API responses (NEW)

### Component Architecture
- Functional components with TypeScript
- Props interfaces defined for all components
- Separation of presentation and business logic
- Reusable UI components in `components/ui/`
- **Error boundaries** for graceful error handling (NEW)
- **Input validation** with Zod schemas (NEW)

### State Management
- React Context for global state (auth)
- Local state with useState/useReducer for component state
- Custom hooks for complex state logic

### Testing Strategy (NEW)
- **Unit tests**: Individual functions and components
- **Integration tests**: Component interactions and API calls
- **Validation tests**: Zod schema validation coverage
- **Error boundary tests**: Error handling scenarios
- **Test coverage**: Aim for 80%+ coverage on critical paths

## Environment Setup

### Required Environment Variables
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional Variables (for local API mode)
```
VITE_API_URL=http://localhost:8080
VITE_USE_LOCAL_LLM=true
VITE_OLLAMA_URL=http://localhost:11434
```

## Daily Development Workflow

### Hot Reload Development
Your Docker setup supports **instant hot reload** without rebuilding containers:

**Frontend Changes** (src/):
- Edit any React component or TypeScript file
- Save the file
- Vite HMR automatically updates the browser

**Backend Changes** (server/src/):
- Edit any TypeScript file
- Save the file
- `tsx watch` automatically recompiles and restarts the server

### When to Rebuild
You **ONLY** need to rebuild containers if:
1. Adding/removing npm packages (`package.json` changes)
2. Changing Dockerfile configuration
3. Updating Prisma schema (run migration, no rebuild needed)

```bash
# Rebuild specific service
docker compose build server
docker compose build web

# Or rebuild everything
docker compose build
```

### Common Commands
```bash
# Start the stack (daily)
docker compose up -d

# View logs
docker compose logs -f
docker compose logs -f server
docker compose logs -f web

# Restart a service
docker compose restart server
docker compose restart web

# Stop everything
docker compose down

# Execute commands inside containers
docker compose exec server npm install <package>
docker compose exec server npx prisma migrate dev --name <migration-name>
docker compose exec ollama ollama pull qwen3
```

### Service URLs
- **Frontend**: http://localhost:5173 (Vite dev server with HMR)
- **Backend API**: http://localhost:8080 (Express server)
- **Database**: localhost:5432 (PostgreSQL)
- **PgAdmin**: http://localhost:5050 (admin@fortivo.com / admin)
- **Ollama API**: http://localhost:11434 (Local LLM)

For more details, see `DEV-WORKFLOW.md` in the root directory.

## Feature Development Workflow

### When adding new features:
1. Create components in appropriate subdirectories
2. Add TypeScript interfaces to `src/types/`
3. Create custom hooks for data operations
4. **Add Zod validation schemas** to `src/lib/validation.ts`
5. **Write tests** for new functionality
6. Update routing in `src/lib/routes.ts`
7. Add translations to locale files if UI text is added
8. Test with both Supabase and local API modes if applicable

### Database Changes:
1. Create Supabase migration in `supabase/migrations/`
2. Update TypeScript types in `src/types/database.ts`
3. Update custom hooks to handle new schema
4. **Update validation schemas** if needed
5. **Add tests** for new data models
6. Test with local Supabase instance before production

### Code Style:
- Use ESLint configuration provided
- Prefer functional components over class components
- Use TypeScript strict mode
- Follow existing naming conventions for consistency
- Components use PascalCase, hooks use camelCase with 'use' prefix
- **Always validate user input** with Zod schemas
- **Handle errors gracefully** with error boundaries

## Key Integration Points

### Supabase Integration
- Client configured in `src/lib/supabase.ts` with fallback support
- Row Level Security policies protect user data
- Real-time subscriptions available for live data updates

### AI Features
- **Dual LLM Support**:
  - **Ollama** (local, private): Direct frontend-to-Ollama communication via `src/lib/llm.ts`
  - **Google Gemini** (cloud): API key-based integration
- **Models**:
  - Primary: qwen3 (5.2GB) - conversational AI
  - Fallback: gemma2:2b (1.6GB) - lighter alternative
- **Chat System**:
  - React Markdown rendering with syntax highlighting
  - Command system in `src/lib/chatCommands.ts`
  - Chat tools in `src/lib/chatTools.ts`
  - Provider switching (Ollama ↔ Gemini)
  - Connection status indicators
- **No Backend Required**: Chat communicates directly with Ollama at `localhost:11434`
- **Environment Variables**:
  - `VITE_USE_LOCAL_LLM=true` - Enable local Ollama
  - `VITE_OLLAMA_URL=http://localhost:11434` - Ollama endpoint
  - `VITE_GEMINI_API_KEY` - For Google Gemini (optional)

### Payment Integration
- Stripe integration for subscription management
- Checkout session creation via Supabase Edge Functions
- Webhook handling for payment events

### File Storage
- **Dual Storage System**:
  - **Supabase Storage**: For cloud/production deployments
  - **Local File System**: For Docker development environment
- **Local Storage Architecture** (Docker):
  - Docker volume: `uploads_data` (persists across container restarts)
  - Container path: `/app/uploads/`
  - Subdirectories:
    - `/app/uploads/avatars/` - Profile pictures
    - `/app/uploads/documents/` - Asset documents
  - Access URLs: `http://localhost:8080/uploads/{type}/{filename}`
- **File Upload Endpoints**:
  - `POST /api/profile/avatar` - Upload profile picture (multipart/form-data)
  - `POST /api/assets/:assetId/documents` - Upload asset document
  - `DELETE /api/assets/:assetId/documents/:documentId` - Delete document and file
- **File Handling**:
  - Type validation (images for avatars, PDFs/images for documents)
  - Size limits (10MB max)
  - Automatic file naming (timestamp + original filename)
  - Relative path storage in database
- **Field Transformation**: Backend transforms camelCase (Prisma) ↔ snake_case (Frontend)

## Security Measures (ENHANCED)

### Input Validation & Sanitization
- **Zod schemas** for all user inputs
- **XSS protection** with input sanitization
- **Type safety** with TypeScript strict mode
- **Server-side validation** on all API endpoints

### Error Handling
- **Error boundaries** prevent app crashes
- **Graceful degradation** for network issues
- **User-friendly error messages**
- **Development error details** for debugging

### Authentication Security
- **JWT tokens** with proper expiration
- **HTTP-only cookies** for session management
- **Password validation** with strong requirements
- **Rate limiting** on auth endpoints

## Testing Strategy (NEW)

### Test Types
1. **Unit Tests**: Individual functions and components
   - Validation functions (`src/test/validation.test.ts`)
   - Utility functions
   - Component rendering

2. **Integration Tests**: Component interactions
   - Form submissions with validation
   - API calls and error handling
   - Authentication flows

3. **Error Boundary Tests**: Error scenarios
   - Component crashes
   - Network failures
   - Invalid data handling

### Test Coverage Goals
- **Critical paths**: 90%+ coverage
- **Validation functions**: 100% coverage
- **Error handling**: 100% coverage
- **Overall**: 80%+ coverage

### Testing Commands
```bash
npm test              # Run all tests
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage
```

## Performance Optimization

### Current Optimizations
- **Code splitting** with React.lazy()
- **Memoization** with React.memo and useMemo
- **Bundle analysis** with rollup-plugin-visualizer
- **Tree shaking** with ES modules

### Planned Optimizations
- **Image optimization** with next/image
- **Service worker** for caching
- **Database query optimization**
- **CDN integration** for static assets

## Deployment

### Environment Setup
Required environment variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Build Process
```bash
npm run build
npm run test        # Run tests before deployment
npm run type-check  # Type checking
```

### Production Deployment
Deployed via Netlify with:
- Automatic HTTPS
- CDN distribution
- Continuous deployment from main branch
- **Error monitoring** with Sentry (planned)
- **Performance monitoring** with Web Vitals (planned)

## Critical Security Checklist

### ✅ Implemented
- [x] Input validation with Zod schemas
- [x] XSS protection with input sanitization
- [x] Error boundaries for graceful error handling
- [x] JWT token security
- [x] HTTP-only cookies
- [x] Password strength validation
- [x] TypeScript strict mode

### 🔄 Planned
- [ ] Rate limiting on API endpoints
- [ ] CSRF protection
- [ ] Content Security Policy (CSP)
- [ ] Security headers
- [ ] Audit logging
- [ ] Penetration testing

## Quality Assurance

### Code Quality
- **ESLint** with strict rules
- **Prettier** for code formatting
- **TypeScript** strict mode
- **Pre-commit hooks** (planned)

### Testing Quality
- **Unit tests** for all critical functions
- **Integration tests** for user flows
- **Error scenario tests**
- **Performance tests** (planned)

### Security Quality
- **Input validation** on all forms
- **Error handling** for all API calls
- **Authentication** security
- **Data sanitization**

## Troubleshooting Common Issues

### Chat Not Working
**Symptoms**: Chat button shows error or no response from AI

**Solutions**:
1. **Check Ollama model is pulled**:
   ```bash
   docker compose exec ollama ollama list
   # Should show qwen3
   ```

2. **Pull the model if missing**:
   ```bash
   docker compose exec ollama ollama pull qwen3
   ```

3. **Check Ollama is running**:
   ```bash
   docker compose logs ollama
   curl http://localhost:11434/api/tags
   ```

4. **Test model directly**:
   ```bash
   docker compose exec ollama ollama run qwen3 "Hello"
   ```

5. **Hard refresh browser** (clear cache):
   - Windows: Ctrl + Shift + R
   - Mac: Cmd + Shift + R

### Document Upload Failing
**Symptoms**: "Failed to upload document" error

**Solutions**:
1. **Check subscription tier**: Documents require Pro or Premium tier
2. **Check file size**: Max 10MB per file
3. **Check server logs**:
   ```bash
   docker compose logs -f server
   ```
4. **Verify uploads directory exists**:
   ```bash
   docker compose exec server ls -la /app/uploads/documents/
   ```
5. **Check field name transformation**: Backend should transform camelCase ↔ snake_case

### Profile Picture Not Showing
**Symptoms**: Avatar doesn't display or shows broken image

**Solutions**:
1. **Check browser console** (F12) for 404 or CORS errors
2. **Verify file was uploaded**:
   ```bash
   docker compose exec server ls -la /app/uploads/avatars/
   ```
3. **Check URL construction**: Should be `http://localhost:8080/uploads/avatars/filename.jpg`
4. **Hard refresh browser** to clear cached broken image

### Frontend Changes Not Appearing
**Symptoms**: Code changes don't reflect in browser

**Solutions**:
1. **Hard refresh browser** (Ctrl + Shift + R)
2. **Check Vite is running**:
   ```bash
   docker compose logs -f web
   ```
3. **Restart web service**:
   ```bash
   docker compose restart web
   ```

### Backend Changes Not Applying
**Symptoms**: API changes don't take effect

**Solutions**:
1. **Check server logs for errors**:
   ```bash
   docker compose logs -f server
   ```
2. **Restart server**:
   ```bash
   docker compose restart server
   ```
3. **Rebuild if package.json changed**:
   ```bash
   docker compose build server
   docker compose up -d
   ```

### Database Migration Issues
**Symptoms**: Prisma errors, schema mismatch

**Solutions**:
1. **Check migration status**:
   ```bash
   docker compose exec server npx prisma migrate status
   ```
2. **Apply pending migrations**:
   ```bash
   docker compose exec server npx prisma migrate deploy
   ```
3. **Reset database** (CAUTION: deletes all data):
   ```bash
   docker compose exec server npx prisma migrate reset
   ```

### Port Already in Use
**Symptoms**: Docker fails to start, port conflict errors

**Solutions**:
1. **Stop all containers**:
   ```bash
   docker compose down
   ```
2. **Check what's using the port** (Windows PowerShell):
   ```powershell
   Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess
   ```
3. **Kill the process** or change port in `docker-compose.yml`

For more troubleshooting tips, see `CHAT-FIX.md`, `FIXES-SUMMARY.md`, and `DEV-WORKFLOW.md`.

## Important Implementation Notes

### Field Naming Convention
The application uses **different naming conventions** between frontend and backend:

**Frontend (TypeScript interfaces)**:
- Uses `snake_case` for all field names
- Example: `full_name`, `date_of_birth`, `avatar_url`

**Backend (Prisma models)**:
- Uses `camelCase` for all field names
- Example: `fullName`, `dateOfBirth`, `avatarUrl`

**Transformation**:
- Backend API endpoints **must** transform field names when sending/receiving data
- Use helper functions or manual transformation
- Already implemented in all current endpoints

### Subscription Tier Limits
Enforced on backend via middleware:

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| **Assets** | 20 max | Unlimited | Unlimited |
| **Beneficiaries** | 10 max | 50 max | Unlimited |
| **Documents** | ❌ Not allowed | ✅ Allowed | ✅ Allowed |

**Debug Mode**: Set in backend for testing without payment
- Allows instant tier switching
- Shows yellow banner in UI
- Disable for production deployment

### React Markdown Compatibility
Using React Markdown v9+ requires specific component prop handling:
- **DON'T**: Pass `className` directly to `<ReactMarkdown>`
- **DO**: Wrap in a `<div>` with className
- **DON'T**: Use parameter destructuring in custom components: `code: ({ inline, children }) => ...`
- **DO**: Use props object: `code: (props) => { const { inline, children } = props; ... }`

### File Upload Best Practices
- Always validate file type and size on both frontend and backend
- Store relative paths in database, not absolute paths
- Use timestamp prefixes for unique filenames
- Serve files via Express static middleware in local mode
- Use Supabase Storage URLs in production mode

### Authentication State Management
- `AuthProvider` automatically detects mode based on `VITE_API_URL`
- Always use `useAuth()` hook, never access context directly
- Check `initialized` state before making auth-dependent calls
- Local mode uses HTTP-only cookies, Supabase mode uses JWT tokens

### Database Migrations
- Always create migrations for schema changes: `npx prisma migrate dev --name <description>`
- Test migrations in development before production
- Migration files are in `server/prisma/migrations/`
- Keep Prisma schema in sync with TypeScript types (`src/types/database.ts`)

## Key Features Summary

### ✅ Fully Implemented Features
1. **Authentication System**
   - Email/password auth (Supabase + local API)
   - Dual-mode support (cloud/local)
   - HTTP-only cookie sessions (local)
   - JWT tokens (Supabase)

2. **Profile Management**
   - Comprehensive demographics (name, DOB, contact)
   - Full address information
   - Emergency contact details
   - Legacy planning (special instructions, executor info)
   - Avatar upload with preview
   - Multi-language support (EN, ES, PT)

3. **Asset Management**
   - CRUD operations for assets
   - Multiple asset types (financial, property, digital)
   - Beneficiary assignment
   - Document attachments
   - Subscription tier restrictions

4. **Beneficiary Management**
   - CRUD operations
   - Contact information
   - Asset assignment
   - Tier-based limits

5. **Document Management**
   - File upload (PDFs, images)
   - Persistent storage (Docker volume)
   - View/download functionality
   - Deletion with file cleanup
   - Pro/Premium tier requirement

6. **AI Chat System**
   - Local LLM via Ollama (qwen3 model)
   - Cloud option via Google Gemini
   - Markdown rendering with syntax highlighting
   - Provider switching
   - No backend dependency (direct frontend-to-Ollama)

7. **Subscription System**
   - Three tiers: Free, Pro, Premium
   - Feature restrictions by tier
   - Debug mode for testing
   - Stripe integration (prepared, not active)

8. **Development Environment**
   - Docker Compose full stack
   - Hot reload (frontend + backend)
   - PostgreSQL database
   - PgAdmin for database management
   - Ollama for local AI
   - Persistent data volumes

## Next Steps (Development Roadmap)

### Phase 1: Critical Fixes ✅ COMPLETED
- [x] Add testing infrastructure (Vitest + React Testing Library)
- [x] Implement error boundaries
- [x] Add input validation schemas (Zod)
- [x] Standardize API responses
- [x] Chat system with local LLM (Ollama + qwen3)
- [x] Profile system expansion (demographics, legacy planning)
- [x] File storage and document upload
- [x] Avatar upload and rendering
- [x] Hot reload development environment

### Phase 2: Subscription & Payments ✅ IN PROGRESS
- [x] Subscription tier enforcement (Free/Pro/Premium)
- [x] Debug mode for testing subscriptions
- [ ] Stripe payment integration (production)
- [ ] Subscription upgrade/downgrade flow
- [ ] Payment webhook handling

### Phase 3: Performance (Next)
- [ ] Add React.memo and useMemo optimizations
- [ ] Implement code splitting with React.lazy()
- [ ] Add skeleton loading components
- [ ] Bundle analysis and optimization
- [ ] Image optimization for avatars
- [ ] Lazy loading for document lists

### Phase 4: Developer Experience (Next)
- [ ] Enhanced ESLint configuration
- [ ] Pre-commit hooks (Husky + lint-staged)
- [ ] Improved TypeScript configuration
- [ ] Environment configuration management
- [ ] API documentation (Swagger/OpenAPI)
- [ ] E2E testing (Playwright/Cypress)

### Phase 5: Advanced Features (Future)
- [ ] Real-time notifications (WebSocket/Server-Sent Events)
- [ ] Advanced analytics and reporting
- [ ] Mobile app (React Native)
- [ ] Beneficiary portal (view-only access)
- [ ] Document OCR for automatic asset extraction
- [ ] Will generation from profile data
- [ ] Multi-factor authentication (2FA)
- [ ] Audit logging for sensitive operations

---

## Additional Documentation

This repository contains several other documentation files with more detailed information:

### Setup & Workflow
- **`setup-dev.md`** - Initial development environment setup guide
- **`DEV-WORKFLOW.md`** - Daily development workflow, hot reload, Docker commands
- **`.env.example`** - Environment variable template

### Recent Changes & Fixes
- **`CHAT-FIX.md`** - Chat system fixes and Ollama integration details
- **`FIXES-SUMMARY.md`** - Document upload, avatar upload, and field transformation fixes
- **`PROFILE-UPGRADE.md`** - Profile system expansion with demographics and legacy planning

### Frontend Documentation
- **`docs/`** - Additional documentation (if present)

### Backend Documentation
- **`server/README.md`** - Backend-specific documentation (if present)
- **`server/prisma/schema.prisma`** - Database schema with comments

### Infrastructure
- **`docker-compose.yml`** - Full Docker stack configuration
- **`Dockerfile`** - Frontend container configuration
- **`server/Dockerfile`** - Backend container configuration
- **`.dockerignore`** - Docker build exclusions

---

**Last Updated**: January 2026

**Version**: 1.0.0

**Maintainers**: Refer to package.json and git history for current maintainers

For questions or issues, refer to the documentation files above or check the git commit history for recent changes.