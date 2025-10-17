import { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
//import "@tensorflow/tfjs-backend-webgl"; // set backend to webgl
import "@tensorflow/tfjs-backend-webgpu";
import Loader from "./components/loader";
import ButtonHandler from "./components/btn-handler";
import DetectionTable from "./components/detection-table";
import { detect, detectVideo } from "./utils/detect";
import "./style/App.css";

tf.setBackend("webgpu"); // set backend to webgpu

/**
 * App component for YOLO Live Detection Application.
 *
 * This component initializes and loads a YOLO model using TensorFlow.js,
 * sets up references for image, camera, video, and canvas elements, and
 * handles the loading state and model configuration.
 */
const App = () => {
  const [loading, setLoading] = useState({ loading: true, progress: 0 }); // loading state
  const [model, setModel] = useState({
    net: null,
    inputShape: [1, 0, 0, 3],
  }); // init model & input shape
  const [modelName, setModelName] = useState("yolo11n"); // selected model name
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.45); // confidence threshold
  const [activeSource, setActiveSource] = useState(null); // track which source is currently active
  const [detectionCounts, setDetectionCounts] = useState({}); // track detection counts

  // references
  const imageRef = useRef(null);
  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    tf.ready().then(async () => {
      setLoading({ loading: true, progress: 0 });
      const yolo = await tf.loadGraphModel(
        `${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'))}/${modelName}_web_model/model.json`,
        {
          onProgress: (fractions) => {
            setLoading({ loading: true, progress: fractions }); // set loading fractions
          },
        }
      ); // load model

      // warming up model
      const dummyInput = tf.ones(yolo.inputs[0].shape);
      const warmupResults = yolo.execute(dummyInput);

      setLoading({ loading: false, progress: 1 });
      setModel({
        net: yolo,
        inputShape: yolo.inputs[0].shape,
      }); // set model & input shape

      tf.dispose([warmupResults, dummyInput]); // cleanup memory
    });
  }, [modelName]); // reload model when modelName changes

  // Effect to trigger re-detection when confidence threshold changes
  useEffect(() => {
    if (!loading.loading && model.net && activeSource) {
      // Re-run detection with new confidence threshold
      if (activeSource === 'image' && imageRef.current && imageRef.current.src !== '#') {
        detect(imageRef.current, model, canvasRef.current, (counts) => {
          setDetectionCounts(counts);
        }, confidenceThreshold);
      } else if (activeSource === 'camera' && cameraRef.current && cameraRef.current.videoWidth > 0) {
        detectVideo(cameraRef.current, model, canvasRef.current, confidenceThreshold, setDetectionCounts);
      } else if (activeSource === 'video' && videoRef.current && videoRef.current.videoWidth > 0) {
        detectVideo(videoRef.current, model, canvasRef.current, confidenceThreshold, setDetectionCounts);
      }
    }
  }, [confidenceThreshold, loading.loading, model, activeSource]);

  return (
    <div className="App">
      {loading.loading && (
        <Loader>Chargement du modèle en cours... {(loading.progress * 100).toFixed(2)}%</Loader>
      )}
      <div className="header">
        <h1>Modèle d'intelligence artificielle de détection d'objets</h1>
        
        <div className="confidence-control">
          <label htmlFor="confidence-slider">
            Seuil de confiance: {(confidenceThreshold * 100).toFixed(0)}%
          </label>
          <input
            id="confidence-slider"
            type="range"
            min="0.01"
            max="0.9"
            step="0.01"
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
            className="confidence-slider"
          />
        </div>
      </div>

      <div className="content">
        <img
          src="#"
          ref={imageRef}
          onLoad={() => {
            setActiveSource('image');
            detect(imageRef.current, model, canvasRef.current, (counts) => {
              setDetectionCounts(counts);
            }, confidenceThreshold);
          }}
        />
        <video
          autoPlay
          muted
          ref={cameraRef}
          onPlay={() => {
            setActiveSource('camera');
            detectVideo(cameraRef.current, model, canvasRef.current, confidenceThreshold, setDetectionCounts);
          }}
        />
        <video
          autoPlay
          muted
          ref={videoRef}
          onPlay={() => {
            setActiveSource('video');
            detectVideo(videoRef.current, model, canvasRef.current, confidenceThreshold, setDetectionCounts);
          }}
        />
        <canvas
          width={model.inputShape[1]}
          height={model.inputShape[2]}
          ref={canvasRef}
        />
      </div>

      <ButtonHandler
        imageRef={imageRef}
        cameraRef={cameraRef}
        videoRef={videoRef}
      />
      
      <DetectionTable detectionCounts={detectionCounts} />
    </div>
  );
};

export default App;
