// Declarative field schemas that drive the generic SectionEditor. One schema per
// content section means no bespoke editor code per section.
import type { ContentSection } from "@/lib/content-defaults";

export type Field =
  | { key: string; label: string; type: "text" | "textarea" | "number" | "boolean" | "image" | "icon" }
  | { key: string; label: string; type: "select"; options: string[] }
  | { key: string; label: string; type: "strings" }
  | { key: string; label: string; type: "list"; itemLabel?: string; fields: Field[] }
  | { key: string; label: string; type: "group"; fields: Field[] };

const link: Field[] = [
  { key: "label", label: "Label", type: "text" },
  { key: "href", label: "Link", type: "text" },
];

export const CONTENT_SCHEMA: Record<ContentSection, { title: string; group: string; fields: Field[] }> = {
  hero: {
    title: "Hero slides", group: "Homepage",
    fields: [
      { key: "slides", label: "Slides", type: "list", itemLabel: "Slide", fields: [
        { key: "eyebrow", label: "Eyebrow", type: "text" },
        { key: "title", label: "Title", type: "text" },
        { key: "em", label: "Emphasis (italic line)", type: "text" },
        { key: "sub", label: "Subtitle", type: "textarea" },
        { key: "image", label: "Background image", type: "image" },
        { key: "pos", label: "Image position (e.g. center top)", type: "text" },
        { key: "cta", label: "Buttons", type: "list", itemLabel: "Button", fields: link },
      ] },
    ],
  },
  announcements: {
    title: "Announcements", group: "Announcements",
    fields: [
      { key: "topbar", label: "Top bar messages", type: "strings" },
      { key: "marquee", label: "Marquee words", type: "list", itemLabel: "Word", fields: [
        { key: "hi", label: "Devanagari", type: "text" }, { key: "en", label: "English", type: "text" },
      ] },
      { key: "banner", label: "Sale banner", type: "group", fields: [
        { key: "enabled", label: "Show banner", type: "boolean" },
        { key: "text", label: "Text", type: "text" },
        { key: "href", label: "Link", type: "text" },
      ] },
    ],
  },
  trust: {
    title: "Trust bar", group: "Homepage",
    fields: [{ key: "items", label: "Items", type: "list", itemLabel: "Item", fields: [
      { key: "title", label: "Title", type: "text" }, { key: "sub", label: "Subtitle", type: "text" }, { key: "icon", label: "Icon", type: "icon" },
    ] }],
  },
  promise: {
    title: "Promise strip", group: "Homepage",
    fields: [{ key: "items", label: "Items", type: "list", itemLabel: "Item", fields: [
      { key: "title", label: "Title", type: "text" }, { key: "body", label: "Body", type: "textarea" }, { key: "icon", label: "Icon", type: "icon" },
    ] }],
  },
  testimonials: {
    title: "Testimonials", group: "Homepage",
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "sub", label: "Subtitle", type: "textarea" },
      { key: "reviews", label: "Reviews", type: "list", itemLabel: "Review", fields: [
        { key: "quote", label: "Quote", type: "textarea" }, { key: "who", label: "Name", type: "text" }, { key: "city", label: "City", type: "text" },
      ] },
    ],
  },
  categoryRail: {
    title: "Category rail", group: "Homepage",
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Title", type: "text" },
      // The category cards themselves are managed under Catalog → Categories.
    ],
  },
  story: {
    title: "Brand story", group: "Homepage",
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "em", label: "Emphasis (italic)", type: "text" },
      { key: "paragraphs", label: "Paragraphs", type: "strings" },
      { key: "ctaLabel", label: "Link label", type: "text" },
      { key: "ctaHref", label: "Link href", type: "text" },
      { key: "sign", label: "Signature", type: "text" },
    ],
  },
  storeInfo: {
    title: "Store info", group: "Store info",
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "em", label: "Emphasis (italic)", type: "text" },
      { key: "intro", label: "Intro", type: "textarea" },
      { key: "address", label: "Address", type: "textarea" },
      { key: "hours", label: "Hours", type: "text" },
      { key: "hoursNote", label: "Hours note", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "mapUrl", label: "Google Maps URL", type: "text" },
      { key: "cityDeva", label: "City (Devanagari)", type: "text" },
      { key: "citySub", label: "City subtitle", type: "text" },
    ],
  },
  newsletter: {
    title: "Newsletter", group: "Homepage",
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "sub", label: "Subtitle", type: "textarea" },
      { key: "placeholder", label: "Input placeholder", type: "text" },
      { key: "button", label: "Button label", type: "text" },
      { key: "success", label: "Success message", type: "textarea" },
    ],
  },
  footer: {
    title: "Footer", group: "Footer",
    fields: [
      { key: "blurb", label: "Brand blurb", type: "textarea" },
      { key: "socials", label: "Social links", type: "list", itemLabel: "Social", fields: [
        { key: "label", label: "Label", type: "text" }, { key: "href", label: "Link", type: "text" }, { key: "icon", label: "Icon", type: "icon" },
      ] },
      { key: "cols", label: "Link columns", type: "list", itemLabel: "Column", fields: [
        { key: "title", label: "Heading", type: "text" },
        { key: "links", label: "Links", type: "list", itemLabel: "Link", fields: link },
      ] },
      { key: "email", label: "Contact email", type: "text" },
      { key: "phone", label: "Contact phone", type: "text" },
      { key: "hoursNote", label: "Hours note", type: "text" },
      { key: "bottomNote", label: "Copyright line", type: "text" },
      { key: "payments", label: "Payment line", type: "text" },
    ],
  },
  navigation: {
    title: "Navigation", group: "Navigation",
    fields: [
      { key: "primary", label: "Header menu", type: "list", itemLabel: "Item", fields: [
        { key: "label", label: "Label", type: "text" }, { key: "href", label: "Link", type: "text" },
        { key: "drop", label: "Dropdown", type: "list", itemLabel: "Link", fields: link },
      ] },
      { key: "mobileGroups", label: "Mobile menu groups", type: "list", itemLabel: "Group", fields: [
        { key: "label", label: "Heading", type: "text" },
        { key: "links", label: "Links", type: "list", itemLabel: "Link", fields: link },
      ] },
    ],
  },
};
