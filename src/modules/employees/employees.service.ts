import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  title?: string | undefined;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type EmployeeCreate = {
  firstName: string;
  lastName: string;
  title?: string | undefined;
};
export type EmployeeUpdate = {
  firstName?: string | undefined;
  lastName?: string | undefined;
  title?: string | undefined;
};

const nowIso = () => new Date().toISOString();

@Injectable()
export class EmployeesService {
  private readonly employees = new Map<string, Employee>();

  constructor() {
    // seed
    for (const seed of [
      { firstName: "Vadym", lastName: "Rudenko", title: "Engineer" },
      { firstName: "Olena", lastName: "Koval", title: "HR" },
      { firstName: "Ihor", lastName: "Shevchenko", title: "Manager" },
    ]) {
      const id = randomUUID();
      const t = nowIso();
      this.employees.set(id, { id, createdAt: t, updatedAt: t, ...seed });
    }
  }

  listEmployees(input: { q?: string | undefined; page: number; pageSize: number }) {
    const all = Array.from(this.employees.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const q = input.q?.trim().toLowerCase();
    const filtered = q
      ? all.filter((e) => `${e.firstName} ${e.lastName} ${e.title ?? ""}`.toLowerCase().includes(q))
      : all;

    const total = filtered.length;
    const start = (input.page - 1) * input.pageSize;
    const items = filtered.slice(start, start + input.pageSize);

    return { items, page: input.page, pageSize: input.pageSize, total };
  }

  getEmployee(id: string) {
    return this.employees.get(id) ?? null;
  }

  createEmployee(data: EmployeeCreate) {
    const id = randomUUID();
    const t = nowIso();
    const employee: Employee = { id, createdAt: t, updatedAt: t, ...data };
    this.employees.set(id, employee);
    return employee;
  }

  updateEmployee(id: string, patch: EmployeeUpdate) {
    const existing = this.employees.get(id);
    if (!existing) return null;

    const updated: Employee = {
      ...existing,
      firstName: patch.firstName ?? existing.firstName,
      lastName: patch.lastName ?? existing.lastName,
      title: patch.title ?? existing.title,
      updatedAt: nowIso(),
    };

    this.employees.set(id, updated);
    return updated;
  }

  deleteEmployee(id: string) {
    return this.employees.delete(id);
  }
}
