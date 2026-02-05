import React, { useState, useRef } from "react";
import { useMultiUserAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { event } from "@/types/event";
import { apiService } from "@/data/services/apiService";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: event; // Assuming event is passed for context
}

export const AddUserModal = ({ isOpen, onClose, event }: AddUserModalProps) => {
  const { addUser } = useMultiUserAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [step, setStep] = useState<"info" | "selfie" | "complete">("info");
  const [userInfo, setUserInfo] = useState({ name: "", phone: "", email: "" });
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEmailMode = event?.registerBy === "Email";
  const [isLoadingCreateUser, setIsLoadingCreateUser] = useState(false);
  const handleInfoSubmit = () => {
    // Skip info validation - only name is optional now
    setStep("selfie");
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      toast({
        title: t("auth.cameraError") || "שגיאה במצלמה",
        description: t("auth.cameraError"),
        variant: "destructive",
      });
    }
  };

  const takeSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        setSelfieImage(imageData);

        // Stop camera
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        setIsCapturing(false);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelfieImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const compressImage = (
    file: File,
    maxWidth: number = 800,
    quality: number = 0.7
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, "image/jpeg", quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleCreateUser = async () => {
    if (!selfieImage) {
      toast({
        title: t("auth.error") || "שגיאה",
        description: t("users.selfieRequired") || "יש להעלות תמונת סלפי",
        variant: "destructive",
      });
      return;
    }
    setIsLoadingCreateUser(true);

    const formData = new FormData();

    // המרת base64 לblob ואז לfile
    const response = await fetch(selfieImage);
    const blob = await response.blob();
    const originalFile = new File([blob], "selfie.jpg", { type: "image/jpeg" });

    // מזעור התמונה
    const compressedBlob = await compressImage(originalFile, 800, 0.7);
    const compressedFile = new File([compressedBlob], "selfie_compressed.jpg", {
      type: "image/jpeg",
    });

    formData.append("image", compressedFile);
    formData.append("eventid", event.id.toString());

    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const userid = parseInt(sessionStorage.getItem("userid") || "0");
    const id = `${userid}-${randomNumber}`;
    formData.append("id", id);
    formData.append("relatedToUserId", userid.toString());
    // משתמש חדש - משתמשים בטלפו/אימייל כid
    formData.append("fullname", userInfo.name ? userInfo.name : "Anonymous");
    formData.append("AuthenticateBy", isEmailMode ? "Email" : "PhoneNumber");
    const registrationResponse = await apiService.addUser(formData);

    const newUser = addUser({
      id: registrationResponse.user.id.toString(),
      name: userInfo.name || `משתמש ${Date.now()}`,
      phoneNumber: "",
      email: "",
      selfieImage: registrationResponse.user.photoUrl,
      eventId: event?.id || 0,
      faceId: "",
    });

    setStep("complete");
    setIsLoadingCreateUser(false);
    setTimeout(() => {
      onClose();
      // Reset form
      setStep("info");
      setUserInfo({ name: "", phone: "", email: "" });
      setSelfieImage(null);

      // Force parent component re-render by triggering window event
      window.dispatchEvent(new CustomEvent("userAdded", { detail: newUser }));
    }, 1500);
  };

  const handleClose = () => {
    // Stop camera if active
    if (videoRef.current && isCapturing) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }
    onClose();
    // Reset form
    setStep("info");
    setUserInfo({ name: "", phone: "", email: "" });
    setSelfieImage(null);
    setIsCapturing(false);
  };

  return (
    <div dir={language === "he" ? "rtl" : "ltr"}>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">
              {step === "info" && (t("users.addUser") || "הוסף משתמש")}
              {step === "selfie" && (t("auth.selfieCapture") || "צילום סלפי")}
              {step === "complete" &&
                (t("users.userAdded") || "משתמש נוסף בהצלחה")}
            </DialogTitle>
          </DialogHeader>

          {step === "info" && (
            <div className="space-y-4">
              <div dir={language === "he" ? "rtl" : "ltr"}>
                <Label htmlFor="name">{t("users.name") || "שם"} </Label>
                <Input
                  id="name"
                  value={userInfo.name}
                  onChange={(e) =>
                    setUserInfo((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder={
                    t("users.namePlaceholder") || "הזן שם (אופציונלי)"
                  }
                />
              </div>
              <div
                className="flex gap-2 justify-end"
                dir={language === "he" ? "rtl" : "ltr"}
              >
                <Button variant="outline" onClick={handleClose}>
                  {t("common.cancel") || "ביטול"}
                </Button>
                <Button onClick={handleInfoSubmit}>
                  {t("common.next") || "הבא"}
                </Button>
              </div>
            </div>
          )}

          {step === "selfie" && (
            <div className="space-y-4" dir={language === "he" ? "rtl" : "ltr"}>
              {!selfieImage && !isCapturing && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    {t("auth.selfieInstructionAddUser") ||
                      "צלם סלפי כדי לזהות את התמונות שלך בגלרייה"}
                  </p>
                  <div
                    className="flex gap-2"
                    dir={language === "he" ? "rtl" : "ltr"}
                  >
                    {/* <Button onClick={startCamera} className="flex-1">
                    <Camera className="w-4 h-4 mr-2" />
                    {t('auth.camera') || 'מצלמה'}
                  </Button> */}
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {t("auth.selectFileAddUser") || "בחר קובץ"}
                    </Button>
                  </div>
                </div>
              )}

              {isCapturing && (
                <div className="space-y-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover rounded-lg bg-muted"
                  />
                  <div className="flex gap-2">
                    <Button onClick={takeSelfie} className="flex-1">
                      {t("auth.takePhoto") || "צלם"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const stream = videoRef.current
                          ?.srcObject as MediaStream;
                        if (stream) {
                          stream.getTracks().forEach((track) => track.stop());
                        }
                        setIsCapturing(false);
                      }}
                    >
                      {t("common.cancel") || "ביטול"}
                    </Button>
                  </div>
                </div>
              )}

              {selfieImage && (
                <div className="space-y-3">
                  <img
                    src={selfieImage}
                    alt="Selfie preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div
                    className="flex gap-2"
                    dir={language === "he" ? "rtl" : "ltr"}
                  >
                    <Button
                      disabled={isLoadingCreateUser}
                      className="flex-1"
                      variant="outline"
                      onClick={() => setSelfieImage(null)}
                    >
                      {t("auth.retake") || "צלם שוב"}
                    </Button>
                    <Button
                      onClick={handleCreateUser}
                      className="flex-1"
                      disabled={isLoadingCreateUser}
                    >
                      {isLoadingCreateUser ? (
                        <div
                          className={`flex items-center gap-2 ${
                            language === "he" ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <span>{t("auth.createUser")}</span>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <>{t("auth.createUser") || "אישור"}</>
                      )}
                    </Button>

                   
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {step === "complete" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-medium">
                {t("users.userAdded") || "משתמש נוסף בהצלחה!"}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("users.userSwitched") || "המשתמש החדש הפך לפעיל"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
