import { redirect } from "next/navigation";

export const metadata = {
  title: "Daxil ol | Easy Step ERP",
  description: "Easy Step ERP hesabınıza daxil olun.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const redirectTo = searchParams.redirect
    ? `/?auth=login&redirect=${encodeURIComponent(searchParams.redirect)}`
    : "/?auth=login";
  redirect(redirectTo);
}
