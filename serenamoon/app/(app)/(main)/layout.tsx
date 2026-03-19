import React from 'react';
import Header from "@/components/layout/header";
import Footer from '@/components/layout/footer';
import { SubscriptionBoundary } from "@/components/subscription/subscription-boundary";

export default function Mainlayout({ children }: { children: React.ReactNode }) {
  return <>
  <Header />
  <SubscriptionBoundary>{children}</SubscriptionBoundary>
  <Footer />
  </>;
}