# Modern Asset Management Application Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Component Documentation](#component-documentation)
4. [Database Schema](#database-schema)
5. [Security Implementation](#security-implementation)
6. [API Documentation](#api-documentation)

## Architecture Overview

### Frontend Architecture
- **React + TypeScript**: Core UI framework with type safety
- **Vite**: Build tool and development server
- **Tailwind CSS**: Utility-first styling
- **Component Structure**: Modular, reusable components
- **State Management**: React hooks and context
- **Form Handling**: Controlled components with validation

### Backend Architecture
- **Supabase**: Backend as a Service (BaaS)
  - Authentication
  - Database
  - Real-time subscriptions
  - Row Level Security (RLS)

### Security Architecture
- End-to-end encryption
- Row Level Security (RLS) policies
- JWT-based authentication
- Secure environment variable handling

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── assets/         # Asset-related components
│   └── ui/             # Generic UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
├── types/              # TypeScript type definitions
└── services/           # External service integrations
```

## Component Documentation

### UI Components

#### Button (`components/ui/Button.tsx`)
A reusable button component with multiple variants and sizes.

Props:
- `variant`: 'primary' | 'secondary' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- All standard button HTML attributes

#### AssetList (`components/assets/AssetList.tsx`)
Displays a list of assets in a table format.

Props:
- `assets`: Asset[]
- `onEdit`: (asset: Asset) => void
- `onDelete`: (asset: Asset) => void
- `onAdd`: () => void

#### AssetForm (`components/assets/AssetForm.tsx`)
Form for creating and editing assets.

Props:
- `asset?: Asset`
- `onSubmit`: (data: Partial<Asset>) => Promise<void>
- `onCancel`: () => void

### Custom Hooks

#### useAssets (`hooks/useAssets.ts`)
Manages asset CRUD operations with Supabase.

Returns:
- `assets`: Asset[]
- `loading`: boolean
- `error`: Error | null
- `createAsset`: (asset: Partial<Asset>) => Promise<Asset>
- `updateAsset`: (id: string, asset: Partial<Asset>) => Promise<Asset>
- `deleteAsset`: (id: string) => Promise<void>
- `refresh`: () => Promise<void>

## Database Schema

### Assets Table
```sql
CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  description text,
  estimated_value decimal(15,2),
  location text,
  acquisition_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Security Implementation

### Row Level Security (RLS)
All tables are protected with RLS policies ensuring users can only access their own data:

```sql
CREATE POLICY "Users can manage own assets"
  ON assets FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);
```

### Authentication Flow
1. User signs up/logs in
2. JWT token received and stored
3. Token used for subsequent API calls
4. Automatic token refresh handling

## API Documentation

### Asset Management API

#### Create Asset
```typescript
const { data, error } = await supabase
  .from('assets')
  .insert([asset])
  .select()
  .single();
```

#### Read Assets
```typescript
const { data, error } = await supabase
  .from('assets')
  .select('*')
  .order('created_at', { ascending: false });
```

#### Update Asset
```typescript
const { data, error } = await supabase
  .from('assets')
  .update(asset)
  .eq('id', id)
  .select()
  .single();
```

#### Delete Asset
```typescript
const { error } = await supabase
  .from('assets')
  .delete()
  .eq('id', id);
```

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React hooks best practices
- Implement proper error handling
- Write meaningful component documentation
- Use consistent naming conventions

### Testing Strategy
- Unit tests for utility functions
- Component tests with React Testing Library
- Integration tests for critical user flows
- E2E tests for core functionality

### Performance Optimization
- Implement code splitting
- Use proper React memo and callbacks
- Optimize bundle size
- Implement proper loading states

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
```

### Production Deployment
Deployed via Netlify with:
- Automatic HTTPS
- CDN distribution
- Continuous deployment from main branch