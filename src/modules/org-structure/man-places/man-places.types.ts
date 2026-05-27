import type { CreateOrderInput } from "../orders/orders.types.js";

export type ManPlaceRow = {
  code: number;
  manCode: number;
  placeCode: number | null;
  sPlace: string;
  orderCode: number;
  validFrom: Date;
  validTo: Date;
  koef: number;
  percentRate: number;
  fullName: string;
  byReasonOfUnitRename: string;
};

export type ManPlaceAssignee = {
  manCode: number;
  fullName: string;
};

export type AssignManToPlaceInput = CreateOrderInput & {
  manCode: number;
  validFrom: Date;
  sPlace?: string | undefined;
  koef?: number | undefined;
  percentRate?: number | undefined;
};

export type UnassignManFromPlaceInput = CreateOrderInput & {
  manCode: number;
  validTo: Date;
};
