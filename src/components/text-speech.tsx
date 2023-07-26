"use client";

import { useCallback, useEffect, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { browserCheck } from "@/lib/browser-check";
import { getDefaultVoice } from "@/lib/default-voice";

type LlamaParams = {
  message: string;
  signal?: AbortSignal;
  cb: (message: string) => void;
};

const fetchLlamaData = async ({ message, signal, cb }: LlamaParams) => {
  try {
    const response = await fetch(
      "https://llm.getlumina.com/v1/chat/completions",
      {
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
      }
    );

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
  const [voice, setVoice] = useState<SpeechSynthesisVoice | undefined>(
    undefined
  );
  const [isRendered, setIsRendered] = useState(false);

  const handleSubmit = async () => {
    return await fetchLlamaData({
      message: text,
      cb: (message) => {
        setLlamaResponse(message);
        onSpeechLlamaResponse(message.trim());
        setText("");
      },
    });
  };

  const onSpeechLlamaResponse = useCallback(
    async (message: string) => {
      const utterance = new SpeechSynthesisUtterance(message);

      const defaultVoice = getDefaultVoice();

      utterance.lang = "en-US";
      utterance.voice = voice ?? defaultVoice;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      speechSynthesis.speak(utterance);
    },
    [voice]
  );

  const onHandleVoiceChange = (val: string) => {
    const voices = window.speechSynthesis.getVoices();
    setVoice(voices.find((v) => v.name === val));
  };

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      return await fetchLlamaData({
        message: "",
        signal: abortController.signal,
        cb: (message) => {
          setLlamaResponse(message);
          onSpeechLlamaResponse(message);
        },
      });
    };

    fetchData();

    return () => {
      abortController.abort();
    };
  }, [onSpeechLlamaResponse]);

  useEffect(() => {
    setIsRendered(true);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 sm:w-[480px] pt-10">
      <form className="flex items-center gap-2">
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
      </form>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} />
      <Button onClick={handleSubmit}>Submit</Button>
      {llamaResponse && <p>{llamaResponse}</p>}
    </div>
  );
}
