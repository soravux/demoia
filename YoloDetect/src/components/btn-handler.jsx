import { useState, useRef } from "react";
import { Webcam } from "../utils/webcam";
import ExampleThumbnails from "./example-thumbnails";

/**
 * ButtonHandler component handles the opening and closing of image, video, and webcam streams.
 */
const ButtonHandler = ({ imageRef, cameraRef, videoRef }) => {
  const [streaming, setStreaming] = useState(null); // streaming state
  const inputImageRef = useRef(null); // video input reference
  const inputVideoRef = useRef(null); // video input reference
  const webcam = new Webcam(); // webcam handler

  // closing image
  const closeImage = () => {
    const url = imageRef.current.src;
    imageRef.current.src = "#"; // restore image source
    URL.revokeObjectURL(url); // revoke url

    setStreaming(null); // set streaming to null
    inputImageRef.current.value = ""; // reset input image
    imageRef.current.style.display = "none"; // hide image
  };

  // closing video streaming
  const closeVideo = () => {
    const url = videoRef.current.src;
    videoRef.current.src = ""; // restore video source
    URL.revokeObjectURL(url); // revoke url

    setStreaming(null); // set streaming to null
    inputVideoRef.current.value = ""; // reset input video
    videoRef.current.style.display = "none"; // hide video
  };

  // handle example image selection
  const handleExampleImageSelect = (imagePath) => {
    if (streaming === "image") closeImage(); // close current image if any
    if (streaming === "video") closeVideo(); // close current video if any
    
    imageRef.current.src = imagePath; // set image source
    imageRef.current.style.display = "block"; // show image
    setStreaming("image"); // set streaming to image
  };

  // handle example video selection
  const handleExampleVideoSelect = (videoPath) => {
    if (streaming === "image") closeImage(); // close current image if any
    if (streaming === "video") closeVideo(); // close current video if any
    
    videoRef.current.src = videoPath; // set video source
    videoRef.current.addEventListener("ended", () => closeVideo()); // add ended video listener
    videoRef.current.style.display = "block"; // show video
    setStreaming("video"); // set streaming to video
  };

  return (
    <div className="btn-container">
      {/* Image Handler */}
      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const url = URL.createObjectURL(e.target.files[0]); // create blob url
          imageRef.current.src = url; // set video source
          imageRef.current.style.display = "block"; // show video
          setStreaming("image"); // set streaming to video
        }}
        ref={inputImageRef}
      />
      <button
        onClick={() => {
          // if not streaming
          if (streaming === null) inputImageRef.current.click();
          // closing image streaming
          else if (streaming === "image") closeImage();
          else
            alert(
              `Impossible de gérer plus d'un flux\nFlux actuel : ${streaming}`
            ); // if streaming video or webcam
        }}
      >
        {streaming === "image" ? "Fermer" : "Ouvrir"} Image
      </button>

      {/* Video Handler */}
      <input
        type="file"
        accept="video/*"
        style={{ display: "none" }}
        onChange={(e) => {
          if (streaming === "image") closeImage(); // closing image streaming
          const url = URL.createObjectURL(e.target.files[0]); // create blob url
          videoRef.current.src = url; // set video source
          videoRef.current.addEventListener("ended", () => closeVideo()); // add ended video listener
          videoRef.current.style.display = "block"; // show video
          setStreaming("video"); // set streaming to video
        }}
        ref={inputVideoRef}
      />
      <button
        onClick={() => {
          // if not streaming
          if (streaming === null || streaming === "image")
            inputVideoRef.current.click();
          // closing video streaming
          else if (streaming === "video") closeVideo();
          else
            alert(
              `Impossible de gérer plus d'un flux\nFlux actuel : ${streaming}`
            ); // if streaming webcam
        }}
      >
        {streaming === "video" ? "Fermer" : "Ouvrir"} Video
      </button>

      {/* Example Thumbnails */}
      <ExampleThumbnails 
        onImageSelect={handleExampleImageSelect}
        onVideoSelect={handleExampleVideoSelect}
      />

    </div>
  );
};

export default ButtonHandler;
