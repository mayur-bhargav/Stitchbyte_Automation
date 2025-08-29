import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./components/ClientLayout";
import QuickActions from "./components/QuickActions";
import { UserProvider } from "./contexts/UserContext";
import { ThemeProvider } from "./contexts/ThemeContext";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply saved theme before hydration to avoid flashing and ensure toggle works */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var d = document.documentElement;
                  var t = localStorage.getItem('theme');
                  
                  function applyTheme(theme){
                    if (theme === 'dark') {
                      d.classList.add('dark');
                      d.style.colorScheme = 'dark';
                      localStorage.setItem('theme', 'dark');
                    } else {
                      d.classList.remove('dark');
                      d.style.colorScheme = 'light';
                      localStorage.setItem('theme', 'light');
                    }
                    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
                  }
                  
                  // Force light mode as default
                  if (t === 'dark') {
                    applyTheme('dark');
                  } else {
                    applyTheme('light');
                  }
                  
                  // Expose helpers globally
                  window.__applyTheme = applyTheme;
                  window.__toggleTheme = function(){
                    var current = d.classList.contains('dark') ? 'dark' : 'light';
                    applyTheme(current === 'dark' ? 'light' : 'dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 dark:bg-slate-900`}>
        <ThemeProvider>
          <UserProvider>
            <SubscriptionGuard>
              <ClientLayout>
                {children}
                <QuickActions />
              </ClientLayout>
            </SubscriptionGuard>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
