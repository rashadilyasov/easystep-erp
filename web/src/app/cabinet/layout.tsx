import CabinetLayout from "@/components/CabinetLayout";
import CabinetGuard from "@/components/CabinetGuard";

export default function CabinetRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CabinetGuard>
      <CabinetLayout>{children}</CabinetLayout>
    </CabinetGuard>
  );
}
