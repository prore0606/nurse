import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense><Sidebar /></Suspense>
      <main className="ml-64 min-h-screen p-6 max-w-[1600px]">
        {children}
      </main>
      <Toaster position="top-right" />
    </>
  );
}
