import { ImageResponse } from "workers-og";
import { DEFAULT_DESCRIPTION } from "../shared/site-metadata";

const WIDTH = 1200;
const HEIGHT = 630;

// The HTML parser used to build the image (HTMLRewriter, via workers-og)
// does not decode entities back to characters when rendering text nodes —
// e.g. "&amp;" renders as the literal string "&amp;", not "&". So instead of
// entity-escaping, strip the characters that could break the markup
// structure and leave everything else (including "&" and quotes) as-is,
// since this text only ever appears inside a text node, never an attribute.
function sanitizeText(value) {
  return value.replace(/[<>]/g, "");
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function fetchOk(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response;
}

async function fetchAsDataUri(origin, path, mime) {
  const response = await fetchOk(new URL(path, origin));
  const buffer = await response.arrayBuffer();
  return `data:${mime};base64,${arrayBufferToBase64(buffer)}`;
}

// The logo, illustration, and fonts are identical for every render, so fetch
// and encode them once per isolate instead of on every request. Keyed by
// origin in case the same isolate ever serves more than one (e.g. preview
// deployments). A failed fetch must not poison the cache for the isolate's
// lifetime, so evict on rejection and let the next request retry.
const assetsCache = new Map();

function loadAssets(origin) {
  if (!assetsCache.has(origin)) {
    const assets = Promise.all([
      fetchAsDataUri(origin, "/img/brand/bitrise-docs-lockup.png", "image/png"),
      fetchAsDataUri(
        origin,
        "/img/brand/portal-header-illustration-2x.png",
        "image/png",
      ),
      fetchOk(new URL("/fonts/figtree/Figtree-ExtraBold.ttf", origin)).then(
        (r) => r.arrayBuffer(),
      ),
      fetchOk(new URL("/fonts/figtree/Figtree-Regular.ttf", origin)).then(
        (r) => r.arrayBuffer(),
      ),
    ]).then(([logoDataUri, illustrationDataUri, fontBold, fontRegular]) => ({
      logoDataUri,
      illustrationDataUri,
      fontBold,
      fontRegular,
    }));
    assets.catch(() => assetsCache.delete(origin));
    assetsCache.set(origin, assets);
  }
  return assetsCache.get(origin);
}

export async function onRequest(context) {
  try {
    return await renderOg(context);
  } catch (err) {
    return new Response(`OG render error: ${err.stack || err}`, {
      status: 500,
      headers: { "content-type": "text/plain" },
    });
  }
}

async function renderOg(context) {
  const { request } = context;
  const url = new URL(request.url);
  const title = (url.searchParams.get("title") || "Bitrise Docs").slice(0, 120);
  const description = (
    url.searchParams.get("description") || DEFAULT_DESCRIPTION
  ).slice(0, 200);

  const origin = url.origin;

  const { logoDataUri, illustrationDataUri, fontBold, fontRegular } =
    await loadAssets(origin);

  // Every <div> below needs an explicit display (flex/none) even leaves with
  // no children — Satori silently returns an empty image body otherwise, with
  // no error surfaced. This is easy to reintroduce when editing this layout.
  const html = `
    <div style="display:flex; width:${WIDTH}px; height:${HEIGHT}px; background:#2b0e3f; position:relative; font-family:Figtree;">
      <img src="${logoDataUri}" width="244" height="46" style="position:absolute; top:50px; left:80px; width:244px; height:46px;" />
      <div style="display:flex; align-items:center; width:100%; height:100%; padding:0 70px 0 80px;">
        <div style="display:flex; flex-direction:column; width:660px;">
          <div style="display:flex; font-size:52px; font-weight:800; color:#ffffff; line-height:1.2; margin-bottom:28px;">${sanitizeText(title)}</div>
          <div style="display:flex; font-size:26px; font-weight:400; color:#c9c1cd; line-height:1.5;">${sanitizeText(description)}</div>
        </div>
        <img src="${illustrationDataUri}" width="300" height="212" style="width:300px; height:212px; margin-left:auto;" />
      </div>
      <div style="display:flex; position:absolute; bottom:0; left:0; width:100%; height:10px; background:linear-gradient(90deg, #9247c2, #11bba9, #f9cc15);"></div>
    </div>
  `;

  return new ImageResponse(html, {
    width: WIDTH,
    height: HEIGHT,
    headers: {
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    },
    fonts: [
      { name: "Figtree", data: fontBold, weight: 800, style: "normal" },
      { name: "Figtree", data: fontRegular, weight: 400, style: "normal" },
    ],
  });
}
