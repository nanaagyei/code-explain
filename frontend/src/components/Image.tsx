import { forwardRef, type ImgHTMLAttributes } from 'react';

export type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

export const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  { src, alt, width, height, className, style, ...props },
  ref
) {
  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      {...props}
    />
  );
});
