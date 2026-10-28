import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "https://go-neighbours.lovable.app";

// Only the public landing page is listed; the app itself is member-only.
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () =>
        new Response(
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${BASE_URL}/</loc></url></urlset>\n`,
          { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } },
        ),
    },
  },
});
