import { logout } from '@/app/login/actions';
import NavLinks from '@/components/NavLinks';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-8 py-4 flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="flex items-center">
          <span className="brand-logo text-xl text-black">Archivist</span>
          <NavLinks />
        </div>
        <form action={logout}>
          <button className="text-[10px] text-gray-400 hover:text-black uppercase tracking-[0.2em] cursor-pointer">Logout</button>
        </form>
      </nav>
      {/* This 'children' is where the Closet page will be injected */}
      {children}
    </div>
  );
}