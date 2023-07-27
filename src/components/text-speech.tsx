"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "./ui/select";
// import { getDefaultVoice } from "@/lib/default-voice";
// import { Slider } from "./ui/slider";
// import { useWebSocket } from "@/hooks/use-websocket";
import { PCMPlayer, PCMPlayerOption } from "@/lib/pcm-player";

type LlamaParams = {
  message: string;
  signal?: AbortSignal;
  cb: (message: string) => void;
};

const LLAMA_BASE_URL = process.env.NEXT_PUBLIC_LLAMA_BASE_URL;
const TTS_WEBSOCKET_URL = process.env.NEXT_PUBLIC_TTS_WEBSOCKET_URL;

const playerOptions: PCMPlayerOption = {
  encoding: '16bitInt',
  channels: 1,
  sampleRate: 22050,
  flushingTime: 100
}

const player = new PCMPlayer(playerOptions)

const fetchLlamaData = async ({ message, signal, cb }: LlamaParams) => {
  try {
    const response = await fetch(`${LLAMA_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      body: JSON.stringify({
        messages: [
          {
            content: "You are a helpful assistant.",
            role: "system",
          },
          {
            content: message,
            role: "user",
          },
        ],
      }),
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
      },
      mode: "cors",
      redirect: "follow",
      referrer: "no-referrer",
      signal: signal,
    });

    const data = await response.json();

    if (data) {
      cb(data.choices[0].message.content.trim());
    }
  } catch (error) {
    console.log(error);
  }
};

export function TextSpeech() {
  const [text, setText] = useState<string>("");
  const [llamaResponse, setLlamaResponse] = useState<string>("");
  // const [voice, setVoice] = useState<SpeechSynthesisVoice | undefined>(
  //   undefined
  // );
  // const [isRendered, setIsRendered] = useState(false);
  // const [volume, setVolume] = useState([1]);
  // const [pitch, setPitch] = useState([1]);
  // const [rate, setRate] = useState([1]);
  const ttsWebSocket = useRef<WebSocket | null>(null);

  const handleSubmit = async () => {
    return await fetchLlamaData({
      message: text,
      cb: (message) => {
        setLlamaResponse(message);
        // onSpeechLlamaResponse(message.trim());
        ttsWebSocket?.current?.send(message.trim());
        setText("");
      },
    });
  };

  // const onSpeechLlamaResponse = useCallback(
  //   async (message: string) => {
  //     const utterance = new SpeechSynthesisUtterance(message);

  //     const defaultVoice = getDefaultVoice();

  //     utterance.lang = "en-US";
  //     utterance.voice = voice ?? defaultVoice;
  //     utterance.rate = rate[0];
  //     utterance.pitch = pitch[0];
  //     utterance.volume = volume[0];

  //     speechSynthesis.speak(utterance);
  //   },
  //   [pitch, rate, voice, volume]
  // );

  // const onHandleVoiceChange = (val: string) => {
  //   const voices = window.speechSynthesis.getVoices();
  //   setVoice(voices.find((v) => v.name === val));
  // };

  const sendDataToWebSocket = useCallback((message: string) => {
    ttsWebSocket?.current?.send(message.trim());
  }, [ttsWebSocket])

  useEffect(() => {
    ttsWebSocket.current = new WebSocket(`${TTS_WEBSOCKET_URL}/ws`);
    ttsWebSocket.current.binaryType = "arraybuffer";

    ttsWebSocket.current.onopen = () => {
      console.log("WebSocket client connected on ", `${TTS_WEBSOCKET_URL}/ws`);
    };

    ttsWebSocket.current.onclose = () => {
      console.log("WebSocket client disconnected");
    };

    ttsWebSocket.current.onmessage = (event) => {
      console.log("WebSocket client received a message", event);
      let data = new Uint8Array(event.data);
      player.feed(data)
    }

    return () => {
      ttsWebSocket.current?.close();
    };
  }, [])

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      return await fetchLlamaData({
        message: "",
        signal: abortController.signal,
        cb: (message) => {
          setLlamaResponse(message);
          sendDataToWebSocket(message)
        },
      });
    };

    fetchData();

    return () => {
      abortController.abort();
    };
  }, [sendDataToWebSocket]);

  // useEffect(() => {
  //   setIsRendered(true);
  // }, []);

  return (
    <div className="flex flex-col items-center gap-3 sm:w-[480px] pt-10">
      {/* <form className="flex gap-5">
        <Select onValueChange={(val) => onHandleVoiceChange(val)}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a voice" />
          </SelectTrigger>
          <SelectContent>
            {isRendered &&
              window?.speechSynthesis.getVoices().map((voice, idx) => (
                <SelectItem key={idx} value={voice?.name}>
                  {voice?.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <div className="flex flex-col gap-2 w-[80px]">
          <label htmlFor="volume" className="text-xs">
            Volume
          </label>
          <Slider
            className="w-full"
            id="volume"
            min={0}
            max={1}
            step={0.1}
            value={volume}
            onValueChange={(val) => setVolume(val)}
          />
        </div>
        <div className="flex flex-col gap-2 w-[80px]">
          <label htmlFor="pitch" className="text-xs">
            Pitch
          </label>
          <Slider
            className="w-full"
            id="pitch"
            min={0}
            max={2}
            step={0.1}
            value={pitch}
            onValueChange={(val) => setPitch(val)}
          />
        </div>
        <div className="flex flex-col gap-2 w-[80px]">
          <label htmlFor="rate" className="text-xs">
            Speed
          </label>
          <Slider
            className="w-full"
            id="rate"
            min={0.1}
            max={10}
            step={0.1}
            value={rate}
            onValueChange={(val) => setRate(val)}
          />
        </div>
      </form> */}
      <Textarea value={text} onChange={(e) => setText(e.target.value)} />
      <Button onClick={handleSubmit}>Submit</Button>
      {llamaResponse && <p>{llamaResponse}</p>}
    </div>
  );
}
