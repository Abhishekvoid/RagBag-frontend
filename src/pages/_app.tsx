import '../app/global.css'  // Import your existing CSS
import type { AppProps } from 'next/app'
import { Manrope, JetBrains_Mono } from "next/font/google"
import localFont from "next/font/local"
import { ThemeProvider } from "@/components/theme-provider"

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] })
const cabinetGrotesk = localFont({
  src: "../../public/font/CabinetGrotesk_Complete/Fonts/WEB/fonts/CabinetGrotesk-Variable.woff2",
  variable: "--font-display",
  weight: "100 900",
  display: "swap",
})
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] })

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className={`${manrope.variable} ${cabinetGrotesk.variable} ${jetbrainsMono.variable} font-sans`}>
        <Component {...pageProps} />
      </div>
    </ThemeProvider>
  )
}
