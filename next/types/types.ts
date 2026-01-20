export interface Category {
  name: string;
}

export interface Image {
  url: string;
  alternativeText: string;
}

export interface Article {
  title: string;
  description: string;
  slug: string;
  content: string;
  dynamic_zone: any[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  locale: string;
  image: Image;
  categories: Category[]
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  plans: any[];
  perks: any[];
  featured?: boolean;
  images: any[];
  categories?: any[];
};

export interface Practice {
  id: number;
  name?: string | null;
  slug?: string | null;
  description?: string | null;

  // ✅ ez kell a videó thumbhoz
  video_poster?: any | null;

  media?: any[]; // vagy (StrapiMedia | any)[] ha vegyes

  categories?: Category[];
  dynamic_zone?: any[];
  button?: any;
  seo?: any;
}
