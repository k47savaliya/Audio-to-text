// app/api/transcribe/route.ts - App Router API format
import { NextRequest, NextResponse } from 'next/server'
import { pipeline } from '@xenova/transformers'
import fs from 'fs'
import path from 'path'
import { tmpdir } from 'os'
import { WaveFile } from 'wavefile'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'

// Configure ffmpeg path
const ffmpegPath = ffmpegInstaller.path
ffmpeg.setFfmpegPath(ffmpegPath)

let pipe: unknown = null

async function getTranscriptionPipeline() {
  if (pipe === null) {
    // Use whisper-small for better accuracy than tiny
    pipe = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small.en')
  }
  return pipe as {
    (audio: Float32Array): Promise<{ text: string }>
  }
}

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

// Function to process audio file using wavefile with chunking for long audio
async function processAudioFile(filePath: string): Promise<Float32Array[]> {
  try {
    // Read the audio file
    const buffer = fs.readFileSync(filePath)
    
    // Create WaveFile instance and process the audio
    const wav = new WaveFile()
    wav.fromBuffer(buffer)
    
    // Convert to the format required by Whisper
    wav.toBitDepth('32f') // Pipeline expects input as a Float32Array
    wav.toSampleRate(16000) // Whisper expects audio with a sampling rate of 16000
    
    let audioData = wav.getSamples()
    
    // Handle multi-channel audio by merging to mono
    if (Array.isArray(audioData)) {
      if (audioData.length > 1) {
        const SCALING_FACTOR = Math.sqrt(2)
        
        // Merge channels (into first channel to save memory)
        for (let i = 0; i < audioData[0].length; ++i) {
          audioData[0][i] = SCALING_FACTOR * (audioData[0][i] + audioData[1][i]) / 2
        }
      }
      
      // Select first channel
      audioData = audioData[0]
    }
    
    const fullAudio = new Float32Array(audioData as ArrayLike<number>)
    
    // Split audio into chunks of 15 seconds (240,000 samples at 16kHz) - smaller chunks for faster processing
    const chunkSize = 16000 * 15 // 15 seconds
    const chunks: Float32Array[] = []
    
    for (let i = 0; i < fullAudio.length; i += chunkSize) {
      const chunk = fullAudio.slice(i, i + chunkSize)
      chunks.push(chunk)
    }
    
    console.log(`Audio split into ${chunks.length} chunks (${chunkSize / 16000}s each)`)
    return chunks
  } catch (error) {
    console.error('Error processing audio file:', error)
    throw new Error('Failed to process audio file. Please ensure it is a valid audio file.')
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
      console.log('Loading transcription pipeline...')
      let transcriber
      try {
        transcriber = await getTranscriptionPipeline()
        console.log('Pipeline loaded, processing audio file...')
      } catch (pipelineError) {
        console.error('Failed to load transcription pipeline:', pipelineError)
        return NextResponse.json({ 
          error: 'Failed to initialize AI transcription model. Please try again.' 
        }, { status: 500 })
      }
      
      // Process the audio file into chunks
      let audioChunks
      try {
        audioChunks = await processAudioFile(audioFilePath)
        console.log('Audio processed, starting transcription...')
      } catch (audioError) {
        console.error('Audio processing failed:', audioError)
        return NextResponse.json({ 
          error: 'Failed to process audio file. Please ensure it is a valid audio/video file.' 
        }, { status: 400 })
      }
      
      // Transcribe each chunk and combine results
      let fullTranscript = ''
      
      for (let i = 0; i < audioChunks.length; i++) {
        console.log(`Transcribing chunk ${i + 1}/${audioChunks.length}...`)
        const progress = Math.round(((i + 1) / audioChunks.length) * 100)
        console.log(`Progress: ${progress}%`)
        
        try {
          const result = await transcriber(audioChunks[i])
          if (result.text) {
            fullTranscript += result.text + ' '
          }
        } catch (transcribeError) {
          console.error(`Failed to transcribe chunk ${i + 1}:`, transcribeError)
          fullTranscript += '[Error in transcription] '
        }
      }
      
      console.log('Transcription completed')
      
      return NextResponse.json({ 
        transcript: fullTranscript.trim() || 'No transcription generated' 
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