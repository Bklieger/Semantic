import "../styles/globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SemanticPDF - Instantly Semantic Search your PDFs",
  openGraph: {
    title: "SemanticPDF - Instantly Semantic Search your PDFs",
    description:
      "SemanticPDF is an application to quickly and efficiently semantic search uploaded PDFs.",
    images: [
      {
        url: "https://semanticpdf.com/opengraph-image", // TODO: Replace
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SemanticPDF - Instantly Semantic Search your PDFs",
    description:
      "SemanticPDF is an application to quickly and efficiently semantic search uploaded PDFs.",
    images: ["https://semanticpdf.com/opengraph-image"], // TODO: replace
    creator: "@benjaminklieger",
  },
  metadataBase: new URL("https://semanticpdf.com/"), // TODO: replace
  themeColor: "#FFF",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="scroll-smooth antialiased [font-feature-settings:'ss01']">
        {children}
      </body>
    </html>
  );
}
