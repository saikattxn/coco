import { ActionBar } from "@/components/site/action-bar";
import { ConsentManager } from "@/components/site/consent";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <ActionBar />
      <ConsentManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
    </>
  );
}
