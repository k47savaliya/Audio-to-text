'use client'

import { useState, useRef } from 'react'

interface TranscriptionData {
  transcript: string
  filename: string
}

interface VideoUploadProps {
  onTranscriptionComplete: (data: TranscriptionData) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export default function VideoUpload({ onTranscriptionComplete, isLoading, setIsLoading }: VideoUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileUpload(files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
      alert('Please select a video or audio file')
      return
    }

    setIsLoading(true)
    setUploadProgress(0)
    setCurrentStage('Uploading file...')

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 15) {
            clearInterval(uploadInterval)
            setCurrentStage('Processing audio...')
            return 15
          }
          return prev + 1
        })
      }, 100)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      clearInterval(uploadInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Transcription failed')
      }

      // Simulate processing stages
      setCurrentStage('Loading AI model...')
      setUploadProgress(25)
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setCurrentStage('Analyzing audio chunks...')
      setUploadProgress(40)
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setCurrentStage('Transcribing audio...')
      
      // Simulate transcription progress
      let progress = 40
      const transcribeInterval = setInterval(() => {
        progress += Math.random() * 15
        if (progress >= 95) {
          progress = 95
          clearInterval(transcribeInterval)
          setCurrentStage('Finalizing transcript...')
        }
        setUploadProgress(Math.min(progress, 95))
      }, 500)

      const result = await response.json()
      
      clearInterval(transcribeInterval)
      setUploadProgress(100)
      setCurrentStage('Complete!')
      
      await new Promise(resolve => setTimeout(resolve, 500))

      onTranscriptionComplete({
        transcript: result.transcript,
        filename: file.name
      })
    } catch (error) {
      console.error('Error:', error)
      alert(`Failed to transcribe file: ${error}`)
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
      setCurrentStage('')
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-12 text-center animate-fade-in shadow-2xl">
        <div className="flex flex-col items-center space-y-8">
          {/* Animated Processing Icon */}
          <div className="relative">
            <div className="w-32 h-32 relative">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 border-4 border-purple-400/30 rounded-full animate-spin"></div>
              {/* Inner rotating ring */}
              <div className="absolute inset-2 border-4 border-cyan-400/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
              {/* Progress ring */}
              <div className="absolute inset-4 border-4 border-transparent rounded-full">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - uploadProgress / 100)}`}
                    className="transition-all duration-500 ease-out"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              {/* Center content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🤖</div>
                  <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                    {Math.round(uploadProgress)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status and Progress Info */}
          <div className="space-y-4 w-full max-w-md">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-purple-100 mb-2">
                Processing Your Media
              </h3>
              <p className="text-lg text-cyan-200/80 font-medium">
                {currentStage}
              </p>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="relative w-full">
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-white/20">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-500 ease-out relative overflow-hidden"
                  style={{ width: `${uploadProgress}%` }}
                >
                  {/* Animated shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between text-sm text-cyan-300/70 mt-2">
                <span>Processing...</span>
                <span className="font-semibold">{Math.round(uploadProgress)}%</span>
              </div>
            </div>

            {/* Processing Steps Indicator */}
            <div className="flex justify-center space-x-2 mt-6">
              {['Upload', 'Process', 'Analyze', 'Transcribe', 'Complete'].map((step, index) => {
                const stepProgress = (index + 1) * 20
                const isActive = uploadProgress >= stepProgress - 15
                const isComplete = uploadProgress >= stepProgress
                
                return (
                  <div
                    key={step}
                    className={`flex flex-col items-center space-y-1 transition-all duration-500 ${
                      isActive ? 'scale-110' : 'scale-100'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full border-2 transition-all duration-500 ${
                        isComplete
                          ? 'bg-gradient-to-r from-cyan-400 to-purple-400 border-transparent shadow-lg'
                          : isActive
                          ? 'border-cyan-400 bg-cyan-400/20 shadow-cyan-400/50 shadow-lg'
                          : 'border-white/30 bg-white/10'
                      }`}
                    />
                    <span
                      className={`text-xs transition-all duration-500 ${
                        isActive ? 'text-cyan-300 font-semibold' : 'text-white/50'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* AI Processing Animation */}
          <div className="flex items-center space-x-2 text-white/60">
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
            <span className="text-sm font-medium">AI is working...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`group bg-white/5 backdrop-blur-xl rounded-3xl border-2 border-dashed transition-all duration-500 p-12 text-center cursor-pointer shadow-2xl hover:shadow-cyan-500/20 ${
        dragActive 
          ? 'border-cyan-400 bg-cyan-400/10 scale-105 shadow-cyan-400/30' 
          : 'border-white/30 hover:border-cyan-400/50 hover:bg-white/10'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="flex flex-col items-center space-y-8 animate-fade-in">
        {/* Enhanced Upload Icon */}
        <div className="relative group-hover:scale-110 transition-transform duration-300">
          <div className="text-8xl filter drop-shadow-2xl">
            {dragActive ? (
              <div className="animate-bounce">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  📹
                </span>
              </div>
            ) : (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300 group-hover:from-cyan-400 group-hover:to-purple-400 transition-all duration-300">
                🎥
              </span>
            )}
          </div>
          {/* Floating particles effect */}
          <div className="absolute -inset-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '2s'
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Enhanced Text Content */}
        <div className="space-y-6">
          <h3 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-purple-100 group-hover:from-cyan-200 group-hover:to-purple-200 transition-all duration-300">
            {dragActive ? '✨ Drop your file here!' : '🚀 Upload Your Media'}
          </h3>
          <p className="text-lg text-cyan-100/80 max-w-md mx-auto leading-relaxed group-hover:text-cyan-100 transition-colors duration-300">
            Drag and drop your video or audio file here, or click to browse. 
            <br />
            <span className="text-purple-300 font-semibold">AI-powered transcription</span> supports all major formats.
          </p>
        </div>

        {/* Enhanced Format Tags */}
        <div className="flex flex-wrap gap-3 justify-center">
          {[
            { format: 'MP4', color: 'from-red-400 to-pink-400' },
            { format: 'AVI', color: 'from-blue-400 to-cyan-400' },
            { format: 'MOV', color: 'from-green-400 to-emerald-400' },
            { format: 'MP3', color: 'from-yellow-400 to-orange-400' },
            { format: 'WAV', color: 'from-purple-400 to-violet-400' }
          ].map(({ format, color }) => (
            <span
              key={format}
              className={`px-4 py-2 rounded-full text-sm font-semibold text-white/90 bg-gradient-to-r ${color} shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer backdrop-blur-sm border border-white/20`}
            >
              {format}
            </span>
          ))}
        </div>

        {/* Enhanced CTA Button */}
        {!dragActive && (
          <button className="group/btn relative overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400 text-white font-bold py-5 px-10 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-cyan-500/30 border border-white/20">
            <span className="relative z-10 flex items-center space-x-3">
              <span className="text-lg">🎯</span>
              <span className="text-lg">Choose Media File</span>
              <span className="text-lg group-hover/btn:translate-x-1 transition-transform duration-200">→</span>
            </span>
            {/* Button glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-600 opacity-0 group-hover/btn:opacity-50 transition-opacity duration-300 blur-xl"></div>
          </button>
        )}

        {/* Feature highlights */}
        <div className="flex items-center justify-center space-x-6 text-sm text-white/60 pt-4">
          <div className="flex items-center space-x-2">
            <span className="text-green-400">✓</span>
            <span>AI-Powered</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-blue-400">⚡</span>
            <span>Fast Processing</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-purple-400">🔒</span>
            <span>Secure</span>
          </div>
        </div>
      </div>
    </div>
  )
}
