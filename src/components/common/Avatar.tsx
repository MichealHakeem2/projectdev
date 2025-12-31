import Image from 'next/image';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-24 w-24',
  };

  const pixelSizeMap = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 96,
  };

  // Check if src is a valid URL
  const isValidUrl = src && (src.startsWith('http') || src.startsWith('/'));

  return (
    <div
      className={`relative flex shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 ${sizeMap[size]} ${className}`}
    >
      {src && isValidUrl ? (
        <Image
          src={src}
          alt={alt}
          width={pixelSizeMap[size]}
          height={pixelSizeMap[size]}
          className="aspect-square h-full w-full object-cover"
          unoptimized={src.includes('ui-avatars.com')} // ui-avatars doesn't need optimization
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white font-semibold uppercase">
          {alt.substring(0, 2)}
        </div>
      )}
    </div>
  );
};

export default Avatar;
