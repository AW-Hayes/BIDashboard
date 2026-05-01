export type FacilityType = 'material_production' | 'manufacturing';
export type UserRole = 'viewer' | 'editor';

export interface Resource {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
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
  quantity: number;
  resource?: Resource;
}

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  notes: string | null;
  created_at: string;
  resource_assignment?: FacilityResourceAssignment | null;
  blueprint_assignments?: FacilityBlueprintAssignment[];
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
  notes: string | null;
  is_open: boolean;
  created_at: string;
  listings?: StorefrontListing[];
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

export interface UserRoleRecord {
  user_id: string;
  role: UserRole;
}
