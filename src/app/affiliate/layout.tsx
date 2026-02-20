import AffiliateLayout from "@/components/AffiliateLayout";
import AffiliateGuard from "@/components/AffiliateGuard";

export default function AffiliateRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AffiliateGuard>
      <AffiliateLayout>{children}</AffiliateLayout>
    </AffiliateGuard>
  );
}
