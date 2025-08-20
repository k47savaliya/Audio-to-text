'use client'

import { useState } from 'react'

interface TranscriptionResultProps {
  data: {
    transcript: string
    filename: string
  }
  onNewTranscription: () => void
}

export default function TranscriptionResult({ data, onNewTranscription }: TranscriptionResultProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(data.transcript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const element = document.createElement('a')
    const file = new Blob([data.transcript], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `${data.filename}_transcript.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-8 animate-fade-in shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="text-5xl animate-bounce">✨</div>
            <div className="absolute -inset-2 bg-green-400/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400">
              Transcription Complete!
            </h2>
            <p className="text-cyan-200/80 mt-1 flex items-center space-x-2">
              <span className="text-purple-400">🎬</span>
              <span className="font-medium">Video: {data.filename}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onNewTranscription}
          className="group relative overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/30 border border-white/20"
        >
          <span className="relative z-10 flex items-center space-x-2">
            <span>🔄</span>
            <span className="font-semibold">Upload New Media</span>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-xl"></div>
        </button>
      </div>

      <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/10 shadow-inner">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200 flex items-center space-x-2">
            <span>📜</span>
            <span>Transcript</span>
          </h3>
          <div className="flex space-x-3">
            <button
              onClick={handleCopy}
              className={`group relative overflow-hidden px-5 py-2.5 rounded-lg transition-all duration-300 transform hover:scale-105 font-semibold ${
                copied 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30' 
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-cyan-400/50'
              }`}
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span>{copied ? '✅' : '📋'}</span>
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </span>
              {!copied && (
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-5 py-2.5 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/30 font-semibold border border-white/20"
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span>💾</span>
                <span>Download</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-xl"></div>
            </button>
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          <p className="text-gray-100 leading-relaxed whitespace-pre-wrap text-lg font-medium">
            {data.transcript}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          { 
            icon: '📊', 
            label: 'Words', 
            value: data.transcript.split(' ').length,
            gradient: 'from-blue-400 to-cyan-400'
          },
          { 
            icon: '�', 
            label: 'Characters', 
            value: data.transcript.length,
            gradient: 'from-purple-400 to-pink-400'
          },
          { 
            icon: '⚡', 
            label: 'Processing', 
            value: 'Complete',
            gradient: 'from-green-400 to-emerald-400'
          }
        ].map((stat) => (
          <div 
            key={stat.label}
            className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center transition-all duration-300 hover:scale-105 border border-white/10 hover:border-white/20 shadow-lg"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
              {stat.icon}
            </div>
            <div className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${stat.gradient} mb-1`}>
              {stat.value}
            </div>
            <p className="text-sm text-white/70 font-medium uppercase tracking-wider">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
