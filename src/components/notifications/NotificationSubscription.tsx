import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PhoneCountryInput } from "@/components/auth/PhoneCountryInput";
import { EmailInput } from "@/components/auth/EmailInput";
import { OTPVerification } from "@/components/auth/OTPVerification";
import { useLanguage } from "@/hooks/useLanguage";
import { event } from "@/types/event";
import { Bell, Mail, Phone, X, Copy, Check } from "lucide-react";
import { apiService } from "@/data/services/apiService";
import { toast } from "../ui/use-toast";
import { useMultiUserAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import countries from "@/types/contries";
import { getDownloadFormData, saveDownloadFormData } from "@/utils/downloadUtils";

type NotificationStep = "collapsed" | "contact" | "otp" | "on" | "hidden" | "off";

interface NotificationSubscriptionProps {
  event: event;
  onSubscribe: () => void;
  onClose: () => void;
  initialStep?: NotificationStep;
}

export const NotificationSubscription = ({ event, onSubscribe, onClose, initialStep = "collapsed"}: NotificationSubscriptionProps) => {
  const [currentStep, setCurrentStep] = useState<NotificationStep>(initialStep);
  const { t, language } = useLanguage();
  const [contactInfo, setContactInfo] = useState("");
  const [notifications, setNotifications] = useState(true);
  const { currentUser, setSendNotification } = useMultiUserAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isEmailMode, setIsEmailMode] = useState(true);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    countryCode: "+972"
  });
  // setIsEmailMode(event?.registerBy === "Email");

useEffect(() => {
  setCurrentStep(initialStep);

  if (currentUser.email !== 'Anonymous') {
    setFormData(prev => ({
      ...prev,
      email: currentUser.email || ""
    }));
  }

  const country = countries.find(c =>
    currentUser.phoneNumber?.startsWith(c.code)
  );

  const phone = country
    ? currentUser.phoneNumber.replace(country.code, "")
    : currentUser.phoneNumber || "";


  if (country && !validatePhoneNumber(phone, country.toString())) {
    setFormData(prev => ({
      ...prev,
      phone: phone
    }));
  }
}, []);



  // Auto close after 7 seconds
  useEffect(() => {
    if (currentStep === "collapsed") {
      const timer = setTimeout(() => {
        setCurrentStep("hidden");
          onClose();
      }, 8000); 

      return () => clearTimeout(timer);
    }
    console.log("currentStep changed to:", currentStep);
  }, [currentStep]);
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
  const handleOTPSubmit = async(otp: string) => {
    const isVerified = await apiService.verifyOTP(contactInfo,otp)
    if (!isVerified) {
      toast({
        title: t('auth.sendError'),
        description: t('auth.otpError'),
        variant: "destructive",
      });
      return;
    }
    setCurrentStep("hidden");

    //change notification preference
const content = isEmailMode 
  ? formData.email 
  : `${formData.countryCode}${formData.phone.startsWith('05') ? formData.phone.substring(1) : formData.phone}`;
  setSendNotification(currentUser.id, true, content, isEmailMode);
    if(isEmailMode){
      await apiService.sendWelcomeEmail(content,event.eventLink, currentUser.id)
    }else{
      await apiService.sendWelcomeSMS(content,event.eventLink , currentUser.id.toString())
    }
    toast({
        title: t('notifications.notificationsEnabled'),
        description: t('notifications.subscribeSuccess'),
      });
    // setCurrentStep("hidden");
    onSubscribe(); 
    setTimeout(() => {
      }, 20000);
  };

  const turnOffNotification = () => {
      localStorage.setItem('notificationSubscription', 'false');
      setSendNotification(currentUser.id, false,'',true);
      toast({
        title: t('notifications.notificationsDisabled'),
        description: t('notifications.notificationsDisabled'),
      });
  };

