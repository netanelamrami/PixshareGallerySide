import { useState, useEffect, useRef } from "react";
import { GalleryImage } from "@/types/gallery";
import { MasonryGrid } from "./MasonryGrid";
import { LightboxModal } from "./LightboxModal";
import { GalleryHeader } from "./GalleryHeader";
import { AlbumSection } from "./AlbumSection";
import { DownloadModal } from "./DownloadModal";
import { BottomActionBar } from "./BottomActionBar";
import { FloatingNavbar } from "./FloatingNavbar";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { event } from "@/types/event";
import { downloadImage, downloadMultipleImages } from "@/utils/downloadUtils";
import { shareImage } from "@/utils/shareUtils";
import { ShareOptionsModal } from "./ShareOptionsModal";
import { EmptyPhotosState } from "./EmptyPhotosState";
import { useAlbums } from "@/hooks/useAlbums";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Heart, Link, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { isIOS } from "@/utils/deviceUtils";
import { useNavigate } from "react-router-dom";

import QRCode from "qrcode";
import { BackToTopButton } from "../ui/back-to-top";
import { apiService } from "@/data/services/apiService";

interface GalleryProps {
  event: event;
  images: GalleryImage[];
  favoriteImages: Set<string>;
  onToggleFavorite: (imageId: string) => void;
  galleryType?: "all" | "my";
  onAlbumClick?: (albumId: string) => void;
  selectedAlbum?: string | null;
  selectionMode?: boolean;
  lightboxState?: { isOpen: boolean; currentIndex: number } | null;
  galleryCustomerType?: "kimama" | "regular";
  onLightboxStateChange?: (
    state: { isOpen: boolean; currentIndex: number } | null
  ) => void;
  selectedImages?: Set<string>;
  onImageSelect?: (imageId: string) => void;
  columns?: number;
  onAuthComplete?: (userData: {
    contact: string;
    otp: string;
    selfieData: string;
    notifications: boolean;
  }) => void;
  onViewMyPhotos: () => void;

}

