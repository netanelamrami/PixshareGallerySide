
import React, { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Grid, LayoutGrid, Grid3x3, MoreVertical, Download, CheckSquare, Share2, X, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { event } from "@/types/event";
import { UserAvatarStack } from "@/components/ui/UserAvatarStack";
import { NotificationBell } from "../notifications/NotificationBell";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMultiUserAuth } from '@/contexts/AuthContext';
import { useIsMobile } from "@/hooks/use-mobile";
import { PhotographerCard } from "./PhotographerCard";

interface GalleryHeaderProps {
  event: event;
  totalImages: number;
  columns: number;
  onColumnsChange: (columns: number) => void;
  onDownloadAll: () => void;
  onDownloadSelected: () => void;
  onToggleSelection: () => void;
  onShare: () => void;
  isSelectionMode: boolean;
  selectedCount: number;
  galletyCustomerType?: "kimama" | "regular";
  onAuthComplete?: (userData: { contact: string; otp: string; selfieData: string; notifications: boolean }) => void;
  onViewMyPhotos: () => void;
}

export const GalleryHeader = ({
  event,
  totalImages,
  columns,
  onColumnsChange,
  onDownloadAll,
  onDownloadSelected,
  onToggleSelection,
  onShare,
  isSelectionMode,
  selectedCount,
  onAuthComplete,
  onViewMyPhotos,
  galletyCustomerType = "regular",

}: GalleryHeaderProps) => {
  const { t, language } = useLanguage();
  const { currentUser } = useMultiUserAuth();
  const isMobile = useIsMobile();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isPhotographerCardOpen, setIsPhotographerCardOpen] = useState(false);
  const columnOptions = isMobile 
    ? [
        { value: 1, icon: Grid, label: "עמודה 1" },
        { value: 2, icon: LayoutGrid, label: "עמודות 2" },
        { value: 3, icon: Grid3x3, label: "עמודות 3" },
      ]
    : [
        { value: 3, icon: Grid, label: "עמודות 3" },
        { value: 4, icon: LayoutGrid, label: "עמודות 4" },
        { value: 5, icon: Grid3x3, label: "עמודות 5" },
      ];
  return (
    <div className="sticky top-0 z-40  bg-background/95 backdrop-blur-md border-b border-border shadow-sm w-full left-0 flex" dir={language === 'he' ? 'rtl' : 'ltr'} >
      <div className="w-full px-2 py-2 pb-1 left-0">
        <div className="flex items-center justify-between left-0">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-bold text-foreground left-0" dir="ltr">
            {event?.id === 694
              ? (language === 'he' ? 'הקונגרס הציוני הל״ט' : 'The 39th Zionist Congress')
              : event?.name.replace(/<br\s*\/?>|\n/g, ' ')}
            </h1>

            {/* Photographer Name */}
            {event?.businessCard?.name &&  event.isBussinessCardVisible && (
              <button
                onClick={() => setIsPhotographerCardOpen(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
              >
                <Camera className="h-3 w-3" />
                <span className="group-hover:underline">{event.businessCard.name}</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Mobile: Three dots menu for download/select when not authenticated or no images */}


             {/* Notification Bell */}
            {!isSelectionMode && (
              <NotificationBell event={event}/>
            )}

          {/* User Management */}
          <div className="flex items-center ">
            <UserAvatarStack 
              totalImages={totalImages}
              onDownloadAll={onDownloadAll}
              event={event}
              onAuthComplete={onAuthComplete}
              onViewMyPhotos={onViewMyPhotos}
              galletyCustomerType={galletyCustomerType}
            />
          </div>


          {/* {isMobile && totalImages > 0  &&  (
            <DropdownMenu open={isMoreMenuOpen} onOpenChange={setIsMoreMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border shadow-lg">
                  <DropdownMenuItem onClick={() => { onDownloadAll(); setIsMoreMenuOpen(false); }}>
                    <Download className="h-4 w-4 mr-2" />
                    {language === 'he' ? 'הורד הכל' : 'Download All'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { 
                    window.dispatchEvent(new CustomEvent('toggleSelectionMode')); 
                    setIsMoreMenuOpen(false); 
                  }}>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    {language === 'he' ? 'בחר תמונות' : 'Select Images'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )} */}
          </div>
        </div>
      </div>
      {/* Photographer Card Modal */}
      {event?.businessCard && (
        <PhotographerCard
          businessCard={event.businessCard}
          isOpen={isPhotographerCardOpen}
          onClose={() => setIsPhotographerCardOpen(false)}
        />
      )}
    </div>
    );
};
