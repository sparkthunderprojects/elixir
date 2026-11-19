import { useCallback, useEffect, useRef, useState } from "react";
import { getElixirClient } from "@/lib/elixir-client";

// ---------------------------------------------------------------------------
// Types (mirror the jsonb returned by the public.elixir_* functions)
// ---------------------------------------------------------------------------

export type StaffRole = "admin" | "agent";
export interface Staff { role: StaffRole; email: string }

export interface Overview {
  members: number;
  points_outstanding: number;
  points_issued: number;
  points_redeemed: number;
  redeemed_value_gbp: number;
  liability_gbp: number;
  avg_lifetime_spend_gbp: number;
  redeem_points_per_gbp: number;
  tiers: { id: string; name: string; color: string; members: number }[];
  brands_30d: { slug: string; name: string; points: number; spend_gbp: number }[];
}

export interface MemberRow {
  member_id: string;
  email: string;
  display_name: string | null;
  status: "active" | "suspended";
  joined_at: string;
  balance: number;
  lifetime_points: number;
  orders: number;
  lifetime_spend_gbp: number;
  window_spend_gbp: number;
  tier_id: string | null;
  tier_name: string | null;
  tier_color: string | null;
}

export interface HistoryRow {
  id: number;
  created_at: string;
  kind: "earn" | "redeem" | "adjust" | "reversal" | "expire";
  delta: number;
  description: string | null;
  reason: string | null;
  note: string | null;
  staff_email: string | null;
  brand: string | null;
}

export interface AdjustmentRow {
  id: number;
  created_at: string;
  member_email: string;
  member_name: string | null;
  delta: number;
  reason: AdjustmentReason;
  note: string;
  staff_email: string;
}

export type AdjustmentReason =
  | "cs_escalation" | "birthday_gift" | "manual_correction" | "lost_order_compensation" | "vip_bonus";

export const REASON_LABELS: Record<AdjustmentReason, string> = {
  cs_escalation: "CS Escalation Resolution",
  birthday_gift: "Birthday Gift",
  manual_correction: "Manual Correction",
  lost_order_compensation: "Lost Order Compensation",
  vip_bonus: "VIP Bonus",
};

export type RewardCategory = "ecommerce" | "media_content";
export type RewardType = "fixed_discount" | "percent_discount" | "free_shipping" | "digital_access";

export interface RewardRow {
  id: string;
  title: string;
  description: string;
  category: RewardCategory;
  reward_type: RewardType;
  value: number | null;
  point_cost: number;
  brand_id: string | null;
  brand: string | null;
  active: boolean;
  stock: number | null;
  per_member_limit: number | null;
  redeemed: number;
}

export interface RewardInput {
  id?: string;
  title: string;
  description: string;
  category: RewardCategory;
  reward_type: RewardType;
  value: number | null;
  point_cost: number;
  brand_id: string | null;
  active: boolean;
  stock: number | null;
  per_member_limit: number | null;
}

export interface TierRow {
  id: string;
  name: string;
  min_spend_gbp: number;
  earn_multiplier: number;
  color: string;
  perks: string[];
}

export interface KeyRow { id: string; label: string; prefix: string; created_at: string; revoked_at: string | null }
export interface BrandRow {
  id: string;
  slug: string;
  name: string;
  brand_type: "owned" | "partner";
  earn_points_per_gbp: number | null;
  active: boolean;
  keys: KeyRow[];
}

export interface Config {
  earn_points_per_gbp: number;
  redeem_points_per_gbp: number;
  tier_window_months: number;
  code_valid_days: number;
  agent_adjust_limit: number;
}

// ---------------------------------------------------------------------------
// API — every call goes through a public.elixir_* RPC; tables are never touched directly.
// ---------------------------------------------------------------------------

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await getElixirClient().rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export interface EnquiryRow {
  id: string; created_at: string; company: string; contact_name: string; email: string; website: string | null;
  interests: string[]; message: string | null; status: "new" | "contacted" | "closed"; notes: string | null;
}
export interface EnquiryList { new_count: number; total: number; rows: EnquiryRow[] }

