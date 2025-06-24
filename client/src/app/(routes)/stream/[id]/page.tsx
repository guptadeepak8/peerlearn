"use client";

import { use, useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import * as monacoEditor from "monaco-editor";
import * as mediasoupClient from "mediasoup-client";
import io, { Socket } from "socket.io-client";
import debounce from "lodash.debounce";
import { SidebarUsers } from "@/components/room/SidebarUsers";
import { RoomEditor } from "@/components/room/roomEditor";

const socket: Socket = io("http://localhost:4000");

export default function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: roomId } = use(params);
  const [code, setCode] = useState("// Start coding...");
  const [users, setUsers] = useState<string[]>([]);
  const [userMediaStreams, setUserMediaStreams] = useState<
    Record<string, MediaStream>
  >({});

  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const SocketIdRef = useRef<string | null>(null);
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(
    null
  );
  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const sendTransportRef = useRef<mediasoupClient.types.Transport>(null);
  const recvTransportRef = useRef<mediasoupClient.types.Transport>(null);
  const lastSentCodeRef = useRef<string>("");

  useEffect(() => {
    socketRef.current = socket;
    if (typeof socket.id === "string") {
      SocketIdRef.current = socket.id;
    }
    const joinRoom = async () => {
      socket.emit("join-room", roomId);

      socket.on("user-list", (userList: string[]) => {
        setUsers(userList);
      });

      const rtpCapabilities: mediasoupClient.types.RtpCapabilities =
        await new Promise((res) => {
          socket.emit("get-rtp-capabilities", res);
        });

      const device = new mediasoupClient.Device();
      await device.load({ routerRtpCapabilities: rtpCapabilities });
      deviceRef.current = device;

      const sendTransportParams: mediasoupClient.types.TransportOptions =
        await new Promise((res) => {
          socket.emit("create-transport", res);
        });

      const sendTransport = device.createSendTransport(sendTransportParams);
      sendTransportRef.current = sendTransport;

      sendTransport.on("connect", ({ dtlsParameters }, callback) => {
        socket.emit("connect-transport", { dtlsParameters });
        callback();
      });

      sendTransport.on("produce", ({ kind, rtpParameters }, callback) => {
        socket.emit(
          "produce",
          { kind, rtpParameters },
          ({ id }: { id: string }) => {
            callback({ id });
          }
        );
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];

      await sendTransport.produce({ track: audioTrack });
      await sendTransport.produce({ track: videoTrack });
      if (SocketIdRef.current) {
        setUserMediaStreams((prev) => ({
          ...prev,
          [SocketIdRef.current!]: stream,
        }));
      }

      socket.on("new-producer", async ({ producerId, userId, kind }) => {
        if (!recvTransportRef.current) {
          const recvTransportParams: mediasoupClient.types.TransportOptions =
            await new Promise((res) => socket.emit("create-transport", res));

          const recvTransport = device.createRecvTransport(recvTransportParams);
          recvTransportRef.current = recvTransport;

          recvTransport.on("connect", ({ dtlsParameters }, callback) => {
            socket.emit("connect-transport", { dtlsParameters });
            callback();
          });
        }

        const consumerParams: mediasoupClient.types.Consumer =
          await new Promise((res) =>
            socket.emit(
              "consume",
              {
                producerId,
                userId,
                kind,
                rtpCapabilities: device.rtpCapabilities,
              },
              res
            )
          );

        const consumer = await recvTransportRef.current.consume(consumerParams);
        const mediaStream = new MediaStream([consumer.track]);
        setUserMediaStreams((prev) => {
          const stream = prev[userId] || new MediaStream();
          stream.addTrack(consumer.track);
          return { ...prev, [userId]: mediaStream };
        });
      });
    };

    joinRoom();

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    const handleCodeUpdate = (incomingCode: string) => {
      if (!editorRef.current) return;
      if (incomingCode === lastSentCodeRef.current) return;

      const editor = editorRef.current;
      const position = editor.getPosition();
      editor.setValue(incomingCode);

      if (position) {
        editor.setPosition(position);
        editor.focus();
      }

      setCode(incomingCode);
    };

    socket.on("code-update", handleCodeUpdate);
    return () => {
      socket.off("code-update", handleCodeUpdate);
    };
  }, []);

  const emitCodeChange = useRef(
    debounce((updatedCode: string) => {
      lastSentCodeRef.current = updatedCode;
      socket.emit("code-update", { roomId, code: updatedCode });
    }, 100)
  ).current;

  const onCodeChange = (newCode: string) => {
    setCode(newCode);
    emitCodeChange(newCode);
  };

  return (
    <div className="flex h-screen">
      <SidebarUsers users={users} userMediaStreams={userMediaStreams} />
      <RoomEditor
        code={code}
        onCodeChange={onCodeChange}
        editorRef={editorRef}
      />
    </div>
  );
}
