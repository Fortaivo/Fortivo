interface ParsedAsset {
  name: string;
  type: 'financial' | 'physical' | 'digital' | 'other';
  estimated_value: number | null;
  location: string | null;
  beneficiary_name: string | null;
}

export function parseAssetDescription(text: string): ParsedAsset {
  const valuedMatch = text.match(/valued (?:at |in )?(\d+)/i);
  const locationMatch = text.match(/(?:is |located |placed |situated |)in ([^,\.]+)(?:,|\.|$)/i);
  const beneficiaryMatch = text.match(/(?:is |)for ([^\s,\.]+)/i);
  const typeMatch = text.match(/is (physical|financial|digital)/i);

  // Extract the name by taking everything before "valued" or the first occurrence of "is"
  let name = text;
  if (text.includes('valued')) {
    name = text.split('valued')[0];
  } else if (text.includes(' is ')) {
    name = text.split(' is ')[0];
  }
  name = name.trim();

  return {
    name,
    type: typeMatch ? (typeMatch[1].toLowerCase() as 'physical' | 'financial' | 'digital') : 'other',
    estimated_value: valuedMatch ? parseFloat(valuedMatch[1]) : null,
    location: locationMatch ? locationMatch[1].trim() : null,
    beneficiary_name: beneficiaryMatch ? beneficiaryMatch[1].trim() : null,
  };
}