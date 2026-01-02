import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, Instagram, Download, Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { shareToWhatsApp, shareToInstagram, downloadImageForSharing } from "@/utils/shareUtils";
import { toast } from "@/hooks/use-toast";

interface ShareOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName: string;
}

export const ShareOptionsModal = ({
  isOpen,
  onClose,
  imageUrl,
  imageName
}: ShareOptionsModalProps) => {
  const { t, language } = useLanguage();
  const [isSharing, setIsSharing] = useState(false);

  const handleWhatsAppShare = async () => {
    setIsSharing(true);
    try {
      await shareToWhatsApp(imageUrl, imageName);
      toast({
        title: "נפתח וואטסאפ",
        description: "וואטסאפ נפתח - כעת תוכל לשתף את התמונה",
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לפתוח את וואטסאפ",
        variant: "destructive"
      });
    }
    setIsSharing(false);
    onClose();
  };

  const handleInstagramShare = async () => {
    setIsSharing(true);
    try {
      await shareToInstagram(imageUrl, imageName);
      toast({
        title: "נפתח אינסטגרם",
        description: "אינסטגרם נפתח - כעת תוכל לשתף את התמונה בסטורי",
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לפתוח את אינסטגרם",
        variant: "destructive"
      });
    }
    setIsSharing(false);
    onClose();
  };

  const handleDownload = async () => {
    setIsSharing(true);
    try {
      await downloadImageForSharing(imageUrl, imageName);
      toast({
        title: "הורדה הושלמה",
        description: "התמונה הורדה בהצלחה",
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "שגיאה בהורדת התמונה",
        variant: "destructive"
      });
    }
    setIsSharing(false);
    onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(imageUrl);
    toast({
      title: "קישור הועתק",
      description: "הקישור לתמונה הועתק ללוח",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} z-Index={9999999} >
      <DialogContent className="sm:max-w-md z-[9999999]" dir={language === 'he' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="text-center">שתף תמונה</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={handleWhatsAppShare}
            disabled={isSharing}
          >
            <MessageCircle className="h-8 w-8 text-green-600" />
            <span className="text-sm">וואטסאפ</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={handleInstagramShare}
            disabled={isSharing}
          >
            <Instagram className="h-8 w-8 text-pink-600" />
            <span className="text-sm">אינסטגרם</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={handleDownload}
            disabled={isSharing}
          >
            <Download className="h-8 w-8 text-blue-600" />
            <span className="text-sm">הורד</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={handleCopyLink}
            disabled={isSharing}
          >
            <Copy className="h-8 w-8 text-gray-600" />
            <span className="text-sm">העתק קישור</span>
          </Button>
        </div>
        
        <Button
          variant="ghost"
          onClick={onClose}
          className="w-full"
        >
          ביטול
        </Button>
      </DialogContent>
    </Dialog>
  );
};