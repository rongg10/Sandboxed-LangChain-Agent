import "./globals.css";
import { Newsreader, Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata = {
  title: "Agent Chat",
  description: "Minimal chat UI for a sandboxed agent.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${newsreader.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
