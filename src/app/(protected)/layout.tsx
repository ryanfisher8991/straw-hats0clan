import Sidebar from "@/components/Sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}
