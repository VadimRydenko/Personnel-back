import type { CreateOrderInput } from "../orders/orders.types.js";

export type OrgUnitRow = {
  code: number;
  parentCode: number | null;
  unitTypeCode: number;
  name: string;
  shortName: string | null;
  sortOrder: number;
  validFrom: Date;
  validTo: Date | null;
  createOrderCode: number;
  destroyOrderCode: number | null;
  stationing: string;
};

export type CreateOrgUnitInput = CreateOrderInput & {
  parentCode?: number | null | undefined;
  unitTypeCode: number;
  name: string;
  stationing: string;
  validFrom: Date;
};

export type UpdateOrgUnitInput = {
  name?: string | undefined;
  unitTypeCode?: number | undefined;
  stationing?: string | undefined;
  validFrom?: Date | undefined;
  createOrderCode?: number | undefined;
  createOrder?: { orderNo: string; orderDate: Date } | undefined;
};

export type EnrichedOrgUnit = OrgUnitRow & {
  unitType: { code: number; val: string; key: string } | null;
  createOrder: { code: number; orderNo: string; orderDate: Date } | null;
  destroyOrder: { code: number; orderNo: string; orderDate: Date } | null;
};

export type OrgUnitTreeNode = EnrichedOrgUnit & {
  children: OrgUnitTreeNode[];
};
