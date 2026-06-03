import { useEffect, useState } from "react";
import { PhoneCountryInput } from "./PhoneCountryInput";
import { EmailInput } from "./EmailInput";
import { OTPVerification } from "./OTPVerification";
import { SelfieCapture } from "./SelfieCapture";
import { GalleryPaymentModal } from "./GalleryPaymentModal";
import { SurveyModal } from "./SurveyModal";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/data/services/apiService";
import { event } from "@/types/event";
import { RegisterFacesRequest, SelectedFace, User } from "@/types/auth";
import { FaceSelectionGrid } from "./FaceSelectionGrid";
import { FaceNamesForm } from "./FaceNamesForm";
import { FAQSupportDialog } from "@/components/gallery/FAQSupportDialog";
import { faqData } from "@/data/faqData";

type AuthStep =
  | "contact"
  | "otp"
  | "payment"
  | "selfie"
  | "selectFaces"
  | "complete"
  | "names"
  | "survey";

interface AuthFlowProps {
  event: event;
  onComplete: (userData: User) => void;
  onCancel: () => void;
  setUsers: (users: any[]) => void;
}

export const AuthFlow = ({
  event,
  onComplete,
  onCancel,
  setUsers,
}: AuthFlowProps) => {
  const needsFullAuth = event?.needDetect !== false;

  const [currentStep, setCurrentStep] = useState<AuthStep>( needsFullAuth ? "contact" : "selfie");
  const STEPS: AuthStep[] = ["contact", "otp", "selfie"];
  const currentStepIndex = STEPS.indexOf(currentStep);
  const [contactInfo, setContactInfo] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  // Stores the already-registered user if they hit the payment wall mid-login
  const [existingUserPendingPayment, setExistingUserPendingPayment] = useState<any>(null);
  // Survey state
  const [pendingSurvey, setPendingSurvey]       = useState<any | null>(null);
  const [pendingComplete, setPendingComplete]   = useState<(() => void) | null>(null);
  const [pendingUserName, setPendingUserName]   = useState<string>('');
  const [pendingPhotoCount, setPendingPhotoCount] = useState<number | null>(null);
  const [detectedFaces, setDetectedFaces] = useState<string[]>([]);
  const [selectedFaces, setSelectedFaces] = useState<Set<number>>(new Set());
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [selectedFaceItems, setSelectedFaceItems] = useState<SelectedFace[]>([]);
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  const isEmailMode = event?.registerBy === "Email";

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

      //need it
      // const loginResponse = await apiService.loginUser(user.id);
      // if (loginResponse && loginResponse.user) {
      //   setLoadingMessage(t('auth.loadingImages'));

      //   setLoadingMessage(t('auth.loadingRelatedUsers'));

      //   // טעינת משתמשים קשורים
      //   try {
      //     // const usersResponse = await apiService.getUserForUser(user.id);
      //   } catch (error) {
      //   }

      //   toast({
      //     title: t('toast.downloadComplete.title'),
      //     description: t('auth.registrationComplete'),
      //     variant: "default",
      //   });
      // }
    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: t("auth.alert"),
        description: t("auth.dataError"),
        variant: "default",
      });
    }
  };

  // ── Check for survey before completing registration ──────────────────────
  const checkAndShowSurvey = async (userId: number, proceed: () => void) => {
    try {
      const survey = await apiService.getSurveyByEvent(event.id);
      if (!survey) { proceed(); return; }
      const alreadyDone = await apiService.hasSurveyUserResponded(survey.id, userId);
      if (alreadyDone) { proceed(); return; }

      // Name — hide if anonymous
      const rawName = sessionStorage.getItem('userFullName') ?? '';
      const displayName = (rawName && rawName.toLowerCase() !== 'anonymous') ? rawName : '';

      // Photo count — best-effort, silent on failure
      let photoCount: number | null = null;
      try {
        const imgs = await apiService.getImages(userId, event.id);
        if (Array.isArray(imgs)) photoCount = imgs.length;
        else if (imgs?.photos) photoCount = imgs.photos.length;
      } catch { /* silent */ }

      setPendingSurvey(survey);
      setPendingUserName(displayName);
      setPendingPhotoCount(photoCount);
      setPendingComplete(() => proceed);
      setCurrentStep('survey');
    } catch {
      proceed();
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
        await apiService.sendOTPEmail(contact);
        toast({
          title: t("auth.emailSent"),
          description: t("auth.emailSentDesc"),
          variant: "default",
        });
      } else {
        const verificationMessage = "קוד האימות שלך מ Pixshare, ברוכים הבאים";
        await apiService.sendSMS(contact, verificationMessage, true);
        toast({
          title: t("auth.smsSent"),
          description: t("auth.smsSentDesc"),
          variant: "default",
        });
      }

      setCurrentStep("otp");
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

  const handleOTPSubmit = async (otp: string) => {
    setIsLoading(true);
    setLoadingMessage(t("auth.verifyingCode"));

    try {
      const isVerified = await apiService.verifyOTP(contactInfo, otp);
      if (isVerified) {

        setLoadingMessage(t("auth.checkingExistingUser"));
        try {
          const authenticateBy = isEmailMode ? "Email" : "PhoneNumber";
          const userAuth = await apiService.authenticateUser(
            contactInfo,
            event.id,
            authenticateBy
          );

          if (userAuth && userAuth.user && userAuth.user.id) {
            setLoadingMessage(t("auth.existingUserFound"));

            // Paid gallery check for returning users too
            if (event.isPaidGallery) {
              const paymentStatus = await apiService.verifyGalleryPayment(contactInfo, event.id);
              if (!paymentStatus.isPaid) {
                // Store the user — onSuccess will complete the flow for them
                setExistingUserPendingPayment(userAuth.user);
                setCurrentStep("payment");
                setIsLoading(false);
                setLoadingMessage("");
                return;
              }
            }

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
          } else {
            // New user — check gallery payment before selfie
            if (event.isPaidGallery) {
              const paymentStatus = await apiService.verifyGalleryPayment(contactInfo, event.id);
              if (!paymentStatus.isPaid) {
                setIsVisible(false);
                setCurrentStep("payment");
                setIsLoading(false);
                setLoadingMessage("");
                return;
              }
            }
            setIsVisible(false);
            const timer = setTimeout(() => {
              setIsVisible(true);
            }, 0);
            // return () => clearTimeout(timer);
            setCurrentStep("selfie");
          }
        } catch (error) {
          console.error(
            "User not found, proceeding to selfie registration:",
            error
          );
          setCurrentStep("selfie");
        }
      } else {
        toast({
          title: t("toast.error.title"),
          description: t("auth.otpError"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in OTP verification:", error);
      toast({
        title: t("toast.error.title"),
        description: t("auth.otpSystemError"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };


  const handleSelfieCapture = async (imageData: string) => {
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

      if (event.needDetect) {
        setLoadingMessage(t("auth.registeringNewUser"));
        formData.append("id", contactInfo || "selfie-only");
        formData.append("fullname", "Anonymous");
        formData.append("sendNotification", notifications.toString());
        formData.append("email", isEmailMode ? contactInfo : "");

      } else {
        setLoadingMessage(t("auth.registeringUser"));
      }
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

    const registrationResponse = event.needDetect ? await apiService.registerUser(formData) : await apiService.registerUserByPhoto(formData);
    if (registrationResponse.isMultipleFaces) {
      setDetectedFaces(registrationResponse.faceImageUrls);
      setSelectedFaces(new Set(registrationResponse.faceImageUrls.map((_, i) => i)));
      if (registrationResponse.faceImageUrls.length == 1) {
        const selected: Set<number> = new Set(
          registrationResponse.faceImageUrls.map((_, i) => i)
        );
        const detected: string[] = registrationResponse.faceImageUrls

        if(event.registerWithName){
          goToNamesStep(selected,detected);
          return;
        }

        await registerSelectedFaces(registrationResponse.faceImageUrls, false);
        return;
      }
      setCurrentStep("selectFaces");
      return;
    }

    await eventWithDetectRegister(registrationResponse);
  }

  const eventWithDetectRegister = async (registrationResponse: any) => {
  
    if (registrationResponse && registrationResponse.token) {
      sessionStorage.setItem("jwtUser", registrationResponse.token);
      sessionStorage.setItem("isRegister", "true");

      if (registrationResponse.user?.id && notifications) {
        try {
          setLoadingMessage(t("auth.sendingGalleryLink"));
          if (isEmailMode) {
            await apiService.sendWelcomeEmail(
              contactInfo,
              event.eventLink,
              registrationResponse.user.id
            );
          } else {
            await apiService.sendWelcomeSMS(
              contactInfo,
              event.eventLink,
              registrationResponse.user.id
            );
          }
        } catch (notifyError) {
          console.error("Failed to send welcome notification:", notifyError);
          toast({
            title: t("auth.alert"),
            description: isEmailMode ? t("auth.emailWarning") : t("auth.smsWarning"),
            variant: "default",
          });
        }
      }
      if (registrationResponse.user?.id) {
        await setUserData(registrationResponse.user);
      }

      toast({
        title: t("auth.registrationSuccess"),
        description: isEmailMode
          ? t("auth.registrationSuccessDesc")
          : t("auth.registrationSuccessWithSMS"),
        variant: "default",
      });

      const proceed = () => {
        setCurrentStep("complete");
        onComplete(registrationResponse.user);
        onCancel();
      };
      await checkAndShowSurvey(registrationResponse.user?.id, proceed);
    } else {
      throw new Error("Registration failed - no token received");
    }
  }
  const registerSelectedFaces = async (faces, faceWithName) => {
    const payload: RegisterFacesRequest = {
      reRegister: false,
      eventId: event.id,
      contactInfo,
      authenticateBy: needsFullAuth
        ? isEmailMode
          ? "Email"
          : "PhoneNumber"
        : "Selfie",
        faces: faces.map((f) => ({
          imageUrl: faceWithName ? f.imageUrl : f,
          name: faceWithName ? f.name : "Anonymous",
        })),
        sendNotification: notifications.toString()
    };
    const result = await apiService.registerSelectedFaces(payload);
    if (notifications) {
      console.log("Sending welcome notification to user ID:", isEmailMode);
      if (isEmailMode) {

        await apiService.sendWelcomeEmail(
          contactInfo,
          event.eventLink,
          result.user.id
        );
      } else {
        await apiService.sendWelcomeSMS(
          contactInfo,
          event.eventLink,
          result.user.id
        );
      }
    }
    sessionStorage.setItem("jwtUser", result.token);
    sessionStorage.setItem("userid", result.user.id.toString());
    await setUserData(result.user);
    const proceed = () => {
      setCurrentStep("complete");
      onComplete(result.user);
      onCancel();
    };
    await checkAndShowSurvey(result.user.id, proceed);
    return result;
  }

const goToNamesStep = (selectedFacesParam?: Set<number>, detectedFacesParam?: string[]) => {
  const faces = selectedFacesParam ?? selectedFaces;
  const detected = detectedFacesParam ?? detectedFaces;

  const facesWithNames: SelectedFace[] = [...faces].map((index) => ({
      index,
      imageUrl: detected[index],
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

  // ── Paid gallery payment screen (full-screen, outside the regular modal) ──
  if (currentStep === "payment" && event.isPaidGallery && event.galleryPaymentLink) {
    return (
      <GalleryPaymentModal
        eventId={event.id}
        phoneNumber={contactInfo}
        paymentLink={event.galleryPaymentLink}
        language={language === "he" ? "he" : "en"}
        onSuccess={async () => {
          if (existingUserPendingPayment) {
            // Returning user — payment done, complete the login flow
            const user = existingUserPendingPayment;
            sessionStorage.setItem("userid", user.id.toString());
            sessionStorage.setItem("userFullName", user.fullName || "Anonymous");
            sessionStorage.setItem("isRegister", "true");
            await setUserData(user);
            setCurrentStep("complete");
            onComplete(user);
            onCancel();
          } else {
            // New user — continue to selfie registration
            setCurrentStep("selfie");
            setIsVisible(true);
          }
        }}
        onCancel={onCancel}
      />
    );
  }

  // ── Survey screen ─────────────────────────────────────────────────────────
  if (currentStep === 'survey' && pendingSurvey) {
    const userId = parseInt(sessionStorage.getItem('userid') ?? '0', 10);
    return (
      <SurveyModal
        survey={pendingSurvey}
        userId={userId}
        language={language === 'he' ? 'he' : 'en'}
        userName={pendingUserName}
        photoCount={pendingPhotoCount}
        onDone={() => {
          if (pendingComplete) pendingComplete();
        }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      dir={language === "he" ? "rtl" : "ltr"}
      style={{ visibility: isVisible ? "visible" : "hidden" }}
    >
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              {stepTitles[currentStep]}
            </h2>
            <button
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Progress indicator */}
          {needsFullAuth && (
            <div className="mt-2 flex gap-2">
              {STEPS.map((step, index) => (
                <div
                  key={step}
                  className={`h-2 flex-1 rounded-full transition-colors ${currentStepIndex === -1 || index <= currentStepIndex ? "bg-primary" : "bg-muted"
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
                className={`flex items-center gap-3 ${language === "he" ? "flex-row-reverse" : "flex-row"
                  }`}
              >
                <p className="text-muted-foreground text-sm">
                  {loadingMessage}
                </p>
                <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          )}

          {!isLoading &&
            needsFullAuth &&
            currentStep === "contact" &&
            (isEmailMode ? (
              <EmailInput onSubmit={handleContactSubmit} onBack={onCancel} />
            ) : (
              <PhoneCountryInput
                onSubmit={handleContactSubmit}
                onBack={onCancel}
              />
            ))}

          {!isLoading && needsFullAuth && currentStep === "otp" && (
            <OTPVerification
              phoneNumber={contactInfo}
              onSubmit={handleOTPSubmit}
              onBack={() => setCurrentStep("contact")}
              isEmailMode={isEmailMode}
            />
          )}

          {!isLoading && currentStep === "selfie" && (
            <SelfieCapture
              onCapture={handleSelfieCapture}
              onBack={needsFullAuth ? () => setCurrentStep("contact") : onCancel}
              autoOpenCamera={true}
              withBTAction={true}
            />
          )}
          {!isLoading && currentStep === "selectFaces" && (
            <FaceSelectionGrid
              faces={detectedFaces}
              selected={selectedFaces}
              onBack={() => setCurrentStep("selfie")}
              onToggle={(index) => {
                  if (event.id === 855) {
                    setSelectedFaces(new Set([index]));
                    return;
                  }
                  
                const copy = new Set(selectedFaces);
                copy.has(index) ? copy.delete(index) : copy.add(index);
                setSelectedFaces(copy);
              }}
              onContinue={() => goToNamesStep()}
            />
          )}
          {currentStep === "names" && (
            <FaceNamesForm
              faces={selectedFaceItems}
              isLoading={isLoading}
              onBack={() => setCurrentStep(detectedFaces.length <= 1 ? "selfie" : "selectFaces")}
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

        {/* Support footer — visible on the entry step only */}
        {currentStep === "contact" && !isLoading && (
          <div className="px-6 pb-5 pt-1 border-t border-border/50">
            <p className="text-center text-xs text-muted-foreground">
              {language === "he" ? "יש שאלה או צריכים עזרה? " : "Have a question or need help? "}
              <button
                onClick={() => setIsSupportOpen(true)}
                className="text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                {language === "he" ? " לתמיכה" : "Contact support"}
              </button>
            </p>
          </div>
        )}

        <FAQSupportDialog
          isOpen={isSupportOpen}
          setIsOpen={setIsSupportOpen}
          questions={faqData[language] || faqData.he}
          event={event}
        />
      </div>
    </div>
  );
};
