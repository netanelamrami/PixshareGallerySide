import { Button } from "../ui/button";
import { useLanguage } from "@/hooks/useLanguage";

interface FaceSelectionGridProps {
  faces: string[];
  selected: Set<number>;
  onToggle: (index: number) => void;
  onContinue: () => void;
  onBack: () => void;
 variant?: "default" | "kimama";

}

export const FaceSelectionGrid = ({
  faces,
  selected,
  onToggle,
  onContinue,
  variant = "kimama",
  onBack,
}: FaceSelectionGridProps) => {
  const { t, language } = useLanguage();
  const isHebrew = language === "he";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        {isHebrew
          ? "זיהינו יותר מפרצוף אחד. אנא בחר את מי תרצה לרשום"
          : "We detected multiple faces. Please select who you want to register"}
      </p>

      <div className="grid grid-cols-3 gap-4">
        {faces.map((url, index) => {
          const isSelected = selected.has(index);
          return (
            <div
              key={index}
              className="relative cursor-pointer"
              onClick={() => onToggle(index)}
            >
              <img
                src={url}
                className={` rounded-full  w-28 h-28  aspect-square object-cover border-4 transition-all
                  ${
                    isSelected
                      ? `${variant === "kimama" ? "border-[#FFB347]" : "border-primary"}`
                      : "border-transparent opacity-60"
                  }`}
              />

              {/* Checkbox circle */}
              <div
                className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center
                  ${isSelected ? `${variant === "kimama" ? "bg-gradient-to-r from-[#FF8C00] via-[#FFA13A] to-[#FFB703] text-white" : "bg-primary text-white"}` : "bg-white border"}`}>
                {isSelected && "✓"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1 "
        >
          {t("common.back")}
        </Button>

        <Button
          type="submit"
          disabled={selected.size === 0}
          onClick={onContinue}
          className ={`flex-1 ${   variant === "kimama"
              ? `  bg-gradient-to-r from-[#FF8C00] via-[#FFA13A] to-[#FFB703] text-white shadow-md hover:shadow-lg active:scale-95 transition-all`
              : ""
          }`}
        >
          {isHebrew ? "המשך רישום" : "Continue Registration"}
        </Button>
      </div>
    </div>
  );
};