const validatePhoneNumber = (number: string, countryCode: string): boolean => {
    const selectedCountry = countries.find(country => country.code === countryCode);
    if (!selectedCountry) return false;
    
    // Remove leading zero and any spaces/dashes
    const cleanNumber = number.replace(/^0/, '').replace(/[\s-]/g, '');
    
    return selectedCountry.pattern.test(cleanNumber);
  };


  const stepTitles = {
    collapsed: "",
    contact: t('notifications.subscribeTo'),
    otp: t('auth.otpVerification'),
    complete: t('notifications.subscribeSuccess'),
    on: t('notifications.register'),
    off: t('notifications.off'),
  };

  if (currentStep === "hidden") {
    return null;
  }

  if (currentStep === "collapsed") {
    return (

        <div className="fixed top-14 left-0 right-0 z-[60] mx-2   sm:right-0 sm:left-auto sm:transform-none sm:max-w-md animate-fade-in min-w-[350px]">  
          <div className="bg-card/95 backdrop-blur-sm border border-accent/50 text-card-foreground rounded-lg shadow-lg p-3 w-full sm:max-w-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-500" />
                <div>
                  <h3 className="font-medium text-sm">
                    {language === 'he' ? 'התראות על תמונות חדשות' : 'New Photo Notifications'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {language === 'he' ? 'קבל התראה כשמעלים תמונות חדשות' : 'Get notified when new photos are uploaded'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={() => setCurrentStep("on")}
                  className="h-7 px-2 text-xs"
                >
                  {language === 'he' ? 'הירשם' : 'Subscribe'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>{ setCurrentStep("hidden"); onClose()}}
                  className="h-7 w-7 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                {stepTitles[currentStep]}
              </h2>
            </div>
            <button 
              onClick={() => {setCurrentStep("collapsed"); onClose();}}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress indicator */}
          {currentStep !== "on"  && currentStep !== "off" && (
            <div className="mt-4 flex gap-2">
              {["contact", "otp"].map((step, index) => (
                <div
                  key={step}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    step === currentStep || 
                    (currentStep === "otp" && step === "contact")
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
          {currentStep === "contact" && !isLoading && (
            <>
              <div className="mb-4 text-center">
                <p className="text-muted-foreground text-sm">
                  {t('notifications.subtitle')}
                </p>
              </div>

               {isEmailMode ? (
                <div className="space-y-2">
                   <Label htmlFor="email" className="flex items-center gap-2">
                     <Mail className="h-4 w-4" />
                     {t('notifications.enterEmail')}
                   </Label>
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pr-10 pr-4 py-3  border border-gray-300 
                                  bg-gray-50 placeholder-gray-400 text-sm"
                        required
                        dir="ltr"
                      />
                      {/* <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" /> */}

                   </div>
                       <div className="mt-3 text-center text-sm text-muted-foreground">
                    <button
                      onClick={() => setIsEmailMode(false)}
                      className="text-primary hover:underline"
                    >
                      {t('auth.orUsePhone')} {/* למשל "או הירשם באמצעות טלפון" */}
                    </button>
                  </div>
                 </div>
                ) : (

                 <div className="space-y-2">
                   <Label htmlFor="phone" className="flex items-center gap-2">
                     <Phone className="h-4 w-4" />
                     {t('notifications.enterPhone')}
                   </Label>
                   <div className="flex gap-2" dir="ltr">
                     <Select value={formData.countryCode} onValueChange={(value) => setFormData(prev => ({ ...prev, countryCode: value }))}>
                       <SelectTrigger className="w-32">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         {countries.map((country) => (
                           <SelectItem key={country.code} value={country.code}>
                             <div className="flex items-center gap-2">
                               <span>{country.flag}</span>
                               <span>{country.code}</span>
                               <span className="text-sm text-muted-foreground">
                                 {country.name[language as keyof typeof country.name]}
                               </span>
                             </div>
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                     
                     <Input
                       id="phone"
                       type="tel"
                       value={formData.phone}
                       onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                       placeholder={t('auth.enterPhone')}
                       className="flex-1"
                       dir="ltr"
                     />
                   </div>
                    <div className="mt-3 text-center text-sm text-muted-foreground">
                      <button
                        onClick={() => setIsEmailMode(true)}
                        className="text-primary hover:underline"
                      >
                        {t('auth.orUseEmail')} {/* למשל "או הירשם באמצעות מייל" */}
                      </button>
                    </div>
                 </div>
              )}
              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                   onClick={() => setCurrentStep("on")}
                  className="flex-1"
                  >
                  {t('common.back')}
                </Button>
              <Button
                type="submit"
                className="flex-1"
                onClick={() => {
                  const content = isEmailMode
                    ? formData.email
                    : `${formData.countryCode}${formData.phone.startsWith('05') ? formData.phone.substring(1) : formData.phone}`;

                  handleContactSubmit(content, true);
                }}
              >
                {t('auth.sendCode')}
              </Button>

              </div>
            </>
            )}
    
          {currentStep === "otp" && (
            <OTPVerification 
              phoneNumber={contactInfo}
              onSubmit={handleOTPSubmit}
              onBack={() => setCurrentStep("contact")}
            />
          )}

          {currentStep === "on" && (
            <div className="text-center">
              {/* <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg mb-4">
                <div className="text-green-600 dark:text-green-400 text-sm">
                  ✓ {t('notifications.subscribeSuccess')}
                </div>
              </div> */}

              
              <div className="bg-muted/50 p-4 rounded-lg mb-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                    {language === 'he' ? 'העתק ושמור את הקישור' : 'Copy and save your link'}
                    <br />

                    {language === 'he' ? (
                      <>
                        לצפייה ישירה בגלריה האישית של{' '}
                  <span className="font-medium text-foreground px-1 rounded-md bg-foreground/5">
                          {currentUser.name}
                        </span>
                      </>
                    ) : (
                      <>
                        to view{' '}
                        <span className="font-medium text-foreground">
                          {currentUser.name}'s
                        </span>{' '}
                        personal gallery directly
                      </>
                    )}
                  </p>

                <div className="flex items-center gap-2">
                  <Input
                    value={`https://gallery.pixshare.live/${event.eventLink}?userid=${currentUser.id}`}
                    readOnly
                    className="flex-1 text-xs bg-background"
                    dir="ltr"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://gallery.pixshare.live/${event.eventLink}?userid=${currentUser.id}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                      toast({
                        title: language === 'he' ? 'הקישור הועתק' : 'Link copied',
                        description: language === 'he' ? 'הקישור האישי שלך הועתק ללוח' : 'Your personal link has been copied to clipboard',
                      });
                    }}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            
              <Button onClick={() =>{ setCurrentStep("contact");}} className="w-full">
                {t('notifications.on')}
              </Button>
            </div>
          )}

          {currentStep === "off" && (
            <div className="text-center">
              {/* <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg mb-4">
                <div className="text-green-600 dark:text-green-400 text-sm">
                  ✓ {t('notifications.subscribeSuccess')}
                </div>
              </div> */}

              
              <div className="bg-muted/50 p-4 rounded-lg mb-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {language === 'he' ? 'העתק ושמור את הקישור' : 'Copy and save your link'}
                  <br />
                  {language === 'he' ? 'לצפייה ישירה בגלריה האישית שלך' : 'to view your personal gallery directly'}
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    value={`https://gallery.pixshare.live/${event.eventLink}?userid=${currentUser.id}`}
                    readOnly
                    className="flex-1 text-xs bg-background"
                    dir="ltr"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://gallery.pixshare.live/${event.eventLink}?userid=${currentUser.id}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                      toast({
                        title: language === 'he' ? 'הקישור הועתק' : 'Link copied',
                        description: language === 'he' ? 'הקישור האישי שלך הועתק ללוח' : 'Your personal link has been copied to clipboard',
                      });
                    }}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            
              <Button onClick={() =>{ turnOffNotification(); setCurrentStep("hidden");}} className="w-full bg-red-400 hover:bg-red-500">
                {t('notifications.off')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

