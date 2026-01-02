import { useLanguage } from "@/hooks/useLanguage";

interface AlbumDividerProps {
  albumName: string;
  albumId: string;
  imageCount: number;
}

export const AlbumDivider = ({ albumName, albumId, imageCount }: AlbumDividerProps) => {
  const { language } = useLanguage();

  return (
    <div
      id={`album-${albumId}`}
      dir={language === "he" ? "rtl" : "ltr"}
      className="w-full flex items-center justify-center py-10"
    >
      {/* הקו השמאלי */}

  <div className="w-40 h-[2px] bg-gradient-to-r from-border/70 to-transparent"></div>
      {/* העיגול עם הכותרת */}
  <div  style={{}}
     className="mx-6 px-4 py-3 bg-white dark:bg-neutral-900 shadow-md rounded-full border border-border flex gap-2 whitespace-nowrap
       items-center justify-center min-w-fit whitespace-nowrap">
    <span className="text-[15px] font-semibold text-foreground leading-tight">
      {albumName}
    </span>
    <span className="text-[13px] text-muted-foreground leading-tight">
      ({imageCount})
    </span>
  </div>
      {/* הקו הימני */}
  <div className="w-40 h-[2px] bg-gradient-to-l from-border/70 to-transparent"></div>
    </div>
  );
};
