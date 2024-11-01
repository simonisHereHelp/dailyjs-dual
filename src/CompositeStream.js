import React, { useEffect, useRef } from "react";
import Daily from "@daily-co/daily-js";

const CompositeStream = () => {
  const videoContainerRef = useRef(null);

  useEffect(() => {
    async function setupCompositeCameraView(roomUrl, username) {
      // Create a single Daily call instance
      const callInstance = Daily.createCallObject();

      // Enumerate available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");

      if (videoDevices.length < 2) {
        console.warn("At least two video devices are required for this setup.");
        return;
      }

      // Capture both video streams from device 0 and device 1
      const [stream1, stream2] = await Promise.all([
        navigator.mediaDevices.getUserMedia({ video: { deviceId: videoDevices[0].deviceId } }),
        navigator.mediaDevices.getUserMedia({ video: { deviceId: videoDevices[1].deviceId } })
      ]);

      // Create video elements for each stream to render them on a canvas
      const video1 = document.createElement("video");
      const video2 = document.createElement("video");
      video1.srcObject = stream1;
      video2.srcObject = stream2;
      await Promise.all([video1.play(), video2.play()]);

      // Create a canvas to combine both video feeds side-by-side
      const canvas = document.createElement("canvas");
      canvas.width = 960 * 2; // Double width for side-by-side view
      canvas.height = 640; // Same height for both videos
      const ctx = canvas.getContext("2d");

      // Draw both videos on the canvas side-by-side
      const drawFrame = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video1, 0, 0, canvas.width / 2, canvas.height); // Draw first video on the left
        ctx.drawImage(video2, canvas.width / 2, 0, canvas.width / 2, canvas.height); // Draw second video on the right
        requestAnimationFrame(drawFrame);
      };
      drawFrame();

      // Capture the combined canvas stream
      const combinedStream = canvas.captureStream(30); // 30 FPS

      // Set the combined stream as the video source for the call
      await callInstance.setInputDevicesAsync({ videoSource: combinedStream.getVideoTracks()[0] });

      // Join the room
      try {
        await callInstance.join({
          url: roomUrl,
          userName: username
        });

        // Attach the combined video feed to the video element
        if (videoContainerRef.current) {
          videoContainerRef.current.srcObject = combinedStream;
        }
      } catch (error) {
        console.error("Error joining room:", error);
      }
    }

    const roomUrl = "https://here2.daily.co/here2"; // Replace with your actual Daily room URL
    const username = "Composite Camera User"; // Replace with your desired username
    setupCompositeCameraView(roomUrl, username);
  }, []);

  return (
    <div>
      <h1>Composite Stream</h1>
      <div>
        <h2>960x640 x 2 Videos</h2>
        <video ref={videoContainerRef} autoPlay playsInline style={{ width: "100%", maxWidth: "1280px", height: "auto", border: "1px solid #ccc" }}></video>
      </div>
    </div>
  );
};

export default CompositeStream;