export interface Liability {
  redeem_points_per_gbp: number; expiry_months: number | null; members_with_balance: number;
  outstanding_points: number; outstanding_gbp: number; issued_points: number; redeemed_points: number; expired_points: number; breakage_pct: number; codes_unused: number;
  ageing: { bucket: string; members: number; points: number }[];
  monthly: { month: string; issued: number; redeemed: number; expired: number }[];
  expiring_soon: { members: number; points: number } | null;
}
export interface ExpiryPolicy { months: number | null; due_members: number; due_points: number }
export interface ExpiryRun { dry_run: boolean; members: number; points: number; more_to_do: boolean }

export interface PartnerBrand { brand_id: string; name: string; slug: string; role: 'owner' | 'staff'; active: boolean }
export interface PartnerOverview {
  brand: { id: string; name: string; slug: string; active: boolean };
  days: number; points_issued: number; points_funded: number; points_redeemed: number; funding_cost_gbp: number;
  spend_gbp: number; orders: number; members: number;
  daily: { day: string; points: number; spend_gbp: number; orders: number }[];
  recent: { created_at: string; kind: string; delta: number; spend_gbp: number | null; source_ref: string | null; description: string | null; member: string }[];
}
export interface PartnerKey { id: string; label: string; prefix: string; created_at: string; revoked_at: string | null }
export interface BrandUser { user_id: string; email: string; role: 'owner' | 'staff'; created_at: string }

export interface SettlementRow { id: string; brand: string; period_start: string; period_end: string; points_funded: number; amount_gbp: number; status: 'draft' | 'issued' | 'paid'; issued_at: string | null; paid_at: string | null }
export interface TrialLine { code: string; name: string; kind: string; debit: number; credit: number }
export interface PartnerSettlement { period_start: string; period_end: string; points_funded: number; amount_gbp: number; status: 'issued' | 'paid'; issued_at: string | null; paid_at: string | null }

export interface ReferralSettings { enabled: boolean; bonus_referrer: number; bonus_referee: number; min_spend_gbp: number; max_per_member: number; total: number; rewarded: number }

