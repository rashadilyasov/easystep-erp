import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import ContactForm from "@/components/ContactForm";

export const metadata = {
  title: "Demo və Əlaqə — Easy Step ERP",
  description:
    "Easy Step ERP haqqında sualınız var? Demo istəyin və biznesiniz üçün uyğun həll alın.",
};

export default function Contact() {
  return (
    <div className="min-h-screen">
      <PublicHeader active="contact" />

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Əlaqə</h1>
          <p className="text-xl text-slate-600 mb-8">
            Demo təqdimatı və ya Easy Step ERP haqqında suallarınız üçün bizimlə əlaqə saxlayın.
          </p>
          <ContactForm />
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
