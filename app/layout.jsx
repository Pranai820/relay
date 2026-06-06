import "./styles.css";
import Providers from "./providers";

export const metadata = {
  title: "Relay",
  description: "Actions, AI, and reports across GitHub, Notion, Gmail, and Calendar.",
  icons: { icon: "/relay-logo.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
