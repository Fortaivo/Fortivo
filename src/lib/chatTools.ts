// Enhanced agentic tools for Fortivo chatbot
import { apiGet, apiPost, apiPatch, apiDelete, API_BASE_URL } from './api';
import { Asset, Beneficiary, Profile } from '../types/database';

export interface ToolResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (params: any) => Promise<ToolResult>;
}

// Asset Management Tools
export const assetTools: Tool[] = [
  {
    name: 'list_assets',
    description: 'List all assets for the current user',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async (): Promise<ToolResult> => {
      try {
        const assets = await apiGet<Asset[]>('/api/assets');
        const summary = assets.map(asset => ({
          name: asset.name,
          type: asset.type,
          value: asset.estimated_value ? `$${asset.estimated_value.toLocaleString()}` : 'Not specified',
          beneficiary: asset.beneficiary?.full_name || 'No beneficiary assigned'
        }));
        
        return {
          success: true,
          message: `Found ${assets.length} assets in your portfolio`,
          data: { assets: summary, total: assets.length }
        };
      } catch (error) {
        return {
          success: false,
          message: 'Failed to retrieve assets',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  },
  
  {
    name: 'create_asset',
    description: 'Create a new asset in the portfolio',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the asset' },
        type: { type: 'string', enum: ['financial', 'physical', 'digital', 'other'], description: 'Type of asset' },
        description: { type: 'string', description: 'Description of the asset' },
        estimated_value: { type: 'number', description: 'Estimated value in dollars' },
        location: { type: 'string', description: 'Location of the asset' },
        beneficiary_id: { type: 'string', description: 'ID of beneficiary to assign' }
      },
      required: ['name', 'type']
    },
    execute: async (params): Promise<ToolResult> => {
      try {
        const asset = await apiPost<Asset>('/api/assets', {
          name: params.name,
          type: params.type,
          description: params.description,
          estimated_value: params.estimated_value,
          location: params.location,
          beneficiary_id: params.beneficiary_id
        });
        
        return {
          success: true,
          message: `Successfully created asset "${params.name}" with type "${params.type}"`,
          data: { asset }
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to create asset "${params.name}"`,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  },

  {
    name: 'update_asset',
    description: 'Update an existing asset',
    parameters: {
      type: 'object',
      properties: {
        asset_name: { type: 'string', description: 'Name of the asset to update' },
        updates: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['financial', 'physical', 'digital', 'other'] },
            description: { type: 'string' },
            estimated_value: { type: 'number' },
            location: { type: 'string' },
            beneficiary_id: { type: 'string' }
          }
        }
      },
      required: ['asset_name', 'updates']
    },
    execute: async (params): Promise<ToolResult> => {
      try {
        // First find the asset
        const assets = await apiGet<Asset[]>('/api/assets');
        const asset = assets.find(a => a.name.toLowerCase().includes(params.asset_name.toLowerCase()));
        
        if (!asset) {
          return {
            success: false,
            message: `Asset "${params.asset_name}" not found. Available assets: ${assets.map(a => a.name).join(', ')}`
          };
        }

        const updated = await apiPatch<Asset>(`/api/assets/${asset.id}`, params.updates);
        
        return {
          success: true,
          message: `Successfully updated asset "${asset.name}"`,
          data: { asset: updated }
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to update asset "${params.asset_name}"`,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  },

  {
    name: 'delete_asset',
    description: 'Delete an asset from the portfolio',
    parameters: {
      type: 'object',
      properties: {
        asset_name: { type: 'string', description: 'Name of the asset to delete' }
      },
      required: ['asset_name']
    },
    execute: async (params): Promise<ToolResult> => {
      try {
        const assets = await apiGet<Asset[]>('/api/assets');
        const asset = assets.find(a => a.name.toLowerCase().includes(params.asset_name.toLowerCase()));
        
        if (!asset) {
          return {
            success: false,
            message: `Asset "${params.asset_name}" not found. Available assets: ${assets.map(a => a.name).join(', ')}`
          };
        }

        await apiDelete(`/api/assets/${asset.id}`);
        
        return {
          success: true,
          message: `Successfully deleted asset "${asset.name}"`
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to delete asset "${params.asset_name}"`,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  }
];

// Beneficiary Management Tools
export const beneficiaryTools: Tool[] = [
  {
    name: 'list_beneficiaries',
    description: 'List all beneficiaries for the current user',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async (): Promise<ToolResult> => {
      try {
        const beneficiaries = await apiGet<Beneficiary[]>('/api/beneficiaries');
        const summary = beneficiaries.map(beneficiary => ({
          name: beneficiary.full_name,
          relationship: beneficiary.relationship || 'Not specified',
          email: beneficiary.contact_email || 'Not provided',
          phone: beneficiary.contact_phone || 'Not provided'
        }));
        
        return {
          success: true,
          message: `Found ${beneficiaries.length} beneficiaries`,
          data: { beneficiaries: summary, total: beneficiaries.length }
        };
      } catch (error) {
        return {
          success: false,
          message: 'Failed to retrieve beneficiaries',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  },

  {
    name: 'create_beneficiary',
    description: 'Create a new beneficiary',
    parameters: {
      type: 'object',
      properties: {
        full_name: { type: 'string', description: 'Full name of the beneficiary' },
        relationship: { type: 'string', description: 'Relationship to you' },
        contact_email: { type: 'string', description: 'Email address' },
        contact_phone: { type: 'string', description: 'Phone number' }
      },
      required: ['full_name']
    },
    execute: async (params): Promise<ToolResult> => {
      try {
        const beneficiary = await apiPost<Beneficiary>('/api/beneficiaries', {
          full_name: params.full_name,
          relationship: params.relationship,
          contact_email: params.contact_email,
          contact_phone: params.contact_phone
        });
        
        return {
          success: true,
          message: `Successfully created beneficiary "${params.full_name}"`,
          data: { beneficiary }
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to create beneficiary "${params.full_name}"`,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  },

  {
    name: 'update_beneficiary',
    description: 'Update an existing beneficiary',
    parameters: {
      type: 'object',
      properties: {
        beneficiary_name: { type: 'string', description: 'Name of the beneficiary to update' },
        updates: {
          type: 'object',
          properties: {
            full_name: { type: 'string' },
            relationship: { type: 'string' },
            contact_email: { type: 'string' },
            contact_phone: { type: 'string' }
          }
        }
      },
      required: ['beneficiary_name', 'updates']
    },
    execute: async (params): Promise<ToolResult> => {
      try {
        const beneficiaries = await apiGet<Beneficiary[]>('/api/beneficiaries');
        const beneficiary = beneficiaries.find(b => 
          b.full_name.toLowerCase().includes(params.beneficiary_name.toLowerCase())
        );
        
        if (!beneficiary) {
          return {
            success: false,
            message: `Beneficiary "${params.beneficiary_name}" not found. Available beneficiaries: ${beneficiaries.map(b => b.full_name).join(', ')}`
          };
        }

        const updated = await apiPatch<Beneficiary>(`/api/beneficiaries/${beneficiary.id}`, params.updates);
        
        return {
          success: true,
          message: `Successfully updated beneficiary "${beneficiary.full_name}"`,
          data: { beneficiary: updated }
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to update beneficiary "${params.beneficiary_name}"`,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  },

  {
    name: 'delete_beneficiary',
    description: 'Delete a beneficiary',
    parameters: {
      type: 'object',
      properties: {
        beneficiary_name: { type: 'string', description: 'Name of the beneficiary to delete' }
      },
      required: ['beneficiary_name']
    },
    execute: async (params): Promise<ToolResult> => {
      try {
        const beneficiaries = await apiGet<Beneficiary[]>('/api/beneficiaries');
        const beneficiary = beneficiaries.find(b => 
          b.full_name.toLowerCase().includes(params.beneficiary_name.toLowerCase())
        );
        
        if (!beneficiary) {
          return {
            success: false,
            message: `Beneficiary "${params.beneficiary_name}" not found. Available beneficiaries: ${beneficiaries.map(b => b.full_name).join(', ')}`
          };
        }

        await apiDelete(`/api/beneficiaries/${beneficiary.id}`);
        
        return {
          success: true,
          message: `Successfully deleted beneficiary "${beneficiary.full_name}"`
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to delete beneficiary "${params.beneficiary_name}"`,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  }
];

// Portfolio Analytics Tools
export const analyticsTools: Tool[] = [
  {
    name: 'portfolio_summary',
    description: 'Get a comprehensive summary of the user\'s portfolio',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async (): Promise<ToolResult> => {
      try {
        const [assets, beneficiaries] = await Promise.all([
          apiGet<Asset[]>('/api/assets'),
          apiGet<Beneficiary[]>('/api/beneficiaries')
        ]);

        const totalValue = assets.reduce((sum, asset) => sum + (asset.estimated_value || 0), 0);
        const assetsByType = assets.reduce((acc, asset) => {
          acc[asset.type] = (acc[asset.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const assignedAssets = assets.filter(a => a.beneficiary_id).length;
        const unassignedAssets = assets.length - assignedAssets;

        return {
          success: true,
          message: 'Portfolio summary generated successfully',
          data: {
            totalAssets: assets.length,
            totalValue: totalValue,
            formattedValue: `$${totalValue.toLocaleString()}`,
            assetsByType,
            totalBeneficiaries: beneficiaries.length,
            assignedAssets,
            unassignedAssets,
            assignmentRate: assets.length > 0 ? `${Math.round((assignedAssets / assets.length) * 100)}%` : '0%'
          }
        };
      } catch (error) {
        return {
          success: false,
          message: 'Failed to generate portfolio summary',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  },

  {
    name: 'asset_assignment_status',
    description: 'Check which assets are assigned to beneficiaries and which are not',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async (): Promise<ToolResult> => {
      try {
        const assets = await apiGet<Asset[]>('/api/assets');
        
        const assigned = assets.filter(a => a.beneficiary_id).map(a => ({
          asset: a.name,
          beneficiary: a.beneficiary?.full_name,
          type: a.type,
          value: a.estimated_value ? `$${a.estimated_value.toLocaleString()}` : 'Not specified'
        }));

        const unassigned = assets.filter(a => !a.beneficiary_id).map(a => ({
          asset: a.name,
          type: a.type,
          value: a.estimated_value ? `$${a.estimated_value.toLocaleString()}` : 'Not specified'
        }));

        return {
          success: true,
          message: `Asset assignment status: ${assigned.length} assigned, ${unassigned.length} unassigned`,
          data: { assigned, unassigned }
        };
      } catch (error) {
        return {
          success: false,
          message: 'Failed to check asset assignment status',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  }
];

// Profile Management Tools
export const profileTools: Tool[] = [
  {
    name: 'get_profile',
    description: 'Get user profile information',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async (): Promise<ToolResult> => {
      try {
        const profile = await apiGet<Profile>('/api/profile');
        
        return {
          success: true,
          message: 'Profile information retrieved',
          data: {
            name: profile.full_name || 'Not set',
            subscriptionTier: profile.subscription_tier,
            memberSince: new Date(profile.created_at).toLocaleDateString()
          }
        };
      } catch (error) {
        return {
          success: false,
          message: 'Failed to retrieve profile information',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  }
];

// All tools combined
export const ALL_TOOLS = [
  ...assetTools,
  ...beneficiaryTools,
  ...analyticsTools,
  ...profileTools
];

// Tool execution helper
export async function executeTool(toolName: string, params: any): Promise<ToolResult> {
  const tool = ALL_TOOLS.find(t => t.name === toolName);
  if (!tool) {
    return {
      success: false,
      message: `Tool "${toolName}" not found`,
      error: 'Tool not found'
    };
  }

  try {
    return await tool.execute(params);
  } catch (error) {
    return {
      success: false,
      message: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get available tools description for LLM context
export function getToolsContext(): string {
  return `Available tools for Fortivo portfolio management:

ASSET MANAGEMENT:
- list_assets(): Get all assets in portfolio
- create_asset(name, type, description?, estimated_value?, location?, beneficiary_id?): Create new asset
- update_asset(asset_name, updates): Update existing asset
- delete_asset(asset_name): Remove asset from portfolio

BENEFICIARY MANAGEMENT:
- list_beneficiaries(): Get all beneficiaries
- create_beneficiary(full_name, relationship?, contact_email?, contact_phone?): Add new beneficiary
- update_beneficiary(beneficiary_name, updates): Update beneficiary info
- delete_beneficiary(beneficiary_name): Remove beneficiary

PORTFOLIO ANALYTICS:
- portfolio_summary(): Comprehensive portfolio overview with statistics
- asset_assignment_status(): Check which assets are assigned to beneficiaries

PROFILE MANAGEMENT:
- get_profile(): Get user profile and subscription information

Asset types: financial, physical, digital, other

Use these tools to help users manage their assets, beneficiaries, and get insights into their portfolio. Always confirm before making destructive changes (deletions).`;
}