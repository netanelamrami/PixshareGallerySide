import { useState, useEffect } from 'react';
import { apiService } from '@/data/services/apiService';
import { Album, GalleryImage } from '@/types/gallery';

export const useAlbums = (eventId: string, images: GalleryImage[]) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumImages, setAlbumImages] = useState<Record<string, GalleryImage[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstAlbum, setFirstAlbum] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchAlbums = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const albumsData = await apiService.getEventAlbums(eventId);
        
        // המרת נתוני האלבומים לפורמט שלנו
        const processedAlbums: Album[] = albumsData.map((album: any) => ({
          id: album.id,
          name: album.name || album.albumName || `אלבום ${album.id}`,
          imageCount: 0, // נעדכן אחר כך
          thumbnail: undefined // נעדכן אחר כך
        }));

        setAlbums(processedAlbums);
      } catch (err) {
        setError('שגיאה בטעינת אלבומים');
        console.error('Error fetching albums:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbums();
  }, [eventId]);

  useEffect(() => {
    if (!albums.length || !images.length) return;

    const imagesByAlbum: Record<string, GalleryImage[]> = {};
    
    albums.forEach(album => {
      imagesByAlbum[album.id] = [];
    });

    // הוספת תמונות לאלבומים המתאימים
    images.forEach(image => {
      if (image.albumId && imagesByAlbum[image.albumId]) {
        imagesByAlbum[image.albumId].push(image);
      }
    });

    // עדכון מספר תמונות ותמונה ראשונה לכל אלבום
    const updatedAlbums = albums.map(album => ({
      ...album,
      imageCount: imagesByAlbum[album.id]?.length || 0,
      thumbnail: imagesByAlbum[album.id]?.[0]?.src
    }));
    setFirstAlbum(updatedAlbums.find(album => album.imageCount > 0)?.id || null);
    setAlbums(updatedAlbums);
    setAlbumImages(imagesByAlbum);
  }, [albums.length, images]);

  const getImagesByAlbum = (albumId: string): GalleryImage[] => {
    return albumImages[albumId] || [];
  };

  const getAlbumById = (albumId: string): Album | undefined => {
    return albums.find(album => album.id === albumId);
  };


  return {
    albums,
    albumImages,
    isLoading,
    error,
    getImagesByAlbum,
    getAlbumById,
    firstAlbum
  };
};