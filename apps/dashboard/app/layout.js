import "./globals.css";

export const metadata = {
  title: "Bobot Dashboard",
  description: "Personal assistant dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
