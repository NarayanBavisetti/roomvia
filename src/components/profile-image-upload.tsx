'use client'

import React, { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Upload, X, User, Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { validateImageFile } from '@/lib/cloudinary'

interface ProfileImageUploadProps {
  imageUrl: string
  onImageChange: (url: string) => void
  disabled?: boolean
  className?: string
}

export default function ProfileImageUpload({
  imageUrl,
  onImageChange,
  disabled = false,
  className = ''
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      
      const xhr = new XMLHttpRequest()
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
        }
      })

      const response = await new Promise<{ success: boolean; image: any; error?: string }>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText)
              resolve(result)
            } catch {
              reject(new Error('Invalid response from server'))
            }
          } else {
            try {
              const errorResult = JSON.parse(xhr.responseText)
              reject(new Error(errorResult.error || `Upload failed with status: ${xhr.status}`))
            } catch {
              reject(new Error(`Upload failed with status: ${xhr.status}`))
            }
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'))
        })

        xhr.open('POST', '/api/upload')
        if (accessToken) {
          xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
        }
        xhr.send(formData)
      })

      if (response.success && response.image) {
        onImageChange(response.image.url)
      } else {
        throw new Error(response.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [onImageChange])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || disabled || uploading) return

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }

    await uploadFile(file)
  }, [disabled, uploading, uploadFile])

  const handleRemoveImage = useCallback(() => {
    if (disabled || uploading) return
    onImageChange('')
    setError(null)
  }, [disabled, uploading, onImageChange])

  const openFileDialog = useCallback(() => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click()
    }
  }, [disabled, uploading])

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative group">
        {/* Image Preview */}
        <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-gray-200 bg-gray-50">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="Profile"
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <User className="w-7 h-7 text-gray-400" />
            </div>
          )}
          
          {/* Upload Overlay */}
          {!disabled && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={openFileDialog}
                  disabled={uploading}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 p-1.5 h-auto"
                >
                  {uploading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Camera className="w-3 h-3" />
                  )}
                </Button>
                {imageUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={handleRemoveImage}
                    disabled={uploading}
                    className="bg-red-500 bg-opacity-90 hover:bg-opacity-100 text-white p-1.5 h-auto"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* Upload Progress */}
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-center text-white">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                <div className="text-xs">{uploadProgress}%</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Upload Button */}
        <div className="text-center mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openFileDialog}
            disabled={disabled || uploading}
            className="text-xs px-3 py-1"
          >
            <Upload className="w-3 h-3 mr-1" />
            {uploading ? 'Uploading...' : imageUrl ? 'Change' : 'Upload Photo'}
          </Button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        ref={fileInputRef}
      />
      
      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-600 text-center bg-red-50 border border-red-200 rounded px-2 py-1">
          {error}
        </div>
      )}
    </div>
  )
}