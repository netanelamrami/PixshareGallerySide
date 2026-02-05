import { Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/hooks/useLanguage";
import Index from "./pages/Index";
import KimamaIndex from "./pages/KimamaIndex";
import NotFound from "./pages/NotFound";
import { EventNotFound } from "./pages/EventNotFound";
import { EventInactive } from "./pages/EventInactive";
import { ImageSave } from "./pages/ImageSave";

const App = () => (
  <LanguageProvider>
    <Routes>
      <Route path="/event-not-found/:eventLink?" element={<EventNotFound />} />
      <Route path="/event-inactive/:eventLink?" element={<EventInactive />} />
      <Route path="/image-save" element={<ImageSave />} />
      <Route path="/:eventLink?" element={<Index />} />
        <Route path="/:eventLink" element={<Index isKimama={false} />} />
        
        {/* Kimama */}
        <Route path="/kimama/:eventLink" element={<Index isKimama={true} />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </LanguageProvider>
);

export default App;