export const api = {
  referralSettings: () => rpc<ReferralSettings>("elixir_admin_referral_settings"),
  setReferralSettings: (p: Partial<ReferralSettings>) => rpc<void>("elixir_admin_set_referral_settings", { p }),
  settlements: () => rpc<SettlementRow[]>("elixir_admin_settlements"),
  generateSettlements: (from: string, to: string) => rpc<{ created: number }>("elixir_admin_generate_settlements", { p_from: from, p_to: to }),
  issueSettlement: (id: string) => rpc<void>("elixir_admin_issue_settlement", { p_id: id }),
  paySettlement: (id: string) => rpc<void>("elixir_admin_mark_settlement_paid", { p_id: id }),
  trialBalance: () => rpc<TrialLine[]>("elixir_admin_trial_balance"),
  partnerSettlements: (brand: string) => rpc<PartnerSettlement[]>("elixir_partner_settlements", { p_brand: brand }),
  partnerBrands: () => rpc<PartnerBrand[]>("elixir_partner_brands"),
  partnerOverview: (brand: string, days: number) => rpc<PartnerOverview>("elixir_partner_overview", { p_brand: brand, p_days: days }),
  partnerKeys: (brand: string) => rpc<PartnerKey[]>("elixir_partner_keys", { p_brand: brand }),
  partnerCreateKey: (brand: string, label: string) => rpc<{ id: string; key: string }>("elixir_partner_create_key", { p_brand: brand, p_label: label }),
  partnerRevokeKey: (brand: string, key: string) => rpc<void>("elixir_partner_revoke_key", { p_brand: brand, p_key: key }),
  brandUsers: (brand: string) => rpc<BrandUser[]>("elixir_admin_brand_users", { p_brand: brand }),
  addBrandUser: (brand: string, email: string, role: string) => rpc<void>("elixir_admin_add_brand_user", { p_brand: brand, p_email: email, p_role: role }),
  removeBrandUser: (brand: string, user: string) => rpc<void>("elixir_admin_remove_brand_user", { p_brand: brand, p_user: user }),
  whoami: () => rpc<Staff | null>("elixir_whoami"),
  overview: () => rpc<Overview>("elixir_admin_overview"),
  members: (search: string, limit: number) =>
    rpc<MemberRow[]>("elixir_admin_members", { p_search: search || null, p_limit: limit, p_offset: 0 }),
  memberHistory: (memberId: string) => rpc<HistoryRow[]>("elixir_admin_member_history", { p_member: memberId, p_limit: 100 }),
  adjust: (memberId: string, delta: number, reason: AdjustmentReason, note: string) =>
    rpc<{ balance: number }>("elixir_admin_adjust", { p_member: memberId, p_delta: delta, p_reason: reason, p_note: note }),
  adjustments: () => rpc<AdjustmentRow[]>("elixir_admin_adjustments", { p_limit: 100 }),
  rewards: () => rpc<RewardRow[]>("elixir_admin_rewards"),
  saveReward: (r: RewardInput) => rpc<{ id: string }>("elixir_admin_save_reward", { p: r }),
  setRewardActive: (id: string, active: boolean) => rpc<void>("elixir_admin_set_reward_active", { p_id: id, p_active: active }),
  archiveReward: (id: string) => rpc<void>("elixir_admin_archive_reward", { p_id: id }),
  tiers: () => rpc<TierRow[]>("elixir_admin_tiers"),
  saveTier: (t: TierRow) => rpc<void>("elixir_admin_save_tier", { p: t }),
  brands: () => rpc<BrandRow[]>("elixir_admin_brands"),
  saveBrand: (b: { id?: string; slug?: string; name: string; brand_type: string; earn_points_per_gbp: number | null; active: boolean }) =>
    rpc<{ id: string }>("elixir_admin_save_brand", { p: b }),
  createKey: (brandId: string, label: string) => rpc<{ id: string; key: string }>("elixir_admin_create_key", { p_brand: brandId, p_label: label }),
  revokeKey: (keyId: string) => rpc<void>("elixir_admin_revoke_key", { p_key: keyId }),
  enquiries: (status: string | null) => rpc<EnquiryList>("elixir_admin_enquiries", { p_status: status, p_limit: 100, p_offset: 0 }),
  updateEnquiry: (id: string, status: string, notes: string | null) => rpc<void>("elixir_admin_update_enquiry", { p_id: id, p_status: status, p_notes: notes }),
  submitEnquiry: (p: { company: string; contact_name: string; email: string; website: string; interests: string[]; message: string }) =>
    rpc<{ ok: boolean }>("elixir_submit_enquiry", { p }),
  liability: () => rpc<Liability>("elixir_admin_liability"),
  expiryPolicy: () => rpc<ExpiryPolicy>("elixir_admin_expiry_policy"),
  setExpiryPolicy: (months: number | null) => rpc<void>("elixir_admin_set_expiry_policy", { p_months: months }),
  runExpiry: (dryRun: boolean) => rpc<ExpiryRun>("elixir_admin_run_expiry", { p_dry_run: dryRun }),
  config: () => rpc<Config>("elixir_admin_config"),
  saveConfig: (c: Config) => rpc<void>("elixir_admin_save_config", { p: c }),
};

// ---------------------------------------------------------------------------
// Small data-loading hook
// ---------------------------------------------------------------------------

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fnRef.current()
      .then((data) => { if (!cancelled) setState({ data, error: null, loading: false }); })
      .catch((e: unknown) => { if (!cancelled) setState({ data: null, error: e instanceof Error ? e.message : String(e), loading: false }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

export function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
