import React from "react";
import { GalleryImage } from "@/types/gallery";
import { MasonryColumn } from "./MasonryColumn";
import { event } from "@/types/event";
import { Album } from "@/types/gallery";
import { AlbumDivider } from "./AlbumDivider";

interface MasonryGridProps {
  images: GalleryImage[];
  event?: event;
  onImageClick: (image: GalleryImage, index: number) => void;
  columns: number;
  isSelectionMode?: boolean;
  selectedImages?: Set<string>;
  onImageSelection?: (imageId: string) => void;
  favoriteImages?: Set<string>;
  onToggleFavorite?: (imageId: string) => void;
  onImageDropdownClick?: (imageId: string, position: { x: number; y: number }) => void;
  onShare?: (imageId: string) => void;
  showAlbumDividers?: boolean;
  albums?: Album[];
}

export const MasonryGrid = ({
  images,
  event,
  onImageClick,
  columns,
  isSelectionMode = false,
  selectedImages = new Set(),
  onImageSelection,
  favoriteImages = new Set(),
  onToggleFavorite,
  onImageDropdownClick,
  onShare,
  showAlbumDividers = false,
  albums = []
}: MasonryGridProps) => {
  const distributeImagesBalanced = (images: GalleryImage[], numColumns: number) => {
    const columnArrays = Array.from({ length: numColumns }, () => [] as GalleryImage[]);
    const columnHeights = Array.from({ length: numColumns }, () => 0);
    images.forEach((image) => {

      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      columnArrays[shortestColumnIndex].push(image);
      columnHeights[shortestColumnIndex] += (image.photoHeight || 0) + 4;
    });
    return columnArrays;
  };
  // Group images by album if showAlbumDividers is true
  if (showAlbumDividers && albums.length > 0) {
    const imagesByAlbum = new Map<string, GalleryImage[]>();
    const albumOrder: string[] = [];
    
    // Group images by their albumId - only the currently loaded images
    images.forEach((image) => {
      const albumId = image.albumId?.toString() || 'unknown';
      if (!imagesByAlbum.has(albumId)) {
        imagesByAlbum.set(albumId, []);
        albumOrder.push(albumId);
      }
      imagesByAlbum.get(albumId)!.push(image);
    });

    // Track cumulative loaded images to determine if we should show dividers
    let cumulativeLoadedImages = 0;
    
    return (
      <div className="w-full">
        {albumOrder.map((albumId, index) => {
          const albumImages = imagesByAlbum.get(albumId) || [];
          const album = albums.find(a => a.id.toString() === albumId);
          
          if (albumImages.length === 0) return null;
          
          // Check if this is the last album being loaded (partial load)
          const loadedImagesBeforeThisAlbum = cumulativeLoadedImages;
          cumulativeLoadedImages += albumImages.length;
          const isLastLoadedAlbum = index === albumOrder.length - 1;
          
          // Get total images in this album from the albums prop
          const totalImagesInAlbum = album?.imageCount || albumImages.length;
          const allAlbumImagesLoaded = albumImages.length >= totalImagesInAlbum;
          
          // Show divider only if:
          // 1. It's not the first album (index > 0)
          // 2. AND either:
          //    a. All images from the previous album are loaded (we're done with it)
          //    b. OR this is not the last album being loaded (meaning we've moved past it)
          const shouldShowDivider = index > 0 && album;
          const albumColumns = distributeImagesBalanced(albumImages, columns);
          
          return (
            <div key={albumId}>
              {/* Show divider before each album except the first one */}
              {shouldShowDivider && (
                <AlbumDivider
                  albumId={albumId}
                  albumName={album.name}
                  imageCount={totalImagesInAlbum}
                />
              )}
              
              <div
                className="grid gap-0.5"
                style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
              >
                {albumColumns.map((columnImages, colIndex) => (
                  <MasonryColumn
                    key={`${albumId}-col-${colIndex}`}
                    images={columnImages}
                    event={event}
                    onImageClick={onImageClick}
                    allImages={albumImages}
                    isSelectionMode={isSelectionMode}
                    selectedImages={selectedImages}
                    onImageSelection={onImageSelection}
                    favoriteImages={favoriteImages}
                    onToggleFavorite={onToggleFavorite}
                    onImageDropdownClick={onImageDropdownClick}
                    onShare={onShare}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Default behavior without album dividers
  const columnArrays = distributeImagesBalanced(images, columns);

  return (
    <div
      className="grid gap-0.5"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {columnArrays.map((columnImages, columnIndex) => (
        <MasonryColumn
          key={columnIndex}
          images={columnImages}
          event={event}
          onImageClick={onImageClick}
          allImages={images}
          isSelectionMode={isSelectionMode}
          selectedImages={selectedImages}
          onImageSelection={onImageSelection}
          favoriteImages={favoriteImages}
          onToggleFavorite={onToggleFavorite}
          onImageDropdownClick={onImageDropdownClick}
          onShare={onShare}
        />
      ))}
    </div>
  );
};