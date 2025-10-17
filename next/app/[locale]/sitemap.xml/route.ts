export const dynamic = "force-dynamic";

export async function GET() {
  return Response.redirect("/sitemap.xml", 308);
}
