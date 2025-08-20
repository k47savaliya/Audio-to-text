// app/api/transcribe-progress/route.ts - SSE endpoint for progress updates
import { NextRequest } from 'next/server'
import { getProgress, deleteProgress } from '@/lib/progress-store'

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId')
  
  if (!sessionId) {
    return new Response('Session ID required', { status: 400 })
  }

  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      const sendProgress = () => {
        const progress = getProgress(sessionId)
        const data = `data: ${JSON.stringify({ progress })}\n\n`
        controller.enqueue(encoder.encode(data))
        
        if (progress >= 100) {
          deleteProgress(sessionId)
          controller.close()
          return
        }
        
        setTimeout(sendProgress, 1000) // Check every second
      }
      
      sendProgress()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
