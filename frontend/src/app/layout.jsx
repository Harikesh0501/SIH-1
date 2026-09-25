import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { AppLayoutShell } from "../components/layout/AppLayoutShell";

export const metadata = {
  title: "RAKSHAK-AAYUSH | Personnel Stress & Welfare Monitoring System",
  description: "AI-Based Predictive Personnel Stress and Welfare Monitoring System for Uniformed Forces (MHA / CAPF)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        <AuthProvider>
          <AppLayoutShell>
            {children}
          </AppLayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
