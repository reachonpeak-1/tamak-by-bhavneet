import Topbar from "@/components/Topbar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Tabbar from "@/components/Tabbar";
import MobileMenu from "@/components/MobileMenu";
import WhatsAppButton from "@/components/WhatsAppButton";
import RevealObserver from "@/components/RevealObserver";
import SaleBanner from "@/components/SaleBanner";
import { getContent } from "@/lib/data/content";
import { listCategories } from "@/lib/data/categories";

// Storefront chrome, fed by the CMS. The /admin route group has its own
// chrome-free layout. Global providers live in the root layout.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [ann, nav, footer, categories] = await Promise.all([
    getContent("announcements"),
    getContent("navigation"),
    getContent("footer"),
    listCategories(),
  ]);

  return (
    <>
      <SaleBanner banner={ann.banner} />
      <Topbar messages={ann.topbar} />
      <Header nav={nav.primary} categories={categories} />
      {children}
      <Footer data={footer} />
      <MobileMenu groups={nav.mobileGroups} categories={categories} />
      <Tabbar />
      <WhatsAppButton />
      <RevealObserver />
    </>
  );
}
