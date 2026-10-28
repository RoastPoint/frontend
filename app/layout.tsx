import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Roast Point — кофе, который рядом",
  description:
    "Рабочее пространство кофейни: меню, заказы и очередь приготовления.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
