import { Router } from "express";
import { z } from "zod";
import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  listEmployees,
  updateEmployee,
} from "../db/memory.js";

export const employeesRouter = Router();

const ListQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const EmployeeCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  title: z.string().min(1).optional(),
});

const EmployeeUpdateSchema = EmployeeCreateSchema.partial();

employeesRouter.get("/", (req, res) => {
  const parsed = ListQuerySchema.safeParse(req.query);

  if (!parsed.success) return res.status(400).json({ message: "Invalid query", details: parsed.error });

  const data = listEmployees(parsed.data);

  return res.status(200).json(data);
});

employeesRouter.get("/:id", (req, res) => {
  const employee = getEmployee(req.params.id);

  if (!employee) return res.status(404).json({ message: "Employee not found" });

  return res.status(200).json(employee);
});

employeesRouter.post("/", (req, res) => {
  const parsed = EmployeeCreateSchema.safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body", details: parsed.error });

  const employee = createEmployee(parsed.data);

  return res.status(201).json(employee);
});

employeesRouter.put("/:id", (req, res) => {
  const parsed = EmployeeCreateSchema.safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body", details: parsed.error });

  const updated = updateEmployee(req.params.id, parsed.data);

  if (!updated) return res.status(404).json({ message: "Employee not found" });

  return res.status(200).json(updated);
});

employeesRouter.patch("/:id", (req, res) => {
  const parsed = EmployeeUpdateSchema.safeParse(req.body);

  if (!parsed.success) return res.status(400).json({ message: "Invalid body", details: parsed.error });

  const updated = updateEmployee(req.params.id, parsed.data);

  if (!updated) return res.status(404).json({ message: "Employee not found" });

  return res.status(200).json(updated);
});

employeesRouter.delete("/:id", (req, res) => {
  const ok = deleteEmployee(req.params.id);

  if (!ok) return res.status(404).json({ message: "Employee not found" });

  return res.status(204).send();
});
