import { useLanguage } from "@/hooks/useLanguage";
import { SelectedFace } from "@/types/auth";
import { useState } from "react";
import { Button } from "../ui/button";



interface FaceNamesFormProps {
  faces: SelectedFace[];
  isLoading?: boolean;
  onSubmit: (faces: SelectedFace[]) => void;
  onBack: () => void;
  variant?: "default" | "kimama";

}
export const FaceNamesForm = ({
  faces,
  isLoading,
  onSubmit,
  onBack,
  variant = "default",
}: FaceNamesFormProps) => {
  const [items, setItems] = useState(faces);
  const { t, language } = useLanguage();
  const isHebrew = language === "he";

  const updateName = (index: number, name: string) => {
    setItems(prev =>
      prev.map(f =>
        f.index === index ? { ...f, name } : f
      )
    );
  };
  return (
    <div className="space-y-4">
      {/* <button
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← {isHebrew ? "חזרה לבחירת פרצופים" : "Back to face selection"}
      </button> */}

      <div className="space-y-3">
        {items.map(face => (
          <div
            key={face.index}
            className="flex items-center gap-4 p-3 border rounded-lg"
          >
            <img
              src={face.imageUrl}
              className="w-16 h-16 rounded-full object-cover"
            />

            <input
              type="text"
              placeholder={isHebrew ? "שם מלא" : "Full name"}
              value={face.name}
              onChange={e => updateName(face.index, e.target.value)}
              className="flex-1 border rounded-md px-3 py-2"
            />
          </div>
        ))}
      </div>


      <div className="flex gap-3">
        <Button
          type="button"
          disabled={isLoading}
          variant="outline"
          onClick={onBack}
          className="flex-1 "
        >
          {t("common.back")}
        </Button>

        <Button
          type="submit"
          
        disabled={items.some(f => !f.name.trim()) || isLoading}
        onClick={() => onSubmit(items)}
          className={`flex-1 ${variant === "kimama"
              ? `  bg-gradient-to-r from-[#FF8C00] via-[#FFA13A] to-[#FFB703] text-white shadow-md hover:shadow-lg active:scale-95 transition-all`
              : ""
          }`}
        >
        {isHebrew ? "הצג גלריה" : "View Gallery"}
        </Button>
      </div>

    </div>
  );
};
