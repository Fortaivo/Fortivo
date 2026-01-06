import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { json } from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const COOKIE_NAME = 'fortaivo_token';
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');

const app = express();
const prisma = new PrismaClient();

// Ensure upload directories exist
await fs.mkdir(path.join(UPLOAD_DIR, 'avatars'), { recursive: true });
await fs.mkdir(path.join(UPLOAD_DIR, 'documents'), { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadType = (req as any).uploadType || 'documents';
    const dest = path.join(UPLOAD_DIR, uploadType);
    await fs.mkdir(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const uploadType = (req as any).uploadType;
    if (uploadType === 'avatars') {
      // Only allow images for avatars
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed for avatars'));
      }
    }
    cb(null, true);
  }
});

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(json({ limit: '10mb' }));
app.use(cookieParser());

// Serve uploaded files
app.use('/uploads', express.static(UPLOAD_DIR));

function signJwt(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies[COOKIE_NAME] || (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'unauthorized' });
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    (req as any).userId = decoded.sub;
    return next();
  } catch {
    return res.status(401).json({ error: 'unauthorized' });
  }
}

// Subscription limits configuration
const SUBSCRIPTION_LIMITS = {
  free: {
    maxAssets: 20,
    maxBeneficiaries: 10,
    allowDocuments: false,
  },
  pro: {
    maxAssets: Infinity,
    maxBeneficiaries: 50,
    allowDocuments: true,
  },
  premium: {
    maxAssets: Infinity,
    maxBeneficiaries: Infinity,
    allowDocuments: true,
  },
};

async function getUserTier(userId: string): Promise<'free' | 'pro' | 'premium'> {
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: 'active' },
    orderBy: { createdAt: 'desc' },
  });
  return subscription?.tier || 'free';
}

async function checkAssetLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId as string;
    const tier = await getUserTier(userId);
    const limits = SUBSCRIPTION_LIMITS[tier];

    const assetCount = await prisma.asset.count({ where: { userId } });

    if (assetCount >= limits.maxAssets) {
      return res.status(403).json({
        error: 'asset_limit_reached',
        message: `Your ${tier} plan allows a maximum of ${limits.maxAssets} assets. Please upgrade to add more.`,
      });
    }

    return next();
  } catch (err) {
    console.error('Asset limit check error:', err);
    return res.status(500).json({ error: 'failed_to_check_limits' });
  }
}

async function checkBeneficiaryLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId as string;
    const tier = await getUserTier(userId);
    const limits = SUBSCRIPTION_LIMITS[tier];

    const beneficiaryCount = await prisma.beneficiary.count({ where: { userId } });

    if (beneficiaryCount >= limits.maxBeneficiaries) {
      return res.status(403).json({
        error: 'beneficiary_limit_reached',
        message: `Your ${tier} plan allows a maximum of ${limits.maxBeneficiaries} beneficiaries. Please upgrade to add more.`,
      });
    }

    return next();
  } catch (err) {
    console.error('Beneficiary limit check error:', err);
    return res.status(500).json({ error: 'failed_to_check_limits' });
  }
}

async function checkDocumentPermission(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId as string;
    const tier = await getUserTier(userId);
    const limits = SUBSCRIPTION_LIMITS[tier];

    if (!limits.allowDocuments) {
      return res.status(403).json({
        error: 'documents_not_allowed',
        message: `Document uploads are not available on the ${tier} plan. Please upgrade to Pro or Premium.`,
      });
    }

    return next();
  } catch (err) {
    console.error('Document permission check error:', err);
    return res.status(500).json({ error: 'failed_to_check_permissions' });
  }
}

// Auth endpoints
app.post('/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'user_exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hash } });
    await prisma.profile.create({ data: { userId: user.id, subscriptionTier: 'free' } });
    const token = signJwt({ sub: user.id });
    res.cookie(COOKIE_NAME, token, { 
      httpOnly: true, 
      sameSite: 'lax',
      secure: false, // Set to true in production with HTTPS
      // Remove domain for localhost development
    });
    res.status(201).json({ id: user.id, email: user.email });
  } catch (e) {
    res.status(500).json({ error: 'signup_failed' });
  }
});

app.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'invalid_credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });
    const token = signJwt({ sub: user.id });
    res.cookie(COOKIE_NAME, token, { 
      httpOnly: true, 
      sameSite: 'lax',
      secure: false, // Set to true in production with HTTPS
      // Remove domain for localhost development
    });
    res.json({ id: user.id, email: user.email });
  } catch (e) {
    res.status(500).json({ error: 'login_failed' });
  }
});

app.post('/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME);
  res.status(204).send();
});

