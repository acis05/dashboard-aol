import { NextRequest } from "next/server";

export function getPublicOrigin(req: NextRequest) {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) return `${proto}://${host}`;

  return req.nextUrl.origin;
}
