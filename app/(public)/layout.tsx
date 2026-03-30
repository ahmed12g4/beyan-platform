import "../globals.css";
import PublicClientLayout from "../components/PublicClientLayout";
import Footer from "../components/Footer";



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div style={{ fontFamily: "var(--font-inter)" }} className="min-h-screen flex flex-col font-sans" suppressHydrationWarning>
      <PublicClientLayout>
        {children}
      </PublicClientLayout>
      <Footer />
    </div>
  );
}
