export type CreateOrderInput = {
  createOrderCode?: number | undefined;
  createOrder?: { orderNo: string; orderDate: Date } | undefined;
};

export type OrderSummary = {
  code: number;
  orderNo: string;
  orderDate: Date;
};
