import Image from "next/image";

type KtgLogoProps = {
  size?: number;
  className?: string;
};

export function KtgLogo({ size = 64, className }: KtgLogoProps) {
  return (
    <Image
      src="/img/ktg/logo_ktg_2.png"
      alt="Logo KTG"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}