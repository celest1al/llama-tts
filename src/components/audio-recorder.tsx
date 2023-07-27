"use client";

import { useWebSocket } from "@/hooks/use-websocket";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const SST_WEBSOCKET_URL = process.env.NEXT_PUBLIC_SST_WEBSOCKET_URL;

// this component is used to record audio from the microphone
// and send it real time to the server using websocket
export function AudioRecorder() {
  const [stream, setStream] = useState<MediaStream | undefined>(undefined);
  const mediaRecorder = useRef<MediaRecorder>();
  const audioChunks = useRef<Blob[]>([]);
  const [permission, setPermission] = useState<PermissionState | undefined>(
    undefined
  );
  const ws = useWebSocket({ url: `${SST_WEBSOCKET_URL}/ws` });

  const getPermission = async () => {
    if ("MediaRecorder" in window) {
      try {
        const steamData = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        setStream(steamData);
        setPermission("granted");
      } catch (error) {}
    } else {
      alert("MediaRecorder not supported on your browser!");
    }
  };

  const startRecording = () => {
    if (stream) {
      const media = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorder.current = media;
      mediaRecorder.current.start();

      mediaRecorder.current.ondataavailable = (event) => {
        if (typeof event.data === "undefined") return;
        if (event.data.size === 0) return;

        audioChunks.current.push(event.data);
        ws?.send(event.data);
      };
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current?.stop();
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);

        const audio = new Audio(audioUrl);
        audio.play();
        audioChunks.current = [];
      };
    }
  };

  return (
    <div className="flex items-center gap-4 pt-6">
      {permission === "granted" ? (
        <>
          <Button variant={"default"} onClick={startRecording}>
            Start Recording
          </Button>
          <Button variant="destructive" onClick={stopRecording}>
            Stop Recording
          </Button>
        </>
      ) : (
        <Button onClick={getPermission}>Get permission</Button>
      )}
    </div>
  );
}
