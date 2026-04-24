import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/data/services/apiService";

interface EventLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventId: number;
}

export const EventLockModal = ({ isOpen, onClose, onSuccess, eventId }: EventLockModalProps) => {
  const { t, language } = useLanguage();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      const error = language === 'he' ? 'אנא הזן קוד' : 'Please enter code'
        toast({
          title: error,
          // description: t('auth.emailSentDesc'),
          variant: "default",
        });
      return;
    }

    setIsLoading(true);
    try {
      // Call API to check event lock
      const isCodeValid = await apiService.checkEventLock(eventId, code)
      if (isCodeValid) {
        onSuccess();
        onClose();
        setCode("");
      } else {
        const error = language === 'he' ? 'קוד שגוי' : 'Invalid code'
        toast({
          title: error,
          // description: t('auth.emailSentDesc'),
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error checking event lock:', error);
        const errorCach = language === 'he' ? 'שגיאה בבדיקת הקוד' : 'Error checking code'
        toast({
          title: errorCach,
          // description: t('auth.emailSentDesc'),
          variant: "default",
        });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCode("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]" dir={language === 'he' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-primary" />
            <DialogTitle>
              {language === 'he' ? 'אירוע נעול' : 'Event Locked'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {language === 'he' 
              ? 'אירוע זה מוגן בסיסמה. אנא הזן את הקוד שקיבלת מבעל האירוע.'
              : 'This event is password protected. Please enter the code you received from the event owner.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="code">
              {language === 'he' ? 'קוד גישה' : 'Access Code'}
            </Label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={language === 'he' ? 'הזן קוד...' : 'Enter code...'}
              disabled={isLoading}
              className="text-center"
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              {language === 'he' ? 'ביטול' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'he' ? 'בודק...' : 'Checking...'}
                </>
              ) : (
                language === 'he' ? 'אמת קוד' : 'Verify Code'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};