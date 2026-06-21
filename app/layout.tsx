import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Geist, Geist_Mono, Noto_Sans, JetBrains_Mono, Source_Code_Pro, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/ui/footer";
import { GridPattern } from "@/components/ui/grid-pattern";

const jetbrainsMonoHeading = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-heading",
});

const notoSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-source-code-pro",
});

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-ibm-plex-sans-thai",
});

export const metadata: Metadata = {
  title: "Chem Bonding",
  description: "ใส่รหัสนักศึกษาเพื่อดูคำใบ้",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-thai",
        notoSans.variable,
        jetbrainsMonoHeading.variable,
        sourceCodePro.variable,
        ibmPlexSansThai.variable,
      )}
      suppressHydrationWarning
    >
      <body className="scrollbar-hide">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false} 
          disableTransitionOnChange
        >

          <main className="relative min-h-dvh flex flex-col overflow-hidden">
            <GridPattern
                    width={30}
                    height={30}
                    x={0}
                    y={0}
                    className="stroke-muted-foreground/20"
                  />

            <div className="flex-1 w-full mx-auto max-w-3xl px-4 sm:px-6">
              <div className="flex flex-col py-6 sm:py-6">
                {children}
              </div>
            </div>

            <Footer />

          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
