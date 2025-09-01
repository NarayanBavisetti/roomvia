'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Search, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchStates, fetchAreas, State, Area } from '@/lib/api'

interface SearchBarProps {
  onSearch?: (state: State | null, area: Area | null) => void
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [states, setStates] = useState<State[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [selectedState, setSelectedState] = useState<State | null>(null)
  const [selectedArea, setSelectedArea] = useState<Area | null>(null)
  const [isLoadingStates, setIsLoadingStates] = useState(false)
  const [isLoadingAreas, setIsLoadingAreas] = useState(false)
  const [stateOpen, setStateOpen] = useState(false)
  const [areaOpen, setAreaOpen] = useState(false)
  const [stateQuery, setStateQuery] = useState('')
  const [areaQuery, setAreaQuery] = useState('')

  React.useEffect(() => {
    loadStates()
  }, [])

  const loadStates = async () => {
    setIsLoadingStates(true)
    const statesData = await fetchStates()
    setStates(statesData)
    setIsLoadingStates(false)
  }

  const handleStateChange = async (stateId: string) => {
    const state = states.find(s => s.id === stateId) || null
    setSelectedState(state)
    setSelectedArea(null)
    setAreas([])
    setStateOpen(false)
    setStateQuery(state?.name || '')
    setAreaQuery('')

    if (state) {
      setIsLoadingAreas(true)
      const areasData = await fetchAreas(state.id)
      setAreas(areasData)
      setIsLoadingAreas(false)
    }
  }

  const handleAreaChange = (areaId: string) => {
    const area = areas.find(a => a.id === areaId) || null
    setSelectedArea(area)
    setAreaOpen(false)
    setAreaQuery(area?.name || '')
  }

  const handleSearch = () => {
    onSearch?.(selectedState, selectedArea)
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-24 mb-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Find your perfect <span className="text-purple-500">room</span>
        </h1>
        <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
          Discover amazing flats and flatmates in your preferred location with ease
        </p>
      </div>
      
      {/* Clean Search Bar */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-full shadow-lg border border-gray-200 p-2">
          <div className="flex items-center gap-1">
            {/* State Section */}
            <div className="flex-1">
              <Popover open={stateOpen} onOpenChange={(open) => setStateOpen(open)}>
                <PopoverTrigger asChild>
                  <div
                    className="h-12 w-full rounded-full hover:bg-gray-50 border-0 px-4 cursor-text flex items-center"
                    onMouseDown={(e) => {
                      const target = e.target as HTMLElement
                      if (target.tagName !== 'INPUT') {
                        e.preventDefault()
                      }
                    }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement
                      if (target.tagName !== 'INPUT') {
                        setStateOpen(true)
                      }
                    }}
                  >
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 mb-0.5">Where</div>
                      <input
                        type="text"
                        autoComplete="off"
                        value={stateQuery}
                        onChange={(e) => {
                          setStateQuery(e.target.value)
                          setStateOpen(true)
                        }}
                        onFocus={() => setStateOpen(true)}
                        placeholder={isLoadingStates ? 'Loading...' : 'Search destinations'}
                        className="text-sm text-gray-900 placeholder-gray-500 bg-transparent border-0 outline-none w-full"
                        disabled={isLoadingStates}
                      />
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 mt-2" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                  <Command>
                    <CommandList className="max-h-60 p-2">
                      <CommandEmpty>No state found.</CommandEmpty>
                      <CommandGroup>
                        {states
                          .filter(state => 
                            state.name.toLowerCase().includes(stateQuery.toLowerCase())
                          )
                          .map((state) => (
                          <CommandItem
                            key={state.id}
                            value={state.name}
                            onSelect={() => handleStateChange(state.id)}
                            className="text-sm py-3 px-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <Check
                              className={cn(
                                'mr-2 h-3 w-3',
                                selectedState?.id === state.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {state.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-300"></div>

            {/* Area Section */}
            <div className="flex-1">
              <Popover open={areaOpen} onOpenChange={(open) => setAreaOpen(open)}>
                <PopoverTrigger asChild>
                  <div
                    className="h-12 w-full rounded-full hover:bg-gray-50 border-0 px-4 cursor-text flex items-center"
                    onMouseDown={(e) => {
                      const target = e.target as HTMLElement
                      if (target.tagName !== 'INPUT') {
                        e.preventDefault()
                      }
                    }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement
                      if (target.tagName !== 'INPUT') {
                        if (selectedState) setAreaOpen(true)
                      }
                    }}
                  >
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 mb-0.5">Area</div>
                      <input
                        type="text"
                        autoComplete="off"
                        value={areaQuery}
                        onChange={(e) => {
                          setAreaQuery(e.target.value)
                          if (selectedState) setAreaOpen(true)
                        }}
                        onFocus={() => {
                          if (selectedState) setAreaOpen(true)
                        }}
                        placeholder={!selectedState ? 'Select state first' : isLoadingAreas ? 'Loading...' : 'Search areas'}
                        className="text-sm text-gray-900 placeholder-gray-500 bg-transparent border-0 outline-none w-full disabled:opacity-50"
                        disabled={!selectedState || isLoadingAreas}
                      />
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 mt-2" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                  <Command>
                    <CommandList className="max-h-60 p-2">
                      <CommandEmpty>No area found.</CommandEmpty>
                      <CommandGroup>
                        {areas
                          .filter(area => 
                            area.name.toLowerCase().includes(areaQuery.toLowerCase())
                          )
                          .map((area) => (
                          <CommandItem
                            key={area.id}
                            value={area.name}
                            onSelect={() => handleAreaChange(area.id)}
                            className="text-sm py-3 px-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <Check
                              className={cn(
                                'mr-2 h-3 w-3',
                                selectedArea?.id === area.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {area.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Search Button */}
            <Button 
              type="button"
              aria-label="Search listings"
              title="Search listings"
              onClick={handleSearch}
              disabled={!selectedState || !selectedArea}
              size="icon"
              className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm hover:from-purple-600 hover:to-purple-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ml-1"
            >
              <Search className="h-5 w-5 text-primary-foreground" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick suggestions removed for now */}
    </div>
  )
}