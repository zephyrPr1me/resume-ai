import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Оптимизация шрифтов - загружаем только используемый
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin", "latin-ext"], // Plus Jakarta Sans поддерживает latin и latin-ext для расширенной поддержки
  display: "swap",
  weight: ["400", "500", "600", "700"], // Указываем только нужные веса
  preload: true,
  fallback: ["system-ui", "arial"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9F6" },
    { media: "(prefers-color-scheme: dark)", color: "#050A09" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),

  title: {
    default: "Resume AI — Умный анализ резюме с помощью искусственного интеллекта",
    template: "%s | Resume AI",
  },

  description: "Анализируйте, улучшайте и оптимизируйте свои резюме с помощью AI. Получите персональные рекомендации, проверьте соответствие вакансиям и увеличьте шансы на трудоустройство.",

  keywords: [
    "анализ резюме",
    "AI резюме",
    "оптимизация резюме",
    "проверка резюме",
    "сопоставление с вакансией",
    "ATS проверка",
    "улучшение резюме",
    "карьерный коуч",
    "resume analysis",
    "AI resume",
  ],

  authors: [
    { name: "Resume AI Team", url: "https://resume-ai.com" },
  ],

  creator: "Resume AI",
  publisher: "Resume AI",

  applicationName: "Resume AI",

  referrer: "origin-when-cross-origin",

  classification: "Business",

  category: "Technology",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: "/",
    languages: {
      "ru-RU": "/ru",
      "en-US": "/en",
    },
  },

  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "/",
    siteName: "Resume AI",
    title: "Resume AI — Умный анализ резюме с помощью AI",
    description: "Анализируйте, улучшайте и оптимизируйте свои резюме с помощью искусственного интеллекта",

    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Resume AI - Анализ резюме с помощью AI",
      },
      {
        url: "/og-image-square.png",
        width: 600,
        height: 600,
        alt: "Resume AI",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@resume_ai",
    creator: "@resume_ai",
    title: "Resume AI — Умный анализ резюме",
    description: "Анализируйте и улучшайте резюме с помощью AI",
    images: ["/twitter-image.png"],
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Resume AI",
  },

  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#E879F9",
      },
    ],
  },

  manifest: "/site.webmanifest",

  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },

  other: {
    "msapplication-TileColor": "#050A09",
    "msapplication-config": "/browserconfig.xml",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${plusJakarta.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Anti-flicker script для темной темы */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                  if (theme === 'dark' || (!theme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />

        {/* Preconnect для внешних ресурсов */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS Prefetch для API */}
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL} />

        {/* Structured Data (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Resume AI",
              "description": "Анализируйте, улучшайте и оптимизируйте свои резюме с помощью AI",
              "url": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "Resume AI Team"
              }
            }),
          }}
        />
      </head>

      <body
        className={`${plusJakarta.className} antialiased bg-background text-foreground flex flex-col min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            {/* Skip Navigation Link для Accessibility */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
            >
              Перейти к основному содержимому
            </a>

            <main id="main-content" tabIndex={-1} className="flex-1 w-full overflow-auto">
              {children}
            </main>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
