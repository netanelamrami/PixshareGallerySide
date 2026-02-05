import { useEffect, useState } from "react";
import { EmailInput } from "./EmailInput";
import { SelfieCapture } from "./SelfieCapture";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/data/services/apiService";
import { event } from "@/types/event";
import { RegisterFacesRequest, SelectedFace, User } from "@/types/auth";
import { PhoneCountryInputKimama } from "./PhoneCountryInputKimama";
import { FaceNamesForm } from "./FaceNamesForm";
import { FaceSelectionGrid } from "./FaceSelectionGrid";

type AuthStep =
  | "contact"
  | "otp"
  | "selfie"
  | "selectFaces"
  | "complete"
  | "names";

interface AuthFlowProps {
  event: event;
  onComplete: (userData: User) => void;
  onCancel: () => void;
  setUsers: (users: any[]) => void;
  needsFullAuth?: boolean;
  userPhone?: string;
}

export const AuthFlowKimama = ({
  event,
  onComplete,
  onCancel,
  userPhone = null,
  setUsers,
  needsFullAuth = true,
}: AuthFlowProps) => {


  const [currentStep, setCurrentStep] = useState<AuthStep>(
    needsFullAuth ? "contact" : "selfie"
  );
  const STEPS: AuthStep[] = [
    "contact",
    "selfie",
    "selectFaces",
    "names",
  ];
  const currentStepIndex = STEPS.indexOf(currentStep);
  const [contactInfo, setContactInfo] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [otpCode, setOtpCode] = useState("");
  const [selfieData, setSelfieData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [fullName, setFullName] = useState("");
  const [detectedFaces, setDetectedFaces] = useState<string[]>([]);
  const [selectedFaces, setSelectedFaces] = useState<Set<number>>(new Set());
  const [selectedFaceItems, setSelectedFaceItems] = useState<SelectedFace[]>(
    []
  );
  const isEmailMode = event?.registerBy === "Email";
  console.log("User Phone in AuthFlowKimama:", userPhone);  
  useEffect(() => {
    if (currentStep === "contact") {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

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

  const setUserData = async (user: any) => {
    try {
      setLoadingMessage(t("auth.loadingUserData"));
      sessionStorage.setItem("userid", user.id.toString());
      sessionStorage.setItem("photourl", user.photoUrl);

    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: t("auth.alert"),
        description: t("auth.dataError"),
        variant: "default",
      });
    }
  };

  const handleContactSubmit = async (
    contact: string,
    notificationPreference: boolean
  ) => {
    setContactInfo(contact);
    setNotifications(notificationPreference);
    setIsLoading(true);
    setLoadingMessage(
      isEmailMode ? t("auth.sendingEmail") : t("auth.sendingSMS")
    );
    try {
      if (isEmailMode) {
        // await apiService.sendOTPEmail(contact);
        // toast({
        //   title: t('auth.emailSent'),
        //   description: t('auth.emailSentDesc'),
        //   variant: "default",
        // });
      } else {
        setLoadingMessage(t("auth.checkingExistingUser"));
        try {
          const authenticateBy = isEmailMode ? "Email" : "PhoneNumber";
          const userAuth = await apiService.authenticateUser(
            contact,
            event.id,
            "PhoneNumber"
          );

          if (userAuth && userAuth.user && userAuth.user.id) {
            setLoadingMessage(t("auth.existingUserFound"));
            sessionStorage.setItem("userid", userAuth.user.id.toString());
            sessionStorage.setItem("userFullName", userAuth.user.fullName || "Anonymous");
            sessionStorage.setItem("isRegister", "true");

            await setUserData(userAuth.user);

            setCurrentStep("complete");
            onComplete(userAuth.user);
            onCancel();

            toast({
              title: t("auth.welcomeBack"),
              description: t("auth.existingUserDesc"),
              variant: "default",
            });
          }
        } catch (error) {
          setCurrentStep("selfie");
        }
      }

      setCurrentStep("selfie");
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast({
        title: t("auth.sendError"),
        description: t("auth.sendErrorDesc").replace(
          "{type}",
          isEmailMode ? "אימייל" : "SMS"
        ),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleSelfieCapture = async (imageData: string) => {
    setSelfieData(imageData);
    setIsLoading(true);
    setLoadingMessage(t("auth.processingImage"));

    try {
      const formData = new FormData();

      const response = await fetch(imageData);
      const blob = await response.blob();
      const originalFile = new File([blob], "selfie.jpg", {
        type: "image/jpeg",
      });

      setLoadingMessage(t("auth.resizingImage"));
      const compressedBlob = await compressImage(originalFile, 800, 0.7);
      const compressedFile = new File(
        [compressedBlob],
        "selfie_compressed.jpg",
        { type: "image/jpeg" }
      );

      formData.append("image", compressedFile);
      formData.append("eventid", event.id.toString());
      formData.append(
        "AuthenticateBy",
        !event.needDetect ? "Selfie" : isEmailMode ? "Email" : "PhoneNumber"
      );
      setLoadingMessage(t("auth.registeringNewUser"));

      formData.append("id", contactInfo || "selfie-only");
      formData.append("fullname", otpCode);
      formData.append("sendNotification", notifications.toString());
      formData.append("email", isEmailMode ? contactInfo : "");

      await detectMultipleFaces(formData);


    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: t("auth.registrationError"),
        description: t("auth.registrationErrorDesc"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };
const detectMultipleFaces = async (formData) => {
  const registrationResponse = await apiService.registerUser(formData);

  const faces = registrationResponse.faceImageUrls || [];

  if (faces.length > 0) {
    setDetectedFaces(faces);
    setSelectedFaces(new Set(faces.map((_, i) => i)));

    const faceItems: SelectedFace[] = faces.map((url, i) => ({
      index: i,
      imageUrl: url,
      name: "",
    }));
    setSelectedFaceItems(faceItems);

    const nextStep = faces.length > 1 ? "selectFaces" : "names";
    setCurrentStep(nextStep);
    return;
  }

  await eventWithDetectRegister(registrationResponse);
}


  const eventWithDetectRegister = async (registrationResponse: any) => {
    if (registrationResponse && registrationResponse.token) {
      sessionStorage.setItem("jwtUser", registrationResponse.token);
      sessionStorage.setItem("isRegister", "true");

      if (!isEmailMode && registrationResponse.user?.id) {
        try {
          window.location.reload();
        } catch (smsError) {
          console.error("Failed to send welcome SMS:", smsError);
          toast({
            title: t("auth.alert"),
            description: t("auth.smsWarning"),
            variant: "default",
          });
        }
      }
      if (registrationResponse.user?.id) {
        await setUserData(registrationResponse.user);
      }

      setCurrentStep("complete");
      onComplete(registrationResponse.user);
      onCancel();

      toast({
        title: t("auth.registrationSuccess"),
        description: isEmailMode
          ? t("auth.registrationSuccessDesc")
          : t("auth.registrationSuccessWithSMS"),
        variant: "default",
      });
    } else {
      throw new Error("Registration failed - no token received");
    }
  }
  const registerSelectedFaces = async (faces, faceWithName) => {
    const payload: RegisterFacesRequest = {
      reRegister: userPhone ? true :  false,
      eventId: event.id,
      contactInfo: userPhone ?? contactInfo  ,
      authenticateBy: "PhoneNumber",
      faces: faces.map((f) => ({
        imageUrl: faceWithName ? f.imageUrl : f,
        name: faceWithName ? f.name : "Anonymous",
      })),
    };
    const result = await apiService.registerSelectedFaces(payload);
    sessionStorage.setItem("jwtUser", result.token);
    sessionStorage.setItem("userid", result.user.id.toString());
    await setUserData(result.user);
    setCurrentStep("complete");
    onComplete(result.user);
    onCancel();
    return;
  }

  const goToNamesStep = () => {
    const facesWithNames: SelectedFace[] = [...selectedFaces].map((index) => ({
      index,
      imageUrl: detectedFaces[index],
      name: "",
    }));

    setSelectedFaceItems(facesWithNames);
    setCurrentStep("names");
  };
  const stepTitles = {
    contact: isEmailMode ? t("auth.emailEntry") : t("auth.phoneEntry"),
    otp: t("auth.otpVerification"),
    selfie: needsFullAuth ? t("auth.selfieCapture") : t("auth.takeSelfie"),
    selectFaces: t("auth.selectFaces"),
    names: t("auth.enterNames"),
    complete: t("auth.registrationComplete"),
  };

  return (
    // <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir={language === 'he' ? 'rtl' : 'ltr'}
    // style={{visibility: isVisible ? 'visible' : 'hidden'}}>
<div className="bg-background border border-border rounded-t-3xl shadow-lg w-full max-w-md max-h-[60vh] overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">
            {stepTitles[currentStep]}
          </h3>
          {/* <button 
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button> */}
        </div>

        {/* Progress indicator */}
        {needsFullAuth && (
          <div className="mt-2 flex gap-2">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full transition-colors ${currentStepIndex === -1 || index <= currentStepIndex ? "bg-[#FFB347]" : "bg-muted"
                  }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div
              className={`flex items-center gap-3 color text-[#FFB347] ${language === "he" ? "flex-row-reverse" : "flex-row"}`}
            >
              <p className="text-muted-foreground text-sm  ">{loadingMessage}</p>
                <div className="w-6 h-6 border-4 border-[#FFB347] border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}

        {!isLoading &&
          needsFullAuth &&
          currentStep === "contact" &&
          (isEmailMode ? (
            <EmailInput onSubmit={handleContactSubmit} onBack={onCancel} />
          ) : (
            <PhoneCountryInputKimama
              onSubmit={handleContactSubmit}
              // onBack={onCancel}
              submitText={t("auth.continue")}
              variant="kimama"
            />
          ))}

        {!isLoading && currentStep === "selfie" && (
          <SelfieCapture
            onCapture={handleSelfieCapture}
            onBack={needsFullAuth ? () => setCurrentStep("contact") : onCancel}
            autoOpenCamera={true}
            withBTAction={true}
            variant="kimama"

          />
        )}
        {!isLoading && currentStep === "selectFaces" && (
          <FaceSelectionGrid
            faces={detectedFaces}
            selected={selectedFaces}
            onBack={() => setCurrentStep("selfie")}
             variant="kimama"
            onToggle={(index) => {
              const copy = new Set(selectedFaces);
              copy.has(index) ? copy.delete(index) : copy.add(index);
              setSelectedFaces(copy);
            }}
            onContinue={goToNamesStep}
          />
        )}

        {currentStep === "names" && (
          <FaceNamesForm
            faces={selectedFaceItems}
            isLoading={isLoading}
            variant="kimama"
            onBack={() => {
              const returnToStep = selectedFaceItems.length > 1 ? "selectFaces" : "selfie";
              setCurrentStep(returnToStep);
            }}
            onSubmit={async (faces) => {
              try {
                setIsLoading(true);
                setLoadingMessage(
                  language === "he" ? "יוצר משתמשים..." : "Creating users..."
                );

                await registerSelectedFaces(faces, true);

              } catch (e) {
                toast({
                  title: "שגיאה",
                  description: "לא הצלחנו לרשום את המשתמשים",
                  variant: "destructive",
                });
              } finally {
                setIsLoading(false);
                setLoadingMessage("");
              }
            }}
          />
        )}
      </div>
    </div>
    // </div>
  );
};
