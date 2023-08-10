import { Box, Button } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { socket } from "../socket";

interface VideoPlayerProps {
  url: string;
  sessId: string;
  hideControls?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, sessId, hideControls }) => {
  const [hasJoined, setHasJoined] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [playing, setPlaying] = useState<boolean>(false)
  const player = useRef<ReactPlayer>(null);

  useEffect(() => {
    const handleVideoStateChange = (vidState: { playing: boolean, time: number }) => {
        console.log("Got a message from the server")
        if (player.current && Math.abs(vidState.time - player.current.getCurrentTime()) > 2) {
          setPlaying(vidState.playing);
          player.current?.seekTo(vidState.time, "seconds");
        }
        setPlaying(vidState.playing);
    };

    socket.on('video state change', handleVideoStateChange);

    return () => {
        console.log("VideoPlayer unmounted.")
        socket.off('video state change', handleVideoStateChange);
    };
}, [socket]);

  const handleReady = () => {
    setIsReady(true);
  };

  const handleEnd = () => {
    console.log("Video ended");
  };

  const handlePlay = () => {
    console.log(
      "User played video at time: ",
      player.current?.getCurrentTime()
    );
    setPlaying(true)
    socket.emit('video state change', { sessionId: sessId, state: { playing: true, time: player.current?.getCurrentTime()}})
  };


  const handlePause = () => {
    console.log(
      "User paused video at time: ",
      player.current?.getCurrentTime()
    );
    setPlaying(false)
    socket.emit('video state change', { sessionId: sessId, state: { playing: false, time: player.current?.getCurrentTime()} })
  };

  const handleBuffer = () => {
    console.log("Video buffered");
  };

  const handleProgress = (state: {
    played: number;
    playedSeconds: number;
    loaded: number;
    loadedSeconds: number;
  }) => {
    console.log("Video progress: ", state);
  };

  return (
    <Box
      width="100%"
      height="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
    >
      <Box
        width="100%"
        height="100%"
        display={hasJoined ? "flex" : "none"}
        flexDirection="column"
      >
        <ReactPlayer
          ref={player}
          url={url}
          playing={playing}
          controls={!hideControls}
          onReady={handleReady}
          onEnded={handleEnd}
          onPlay={handlePlay}
          onPause={handlePause}
          onBuffer={handleBuffer}
          onProgress={handleProgress}
          width="100%"
          height="100%"
          style={{ pointerEvents: hideControls ? "none" : "auto" }}
        />
      </Box>
      {!hasJoined && isReady && (
        // Youtube doesn't allow autoplay unless you've interacted with the page already
        // So we make the user click "Join Session" button and then start playing the video immediately after
        // This is necessary so that when people join a session, they can seek to the same timestamp and start watching the video with everyone else
        <Button
          variant="contained"
          size="large"
          onClick={() => {
            setHasJoined(true);
            setPlaying(true);
          }
        }
        >
          Watch Session
        </Button>
      )}
    </Box>
  );
};

export default VideoPlayer;
