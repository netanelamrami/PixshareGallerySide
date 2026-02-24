import React,{ useEffect, useState,  } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useMultiUserAuth } from "@/contexts/AuthContext";
import { SettingsMenu } from "@/components/ui/settings-menu";
import { Heart, Camera, Users, Loader2, Images } from "lucide-react";
import { event } from "@/types/event";
import { EventLockModal } from "./EventLockModal";
import {Language} from '../../types/gallery'
import { isMobile } from "@/utils/deviceUtils";
import { apiService } from "@/data/services/apiService";

interface WeddingHeroProps {
  event: event;
  onViewAllPhotos: () => void;
  onViewMyPhotos: () => void;
  isLoadingAllPhotos?: boolean;
  isLoadingMyPhotos?: boolean;
  showAllPhotosBt?: boolean;
}

export const WeddingHero = ({ event, onViewAllPhotos, onViewMyPhotos, isLoadingAllPhotos = false, isLoadingMyPhotos = false, showAllPhotosBt = false }: WeddingHeroProps) => {
  const { t, setLanguage, language } = useLanguage();
  const { isAuthenticated, currentUser } = useMultiUserAuth();
  const [isEventLockModalOpen, setIsEventLockModalOpen] = useState(false);
  const [eventPhoto, setEventPhoto] = useState('');

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
      window.dispatchEvent(new CustomEvent('switchToMyPhotos', { detail:  currentUser }));
      
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

  // Handle All Photos button click
  const handleAllPhotosClick = () => {
     window.dispatchEvent(new CustomEvent('switchToAllPhotos', { detail: { type: 'all' } }));
  };

 
  // useEffect(() => {
  //   if (event?.eventPhoto) {
  //     const img = new Image();
  //     img.src = event.eventPhoto;
  //     img.onload = () => {
  //       setLoaded(true);
  //     };
  //     img.onerror = () => {
  //       setLoaded(false);
  //     };
  //   }
  // }, [event]);
  // Return loading skeleton if event data is not yet loaded
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
    <div className="relative h-screen w-full overflow-hidden">
      {/* Settings Menu */}
      <div className="absolute top-6 right-6 z-20">
        <SettingsMenu event={event} />
      </div>

      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
             backgroundImage: event ? `url(${eventPhoto})` : 'none'
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/25 backdrop-blur-[0px]" />
      </div>

      {event?.id === 694 && (
        <button
          onClick={() =>
            window.open(
              language === 'he'
                ? 'https://www.wzo.org.il/sub/39th-zionist-congress/utilities'
                : 'https://www.wzo.org.il/sub/39th-zionist-congress/utilities/en',
              '_blank'
            )
          }
          className="absolute left-0 top-1/2 -translate-y-[90%] z-30"
        >
          <img
            src={language === 'he' ? '/public/BtHe694.jpg' : '/public/BtEn694.jpg'}
            alt="Custom Button"
            className="w-52 hover:scale-110 transition-transform duration-300 rounded-lg"
          />
        </button>
      )}



      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-end text-center px-4 pb-24">
        {/* Heart Icon */}
        {/* <div className="mb-8 p-4 rounded-full bg-white/10 backdrop-blur-md">
          <Heart className="w-12 h-12 text-white fill-white" />
        </div> */}

      {/* Names */}
      <div className="mb-4">
        {event?.id === 694 ? (
          <>
            <h3 className="md:text-xl font-semibold text-white mb-1 tracking-wide">
               {language === 'he' ? 'מעלים סלפי ומקבלים אלבום אישי' : 'Take a selfie & Get your photos'}
            </h3>
          </>
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 tracking-wide">
              {event?.name || 'Loading...'}
            </h1>
            {event?.description && (
              <h3 className="md:text-xl font-semibold text-white mb-1 tracking-wide">
                {event?.description}
              </h3>
            )}
          </>
        )}
      </div>


        {/* Subtitle */}
        {/* <p className="text-lg md:text-xl text-white/80 mb-12 max-w-2xl leading-relaxed">
          {t('hero.subtitle')}
          <br />
          כאן תוכלו למצוא את כל הזכרונות היפים מהיום המיוחד שלנו
        </p> */}

        {/* Buttons */}
        <div className="flex flex-row sm:flex-row gap-4 w-full max-w-md mx-auto justify-center">
          {event?.hasFaceRecognition && (
          <Button
            onClick={handleMyPhotosClick}
            variant="outline"
            size="lg"
            disabled={isLoadingMyPhotos}
            className="border-white bg-white/10 text-white hover:bg-white/20 backdrop-blur-md px-6 py-3 text-base font-medium min-w-[150px] shadow-xl md:px-8 md:py-6 md:text-lg md:min-w-[200px] disabled:opacity-50"
          >
            {language === 'he' ? (
              <>
                <span>
                  {event?.btFaceRecognitionText || t('auth.takeSelfie')}
                </span>
                {isLoadingMyPhotos ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <img src="/public/faceRecognitiomIcon.png" className="w-5" alt="" />
                  // <Users className="w-5 h-5 ml-2" />
                )}
              </>
            ) : (
              <>
                {isLoadingMyPhotos ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <img src="/public/faceRecognitiomIcon.png" className="w-5" alt="" />
                  // <Users className="w-5 h-5 mr-2" />
                )}
                <span>
                  {event?.btFaceRecognitionTextEN || t('auth.takeSelfie')}
                </span>
              </>
            )}
          </Button>
          )}

          {/* Show All Photos button only if withPhotos is true */}
          {(event?.withPhotos || showAllPhotosBt || !event?.hasFaceRecognition) && (
            <Button
              onClick={handleAllPhotosClick}
              size="lg"
              disabled={isLoadingAllPhotos}
              className="bg-white text-black hover:bg-white/90 px-4 py-3 text-base font-medium min-w-[150px] shadow-xl md:px-8 md:py-6 md:text-lg md:min-w-[200px] disabled:opacity-50"
            >
              {language === 'he' ? (
                <>
                  <span>{t('hero.allPhotos')}</span>
                  {isLoadingAllPhotos ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Images className="w-5 h-5 ml-2" />
                  )}
                </>
              ) : (
                <>
                  {isLoadingAllPhotos ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Images className="w-5 h-5 mr-2" />
                  )}
                  <span>{t('hero.allPhotos')}</span>
                </>
              )}
            </Button>
          )}
        </div>

        {/* Privacy Agreement */}
        <div className="mt-6 text-center">
          <p className="text-xs text-white/70 max-w-sm mx-auto leading-relaxed">
            {t('privacy.agreement.prefix')}{' '}
            <button
              className="underline hover:text-white/90 transition-colors"
              onClick={() =>{
                console.log(localStorage.getItem('language'))
                 window.open("https://www.pixshare.live/takanon?lang=" + (localStorage.getItem('language') === 'he' ? 'he' : 'en'), "_blank")
}}
            >
              {t('privacy.terms')}
            </button>
            {' '}{t('privacy.agreement.and')}{' '}
            <button
              className="underline hover:text-white/90 transition-colors"
              onClick={() => window.open("https://www.pixshare.live/privacy?lang=" + (localStorage.getItem('language') === 'he' ? 'he' : 'en') , "_blank")}
            >
              {t('privacy.policy')}
            </button>
          </p>
        </div>


      {/* Pix Image */}
{/* <div className="sticky fixed  top-[100vh]">
  <img className="w-24" src="../../../public/whitepixlogo.png" alt="" />
</div> */}


        {/* Scroll Indicator */}
        {/* <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div> */}
      </div>
    </div>
  );
};