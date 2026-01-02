
import { useEffect, useState } from "react";
import { PhoneCountryInput } from "./PhoneCountryInput";
import { EmailInput } from "./EmailInput";
import { OTPVerification } from "./OTPVerification";
import { SelfieCapture } from "./SelfieCapture";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/data/services/apiService";
import { event } from "@/types/event";
import { User } from "@/types/auth";

type AuthStep = "contact" | "otp" | "selfie" | "complete";

interface AuthFlowProps {
  event: event;
  onComplete: (userData: User) => void;
  onCancel: () => void;
  setUsers: (users: any[]) => void;
}

export const AuthFlow = ({ event, onComplete, onCancel, setUsers }: AuthFlowProps) => {
  const needsFullAuth = event?.needDetect !== false;

  const [currentStep, setCurrentStep] = useState<AuthStep>(needsFullAuth ? "contact" : "selfie");
  const [contactInfo, setContactInfo] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [otpCode, setOtpCode] = useState("");
  const [selfieData, setSelfieData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);

  const isEmailMode = event?.registerBy === "Email";

  useEffect(() => {
    if (currentStep === "contact") {
      setIsVisible(true);
    }else{
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 0); 
      return () => clearTimeout(timer);
    }

  }, []);

  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.7): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // פונקציה לטעינת נתוני המשתמש אחרי רישום
  const setUserData = async (user: any) => {
    try {
      setLoadingMessage(t('auth.loadingUserData'));
      sessionStorage.setItem('userid', user.id.toString());
      sessionStorage.setItem('photourl', user.photoUrl);

      //need it
      // const loginResponse = await apiService.loginUser(user.id);
      // if (loginResponse && loginResponse.user) {
      //   setLoadingMessage(t('auth.loadingImages'));

      //   setLoadingMessage(t('auth.loadingRelatedUsers'));
        
      //   // טעינת משתמשים קשורים
      //   try {
      //     // const usersResponse = await apiService.getUserForUser(user.id);
      //     // console.log('Related users loaded:', usersResponse);
      //   } catch (error) {
      //     console.log('No related users found or error loading users:', error);
      //   }
        
      //   toast({
      //     title: t('toast.downloadComplete.title'),
      //     description: t('auth.registrationComplete'),
      //     variant: "default",
      //   });
      // }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: t('auth.alert'),
        description: t('auth.dataError'),
        variant: "default",
      });
      
    }
  };

  const handleContactSubmit = async (contact: string, notificationPreference: boolean) => {
    setContactInfo(contact);
    setNotifications(notificationPreference);
    setIsLoading(true);
    setLoadingMessage(isEmailMode ? t('auth.sendingEmail') : t('auth.sendingSMS'));
    
    try {
      if (isEmailMode) {
        await apiService.sendOTPEmail(contact);
        toast({
          title: t('auth.emailSent'),
          description: t('auth.emailSentDesc'),
          variant: "default",
        });
      } else {
        const verificationMessage = "קוד האימות שלך מ Pixshare, ברוכים הבאים";
        await apiService.sendSMS(contact, verificationMessage, true);
        toast({
          title: t('auth.smsSent'),
          description: t('auth.smsSentDesc'),
          variant: "default",
        });
      }
      
      setCurrentStep("otp");
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({
        title: t('auth.sendError'),
        description: t('auth.sendErrorDesc').replace('{type}', isEmailMode ? 'אימייל' : 'SMS'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleOTPSubmit = async (otp: string) => {
    setIsLoading(true);
    setLoadingMessage(t('auth.verifyingCode'));
    
    try {
      const isVerified = await apiService.verifyOTP(contactInfo, otp);
      if (isVerified) {
        setOtpCode(otp);
        
        // בדיקה האם המשתמש כבר רשום
        setLoadingMessage(t('auth.checkingExistingUser'));
        try {
          const authenticateBy = isEmailMode ? "Email" : "PhoneNumber";
          const userAuth = await apiService.authenticateUser(contactInfo, event.id, authenticateBy);
          
          if (userAuth && userAuth.user && userAuth.user.id) {
            // המשתמש כבר רשום - טוען את נתוני המשתמש ומעבר ישירות לגלריה
            setLoadingMessage(t('auth.existingUserFound'));
            
            // שמירת מזהה המשתמש ב-sessionStorage
            sessionStorage.setItem('userid', userAuth.user.id.toString());
            sessionStorage.setItem('userFullName', userAuth.user.fullName || 'Anonymous');
            sessionStorage.setItem("isRegister", "true");
            
            // טעינת נתוני המשתמש
            await setUserData(userAuth.user);
            
            setCurrentStep("complete");
            onComplete(userAuth.user); 

            toast({
              title: t('auth.welcomeBack'),
              description: t('auth.existingUserDesc'),
              variant: "default",
            });
          } else {
            // משתמש חדש - ממשיכים לשלב selfie
            setIsVisible(false);
              const timer = setTimeout(() => {
                setIsVisible(true);
              }, 0); 
              // return () => clearTimeout(timer);
            setCurrentStep("selfie");
          }
        } catch (error) {
          // אם יש שגיאה באימות, ממשיכים לשלב selfie (משתמש חדש)
          console.error('User not found, proceeding to selfie registration:', error);
          setCurrentStep("selfie");
        }
      } else {
        toast({
          title: t('toast.error.title'),
          description: t('auth.otpError'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error in OTP verification:', error);
      toast({
        title: t('toast.error.title'),
        description: t('auth.otpSystemError'),
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
    setLoadingMessage(t('auth.processingImage'));
    
    try {
      // יצירת FormData לרישום המשתמש
      const formData = new FormData();
      
      // המרת base64 לblob ואז לfile
      const response = await fetch(imageData);
      const blob = await response.blob();
      const originalFile = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      
      // מזעור התמונה
      setLoadingMessage(t('auth.resizingImage'));
      const compressedBlob = await compressImage(originalFile, 800, 0.7);
      const compressedFile = new File([compressedBlob], 'selfie_compressed.jpg', { type: 'image/jpeg' });
      
      formData.append('image', compressedFile);
      formData.append('eventid', event.id.toString());
      formData.append('AuthenticateBy', !event.needDetect ? 'Selfie' : isEmailMode ? 'Email' : 'PhoneNumber');
      console.log(formData.getAll('AuthenticateBy'))
      if (event.needDetect) {
        setLoadingMessage(t('auth.registeringNewUser'));
        
        // משתמש חדש - משתמשים בטלפון/אימייל כid
        formData.append('id', contactInfo || "selfie-only");
        formData.append('fullname', 'Anonymous');
        formData.append('sendNotification', notifications.toString());
        formData.append('email', isEmailMode ? contactInfo : '');
        
        const registrationResponse = await apiService.registerUser(formData);
        
        if (registrationResponse && registrationResponse.token) {
          // שמירת הטוקן
          sessionStorage.setItem("jwtUser", registrationResponse.token);
          sessionStorage.setItem("isRegister", "true");

          // שליחת SMS עם קישור לגלריה (רק לטלפון)
          if (!isEmailMode && registrationResponse.user?.id) {
            try {
              setLoadingMessage(t('auth.sendingGalleryLink'));
              await apiService.sendWelcomeSMS(contactInfo, event.eventLink, registrationResponse.user.id);
            } catch (smsError) {
              console.error('Failed to send welcome SMS:', smsError);
              toast({
                title: t('auth.alert'),
                description: t('auth.smsWarning'),
                variant: "default",
              });
            }
          }
          // טעינת נתוני המשתמש (תמונות, משתמשים קשורים)
          if (registrationResponse.user?.id) {
            await setUserData(registrationResponse.user);
          }
          
          setCurrentStep("complete");
          onComplete(registrationResponse.user); 

          toast({
            title: t('auth.registrationSuccess'),
            description: isEmailMode ? t('auth.registrationSuccessDesc') : t('auth.registrationSuccessWithSMS'),
            variant: "default",
          });
        } else {
          throw new Error("Registration failed - no token received");
        }
      } else {
        setLoadingMessage(t('auth.registeringUser'));
        
        // לאירועים ללא זיהוי פנים
        const registrationResponse = await apiService.registerUserByPhoto(formData);
        
        if (registrationResponse && registrationResponse.token) {
          sessionStorage.setItem("jwtUser", registrationResponse.token);
          sessionStorage.setItem("isRegister", "true");
          sessionStorage.setItem('userid', registrationResponse.user.id.toString());

          // טעינת נתוני המשתמש (תמונות, משתמשים קשורים)

          if (registrationResponse?.user.id) {
            await setUserData(registrationResponse.user);
          }
          
          setCurrentStep("complete");
          onComplete(registrationResponse.user); 

          
          // toast({
          //   title: t('auth.eventRegistrationSuccess'),
          //   description: t('auth.eventRegistrationDesc'),
          //   variant: "default",
          // });
        } else {
          throw new Error("Registration by photo failed");
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: t('auth.registrationError'),
        description: t('auth.registrationErrorDesc'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const stepTitles = {
    contact: isEmailMode ? t('auth.emailEntry') : t('auth.phoneEntry'),
    otp: t('auth.otpVerification'),
    selfie: needsFullAuth ? t('auth.selfieCapture') : t('auth.takeSelfie'),
    complete: t('auth.registrationComplete')
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir={language === 'he' ? 'rtl' : 'ltr'}
    style={{visibility: isVisible ? 'visible' : 'hidden'}}>
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
          {needsFullAuth &&(
          <div className="mt-4 flex gap-2" >
            {(needsFullAuth ? ["contact", "otp", "selfie"] : ["selfie"]).map((step, index) => (
              <div
                  key={step}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    step === currentStep || 
                    (currentStep === "complete" && index < (needsFullAuth ? 3 : 1))
                    ? "bg-primary" 
                    : currentStep === "otp" && step === "contact"
                    ? "bg-primary"
                    : currentStep === "selfie" && (step === "contact" || step === "otp")
                    ? "bg-primary"
                    : "bg-muted"
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
              <div className={`flex items-center gap-3 ${language === 'he' ? 'flex-row-reverse' : 'flex-row'}`}>
                <p className="text-muted-foreground text-sm">
                  {loadingMessage}
                </p>
                <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          )}
          
          {!isLoading && needsFullAuth && currentStep === "contact" && (
            isEmailMode ? (
              <EmailInput 
                onSubmit={handleContactSubmit}
                onBack={onCancel}
              />
            ) : (
              <PhoneCountryInput 
                onSubmit={handleContactSubmit}
                onBack={onCancel}
              />
            )
          )}
          
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
              onBack={needsFullAuth ? () => setCurrentStep("otp") : onCancel}
              autoOpenCamera = {true}
            />
          )}
        </div>
      </div>
    </div>
  );
};
