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
      window.dispatchEvent(new CustomEvent('switchToMyPhotos', { detail: currentUser }));
      setTimeout(() => {
        document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      onViewMyPhotos();
    }
  };

  // Handle All Photos button click
  const handleAllPhotosClick = () => {
    window.dispatchEvent(new CustomEvent('switchToAllPhotos', { detail: { type: 'all' } }));
  };

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
        style={{ backgroundImage: event ? `url(${eventPhoto})` : 'none' }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/25 backdrop-blur-[0px]" />
      </div>

      {/* Custom floating button — configured per event in photographer settings */}
      {(() => {
        const imgSrc = language === 'he' ? event?.customButtonImageHE : event?.customButtonImageEN;
        const link   = language === 'he' ? event?.customButtonLinkHE  : event?.customButtonLinkEN;
        if (!imgSrc) return null;
        return (
          <button
            onClick={() => link && window.open(link, '_blank')}
            className="absolute left-0 top-1/2 -translate-y-[90%] z-30"
          >
            <img
              src={imgSrc}
              alt="Custom Button"
              className="w-52 hover:scale-110 transition-transform duration-300 rounded-lg"
            />
          </button>
        );
      })()}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-end text-center px-4 pb-24">

        {/* Names */}
        <div className="mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 tracking-wide">
            {event?.name || 'Loading...'}
          </h1>
          {event?.description && (
            <h3 className="md:text-xl font-semibold text-white mb-1 tracking-wide">
              {event?.description}
            </h3>
          )}
        </div>

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
                  )}
                </>
              ) : (
                <>
                  {isLoadingMyPhotos ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <img src="/public/faceRecognitiomIcon.png" className="w-5" alt="" />
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
              onClick={() => window.open("https://www.pixshare.live/takanon?lang=" + (localStorage.getItem('language') === 'he' ? 'he' : 'en'), "_blank")}
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
      </div>
    </div>
  );
};
