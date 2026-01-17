import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Kitchen Log",
  description: "레시피 버전 관리 및 스마트 재고 관리",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body className={`${inter.className} bg-black text-zinc-100`}>
        <div className="flex min-h-screen flex-col md:flex-row">
          <Sidebar />
          <main className="flex-1 w-full p-4 pb-20 md:ml-64 md:p-8 md:pb-8">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}