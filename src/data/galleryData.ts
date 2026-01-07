import { GalleryImage } from "@/types/gallery";
import { apiService } from "../data/services/apiService";

export const generateGalleryImages = async (eventLink: string, count: number = 2000): Promise<GalleryImage[]> => {
  const data = await apiService.getEventImagesFullData(eventLink);
  // נניח ש-data.images הוא מערך של אובייקטים עם {id, url, width, height}
  const imagesFromServer = data || [];

  const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

  return Array.from({ length: Math.min(count, imagesFromServer.length) }, (_, index) => {
    const imageData = imagesFromServer[index];
    const size = sizes[Math.floor(Math.random() * sizes.length)];

    // חישוב גודל תצוגה
    let displayWidth: number;
    let displayHeight: number;
    const aspectRatio = imageData.width / imageData.height;

    switch (size) {
      case 'small':
        displayWidth = 300;
        break;
      case 'medium':
        displayWidth = 400;
        break;
      case 'large':
        displayWidth = 500;
        break;
    }
    // eslint-disable-next-line prefer-const
    displayHeight = Math.round(displayWidth / aspectRatio);

    return {
      id: `${imageData.name}`,
      name: imageData.name || `image-${index + 1}`,
      src: imageData.smallUrl,
      mediumSrc: imageData.mediumUrl || imageData.smallUrl,
      largeSrc: imageData.largeUrl || imageData.smallUrl,
      alt: `Gallery image ${index + 1}`,
      size,
      width: displayWidth,
      height: 400,
    };
  });
};

// הוסר top-level await - נשתמש בפונקציה async במקום