export const Gallery = ({
  event,
  images,
  favoriteImages,
  onToggleFavorite,
  galleryType,
  onAlbumClick,
  selectedAlbum,
  selectionMode,
  selectedImages: externalSelectedImages,
  onImageSelect,
  columns: externalColumns,
  onAuthComplete,
  onViewMyPhotos,
  lightboxState,
  onLightboxStateChange,
  galleryCustomerType = "regular",
}: GalleryProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [columns, setColumns] = useState(externalColumns || 4);
  const [isSelectionMode, setIsSelectionMode] = useState(
    selectionMode || false
  );
  const [isSelectionModeForButtomModal, setIsSelectionModeForButtomModal] = useState(
    selectionMode || false
  );
  const [selectedImages, setSelectedImages] = useState<Set<string>>(
    externalSelectedImages || new Set()
  );
  // const [localSelectedAlbum, setLocalSelectedAlbum] = useState<string | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [displayedImagesCount, setDisplayedImagesCount] = useState(30);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingDownloadZip, setIsLoadingDownloadZip] = useState(false);
  const [isDownloadZipStarted, setIsDownloadZipStarted] = useState(false);
  const [localGalleryType, setLocalGalleryType] = useState(
    galleryType || "all"
  );
  const [qrCode, setQrCode] = useState<string>("");
  const [postsEventData, setPostsEventData] = useState([]);
  const [shareModalImage, setShareModalImage] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [dropdownImage, setDropdownImage] = useState<{
    id: string;
    position: { x: number; y: number };
  } | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Use albums hook
  const { albums, getImagesByAlbum, firstAlbum } = useAlbums(
    event.id.toString(),
    images
  );

  // Sync external props with internal state
  useEffect(() => {
    if (externalColumns !== undefined) {
      setColumns(externalColumns);
    }
  }, [externalColumns]);

  useEffect(() => {
    if (selectionMode !== undefined) {
      setIsSelectionMode(selectionMode);
      setIsSelectionModeForButtomModal(selectionMode);
    }
  }, [selectionMode]);

  useEffect(() => {
    if (externalSelectedImages !== undefined) {
      setSelectedImages(externalSelectedImages);
    }
  }, [externalSelectedImages]);

  // Handle external lightbox state
  useEffect(() => {
    if (lightboxState?.isOpen && lightboxState?.currentIndex !== undefined) {
      setSelectedImageIndex(lightboxState.currentIndex);
      setIsLightboxOpen(true);
      onLightboxStateChange?.(null); // Clear the external state after applying
    }
  }, [lightboxState, onLightboxStateChange]);

  // Reset displayed images count when images change
  useEffect(() => {
    setDisplayedImagesCount(30);
  }, [images]);

  useEffect(() => {
    const fetchPostEventData = async () => {
      try {
        const postEventData = await apiService.getPostDescriptionByEventId(
          event.id
        );
        setPostsEventData(postEventData);
      } catch (err) {
        console.error("getPostDescriptionByEventId error:", err);
      }
    };

    if (event?.id) {
      fetchPostEventData();
    }
  }, [event.id]);

  // Removed auto-select logic - let users see all albums with dividers by default
  // useEffect(() => {
  //   if (firstAlbum != null && albums.length > 0 && !selectedAlbum && onAlbumClick) {
  //     onAlbumClick(firstAlbum);
  //   }
  // }, [firstAlbum, albums, selectedAlbum, onAlbumClick]);

  // useEffect(() => {
  //   if (firstAlbum != null) {
  //     onAlbumClick(firstAlbum);
  //   }
  // }, [firstAlbum]);
  // Reset displayed images count when images change

  // Infinite scroll effect - load 30 images at a time
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setDisplayedImagesCount((prev) => prev + 30);
            setIsLoadingMore(false);
          }, 600);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [displayedImagesCount, isLoadingMore, images]);

  // Responsive columns based on screen size
