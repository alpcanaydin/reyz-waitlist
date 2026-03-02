import type { Metadata } from 'next';

import { Google_Sans, Google_Sans_Flex } from 'next/font/google';

import './globals.css';

const googleSans = Google_Sans({
  variable: '--font-google-sans',
  subsets: ['latin'],
});

const googleSansFlex = Google_Sans_Flex({
  variable: '--font-google-sans-flex',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://reyz.ai'),
  title: 'Reyz.ai',
  description:
    'Reyz turns AI from a tool you prompt into a team you collaborate with assigning roles, equipping tools, and working together in shared channels.',
  openGraph: {
    images: ['https://reyz.ai/social-media.png'],
    type: 'website',
    siteName: 'Reyz.ai',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${googleSans.variable} ${googleSansFlex.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
