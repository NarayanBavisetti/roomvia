'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  MapPin,
  Building2,
  Bookmark,
  Wifi,
  Car,
  Dumbbell,
  Waves,
  Home,
  Shield,
  Wind,
  TreePine,
  Utensils,
  MessageCircle,
  CheckCircle2,
  Ban,
  Leaf
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useChat } from '@/contexts/chat-context'
import type { Flatmate } from '@/lib/supabase'

interface FlatmateCardProps {
  flatmate: Flatmate
  onConnect?: () => void
}

// (Icons prepared above; rendering uses simple text badges for a clean look)

export default function FlatmateCard({ flatmate, onConnect }: FlatmateCardProps) {
  const [,] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const { openChat } = useChat()
  // Defensive defaults for optional fields
  const amenities: string[] = Array.isArray(flatmate.amenities) ? flatmate.amenities : []
  const preferredLocations: string[] = Array.isArray(flatmate.preferred_locations) ? flatmate.preferred_locations : []

  // Mock flatmate data - in real app this would be the actual user
  const flatmateEmail = `${flatmate.name.toLowerCase().replace(' ', '.')}@example.com`

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    const first = parts[0]?.charAt(0) || ''
    const second = parts.length > 1 ? parts[1].charAt(0) : ''
    return (first + second).toUpperCase()
  }

  const handleConnect = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      // Open login modal globally if not authenticated
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('open-login-modal'))
      }
      return
    }
    
    // Use the user_id for chat, and flatmate.id as the flatmate context
    if (flatmate.user_id) {
      openChat(flatmate.user_id, flatmateEmail, undefined, flatmate.id)
    } else {
      console.error('Flatmate missing user_id, cannot open chat')
    }
    onConnect?.()
  }

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('open-login-modal'))
      return
    }
    if (saving) return
    setSaving(true)
    const previous = isSaved
    try {
      setIsSaved(!previous)
      const { savesApi } = await import('@/lib/saves')
      const { saved, error } = await savesApi.toggleSave('person', flatmate.id)
      if (error) {
        console.error('Save toggle failed:', error)
        setIsSaved(previous)
      } else {
        setIsSaved(saved)
      }
    } catch (e) {
      console.error('Save toggle failed:', e)
      setIsSaved(previous)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-200">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-14 w-14 ring-2 ring-white shadow-sm">
              {flatmate.image_url ? (
                <AvatarImage src={flatmate.image_url} alt={flatmate.name} />
              ) : null}
              <AvatarFallback className="bg-gray-100 text-gray-700 text-sm font-medium">
                {getInitials(flatmate.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900 leading-tight">
                  {flatmate.name}
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">{flatmate.age}y • {flatmate.gender}</p>
              </div>
              <button
                onClick={handleToggleSave}
                aria-pressed={isSaved}
                className="p-1.5 bg-white/90 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Bookmark className={`h-4 w-4 ${isSaved ? 'text-purple-600' : 'text-gray-600'}`} />
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {flatmate.company && (
                <Badge variant="secondary" className="bg-purple-50 text-purple-700 text-[11px] px-2.5 py-0.5 rounded-md inline-flex items-center">
                  <Building2 className="h-3 w-3 mr-1" />
                  {flatmate.company}
                </Badge>
              )}
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                <span className="truncate">
                  {[flatmate.city, flatmate.state].filter(Boolean).join(', ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="mt-4 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Budget</span>
            <span className="text-sm font-semibold text-gray-900">₹{(flatmate.budget_min/1000).toFixed(0)}k - ₹{(flatmate.budget_max/1000).toFixed(0)}k</span>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="outline" className={`text-[11px] px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${flatmate.food_preference === 'Veg' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
            <Leaf className="h-3 w-3" />
            {flatmate.food_preference}
          </Badge>
          <Badge variant="outline" className={`text-[11px] px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${flatmate.non_smoker ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
            {flatmate.non_smoker ? <CheckCircle2 className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
            {flatmate.non_smoker ? 'Non-smoker' : 'Smoker'}
          </Badge>
          {flatmate.gated_community && (
            <Badge variant="outline" className="text-[11px] px-2 py-0.5 rounded-md inline-flex items-center gap-1 bg-purple-50 border-purple-200 text-purple-700">
              <Shield className="h-3 w-3" /> Gated Community
            </Badge>
          )}
        </div>

        {/* Preferred locations */}
        {preferredLocations.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              <span>Preferred locations</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {preferredLocations.slice(0, 3).map((loc, i) => (
                <Badge key={i} variant="outline" className="text-[11px] px-2 py-0.5 bg-white border-gray-200 text-gray-700 rounded-md">
                  {loc}
                </Badge>
              ))}
              {preferredLocations.length > 3 && (
                <Badge variant="outline" className="text-[11px] px-2 py-0.5 bg-white border-gray-200 text-gray-700 rounded-md">+{preferredLocations.length - 3}</Badge>
              )}
            </div>
          </div>
        )}

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1">Amenities</div>
            <div className="flex flex-wrap gap-1.5">
              {amenities.slice(0, 4).map((am, i) => (
                <Badge key={i} variant="outline" className="text-[11px] px-2 py-0.5 bg-white border-gray-200 text-gray-700 rounded-md">
                  {am}
                </Badge>
              ))}
              {amenities.length > 4 && (
                <Badge variant="outline" className="text-[11px] px-2 py-0.5 bg-white border-gray-200 text-gray-700 rounded-md">+{amenities.length - 4}</Badge>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Button 
            onClick={handleConnect}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Chat
          </Button>
        </div>
      </div>
    </div>
  )
}