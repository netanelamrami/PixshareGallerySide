import React, { useState } from 'react';
import { useMultiUserAuth } from '@/contexts/AuthContext';
import { AddUserModal } from '@/components/users/AddUserModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { FAQSupportDialog } from '@/components/gallery/FAQSupportDialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Menu, 
  Share, 
  Images, 
  HelpCircle, 
  UserCircle, 
  Plus, 
  LogOut,
  User,
  Download,
  CheckSquare,
  Grid,
  LayoutGrid,
  Grid3x3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { faqData } from '@/data/faqData';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface BottomMenuProps {
  onViewAllPhotos?: () => void;
  onShareEvent?: () => void;
  onDownloadAll?: () => void;
  onToggleSelectionMode?: () => void;
  onColumnsChange?: (columns: number) => void;
  columns?: number;
  event?: any;
  onAuthComplete?: (userData: { contact: string; otp: string; selfieData: string; notifications: boolean }) => void;
  isSelectionMode?: boolean;
}

export const BottomMenu = ({ onViewAllPhotos, onShareEvent, onDownloadAll, onToggleSelectionMode, onColumnsChange, columns = 3, event, onAuthComplete, isSelectionMode = false }: BottomMenuProps) => {
  const { users, currentUser, isAuthenticated, switchUser, logout, addUser } = useMultiUserAuth();
  const { language } = useLanguage();
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFAQDialog, setShowFAQDialog] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Listen for user updates
  React.useEffect(() => {
    const handleUserAdded = () => {
      setForceUpdate(prev => prev + 1);
    };
    
    window.addEventListener('userAdded', handleUserAdded);
    return () => window.removeEventListener('userAdded', handleUserAdded);
  }, []);

  const handleShareEvent = () => {
    onShareEvent?.();
    setIsOpen(false);
  };

  const handleViewAllPhotos = () => {
    onViewAllPhotos?.();
    setIsOpen(false);
  };

  const handleSupport = () => {
    setShowFAQDialog(true);
    setIsOpen(false);
  };

  const handleDownloadAll = () => {
    onDownloadAll?.();
    setIsOpen(false);
  };

  const handleToggleSelectionMode = () => {
    onToggleSelectionMode?.();
    setIsOpen(false);
  };

  const columnOptions = [
    { value: 2, icon: Grid, label: language === 'he' ? 'עמודות 2' : '2 Columns' },
    { value: 3, icon: LayoutGrid, label: language === 'he' ? 'עמודות 3' : '3 Columns' },
    { value: 4, icon: Grid3x3, label: language === 'he' ? 'עמודות 4' : '4 Columns' },
  ];

  return (
    <>
      {/* Only show when not in selection mode */}
      {!isSelectionMode && (
        <div className="fixed bottom-6 left-6 z-50">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="h-14 w-14 rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 p-0 transition-all duration-300"
              >
                <Menu className="w-6 h-6 text-gray-700" />
              </Button>
            </PopoverTrigger>
            
            <PopoverContent 
              side="top" 
              align="start" 
              className="w-64 p-2 mb-2"
              sideOffset={8}
            >
            <div className="space-y-1">
              {/* Main Actions */}
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full h-auto p-3 justify-start hover:bg-gray-50"
                  onClick={handleShareEvent}
                >
                  <Share className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">
                    {language === 'he' ? 'שתף אירוע' : 'Share Event'}
                  </span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full h-auto p-3 justify-start hover:bg-gray-50"
                  onClick={handleViewAllPhotos}
                >
                  <Images className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">
                    {language === 'he' ? 'כל התמונות' : 'All Photos'}
                  </span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full h-auto p-3 justify-start hover:bg-gray-50"
                  onClick={handleDownloadAll}
                >
                  <Download className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">
                    {language === 'he' ? 'הורד הכל' : 'Download All'}
                  </span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full h-auto p-3 justify-start hover:bg-gray-50"
                  onClick={handleToggleSelectionMode}
                >
                  <CheckSquare className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">
                    {language === 'he' ? 'בחירת תמונות' : 'Select Images'}
                  </span>
                </Button>

                {/* Column Options */}
                <div className="border-t border-gray-100 pt-2 mt-2">
                  <p className="text-xs text-muted-foreground px-2 py-1">
                    {language === 'he' ? 'עמודות' : 'Columns'}
                  </p>
                  <div className="flex gap-1 px-2">
                    {columnOptions.map(({ value, icon: Icon, label }) => (
                      <Button
                        key={value}
                        variant={columns === value ? "default" : "ghost"}
                        size="sm"
                        onClick={() => {
                          onColumnsChange?.(value);
                          setIsOpen(false);
                        }}
                        className="flex-1 gap-1"
                        title={label}
                      >
                        <Icon className="h-3 w-3" />
                        <span className="text-xs">{value}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  className="w-full h-auto p-3 justify-start hover:bg-gray-50"
                  onClick={handleSupport}
                >
                  <HelpCircle className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">
                    {language === 'he' ? 'תמיכה' : 'Support'}
                  </span>
                </Button>
              </div>

            </div>
          </PopoverContent>
        </Popover>
      </div>
      )}

      <AddUserModal 
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
      />
      
      {event && (
        <>
          <AuthModal 
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            event={event}
            onComplete={(authData) => {
              // Add user to multi-user system
              const newUser = addUser({
                name: authData.contact.includes('@') ? authData.contact.split('@')[0] : '',
                phoneNumber: authData.contact.includes('@') ? '' : authData.contact,
                email: authData.contact.includes('@') ? authData.contact : '',
                selfieImage: authData.selfieData,
                eventId: event?.id || 0,
                faceId: ''
              });
              
              setShowAuthModal(false);
              onAuthComplete?.(authData);
              
              // Force immediate re-render
              setForceUpdate(prev => prev + 1);
              setIsOpen(false);
            }}
          />
          
          <FAQSupportDialog
            isOpen={showFAQDialog}
            setIsOpen={setShowFAQDialog}
            questions={faqData[language] || faqData.he}
            event={event}
          />
        </>
      )}
    </>
  );
};
