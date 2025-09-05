"use client"

import Navbar from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Bell, SlidersHorizontal } from 'lucide-react'

const CITIES = ['Hyderabad','Bangalore','Mumbai','Delhi','Chennai','Pune','Kolkata','Ahmedabad']
const BHK = ['Any','1BHK','2BHK','3BHK','4BHK+']
const FOOD = ['Any','Veg','Non-Veg','Vegan']

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-white-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50"><Bell className="h-6 w-6 text-amber-600" /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Smart Match Notifications</h1>
              <p className="text-gray-600">Get alerts when new listings or flatmate posts match your preferences</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Coming Soon</Badge>
        </div>

        {/* What it does */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">How it will work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700 leading-relaxed">
            <p>Set your preferred city and filters. Whenever someone uploads a listing or a flatmate profile that matches your criteria, you’ll get a notification instantly.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Choose a city and budget range</li>
              <li>Pick property types and amenities you care about</li>
              <li>Get real-time alerts as soon as matches appear</li>
            </ul>
          </CardContent>
        </Card>

        {/* Preferences (disabled preview) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><SlidersHorizontal className="h-4 w-4" /> Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* City */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Preferred City</Label>
                <Select value={CITIES[0]}>
                  <SelectTrigger className="w-full h-10 text-sm" disabled>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Area */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Area / Locality</Label>
                <Input placeholder="e.g., Jubilee Hills" className="h-10 text-sm" disabled />
              </div>
              {/* BHK */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">BHK</Label>
                <Select value={BHK[0]}>
                  <SelectTrigger className="w-full h-10 text-sm" disabled>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BHK.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Food Preference */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Food Preference</Label>
                <Select value={FOOD[0]}>
                  <SelectTrigger className="w-full h-10 text-sm" disabled>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FOOD.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Gated */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Gated Community</Label>
                <div className="flex items-center gap-3 p-2.5 border rounded-md bg-gray-50">
                  <Switch disabled checked onCheckedChange={() => {}} />
                  <span className="text-sm text-gray-700">Prefer gated communities</span>
                </div>
              </div>
              {/* Sample badges */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Sample Filters</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-purple-50 text-purple-700 border-purple-200">₹15k–₹30k</Badge>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200">2BHK</Badge>
                  <Badge className="bg-green-50 text-green-700 border-green-200">Near Metro</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Switch disabled checked onCheckedChange={() => {}} />
                <span className="text-sm text-gray-700">Enable notifications</span>
              </div>
              <Button variant="outline" disabled>Save Preferences</Button>
            </div>
            <p className="text-xs text-gray-500">This feature is under active development.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
