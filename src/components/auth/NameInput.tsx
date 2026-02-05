import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";

interface NameInputProps {
  value?: string;
  onChange?: (name: string) => void;
  onSubmit: (name: string) => void;
  onBack: () => void;
  isEmailMode?: boolean;
}

export const NameInput = ({ 
  value: externalValue, 
  onChange: externalOnChange, 
  onSubmit, 
  onBack, 
  isEmailMode = false 
}: NameInputProps) => {
  const [name, setName] = useState(externalValue || "");
  const [isLoading, setIsLoading] = useState(false);
  const { t, language } = useLanguage();
  const { toast } = useToast();

  // Sync external value with internal state
  useEffect(() => {
    if (externalValue !== undefined) {
      setName(externalValue);
    }
  }, [externalValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setName(newValue);
    externalOnChange?.(newValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: t('toast.error.title'),
        description: "חובה להכניס שם מלא",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      onSubmit(name.trim());
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בשמירת הנתונים",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold mb-2">{t('auth.enterName') || 'שם מלא'}</h2>
        <p className="text-muted-foreground">
          {t('auth.nameInstruction') || 'הכנס את שמך המלא'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          {/* <Label htmlFor="name" className="text-sm font-medium">
           
          </Label> */}
          <Input
            id="name"
            type="text"
            value={name}
            onChange={handleChange}
            className="w-full h-12 text-lg"
            disabled={isLoading}
            placeholder={t('auth.enterName') || 'שם מלא'}
            maxLength={50}
          />
          {name.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {name.length}/50
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1 h-12"
            disabled={isLoading}
          >
            {t('common.back') || 'חזור'}
          </Button>
          
          <Button
            type="submit"
            className="flex-1 h-12 font-semibold"
            disabled={!name.trim() || isLoading}
          >
            {isLoading ? (
              <div className={`flex items-center gap-2 ${language === 'he' ? 'flex-row-reverse' : 'flex-row'}`}>
                <span>מעבד...</span>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              t('auth.continue') || 'המשך לסלפי'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