app.get('/auth/me', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  res.json(user);
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Dev bootstrap: ensure a user exists when running locally so frontend can send x-user-id
app.post('/dev/bootstrap', async (_req: Request, res: Response) => {
  try {
    const email = 'dev@example.com';
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const hash = await bcrypt.hash('dev', 10);
      user = await prisma.user.create({ data: { email, password: hash } });
      await prisma.profile.create({ data: { userId: user.id, subscriptionTier: 'free' } });
    }
    res.json({ userId: user.id, email: user.email });
  } catch (e) {
    res.status(500).json({ error: 'bootstrap_failed' });
  }
});

app.get('/api/assets', requireAuth, async (req: Request, res: Response) => {
  try {
    // TODO: derive userId from auth middleware
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const assets = await prisma.asset.findMany({
      where: { userId },
      include: { beneficiary: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(assets);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_list_assets' });
  }
});

app.post('/api/assets', requireAuth, checkAssetLimit, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const payload = req.body ?? {};
    const created = await prisma.asset.create({
      data: {
        userId,
        name: payload.name,
        type: payload.type,
        description: payload.description ?? null,
        estimatedValue: payload.estimated_value ?? null,
        beneficiaryId: payload.beneficiary_id ?? null,
        location: payload.location ?? null,
        acquisitionDate: payload.acquisition_date ? new Date(payload.acquisition_date) : null,
      },
      include: { beneficiary: { select: { id: true, fullName: true } } }
    });
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_create_asset' });
  }
});

app.patch('/api/assets/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const id = req.params.id;
    const payload = req.body ?? {};
    const updated = await prisma.asset.update({
      where: { id },
      data: {
        name: payload.name,
        type: payload.type,
        description: payload.description ?? null,
        estimatedValue: payload.estimated_value ?? payload.estimatedValue ?? null,
        beneficiaryId: payload.beneficiary_id ?? payload.beneficiaryId ?? null,
        location: payload.location ?? null,
        acquisitionDate: payload.acquisition_date ? new Date(payload.acquisition_date) : null,
      },
      include: { beneficiary: { select: { id: true, fullName: true } } }
    });
    if (updated.userId !== userId) return res.status(403).json({ error: 'forbidden' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_update_asset' });
  }
});

app.delete('/api/assets/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const id = req.params.id;
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset || asset.userId !== userId) return res.status(404).json({ error: 'not_found' });
    await prisma.assetDocument.deleteMany({ where: { assetId: id } });
    await prisma.asset.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'failed_to_delete_asset' });
  }
});

// Profile endpoints
app.get('/api/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const profile = await prisma.profile.findUnique({
      where: { userId }
    });

    if (!profile) return res.status(404).json({ error: 'profile_not_found' });

    // Transform to match frontend Profile type (snake_case)
    res.json({
      id: profile.id,
      // Basic Information
      full_name: profile.fullName,
      date_of_birth: profile.dateOfBirth?.toISOString() || null,
      avatar_url: profile.avatarUrl,
      // Contact Information
      phone_number: profile.phoneNumber,
      email: profile.email,
      // Address
      street_address: profile.streetAddress,
      city: profile.city,
      state: profile.state,
      zip_code: profile.zipCode,
      country: profile.country,
      // Emergency Contact
      emergency_contact_name: profile.emergencyContactName,
      emergency_contact_phone: profile.emergencyContactPhone,
      emergency_contact_relationship: profile.emergencyContactRelationship,
      // Legacy Planning
      special_instructions: profile.specialInstructions,
      executor_name: profile.executorName,
      executor_phone: profile.executorPhone,
      executor_email: profile.executorEmail,
      // System
      subscription_tier: profile.subscriptionTier,
      created_at: profile.createdAt.toISOString(),
      updated_at: profile.updatedAt.toISOString()
    });
  } catch (e) {
    console.error('Profile fetch error:', e);
    res.status(500).json({ error: 'failed_to_fetch_profile' });
  }
});

