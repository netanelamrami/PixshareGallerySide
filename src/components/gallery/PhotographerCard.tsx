import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { Instagram, Facebook, Globe, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusinessCard } from "@/types/businessCard";
import { useTheme } from "next-themes"

interface PhotographerCardProps {
  businessCard: BusinessCard;
  isOpen: boolean;
  onClose: () => void;
}

export const PhotographerCard = ({ businessCard, isOpen, onClose }: PhotographerCardProps) => {
  const { language } = useLanguage();
  const { setTheme, theme } = useTheme()

  const handleLink = (url: string) => {
    if (url) {
      window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
    }
  };

  const handleWhatsApp = () => {
    if (businessCard.wathLink) {
      window.open(businessCard.wathLink, '_blank');
    }
  };

  const handleEmail = () => {
    if (businessCard.gmail) {
      window.location.href = `mailto:${businessCard.gmail}`;
    }
  };

  const handlePhone = () => {
    if (businessCard.phoneNumber) {
      window.location.href = `tel:${businessCard.phoneNumber}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir={language === 'he' ? 'rtl' : 'ltr'}>
        {/* <DialogHeader>
          <DialogTitle className="text-center">
            {language === 'he' ? 'כרטיס ביקור' : 'Business Card'}
          </DialogTitle>
        </DialogHeader> */}
        
        <div className="flex flex-col items-center gap-4 py-4">
          {/* Logo */}

          {businessCard.icon && theme !== "dark" && (
            // <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              <img 
                src={businessCard.icon} 
                alt={businessCard.name}
                className="w-full h-full object-cover max-w-[200px]"
              />
            // </div>
          )}
         {businessCard.iconDarkMode && theme === "dark" && (
            // <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              <img 
                src={businessCard.icon} 
                alt={businessCard.name}
                className="w-full h-full object-cover max-w-[200px]"
              />
            // </div>
          )}
          {/* Name */}
          <h3 className="text-xl font-semibold text-center">
            {businessCard.name}
          </h3>

          {/* Description */}
          {businessCard.description && (
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              {businessCard.description}
            </p>
          )}

          {/* Contact Links */}
          <div className="flex flex-wrap gap-2 justify-center w-full mt-2">
            {businessCard.instegram && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLink(businessCard.instegram)}
                className="gap-2"
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </Button>
            )}

            {businessCard.facebook && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLink(businessCard.facebook)}
                className="gap-2"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </Button>
            )}

            {businessCard.web && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLink(businessCard.web)}
                className="gap-2"
              >
                <Globe className="h-4 w-4" />
                {language === 'he' ? 'אתר' : 'Website'}
              </Button>
            )}

            {businessCard.gmail && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEmail}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                {language === 'he' ? 'מייל' : 'Email'}
              </Button>
            )}

            {businessCard.phoneNumber && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePhone}
                className="gap-2"
              >
                <Phone className="h-4 w-4" />
                {language === 'he' ? 'טלפון' : 'Phone'}
              </Button>
            )}

            {businessCard.wathLink && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleWhatsApp}
                className="gap-2"
              >
                <img src="/whatapp-icon.png" alt="WhatsApp" className="h-4 w-4" />
                WhatsApp
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
