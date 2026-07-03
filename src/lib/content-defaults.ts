// Default homepage / site content. Seeded into Firestore `content/{section}` by
// scripts/seed-content.mjs, and used as a fallback so the storefront renders
// even before seeding. Everything here is plain serializable data — SVG icons
// are referenced by key into src/lib/icon-registry.tsx, never stored.

export interface Link { label: string; href: string }
export interface HeroSlide {
  eyebrow: string; title: string; em: string; sub: string;
  image: string; pos: string; cta: Link[];
}

export const CONTENT_DEFAULTS = {
  hero: {
    slides: [
      {
        eyebrow: "Ethnic Wear · Made to Celebrate",
        title: "Rooted in tradition.", em: "Made to be yours.",
        sub: "Timeless ethnic wear crafted with heritage techniques and exquisite details — for every moment that matters.",
        image: "/hero/hero-ethnic-wide.jpg", pos: "center top",
        cta: [{ label: "Shop Ethnic Wear", href: "/shop" }, { label: "Explore New In", href: "/shop?sort=new" }],
      },
      {
        eyebrow: "Bridal · Made to Measure",
        title: "Woven for the", em: "day you’ll remember.",
        sub: "Lehengas and sarees in real zari and raw silk, cut to your measurements and embroidered entirely by hand.",
        image: "/hero/hero-blush-wide.jpg", pos: "center top",
        cta: [{ label: "The Bridal Edit", href: "/shop?occasion=Bridal" }, { label: "Book a Fitting", href: "/#visit" }],
      },
      {
        eyebrow: "New This Season",
        title: "Fresh off", em: "the loom.",
        sub: "A small-batch drop of organza, Chanderi and mul-cotton everyday luxe — once the weave is retired, it’s gone.",
        image: "/hero/hero-noir-wide.png", pos: "center top",
        cta: [{ label: "Shop New In", href: "/shop?sort=new" }, { label: "Browse All", href: "/shop" }],
      },
    ] as HeroSlide[],
  },

  announcements: {
    topbar: [
      "Enjoy 10% off your first order",
      "Complimentary shipping across India  ·  Handcrafted to order",
      "Worldwide delivery  ·  Insured express everywhere",
      "Made to measure  ·  Share sizes at checkout",
    ],
    marquee: [
      { hi: "परंपरा", en: "Tradition" },
      { hi: "हस्तकला", en: "Handcraft" },
      { hi: "विरासत", en: "Heritage" },
      { hi: "रेशम", en: "Pure Silk" },
      { hi: "शिल्प", en: "Artistry" },
    ],
    banner: { enabled: false, text: "Festive Edit is live — up to 20% off select pieces", href: "/shop?sort=new" },
  },

  trust: {
    items: [
      { title: "Free shipping in India", sub: "On every order", icon: "truck" },
      { title: "Cash on Delivery", sub: "Pay when it arrives", icon: "card" },
      { title: "Easy 7-day returns", sub: "Hassle-free", icon: "return" },
      { title: "Made to measure", sub: "Tailored to you", icon: "ruler" },
    ],
  },

  promise: {
    items: [
      { title: "Handwoven to order", body: "Made for you in 2–3 weeks — never warehoused, never wasted.", icon: "loom" },
      { title: "Made to measure", body: "Share your measurements at checkout for a true, flattering fit.", icon: "measure" },
      { title: "Delivered worldwide", body: "Free shipping across India, insured express delivery everywhere else.", icon: "globe" },
    ],
  },

  testimonials: {
    eyebrow: "Loved by 12,000+ customers",
    title: "In their words",
    sub: "Real notes from people who wear तमक on the days that matter.",
    reviews: [
      { quote: "The detailing on my lehenga was beyond anything I’d seen in store — and it arrived perfectly tailored to my measurements.", who: "Simran K.", city: "Chandigarh" },
      { quote: "Ordered a saree for my mother’s anniversary. The zari is the real thing — she hasn’t stopped talking about it.", who: "Aditi R.", city: "Mumbai" },
      { quote: "Bhavneet’s team took my measurements over a video call and the fit was flawless. Felt like proper old-world service.", who: "Navjot G.", city: "Bathinda" },
    ],
  },

  categoryRail: {
    eyebrow: "The Wardrobe",
    title: "Shop by category",
    cats: [
      { deva: "सूट", name: "Suits", cnt: "Anarkali · Straight · Sharara", panel: "p-maroon", tone: "m-gold", motif: "paisley", q: "Suits", image: "/categories/suits-maroon.webp", pos: "35% top" },
      { deva: "साड़ी", name: "Sarees", cnt: "Banarasi · Organza · Silk", panel: "p-teal", tone: "m-gold", motif: "mandala", q: "Sarees", image: "/categories/sarees-emerald.webp", pos: "center top" },
      { deva: "लहंगा", name: "Lehengas", cnt: "Bridal · Festive · Lightweight", panel: "p-plum", tone: "m-gold", motif: "paisley", q: "Lehengas", image: "/categories/lehengas-plum.webp", pos: "center top" },
      { deva: "दुपट्टा", name: "Dupattas", cnt: "Zari · Bandhej · Embroidered", panel: "p-mustard", tone: "m-cream", motif: "mandala", q: "Dupattas", image: "/categories/dupattas-gold.webp", pos: "center center" },
      { deva: "कुर्ता सेट", name: "Kurta Sets", cnt: "Co-ords · Everyday luxe", panel: "p-indigo", tone: "m-gold", motif: "paisley", q: "Kurta+Sets", image: "/categories/kurta-sets.webp", pos: "55% top" },
      { deva: "दुल्हन", name: "The Bridal Edit", cnt: "Made to measure", panel: "p-terra", tone: "m-cream", motif: "mandala", q: "Bridal", image: "/categories/bridal-edit.webp", pos: "40% top" },
    ],
  },

  story: {
    eyebrow: "The House of तमक",
    title: "Woven slowly,", em: "worn for years.",
    paragraphs: [
      "तमक began with a simple belief — that what you wear for life’s most-remembered days should be made by human hands, not hurried machines. Every suit and saree is cut, woven and finished to order.",
      "We work directly with weaving families, paying fairly and keeping ancestral techniques alive. No mass production. No two pieces exactly alike.",
    ],
    ctaLabel: "Read our story", ctaHref: "/about", sign: "— Bhavneet",
  },

  storeInfo: {
    eyebrow: "Visit Us",
    title: "Come see us in", em: "Bathinda.",
    intro: "Step into the तमक store to feel the silks in person, meet our team and have a piece tailored to your measurements.",
    address: "SCO - 42, Dabwali Rd, Ganpati Enclave,\nBathinda, Punjab 151001",
    hours: "Mon – Sat · 10 am – 7 pm",
    hoursNote: "Sunday · by appointment",
    phone: "+91 00000 00000",
    mapUrl: "https://maps.app.goo.gl/k51zrDBvvqmbMQig8",
    cityDeva: "बठिंडा", citySub: "Bathinda · Punjab",
  },

  newsletter: {
    eyebrow: "Stay in the weave",
    title: "First looks, before anyone else",
    sub: "New drops, atelier stories and first looks — straight to your inbox.",
    placeholder: "Your email address",
    button: "Subscribe",
    success: "Thank you — you're on the list.",
  },

  footer: {
    blurb: "Handwoven suits, sarees & ethnic wear — crafted to order by artisans whose craft has passed through generations.",
    socials: [
      { label: "Instagram", href: "#", icon: "instagram" },
      { label: "Facebook", href: "#", icon: "facebook" },
      { label: "Pinterest", href: "#", icon: "pinterest" },
      { label: "YouTube", href: "#", icon: "youtube" },
    ],
    cols: [
      { title: "Shop", links: [
        { label: "Banarsee", href: "/shop?cat=BANARSEE" }, { label: "Chikankari", href: "/shop?cat=CHIKANKARI" },
        { label: "Ikkat", href: "/shop?cat=IKKAT" }, { label: "Ajrakh", href: "/shop?cat=AJRAKH" },
        { label: "Rajkot Patolas", href: "/shop?cat=RAJKOT+PATOLAS" }, { label: "Shop all", href: "/shop" },
      ] },
      { title: "The House", links: [
        { label: "Our Story", href: "/about" }, { label: "The Craft", href: "/about" },
        { label: "Size Guide", href: "/size-guide" }, { label: "Shipping", href: "/shipping" },
        { label: "Returns & Refunds", href: "/returns" },
      ] },
    ],
    email: "care@tamak.in",
    phone: "+91 00000 00000",
    hoursNote: "Mon–Sat, 10am–7pm IST",
    bottomNote: "© 2026 तमक by Bhavneet. Handwoven in India.",
    payments: "UPI · Cards · Net Banking · Cash on Delivery",
  },

  navigation: {
    primary: [
      { label: "Shop", href: "/shop", drop: [
        { label: "Banarsee", href: "/shop?cat=BANARSEE" }, { label: "Chikankari", href: "/shop?cat=CHIKANKARI" },
        { label: "Ikkat", href: "/shop?cat=IKKAT" }, { label: "Kalamkari", href: "/shop?cat=KALAMKARI" },
        { label: "Phulkari", href: "/shop?cat=PHULKARI" }, { label: "Rajkot Patolas", href: "/shop?cat=RAJKOT+PATOLAS" },
        { label: "Ajrakh", href: "/shop?cat=AJRAKH" }, { label: "Paithni", href: "/shop?cat=PAITHNI" },
        { label: "Lambani", href: "/shop?cat=LAMBANI" }, { label: "Kantha", href: "/shop?cat=KANTHA" },
        { label: "Sozni/Kashmiri", href: "/shop?cat=SOZNI%2FKASHMIRI" }, { label: "Bandhej", href: "/shop?cat=BANDHEJ" },
      ] },
      { label: "New In", href: "/shop?sort=new", drop: [] },
      { label: "Occasions", href: "/shop", drop: [
        { label: "Bridal", href: "/shop?occasion=Bridal" }, { label: "Festive", href: "/shop?occasion=Festive" },
        { label: "Everyday Luxe", href: "/shop?occasion=Everyday" }, { label: "Reception", href: "/shop?occasion=Reception" },
      ] },
      { label: "The Craft", href: "/#story", drop: [] },
      { label: "Atelier", href: "/#story", drop: [] },
    ],
    mobileGroups: [
      { label: "Shop", links: [
        { label: "Banarsee", href: "/shop?cat=BANARSEE" }, { label: "Chikankari", href: "/shop?cat=CHIKANKARI" },
        { label: "Ikkat", href: "/shop?cat=IKKAT" }, { label: "Kalamkari", href: "/shop?cat=KALAMKARI" },
        { label: "Phulkari", href: "/shop?cat=PHULKARI" }, { label: "Rajkot Patolas", href: "/shop?cat=RAJKOT+PATOLAS" },
        { label: "Ajrakh", href: "/shop?cat=AJRAKH" }, { label: "Paithni", href: "/shop?cat=PAITHNI" },
        { label: "Lambani", href: "/shop?cat=LAMBANI" }, { label: "Kantha", href: "/shop?cat=KANTHA" },
        { label: "Sozni/Kashmiri", href: "/shop?cat=SOZNI%2FKASHMIRI" }, { label: "Bandhej", href: "/shop?cat=BANDHEJ" },
        { label: "Shop all", href: "/shop" },
      ] },
      { label: "The House", links: [
        { label: "Our Story", href: "/about" }, { label: "The Craft", href: "/about" },
        { label: "Size Guide", href: "/size-guide" }, { label: "Contact", href: "/contact" },
      ] },
    ],
  },
};

export type ContentSection = keyof typeof CONTENT_DEFAULTS;
export const CONTENT_SECTIONS = Object.keys(CONTENT_DEFAULTS) as ContentSection[];
