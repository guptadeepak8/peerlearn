import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

export default function UserMediaCard({
  userId,
  stream,
}: {
  userId: string;
  stream: MediaStream;
}) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Card className="bg-gray-800 text-white overflow-hidden">
      <CardHeader className="flex items-center gap-3 pb-1">
        <Avatar>
          <AvatarFallback>{userId.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-sm truncate">{userId}</CardTitle>
      </CardHeader>

      <div className="relative aspect-video w-full bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!micOn} // only mute locally if mic is off
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            camOn ? "opacity-100" : "opacity-0"
          }`}
        />
        {!camOn && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs bg-black/70">
            Camera Off
          </div>
        )}
      </div>

      <CardContent className="flex justify-between items-center mt-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMicOn(!micOn)}
          className="text-white hover:text-green-400"
        >
          {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCamOn(!camOn)}
          className="text-white hover:text-blue-400"
        >
          {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </Button>
      </CardContent>
    </Card>
  );
}
