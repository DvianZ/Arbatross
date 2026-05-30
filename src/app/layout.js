import "./globals.css";
import { MissionProvider } from "../context/MissionContext";

export const metadata = {
  title: "ARBATROSS — ArbaLabs Mission Control",
  description: "NASA-inspired mission control dashboard for ArbaLabs orbital demonstration mission. Real-time orbital visualization, mission countdown, and telemetry monitoring for the September 2026 satellite launch.",
  openGraph: {
    title: "ARBATROSS — ArbaLabs Mission Control",
    description: "Edge AI verification payload orbital mission dashboard",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#070A0F" />
        <meta name="color-scheme" content="dark" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <MissionProvider>
          {children}
        </MissionProvider>
      </body>
    </html>
  );
}
