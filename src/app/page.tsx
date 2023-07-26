import { AudioRecorder } from "@/components/audio-recorder";
import { TextSpeech } from "@/components/text-speech";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className='text-2xl font-medium'>Lumina Text-to-Speech</h1>
      {/* <AudioRecorder /> */}
      <TextSpeech />
    </main>
  )
}
