import React, { useEffect, useState, } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useMultiUserAuth } from "@/contexts/AuthContext";
import { SettingsMenu } from "@/components/ui/settings-menu";
import { Heart, Camera, Users, Loader2, Images, ArrowRight, Info } from "lucide-react";
import { event } from "@/types/event";
import { EventLockModal } from "./EventLockModal";
import { Language } from '../../types/gallery'
import { isMobile } from "@/utils/deviceUtils";
import { apiService } from "@/data/services/apiService";
import { AuthFlowKimama } from "@/components/auth/AuthFlowKimama";
import { User } from "@/types/auth";
import { UserAvatarStack } from "../ui/UserAvatarStack";
import { AddUserModal } from "../users/AddUserModal";
import { ChevronDown } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@radix-ui/react-alert-dialog";
import { AlertDialogFooter, AlertDialogHeader } from "../ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
interface KimamaFormProps {
  event: event;
  onViewAllPhotos: () => void;
  onViewMyPhotos: () => void;
  onComplete: (userData: User) => void;
  isLoadingAllPhotos?: boolean;
  isLoadingMyPhotos?: boolean;
  showAllPhotosBt?: boolean;
}

export const KimamaForm = ({ event, onViewAllPhotos, onViewMyPhotos, onComplete, isLoadingAllPhotos = false, isLoadingMyPhotos = false, showAllPhotosBt = false }: KimamaFormProps) => {
  const { t, setLanguage, language } = useLanguage();
  const { users, isAuthenticated, currentUser, switchUser } = useMultiUserAuth();
  const [isEventLockModalOpen, setIsEventLockModalOpen] = useState(false);
  const [eventPhoto, setEventPhoto] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showConfirmChangeSelfie, setShowConfirmChangeSelfie] = useState(false);
  const [showAuthFlowPartial, setShowAuthFlowPartial] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const currentUserRef = React.useRef<HTMLDivElement | null>(null);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
   const subject = encodeURIComponent("פנייה לצוות קימאמה | Pixshare");

  useEffect(() => {
    // Set event photo based on device type
    if (!isMobile() && !event?.isEventPhotoSame) {
      setEventPhoto(event?.eventPhotoComp);
    } else {
      setEventPhoto(event?.eventPhoto);
    }
    // Set default language based on event language
    if (event?.eventLanguage) {
      const defaultLang = event.eventLanguage === 'HE' ? 'he' : 'en';
      const params = new URLSearchParams(window.location.search);
      const langParam = params.get('lang');

      if (langParam) {

        setLanguage(langParam as 'en' | 'he');
        return;
      }

      setLanguage(defaultLang)
    }
    updateEnterToGallery();
  }, [event?.eventLanguage]);
  useEffect(() => {
    if (currentUserRef.current) {
      currentUserRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentUser?.id]);


  const updateEnterToGallery = () => {
    const now = Date.now();
    const lastVisit = localStorage.getItem("lastGalleryVisit");

    if (!lastVisit || now - parseInt(lastVisit) > 3 * 60 * 1000) {
      apiService.updateStatistic(event.id, "EnterToGallery");
      localStorage.setItem("lastGalleryVisit", now.toString());
    }
  };
  // Handle My Photos button click
  const handleMyPhotosClick = () => {
    if (isAuthenticated && currentUser) {
      // User is already authenticated, dispatch event to switch to my photos
      window.dispatchEvent(new CustomEvent('switchToMyPhotos', { detail: currentUser }));

      // Scroll to gallery
      setTimeout(() => {
        document.getElementById('gallery')?.scrollIntoView({
          behavior: 'smooth'
        });
      }, 100);
    } else {
      // User needs to authenticate first
      onViewMyPhotos();
    }
  };
  const onLinkOpen = () => {
    setIsTelegramModalOpen(true);
  };
  const handleOpenTelegram = () => {
    window.open(event?.externalLink, "_blank");
  };

  const handleCloseTelegram = () => {
    setIsTelegramModalOpen(false);
  };
  const sortedUsers = React.useMemo(() => {
    if (!users || !currentUser) return users;

    const others = users.filter(u => u.id !== currentUser.id);
    const middleIndex = Math.floor(others.length / 2);

    return [
      ...others.slice(0, middleIndex),
      currentUser,
      ...others.slice(middleIndex),
    ];
  }, [users, currentUser]);
  const UsersAvatarCarusel = ({ user, isCurrent }: { user: User; isCurrent: boolean }) => (
    <div
      className={`
      flex flex-col items-center transition-all duration-300
      ${isCurrent ? 'scale-110 z-10' : 'opacity-80'}
    `}
    >
      <div
        className={`
        relative rounded-full overflow-hidden shadow-lg
        bg-gradient-to-br from-[#FF8C00] via-[#FFA13A] to-[#FFB703]
        ${isCurrent ? 'w-20 h-20 border-4' : 'w-16 h-16 border-2'}
        border-[hsl(179_40%_60%)/0.3]
      `}
      >
        <img
          src={user.photoUrl}
          alt={user.name}
          className="w-full h-full object-cover"
        />
      </div>

      <p className={`mt-2 ${isCurrent ? 'text-sm font-bold' : 'text-sm font-medium'} text-foreground`}>
        {user.name}
      </p>

      {isCurrent && (
        <p className="text-xs text-muted-foreground ltr">
          {user.phoneNumber}
        </p>
      )}
    </div>
  );

  // Handle All Photos button click
  const handleAllPhotosClick = () => {
    window.dispatchEvent(new CustomEvent('switchToAllPhotos', { detail: { type: 'all' } }));
  };

  if (!event) {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-muted animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-b from-muted to-muted-foreground/20" />
        <div className="relative z-10 h-full flex flex-col items-center justify-end text-center px-4 pb-24">
          <div className="mb-4 h-12 w-64 bg-muted-foreground/20 rounded animate-pulse" />
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
            <div className="h-12 bg-muted-foreground/20 rounded flex-1 animate-pulse" />
            <div className="h-12 bg-muted-foreground/20 rounded flex-1 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>

      <div className="relative h-screen w-full overflow-hidden">
        {/* Settings Menu */}
        {/* <div className="absolute top-6 right-6 z-30">
          <SettingsMenu event={event} />
        </div> */}
        <div className="absolute top-6 right-6 z-30">
          <button
            onClick={() => setIsFaqOpen(true)}
            className="bg-white/20 backdrop-blur-sm text-white rounded-full p-2 hover:bg-white/30 transition"
          >
            <Info className="w-6 h-6" />
          </button>
        </div>
        {/* kimama logo */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30">
          <img src="https://pixshare-storage.s3.eu-west-1.amazonaws.com/customer-logos/kimamaLogo-32.avif" alt="Kimama Logo" className="w-[180px] h-auto" />
        </div>
        {/* {(event?.externalLink) && (

          <div className="absolute top-6 left-6 z-30">
            <Button
              type="button"
              onClick={onLinkOpen}
              className="w-12 h-12 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center p-0"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-12 h-12 text-blue-500"
                fill="currentColor"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.84 8.683c-.138.633-.5.784-1.013.488l-2.804-2.066-1.351 1.302c-.15.15-.275.275-.563.275l.2-2.85 5.188-4.688c.225-.2-.05-.313-.35-.113l-6.413 4.038-2.763-.863c-.6-.188-.613-.6.125-.888l10.8-4.162c.5-.188.938.113.775.888z" />
              </svg>
            </Button>
          </div>

        )} */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat overflow-hidden"
          style={{
            backgroundImage: event ? `url(${eventPhoto})` : 'none'
          }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70 fixed" />

          {/* Names */}
          <div className="mb-4 mx-auto absolute z-20 w-full flex flex-col items-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mt-[14vh] tracking-wide text-center max-w-[80%] mx-auto break-words">
              {event?.name || 'Loading...'}
            </h1>

            {event?.description && (
              <h3 className="md:text-xl font-semibold text-white mb-1 tracking-wide text-center">
                {event?.description}
              </h3>
            )}
          </div>

        </div>

        {!isAuthenticated && (
          <>

            <div className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-center w-full animate-slide-up">
              <AuthFlowKimama
                event={event}
                onComplete={(user) => {
                  onComplete(user);
                }}
                onLinkOpen={onLinkOpen}
                onCancel={() => { }}
                needsFullAuth={true}
              />

            </div>

            {/* Privacy Agreement */}
            <div className="mt-6 text-center">
              <p className="text-xs text-white/70 max-w-sm mx-auto leading-relaxed">
                {t('privacy.agreement.prefix')}{' '}
                <button
                  className="underline hover:text-white/90 transition-colors"
                  onClick={() => {
                    window.open("https://www.pixshare.live/takanon?lang=" + (localStorage.getItem('language') === 'he' ? 'he' : 'en'), "_blank")
                  }}
                >
                  {t('privacy.terms')}
                </button>
                {' '}{t('privacy.agreement.and')}{' '}
                <button
                  className="underline hover:text-white/90 transition-colors"
                  onClick={() => window.open("https://www.pixshare.live/privacy?lang=" + (localStorage.getItem('language') === 'he' ? 'he' : 'en'), "_blank")}
                >
                  {t('privacy.policy')}
                </button>
              </p>
            </div>
          </>
        )}

        {isAuthenticated && !showAuthFlowPartial && (

          <div className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-center w-full animate-slide-up">
            <div className="flex flex-col w-full max-w-[450px] mx-auto bg-background rounded-t-[2rem] shadow-2xl overflow-hidden">
              {/* Header */}
              {/* <div className="text-center mt-6 mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-2">{t('welcomeBack')}</h1>
            </div> */}


              {/* User Avatar + Info
            <div className="flex flex-col items-center mt-6 mb-6" dir={language === 'he' ? 'rtl' : 'ltr'}>
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#FF8C00] via-[#FFA13A] to-[#FFB703] border-4 border-[hsl(179_40%_60%)/0.3] shadow-lg mb-4 overflow-hidden">
                <img
                  src={currentUser?.photoUrl}
                  alt={currentUser?.name || 'Profile'}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <p className="text-xl font-bold text-foreground mb-1">{currentUser?.name}</p>
              <p className="text-sm text-muted-foreground ltr">{currentUser?.phoneNumber}</p>
            </div> */}
              {/* Users Carousel */}
              <div
                ref={scrollRef}
                className="w-full overflow-x-auto no-scrollbar px-4"
                dir={language === 'he' ? 'rtl' : 'ltr'}
              >
                <div className="flex items-center gap-6 flex-nowrap justify-center min-w-max mt-4  py-4">
                  {sortedUsers.map(user => {
                    const isCurrent = user.id === currentUser?.id;

                    return (
                      <div
                        key={user.id}
                        ref={isCurrent ? currentUserRef : null}
                        onClick={() => switchUser(user.id)}
                      >
                        <UsersAvatarCarusel
                          user={user}
                          isCurrent={isCurrent}
                        />
                      </div>
                    );
                  })}

                </div>
              </div>


              {/* Buttons */}
              <div className="space-y-3 w-[90%] items-center mx-auto " >
                <div className="flex gap-4">

                  <Button
                    onClick={handleMyPhotosClick}
                    className="w-full  focus:ring-[#FFB347]/40  focus:border-[#FF8C00]
                    focus:ring-[#FFB347]/40
                    focus:ring-offset-0
                    focus-visible:ring-[#FFB347]/40
                    focus:ring-offset-0 focus:border-[#FF8C00] bg-gradient-to-r from-[#FFB347] via-[#FFC36A] to-[#FFB347] bg-[length:200%_200%] hover:bg-[position:100%_0%] text-primary-foreground font-semibold rounded-xl py-4 px-4 shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 h-auto"
                    dir={language === 'he' ? 'rtl' : 'ltr'}
                  >
                    {language === 'he' ? (
                      <>

                        {isLoadingMyPhotos ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <img src="/public/faceRecognitiomIcon.png" className="w-5" alt="" />
                          // <Users className="w-5 h-5 ml-2" />
                        )}
                        <span>
                          {t('hero.showGallery')}
                        </span>
                        {/* event?.btFaceRecognitionText ||  */}
                      </>
                    ) : (
                      <>
                        {isLoadingMyPhotos ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <img src="/public/faceRecognitiomIcon.png" className="w-5" alt="" />
                          // <Users className="w-5 h-5 mr-2" />
                        )}
                        <span>
                          {t('hero.showGallery')}
                          {/* event?.btFaceRecognitionTextEN || */}
                        </span>
                      </>
                    )}
                  </Button>

                  {/* Primary Button */}
                  {(event?.withPhotos || showAllPhotosBt) && (

                    <Button
                      onClick={onViewAllPhotos}
                      className="w-full 
                      border-2 border-[#FFB347]/70       /* border רגיל */
                      hover:border-[#FFB347]             /* border בהובר */
                      focus:border-[#FF8C00]
                      focus:ring-[#FFB347]/40
                      focus:ring-offset-0
                      focus-visible:ring-[#FFB347]/40
                      bg-background border-2  border-border text-foreground font-semibold rounded-xl py-4 px-4 hover:border-[hsl(179_40%_60%)] hover:bg-[hsl(179_40%_60%/0.05)] active:scale-95 transition-all flex items-center justify-center gap-3 h-auto"
                      // className="w-full bg-gradient-to-r from-[#FFB347] via-[#FFC36A] to-[#FFB347] bg-[length:200%_200%] hover:bg-[position:100%_0%] text-primary-foreground font-semibold rounded-xl py-4 px-4 shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 h-auto"
                      dir={language === 'he' ? 'rtl' : 'ltr'}
                    >
                      {/* <Images className="w-5 h-5 flex-shrink-0" /> */}
                      {isLoadingAllPhotos ? (
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      ) : (
                        <Images className="w-5 h-5 " />
                      )}
                      <span>{t('hero.allPhotos')}</span>
                    </Button>
                  )}

                </div>

                {/* Secondary Button */}
                <Button
                  variant="ghost"
                  onClick={() => setShowConfirmChangeSelfie(true)}
                  className="
                  border-gray-300          /* גבול אפור בהיר */
                  text-gray-400            /* טקסט אפור */
                  hover:border-gray-400    /* גבול כהה יותר בהובר */
                  hover:bg-gray-200        /* רקע כהה יותר בהובר */
                  active:scale-95 
                  transition-all 
                   mx-auto
                  flex items-center justify-center gap-3 h-auto"
                  dir={language === 'he' ? 'rtl' : 'ltr'}
                >
                  <Camera className="w-5 h-5 flex-shrink-0  text-gray-400" />
                  <span>{t('changeSelfie')}</span>
                </Button>
              </div>

              {/* Event Info */}
              <div className="mt-6 p-4 bg-[hsl(179_40%_60%/0.05)] rounded-xl border border-[hsl(179_40%_60%/0.2)]">
                <p className="text-sm text-muted-foreground text-center">
                  {event?.name && <span className="font-semibold text-foreground block mb-1">{event.name}</span>}
                  {/* {t('photosAvailableAfterEvent')} */}
                  {currentUser && (
                    <span>
                      {users?.length > 1
                        ? language === 'he'
                          ? `התמונות של ${currentUser.name} מוצגות ראשונות`
                          : `${currentUser.name}'s photos are displayed first`
                        : language === 'he'
                          ? `התמונות של ${currentUser.name} מגיעות לכאן`
                          : `${currentUser.name}'s photos will be available here`}
                    </span>
                  )}

                </p>
              </div>

            </div>
          </div>
        )}
        <AddUserModal
          isOpen={showAddUser}
          onClose={() => setShowAddUser(false)}
          event={event}
        />



        {showAuthFlowPartial && (
          <div className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-center w-full animate-slide-up">
            <AuthFlowKimama
              event={event}
              needsFullAuth={false}
              userPhone={currentUser.phoneNumber}
              onComplete={(user) => {
                setShowAuthFlowPartial(false);
                onComplete(user);
                window.location.reload();
              }}
              onCancel={() => setShowAuthFlowPartial(false)}
            />
          </div>
        )}

      </div>
      <Dialog
        open={showConfirmChangeSelfie}
        onOpenChange={setShowConfirmChangeSelfie}
      >
        <DialogContent className="max-w-md z-[9999]">
          <DialogHeader>
            <DialogTitle className="text-center">
              {language === 'he' ? 'שינוי סלפי' : 'Change Selfie'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              {language === 'he'
                ? 'פעולה זו תמחק את הזיהוי הקיים עם שאר המשתמשים תחתיו'
                : 'This action will remove the existing identification associated with other users'}
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              className="w-full"
              variant="destructive"
              onClick={() => {
                setShowConfirmChangeSelfie(false);
                setShowAuthFlowPartial(true);
              }}
            >
              {language === 'he' ? 'אישור' : 'Confirm'}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowConfirmChangeSelfie(false)}
            >
              {language === 'he' ? 'ביטול' : 'Cancel'}
            </Button>


          </div>
        </DialogContent>
      </Dialog>
      {isFaqOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 text-start"
          onClick={() => setIsFaqOpen(false)}
        >
          <div
            className="relative text-start bg-white rounded-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[80vh] sm:max-h-[90vh] overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            dir={language === "he" ? "rtl" : "ltr"}
          >
            {/* Header */}
            <div className="sticky text-start top-0 bg-gradient-to-r from-orange-500 to-yellow-400 px-6 py-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white flex-1">
                {language === "he" ? "שאלות נפוצות" : "FAQ"}
              </h2>

              {/* Language Toggle */}
              <button
                onClick={() => setLanguage(language === "he" ? "en" : "he")}
                className="flex items-center text-start gap-2 bg-white/20 hover:bg-white/30 text-white rounded-full px-3 py-1.5 transition text-sm font-medium"
              >
                <span>{language === "he" ? "EN" : "עב"}</span>
              </button>
              {/* Settings Menu */}
              <div >
                <SettingsMenu event={event} />
              </div>

              {/* Close */}
              <button
                onClick={() => setIsFaqOpen(false)}
                className="text-white text-start hover:bg-white/20 rounded-full p-1 transition"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto text-start max-h-[calc(80vh-80px)] sm:max-h-[calc(90vh-80px)] px-6 py-4 space-y-4 " >

              {/* FAQ Item */}
              <div className="flex-1 overflow-y-auto  py-4 space-y-4 max-h-[calc(80vh-350px)]">

                {[
                  {
                    en: "What is an AI Gallery?",
                    he: "מה זה גלריית AI?",
                    answerEn: "A personalized gallery for every participant. Upload a selfie, and our AI facial recognition will automatically gather all your child's photos into one smart gallery, where you can easily download and share them.",
                    answerHe: "גלריה אישית לכל משתתף, העלו סלפי ובעזרת זיהוי פנים כל התמונות של הילד שלכם יתמלאו בגלריה החכמה, ניתן להוריד ולשתף את התמונות בקלות."
                  },
                  {
                    en: "How will I know when new photos are added?",
                    he: "איך אדע שיש תמונות חדשות?",
                    answerEn: "You can enter the gallery at any time to check for updates. Additionally, after uploading a selfie, you can click the Bell icon and subscribe to email alerts. We'll notify you whenever new photos of your child are added. Please note to subscribe separately for each child.",
                    answerHe: "תוכלו להיכנס לגלריה בכל עת ולהתעדכן, ובנוסף ניתן להירשם להתראות במייל. לאחר העלאת הסלפי לחצו על הפעמון והירשמו. אנחנו נשלח לכם הודעה בכל פעם שתמונות חדשות של ילדכם יופיעו בגלריה. שימו לב להירשם להתראה לכל ילד בנפרד."
                  },
                  {
                    en: "How can I quickly access my gallery?",
                    he: "איך נכנסים לגלריה במהירות?",
                    answerEn: "Once registered with a selfie, click the Bell icon to get your direct personal link. Copy and save this link for instant access. Note: Each child has their own unique personal link.",
                    answerHe: "לאחר שנרשמתם עם סלפי, לחצו על אייקון הפעמון כדי לקבל לינק אישי ישיר. העתיקו ושמרו את הלינק אצלכם לגישה מהירה. שימו לב: לכל ילד יש לינק אישי נפרד."
                  },
                  {
                    en: "Can I share the photos?",
                    he: "איך משתפים את התמונות?",
                    answerEn: "You can share photos directly to WhatsApp and social media using the share button located on each individual photo in the gallery.",
                    answerHe: "ניתן לשתף תמונות ישירות לוואטסאפ ולרשתות החברתיות באמצעות כפתור השיתוף המופיע בכניסה לכל תמונה."
                  },
                  {
                    en: "How do I download all photos?",
                    he: "איך מורידים את כל התמונות?",
                    answerEn: "Enter your gallery, click the Face icon in the top menu, and select \"Download All.\" The system will prepare a zip file and email it to you for download to your computer or mobile device.",
                    answerHe: "היכנסו לגלריה, לחצו על אייקון הפנים בתפריט העליון ובחרו ב\"הורד הכל\". המערכת תכין קובץ מרוכז ותשלח אותו למייל שלכם ותוכלו להוריד למחשב או לנייד."
                  },
                  {
                    en: "How long are the photos available?",
                    he: "לכמה זמן התמונות נשמרות?",
                    answerEn: "Your personal gallery will be available for 180 days after camp ends.",
                    answerHe: "הגלריה האישית תהיה זמינה עבורכם למשך 180 יום מתום המחנה."
                  }].map((item, i) => {
                    const isOpen = openIndex === i;

                    return (
                      <div
                        key={i}
                        className="border text-sm border-gray-200 rounded-xl overflow-hidden text-start "
                      >
                        {/* Question */}
                        <button
                          onClick={() => setOpenIndex(isOpen ? null : i)}
                          className="w-full flex items-center justify-between p-4 hover:bg-orange-50 transition  text-start"
                        >
                          <h3 className="font-semibold text-gray-900 text-start">
                            {language === "he" ? item.he : item.en}
                          </h3>

                          {/* Arrow Icon */}
                          <ChevronDown
                            className={`text-orange-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                              }`}
                          />
                        </button>

                        {/* Answer */}
                        <div
                          className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? "max-h-40 opacity-100 p-4 pt-0" : "max-h-0 opacity-0"
                            }`}
                        >
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {language === "he" ? item.answerHe : item.answerEn}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
              {/* Contact */}
              <div className="mt-6 pt-4 border-t-2 border-orange-200">
                <h3 className="font-bold text-gray-900 mb-4 text-center">
                  {language === "he" ? "צור קשר" : "Contact Kimama Team"}
                </h3>


              <a
                href={`mailto:Customers@campkimama.org?subject=${subject}`}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-500 to-yellow-400 rounded-xl text-white items-center justify-center"
              >
                ✉️ Customers@campkimama.org
              </a>

                {/* Email */}
                {/* <a
                  href="mailto:support@kimama.com"
                  className="flex items-center gap-3 p-4 bg-white border-2 border-orange-300 rounded-xl mt-3"
                >
                </a> */}
                {(event.externalLink) && (
                  <div className="flex gap-3"  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onLinkOpen}
                      className="w-full bg-white mt-3 border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="w-5 h-5 text-blue-500"
                        fill="currentColor"
                      >
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.84 8.683c-.138.633-.5.784-1.013.488l-2.804-2.066-1.351 1.302c-.15.15-.275.275-.563.275l.2-2.85 5.188-4.688c.225-.2-.05-.313-.35-.113l-6.413 4.038-2.763-.863c-.6-.188-.613-.6.125-.888l10.8-4.162c.5-.188.938.113.775.888z" />
                      </svg>

                      <span className="text-sm">{language === "he" ? "טלגרם המחנה" : "Camp telegram"}</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isTelegramModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={handleCloseTelegram}>
          <div className="relative w-full max-w-sm mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-8 text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg viewBox="0 0 24 24" className="w-12 h-12 text-blue-500" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.84 8.683c-.138.633-.5.784-1.013.488l-2.804-2.066-1.351 1.302c-.15.15-.275.275-.563.275l.2-2.85 5.188-4.688c.225-.2-.05-.313-.35-.113l-6.413 4.038-2.763-.863c-.6-.188-.613-.6.125-.888l10.8-4.162c.5-.188.938.113.775.888z" />
                  </svg>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">
                  {language === "he" ? "קבוצת המחנה בטלגרם" : "Camp Group on Telegram"}
                </h2>
                <p className="text-sm text-white/90">
                  {language === "he" ? "מופעל על ידי צוות קימאמה" : "Activated by the Kimama Team"}
                </p>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                <p className="text-gray-700 text-center mb-6">
                  {language === "he"
                    ? "עבור כעת לקבוצת הטלגרם שלנו, שם תוכלו לצפות בכל סרטוני המחנה ולהישאר מעודכנים!"
                    : "You will be redirected to our Telegram group where you can watch all camp videos and stay updated with the latest content!"}
                </p>

                <div className="space-y-3">
                  {/* Open Telegram */}
                  <button
                    onClick={handleOpenTelegram}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl py-4 px-4 shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.84 8.683c-.138.633-.5.784-1.013.488l-2.804-2.066-1.351 1.302c-.15.15-.275.275-.563.275l.2-2.85 5.188-4.688c.225-.2-.05-.313-.35-.113l-6.413 4.038-2.763-.863c-.6-.188-.613-.6.125-.888l10.8-4.162c.5-.188.938.113.775.888z" />
                    </svg>
                    <span>
                      {language === "he" ? "פתח את טלגרם" : "Open Telegram"}
                    </span>            </button>

                  {/* Cancel */}
                  <button
                    onClick={handleCloseTelegram}
                    className="w-full bg-gray-100 text-gray-700 font-semibold rounded-xl py-4 px-4 hover:bg-gray-200 active:scale-95 transition-all"
                  >
                    {language === "he" ? "חזור" : "Cancel"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </>




  );
};