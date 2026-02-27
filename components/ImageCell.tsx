interface ImageCellProps {
  imageUrl?: string;
  imageSrc?: string;
  alt?: string;
  style?: React.CSSProperties;
}

export default function ImageCell({
  imageUrl,
  imageSrc,
  alt = "Cell content",
  style,
}: ImageCellProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl || imageSrc || "/placeholder-image.png"}
      alt={alt}
      style={style}
    />
  );
}
