
"use client";
import './global.css'

import { Manrope, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

import { ThemeProvider } from "@/components/theme-provider";

import { SessionProvider } from "next-auth/react";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const cabinetGrotesk = localFont({
  src: "../../public/font/CabinetGrotesk_Complete/Fonts/WEB/fonts/CabinetGrotesk-Variable.woff2",
  variable: "--font-display",
  weight: "100 900",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${cabinetGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}