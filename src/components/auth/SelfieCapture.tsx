import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, Check, Upload } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import React from "react";

interface SelfieCaptureProps {
  onCapture: (imageData: string) => void;
  onBack: () => void;
  autoOpenCamera?: boolean;
  withBTAction: boolean;
  variant?: "default" | "kimama";
}

export const SelfieCapture = ({ onCapture, onBack, variant = "default", autoOpenCamera, withBTAction = true }: SelfieCaptureProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef1 = useRef<HTMLInputElement>(null);

  const { t, language } = useLanguage();
  const hasClickedRef = useRef(false);


  useEffect(() => {
    if (autoOpenCamera && !hasClickedRef.current) {
      // startCamera();
      // fileInputRef.current?.click();
      hasClickedRef.current = true;
    }
  }, [autoOpenCamera]);

  // Check if device is mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const startCamera = async () => {
    // try {

    //   if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    //     alert('המצלמה אינה נתמכת בדפדפן זה');
    //     return;
    //   }

    //   const constraints = {
    //     video: { 
    //       facingMode: "user",
    //       width: { ideal: 640, min: 320 },
    //       height: { ideal: 480, min: 240 }
    //     },
    //     audio: false
    //   };

    //   const stream = await navigator.mediaDevices.getUserMedia(constraints);      
    //   streamRef.current = stream;

    //   setIsCapturing(true);
    //   setTimeout(() => {
    //     if (videoRef.current) {
    //       videoRef.current.srcObject = stream;
    //       videoRef.current.play().catch(error => {
    //         console.error("Error playing video:", error);
    //       });
    //     } else {
    //       console.warn('videoRef.current עדיין null אחרי ההשהייה');
    //     }
    //   }, 350);



    // } catch (error) {
    //   console.error("Error accessing camera:", error);
    //   if (error.name === 'NotAllowedError') {
    //     alert('יש לאשר גישה למצלמה כדי לצלם סלפי');
    //   } else if (error.name === 'NotFoundError') {
    //     alert('מצלמה לא נמצאה במכשיר');
    //   } else {
    //     alert('שגיאה בגישה למצלמה. נסה להעלות תמונה במקום זאת.');
    //   }
    // } finally {
    //}
    setIsLoading(true);
    fileInputRef.current?.click();
    setIsLoading(false);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Mirror the image horizontally for selfie effect
    context.scale(-1, 1);
    context.translate(-canvas.width, 0);
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    //startCamera();
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setCapturedImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = () => {
    fileInputRef1.current?.click();
  };

  return (
    <div className="space-y-6" dir={language === 'he' ? 'rtl' : 'ltr'} >
      {!capturedImage && (

        <div className="text-center mb-6">
          <p className="text-muted-foreground">
            {t('auth.selfieInstruction')}
          </p>
        </div>
      )}

      {/* Camera/Image display */}
      <div className="relative bg-muted rounded-lg overflow-hidden aspect-[4/3] flex items-center justify-center">
        {!isCapturing && !capturedImage && (
          <div className="text-center">
            <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {isMobile ? t('auth.takeSelfie') : t('auth.selectImageOrCamera')}
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              {!isLoading && (
                <Button onClick={handleFileUpload} variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  {t('auth.selectFile')}
                </Button>
              )}
              <Button onClick={startCamera} disabled={isLoading}
                className={`flex-1 ${variant === "kimama"
                    ? `
                    bg-gradient-to-r from-[#FF8C00] via-[#FFA13A] to-[#FFB703] text-white shadow-md hover:shadow-lg active:scale-95 transition-all
                  `
                    : ""
                  }`}>
                {isLoading ? (
                  <div className={`flex items-center gap-2 ${language === 'he' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span>{t('auth.loading')}</span>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    {t('auth.camera')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {isCapturing && (
          //   <video
          //     ref={videoRef}
          //     autoPlay
          //     playsInline
          //     muted
          //  className="fixed inset-0 w-screen h-screen object-cover scale-x-[-1]"
          //   />
          <input
            type="file"
            accept="image/*"
            capture="user" // מפעיל את המצלמה הקדמית (סלפי)

          />

        )}

        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured selfie"
            className="w-full h-full object-cover"
          />
        )}

        {/* Capture overlay */}
        {isCapturing && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Frame overlay */}
            <div className="absolute inset-4 border-2 border-white rounded-full opacity-50" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-48 h-48 border-2 border-white rounded-full" />
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef1}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

       {capturedImage && (

        <div className="text-center mb-6">
          <p className="text-muted-foreground">
            {language === 'he'
          ? `רק את.ה יכול לראות את תמונת הסלפי הזאת`
          : `This selfie is visible only to you`}
    
          </p>
        </div>
      )}


      {/* Action buttons */}
      <div className="flex gap-3">
        {isCapturing && (
          <>

            <Button
              type="button"
              variant="outline"
              onClick={stopCamera}
              className="flex-1"
            >
              {t('common.back')}
            </Button>
            <Button
              onClick={capturePhoto}
              className={`flex-1 ${variant === "kimama"
                  ? `  bg-gradient-to-r from-[#FF8C00] via-[#FFA13A] to-[#FFB703] text-white shadow-md hover:shadow-lg active:scale-95 transition-all`
                  : ""
                }`}>

              <Camera className="w-4 h-4 mr-2" />
              {t('auth.takePhoto')}
            </Button>
          </>
        )}

        {capturedImage && (
          <>
            <Button
              variant="outline"
              onClick={retakePhoto}
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t('auth.retake')}
            </Button>
            {withBTAction && (

              <Button
                onClick={confirmPhoto}
                className={`flex-1 ${variant === "kimama"
                    ? `
                    bg-gradient-to-r from-[#FF8C00] via-[#FFA13A] to-[#FFB703] text-white shadow-md hover:shadow-lg active:scale-95 transition-all
                  `
                    : ""
                  }`}>

                <Check className="w-4 h-4 mr-2" />
                {t('auth.confirm')}
              </Button>
            )}
          </>
        )}

        {!isCapturing && !capturedImage &&  onBack &&(
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            {t('common.back')}
          </Button>
        )}
      </div>
    </div>
  );
};