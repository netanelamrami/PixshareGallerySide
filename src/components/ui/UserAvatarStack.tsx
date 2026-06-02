import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserCircle, Plus, LogOut, CheckSquare, MoreVertical, Download, MessageCircle } from 'lucide-react';
import { useMultiUserAuth } from '@/contexts/AuthContext';
import { AddUserModal } from '@/components/users/AddUserModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { FAQSupportDialog } from '../gallery/FAQSupportDialog';
import { faqData } from '@/data/faqData';
import { event } from '@/types/event';

interface UserAvatarStackProps {
  totalImages: number;
  onDownloadAll: () => void;
  event?: event;
  onAuthComplete?: (userData: { contact: string; otp: string; selfieData: string; notifications: boolean }) => void;
  className?: string;
  onViewMyPhotos: () => void;
  galletyCustomerType?: "kimama" | "regular";
}

export const UserAvatarStack = ({ totalImages, onDownloadAll, event, onAuthComplete, className, onViewMyPhotos, galletyCustomerType }: UserAvatarStackProps) => {
  const { users, currentUser, isAuthenticated, switchUser, logout, addUser } = useMultiUserAuth();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const isMobile = useIsMobile();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const questions = faqData[language] || faqData.he;

  // const [showAuthModal, setShowAuthModal] = useState(false);
  // const [forceUpdate, setForceUpdate] = useState(0);

  // Force update when users change
  // React.useEffect(() => {
  //   //setForceUpdate(prev => prev + 1);
  // }, [users.length, currentUser?.id]);

  // Listen for user added events and auth state changes
  // React.useEffect(() => {
  //   // const handleUserAdded = () => {
  //   //   setForceUpdate(prev => prev + 1);
  //   // };

  //   // const handleAuthStateChanged = (event: CustomEvent) => {
  //   //   setForceUpdate(prev => prev + 1);
  //   // };

  //   // window.addEventListener('userAdded', handleUserAdded);
  //   // window.addEventListener('authStateChanged', handleAuthStateChanged);

  //   return () => {
  //     window.removeEventListener('userAdded', handleUserAdded);
  //     window.removeEventListener('authStateChanged', handleAuthStateChanged);
  //   };
  // }, []);

  if (!isAuthenticated || !currentUser) {
    return (
      <>
        <div className={cn("relative", className)}>
          {(event?.hasFaceRecognition || isMobile) && (
          <Popover open={isOpen} onOpenChange={setIsOpen} >
            <PopoverTrigger asChild >
              <Button
                variant="ghost"
                size="sm"
                className="relative h-8 w-8 rounded-full border-2 border-border hover:border-primary/50 transition-all duration-200"
              >
                {event?.hasFaceRecognition ? (
                  <UserCircle className="h-5 w-5" />
                 ) : (
                <MoreVertical className="h-4 w-4" />
     
              )}
              </Button>
            </PopoverTrigger>
                        <PopoverContent align="end" className="w-48 p-2" dir={language === 'he' ? 'rtl' : 'ltr'}>

{/* totalImages < 600 &&  */}
              {isMobile && totalImages > 0 && ( 
                <>
                  <Button
                    variant="ghost"
                    className="w-full h-auto p-2 justify-start hover:bg-muted/50"
                    onClick={() => {
                      onDownloadAll();
                      setIsOpen(false);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      {language === 'he' ? 'הורד הכל' : 'Download All'}
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full h-auto p-2 justify-start hover:bg-muted/50"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('toggleSelectionMode'));
                      setIsOpen(false);
                    }}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      {language === 'he' ? 'בחר תמונות' : 'Select Images'}
                    </span>
                  </Button>
                </>
              )}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSupportOpen(true)}
                  className="rounded-full px-2 py-2"
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  <span>{language === 'he' ? 'תמיכה' : 'Support'}</span>
                </Button>
              )}
              {(event?.hasFaceRecognition) && (
                <Button
                variant="ghost"
                
                className="w-full h-auto p-2 justify-start hover:bg-muted/50"
                onClick={() => {
                  onViewMyPhotos();
                  setIsOpen(false);
                }}
                >
                <UserCircle className="w-4 h-4 mr-2" />
                {language === 'he' ? 'מצא אותי' : 'Find me'}
              </Button>
              )}
            </PopoverContent>
          </Popover>
              )}
        </div>

        <FAQSupportDialog
          isOpen={isSupportOpen}
          setIsOpen={setIsSupportOpen}
          questions={questions}
          event={event}
        />
        {/* {event && (
          <AuthModal 
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            event={event}
            onComplete={(authData) => {
              const newUser = addUser({
                name: authData.contact.includes('@') ? authData.contact.split('@')[0] : '',
                phone: authData.contact.includes('@') ? '' : authData.contact,
                email: authData.contact.includes('@') ? authData.contact : '',
                selfieImage: authData.selfieData
              });
              
              setShowAuthModal(false);
              onAuthComplete?.(authData);
              
              // Force immediate re-render
              setForceUpdate(prev => prev + 1);
              
              // Dispatch custom event for other components
              window.dispatchEvent(new CustomEvent('userAdded', { detail: newUser }));
            }}
          />
        )} */}
      </>
    );
  }

  const otherUsers = users.filter(u => u.id !== currentUser.id);
  const hasMultipleUsers = otherUsers.length > 0;

  return (
    <>
      <div className={cn("relative", className)}>

        <Popover open={isOpen} onOpenChange={setIsOpen} >
          <PopoverTrigger asChild >

            <Button
              variant="ghost"
              size="sm"
              className="relative p-0 h-auto hover:opacity-80 transition-opacity duration-200"
            >
              <div className="relative">
                {/* Main user avatar */}
                <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                  <AvatarImage src={currentUser.photoUrl || currentUser?.selfieImage} alt={currentUser.name || 'User'} />
                  <AvatarFallback>
                    <UserCircle className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>

                {/* Stacked avatars for other users */}
                {hasMultipleUsers && (
                  <div className="absolute -right-1 -top-1">
                    <Avatar className="h-5 w-5 border-2 border-background shadow-sm">
                      <AvatarImage
                        src={otherUsers[0]?.photoUrl || otherUsers[0]?.selfieImage}
                        alt={otherUsers[0]?.name || 'User'}
                      />
                      <AvatarFallback className="text-xs">
                        <UserCircle className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>

                    {/* Additional users indicator */}
                    {/* {otherUsers.length > 1 && (
                      <div className="absolute -right-1 -bottom-1 h-3 w-3 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                        +{otherUsers.length - 1}
                      </div>
                    )} */}
                  </div>
                )}
              </div>
            </Button>

          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-2" dir={language === 'he' ? 'rtl' : 'ltr'}>

            <div className="space-y-2">
              {isMobile && totalImages > 0 && totalImages < 600 && (
                <>
                  <Button
                    variant="ghost"
                    className="w-full h-auto p-2 justify-start hover:bg-muted/50"
                    onClick={() => {
                      onDownloadAll();
                      setIsOpen(false);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      {language === 'he' ? 'הורד הכל' : 'Download All'}
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full h-auto p-2 justify-start hover:bg-muted/50"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('toggleSelectionMode'));
                      setIsOpen(false);
                    }}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      {language === 'he' ? 'בחר תמונות' : 'Select Images'}
                    </span>
                  </Button>
                </>
              )}

              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSupportOpen(true)}
                  className="rounded-full px-2 py-2"
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  <span>{language === 'he' ? 'תמיכה' : 'Support'}</span>
                </Button>
              )}

              {/* Current User */}
              {galletyCustomerType !== 'kimama' && (
                <>
                  <div className="px-2 py-2 bg-muted/50 rounded-md">
                    <p className="text-xs text-muted-foreground mb-1">
                      {language === 'he' ? 'משתמש מוצג' : 'Active User'}
                    </p>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={currentUser.photoUrl || currentUser.selfieImage} alt={currentUser.name == 'Anonymous' ? 'User' : currentUser.name || 'User'} />
                        <AvatarFallback>
                          <UserCircle className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">
                        {currentUser.name == 'Anonymous' ? 'User' : currentUser.name || (language === 'he' ? 'משתמש' : 'User')}
                      </span>
                    </div>
                  </div>

                  {/* Other Users */}
                  {otherUsers.length > 0 && (
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      <p className="text-xs text-muted-foreground px-2 ">
                        {language === 'he' ? 'החלף משתמש' : 'Switch User'}
                      </p>
                      {otherUsers.map((user) => (
                        <Button
                          key={user.id}
                          variant="ghost"
                          className="w-full h-auto p-2 justify-start hover:bg-muted/50"
                          onClick={() => {
                            switchUser(user.id);
                            setIsOpen(false);
                            // Trigger user photos reload
                          }}
                        >
                          <Avatar className="w-5 h-5 mr-2">
                            <AvatarImage src={user.photoUrl || user.selfieImage} alt={user.name || 'User'} />
                            <AvatarFallback>
                              <UserCircle className="w-3 h-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate ">
                            {user.name == 'Anonymous' ? 'User' : user.name || (language === 'he' ? 'משתמש' : 'User')}
                          </span>
                        </Button>
                      ))}
                    </div>
                  )}
                </>
              )}
              {/* Add User - only if less than 3 users */}
              {users.length < 50 && (
                <Button
                  variant="ghost"
                  className="w-full h-auto p-2 justify-start hover:bg-muted/50"
                  onClick={() => {
                    setShowAddUser(true);
                    setIsOpen(false);
                  }}
                >
                  <div className="w-5 h-5 mr-2 rounded-full bg-muted flex items-center justify-center">
                    <Plus className="w-3 h-3" />
                  </div>
                  <span className="text-sm">
                    {language === 'he' ? 'הוסף משתמש' : 'Add User'}
                  </span>
                </Button>
              )}

              {/* Logout */}
              <Button
                variant="ghost"
                className="w-full h-auto p-2 justify-start hover:bg-destructive/10 text-destructive hover:text-destructive"
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  {language === 'he' ? 'התנתק' : 'Logout'}
                </span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <FAQSupportDialog
        isOpen={isSupportOpen}
        setIsOpen={setIsSupportOpen}
        questions={questions}
        event={event}
      />

      <AddUserModal
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        event={event}
      />
    </>
  );
};
