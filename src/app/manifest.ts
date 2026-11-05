import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daily Brief — Tin AI, công nghệ, crypto, tài chính",
    short_name: "Daily Brief",
    description:
      "5 tin đã kiểm chứng mỗi ngày về AI, công nghệ, tiền mã hóa và tài chính.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7fb",
    theme_color: "#4f46e5",
    lang: "vi",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
