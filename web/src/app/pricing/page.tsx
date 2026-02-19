import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import PricingContent from "@/components/PricingContent";

export const metadata = {
  title: "Easy Step ERP Qiymətlər - 1/3/6/12 Aylıq Paketlər",
  description:
    "Aylıq əlçatan paketlərlə peşəkar idarəetmə. Planını seç, ödəniş et və proqramı yüklə. Kiçik və orta biznes üçün sərfəli ERP.",
};

export default function Pricing() {
  return (
    <div className="min-h-screen">
      <PublicHeader active="pricing" />
      <PricingContent />
      <PublicFooter />
    </div>
  );
}
