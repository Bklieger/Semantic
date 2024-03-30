import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://semanticpdf.com",
      lastModified: new Date(),
    },
  ];
}
