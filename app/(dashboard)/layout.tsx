export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-8 py-4 flex justify-between items-center bg-white sticky top-0 z-10">
        <span className="font-bold text-xl tracking-tighter uppercase text-black">Archivist</span>
        <form action="/auth/signout" method="post">
          <button className="text-[10px] text-gray-400 hover:text-black uppercase tracking-[0.2em]">Logout</button>
        </form>
      </nav>
      {/* This 'children' is where the Closet page will be injected */}
      {children}
    </div>
  );
}