import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Share2, Images, MessageCircle, QrCode, ArrowUp, Menu, Download, CheckSquare, Users, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { FAQSupportDialog } from './FAQSupportDialog';
import { question } from '../../types/question';
import QRCode from 'qrcode';
import { event } from "@/types/event";
import { faqData } from '@/data/faqData';
import { useIsMobile } from "@/hooks/use-mobile";
import { useMultiUserAuth } from '@/contexts/AuthContext';

interface FloatingNavbarProps {
  event: event;
  galleryType: 'all' | 'my' | 'favorites';
  onToggleGalleryType: () => void;
  onDownloadAll?: () => void;
  onToggleSelectionMode?: () => void;
  className?: string;
  imageCount?: number; 
}

export const FloatingNavbar = ({ event, galleryType, onToggleGalleryType, onDownloadAll, onToggleSelectionMode, className, imageCount = 0 }: FloatingNavbarProps) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [isQrOpen, setIsQrOpen] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const isMobile = useIsMobile();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [delayForBurger, setDelayForBurger] = useState(false);
  const { isAuthenticated, currentUser } = useMultiUserAuth();
  const [isConnect, setIsConnect] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowBackToTop(scrollTop > 1000 && imageCount > 0);
      if(showMenu)
      setTimeout(() => setShowMenu(scrollTop > 500), 0);

      // Auto-expand on first show for mobile
      if ( scrollTop > 500 && !isExpanded && !showMenu) {
        setTimeout(() => setIsExpanded(true), 0);
        setTimeout(() => setShowMenu(true), 0);

      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [imageCount, isMobile, isExpanded]);


  useEffect(() => {
    if(!showMenu){
      setIsExpanded(false);
      setDelayForBurger(false);
      setIsQrOpen(false);
    }
  }, [showMenu]);


  useEffect(() => {
    if(!isExpanded){
      setIsQrOpen(false);
    }
  }, [isExpanded]);

  useEffect(() => {
    if(!currentUser){
      setIsConnect(false);
    }
    else{
      setIsConnect(true);
    }
  }, [currentUser]);

  // Close navbar when clicking outside (mobile only)
  // useEffect(() => {
  //   if (!isMobile) return;
    
  //   const handleClickOutside = (event: MouseEvent) => {
  //     const target = event.target as Element;
  //     const navbar = target.closest('[data-floating-navbar]');
  //     if (!navbar && isExpanded) {
  //       setIsExpanded(false);
  //     }
  //   };

  //   document.addEventListener('click', handleClickOutside);
  //   return () => document.removeEventListener('click', handleClickOutside);
  // }, [isMobile, isExpanded]);

  const questions = faqData[language] || faqData.he;
  
  const generateQRCode = async () => {
    try {
      const url = window.location.href;
      const qrDataURL = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCode(qrDataURL);
      setIsQrOpen(true);
    } catch (error) {
      toast({
        title: t('toast.error.title'),
        description: t('toast.qrError.description'),
        variant: "destructive",
      });
    }
  };

  const scrollToGallery = () => {
    const galleryElement = document.getElementById('gallery');
    if (galleryElement) {
      galleryElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };


  // Desktop version - always expanded with text
  // for now same for mobail - !isMobile &&
  if ( showMenu) {
    return (
      <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 max-w-[95vw] ${className}`} >
        <div className="justify-between w-full bg-background/95 backdrop-blur-sm border shadow-lg rounded-full px-4 py-3 flex items-center ">

       {/* Support */}
          {!isMobile &&(
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSupportOpen(true)}
              className="rounded-full hover:bg-accent px-4 py-2 text-sm"
            >
              <MessageCircle className="h-4 w-4  md:mr-1" />
            <span>{language === 'he' ? 'תמיכה' : 'Support'}</span>
            </Button>
         )} 

         
          {/* Toggle Selection Mode */}
          {imageCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSelectionMode}
              className="rounded-full hover:bg-accent px-4 py-2 text-sm"
            >
              <CheckSquare className="h-4 w-4  md:mr-1" />
              <span>{language === 'he' ? 'בחר' : 'Select'}</span>
            </Button>
            )}

        {/* Gallery Toggle */}
          {event.withPhotos && (
              <Button
              variant="outline"
              size="sm"
              onClick={onToggleGalleryType}
              className="rounded-full px-4 py-2 text-sm"
              >
              {galleryType === 'all' ? <Users className="h-4 w-4" /> : <Images className="h-4 w-4" />}

                <span>
                  {galleryType === 'all' && isConnect ? t('navbar.myPhotos') : galleryType === 'all' && !isConnect ? t('navbar.findMe') :t ('navbar.allPhotos')}
                </span>
              </Button>
            )}
            {/* Download All */}
          {imageCount > 0 && !isMobile && imageCount < 600 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownloadAll}
              className="rounded-full hover:bg-accent px-4 py-2 text-sm"
              >
              <Download className="h-4 w-4 mr-1" />
              <span>{language === 'he' ? 'הורד' : 'Download'}</span>
            </Button>
          )}
           {/* Share Event */}
            <Dialog open={isQrOpen} onOpenChange={setIsQrOpen} >
              <DialogTrigger asChild >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateQRCode}
                  className="rounded-full hover:bg-accent px-4 py-2 text-sm"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  <span>{t('navbar.shareEvent')}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader >
                  <DialogTitle className="text-center">{t('share.title')}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center space-y-4 py-4">
                  {qrCode && (
                    <div className="bg-white p-4 rounded-lg">
                      <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground text-center">
                    {t('share.description')}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast({
                        title: t('toast.linkCopied.title'),
                        description: t('toast.linkCopied.description'),
                      });
                    }}
                    className="w-full"
                  >
                    <Share2 className="h-4 w-4  md:mr-2" />
                    {t('share.copyLink')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
    
        
        </div>

          {/* Back to Top Button - Desktop */}
          {/* {showBackToTop && (
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToGallery}
            className="
            fixed top-auto bottom-6 start-0 z-50
            rounded-full hover:bg-accent
            px-2 py-7 transition-all duration-300
            flex items-center overflow-hidden
            bg-background/95 backdrop-blur-sm border shadow-lg
            w-14 px-0 justify-center ms-2
          "

              title="חזרה למעלה"
            >
              <ArrowUp className="h-6 w-6" />
            </Button>
          )} */}

        <FAQSupportDialog
          isOpen={isSupportOpen}
          setIsOpen={setIsSupportOpen}
          questions={questions}
          event={event}
        />
      </div>
    );
  }

  // Mobile version - horizontal with smooth origin animations
  return (
    <div className={`fixed bottom-6 left-1 z-50 w-[98vw]`} style={{minWidth:'48px'}}>
      {showMenu && (
        <button
          onClick={() => {
            if (isExpanded) {
              // setIsExpanded(false);
              // setTimeout(() => setDelayForBurger(false), 200);
            } else {
              setIsExpanded(true);
              setDelayForBurger(true);
            }
          }}
          className={`
            flex items-center overflow-hidden
            bg-background/95 backdrop-blur-sm border shadow-lg rounded-full
            transition-all duration-500 ease-in-out
            py-7
            ${isExpanded ? "w-[98vw] px-3 py-8" : "w-16 px-0 justify-center ms-2"}
            h-12
            cursor-pointer
          `}
          aria-label={isExpanded ? "Close menu" : "Open menu"}
          >
          <Menu
            className={`
              absolute  w-6 h-6 text-foreground transition-opacity duration-300 ease-in-out
              ${isExpanded ? "opacity-0" : "opacity-100"}
            `}
            aria-hidden={isExpanded}
          />
          <div className="relative w-4 h-4 flex-shrink-0">
            <X
            onClick={() => {
                    setIsExpanded(false);
                }}
             className={`
                absolute left-0 w-4 h-4 text-foreground transition-opacity duration-300 ease-in-out
                ${isExpanded ? "opacity-100" : "opacity-0"}
              `}
              aria-hidden={!isExpanded}
            />
          </div>

          {/* הנאבר - כפתורים מופיעים רק כשהנאבר פתוח */}
          <nav
            className={`
              flex items-center ms-3  text-xs transition-opacity duration-500   justify-between
              ${isExpanded ? "opacity-100  w-[98vw]" : "opacity-0 pointer-events-none"}
            `}
          >

            {/* <Button
              variant="ghost"
              size="sm"
              onClick={generateQRCode}
              className="rounded-full py-2"
            >
              <Share2 className="h-3 w-3 mr-1" />
                <span>{t('navbar.shareEvent')}</span>
            </Button> */}

          {/* Toggle Selection Mode */}
          {/* {imageCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSelectionMode}
              className="rounded-full hover:bg-accent px-4 py-2 text-sm"
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              <span>{language === 'he' ? 'בחר' : 'Select'}</span>
            </Button>
            )} */}


          {/* Share Event */}
          <Dialog open={isQrOpen} onOpenChange={setIsQrOpen} >
            <DialogTrigger asChild >
              <Button
                variant="ghost"
                size="sm"
                onClick={generateQRCode}
                className="rounded-full hover:bg-accent px-2 py-2 text-sm"
              >
                <Share2 className="h-4 w-4 me-1" />
                <span>{t('navbar.shareEvent')}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader >
                <DialogTitle className="text-center">{t('share.title')}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center space-y-4 py-4">
                {qrCode && (
                  <div className="bg-white px-4 rounded-lg">
                    <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                  </div>
                )}
                <p className="text-sm text-muted-foreground text-center">
                  {t('share.description')}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: t('toast.linkCopied.title'),
                      description: t('toast.linkCopied.description'),
                    });
                  }}
                  className="w-full"
                >
                  <Share2 className="h-4 w-4 me-1" />
                  {t('share.copyLink')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>



          <Button
            variant="outline"
            size="sm"
            onClick={onToggleGalleryType}
            className="rounded-full px-4 py-2"
          >
              {/* <Users className="h-3 w-3 mr-1" /> */}
              {galleryType === 'all' ? <Users className="h-4 w-4" /> : <Images className="h-4 w-4" />}

              <span>
                {galleryType === 'all' && isConnect ? t('navbar.myPhotos') : galleryType === 'all' && !isConnect ? t('navbar.findMe') :t ('navbar.allPhotos')}
              </span>
          </Button>

          {imageCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSelectionMode}
              className="rounded-full hover:bg-accent px-4 py-2 text-sm"
            >
              <CheckSquare className="h-4 w-4 me-1" />
              <span>{language === 'he' ? 'בחר' : 'Select'}</span>
            </Button>
          )}

          {imageCount == 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSupportOpen(true)}
              className="rounded-full px-2 py-2"
            >
              <MessageCircle className="h-3 w-3 me-1" />
              <span>{language === 'he' ? 'תמיכה' : 'Support'}</span>
            </Button>
            )}

          <Button
            variant="ghost"
            size="sm"
            onClick={scrollToGallery}
            className={` px-1 rounded-full transition-opacity duration-300 ${
              showBackToTop  ? "visible opacity-100 pointer-events-auto" : "invisible opacity-0 pointer-events-none"
            }`}
          >
            <ArrowUp className="h-3 w-3" />
          </Button>

          </nav>
        </button>
      )}

      {/* <FAQSupportDialog
        isOpen={isSupportOpen}
        setIsOpen={setIsSupportOpen}
        questions={questions}
        event={event}
      /> */}
    </div>
  );
};