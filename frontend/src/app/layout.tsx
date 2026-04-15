import type { Metadata } from "next";
import "./globals.css";
import "quill/dist/quill.snow.css";
import { AuthProvider } from "../contexts/AuthContext";
import { SidebarProvider } from "../contexts/SidebarContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Employee Management System",
  description: "Login and dashboard for employee management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <SidebarProvider>
            {children}
            <Toaster position="top-center" />
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