useEffect(() => {
  const updateColumns = () => {
    const size = event.galleryGridSize; // 1, 2, 3
    const width = window.innerWidth;
    let columns;

    if (width < 640) {
      columns = 2;
    } else if (width < 768) {
      columns = 3;
    } else if (width < 1024) {
      columns = 4;
    } else {
      columns = 5;
    }

    if (size === 1) columns -= 1;
    else if (size === 3) columns += 1;

    if (columns < 1) columns = 1;

    setColumns(columns);
  };

  updateColumns();
  window.addEventListener("resize", updateColumns);
  return () => window.removeEventListener("resize", updateColumns);
}, [event.galleryGridSize]);


  // Reset displayed images when album changes
  useEffect(() => {
    setDisplayedImagesCount(30);
  }, [selectedAlbum]);

  const handleImageClick = (image: GalleryImage, index: number) => {
    if (isSelectionMode) {
      handleImageSelection(image.id);
    } else {
      const globalIndex = visibleImages.findIndex((img) => img.id === image.id);
      setSelectedImageIndex(globalIndex);
      setIsLightboxOpen(true);
    }
  };

  const handleImageSelection = (imageId: string) => {
    if (onImageSelect) {
      onImageSelect(imageId);
    } else {
      const newSelection = new Set(selectedImages);
      if (newSelection.has(imageId)) {
        newSelection.delete(imageId);
      } else {
        newSelection.add(imageId);
      }
      setSelectedImages(newSelection);
    }
  };

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
    setSelectedImageIndex(null);
    onLightboxStateChange?.(null);
  };

  // Get filtered images based on selected album
  const getFilteredImages = () => {
    if (selectedAlbum) {
      if (selectedAlbum === "favorites") {
        return images.filter((img) => favoriteImages.has(img.id));
      } else {
        return getImagesByAlbum(selectedAlbum);
      }
    }
    return images;
  };

  const filteredImages = getFilteredImages();

  const handleNextImage = () => {
    if (
      selectedImageIndex !== null &&
      selectedImageIndex < filteredImages.length - 1
    ) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleDownloadAll = () => {
    setShowDownloadModal(true);
  };

  const handleDownloadSelected = async () => {
    if (selectedImages.size === 0) {
      toast({
        title: t("toast.noSelection.title"),
        description: t("toast.noSelection.description"),
        variant: "destructive",
      });
      return;
    }
    const selectedImagesArray = filteredImages.filter((img) =>
      selectedImages.has(img.id)
    );
    toast({
      title: t("toast.downloadStarting.title"),
      description: t("toast.downloadStarting.description").replace(
        "{count}",
        selectedImages.size.toString()
      ),
    });
    setIsLoadingDownloadZip(true);
    setIsDownloadZipStarted(true);
    setIsSelectionModeForButtomModal(false);
    setSelectedImages(new Set());
    const success = await downloadMultipleImages(
      selectedImagesArray.map((img) => ({
        src: img.largeSrc,
        id: img.id,
        name: img.name,
      })),
      `${event.name}.zip`
    );
    setIsLoadingDownloadZip(false);

    if (success) {
      for (let index = 0; index < selectedImages.size; index++) {
        await apiService.updateStatistic(event.id, "DownloadClick");
      }
      
      toast({
        title: t("toast.downloadComplete.title"),
        description: t("toast.downloadComplete.description").replace(
          "{count}",
          selectedImages.size.toString()
        ),
      });
          setIsLoadingDownloadZip(false);

    } else {
      toast({
        title: t("downloadModal.partialError"),
        description: t("downloadModal.partialErrorDesc"),
        variant: "destructive",
      });
    }
  };

  const handleToggleFavorites = () => {
    Array.from(selectedImages).forEach((imageId) => {
      onToggleFavorite(imageId);
      apiService.updateStatistic(event.id, "FavoritesPhotos");
    });

    handleCancelSelection();
  };

  const handleCancelSelection = () => {
    setSelectedImages(new Set());
    setIsSelectionMode(false);
    setIsSelectionModeForButtomModal(false);
    setIsDownloadZipStarted(false);
    setIsLoadingDownloadZip(false);

    // If we have external callback for selection mode, use it
    if (onImageSelect) {
      // This means we're controlled by parent, notify parent to exit selection mode
      // We can trigger this by calling the toggle function
      if (selectionMode !== undefined) {
        // Parent is controlling the selection mode
        window.dispatchEvent(new CustomEvent("exitSelectionMode"));
      }
    }
  };

  const handleToggleSelection = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedImages(new Set());
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: t("hero.title"),
        text: t("hero.subtitle"),
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: t("toast.linkCopied.title"),
        description: t("toast.linkCopied.description"),
      });
    }
  };

  const handleAlbumClick = (albumId: string | null) => {
    if (onAlbumClick) {
      // If albumId is null or clicking the same album, deselect it
      if (albumId === null || selectedAlbum === albumId) {
        onAlbumClick(null as any); // Deselect album - show all with dividers
      } else {
        onAlbumClick(albumId);
      }
    } else if (albumId === "favorites") {
      // Fallback handling
      toast({
        title: t("toast.error.title"),
        description: t("common.favorites"),
      });
    } else if (albumId) {
      //setLocalSelectedAlbum(albumId);
      toast({
        title: t("toast.error.title"),
        description: `${t("common.selected")}: ${albumId}`,
      });
    }
  };

  const handleImageDropdown = (
    imageId: string,
    position: { x: number; y: number }
  ) => {
    setDropdownImage({ id: imageId, position });
    document.body.style.overflow = "hidden";
  };

  const handleDropdownClose = () => {
    setDropdownImage(null);
    document.body.style.overflow = "auto";
  };

  const handleImageDownload = async () => {
    if (!dropdownImage) return;

    const image = images.find((img) => img.id === dropdownImage.id);
    if (!image) return;
    //for statistic
    apiService.updateStatistic(event.id, "DownloadClick");
    if (isIOS()) {
      // Get current scroll position and event link from URL
      const scrollPosition =
        window.scrollY || document.documentElement.scrollTop;
      const currentPath = window.location.pathname;
      const eventLink = currentPath.startsWith("/")
        ? currentPath.slice(1)
        : currentPath;

      const params = new URLSearchParams({
        url: image.largeSrc,
        name: `${image.id}`,
        returnState: encodeURIComponent(
          JSON.stringify({ fromLightbox: false })
        ),
        scrollPosition: scrollPosition.toString(),
        eventLink: eventLink || "",
        galleryType: galleryType || localGalleryType,
      });
      navigate(`/image-save?${params.toString()}`);
      return;
    }

    toast({
      title: t("downloadModal.downloadStarted"),
      description: t("downloadModal.downloadStarted"),
    });
    handleDropdownClose();
    const success = await downloadImage(image.largeSrc || image.src, image.id);
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

  // const handleImageCopyLink = () => {
  //   if (!dropdownImage) return;

  //   const image = images.find(img => img.id === dropdownImage.id);
  //   if (!image) return;

  //   navigator.clipboard.writeText(image.src);
  //   toast({
  //     title: t('toast.linkCopied.title'),
  //     description: t('toast.linkCopied.description'),
  //   });

  //   handleDropdownClose();
  // };

  const handleToggleImageFavorites = () => {
    apiService.updateStatistic(event.id, "FavoritesPhotos");
    onToggleFavorite(dropdownImage?.id);
    handleDropdownClose();
  };

  const handleImageShare = async () => {
    if (!dropdownImage) return;

    const image = images.find((img) => img.id === dropdownImage.id);
    if (!image) return;
    apiService.updateStatistic(event.id, "SharePhotoClick");
    handleDropdownClose();

    const result = await shareImage(image.largeSrc || image.src, image.id, "");

    if (result.success && result.method === "native") {
      // toast({
      //   title: 'שיתוף הושלם',
      //   description: 'התמונה שותפה בהצלחה',
      // });
    } else if (result.success && result.method === "options") {
      setShareModalImage({
        url: image.largeSrc || image.src,
        name: image.id,
      });
    } else {
      toast({
        title: "שגיאה",
        description: "שגיאה בשיתוף התמונה",
        variant: "destructive",
      });
    }
  };

  // Get images to display - load 30 images at a time
  const getDisplayedImages = () => {
    if (selectedAlbum && selectedAlbum === "favorites") {
      // Favorites album - paginate through favorites
      return filteredImages.slice(0, displayedImagesCount);
    }

    // Get all albums to load
    const allAlbums = albums.filter((a) => a.id !== "favorites");

    if (selectedAlbum) {
      // When an album is selected, start from that album
      const selectedIndex = allAlbums.findIndex((a) => a.id === selectedAlbum);
      if (selectedIndex !== -1) {
        const albumsFromSelected = allAlbums.slice(selectedIndex);

        // Collect images starting from selected album
        const displayedImagesList: GalleryImage[] = [];
        for (const album of albumsFromSelected) {
          const albumImages = getImagesByAlbum(album.id);
          displayedImagesList.push(...albumImages);
        }

        // Return only first displayedImagesCount images
        return displayedImagesList.slice(0, displayedImagesCount);
      }
    } else {
      // No album selected - load images from all albums
      const displayedImagesList: GalleryImage[] = [];
      for (const album of allAlbums) {
        const albumImages = getImagesByAlbum(album.id);
        displayedImagesList.push(...albumImages);
      }

      // Return only first displayedImagesCount images
      return displayedImagesList.slice(0, displayedImagesCount);
    }

    return [];
  };

  //const displayedImages = getDisplayedImages();
  const visibleImages = getDisplayedImages(); // displayedImages.slice(0, displayedImagesCount);
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <GalleryHeader
        event={event}
        totalImages={filteredImages.length}
        columns={columns}
        onColumnsChange={setColumns}
        onDownloadAll={handleDownloadAll}
        onDownloadSelected={handleDownloadSelected}
        onToggleSelection={handleCancelSelection}
        galletyCustomerType={galleryCustomerType}
        onShare={handleShare}
        isSelectionMode={isSelectionModeForButtomModal}
        selectedCount={selectedImages.size}
        onAuthComplete={onAuthComplete}
        onViewMyPhotos={onViewMyPhotos}
      />

      {!isSelectionModeForButtomModal && (
        <FloatingNavbar
          event={event}
          galleryType={galleryType || localGalleryType}
          onToggleGalleryType={() => {
            if (localGalleryType === "all") {
              setLocalGalleryType("my");
              window.dispatchEvent(
                new CustomEvent("switchToMyPhotos", {
                  detail: { type: localGalleryType },
                })
              );
            } else {
              setLocalGalleryType("all");
              window.dispatchEvent(
                new CustomEvent("switchToAllPhotos", {
                  detail: { type: localGalleryType },
                })
              );
            }
          }}
          onDownloadAll={handleDownloadAll}
          onToggleSelectionMode={() =>
            window.dispatchEvent(new CustomEvent("toggleSelectionMode"))
          }
          imageCount={images.length}
        />
      )}
      {/* Albums Section - Only show albums that have images for this user */}
      {images.length > 0 &&
        (() => {
          // Filter albums to only show those that have images
          const albumsWithImages = albums.filter((album) => {
            const albumImages = getImagesByAlbum(album.id);
            return albumImages.length > 0;
          });

          const visibleAlbums = [
            // Only show favorites if there are favorite images
            ...(favoriteImages.size > 0
              ? [
                  {
                    id: "favorites",
                    name: "❤️ נבחרות",
                    imageCount: favoriteImages.size,
                    thumbnail: Array.from(favoriteImages)[0]
                      ? images.find(
                          (img) => img.id === Array.from(favoriteImages)[0]
                        )?.src
                      : undefined,
                  },
                ]
              : []),
            ...albumsWithImages,
          ];

          // Only render AlbumSection if there are visible albums
          return visibleAlbums.length > 0 ? (
            <AlbumSection
              albums={visibleAlbums}
              onAlbumClick={handleAlbumClick}
              selectedAlbum={selectedAlbum}
              allImages={images}
              getImagesByAlbum={getImagesByAlbum}
              event={event}
            />
          ) : null;
        })()}

      {/* Gallery Grid with Album Dividers */}
      <div className="w-full px-0 py-4 relative">
        {images.length === 0 ? (
          <EmptyPhotosState
            type={galleryType === "all" ? "allPhotos" : "myPhotos"}
          />
        ) : (
          <>
            <MasonryGrid
              images={visibleImages}
              event={event}
              onImageClick={handleImageClick}
              columns={columns}
              isSelectionMode={isSelectionModeForButtomModal}
              selectedImages={selectedImages}
              onImageSelection={handleImageSelection}
              favoriteImages={favoriteImages}
              onToggleFavorite={onToggleFavorite}
              onImageDropdownClick={handleImageDropdown}
              onShare={async (imageId) => {
                const image = images.find((img) => img.id === imageId);
                if (!image) return;

                const result = await shareImage(
                  image.largeSrc || image.src,
                  image.id,
                  ""
                );

                if (result.success && result.method === "native") {
                  // Success
                } else if (result.success && result.method === "options") {
                  setShareModalImage({
                    url: image.largeSrc || image.src,
                    name: image.id,
                  });
                } else {
                  toast({
                    title: "שגיאה",
                    description: "שיתוף בוטל",
                    variant: "destructive",
                  });
                }
              }}
              showAlbumDividers={true}
              albums={albums}
            />

            {/* Load More Trigger & Loader */}
            {displayedImagesCount < filteredImages.length && (
              <div
                ref={loadMoreRef}
                className="w-full py-4 flex justify-center"
              >
                {isLoadingMore ? (
                  <div className="flex items-center justify-center">
                    <div className={`flex flex-col items-center gap-3`}>
                      <span className="text-muted-foreground text-sm">
                        Powered by Pixshare AI
                      </span>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-black"></div>
                    </div>
                  </div>
                ) : (
                  <div className="h-4" />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox Modal */}
      {!isSelectionModeForButtomModal && (
        <LightboxModal
          isOpen={isLightboxOpen}
          event={event}
          postsEventData={postsEventData}
          images={visibleImages}
          displayedImagesLength={filteredImages.length}
          currentIndex={selectedImageIndex || 0}
          onClose={handleCloseLightbox}
          onNext={handleNextImage}
          onPrevious={handlePreviousImage}
          isFavorite={
            selectedImageIndex !== null
              ? favoriteImages.has(visibleImages[selectedImageIndex]?.id)
              : false
          }
          onToggleFavorite={
            selectedImageIndex !== null
              ? () => onToggleFavorite(visibleImages[selectedImageIndex].id)
              : undefined
          }
          galleryType={galleryType}
        />
      )}

      {/* Bottom Action Bar for Selection Mode */}
      {isSelectionMode && (
        <BottomActionBar
          isDownloadStarted={isDownloadZipStarted}
          isDownloading={isLoadingDownloadZip}
          selectedCount={selectedImages.size}
          onDownloadSelected={handleDownloadSelected}
          onToggleFavorites={handleToggleFavorites}
          onCancel={handleCancelSelection}
        />
      )}

      {/* Download Modal */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        imageCount={images.length}
        images={images}
        autoDownload={false}
        event={event}
      />

      <BackToTopButton />
      {/* Global Image Dropdown */}

      {dropdownImage && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleDropdownClose} />
          <div
            className="fixed z-50 w-48 bg-popover border shadow-lg rounded-md"
            style={{
              left: `${Math.min(
                dropdownImage.position.x,
                window.innerWidth - 200
              )}px`,
              top: `${Math.min(
                dropdownImage.position.y,
                window.innerHeight - 100
              )}px`,
            }}
            dir={language === "he" ? "rtl" : "ltr"}
          >
            <div className="py-1">
              <button
                onClick={handleImageDownload}
                className={cn(
                  "w-full px-4 py-2 text-sm hover:bg-accent cursor-pointer flex items-center",
                  language === "he" ? "text-right" : "text-left"
                )}
              >
                <Download
                  className={cn("h-4 w-4", language === "he" ? "ml-2" : "mr-2")}
                />

                {t("gallery.downloadImage")}
              </button>
              <button
                onClick={handleImageShare}
                className={cn(
                  "w-full px-4 py-2 text-sm hover:bg-accent cursor-pointer flex items-center",
                  language === "he" ? "text-right" : "text-left"
                )}
              >
                <Share2
                  className={cn("h-4 w-4", language === "he" ? "ml-2" : "mr-2")}
                />
                {language === "he" ? "שתף תמונה" : "Share photo"}
              </button>
              <button
                onClick={handleToggleImageFavorites}
                className={cn(
                  "w-full px-4 py-2 text-sm hover:bg-accent cursor-pointer flex items-center",
                  language === "he" ? "text-right" : "text-left"
                )}
              >
                <Heart
                  className={cn("h-4 w-4", language === "he" ? "ml-2" : "mr-2")}
                />
                {t("gallery.addToFavorites")}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Share Options Modal */}
      {shareModalImage && (
        <ShareOptionsModal
          isOpen={!!shareModalImage}
          onClose={() => setShareModalImage(null)}
          imageUrl={shareModalImage.url}
          imageName={shareModalImage.name}
        />
      )}
    </div>
  );
};
