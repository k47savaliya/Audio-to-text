# AI Video Transcription App

A beautiful, responsive Next.js application that converts videos to text transcripts using OpenAI's Whisper AI model.

## Features

- 🎥 **Multiple Video Formats**: Support for MP4, AVI, MOV, WMV, FLV
- ⚡ **AI-Powered**: Uses OpenAI's Whisper model for accurate transcription
- 🎨 **Beautiful UI**: Modern gradient design with animations
- 📱 **Responsive**: Works perfectly on desktop and mobile
- 💾 **Easy Download**: Get transcripts as downloadable text files
- 🔄 **Drag & Drop**: Simple file upload with drag and drop support

## Prerequisites

To enable AI transcription with the **free, open-source Whisper model**:

### Install Python & Whisper
1. **Download Python 3.8+** from [python.org](https://python.org)
   - ✅ Check "Add to PATH" during installation

2. **Install Whisper & Dependencies**
   ```bash
   pip install git+https://github.com/openai/whisper.git
   pip install moviepy
   ```

3. **Verify Installation**
   ```bash
   python -c "import whisper; print('Whisper ready!')"
   ```

### Why Open Source Whisper?
- ✅ **Completely Free** - No API costs ever
- ✅ **Works Offline** - No internet required after setup
- ✅ **No File Size Limits** - Process any size video
- ✅ **High Accuracy** - Same quality as OpenAI's hosted service
- ✅ **Privacy First** - Your videos never leave your computer
- ✅ **Multiple Models** - Choose speed vs accuracy (tiny to large)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How to Use

1. **Upload a Video**: Drag and drop a video file or click to browse
2. **Wait for Processing**: The AI will extract audio and transcribe it
3. **Download Transcript**: Copy or download the transcript as a text file

## How It Works

1. **Video Upload**: User uploads a video file through the web interface
2. **Audio Extraction**: The app uses MoviePy to extract audio from the video
3. **AI Transcription**: Whisper AI model transcribes the audio to text
4. **Download**: User can copy or download the transcript as a text file

## Available Whisper Models

- **tiny**: Fastest, least accurate
- **base**: Good balance for most use cases  
- **small**: Default choice (good accuracy, reasonable speed)
- **medium**: Better accuracy, slower
- **large**: Best accuracy, slowest

You can change the model in `/src/app/api/transcribe/route.ts` by modifying the `whisper.load_model()` parameter.

## Troubleshooting

### "Setup Required" Message
If you see setup instructions, Whisper isn't installed yet. Follow these steps:

1. **Check Python Installation**
   ```bash
   python --version
   # Should show Python 3.8 or higher
   ```

2. **Install/Reinstall Whisper**
   ```bash
   pip install --upgrade git+https://github.com/openai/whisper.git
   pip install --upgrade moviepy
   ```

3. **Test Whisper**
   ```bash
   python -c "import whisper; model = whisper.load_model('tiny'); print('Success!')"
   ```

### Common Issues

**"Python not found"**
- Reinstall Python from [python.org](https://python.org)
- Check "Add to PATH" during installation
- Restart your terminal/VS Code

**"No module named 'whisper'"**
- Run: `pip install git+https://github.com/openai/whisper.git`
- Try: `python -m pip install git+https://github.com/openai/whisper.git`

**"MoviePy/FFmpeg errors"**
- Run: `pip install moviepy`
- May need FFmpeg: [Download here](https://ffmpeg.org/download.html)

**Memory/Performance Issues**
- Use smaller models: `tiny` (fastest) → `small` (default) → `large` (best)
- Close other applications during transcription
- Consider upgrading RAM for large videos

### Model Performance Guide
- **tiny**: ~1GB RAM, very fast, good for testing
- **base**: ~1GB RAM, fast, good accuracy
- **small**: ~2GB RAM, balanced (default)
- **medium**: ~5GB RAM, better accuracy
- **large**: ~10GB RAM, best accuracy

## Built With

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **OpenAI Whisper** - AI transcription
- **MoviePy** - Video processing

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
