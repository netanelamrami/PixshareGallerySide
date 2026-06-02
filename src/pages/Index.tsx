import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { WeddingHero } from "@/components/wedding/WeddingHero";
import { Gallery } from "@/components/gallery/Gallery";
import { NotificationSubscription } from "@/components/notifications/NotificationSubscription";
import { AuthFlow } from "@/components/auth/AuthFlow";
import { LeadGenerationModal } from "@/components/leads/LeadGenerationModal";
import { DownloadModal } from "@/components/gallery/DownloadModal";
import { apiService } from "../data/services/apiService";
import { Skeleton } from "@/components/ui/skeleton";
import { useMultiUserAuth } from "@/contexts/AuthContext";
import { User } from "@/types/auth";
import { EventLockModal } from "@/components/wedding/EventLockModal";
import { useLanguage } from "@/hooks/useLanguage";
import { KimamaForm } from "@/components/wedding/KimamaForm";
import { set } from "date-fns";

type NotificationStep =
  | "collapsed"
  | "contact"
  | "otp"
  | "on"
  | "off"
  | "hidden";

type IndexProps = {
  isKimama?: boolean;
};

const Index = ({ isKimama = false }: IndexProps) => {
  const { eventLink } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [showGallery, setShowGallery] = useState(false);
  const [galleryType, setGalleryType] = useState<"all" | "my">("all");
  // const [showFloatingNavbar, setShowFloatingNavbar] = useState(true);
  const [showAuthFlow, setShowAuthFlow] = useState(false);
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [favoriteImages, setFavoriteImages] = useState<Set<string>>(new Set());
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [isLoadingAllPhotos, setIsLoadingAllPhotos] = useState(false);
  const [isLoadingMyPhotos, setIsLoadingMyPhotos] = useState(false);
  const [showNotificationSubscription, setShowNotificationSubscription] =
    useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState(3);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [initialStepNotification, setInitialStepNotification] =
    useState<NotificationStep>("collapsed");
  const [shouldLoadUserImages, setShouldLoadUserImages] = useState(false);
  const [isEventLockModalOpen, setIsEventLockModalOpen] = useState(false);
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    currentIndex: number;
  } | null>(null);
  const [showAllPhotosBt, setshowAllPhotosBt] = useState(false);

  const [galleryImages, setGalleryImages] = useState([]);
  const [userImages, setUserImages] = useState([]);
  const [eventId, setEventId] = useState<number | null>(null);
  const { language, t, setLanguage } = useLanguage();

  // Use multi-user auth system
  const { isAuthenticated, addUser, currentUser, setUsers } =
    useMultiUserAuth();

  // Force re-render when authentication state changes
  const [, forceUpdate] = useState({});
  const queryParams = new URLSearchParams(location.search);
  const urlUserId = queryParams.get("userid");
  const eventRef = useRef<any>(null);

  //kimeme custoner related to new 
  const KIMAMA_PHOTOGRAPHER_ID = "474b7ead-e8c0-4b17-9962-6e84ec6ee58b";
  useEffect(() => {
    eventRef.current = event;
  }, [event]);

  useEffect(() => {
    const currentEventLink = eventLink;
    apiService
      .getEvent(currentEventLink)
      .then((eventData) => {
        if (!eventData) {
          navigate("/event-not-found/" + currentEventLink);
          return null;
        }

        if (eventData.isDeleted === true || eventData.isActive === false) {
          navigate("/event-inactive/" + currentEventLink);
          return null;
        }
        if (eventData.photographerId === KIMAMA_PHOTOGRAPHER_ID) {
          if (!location.pathname.startsWith("/kimama")) {
            navigate(`/kimama/${currentEventLink}`, { replace: true });
            return null;
          }
        }
        setEvent(eventData);
        setEventId(eventData.id);
        return apiService.getEventImagesFullData(currentEventLink);
      })
      .then((imagesData) => {
        if (!imagesData) return; // אם נעברנו לדף user
        const formattedImages = imagesData.map(
          (imageData: any, index: number) => ({
            id: imageData.name || `image-${index}`,
            src: imageData.smallUrl,
            mediumSrc: imageData.medUrl,
            largeSrc: imageData.largeUrl,
            alt: `Gallery image ${index + 1}`,
            size: `${imageData.size} MB`,
            width: 400,
            height: 300,
            albumId: imageData.albomId?.toString() || "main",
            photoHeight: imageData.photoHeight == 100 ? 150 : 350,
          })
        );
        setGalleryImages(formattedImages);
        setIsLoading(false);

        // Handle return from ImageSave page
        if (
          location.state?.externalLightbox &&
          location.state?.externalLightbox.currentIndex !== undefined
        ) {
          setTimeout(() => {
            if (location.search == "?my") {
              handleAuthComplete(currentUser);
            }
            setShowGallery(true);
            setLightboxState({
              isOpen: true,
              currentIndex: location.state?.externalLightbox.currentIndex,
            });
            // Restore scroll position
            if (location.state.scrollPosition) {
              setTimeout(() => {
                window.scrollTo(0, location.state.scrollPosition);
                navigate(location.pathname, { replace: true, state: {} });
              }, 500);
            }

            // Clear the state
            navigate(location.pathname, { replace: true, state: {} });
          }, 100);
        } else if (location.state?.scrollPosition) {
          if (location.search == "?my") {
            handleAuthComplete(currentUser);
          }
          setShowGallery(true);
          setTimeout(() => {
            window.scrollTo(0, location.state.scrollPosition);
            navigate(location.pathname, { replace: true, state: {} });
          }, 1000);
        }
      })
      .catch((error) => {
        console.error("Error loading data:", error);

        navigate("/event-not-found/" + currentEventLink);
      });
  }, [eventLink, navigate]);

  // Lead generation modal timer - show after 15 seconds if not shown before
  useEffect(() => {
    if (!showGallery || galleryImages.length === 0 || showLeadModal) return;

    // Check if modal was already shown in this browser
    const hasSeenLeadModal = localStorage.getItem("hasSeenLeadModal");
    if (hasSeenLeadModal) return;

    // const timer = setTimeout(() => {
    //   setShowLeadModal(true);
    // }, 15000); // 15 seconds

    // return () => clearTimeout(timer);
  }, [showGallery, galleryImages.length, showLeadModal]);

  // Load favorite images from localStorage on mount
  useEffect(() => {
    const savedFavorites = sessionStorage.getItem("favoriteImages");
    if (savedFavorites) {
      setFavoriteImages(new Set(JSON.parse(savedFavorites)));
    }
  }, []);
  useEffect(() => {
  }, [showAuthFlow]);

  useEffect(() => {
    const url = window.location.href;
    const baseUrl = url.split("?")[0]; // כתובת בלי query params
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get("lang");

    if (langParam) {
      setLanguage(langParam as "en" | "he");
      localStorage.setItem("appLanguage", langParam);
    }

    const keyParam = params.get("access");
    if (!keyParam) return;

    // Secure server-side token verification — no more base64 trickery
    (async () => {
      const eventLinkParam = window.location.pathname.replace(/^\//, '').split('/')[0];
      if (!eventLinkParam) return;
      const isValid = await apiService.verifyAdminToken(eventLinkParam, keyParam);
      if (isValid) setshowAllPhotosBt(true);
    })();
  }, []);

  useEffect(() => {
    if (shouldLoadUserImages && event && currentUser) {
      loadUserImages(currentUser).then(() => {
        setShouldLoadUserImages(false);
      });
    }
  }, [shouldLoadUserImages, event, currentUser]);

  const handleViewAllPhotos = () => {
    setIsLoadingAllPhotos(true);
    setGalleryType("all");
    setTimeout(() => {
      setShowGallery(true);
      setIsLoadingAllPhotos(false);
      // Smooth scroll to gallery
      setTimeout(() => {
        document.getElementById("gallery")?.scrollIntoView({
          behavior: "smooth",
        });
      }, 300);
    }, 1000);
  };

  useEffect(() => {
    const fetchUserAndImages = async () => {
      if (urlUserId && event) {
        try {
          const { user } = await apiService.loginUser(Number(urlUserId));
          handleAuthComplete(user);
        } catch (err) {
          console.error("Error logging in user and loading images", err);
        }
      }
    };
    fetchUserAndImages();
  }, [urlUserId, event]);

  const handleViewMyPhotos = () => {
    setIsLoadingMyPhotos(true);
    setTimeout(() => {
      setShowAuthFlow(true);
      setIsLoadingMyPhotos(false);
    }, 300);
  };

  const onUserClickedLoadImages = () => {
    setShouldLoadUserImages(true);
  };

  const loadUserImages = async (user, allMyUsersPhotos = false) => {
    setIsLoadingMyPhotos(true);
    if (isKimama) setUserImages([]);
    try {
      const userId = Number(user.id); //parseInt(sessionStorage.getItem('userid') || '0');
      const eventId = event?.id;
      if (userId && eventId) {
        const userImagesData = await apiService.getImages(
          userId,
          eventId,
          isKimama,
        );
        const formattedUserImages =
          userImagesData?.map((imageData: any, index: number) => ({
            id: imageData.name || `user-image-${index}`,
            src: imageData.smallUrl,
            mediumSrc: imageData.medUrl,
            largeSrc: imageData.largeUrl,
            alt: `User image ${index + 1}`,
            size: "medium" as const,
            width: 400,
            height: 300,
            albumId: imageData.albomId?.toString() || "main",
            photoHeight: imageData.photoHeight == 100 ? 150 : 350,
          })) || [];

        setUserImages(formattedUserImages);
      }
    } catch (error) {
      console.error("Error loading user images:", error);
      setUserImages([]);
    }
    setIsLoadingMyPhotos(false);
  };
  const handleViewFavorites = () => {
    //setGalleryType('favorites');
    setShowGallery(true);
    // Smooth scroll to gallery
    setTimeout(() => {
      document.getElementById("gallery")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 300);
  };

  const handleAlbumClick = (albumId: string) => {
    setSelectedAlbum(albumId);
    if (albumId === "favorites") {
      handleViewFavorites();
    } else {
      // For other albums, show all images for now
      //setGalleryType('all');
      setShowGallery(true);
      setTimeout(() => {
        document.getElementById("gallery")?.scrollIntoView({
          behavior: "smooth",
        });
        setSelectedAlbum(albumId);
      }, 300);
    }
  };

  const handleToggleFavorite = (imageId: string) => {
    setFavoriteImages((prevFavorites) => {
      const newFavorites = new Set(prevFavorites);

      if (newFavorites.has(imageId)) {
        newFavorites.delete(imageId);
        // statistic.favoritesPhotosSum--;
        // SaveStatisticsForEvent(statistic);
      } else {
        newFavorites.add(imageId);
      }

      const arrayFavorites = Array.from(newFavorites);
      // localStorage.setItem('favoriteImages', JSON.stringify(arrayFavorites));
      sessionStorage.setItem("favoriteImages", JSON.stringify(arrayFavorites));
      return newFavorites;
    });
  };

  const handleAuthComplete = async (user: User) => {
    setShowAuthFlow(false);
    addUser(user);

    // Force immediate re-render
    forceUpdate({});

    // טוען את התמונות של המשתמש
    onUserClickedLoadImages();
    // await loadUserImages(user);

    // Set gallery state
    setGalleryType("my");
    setShowGallery(true);

    // Show notification subscription for selfie-only users

    setTimeout(() => {
      if (!event.needDetect && !user.sendNotification) {
        setShowNotificationSubscription(true);
      }
    }, 3000);

    // Smooth scroll to gallery
    setTimeout(() => {
      document.getElementById("gallery")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 300);
  };

  const handleNotificationOpen = (event: CustomEvent) => {
    setInitialStepNotification(event.detail);
    setShowNotificationSubscription(true);
  };
  const handleLockSuccess = () => {
    handleViewAllPhotos();
  };
  // Listen for exit selection mode event and gallery type toggle
  useEffect(() => {
    const handleExitSelectionMode = () => {
      setSelectionMode(false);
      setSelectedImages(new Set());
    };

    const handleToggleSelectionFromNavbar = () => {
      setSelectionMode(!selectionMode);
      setSelectedImages(new Set());
    };

    const handleSwitchToAllPhotos = () => {
      const currentEvent = eventRef.current;

      if (
        currentEvent?.isAllPhotoEventLock &&
        currentEvent?.eventPhotoLockType === "Code"
      ) {
        setIsEventLockModalOpen(true);
      } else {
        handleViewAllPhotos();
      }
    };

    const handleSwitchToMyPhotos = async (event) => {
      const user = event.detail;
      // if (user.id == "allPhotosUsers") {
      //   loadUserImages(currentUser, true);
      //   return;
      // }
      if (!isAuthenticated && !urlUserId && !user.relatedToUserId) {
        setShowAuthFlow(true);
        return;
      }

      // await loadUserImages(user ?? currentUser);

      onUserClickedLoadImages();

      setGalleryType("my");
      setShowGallery(true);
    };

    // Listen for user switch events
    const handleAuthStateChanged = async () => {
      if (isAuthenticated && galleryType === "my") {
        onUserClickedLoadImages();
        // await loadUserImages(currentUser);
      }
    };

    window.addEventListener("exitSelectionMode", handleExitSelectionMode);
    window.addEventListener(
      "toggleSelectionMode",
      handleToggleSelectionFromNavbar
    );
    window.addEventListener("switchToAllPhotos", handleSwitchToAllPhotos);
    window.addEventListener("switchToMyPhotos", handleSwitchToMyPhotos);
    window.addEventListener("authStateChanged", handleAuthStateChanged);
    window.addEventListener("notificationOpen", handleNotificationOpen);

    return () => {
      window.removeEventListener("exitSelectionMode", handleExitSelectionMode);
      window.removeEventListener(
        "toggleSelectionMode",
        handleToggleSelectionFromNavbar
      );
      window.removeEventListener("switchToAllPhotos", handleSwitchToAllPhotos);
      window.removeEventListener("switchToMyPhotos", handleSwitchToMyPhotos);
      window.removeEventListener("authStateChanged", handleAuthStateChanged);
      window.removeEventListener("notificationOpen", handleNotificationOpen);
    };
  }, [isAuthenticated, selectionMode]);

  const handleColumnsChange = (newColumns: number) => {
    setColumns(newColumns);
  };

  const handleNotificationSubscribe = (
    contact: string,
    notifications: boolean
  ) => {
    setShowNotificationSubscription(false);
  };

  const handleAuthCancel = () => {
    setShowAuthFlow(false);
  };

  const handleLeadModalClose = () => {
    localStorage.setItem("hasSeenLeadModal", "true");
    setShowLeadModal(false);
  };

  // Track scroll position to hide floating navbar when near hero
  useEffect(() => {
    if (!showGallery) return;

    const handleScroll = () => {
      const galleryElement = document.getElementById("gallery");
      if (!galleryElement) return;

      // const galleryTop = galleryElement.offsetTop;
      // const scrollTop = window.scrollY;
      // const windowHeight = window.innerHeight;

      // Hide floating navbar if user scrolled back near the hero section
      // Show it when user is well into the gallery
      // const shouldShow = scrollTop > galleryTop;
      // setShowFloatingNavbar(shouldShow);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Call once to set initial state

    return () => window.removeEventListener("scroll", handleScroll);
  }, [showGallery]);

  // Filter images based on gallery type and selected album
  const filteredImages = (() => {
    let baseImages = galleryImages;
    if (galleryType === "my" && isAuthenticated) {
      baseImages = userImages; // שימוש בתמונות המשתמש שנטענו מהשרת
      return baseImages;
    }
    if (event?.withPhotos || showAllPhotosBt) {
      return baseImages;
    }

    return [];

    // For now, all albums show all images (you can customize this later)
  })();

  // Show loading skeleton while data is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <Skeleton className="h-96 w-full rounded-lg" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {!isKimama ? (
        <WeddingHero
          event={event}
          onViewAllPhotos={handleViewAllPhotos}
          onViewMyPhotos={handleViewMyPhotos}
          isLoadingAllPhotos={isLoadingAllPhotos}
          isLoadingMyPhotos={isLoadingMyPhotos}
          showAllPhotosBt={showAllPhotosBt}
        />
      ) : (
        <KimamaForm
          event={event}
          onViewAllPhotos={handleViewAllPhotos}
          onViewMyPhotos={handleViewMyPhotos}
          isLoadingAllPhotos={isLoadingAllPhotos}
          isLoadingMyPhotos={isLoadingMyPhotos}
          showAllPhotosBt={showAllPhotosBt}
          onComplete={handleAuthComplete}
        />)}



      {showGallery && (
        <div id="gallery">
          <Gallery
            event={event}
            isKimama={isKimama}
            images={filteredImages}
            favoriteImages={favoriteImages}
            onToggleFavorite={handleToggleFavorite}
            galleryType={galleryType}
            onAlbumClick={handleAlbumClick}
            selectedAlbum={selectedAlbum}
            selectionMode={selectionMode}
            selectedImages={selectedImages}
            galleryCustomerType={isKimama ? 'kimama' : 'regular'}
            // onAuthComplete={handleAuthComplete}
            onImageSelect={(imageId) => {
              const newSelected = new Set(selectedImages);
              if (newSelected.has(imageId)) {
                newSelected.delete(imageId);
              } else {
                newSelected.add(imageId);
              }
              setSelectedImages(newSelected);
            }}
            columns={columns}
            onViewMyPhotos={handleViewMyPhotos}
            lightboxState={lightboxState}
            onLightboxStateChange={setLightboxState}
          />
        </div>
      )}

      {/* Auth Flow Modal */}
      {showAuthFlow && event && !isKimama && (
        <>
          <AuthFlow
            event={event}
            onComplete={handleAuthComplete}
            onCancel={handleAuthCancel}
            setUsers={setUsers}
          />
        </>
      )}

      {/* Lead Generation Modal */}
      <LeadGenerationModal
        isOpen={showLeadModal}
        onClose={handleLeadModalClose}
      />

      {showNotificationSubscription && (
        <NotificationSubscription
          event={event}
          onSubscribe={handleNotificationSubscribe}
          onClose={() => setShowNotificationSubscription(false)}
          isKimama={isKimama}
          initialStep={initialStepNotification}
        />
      )}

      {/* Download All Modal */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        imageCount={galleryImages.length}
        images={galleryImages}
        isKimama={isKimama}
        autoDownload={galleryImages.length <= 20}
        albumName={event?.name || "כל התמונות"}
        galleryType={galleryType}
        event={event}
      />

      {/* Event Lock Modal */}
      <EventLockModal
        isOpen={isEventLockModalOpen}
        onClose={() => setIsEventLockModalOpen(false)}
        onSuccess={handleLockSuccess}
        eventId={event?.id || 0}
      />
    </div>
  );
};

export default Index;
