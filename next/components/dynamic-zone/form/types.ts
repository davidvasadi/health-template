export type FormInput = {
  type: "text" | "email" | "tel" | "textarea" | "submit" | string;
  name?: string;
  placeholder?: string;
};

export type OpeningHour = { label: string; value: string };

export type LocationType = {
  name?: string;
  streetAddress?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  mapsUrl?: string;
  opening_hours?: OpeningHour[];
  opening_title?: string;
  phone_label?: string;
  mapsUrl_label?: string;
};

/** Strapi social elem – rugalmas, több shape-et kezelünk */
export type SocialLink = {
  icon?: string;
  label?: string;
  link?:
    | { text?: string; url?: string; URL?: string; href?: string; target?: "_self" | "_blank"; variant?: "primary" | "secondary" | "link" }
    | Array<{ text?: string; url?: string; URL?: string; href?: string; target?: "_self" | "_blank"; variant?: "primary" | "secondary" | "link" }>;
  attributes?: {
    link?:
      | { text?: string; url?: string; URL?: string; href?: string; target?: "_self" | "_blank"; variant?: "primary" | "secondary" | "link" }
      | Array<{ text?: string; url?: string; URL?: string; href?: string; target?: "_self" | "_blank"; variant?: "primary" | "secondary" | "link" }>;
  };
};
