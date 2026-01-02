import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

interface ImageSaveProps {
  imageUrl: string;
  imageName: string;
  onClose: () => void;
  language: "he" | "en";
}

export const ImageSave = ({
  imageUrl,
  imageName,
  onClose,
  language,
}: ImageSaveProps) => {
  const { t } = useLanguage();
  const [showInstructions, setShowInstructions] = useState(true);
  console.log(imageName);
  return (
    <div
      className="h-full flex flex-col bg-background"
      dir={language === "he" ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="text-lg font-semibold">
          {t("imageSave.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("imageSave.subtitle")}
        </p>
      </div>

      {/* Instructions */}
      <div className="mx-4 mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm">
            {t("imageSave.instructions.title")}
          </p>
          <button onClick={() => setShowInstructions(!showInstructions)}>
            {showInstructions ? <ChevronUp /> : <ChevronDown />}
          </button>
        </div>

        {showInstructions && (
          <ol className="mt-2 text-sm space-y-1">
            <li>1. {t("imageSave.instructions.step1")}</li>
            <li>2. {t("imageSave.instructions.step2")}</li>
            <li>3. {t("imageSave.instructions.step3")}</li>
          </ol>
        )}
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center p-4 max-h-[50vh]">
        <img
          src={imageUrl}
          alt={imageName}
          className="max-h-[45vh] object-contain"
        />
      </div>

           <div 
            className={cn(
              "text-center mt-3 transition-all duration-700 delay-300",
              showInstructions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <p className="text-muted-foreground">
              {t('imageSave.longPressHint')}
            </p>
          </div>
    </div>
  );
};
