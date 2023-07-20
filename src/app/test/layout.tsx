import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'react-calendar test',
  description: 'react-calendar test',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>{children}</>
  );
}
