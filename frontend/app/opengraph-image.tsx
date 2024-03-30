/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/server";

export const runtime = "edge";
export const alt = "SemanticPDF";
export const contentType = "image/png";

export default async function OG() {
  const interSemiBold = await fetch(
    new URL("./fonts/Inter-SemiBold.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
          backgroundImage:
            "linear-gradient(to bottom right, #bde1ff 25%, #ffffff 50%, #ffffff 75%)",
        }}
      >
        <img
          src={new URL(
            "../public/Semanticpdf_icon.png",
            import.meta.url
          ).toString()}
          alt="Semantic Logo"
          tw="w-50 h-50 mb-4 opacity-95"
        />
        <h1
          style={{
            fontSize: "90px",
            background:
              "linear-gradient(to bottom right, #1E2B3A 21.66%, #78716c 86.47%)",
            backgroundClip: "text",
            color: "transparent",
            lineHeight: "5rem",
            letterSpacing: "-0.02em",
          }}
        >
          Semantic Search PDFs
        </h1>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: interSemiBold,
        },
      ],
    }
  );
}
