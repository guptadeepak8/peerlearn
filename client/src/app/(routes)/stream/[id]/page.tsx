"use client";

import { use, useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import MonacoEditor from "react-monaco-editor";
import * as monacoEditor from "monaco-editor";
import * as mediasoupClient from "mediasoup-client";
import io, { Socket } from "socket.io-client";
import debounce from "lodash.debounce";
import { Volume2 } from "lucide-react"; // You can replace with any speaker icon

const socket: Socket = io("http://localhost:4000");

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params);
  const [code, setCode] = useState("// Start coding...");
  const [users, setUsers] = useState<string[]>([]);

  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const sendTransportRef = useRef<mediasoupClient.types.Transport>(null);
  const recvTransportRef = useRef<mediasoupClient.types.Transport>(null);
  const lastSentCodeRef = useRef<string>("");

  useEffect(() => {
    socketRef.current = socket;

    const joinRoom = async () => {
      socket.emit("join-room", roomId);

      socket.on("user-list", (userList: string[]) => {
        setUsers(userList);
      });

      const rtpCapabilities:mediasoupClient.types.RtpCapabilities = await new Promise((res) => {
        socket.emit("get-rtp-capabilities", res);
      });

      const device = new mediasoupClient.Device();
      await device.load({ routerRtpCapabilities: rtpCapabilities });
      deviceRef.current = device;

      const sendTransportParams:mediasoupClient.types.TransportOptions = await new Promise((res) => {
        socket.emit("create-transport", res);
      });

      const sendTransport = device.createSendTransport(sendTransportParams);
      sendTransportRef.current = sendTransport;

      sendTransport.on("connect", ({ dtlsParameters }, callback) => {
        socket.emit("connect-transport", { dtlsParameters });
        callback();
      });

      sendTransport.on("produce", ({ kind, rtpParameters }, callback) => {
        socket.emit("produce", { kind, rtpParameters }, ({ id }: { id: string }) => {
          callback({ id });
        });
      });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const track = stream.getAudioTracks()[0];
      await sendTransport.produce({ track });

      socket.on("new-producer", async ({ producerId }) => {
        if (!device.canProduce("audio")) return;

        if (!recvTransportRef.current) {
          const recvTransportParams:mediasoupClient.types.TransportOptions = await new Promise((res) =>
            socket.emit("create-transport", res)
          );

          const recvTransport = device.createRecvTransport(recvTransportParams);
          recvTransportRef.current = recvTransport;

          recvTransport.on("connect", ({ dtlsParameters }, callback) => {
            socket.emit("connect-transport", { dtlsParameters });
            callback();
          });
        }

        const consumerParams:mediasoupClient.types.Consumer = await new Promise((res) =>
          socket.emit("consume", {
            producerId,
            rtpCapabilities: device.rtpCapabilities,
          }, res)
        );

        const consumer = await recvTransportRef.current.consume(consumerParams);
        const audio = document.createElement("audio");
        audio.srcObject = new MediaStream([consumer.track]);
        audio.autoplay = true;
        document.body.appendChild(audio);
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
      {/* Sidebar */}
      <div className="w-60 bg-gray-900 text-white p-4 border-r border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Users</h2>
        <ul className="space-y-2">
          {users.map((userId) => (
            <li key={userId} className="flex items-center gap-2 text-sm truncate">
              <Volume2 className="w-4 h-4 text-green-400" />
              <span>{userId}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <div className="p-4 border-b border-gray-700 text-white bg-gray-800">
          Room ID: {roomId}
        </div>
        <MonacoEditor
          height="calc(100vh - 48px)"
          language="javascript"
          theme="vs-dark"
          value={code}
          onChange={onCodeChange}
          editorDidMount={(editor) => {
            editorRef.current = editor;
          }}
        />
      </div>
    </div>
  );
}
