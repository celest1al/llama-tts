import { useEffect, useRef } from "react";

type UseWebSocketProps = {
  url: string;
};

export function useWebSocket({ url }: UseWebSocketProps) {
  const socket = useRef<WebSocket>();

  useEffect(() => {
    socket.current = new WebSocket(url);
    socket.current.binaryType = "arraybuffer";

    socket.current.onopen = () => {
      console.log("WebSocket client connected on ", url);
    };

    socket.current.onclose = () => {
      console.log("WebSocket client disconnected");
    };

    return () => {
      socket.current?.close();
    };
  }, [url]);

  return socket.current;
}
