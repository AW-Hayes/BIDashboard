// ── Enums ──────────────────────────────────────────────────────────────────

export type FacilityType = 'material_production' | 'manufacturing';
export type UserRole = 'viewer' | 'editor';
export type TerritoryStatus = 'controlled' | 'contested' | 'developing' | 'lost';
export type RelationStatus = 'allied' | 'neutral' | 'hostile' | 'at_war' | 'trade_partner';

// ── Business ───────────────────────────────────────────────────────────────

export interface Resource {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  weight_kg: number | null;
  created_at: string;
}

export interface Blueprint {
  id: string;
  name: string;
  description: string | null;
  output_quantity: number;
  notes: string | null;
  created_at: string;
  materials?: BlueprintMaterial[];
}

export interface BlueprintMaterial {
  id: string;
  blueprint_id: string;
  resource_id: string | null;
  material_name: string | null;
  weight_kg: number;   // renamed from quantity — always in KG
  resource?: Resource;
}

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  territory_id: string | null;
  notes: string | null;
  created_at: string;
  resource_assignment?: FacilityResourceAssignment | null;
  blueprint_assignments?: FacilityBlueprintAssignment[];
  territory?: Territory;
}

export interface FacilityResourceAssignment {
  id: string;
  facility_id: string;
  resource_id: string;
  production_rate: number | null;
  notes: string | null;
  resource?: Resource;
}

export interface FacilityBlueprintAssignment {
  id: string;
  facility_id: string;
  blueprint_id: string;
  quantity_per_run: number;
  notes: string | null;
  blueprint?: Blueprint;
}

export interface Storefront {
  id: string;
  name: string;
  location: string | null;
  territory_id: string | null;
  notes: string | null;
  is_open: boolean;
  created_at: string;
  listings?: StorefrontListing[];
  territory?: Territory;
}

export interface StorefrontListing {
  id: string;
  storefront_id: string;
  blueprint_id: string;
  price: number | null;
  quantity_available: number | null;
  notes: string | null;
  blueprint?: Blueprint;
}

// ── Kingdom ────────────────────────────────────────────────────────────────

export interface Territory {
  id: string;
  name: string;
  description: string | null;
  status: TerritoryStatus;
  notes: string | null;
  created_at: string;
  facilities?: Facility[];
  storefronts?: Storefront[];
  resource_nodes?: TerritoryResource[];
}

export interface TerritoryResource {
  id: string;
  territory_id: string;
  resource_id: string;
  notes: string | null;
  resource?: Resource;
}

export interface Member {
  id: string;
  name: string;
  rank: string | null;
  discord: string | null;
  notes: string | null;
  created_at: string;
  assignments?: MemberAssignment[];
}

export interface MemberAssignment {
  id: string;
  member_id: string;
  facility_id: string | null;
  storefront_id: string | null;
  role_notes: string | null;
  facility?: Facility;
  storefront?: Storefront;
}

export interface Faction {
  id: string;
  name: string;
  description: string | null;
  status: RelationStatus;
  notes: string | null;
  created_at: string;
  treaties?: Treaty[];
}

export interface Treaty {
  id: string;
  faction_id: string;
  title: string;
  description: string | null;
  created_at: string;
}

// ── Auth ───────────────────────────────────────────────────────────────────

export interface UserRoleRecord {
  user_id: string;
  role: UserRole;
}
