// Consistent location data for use across the platform
// This matches the data structure used in the main search functionality

export interface StateOption {
  id: string
  name: string
}

export interface CityOption {
  id: string
  name: string
  stateId: string
}

// Popular Indian states (matches the fallback in api.ts)
export const INDIAN_STATES: StateOption[] = [
  { id: 'AP', name: 'Andhra Pradesh' },
  { id: 'AS', name: 'Assam' },
  { id: 'BR', name: 'Bihar' },
  { id: 'CG', name: 'Chhattisgarh' },
  { id: 'DL', name: 'Delhi' },
  { id: 'GA', name: 'Goa' },
  { id: 'GJ', name: 'Gujarat' },
  { id: 'HR', name: 'Haryana' },
  { id: 'HP', name: 'Himachal Pradesh' },
  { id: 'JK', name: 'Jammu and Kashmir' },
  { id: 'JH', name: 'Jharkhand' },
  { id: 'KA', name: 'Karnataka' },
  { id: 'KL', name: 'Kerala' },
  { id: 'LA', name: 'Ladakh' },
  { id: 'MP', name: 'Madhya Pradesh' },
  { id: 'MH', name: 'Maharashtra' },
  { id: 'OR', name: 'Odisha' },
  { id: 'PB', name: 'Punjab' },
  { id: 'RJ', name: 'Rajasthan' },
  { id: 'TN', name: 'Tamil Nadu' },
  { id: 'TG', name: 'Telangana' },
  { id: 'UK', name: 'Uttarakhand' },
  { id: 'UP', name: 'Uttar Pradesh' },
  { id: 'WB', name: 'West Bengal' }
].sort((a, b) => a.name.localeCompare(b.name))

