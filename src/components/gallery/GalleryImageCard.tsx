
import { useState } from "react";
import { GalleryImage } from "@/types/gallery";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { MoreVertical, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { event } from "@/types/event";
import { Play } from "lucide-react";
interface GalleryImageCardProps {
  image: GalleryImage;
  event: event;
  onClick: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectionChange?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onImageDropdownClick?: (imageId: string, position: { x: number; y: number }) => void;
  onShare?: () => void;
}

export const GalleryImageCard = ({ 
  image, 
  event,
  onClick, 
  isSelectionMode = false,
  isSelected = false,
  onSelectionChange,
  isFavorite = false,
  onToggleFavorite,
  onImageDropdownClick,
  onShare
}: GalleryImageCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const canHover = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.();
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const handleClick = () => {
  // if (isVideo) {
  //   const video = document.getElementById(`video-${image.id}`) as HTMLVideoElement;
  //   if (video) video.play();
  //   return;
  // }

  if (isSelectionMode && onSelectionChange) {
    onSelectionChange();
  } else {
    onClick();
  }
};
  // const handleClick = () => {
  //   if (isSelectionMode && onSelectionChange) {
  //     onSelectionChange();
  //   } else {
  //     onClick();
  //   }
  // };
  const isVideo = image.largeSrc?.match(/\.(mp4|webm|mov|m4v)$/i);
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = image.src;
    link.download = `image-${image.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: t('toast.downloadImageComplete.title'),
      description: t('toast.downloadImageComplete.description'),
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(image.src);
    toast({
      title: t('toast.linkCopied.title'),
      description: t('toast.linkCopied.description'),
    });
    };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    onImageDropdownClick?.(image.id, { x: rect.left, y: rect.bottom });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.();
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-none cursor-pointer",
        "bg-card hover:bg-accent/50 dark:bg-card dark:hover:bg-accent/50",
        "transform transition-all duration-300 hover:scale-[1.00]",
        "shadow-md hover:shadow-xl border border-border",
        "hover:z-30", // הוספת z-index גבוה בהובר
        isSelectionMode && "ring-2 ring-transparent",
        isSelected && "ring-1 ring-primary  ring-offset-background"
    )}
    onClick={handleClick}
    onMouseEnter={() => {
      if (canHover) setShowOverlay(true);
    }}
    onMouseLeave={() => {
      if (canHover) setShowOverlay(false);
    }}
  >
      {!isLoaded && (
        <div 
          className="w-full bg-muted animate-pulse rounded-none "
          style={{ height: `${image.photoHeight}px` }}
        />
      )}
      
      {hasError ? (
  <div
    className="w-full bg-muted flex items-center justify-center text-muted-foreground rounded-none"
    style={{ height: `${image.photoHeight}px` }}
  >
    <span>{t("toast.error.title")}</span>
  </div>
) : isVideo ? (
  <video
    id={`video-${image.id}`}
    src={image.largeSrc}
    className={cn(
      "w-full h-auto object-cover transition-opacity duration-300",
      isLoaded ? "opacity-100" : "opacity-0"
    )}
    preload="metadata"
    muted
    playsInline
    onLoadedData={handleImageLoad}
  />
) : (
  <img
    src={image.src}
    alt={image.alt}
    className={cn(
      "w-full h-auto object-cover transition-opacity duration-300",
      isLoaded ? "opacity-100" : "opacity-0"
    )}
    onLoad={handleImageLoad}
    onError={handleImageError}
    loading="lazy"
  />
)}

      {/* {hasError ? (
        <div 
          className="w-full bg-muted flex items-center justify-center text-muted-foreground rounded-none "
          style={{ height: `${image.photoHeight}px` }}
        >
          <span>{t('toast.error.title')}</span>
        </div>
      ) : (
        {isVideo ? (
  <video
    src={image.largeSrc}
    className={cn(
      "w-full h-auto object-cover transition-opacity duration-300",
      isLoaded ? "opacity-100" : "opacity-0"
    )}
    preload="metadata"
    muted
    playsInline
    onLoadedData={handleImageLoad}
  />
) : (
  <img
    src={image.src}
    alt={image.alt}
    className={cn(
      "w-full h-auto object-cover transition-opacity duration-300",
      isLoaded ? "opacity-100" : "opacity-0"
    )}
    onLoad={handleImageLoad}
    onError={handleImageError}
    loading="lazy"
  />
)}
        // <img
        //   src={image.src}
        //   alt={image.alt}
        //   className={cn(
        //     "w-full h-auto object-cover transition-opacity duration-300",
        //     isLoaded ? "opacity-100" : "opacity-0"
        //   )}
        //   onLoad={handleImageLoad}
        //   onError={handleImageError}
        //   loading="lazy"
        // />
      )} */}
      
{isVideo && (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <div className="bg-black/60 rounded-full p-3">
      <Play className="w-6 h-6 text-white fill-white" />
    </div>
  </div>
)}
        {/* Selection mode overlay */}
      {isSelectionMode && (
        <>
          <div className="absolute inset-0 bg-black/20 transition-opacity duration-200" />
          <div className="absolute top-2 right-2">
            <Checkbox
              checked={isSelected}
              onChange={onSelectionChange}
              className="bg-background shadow-lg border-2"
            />
          </div>
        </>
      )}
      
      {/* Regular hover overlay - only show when not in selection mode */}
      {!isSelectionMode && showOverlay && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300" />
          
          {/* Action buttons */}
          <div className={cn(
            "absolute top-2",
            'right-2'
          )}>
            <div className="flex gap-1">
              {/* <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 border-0 p-0 z-50"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 text-white" />
              </Button> */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 border-0 p-0 z-50"
                onClick={handleDropdownClick}
              >
                <MoreVertical className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
          
          <div className="absolute bottom-2 right-2">
            <div className="px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-white text-xs">
              {image.id}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
