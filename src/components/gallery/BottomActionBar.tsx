import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Download, X, Heart, CheckSquare, Loader2 } from "lucide-react";

interface BottomActionBarProps {
  selectedCount: number;
  isDownloading: boolean;
  isDownloadStarted?: boolean;
  onDownloadSelected: () => void;
  onToggleFavorites: () => void;
  onCancel: () => void;
}

export const BottomActionBar = ({
  selectedCount,
  isDownloading,
  isDownloadStarted,
  onDownloadSelected,
  onToggleFavorites,
  onCancel,
}: BottomActionBarProps) => {
  const { t, language } = useLanguage();

  return (
    <div
      className="fixed bottom-6 left-4 right-4 z-50 flex justify-center animate-slide-in-from-bottom"
      dir={language === "he" ? "rtl" : "ltr"}
    >
      <div className="bg-background/95 backdrop-blur-md border border-border shadow-xl rounded-2xl max-w-screen-sm w-full">
        <div className="safe-area-bottom px-4 py-3 sm:py-4">
          <div className={`flex items-center justify-between`}>
            {/* Selected count indicator - positioned based on language */}
            <div
              className={`order-1 flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 backdrop-blur-sm`}
            >
              {!isDownloadStarted && (
                <>
                  <CheckSquare className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {selectedCount} {t("common.selected")}
                  </span>
                </>
              )}
              {isDownloadStarted &&
                (language === "he" ? (
                  <span className="text-sm font-medium text-primary">
                    התמונות ירדו כקובץ ZIP,<br></br>
                    בסיום יופיעו כתיקיה ב"קבצים" במכשיר
                  </span>
                ) : (
                  <span className="text-sm font-medium text-primary">
                    {t("common.preparingDownload")}
                  </span>
                ))}
            </div>

            {/* Action buttons - ordered based on language */}
            <div
              className="order-2 flex items-center gap-2"
              dir={language === "he" ? "rtl" : "ltr"}
            >
              {/* Cancel button - non-action button on left in LTR, right in RTL */}
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className={`gap-2 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3 rounded-xl ${
                  language === "he" ? "order-3" : "order-1"
                }`}
              >
                {language === "he" ? (
                  <>
                    <span className="hidden xs:inline">
                      {t("common.cancel")}
                    </span>
                    <X className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    <span className="hidden xs:inline">
                      {t("common.cancel")}
                    </span>
                  </>
                )}
              </Button>
              {!isDownloadStarted && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleFavorites}
                    disabled={selectedCount === 0}
                    className={`gap-2 hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-700 transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3 rounded-xl ${
                      language === "he" ? "order-2" : "order-2"
                    }`}
                  >
                    {language === "he" ? (
                      <>
                        <span className="hidden xs:inline">
                          {t("common.favorites")}
                        </span>
                        <Heart className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <Heart className="h-4 w-4" />
                        <span className="hidden xs:inline">
                          {t("common.favorites")}
                        </span>
                      </>
                    )}
                  </Button>
                </>
              )}
              {/* Download */}
              
            {(!isDownloadStarted || isDownloading) && (
              <Button
                variant="default"
                size="sm"
                onClick={onDownloadSelected}
                disabled={isDownloading}
                className={`gap-2 bg-primary hover:bg-primary/90 shadow-lg transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3 rounded-xl ${
                  language === "he" ? "order-1" : "order-3"
                }`}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden xs:inline">
                      {t("common.downloading")}
                    </span>
                  </>
                ) : language === "he" ? (
                  <>
                    <span className="hidden xs:inline">
                      {t("common.download")}
                    </span>
                    <Download className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span className="hidden xs:inline">
                      {t("common.download")}
                    </span>
                  </>
                )}
              </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
