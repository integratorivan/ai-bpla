/**
 * Class to handle webcam
 */
export class Webcam {
  /**
   * Open webcam and stream it through video tag.
   * @param {HTMLVideoElement} videoRef video tag reference
   */
  open = (videoRef) => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
        })
        .then((stream) => {
          videoRef.srcObject = stream;
          videoRef.playsInline = true; // Prevent fullscreen on mobile
          videoRef.setAttribute('playsinline', ''); // For iOS Safari
          videoRef.setAttribute('webkit-playsinline', ''); // For older iOS
        })
        .catch((error) => {
          console.error("Error accessing webcam:", error);
          alert("Не удалось получить доступ к камере!");
        });
    } else {
      alert("Камера не поддерживается в этом браузере!");
    }
  };

  /**
   * Close opened webcam.
   * @param {HTMLVideoElement} videoRef video tag reference
   */
  close = (videoRef) => {
    if (videoRef.srcObject) {
      videoRef.srcObject.getTracks().forEach((track) => {
        track.stop();
      });
      videoRef.srcObject = null;
    } else {
      alert("Сначала откройте камеру!");
    }
  };
}
