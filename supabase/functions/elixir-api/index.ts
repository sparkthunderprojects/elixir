// Elixir Points — brand-server API.
//
// Deploy as the Edge Function `elixir-api` with JWT verification DISABLED
// (brand servers authenticate with their own Elixir API key, not a Supabase JWT).
//
// Call this from SERVER code only (e.g. a Next.js route handler / server action).
// Never put an Elixir key in browser code.
//
//   POST {SUPABASE_URL}/functions/v1/elixir-api/earn
//   POST .../refund          POST .../check-code          POST .../consume-code
//   Header:  x-elixir-key: elx_...
//
// earn          { source_ref, amount, currency?, email?, user_id?, description?, country? }
//               (amount is in the customer's currency, e.g. 25.00 with currency "USD"; currency defaults to GBP.
//                The older { source_ref, spend_gbp, ... } form still works and means pounds.)
// refund        { order_ref, refund_ref, refund_amount, currency? }   (or the older refund_gbp, meaning pounds)
// check-code    { code }
// consume-code  { code, order_ref }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const MAX_BODY_BYTES = 8 * 1024;

// Postgres error codes raised by the database layer -> HTTP status.
function statusFor(code: string | undefined): number {
  switch (code) {
    case "28000": return 401; // invalid_api_key
    case "42501": return 403; // member_suspended / forbidden
    case "22023": return 400; // validation
    case "23505": return 409; // email belongs to another member
    default: return 500;
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const apiKey = req.headers.get("x-elixir-key") ?? "";
  if (!apiKey.startsWith("elx_")) return json({ error: "invalid_api_key" }, 401);

  const route = new URL(req.url).pathname.split("/").filter(Boolean).pop() ?? "";

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: "body_too_large" }, 413);
  let body: Record<string, unknown>;
  try {
    body = raw ? JSON.parse(raw) : {};
    if (typeof body !== "object" || body === null || Array.isArray(body)) throw new Error("not an object");
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const str = (v: unknown) => (typeof v === "string" ? v : null);
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

  let fn: string;
  let args: Record<string, unknown>;

  switch (route) {
    case "earn": {
      const hasAmount = body.amount !== undefined;
      fn = "elixir_record_earn_v2";
      args = {
        p_api_key: apiKey,
        p_source_ref: str(body.source_ref),
        p_amount: hasAmount ? num(body.amount) : num(body.spend_gbp),
        p_currency: hasAmount ? (str(body.currency) ?? "GBP") : "GBP",
        p_email: str(body.email),
        p_user_id: str(body.user_id),
        p_description: str(body.description),
        p_country: str(body.country),
      };
      break;
    }
    case "refund": {
      const hasAmount = body.refund_amount !== undefined;
      fn = "elixir_record_reversal_v2";
      args = {
        p_api_key: apiKey,
        p_order_ref: str(body.order_ref),
        p_refund_ref: str(body.refund_ref),
        p_refund_amount: hasAmount ? num(body.refund_amount) : num(body.refund_gbp),
        p_currency: hasAmount ? str(body.currency) : "GBP",
      };
      break;
    }
    case "check-code":
      fn = "elixir_check_code";
      args = { p_api_key: apiKey, p_code: str(body.code) };
      break;
    case "consume-code":
      fn = "elixir_consume_code";
      args = { p_api_key: apiKey, p_code: str(body.code), p_order_ref: str(body.order_ref) };
      break;
    default:
      return json({ error: "not_found" }, 404);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data, error } = await supabase.rpc(fn, args);
  if (error) {
    const status = statusFor(error.code);
    // Validation / auth messages are safe to return; hide anything unexpected.
    return json({ error: status === 500 ? "internal_error" : error.message }, status);
  }
  return json(data);
});
