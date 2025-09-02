import { State as CSCState, City } from 'country-state-city'

export interface State {
  id: string
  name: string
}

export interface Area {
  id: string
  name: string
}

// Get India's country code for filtering
const INDIA_COUNTRY_CODE = 'IN'

export async function fetchStates(): Promise<State[]> {
  try {
    console.log('Fetching Indian states from country-state-city package')
    
    // Get all states for India
    const indianStates = CSCState.getStatesOfCountry(INDIA_COUNTRY_CODE)
    
    // Convert to our interface format
    const states: State[] = indianStates.map((state) => ({
      id: state.isoCode,
      name: state.name
    }))
    
    console.log('States data received:', states.length, 'Indian states')
    return states
  } catch (error) {
    console.error('Error fetching states:', error)
    // Fallback to static Indian states if package fails
    return [
      { id: 'KA', name: 'Karnataka' },
      { id: 'MH', name: 'Maharashtra' },
      { id: 'DL', name: 'Delhi' },
      { id: 'TN', name: 'Tamil Nadu' },
      { id: 'GJ', name: 'Gujarat' },
      { id: 'RJ', name: 'Rajasthan' },
      { id: 'UP', name: 'Uttar Pradesh' },
      { id: 'WB', name: 'West Bengal' },
      { id: 'HR', name: 'Haryana' },
      { id: 'PB', name: 'Punjab' },
      { id: 'AS', name: 'Assam' },
      { id: 'BR', name: 'Bihar' },
      { id: 'JH', name: 'Jharkhand' },
      { id: 'OR', name: 'Odisha' },
      { id: 'MP', name: 'Madhya Pradesh' },
      { id: 'CG', name: 'Chhattisgarh' },
      { id: 'AP', name: 'Andhra Pradesh' },
      { id: 'TG', name: 'Telangana' },
      { id: 'KL', name: 'Kerala' },
      { id: 'GA', name: 'Goa' },
      { id: 'HP', name: 'Himachal Pradesh' },
      { id: 'JK', name: 'Jammu and Kashmir' },
      { id: 'LA', name: 'Ladakh' },
      { id: 'UK', name: 'Uttarakhand' }
    ]
  }
}

export async function fetchAreas(stateId: string): Promise<Area[]> {
  try {
    console.log('Fetching cities for state:', stateId)
    
    // Get all cities for the specific state in India
    const cities = City.getCitiesOfState(INDIA_COUNTRY_CODE, stateId)
    
    // Convert to our interface format and sort alphabetically
    const areas: Area[] = cities
      .map((city) => ({
        id: `${stateId}-${city.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: city.name
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 50) // Limit to first 50 cities for better UX
    
    console.log('Areas data received:', areas.length, 'cities for state', stateId)
    return areas
  } catch (error) {
    console.error('Error fetching areas:', error)
    // Fallback to static cities based on popular Indian states
    const fallbackAreas: Record<string, Area[]> = {
      'KA': [
        { id: 'ka-bengaluru', name: 'Bengaluru' },
        { id: 'ka-mysuru', name: 'Mysuru' },
        { id: 'ka-hubli', name: 'Hubli' },
        { id: 'ka-mangaluru', name: 'Mangaluru' },
        { id: 'ka-belagavi', name: 'Belagavi' },
        { id: 'ka-gulbarga', name: 'Gulbarga' },
        { id: 'ka-davanagere', name: 'Davanagere' },
        { id: 'ka-bellary', name: 'Ballari' }
      ],
      'MH': [
        { id: 'mh-mumbai', name: 'Mumbai' },
        { id: 'mh-pune', name: 'Pune' },
        { id: 'mh-nagpur', name: 'Nagpur' },
        { id: 'mh-thane', name: 'Thane' },
        { id: 'mh-nashik', name: 'Nashik' },
        { id: 'mh-aurangabad', name: 'Aurangabad' },
        { id: 'mh-solapur', name: 'Solapur' },
        { id: 'mh-kolhapur', name: 'Kolhapur' }
      ],
      'DL': [
        { id: 'dl-new-delhi', name: 'New Delhi' },
        { id: 'dl-central-delhi', name: 'Central Delhi' },
        { id: 'dl-north-delhi', name: 'North Delhi' },
        { id: 'dl-south-delhi', name: 'South Delhi' },
        { id: 'dl-east-delhi', name: 'East Delhi' },
        { id: 'dl-west-delhi', name: 'West Delhi' },
        { id: 'dl-north-west-delhi', name: 'North West Delhi' },
        { id: 'dl-south-west-delhi', name: 'South West Delhi' }
      ],
      'TN': [
        { id: 'tn-chennai', name: 'Chennai' },
        { id: 'tn-coimbatore', name: 'Coimbatore' },
        { id: 'tn-madurai', name: 'Madurai' },
        { id: 'tn-tiruchirappalli', name: 'Tiruchirappalli' },
        { id: 'tn-salem', name: 'Salem' },
        { id: 'tn-tirunelveli', name: 'Tirunelveli' },
        { id: 'tn-vellore', name: 'Vellore' },
        { id: 'tn-erode', name: 'Erode' }
      ]
    }
    
    return fallbackAreas[stateId] || []
  }
}