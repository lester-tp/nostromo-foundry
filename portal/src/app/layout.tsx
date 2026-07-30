import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nostromo Foundry — Portal de contribuidores",
  description: "Sube tus episodios de demostración para Nostromo Labs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="h-1.5 bg-amber" />
        <header className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-3">
          <span className="relative inline-block w-7 h-7 rounded-full border-[3px] border-amber">
            <span className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-amber" />
          </span>
          <span className="font-bold tracking-[0.25em] text-sm">NOSTROMO LABS</span>
          <span className="ml-auto font-mono text-xs text-fog">FOUNDRY · CONTRIBUIDORES</span>
        </header>
        <main className="max-w-3xl mx-auto px-4 pb-16">{children}</main>
      </body>
    </html>
  );
}
