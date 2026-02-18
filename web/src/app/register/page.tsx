import { redirect } from "next/navigation";

export const metadata = {
  title: "Qeydiyyat | Easy Step ERP",
  description: "Təchizatçı şirkəti kimi Easy Step ERP-ə qeydiyyat olun.",
};

export default function RegisterPage() {
  redirect("/?auth=register");
}
