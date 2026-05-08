import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CR_BASE = "https://api.clashroyale.com/v1";
const CR_API_KEY = Deno.env.get("CLASH_ROYALE_API_KEY") ?? "";

serve(async (req: Request) => {
  // Only allow GET
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const path = url.searchParams.get("path");

  if (path === "debug-ip") {
    const ipRes = await fetch("https://httpbin.org/ip");
    const ipData = await ipRes.json();
    return new Response(JSON.stringify(ipData), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!path) {
    return new Response(JSON.stringify({ error: "Missing path parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const res = await fetch(`${CR_BASE}${path}`, {
      headers: { Authorization: `Bearer ${CR_API_KEY}` },
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
