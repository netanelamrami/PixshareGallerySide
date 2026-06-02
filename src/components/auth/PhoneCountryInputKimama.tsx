
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import countries from "@/types/contries";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { event } from "@/types/event";

interface PhoneCountryInputKimamaProps {
  onSubmit: (phone: string, notifications: boolean) => void;
  onBack: () => void;
  onLinkOpen: () => void;
  event: event;

  submitText?: string;
  variant?: "default" | "kimama";

}

export const PhoneCountryInputKimama = ({ event,onSubmit, onLinkOpen, onBack, variant = "default", submitText = 'auth.sendCode' }: PhoneCountryInputKimamaProps) => {
  const [countryCode, setCountryCode] = useState("+972");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notifications, setNotifications] = useState(false);
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const validatePhoneNumber = (number: string, countryCode: string): boolean => {
    const selectedCountry = countries.find(country => country.code === countryCode);
    if (!selectedCountry) return false;

    // Remove leading zero and any spaces/dashes
    const cleanNumber = number.replace(/^0/, '').replace(/[\s-]/g, '');

    return selectedCountry.pattern.test(cleanNumber);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber.trim()) {
      toast({
        title: t('toast.error.title'),
        description: t('auth.phoneRequired'),
        variant: "destructive",
      });
      return;
    }

    const cleanPhoneNumber = phoneNumber.replace(/^0/, '').replace(/[\s-]/g, '');

    if (!validatePhoneNumber(phoneNumber, countryCode)) {
      toast({
        title: t('toast.error.title'),
        description: t('auth.invalidPhone'),
        variant: "destructive",
      });
      return;
    }

    const fullPhone = countryCode + cleanPhoneNumber;
    onSubmit(fullPhone, notifications);
  };

  return (
    <div className="space-y-6" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div className="text-center mb-6">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${variant === "kimama"
            ? "bg-[rgba(255,179,71,0.25)]"
            : "bg-[hsl(179_40%_60%/0.2)]"
            }`}
        >  <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-8 h-8 ${variant === "kimama"
            ? "text-[#FFB347]"
            : "text-[hsl(179_40%_60%)]"
            }`} aria-hidden="true"
        >
            <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path>
          </svg>
        </div>

        <h2 className="text-xl font-bold mb-2">{t('auth.enterPhone')}</h2>
        <p className="text-muted-foreground">
          {t('auth.phoneInstructionKimama')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="flex gap-2" dir="ltr">
          <Select value={countryCode} onValueChange={setCountryCode} >
            <SelectTrigger className={`w-[90px] ${variant === "kimama"
              ? `
                    focus:ring-2
                    focus:ring-[#FFB347]/40
                    focus:ring-offset-0
                    focus-visible:ring-[#FFB347]/40
                  `
              : ""
              }`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <div className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.code}</span>
                    <span className="text-sm text-muted-foreground">
                      {country.name[language as keyof typeof country.name]}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="tel"
            placeholder={t('auth.enterPhone')}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            className={`flex-1 ${variant === "kimama"
              ? `
                    focus:ring-2
                    focus:ring-[#FFB347]/40
                    focus:ring-offset-0
                    focus-visible:ring-[#FFB347]/40
                  `
              : ""
              }`}
            dir="ltr"
          />
        </div>

        {/* <div className="text-xs text-muted-foreground text-center" dir={language === 'he' ? 'rtl' : 'ltr'}>
          {t('auth.phoneExample')}
        </div> */}
        {/* 
        <div className="flex start-4 opacity-1  items-center gap-2 text-center space-x-2 space-x-reverse" dir={language === 'he' ? 'rtl' : 'ltr'}>
          <Checkbox
            id="notifications"
            checked={notifications}
            onCheckedChange={(checked) => setNotifications(checked as boolean)}
          />
          <label
            htmlFor="notifications"
            className="text-sm  text-center font-medium leading-none align-middle peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {t('auth.notifyNewPhotos')}
          </label>
        </div> */}

        <div className="flex gap-3">
          {onBack && (

            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className={`flex-1  mt-4 ${variant === "kimama"
                ? "text-[#FFB347]"
                : "text-[hsl(179_40%_60%)]"
                }`}
            >
              {t('common.back')}
            </Button>
          )}
          <Button
            type="submit"
            className={`flex-1 mt-4 flex items-center justify-center py-7 text-lg font-semibold rounded-xl
              transition-all shadow-md hover:shadow-lg active:scale-95
              ${variant === "kimama"
                ? "text-white bg-gradient-to-r from-[#FF8C00] via-[#FFA13A] to-[#FFB703] "
                : "text-[hsl(179_40%_60%)] bg-[hsl(179_40%_60%/0.15)]"
              }
            `}
            dir={language === "he" ? "rtl" : "ltr"}
          >
            {t(submitText)}
            {language === "he"
              ? <ArrowLeft className="w-6 h-6 ml-2" />
              : <ArrowRight className="w-6 h-6 ml-2" />}
          </Button>

        </div>
        {(event.externalLink) && (


          <div className="flex gap-3"  >
            <Button
              type="button"
              variant="outline"
              onClick={onLinkOpen}
              className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-blue-500"
                fill="currentColor"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.84 8.683c-.138.633-.5.784-1.013.488l-2.804-2.066-1.351 1.302c-.15.15-.275.275-.563.275l.2-2.85 5.188-4.688c.225-.2-.05-.313-.35-.113l-6.413 4.038-2.763-.863c-.6-.188-.613-.6.125-.888l10.8-4.162c.5-.188.938.113.775.888z" />
              </svg>

              <span className="text-sm">{language === "he" ? "טלגרם המחנה" : "Camp telegram"}</span>
            </Button>
          </div>
        )}

      </form>
    </div>
  );
};
