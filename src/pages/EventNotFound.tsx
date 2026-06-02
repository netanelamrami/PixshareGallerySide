import { Search, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiService } from "@/data/services/apiService";

export const EventNotFound = () => {
  const { eventLink } = useParams();
  const navigate = useNavigate();
  const [isRetrying, setIsRetrying] = useState(false);

  // Auto-retry on page refresh
  useEffect(() => {
    const attemptRetry = async () => {
      if (!eventLink) return;
      
      // Check if this is a page refresh (not initial navigation)
      const isPageRefresh = performance.navigation.type === 1;
      
      if (isPageRefresh) {
        setIsRetrying(true);
        try {
          const eventData = await apiService.getEvent(eventLink);
          if (eventData && !eventData.isDeleted && eventData.isActive) {
            // Event found! Navigate back to it
            navigate(`/${eventLink}`, { replace: true });
            return;
          }
        } catch (error) {
        }
        setIsRetrying(false);
      }
    };

    attemptRetry();
  }, [eventLink, navigate]);

  const handleRetry = async () => {
    if (!eventLink) return;
    
    setIsRetrying(true);
    try {
      const eventData = await apiService.getEvent(eventLink);
      if (eventData && !eventData.isDeleted && eventData.isActive) {
        navigate(`/${eventLink}`, { replace: true });
        return;
      }
    } catch (error) {
    }
    setIsRetrying(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-sm w-full bg-card border">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gallery-primary rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            אירוע לא נמצא
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground text-sm">
            האירוע שחיפשת לא קיים במערכת
          </p>
          
          <Button 
            onClick={handleRetry} 
            disabled={isRetrying}
            className="w-full"
            variant="default"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                בודק...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                נסה שוב
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};