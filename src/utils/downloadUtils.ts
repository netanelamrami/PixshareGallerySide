
import JSZip from "jszip";
import { saveAs } from "file-saver";

// Download utility functions
export const downloadImage = async (src: string, filename: string) => {
  try {
    const response = await fetch(src, { mode: 'cors' });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error downloading image:', error);
    return false;
  }
};

export const downloadMultipleImages = async (
  images: Array<{ src: string; id: string, name: string }>,
  fileName: string = "images.zip"
) => {
  const zip = new JSZip();

  await Promise.all(
    images.map(async (image, index) => {
      await new Promise((resolve) => setTimeout(resolve, index * 200));
      const response = await fetch(image.src);
      const blob = await response.blob();
      zip.file(image.id, blob);
    })
  );

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, fileName);
  return true;
};

export const getDownloadFormData = () => {
  const saved = localStorage.getItem('downloadFormData');
  return saved ? JSON.parse(saved) : null;
};

export const saveDownloadFormData = (data: any) => {
  localStorage.setItem('downloadFormData', JSON.stringify(data));
};