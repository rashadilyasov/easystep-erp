"use client";

import Link from "next/link";
import Image from "next/image";

type LogoProps = {
  href?: string;
  className?: string;
  width?: number;
  height?: number;
};

export default function Logo({ href = "/", className = "", width = 140, height = 40 }: LogoProps) {
  const img = (
    <Image
      src="/logo.png"
      alt="Easy Step ERP"
      width={width}
      height={height}
      priority
      className={className || "h-8 sm:h-9 w-auto object-contain object-left max-w-[120px] sm:max-w-none"}
    />
  );

  return href ? (
    <Link href={href} className="flex items-center">
      {img}
    </Link>
  ) : (
    <span className="flex items-center">{img}</span>
  );
}
