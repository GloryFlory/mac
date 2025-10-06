import './globals.css';

export const metadata = {
  title: 'MAC 2025 Schedule',
  description: 'Montreal Acrobatics Convention 2025 - Workshop Schedule & Booking',
  icons: {
    icon: '/mac-logo.png',
    apple: '/mac-logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/mac-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/mac-logo.png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}