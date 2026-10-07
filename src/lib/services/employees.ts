import { getDb } from "@/lib/db/client";
import { employees, Employee, InsertEmployee } from "@/db/schema";
import { eq, and, desc, like, or } from "drizzle-orm";
import { EmployeeInput } from "@/lib/validation/schemas";

export async function listEmployees(
  organizationId: string,
  search?: string,
  dbInstance?: any
): Promise<Employee[]> {
  const db = dbInstance || getDb();
  const conditions = [eq(employees.organizationId, organizationId)];

  if (search && search.trim().length > 0) {
    const q = `%${search.trim()}%`;
    conditions.push(
      or(
        like(employees.firstName, q),
        like(employees.lastName, q),
        like(employees.employeeNumber, q),
        like(employees.department, q),
        like(employees.position, q)
      )!
    );
  }

  return await db
    .select()
    .from(employees)
    .where(and(...conditions))
    .orderBy(desc(employees.createdAt));
}

export async function createEmployee(
  organizationId: string,
  input: EmployeeInput,
  dbInstance?: any
): Promise<Employee> {
  const db = dbInstance || getDb();

  // Check unique employee number per org
  const [existing] = await db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.organizationId, organizationId),
        eq(employees.employeeNumber, input.employeeNumber)
      )
    )
    .limit(1);

  if (existing) {
    throw new Error("Ce numéro d'employé existe déjà dans votre entreprise");
  }

  const now = Date.now();
  const newId = `emp-${crypto.randomUUID()}`;

  const insertData: InsertEmployee = {
    id: newId,
    organizationId,
    employeeNumber: input.employeeNumber,
    firstName: input.firstName,
    lastName: input.lastName,
    department: input.department,
    position: input.position,
    phone: input.phone,
    email: input.email || null,
    status: input.status || "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(employees).values(insertData);

  const [created] = await db.select().from(employees).where(eq(employees.id, newId)).limit(1);
  return created;
}

export async function updateEmployee(
  organizationId: string,
  employeeId: string,
  input: Partial<EmployeeInput>,
  dbInstance?: any
): Promise<Employee> {
  const db = dbInstance || getDb();

  const [existing] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.id, employeeId), eq(employees.organizationId, organizationId)))
    .limit(1);

  if (!existing) {
    throw new Error("Employé introuvable");
  }

  const now = Date.now();
  await db
    .update(employees)
    .set({
      ...input,
      updatedAt: now,
    })
    .where(and(eq(employees.id, employeeId), eq(employees.organizationId, organizationId)));

  const [updated] = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
  return updated;
}
