import type { Asset, Beneficiary } from '../types/database';
import { supabase } from './supabase';
import { parseAssetDescription } from './assetParser';

type CommandResult = {
  success: boolean;
  message: string;
};

export async function executeCommand(command: string): Promise<CommandResult> {
  const parts = command.toLowerCase().split(' ');
  const action = parts[0];
  const type = parts[1];
  const description = parts.slice(2).join(' ').trim();

  try {
    switch (`${action} ${type}`) {
      case 'add asset':
        return await addAsset(description);
      case 'remove asset':
        return await removeAsset(description);
      case 'add beneficiary':
        return await addBeneficiary(description);
      case 'remove beneficiary':
        return await removeBeneficiary(description);
      default:
        return {
          success: false,
          message: 'Unknown command. Available commands:\n- add asset [name]\n- remove asset [name]\n- add beneficiary [name]\n- remove beneficiary [name]'
        };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred'
    };
  }
}

async function addAsset(description: string): Promise<CommandResult> {
  if (!description) {
    return {
      success: false,
      message: 'Please provide an asset description'
    };
  }

  const parsedAsset = parseAssetDescription(description);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      message: 'You must be logged in to perform this action'
    };
  }

  // Find beneficiary if specified
  let beneficiary_id = null;
  if (parsedAsset.beneficiary_name) {
    const { data: beneficiaries } = await supabase
      .from('beneficiaries')
      .select('id')
      .ilike('full_name', parsedAsset.beneficiary_name)
      .limit(1);
    
    if (beneficiaries?.length) {
      beneficiary_id = beneficiaries[0].id;
    }
  }

  const { error } = await supabase
    .from('assets')
    .insert([{
      user_id: user.id,
      name: parsedAsset.name,
      type: parsedAsset.type,
      estimated_value: parsedAsset.estimated_value,
      location: parsedAsset.location,
      beneficiary_id,
      description: description
    }]);

  if (error) throw error;

  return {
    success: true,
    message: `Asset "${parsedAsset.name}" has been added successfully with the following details:
- Type: ${parsedAsset.type}
- Value: ${parsedAsset.estimated_value ? `$${parsedAsset.estimated_value}` : 'Not specified'}
- Location: ${parsedAsset.location || 'Not specified'}
- Beneficiary: ${parsedAsset.beneficiary_name || 'Not specified'}`
  };
}

async function removeAsset(name: string): Promise<CommandResult> {
  if (!name) {
    return {
      success: false,
      message: 'Please provide an asset name'
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      message: 'You must be logged in to perform this action'
    };
  }

  // First find the asset
  const { data: assets } = await supabase
    .from('assets')
    .select('id, name')
    .eq('user_id', user.id)
    .ilike('name', name);

  if (!assets?.length) {
    return {
      success: false,
      message: `Asset "${name}" not found`
    };
  }

  // Delete the asset
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', assets[0].id);

  if (error) throw error;

  return {
    success: true,
    message: `Asset "${name}" has been removed successfully`
  };
}

async function addBeneficiary(name: string): Promise<CommandResult> {
  if (!name) {
    return {
      success: false,
      message: 'Please provide a beneficiary name'
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      message: 'You must be logged in to perform this action'
    };
  }

  const { error } = await supabase
    .from('beneficiaries')
    .insert([{
      user_id: user.id,
      full_name: name
    }]);

  if (error) throw error;

  return {
    success: true,
    message: `Beneficiary "${name}" has been added successfully`
  };
}

async function removeBeneficiary(name: string): Promise<CommandResult> {
  if (!name) {
    return {
      success: false,
      message: 'Please provide a beneficiary name'
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      message: 'You must be logged in to perform this action'
    };
  }

  // First find the beneficiary
  const { data: beneficiaries } = await supabase
    .from('beneficiaries')
    .select('id, full_name')
    .eq('user_id', user.id)
    .ilike('full_name', name);

  if (!beneficiaries?.length) {
    return {
      success: false,
      message: `Beneficiary "${name}" not found`
    };
  }

  // Delete the beneficiary
  const { error } = await supabase
    .from('beneficiaries')
    .delete()
    .eq('id', beneficiaries[0].id);

  if (error) throw error;

  return {
    success: true,
    message: `Beneficiary "${name}" has been removed successfully`
  };
}