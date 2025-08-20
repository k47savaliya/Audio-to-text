'use client'

import { useState } from 'react'
import VideoUpload from '@/components/VideoUpload'
import TranscriptionResult from '@/components/TranscriptionResult'

interface TranscriptionData {
  transcript: string
  filename: string
}

export default function Home() {
  const [transcriptionData, setTranscriptionData] = useState<TranscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow delay-75"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow delay-150"></div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-12 animate-slide-up">
          <div className="mb-6">
            <h1 className="text-6xl md:text-8xl font-black mb-4 animate-gradient-text">
              AI Video Transcription
            </h1>
            <div className="h-1 w-32 bg-gradient-to-r from-cyan-400 to-purple-400 mx-auto rounded-full"></div>
          </div>
          <p className="text-xl md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 via-white to-purple-100 max-w-3xl mx-auto leading-relaxed font-medium">
            Transform your videos into accurate text transcripts with the power of AI. 
            <br />
            <span className="text-cyan-300 font-semibold">Upload any media file</span> and get instant, downloadable transcriptions.
          </p>
          
          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {[
              { icon: '🤖', text: 'AI-Powered', color: 'from-blue-400 to-cyan-400' },
              { icon: '⚡', text: 'Lightning Fast', color: 'from-yellow-400 to-orange-400' },
              { icon: '🎯', text: '99% Accurate', color: 'from-green-400 to-emerald-400' },
              { icon: '🔒', text: 'Secure', color: 'from-purple-400 to-pink-400' }
            ].map((feature, index) => (
              <div
                key={feature.text}
                className={`group flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="text-lg">{feature.icon}</span>
                <span className={`text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r ${feature.color}`}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {!transcriptionData ? (
            <VideoUpload 
              onTranscriptionComplete={setTranscriptionData}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          ) : (
            <TranscriptionResult 
              data={transcriptionData}
              onNewTranscription={() => setTranscriptionData(null)}
            />
          )}
        </div>

        {/* Features section */}
        {!isLoading && !transcriptionData && (
          <div className="mt-16 animate-slide-up">
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <div className="text-4xl mb-4">🎥</div>
                <h3 className="text-xl font-semibold text-white mb-2">Multiple Formats</h3>
                <p className="text-gray-300">Support for MP4, AVI, MOV, and more video formats</p>
              </div>
              <div className="text-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold text-white mb-2">Fast Processing</h3>
                <p className="text-gray-300">AI-powered transcription with high accuracy and speed</p>
              </div>
              <div className="text-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <div className="text-4xl mb-4">📄</div>
                <h3 className="text-xl font-semibold text-white mb-2">Easy Download</h3>
                <p className="text-gray-300">Get your transcript as a downloadable text file</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
