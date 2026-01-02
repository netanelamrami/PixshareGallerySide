import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GalleryImage } from "@/types/gallery";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
  Star,
  Heart,
  Share2,
  Loader2,
  Linkedin,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadImage } from "@/utils/downloadUtils";
import { shareImage } from "@/utils/shareUtils";
import { ShareOptionsModal } from "./ShareOptionsModal";
import { isIOS } from "@/utils/deviceUtils";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { ClipLoader } from "react-spinners";
import { apiService } from "@/data/services/apiService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ImageSave } from "@/pages/ImageSave";

interface LightboxModalProps {
  isOpen: boolean;
  event: any;
  postsEventData: any;
  images: GalleryImage[];
  displayedImagesLength: number;
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  galleryType: string;
}

export const LightboxModal = ({
  isOpen,
  event,
  postsEventData,
  images,
  displayedImagesLength,
  currentIndex,
  onClose,
  onNext,
  onPrevious,
  isFavorite = false,
  onToggleFavorite,
  galleryType,
}: LightboxModalProps) => {
  const navigate = useNavigate();
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const { t, language } = useLanguage();
  const [shareIsLoading, setShareIsLoading] = useState(false);
  const [linkedinShareIsLoading, setLinkedinShareIsLoading] = useState(false);
  const [downloadIsLoading, setDownloadIsLoading] = useState(false);
  const [isLinkedinShareOpen, setIsLinkedinShareOpen] = useState(false);
  const [selectedShareText, setSelectedShareText] = useState<string | null>(
    null
  );
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const currentPost = postsEventData[currentPostIndex];
  const [showIOSSave, setShowIOSSave] = useState(false);
  const [iosSaveParams, setIOSSaveParams] = useState<string | null>(null);

  const currentImage = images[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          onPrevious();
          break;
        case "ArrowRight":
          onNext();
          break;
        case "z":
        case "Z":
          setIsZoomed(!isZoomed);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onNext, onPrevious, isZoomed]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setImageLoaded(false);
      setIsZoomed(false);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;

    const deltaX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0 && currentIndex < images.length - 1) {
        // Swipe left - next image
        onNext();
      } else if (deltaX < 0 && currentIndex > 0) {
        // Swipe right - previous image
        onPrevious();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!isOpen || !currentImage) return null;

  const handleDownload = async () => {
    if (!currentImage) return;
    apiService.updateStatistic(event.id, "DownloadClick");

    // Check if iOS - redirect to image save page
    if (isIOS()) {
      const scrollPosition =
        window.scrollY || document.documentElement.scrollTop;
      const currentPath = window.location.pathname;
      const eventLink = currentPath.startsWith("/")
        ? currentPath.slice(1)
        : currentPath;

      const params = new URLSearchParams({
        url: currentImage.largeSrc,
        name: currentImage.id,
        returnState: encodeURIComponent(JSON.stringify({ fromLightbox: true })),
        lightboxIndex: currentIndex.toString(),
        scrollPosition: scrollPosition.toString(),
        eventLink: eventLink || "",
        galleryType: galleryType,
      });

      const url = `/image-save?${params.toString()}`;
      // שמור state והראה modal פנימי
      setIOSSaveParams(url);
      setShowIOSSave(true);
      return;
    }

    // For Android/Desktop - direct download
    toast({
      title: t("toast.downloadStarting.title"),
      description: t("toast.downloadStarting.title"),
    });
    setDownloadIsLoading(true);
    const success = await downloadImage(
      currentImage.largeSrc,
      `${currentImage.id}`
    );
    setDownloadIsLoading(false);

    if (success) {
      toast({
        title: t("toast.downloadComplete.title"),
        description: t("toast.downloadImageComplete.description"),
      });
    } else {
      toast({
        title: t("toast.error.title"),
        description: t("downloadModal.downloadError"),
        variant: "destructive",
      });
    }
  };

  const goNext = () => {
    if (currentPostIndex < postsEventData.length - 1) {
      setCurrentPostIndex((i) => i + 1);
    }
  };

  const goPrev = () => {
    if (currentPostIndex > 0) {
      setCurrentPostIndex((i) => i - 1);
    }
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(currentPost.postDescription);
    toast({ title: t("toast.linkCopied.title") });
  };

  const handleShare = async () => {
    if (!currentImage) return;

    apiService.updateStatistic(event.id, "SharePhotoClick");
    setShareIsLoading(true);
    const result = await shareImage(
      currentImage.largeSrc,
      `${currentImage.id}`,
      ""
    );

    setShareIsLoading(false);
    if (result.success && result.method === "native") {
      // setShowShareModal(true);
      // toast({
      //   title: 'שיתוף הושלם',
      //   description: 'התמונה שותפה בהצלחה',
      // });
    } else if (result.success && result.method === "options") {
      // setShowShareModal(true);
    } else {
      // toast({
      //   title: "שגיאה",
      //   description: "שגיאה בשיתוף התמונה",
      //   variant: "destructive",
      // });
    }
  };

  const handleLinkedinShare = async (text: string) => {
    if (!currentImage) return;

    apiService.updateStatistic(event.id, "SharePhotoClick");
    setLinkedinShareIsLoading(true);
    const result = await shareImage(
      currentImage.largeSrc,
      `${currentImage.id}`,
      text
    );
    setLinkedinShareIsLoading(false);
    if (result.success && result.method === "native") {
      // toast({
      //   title: 'שיתוף הושלם',
      //   description: 'התמונה שותפה בהצלחה',
      // });
    } else if (result.success && result.method === "options") {
      setShowShareModal(true);
    } else {
      toast({
        title: "שגיאה",
        description: "שגיאה בשיתוף התמונה",
        variant: "destructive",
      });
    }
  };
  const handleImageShareLinkedin = async () => {
    if (!currentImage) return;

    if (postsEventData?.length > 0) {
      setIsLinkedinShareOpen(true);
    } else {
      await handleLinkedinShare("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-background/95 dark:bg-black/90 backdrop-blur-sm"
      dir={language === "he" ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center justify-between">
          <div className="text-foreground">
            {!(showIOSSave && iosSaveParams) && (
              <>
                {postsEventData?.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleImageShareLinkedin}
                    className="text-foreground hover:bg-accent"
                  >
                    {linkedinShareIsLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    )}
                  </Button>
                )}

                {/* <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsZoomed(!isZoomed)}
              className="text-foreground hover:bg-accent"
            >
              {isZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
            </Button> */}
                {onToggleFavorite && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleFavorite}
                    className={cn(
                      "text-foreground hover:bg-accent",
                      isFavorite ? "text-black dark:text-white" : ""
                    )}
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4",
                        isFavorite ? "fill-black dark:fill-white" : "fill-none"
                      )}
                    />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="text-foreground hover:bg-accent"
                >
                  {shareIsLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  // size="icon"
                  onClick={handleShare}
                  className="text-foreground hover:bg-accent"
                >
                  {downloadIsLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {/* הורד תמונה */}
                </Button>
              </>
            )}
          </div>
          {!(showIOSSave && iosSaveParams) && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-foreground hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons - positioned based on language direction */}
      {currentIndex > 0 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          className={`absolute ${
            language === "he" ? "right-4" : "left-4"
          } top-1/2 -translate-y-1/2 z-20 text-foreground hover:bg-accent/80 w-12 h-12 bg-black/20 backdrop-blur-sm`}
        >
          {language === "he" ? (
            <ChevronRight className="h-6 w-6" />
          ) : (
            <ChevronLeft className="h-6 w-6" />
          )}
        </Button>
      )}

      {currentIndex < images.length - 1 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          className={`absolute ${
            language === "he" ? "left-4" : "right-4"
          } top-1/2 -translate-y-1/2 z-20 text-foreground hover:bg-accent/80 w-12 h-12 bg-black/20 backdrop-blur-sm`}
        >
          {language === "he" ? (
            <ChevronLeft className="h-6 w-6" />
          ) : (
            <ChevronRight className="h-6 w-6" />
          )}
        </Button>
      )}

      {/* Image Container */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4 cursor-pointer"
        onClick={onClose}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={cn(
            "relative w-full h-full flex items-center justify-center transition-transform duration-300",
            isZoomed ? "scale-150 cursor-move" : "cursor-pointer"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-foreground border-t-transparent rounded-full"></div>
            </div>
          )}

          <img
            src={currentImage.mediumSrc}
            alt={currentImage.alt}
            className={cn(
              "max-w-full w-auto h-auto object-contain shadow-gallery transition-opacity duration-300 max-h-[calc(100vh-12vh)]",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            draggable={false}
          />
        </div>
      </div>
      {isLinkedinShareOpen && currentImage && (
        <div className="absolute inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <Dialog
            open={isLinkedinShareOpen}
            onOpenChange={setIsLinkedinShareOpen}
          >
            <DialogContent
              className="w-full h-[85vh] max-w-lg flex flex-col bg-white rounded-xl  z-[999999]"
              dir={language === "he" ? "rtl" : "ltr"}
            >
              <DialogHeader>
                <DialogTitle>{t("gallery.shareWithTextHeader")}</DialogTitle>
              </DialogHeader>

              <div className="flex-1 flex items-center justify-center relative px-4">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentPostIndex === 0}
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>

                <div className="relative w-full max-h-[45vh] scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent overflow-y-auto border rounded-lg p-5 text-sm leading-relaxed whitespace-pre-line">
                  {currentPost.postDescription}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  disabled={currentPostIndex === postsEventData.length - 1}
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>

              <div className="flex justify-between items-center mt-3">
                <span className="text-xs opacity-60">
                  {currentPostIndex + 1} / {postsEventData.length}
                </span>

                <Button
                  variant="ghost"
                  onClick={copyText}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-4 w-4" />
                  {t("share.copyText")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                {language === "he" ? (
                  <>
                    העתק טקסט והדבק ב־
                    <span className="font-medium">LinkedIn</span>
                    <br />
                    ערוך את תבנית הטקסט וצרף תמונות מהכנס
                  </>
                ) : (
                  <>
                    Paste on <span className="font-medium">LinkedIn</span> and
                    add photos from the event
                  </>
                )}
              </p>

              <DialogFooter className="mt-4">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setIsLinkedinShareOpen(false);
                    setCurrentPostIndex(0);
                  }}
                >
                  {t("common.close")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
        <div
          className={`text-foreground ${
            language === "he" ? "text-center" : "text-center"
          }`}
        >
          {event.id == "691" && (
            <>
              <button
                className=" mb-3 sm:w-auto mx-auto flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:opacity-90 transition-all duration-300"
                onClick={() => {
                  try {
                    const photoUrl = currentImage.mediumSrc;
                    const encodedPhotoUrl = btoa(photoUrl);
                    const url = `https://plugos888.com/profile?eventid=68f1211cb0eacc6dff325195&photoUrl=${encodeURIComponent(
                      encodedPhotoUrl
                    )}`;
                    window.open(url, "_blank");
                  } catch (error) {
                    console.error("Error encoding URL to base64", error);
                  }
                }}
              >
                {language === "he"
                  ? "שתפו ב-Plugos והרוויחו מטבעות 💎"
                  : "Share on Plugos & earn coins !💎"}
                {/* <img src="https://www.plugos888.com/_next/image?url=%2Fassets%2Fplugos.png&w=32&q=20" alt="" /> */}
              </button>
              <p className="text-sm opacity-80 mb-6">
                {language === "he"
                  ? "המטבעות שלכם יהפכו לכסף אמיתי לבילוי הבא שלכם 🎉"
                  : "Your coins turn into real money for your next night out 🎉"}
              </p>
            </>
          )}
          {event.id != "691" && !(showIOSSave && iosSaveParams) && (
            <>
              <p className="text-sm opacity-80 mb-3">
                {currentIndex + 1} {t("common.of")} {displayedImagesLength} •
                {/* {t("common.imageSize")}: */} {currentImage.size}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Click outside to close overlay */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {showIOSSave && iosSaveParams && (
        <Dialog open={showIOSSave} onOpenChange={setShowIOSSave}>
          <DialogContent
            className="w-full max-w-lg h-[90vh] z-[99999] bg-white rounded-lg p-0 flex flex-col"
            dir={language === "he" ? "rtl" : "ltr"}
          >
            <DialogTitle></DialogTitle>
     
                <ImageSave
                  imageUrl={currentImage.largeSrc}
                  imageName={currentImage.id}
                  language={language}
                  onClose={() => setShowIOSSave(false)}
                />

            

            <DialogFooter className="p-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowIOSSave(false);
                  setIOSSaveParams(null);
                }}
              >
                {t("common.back")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Share Options Modal */}
      {currentImage && (
        <ShareOptionsModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          imageUrl={currentImage.largeSrc}
          imageName={`${currentImage.id}`}
        />
      )}
    </div>
  );
};