// Popular cities for major states (matches the fallback in api.ts)
export const INDIAN_CITIES: CityOption[] = [
  // Karnataka
  { id: 'ka-bengaluru', name: 'Bengaluru', stateId: 'KA' },
  { id: 'ka-mysuru', name: 'Mysuru', stateId: 'KA' },
  { id: 'ka-hubli', name: 'Hubli', stateId: 'KA' },
  { id: 'ka-mangaluru', name: 'Mangaluru', stateId: 'KA' },
  { id: 'ka-belagavi', name: 'Belagavi', stateId: 'KA' },
  { id: 'ka-gulbarga', name: 'Gulbarga', stateId: 'KA' },
  { id: 'ka-davanagere', name: 'Davanagere', stateId: 'KA' },
  { id: 'ka-ballari', name: 'Ballari', stateId: 'KA' },

  // Maharashtra
  { id: 'mh-mumbai', name: 'Mumbai', stateId: 'MH' },
  { id: 'mh-pune', name: 'Pune', stateId: 'MH' },
  { id: 'mh-nagpur', name: 'Nagpur', stateId: 'MH' },
  { id: 'mh-thane', name: 'Thane', stateId: 'MH' },
  { id: 'mh-nashik', name: 'Nashik', stateId: 'MH' },
  { id: 'mh-aurangabad', name: 'Aurangabad', stateId: 'MH' },
  { id: 'mh-solapur', name: 'Solapur', stateId: 'MH' },
  { id: 'mh-kolhapur', name: 'Kolhapur', stateId: 'MH' },

  // Delhi
  { id: 'dl-new-delhi', name: 'New Delhi', stateId: 'DL' },
  { id: 'dl-central-delhi', name: 'Central Delhi', stateId: 'DL' },
  { id: 'dl-north-delhi', name: 'North Delhi', stateId: 'DL' },
  { id: 'dl-south-delhi', name: 'South Delhi', stateId: 'DL' },
  { id: 'dl-east-delhi', name: 'East Delhi', stateId: 'DL' },
  { id: 'dl-west-delhi', name: 'West Delhi', stateId: 'DL' },
  { id: 'dl-north-west-delhi', name: 'North West Delhi', stateId: 'DL' },
  { id: 'dl-south-west-delhi', name: 'South West Delhi', stateId: 'DL' },

  // Tamil Nadu
  { id: 'tn-chennai', name: 'Chennai', stateId: 'TN' },
  { id: 'tn-coimbatore', name: 'Coimbatore', stateId: 'TN' },
  { id: 'tn-madurai', name: 'Madurai', stateId: 'TN' },
  { id: 'tn-tiruchirappalli', name: 'Tiruchirappalli', stateId: 'TN' },
  { id: 'tn-salem', name: 'Salem', stateId: 'TN' },
  { id: 'tn-tirunelveli', name: 'Tirunelveli', stateId: 'TN' },
  { id: 'tn-vellore', name: 'Vellore', stateId: 'TN' },
  { id: 'tn-erode', name: 'Erode', stateId: 'TN' },

  // Telangana
  { id: 'tg-hyderabad', name: 'Hyderabad', stateId: 'TG' },
  { id: 'tg-warangal', name: 'Warangal', stateId: 'TG' },
  { id: 'tg-nizamabad', name: 'Nizamabad', stateId: 'TG' },
  { id: 'tg-karimnagar', name: 'Karimnagar', stateId: 'TG' },
  { id: 'tg-khammam', name: 'Khammam', stateId: 'TG' },

  // Andhra Pradesh
  { id: 'ap-visakhapatnam', name: 'Visakhapatnam', stateId: 'AP' },
  { id: 'ap-vijayawada', name: 'Vijayawada', stateId: 'AP' },
  { id: 'ap-guntur', name: 'Guntur', stateId: 'AP' },
  { id: 'ap-tirupati', name: 'Tirupati', stateId: 'AP' },
  { id: 'ap-rajahmundry', name: 'Rajahmundry', stateId: 'AP' },

  // Gujarat
  { id: 'gj-ahmedabad', name: 'Ahmedabad', stateId: 'GJ' },
  { id: 'gj-surat', name: 'Surat', stateId: 'GJ' },
  { id: 'gj-vadodara', name: 'Vadodara', stateId: 'GJ' },
  { id: 'gj-rajkot', name: 'Rajkot', stateId: 'GJ' },
  { id: 'gj-bhavnagar', name: 'Bhavnagar', stateId: 'GJ' },

  // Rajasthan
  { id: 'rj-jaipur', name: 'Jaipur', stateId: 'RJ' },
  { id: 'rj-jodhpur', name: 'Jodhpur', stateId: 'RJ' },
  { id: 'rj-udaipur', name: 'Udaipur', stateId: 'RJ' },
  { id: 'rj-kota', name: 'Kota', stateId: 'RJ' },
  { id: 'rj-ajmer', name: 'Ajmer', stateId: 'RJ' },

  // Uttar Pradesh
  { id: 'up-lucknow', name: 'Lucknow', stateId: 'UP' },
  { id: 'up-kanpur', name: 'Kanpur', stateId: 'UP' },
  { id: 'up-ghaziabad', name: 'Ghaziabad', stateId: 'UP' },
  { id: 'up-agra', name: 'Agra', stateId: 'UP' },
  { id: 'up-meerut', name: 'Meerut', stateId: 'UP' },
  { id: 'up-varanasi', name: 'Varanasi', stateId: 'UP' },
  { id: 'up-allahabad', name: 'Allahabad', stateId: 'UP' },
  { id: 'up-noida', name: 'Noida', stateId: 'UP' },

  // West Bengal
  { id: 'wb-kolkata', name: 'Kolkata', stateId: 'WB' },
  { id: 'wb-howrah', name: 'Howrah', stateId: 'WB' },
  { id: 'wb-durgapur', name: 'Durgapur', stateId: 'WB' },
  { id: 'wb-siliguri', name: 'Siliguri', stateId: 'WB' },
  { id: 'wb-asansol', name: 'Asansol', stateId: 'WB' },

  // Punjab
  { id: 'pb-ludhiana', name: 'Ludhiana', stateId: 'PB' },
  { id: 'pb-amritsar', name: 'Amritsar', stateId: 'PB' },
  { id: 'pb-jalandhar', name: 'Jalandhar', stateId: 'PB' },
  { id: 'pb-patiala', name: 'Patiala', stateId: 'PB' },
  { id: 'pb-bathinda', name: 'Bathinda', stateId: 'PB' },

  // Haryana
  { id: 'hr-faridabad', name: 'Faridabad', stateId: 'HR' },
  { id: 'hr-gurgaon', name: 'Gurgaon', stateId: 'HR' },
  { id: 'hr-panipat', name: 'Panipat', stateId: 'HR' },
  { id: 'hr-ambala', name: 'Ambala', stateId: 'HR' },
  { id: 'hr-yamunanagar', name: 'Yamunanagar', stateId: 'HR' },

  // Kerala
  { id: 'kl-kochi', name: 'Kochi', stateId: 'KL' },
  { id: 'kl-thiruvananthapuram', name: 'Thiruvananthapuram', stateId: 'KL' },
  { id: 'kl-kozhikode', name: 'Kozhikode', stateId: 'KL' },
  { id: 'kl-thrissur', name: 'Thrissur', stateId: 'KL' },
  { id: 'kl-kollam', name: 'Kollam', stateId: 'KL' }
].sort((a, b) => a.name.localeCompare(b.name))

// Helper function to get cities for a specific state
export const getCitiesForState = (stateId: string): CityOption[] => {
  return INDIAN_CITIES.filter(city => city.stateId === stateId)
}

// Helper function to find state by name (for backwards compatibility)
export const findStateByName = (name: string): StateOption | undefined => {
  return INDIAN_STATES.find(state => 
    state.name.toLowerCase() === name.toLowerCase()
  )
}

// Helper function to find city by name within a state (for backwards compatibility)
export const findCityByName = (cityName: string, stateId?: string): CityOption | undefined => {
  return INDIAN_CITIES.find(city => 
    city.name.toLowerCase() === cityName.toLowerCase() && 
    (!stateId || city.stateId === stateId)
  )
}