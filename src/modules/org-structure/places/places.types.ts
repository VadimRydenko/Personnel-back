import type { CreateOrderInput } from "../orders/orders.types.js";

export type PlaceRow = {
  code: number;
  orgUnitCode: number;
  placeTypeCode: number;
  sortOrder: number;
  posCount: number;
  isChief: boolean;
  manCount: number;
  validFrom: Date;
  validTo: Date | null;
  createOrderCode: number;
  destroyOrderCode: number | null;
};

export type CreatePlaceInput = CreateOrderInput & {
  placeTypeCode: number;
  validFrom: Date;
  posCount?: number | undefined;
  isChief?: boolean | undefined;
};

export type EnrichedPlace = PlaceRow & {
  placeType: { code: number; val: string } | null;
  createOrder: { code: number; orderNo: string; orderDate: Date } | null;
  destroyOrder: { code: number; orderNo: string; orderDate: Date } | null;
  orgUnit: {
    code: number;
    name: string;
    shortName: string | null;
    city: string;
  } | null;
};
