export const getLicensePrice = (
  beat: any, 
  licenseType: 'basic' | 'premium' | 'exclusive' | 'custom' | string, 
  isDiaspora: boolean
): number => {
  if (!beat) return 0;
  
  // For diaspora pricing (USD)
  if (isDiaspora) {
    switch (licenseType) {
      case 'basic':
        return beat.basic_license_price_diaspora || 0;
      case 'premium':
        return beat.premium_license_price_diaspora || (beat.basic_license_price_diaspora ? beat.basic_license_price_diaspora * 1.5 : 0);
      case 'exclusive':
        return beat.exclusive_license_price_diaspora || (beat.basic_license_price_diaspora ? beat.basic_license_price_diaspora * 3 : 0);
      case 'custom':
        return beat.custom_license_price_diaspora || beat.basic_license_price_diaspora || 0;
      default:
        // If we have an unknown license type, try to find matching custom prices
        if (beat[`${licenseType}_license_price_diaspora`]) {
          return beat[`${licenseType}_license_price_diaspora`];
        }
        return beat.basic_license_price_diaspora || 0;
    }
  }
  
  // For local pricing (NGN)
  switch (licenseType) {
    case 'basic':
      return beat.basic_license_price_local || 0;
    case 'premium':
      return beat.premium_license_price_local || (beat.basic_license_price_local ? beat.basic_license_price_local * 1.5 : 0);
    case 'exclusive':
      return beat.exclusive_license_price_local || (beat.basic_license_price_local ? beat.basic_license_price_local * 3 : 0);
    case 'custom':
      return beat.custom_license_price_local || beat.basic_license_price_local || 0;
    default:
      // If we have an unknown license type, try to find matching custom prices
      if (beat[`${licenseType}_license_price_local`]) {
        return beat[`${licenseType}_license_price_local`];
      }
      return beat.basic_license_price_local || 0;
  }
};

// Helper to check if a beat has specific license pricing
export const hasLicensePricing = (
  beat: any,
  licenseType: 'basic' | 'premium' | 'exclusive' | 'custom' | string
): boolean => {
  if (!beat) return false;
  
  if (licenseType === 'basic') {
    return !!beat.basic_license_price_local || !!beat.basic_license_price_diaspora;
  } else if (licenseType === 'premium') {
    return !!beat.premium_license_price_local || !!beat.premium_license_price_diaspora;
  } else if (licenseType === 'exclusive') {
    return !!beat.exclusive_license_price_local || !!beat.exclusive_license_price_diaspora;
  } else if (licenseType === 'custom') {
    return !!beat.custom_license_price_local || !!beat.custom_license_price_diaspora;
  } else {
    return !!beat[`${licenseType}_license_price_local`] || !!beat[`${licenseType}_license_price_diaspora`];
  }
};

// Get all available license types for a beat
export const getAvailableLicenseTypes = (beat: any): string[] => {
  if (!beat) return ['basic'];
  
  // If license_type is populated, use that
  if (beat.license_type && typeof beat.license_type === 'string') {
    return beat.license_type.split(',');
  }
  
  // Otherwise, detect licenses based on price fields
  const available = [];
  
  if (hasLicensePricing(beat, 'basic')) {
    available.push('basic');
  }
  
  if (hasLicensePricing(beat, 'premium')) {
    available.push('premium');
  }
  
  if (hasLicensePricing(beat, 'exclusive')) {
    available.push('exclusive');
  }
  
  if (hasLicensePricing(beat, 'custom')) {
    available.push('custom');
  }
  
  // If nothing is found, default to basic
  return available.length > 0 ? available : ['basic'];
};

// Get the first available license with pricing (fallback chain: basic → premium → exclusive → custom)
export const getFirstAvailableLicense = (beat: any): { 
  type: 'basic' | 'premium' | 'exclusive' | 'custom'; 
  localPrice: number; 
  diasporaPrice: number; 
} => {
  const licenseOrder = ['basic', 'premium', 'exclusive', 'custom'] as const;
  
  for (const license of licenseOrder) {
    if (hasLicensePricing(beat, license)) {
      return {
        type: license,
        localPrice: beat[`${license}_license_price_local`] || 0,
        diasporaPrice: beat[`${license}_license_price_diaspora`] || 0,
      };
    }
  }
  
  // Fallback to basic with 0 prices if nothing found
  return { type: 'basic', localPrice: 0, diasporaPrice: 0 };
};