app.patch('/api/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const payload = req.body ?? {};

    // Build update data object, transforming snake_case to camelCase
    const updateData: any = {};

    // Basic Information
    if (payload.full_name !== undefined) updateData.fullName = payload.full_name;
    if (payload.date_of_birth !== undefined) updateData.dateOfBirth = payload.date_of_birth ? new Date(payload.date_of_birth) : null;
    if (payload.avatar_url !== undefined) updateData.avatarUrl = payload.avatar_url;

    // Contact Information
    if (payload.phone_number !== undefined) updateData.phoneNumber = payload.phone_number;
    if (payload.email !== undefined) updateData.email = payload.email;

    // Address
    if (payload.street_address !== undefined) updateData.streetAddress = payload.street_address;
    if (payload.city !== undefined) updateData.city = payload.city;
    if (payload.state !== undefined) updateData.state = payload.state;
    if (payload.zip_code !== undefined) updateData.zipCode = payload.zip_code;
    if (payload.country !== undefined) updateData.country = payload.country;

    // Emergency Contact
    if (payload.emergency_contact_name !== undefined) updateData.emergencyContactName = payload.emergency_contact_name;
    if (payload.emergency_contact_phone !== undefined) updateData.emergencyContactPhone = payload.emergency_contact_phone;
    if (payload.emergency_contact_relationship !== undefined) updateData.emergencyContactRelationship = payload.emergency_contact_relationship;

    // Legacy Planning
    if (payload.special_instructions !== undefined) updateData.specialInstructions = payload.special_instructions;
    if (payload.executor_name !== undefined) updateData.executorName = payload.executor_name;
    if (payload.executor_phone !== undefined) updateData.executorPhone = payload.executor_phone;
    if (payload.executor_email !== undefined) updateData.executorEmail = payload.executor_email;

    // System (subscription tier should not be updated here, use subscription endpoint)

    const updated = await prisma.profile.update({
      where: { userId },
      data: updateData
    });

    // Transform back to snake_case for frontend
    res.json({
      id: updated.id,
      full_name: updated.fullName,
      date_of_birth: updated.dateOfBirth?.toISOString() || null,
      avatar_url: updated.avatarUrl,
      phone_number: updated.phoneNumber,
      email: updated.email,
      street_address: updated.streetAddress,
      city: updated.city,
      state: updated.state,
      zip_code: updated.zipCode,
      country: updated.country,
      emergency_contact_name: updated.emergencyContactName,
      emergency_contact_phone: updated.emergencyContactPhone,
      emergency_contact_relationship: updated.emergencyContactRelationship,
      special_instructions: updated.specialInstructions,
      executor_name: updated.executorName,
      executor_phone: updated.executorPhone,
      executor_email: updated.executorEmail,
      subscription_tier: updated.subscriptionTier,
      created_at: updated.createdAt.toISOString(),
      updated_at: updated.updatedAt.toISOString()
    });
  } catch (e) {
    console.error('Profile update error:', e);
    res.status(500).json({ error: 'failed_to_update_profile' });
  }
});

// Beneficiaries
app.get('/api/beneficiaries', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const rows = await prisma.beneficiary.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_list_beneficiaries' });
  }
});

app.post('/api/beneficiaries', requireAuth, checkBeneficiaryLimit, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const payload = req.body ?? {};
    const created = await prisma.beneficiary.create({
      data: {
        userId,
        fullName: payload.full_name ?? payload.fullName,
        relationship: payload.relationship ?? null,
        contactEmail: payload.contact_email ?? payload.contactEmail ?? null,
        contactPhone: payload.contact_phone ?? payload.contactPhone ?? null,
      }
    });
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_create_beneficiary' });
  }
});

app.patch('/api/beneficiaries/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const id = req.params.id;
    const payload = req.body ?? {};
    const existing = await prisma.beneficiary.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) return res.status(404).json({ error: 'not_found' });
    const updated = await prisma.beneficiary.update({
      where: { id },
      data: {
        fullName: payload.full_name ?? payload.fullName ?? existing.fullName,
        relationship: payload.relationship ?? existing.relationship,
        contactEmail: payload.contact_email ?? payload.contactEmail ?? existing.contactEmail,
        contactPhone: payload.contact_phone ?? payload.contactPhone ?? existing.contactPhone,
      }
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_update_beneficiary' });
  }
});

app.delete('/api/beneficiaries/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const id = req.params.id;
    const existing = await prisma.beneficiary.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) return res.status(404).json({ error: 'not_found' });
    await prisma.beneficiary.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'failed_to_delete_beneficiary' });
  }
});

// File upload endpoints

// Upload avatar
app.post('/api/profile/avatar', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  (req as any).uploadType = 'avatars';
  next();
}, upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    if (!req.file) return res.status(400).json({ error: 'no_file_uploaded' });

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update profile with new avatar URL
    const updated = await prisma.profile.update({
      where: { userId },
      data: { avatarUrl },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        subscriptionTier: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      avatar_url: avatarUrl,
      profile: {
        id: updated.id,
        full_name: updated.fullName,
        avatar_url: updated.avatarUrl,
        subscription_tier: updated.subscriptionTier,
        created_at: updated.createdAt.toISOString(),
        updated_at: updated.updatedAt.toISOString()
      }
    });
  } catch (e) {
    console.error('Avatar upload error:', e);
    res.status(500).json({ error: 'failed_to_upload_avatar' });
  }
});

