// Shared (client + server) declaration of the broadcast templates. Drives both
// the admin composer form and the server-side HTML renderer — the same idea as
// src/lib/admin/content-schema.ts driving SectionEditor. No server-only imports.

export type TemplateId = "new-arrivals" | "sale" | "festive" | "back-in-stock" | "custom";

export interface TemplateField {
  key: string;
  label: string;
  type: "text" | "textarea";
  placeholder?: string;
}

export interface TemplateDef {
  id: TemplateId;
  label: string;
  /** show the product picker (and include product cards in the email) */
  useProducts: boolean;
  defaultSubject: string;
  fields: TemplateField[];
}

const cta: TemplateField[] = [
  { key: "ctaLabel", label: "Button label", type: "text", placeholder: "Shop now" },
  { key: "ctaUrl", label: "Button link", type: "text", placeholder: "/shop" },
];

export const TEMPLATES: TemplateDef[] = [
  {
    id: "new-arrivals",
    label: "New arrivals",
    useProducts: true,
    defaultSubject: "Fresh off the loom — new arrivals ✦",
    fields: [
      { key: "heading", label: "Heading", type: "text", placeholder: "New this season" },
      { key: "intro", label: "Intro text", type: "textarea", placeholder: "A small-batch drop, handwoven to order." },
      { key: "ctaLabel", label: "Button label", type: "text", placeholder: "Shop new arrivals" },
      { key: "ctaUrl", label: "Button link", type: "text", placeholder: "/shop?sort=new" },
    ],
  },
  {
    id: "sale",
    label: "Sale announcement",
    useProducts: true,
    defaultSubject: "A little something — our edit is on sale",
    fields: [
      { key: "heading", label: "Heading", type: "text", placeholder: "The Festive Edit is on" },
      { key: "intro", label: "Intro text", type: "textarea", placeholder: "Enjoy a special price on select handwoven pieces." },
      ...cta,
    ],
  },
  {
    id: "back-in-stock",
    label: "Back in stock",
    useProducts: true,
    defaultSubject: "Back in stock — don't miss it again",
    fields: [
      { key: "heading", label: "Heading", type: "text", placeholder: "It's back" },
      { key: "intro", label: "Intro text", type: "textarea", placeholder: "The pieces you loved are available again." },
      ...cta,
    ],
  },
  {
    id: "festive",
    label: "Festive greeting",
    useProducts: false,
    defaultSubject: "Warm wishes from तमक",
    fields: [
      { key: "heading", label: "Heading", type: "text", placeholder: "Happy Diwali" },
      { key: "message", label: "Message", type: "textarea", placeholder: "Write your festive note here…" },
      ...cta,
    ],
  },
  {
    id: "custom",
    label: "Custom message",
    useProducts: false,
    defaultSubject: "",
    fields: [
      { key: "heading", label: "Heading", type: "text", placeholder: "Headline" },
      { key: "body", label: "Message", type: "textarea", placeholder: "Write your message here…" },
      ...cta,
    ],
  },
];

export const TEMPLATE_BY_ID = Object.fromEntries(TEMPLATES.map((t) => [t.id, t])) as Record<TemplateId, TemplateDef>;
