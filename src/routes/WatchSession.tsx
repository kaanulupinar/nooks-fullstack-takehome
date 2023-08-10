import { useEffect, useState } from "react";
import VideoPlayer from "../components/VideoPlayer";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, TextField, Tooltip } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { socket } from "../socket";

const WatchSession: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [url, setUrl] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState<string>("");

  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    socket.connect();

    socket.emit("join session", sessionId);

    socket.on("session joined", (sessionDetails) => {
      console.log("Joined session with details:", sessionDetails);
      setUrl(sessionDetails.youtubeUrl);
      setInputUrl(sessionDetails.youtubeUrl);
    });

    socket.on("video url change", (url) => {
      console.log("Video url changed to ", url);
      setUrl(url);
      setInputUrl(url);
    });

    socket.on("error", () => {
      console.log("Tried to join nonexistent session.")
      navigate("/")
    })

    return () => {
      socket.off("session joined")
      socket.off("error")
      socket.off("video url change")
      socket.disconnect();
    }
  }, [sessionId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputUrl(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputUrl) {
        setUrl(inputUrl);
        socket.emit("video url change", ({ sessionId: sessionId, url: inputUrl}));
    }
  };

  if (!!url && !!sessionId) {
    return (
      <>
        <Box
          width="100%"
          maxWidth={1000}
          display="flex"
          gap={1}
          marginTop={1}
          alignItems="center"
        >
          <TextField
            label="Youtube URL"
            variant="outlined"
            value={inputUrl}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            fullWidth
          />
          <Tooltip title={linkCopied ? "Link copied" : "Copy link to share"}>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
              }}
              disabled={linkCopied}
              variant="contained"
              sx={{ whiteSpace: "nowrap", minWidth: "max-content" }}
            >
              <LinkIcon />
            </Button>
          </Tooltip>
          <Tooltip title="Create new watch party">
            <Button
              onClick={() => {
                navigate("/create");
              }}
              variant="contained"
              sx={{ whiteSpace: "nowrap", minWidth: "max-content" }}
            >
              <AddCircleOutlineIcon />
            </Button>
          </Tooltip>
        </Box>
        <VideoPlayer url={url} sessId={sessionId} />;
      </>
    );
  }

  return null;
};

export default WatchSession;
