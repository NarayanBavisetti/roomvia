'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Upload, X, Star, StarOff, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CloudinaryImage, validateImageFile } from '@/lib/cloudinary'

interface ImageUploadProps {
  images: CloudinaryImage[]
  onImagesChange: (images: CloudinaryImage[]) => void
  maxImages?: number
  listingId?: string
  disabled?: boolean
}

interface UploadingImage {
  file: File
  progress: number
  error?: string
  preview: string
}

export default function ImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  listingId,
  disabled = false
}: ImageUploadProps) {
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Keep a ref of latest images to avoid stale closures during batch uploads
  const imagesRef = useRef<CloudinaryImage[]>(images)
  useEffect(() => {
    imagesRef.current = images
  }, [images])

  const uploadFile = useCallback(async (file: File, uploadingIndex: number) => {
    const formData = new FormData()
    formData.append('file', file)
    if (listingId) {
      formData.append('listingId', listingId)
    }

    try {
      const xhr = new XMLHttpRequest()
      // Attach Supabase auth token if available so the API route can authenticate the user
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      
      // Track progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadingImages(prev =>
            prev.map((img, idx) =>
              idx === uploadingIndex ? { ...img, progress } : img
            )
          )
        }
      })

      const response: CloudinaryImage = await new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const result = JSON.parse(xhr.responseText)
              if (result.success) {
                resolve(result.image)
              } else {
                reject(new Error(result.error || 'Upload failed'))
              }
            } catch {
              reject(new Error('Invalid response from server'))
            }
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`))
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

      // Set as primary if it's the first image (use ref for latest value)
      const isFirstImage = imagesRef.current.length === 0
      const imageToAdd: CloudinaryImage = {
        ...response,
        is_primary: isFirstImage
      }

      // Add to images and remove from uploading
      setUploadingImages(prev => prev.filter((_, idx) => idx !== uploadingIndex))
      onImagesChange([...(imagesRef.current || []), imageToAdd])

    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }, [listingId, onImagesChange])

  const handleFiles = useCallback(async (files: File[]) => {
    if (disabled) return

    const remainingSlots = maxImages - (images.length + uploadingImages.length)
    const filesToUpload = files.slice(0, remainingSlots)

    // Validate files
    const validFiles: File[] = []
    const errors: string[] = []

    filesToUpload.forEach(file => {
      const validation = validateImageFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        errors.push(`${file.name}: ${validation.error}`)
      }
    })

    if (errors.length > 0) {
      alert(`Some files were skipped:\n${errors.join('\n')}`)
    }

    if (validFiles.length === 0) return

    // Create uploading images with previews
    const newUploadingImages: UploadingImage[] = validFiles.map(file => ({
      file,
      progress: 0,
      preview: URL.createObjectURL(file)
    }))

    setUploadingImages(prev => [...prev, ...newUploadingImages])

    // Upload each file
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      const uploadingImageIndex = uploadingImages.length + i

      try {
        await uploadFile(file, uploadingImageIndex)
      } catch (error) {
        console.error('Upload failed:', error)
        setUploadingImages(prev =>
          prev.map((img, idx) =>
            idx === uploadingImageIndex
              ? { ...img, error: error instanceof Error ? error.message : 'Upload failed' }
              : img
          )
        )
      }
    }
  }, [disabled, images.length, uploadingImages.length, maxImages, uploadFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [handleFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }, [handleFiles])

  const removeImage = useCallback((index: number) => {
    const imageToRemove = images[index]
    const wasRemovingPrimary = imageToRemove.is_primary
    const newImages = images.filter((_, idx) => idx !== index)

    // If we removed the primary image and there are still images, make the first one primary
    if (wasRemovingPrimary && newImages.length > 0) {
      newImages[0].is_primary = true
    }

    onImagesChange(newImages)

    // Optional: Delete from Cloudinary
    // You can add this functionality later if needed
  }, [images, onImagesChange])

  const removeUploadingImage = useCallback((index: number) => {
    setUploadingImages(prev => {
      const imageToRemove = prev[index]
      URL.revokeObjectURL(imageToRemove.preview)
      return prev.filter((_, idx) => idx !== index)
    })
  }, [])

  const setPrimaryImage = useCallback((index: number) => {
    const newImages = images.map((img, idx) => ({
      ...img,
      is_primary: idx === index
    }))
    onImagesChange(newImages)
  }, [images, onImagesChange])

  const canAddMore = images.length + uploadingImages.length < maxImages

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canAddMore && !disabled && (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${
            isDragOver
              ? 'border-purple-400 bg-purple-50'
              : 'border-gray-300 bg-gray-50 hover:border-purple-300 hover:bg-purple-50/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            ref={fileInputRef}
          />

          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Upload className="h-6 w-6 text-purple-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload Property Images
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop images here, or click to browse
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="border-purple-300 text-purple-600 hover:bg-purple-50"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Choose Images
              </Button>
            </div>

            <div className="text-sm text-gray-500">
              <p>Maximum {maxImages} images • JPG, PNG, WebP • Max 5MB each</p>
              <p>{images.length + uploadingImages.length}/{maxImages} images</p>
            </div>
          </div>
        </div>
      )}

      {/* Uploading Images */}
      {uploadingImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Uploading...</h4>
          {uploadingImages.map((uploadingImage, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div
                className="w-12 h-12 rounded-lg bg-cover bg-center flex-shrink-0"
                style={{ backgroundImage: `url(${uploadingImage.preview})` }}
              />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadingImage.file.name}
                </p>
                {uploadingImage.error ? (
                  <p className="text-xs text-red-600">{uploadingImage.error}</p>
                ) : (
                  <div className="space-y-1">
                    <Progress value={uploadingImage.progress} className="h-1" />
                    <p className="text-xs text-gray-500">{uploadingImage.progress}% uploaded</p>
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeUploadingImage(index)}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Images */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Uploaded Images ({images.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image.public_id}
                className={`relative group rounded-lg overflow-hidden border-2 transition-colors ${
                  image.is_primary ? 'border-purple-500' : 'border-gray-200'
                }`}
              >
                <div className="aspect-square">
                  <Image
                    src={image.url}
                    alt={`Property image ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Primary badge */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Primary
                  </div>
                )}

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setPrimaryImage(index)}
                      disabled={image.is_primary}
                      className="bg-white/90 hover:bg-white text-gray-900"
                    >
                      {image.is_primary ? (
                        <Star className="h-4 w-4 fill-current" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeImage(index)}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {images.length > 0 && (
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
              <p className="flex items-center">
                <Star className="h-4 w-4 fill-purple-500 text-purple-500 mr-1" />
                The primary image will be shown as the main property photo
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && uploadingImages.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No images uploaded yet</p>
        </div>
      )}
    </div>
  )
}