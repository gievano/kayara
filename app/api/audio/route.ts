import { NextRequest } from "next/server";

// ponytail: same-origin proxy so <audio> plays Drive mpeg reliably in-browser.
const HOST = "https://drive.usercontent.google.com";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u") || "";
  let driveUrl: URL;
  try {
    driveUrl = new URL(u);
  } catch {
    return new Response("invalid url", { status: 400 });
  }
  if (driveUrl.hostname !== "drive.usercontent.google.com") {
    return new Response("forbidden host", { status: 403 });
  }
  const headers = new Headers();
  const range = req.headers.get("range");
  if (range) headers.set("Range", range);
  const upstream = await fetch(driveUrl.toString(), { headers, redirect: "follow" });
  const resHeaders = new Headers();
  const ct = upstream.headers.get("content-type") || "audio/mpeg";
  resHeaders.set("content-type", ct);
  resHeaders.set("accept-ranges", upstream.headers.get("accept-ranges") || "bytes");
  resHeaders.set("access-control-allow-origin", "*");
  if (upstream.status === 206) {
    resHeaders.set("content-range", upstream.headers.get("content-range") || "");
    resHeaders.set("content-length", upstream.headers.get("content-length") || "");
  } else {
    resHeaders.set("content-length", upstream.headers.get("content-length") || "");
  }
  if (upstream.body) {
    return new Response(upstream.body, { status: upstream.status, headers: resHeaders });
  }
  return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers: resHeaders });
}
