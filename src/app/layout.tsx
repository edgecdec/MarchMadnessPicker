import type { Metadata } from "next";
import ThemeRegistry from "@/components/common/ThemeRegistry";
import { AuthProvider } from "@/hooks/useAuth";
import "./globals.css";

export const metadata: Metadata = { title: "March Madness Picker" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <AuthProvider>
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1 }}>{children}</div>
              <footer style={{ textAlign: "center", padding: "24px 0", color: "inherit", opacity: 0.5, fontSize: "0.75rem" }}>
                Made by Declan Edgecombe
              </footer>
            </div>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
