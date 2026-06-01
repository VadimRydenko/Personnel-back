import type { CreateOrderInput } from "../orders/orders.types.js";

export type EmployeePlaceRow = {
  code: number;
  employeeCode: number;
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

export type EmployeePlaceAssignee = {
  employeeCode: number;
  fullName: string;
};

export type AssignEmployeeToPlaceInput = CreateOrderInput & {
  employeeCode: number;
  validFrom: Date;
  sPlace?: string | undefined;
  koef?: number | undefined;
  percentRate?: number | undefined;
};

export type UnassignEmployeeFromPlaceInput = CreateOrderInput & {
  employeeCode: number;
  validTo: Date;
};
