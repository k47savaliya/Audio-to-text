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
    
    // Split audio into chunks of 30 seconds (480,000 samples at 16kHz)
    const chunkSize = 16000 * 30 // 30 seconds
    const chunks: Float32Array[] = []
    
    for (let i = 0; i < fullAudio.length; i += chunkSize) {
      const chunk = fullAudio.slice(i, i + chunkSize)
      chunks.push(chunk)
    }
    
    console.log(`Audio split into ${chunks.length} chunks`)
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

    // Save uploaded file temporarily
    console.log('Saving file temporarily...')
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const tempFilePath = path.join(tmpdir(), `upload-${Date.now()}-${file.name}`)
    fs.writeFileSync(tempFilePath, buffer)
    console.log('File saved to:', tempFilePath)

    let audioFilePath = tempFilePath
    let shouldCleanupAudio = false

    try {
      // Check if the file is a video and extract audio if needed
      const fileExtension = file.name.toLowerCase().split('.').pop()
      const videoExtensions = ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm', 'm4v']
      const audioExtensions = ['wav', 'mp3', 'flac', 'm4a', 'aac', 'ogg', 'wma']

      if (videoExtensions.includes(fileExtension || '')) {
        console.log('Video file detected, extracting audio...')
        audioFilePath = await extractAudioFromVideo(tempFilePath)
        shouldCleanupAudio = true
      } else if (!audioExtensions.includes(fileExtension || '')) {
        throw new Error('Unsupported file format. Please upload a video or audio file.')
      }

      // Get transcription pipeline
      console.log('Loading transcription pipeline...')
      const transcriber = await getTranscriptionPipeline()
      console.log('Pipeline loaded, processing audio file...')
      
      // Process the audio file into chunks
      const audioChunks = await processAudioFile(audioFilePath)
      console.log('Audio processed, starting transcription...')
      
      // Transcribe each chunk and combine results
      let fullTranscript = ''
      for (let i = 0; i < audioChunks.length; i++) {
        console.log(`Transcribing chunk ${i + 1}/${audioChunks.length}...`)
        const progress = Math.round(((i + 1) / audioChunks.length) * 100)
        console.log(`Progress: ${progress}%`)
        
        const result = await transcriber(audioChunks[i])
        if (result.text) {
          fullTranscript += result.text + ' '
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