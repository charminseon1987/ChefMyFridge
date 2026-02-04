'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import axios from 'axios'

interface ImageUploadProps {
  onAnalysisStart: (preview: string) => void
  onAnalysisComplete: (data: any) => void
  isLoading: boolean
}

export default function ImageUpload({
  onAnalysisStart,
  onAnalysisComplete,
  isLoading,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || !preview) return

    onAnalysisStart(preview)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await axios.post(
        'http://localhost:8000/api/v1/analyze',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      onAnalysisComplete(response.data)
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(
        error.response?.data?.detail ||
          '이미지 분석 중 오류가 발생했습니다.'
      )
      onAnalysisComplete(null)
    }
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-emerald rounded-2xl p-8 shadow-3d-emerald perspective-3d transform-3d"
      >
        {!preview ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all transform-3d ${
              dragActive
                ? 'border-slate-400 bg-slate-50/50 shadow-3d-emerald scale-105'
                : 'border-slate-300/50 hover:border-slate-400 hover:bg-slate-50/30 hover:shadow-3d-emerald hover:scale-[1.02]'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Upload className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              냉장고 사진을 업로드하세요
            </h3>
            <p className="text-slate-600 mb-4">
              드래그 앤 드롭 또는 클릭하여 파일 선택
            </p>
            <p className="text-sm text-slate-500">
              지원 형식: JPG, PNG, WEBP
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative rounded-xl overflow-hidden glass shadow-3d transform-3d card-3d">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-auto max-h-96 object-contain"
              />
              <button
                onClick={handleRemove}
                className="absolute top-4 right-4 p-2 bg-red-500 hover:bg-red-600 rounded-full transition-all shadow-3d hover:scale-110 transform-3d"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpload}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-slate-700 to-slate-900 text-white font-bold text-lg rounded-xl hover:from-slate-800 hover:to-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-3d-emerald transform-3d hover:scale-105 hover:translateZ(10px)"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>분석 중...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" />
                  <span>AI 분석 시작</span>
                </>
              )}
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