// Asset documents endpoints
app.get('/api/assets/:assetId/documents', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const assetId = req.params.assetId;

    // Verify asset ownership
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || asset.userId !== userId) return res.status(404).json({ error: 'asset_not_found' });

    const documents = await prisma.assetDocument.findMany({
      where: { assetId },
      orderBy: { uploadedAt: 'desc' }
    });

    // Transform to snake_case for frontend
    const transformedDocs = documents.map(doc => ({
      id: doc.id,
      asset_id: doc.assetId,
      name: doc.name,
      file_path: doc.filePath,
      file_type: doc.fileType,
      file_size: doc.fileSize,
      uploaded_at: doc.uploadedAt.toISOString(),
    }));

    res.json(transformedDocs);
  } catch (e) {
    console.error('Fetch documents error:', e);
    res.status(500).json({ error: 'failed_to_fetch_documents' });
  }
});

app.post('/api/assets/:assetId/documents', requireAuth, checkDocumentPermission, async (req: Request, res: Response, next: NextFunction) => {
  (req as any).uploadType = 'documents';
  next();
}, upload.single('document'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const assetId = req.params.assetId;

    // Verify asset ownership
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || asset.userId !== userId) return res.status(404).json({ error: 'asset_not_found' });

    if (!req.file) return res.status(400).json({ error: 'no_file_uploaded' });

    const filePath = `/uploads/documents/${req.file.filename}`;
    const name = req.body.name || req.file.originalname;

    // Determine file type
    let fileType: 'image' | 'pdf' | 'document' = 'document';
    if (req.file.mimetype.startsWith('image/')) fileType = 'image';
    else if (req.file.mimetype === 'application/pdf') fileType = 'pdf';

    const document = await prisma.assetDocument.create({
      data: {
        assetId,
        name,
        filePath,
        fileType,
        fileSize: req.file.size,
      }
    });

    // Transform to snake_case for frontend
    res.status(201).json({
      id: document.id,
      asset_id: document.assetId,
      name: document.name,
      file_path: document.filePath,
      file_type: document.fileType,
      file_size: document.fileSize,
      uploaded_at: document.uploadedAt.toISOString(),
    });
  } catch (e) {
    console.error('Document upload error:', e);
    res.status(500).json({ error: 'failed_to_upload_document' });
  }
});

app.delete('/api/assets/:assetId/documents/:documentId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const { assetId, documentId } = req.params;

    // Verify asset ownership
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || asset.userId !== userId) return res.status(404).json({ error: 'asset_not_found' });

    // Get document to delete file
    const document = await prisma.assetDocument.findUnique({ where: { id: documentId } });
    if (!document || document.assetId !== assetId) return res.status(404).json({ error: 'document_not_found' });

    // Delete file from disk
    const fullPath = path.join(UPLOAD_DIR, document.filePath.replace('/uploads/', ''));
    try {
      await fs.unlink(fullPath);
    } catch (err) {
      console.error('Failed to delete file:', err);
      // Continue anyway - file might not exist
    }

    // Delete document record
    await prisma.assetDocument.delete({ where: { id: documentId } });

    res.status(204).send();
  } catch (e) {
    console.error('Delete document error:', e);
    res.status(500).json({ error: 'failed_to_delete_document' });
  }
});

// Subscription endpoints for local mode
app.get('/api/subscriptions', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Transform to snake_case for frontend
    const transformed = subscriptions.map(sub => ({
      id: sub.id,
      user_id: sub.userId,
      tier: sub.tier,
      status: sub.status,
      current_period_start: sub.currentPeriodStart.toISOString(),
      current_period_end: sub.currentPeriodEnd.toISOString(),
      created_at: sub.createdAt.toISOString(),
      updated_at: sub.updatedAt.toISOString(),
    }));

    res.json(transformed);
  } catch (e) {
    console.error('Fetch subscriptions error:', e);
    res.status(500).json({ error: 'failed_to_fetch_subscriptions' });
  }
});

app.post('/api/subscriptions', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const { tier } = req.body;
    if (!tier || !['free', 'pro', 'premium'].includes(tier)) {
      return res.status(400).json({ error: 'invalid_tier' });
    }

    const now = new Date();
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 100);

    // Deactivate existing subscriptions
    await prisma.subscription.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'canceled' }
    });

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        tier,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: farFuture,
      }
    });

    // Transform to snake_case for frontend
    res.status(201).json({
      id: subscription.id,
      user_id: subscription.userId,
      tier: subscription.tier,
      status: subscription.status,
      current_period_start: subscription.currentPeriodStart.toISOString(),
      current_period_end: subscription.currentPeriodEnd.toISOString(),
      created_at: subscription.createdAt.toISOString(),
      updated_at: subscription.updatedAt.toISOString(),
    });
  } catch (e) {
    console.error('Create subscription error:', e);
    res.status(500).json({ error: 'failed_to_create_subscription' });
  }
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
   
  console.log(`API listening on :${port}`);
});


