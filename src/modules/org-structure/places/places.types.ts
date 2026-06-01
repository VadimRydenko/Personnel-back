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

export type PlaceAssignee = {
  employeeCode: number;
  fullName: string;
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
  /** Поточні призначення з MANPLACES (активні, TODATE = 2999-12-31) */
  assignees: PlaceAssignee[];
};

export type PlaceDisplayStatus = "vacant" | "occupied" | "processing" | "reduced";

export const PLACE_STATUS_LABELS: Record<PlaceDisplayStatus, string> = {
  vacant: "Вакантна",
  occupied: "Зайнята",
  processing: "На оформленні",
  reduced: "Скорочена",
};

export type PlaceDetails = EnrichedPlace & {
  status: PlaceDisplayStatus;
  statusLabel: string;
  title: string;
  assignee: PlaceAssignee | null;
};
