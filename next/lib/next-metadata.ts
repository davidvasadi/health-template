const seoData = {
  title: "csontkovacsbence.hu – Hivatalos oldal | [davelopment]® health-template",
  description:
    "Többnyelvű (HU/DE/EN) csontkovács weboldal Strapi + Next.js alapon. Gyors, SEO-barát, lokalizált slugokkal és automatikus sitemap/robots megoldással.",
  image: "https://csontkovacsbence.hu/og-image.jpg", // TODO: állíts be valós OG képet
  openGraph: {
    type: "website",
    title: "csontkovacsbence.hu – Hivatalos oldal",
    url: "https://csontkovacsbence.hu",
    description:
      "Csontkovács Bence hivatalos weboldala – Strapi + Next.js | [davelopment]®",
    locale: "hu_HU",
    keywords:
      "csontkovács, manuálterápia, gerinc, hátfájás, egészség, szolgáltatások",
    images: [
      { width: 1200, height: 630, url: "https://csontkovacsbence.hu/og-image.jpg" },
    ],
    site_name: "csontkovacsbence.hu",
  },
  twitter: {
    handle: "@davelopment", // TODO: ha van más brand handle, írd át
    site: "csontkovacsbence.hu",
    cardType: "summary_large_image",
  },
};
 
 export default seoData;

// const seoData = {
//   title:
//     "LaunchPad - Your content delivery partner for large scale applications",
//   description: `A platform integrating Aceternity with Strapi for seamless content management.`,
//   image: "https://ui.aceternity.com/banner.png",
//   openGraph: {
//     type: "website",
//     title: `LaunchPad - Your content delivery partner for large scale applications`,
//     url: "https://ui.aceternity.com", // TODO: Fix this
//     description: `A platform integrating Aceternity with Strapi for seamless content management.`,
//     locale: "en_EN",
//     keywords: "content, delivery, web, hosting",
//     images: [
//       {
//         width: 1200,
//         height: 630,
//         url: `https://ui.aceternity.com/banner.png`, // TODO: Fix this
//       },
//     ],
//     site_name: "launchpad",
//   },
//   twitter: {
//     handle: "@mannupaaji",
//     site: "ui.aceternity.com", // TODO: Fix this
//     cardType: "summary_large_image",
//   },
// };

// export default seoData;
