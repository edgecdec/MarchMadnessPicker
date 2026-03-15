import type { Metadata } from "next";
import ThemeRegistry from "@/components/common/ThemeRegistry";
import { AuthProvider } from "@/hooks/useAuth";

export const metadata: Metadata = { title: "March Madness Picker" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`.bracket-export, .bracket-export * { color: #222 !important; }`}</style>
      </head>
      <body>
        <ThemeRegistry>
          <AuthProvider>{children}</AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
