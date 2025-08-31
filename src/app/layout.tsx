import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./components/ClientLayout";
import QuickActions from "./components/QuickActions";
import { UserProvider } from "./contexts/UserContext";
import SubscriptionGuard from "./components/SubscriptionGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StitchByte - WhatsApp Business Automation",
  description: "Advanced WhatsApp Business Automation Platform with AI-powered features",
};

// In your src/app/layout.tsx file

// ... (imports and metadata are fine)

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const html = document.documentElement;
                  
                  if (theme === 'dark') {
                    html.classList.add('dark');
                  } else if (theme === 'light') {
                    html.classList.remove('dark');
                  } else {
                    // No theme set, use system preference
                    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (systemDark) {
                      html.classList.add('dark');
                      localStorage.setItem('theme', 'dark');
                    } else {
                      html.classList.remove('dark');
                      localStorage.setItem('theme', 'light');
                    }
                  }
                } catch (e) {
                  console.log('Theme initialization error:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <UserProvider>
          <SubscriptionGuard>
            <ClientLayout>
              {children}
              <QuickActions />
            </ClientLayout>
          </SubscriptionGuard>
        </UserProvider>
      </body>
    </html>
  );
}
