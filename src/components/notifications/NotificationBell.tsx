import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { event } from "@/types/event";
import { useMultiUserAuth } from "@/contexts/AuthContext";

interface NotificationBellProps {
  event: event;
}

export const NotificationBell = ({ event }: NotificationBellProps) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userRegister, setUserReister] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();
  const { currentUser, setSendNotification } = useMultiUserAuth();

useEffect(() => {
  const loadData = async () => {
    if (!currentUser){
      return;
    } 
    setUserReister(true);
    if (currentUser.sendNotification == true) {
      setIsSubscribed(true);
      // setUserContact(savedContact);
    }
    else{
      setIsSubscribed(false);
    }
  };

  loadData();
}, [currentUser]);

  const toggleSubscription = () => {
    if (currentUser.sendNotification == true) {
      // כבה התראות
          window.dispatchEvent(
          new CustomEvent('notificationOpen', {
            detail: "off" 
          }));

      // localStorage.setItem('notificationSubscription', 'false');
      // setIsSubscribed(false);
      // setSendNotification(currentUser.id, false,'',true);
      // toast({
      //   title: t('notifications.notificationsDisabled'),
      //   description: t('notifications.notificationsDisabled'),
      // });
    } else if(currentUser.sendNotification == false){
      // הפעל התראות
      // localStorage.setItem('notificationSubscription', 'true');
      // setIsSubscribed(true);
      // setSendNotification(currentUser.id, true);

      // toast({
      //   title: t('notifications.subscribeSuccess'),
      //   description: t('notifications.notificationsEnabled'),
      // });
        window.dispatchEvent(
          new CustomEvent('notificationOpen', {
            detail: "on" 
          }));

    }else{
      // פתח מודל להרשמה או הפעלת התראות
         window.dispatchEvent(
          new CustomEvent('notificationOpen', {
            detail: "collapsed" 
          }));

    }
  };
return (
  <>
    {userRegister && (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSubscription}
          className="relative"
          title={isSubscribed ? t('notifications.notificationsDisabled') : t('notifications.subscribeTo')}
        >
          {isSubscribed ? (
            <Bell className="h-4 w-4 text-primary" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
        </Button>

        {/* 
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}>
            <NotificationSubscription
              event={event}
              onSubscribe={handleSubscribe}
              onClose={() => setIsModalOpen(false)}
            />
          </div>
        )} 
        */}
      </>
    )}
  </>
);
}