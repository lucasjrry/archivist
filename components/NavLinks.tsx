"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLinks() {
  const pathname = usePathname();

  const links = [
    { href: '/profile', label: 'Profile' },
    { href: '/closet', label: 'Closet' },
    { href: '/wishlist', label: 'Wishlist' },
  ];

  return (
    <div className="flex gap-8 items-center ml-12">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-[10px] uppercase tracking-[0.2em] transition-all relative pb-1 border-b ${
              isActive 
                ? 'text-black border-black font-bold' 
                : 'text-gray-400 hover:text-black border-transparent font-medium'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
