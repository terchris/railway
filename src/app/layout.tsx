import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "@digdir/designsystemet-css/index.css";
import "rk-design-tokens/design-tokens-build/theme.css";
import "./globals.css";

const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Frivilligregistrering · Oslo Røde Kors",
  description: "Registrer deg som frivillig hos Oslo Røde Kors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="no"
      data-color-scheme="light"
      data-typography="primary"
      className="h-full antialiased"
    >
      <body className={`${sourceSans3.className} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
