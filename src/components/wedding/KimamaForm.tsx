import React, { useEffect, useState, } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useMultiUserAuth } from "@/contexts/AuthContext";
import { SettingsMenu } from "@/components/ui/settings-menu";
import { Heart, Camera, Users, Loader2, Images, ArrowRight } from "lucide-react";
import { event } from "@/types/event";
import { EventLockModal } from "./EventLockModal";
import { Language } from '../../types/gallery'
import { isMobile } from "@/utils/deviceUtils";
import { apiService } from "@/data/services/apiService";
import { AuthFlowKimama } from "@/components/auth/AuthFlowKimama";
import { User } from "@/types/auth";
import { UserAvatarStack } from "../ui/UserAvatarStack";
import { AddUserModal } from "../users/AddUserModal";
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
  const { users,isAuthenticated, currentUser,switchUser } = useMultiUserAuth();
  const [isEventLockModalOpen, setIsEventLockModalOpen] = useState(false);
  const [eventPhoto, setEventPhoto] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showConfirmChangeSelfie, setShowConfirmChangeSelfie] = useState(false);
  const [showAuthFlowPartial, setShowAuthFlowPartial] = useState(false);
const scrollRef = React.useRef<HTMLDivElement | null>(null);
const currentUserRef = React.useRef<HTMLDivElement | null>(null);

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
      <div className="absolute top-6 right-6 z-30">
        <SettingsMenu event={event} />
      </div>
      {/* kimama logo */}
<div className="absolute top-8 left-1/2 -translate-x-1/2 z-30">
          <img src="https://pixshare-storage.s3.eu-west-1.amazonaws.com/customer-logos/kimamaLogo-32.avif" alt="Kimama Logo" className="w-[180px] h-auto" />
        </div>
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
                        { t('hero.showGallery')}
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
      </>

  );
};