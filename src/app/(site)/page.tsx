import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import CategoryRail from "@/components/CategoryRail";
import ProductRail from "@/components/ProductRail";
import Story from "@/components/Story";
import Testimonials from "@/components/Testimonials";
import PromiseStrip from "@/components/PromiseStrip";
import Visit from "@/components/Visit";
import Newsletter from "@/components/Newsletter";
import { getNewIn, getMostLoved } from "@/lib/data/products";
import { getContent } from "@/lib/data/content";
import { listCategories } from "@/lib/data/categories";

export default async function Home() {
  const [newIn, mostLoved, hero, ann, promise, testimonials, categoryRail, categories, story, storeInfo, newsletter] =
    await Promise.all([
      getNewIn(), getMostLoved(),
      getContent("hero"), getContent("announcements"), getContent("promise"),
      getContent("testimonials"), getContent("categoryRail"), listCategories(), getContent("story"), getContent("storeInfo"),
      getContent("newsletter"),
    ]);

  return (
    <main>
      <Hero slides={hero.slides} />
      <Marquee words={ann.marquee} />
      <CategoryRail data={categoryRail} cats={categories} />
      <ProductRail
        id="new"
        eyebrow="Fresh off the loom"
        title="New this season"
        desc="A small-batch drop — once it’s gone, the weave is retired."
        padTop0
        products={newIn}
      />
      <Story data={story} />
      <ProductRail
        id="loved"
        eyebrow="Bestsellers"
        title="Most loved"
        desc="The pieces our customers keep coming back for."
        padTop0
        products={mostLoved}
      />
      <Testimonials data={testimonials} />
      <PromiseStrip items={promise.items} />
      <Visit data={storeInfo} />
      <Newsletter data={newsletter} />
    </main>
  );
}
