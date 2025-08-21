// app/api/transcribe/route.ts - App Router API format
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { tmpdir } from 'os'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'

// Configure ffmpeg path
const ffmpegPath = ffmpegInstaller.path
ffmpeg.setFfmpegPath(ffmpegPath)

// Modal endpoint URL
const MODAL_ENDPOINT = 'https://dummmy0102--whisper-transcriber-fastapi-app.modal.run/transcribe'

// Function to extract audio from video using ffmpeg
async function extractAudioFromVideo(videoPath: string): Promise<string> {
  const audioPath = path.join(tmpdir(), `audio-${Date.now()}.wav`)
  
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('pcm_s16le')
      .audioFrequency(16000) // Whisper expects 16kHz
      .format('wav')
      .on('end', () => {
        console.log('Audio extraction completed')
        resolve(audioPath)
      })
      .on('error', (err: Error) => {
        console.error('FFmpeg error:', err)
        reject(err)
      })
      .save(audioPath)
  })
}

// Function to send audio file to Modal endpoint
async function transcribeWithModal(audioFilePath: string): Promise<string> {
  try {
    // Read the audio file
    const audioBuffer = fs.readFileSync(audioFilePath)
    
    // Create form data
    const formData = new FormData()
    const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' })
    formData.append('file', audioBlob, 'audio.wav')
    
    console.log('Sending audio to Modal endpoint...')
    
    // Send to Modal endpoint
    const response = await fetch(MODAL_ENDPOINT, {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Modal API error: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    console.log('Modal transcription completed')
    
    return result.transcription || 'No transcription received'
  } catch (error) {
    console.error('Modal transcription error:', error)
    throw new Error(`Failed to transcribe with Modal: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('API called - parsing form data...')
    
    const formData = await request.formData()
    console.log('Form data keys:', Array.from(formData.keys()))
    
    const file = formData.get('file') as File
    console.log('File received:', file ? `${file.name} (${file.size} bytes)` : 'null')
    
    if (!file) {
      console.log('No file found in form data')
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (file.size === 0) {
      console.log('File is empty')
      return NextResponse.json({ error: 'Uploaded file is empty' }, { status: 400 })
    }

    // Check file size limit (Vercel has limits)
    const maxSize = 50 * 1024 * 1024 // 50MB limit
    if (file.size > maxSize) {
      console.log('File too large:', file.size)
      return NextResponse.json({ 
        error: 'File too large. Please upload a file smaller than 50MB.' 
      }, { status: 400 })
    }

    // Save uploaded file temporarily
    console.log('Saving file temporarily...')
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const tempFilePath = path.join(tmpdir(), `upload-${Date.now()}-${file.name}`)
    
    try {
      fs.writeFileSync(tempFilePath, buffer)
      console.log('File saved to:', tempFilePath)
    } catch (writeError) {
      console.error('Failed to write temporary file:', writeError)
      return NextResponse.json({ 
        error: 'Failed to save uploaded file. Please try again.' 
      }, { status: 500 })
    }

    let audioFilePath = tempFilePath
    let shouldCleanupAudio = false

    try {
      // Check if the file is a video and extract audio if needed
      const fileExtension = file.name.toLowerCase().split('.').pop()
      const videoExtensions = ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm', 'm4v']
      const audioExtensions = ['wav', 'mp3', 'flac', 'm4a', 'aac', 'ogg', 'wma']

      if (videoExtensions.includes(fileExtension || '')) {
        console.log('Video file detected, extracting audio...')
        try {
          audioFilePath = await extractAudioFromVideo(tempFilePath)
          shouldCleanupAudio = true
        } catch (ffmpegError) {
          console.error('FFmpeg extraction failed:', ffmpegError)
          return NextResponse.json({ 
            error: 'Failed to extract audio from video. Please try uploading an audio file instead or ensure the video format is supported.' 
          }, { status: 400 })
        }
      } else if (!audioExtensions.includes(fileExtension || '')) {
        return NextResponse.json({ 
          error: 'Unsupported file format. Please upload a video or audio file.' 
        }, { status: 400 })
      }

      // Get transcription pipeline
      console.log('Processing with Modal Whisper API...')
      let transcript
      try {
        transcript = await transcribeWithModal(audioFilePath)
        console.log('Modal transcription completed')
      } catch (modalError) {
        console.error('Failed to transcribe with Modal:', modalError)
        return NextResponse.json({ 
          error: 'Failed to transcribe audio. Please try again.' 
        }, { status: 500 })
      }
      
      console.log('Transcription completed')
      
      return NextResponse.json({ 
        transcript: transcript || 'No transcription generated' 
      })

    } catch (transcriptionError: unknown) {
      console.error('Transcription error:', transcriptionError)
      const errorMessage = transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error'
      return NextResponse.json(
        { error: 'Transcription failed', details: errorMessage },
        { status: 500 }
      )
    } finally {
      // Clean up temporary files
      try {
        fs.unlinkSync(tempFilePath)
        if (shouldCleanupAudio && audioFilePath !== tempFilePath) {
          fs.unlinkSync(audioFilePath)
        }
      } catch (e) {
        console.warn('Failed to clean up temporary files:', e)
      }
    }

  } catch (error: unknown) {
    console.error('API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Server error', details: errorMessage },
      { status: 500 }
    )
  }
}