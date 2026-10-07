import { getDb } from "../src/lib/db/client";
import { runMigrations } from "./migrate";
import {
  organizations,
  users,
  employees,
  leaveRequests,
  auditLogs,
  notificationLogs,
} from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/password";
import { hashToken, generateSecureToken } from "../src/lib/security/tokens";
import { sql } from "drizzle-orm";

export async function seedDatabase(dbInstance?: any) {
  const db = dbInstance || getDb();
  await runMigrations(db);

  console.log("Cleaning and seeding database without demo suffixes...");
  const now = Date.now();

  // Clear existing tables in reverse FK order
  await db.run(sql`DELETE FROM notification_logs`);
  await db.run(sql`DELETE FROM audit_logs`);
  await db.run(sql`DELETE FROM leave_requests`);
  await db.run(sql`DELETE FROM employees`);
  await db.run(sql`DELETE FROM users`);
  await db.run(sql`DELETE FROM organizations`);

  // 1. ORGANIZATIONS
  const orgWelj = {
    id: "org-welj",
    name: "Welj Express Services",
    slug: "welj",
    logoUrl: null,
    email: "support@welj-ht.com",
    phone: "+225 0501020304",
    address: "Plateau, Avenue Nogues, Abidjan",
    status: "ACTIVE" as const,
    createdAt: now - 30 * 24 * 3600 * 1000,
    updatedAt: now - 30 * 24 * 3600 * 1000,
  };

  const orgTechnozi = {
    id: "org-technozi",
    name: "Technozi",
    slug: "technozi",
    logoUrl: null,
    email: "sales@technozi-ht.com",
    phone: "+225 0701020304",
    address: "Zone 4, Boulevard de Marseille, Abidjan",
    status: "ACTIVE" as const,
    createdAt: now - 30 * 24 * 3600 * 1000,
    updatedAt: now - 30 * 24 * 3600 * 1000,
  };

  await db.insert(organizations).values([orgWelj, orgTechnozi]);

  // 2. USERS
  const superAdminPass = await hashPassword("SuperAdmin2026!");
  const weljAdminPass = await hashPassword("Adminwelj@2026");
  const technoziPass = await hashPassword("Technozi@Haiti1234");

  const demoUsers = [
    // Welj Admin
    {
      id: "usr-welj-admin",
      organizationId: orgWelj.id,
      name: "Direction Welj Express Services",
      email: "support@welj-ht.com",
      passwordHash: weljAdminPass,
      role: "ORGANIZATION_ADMIN" as const,
      status: "ACTIVE" as const,
      createdAt: now,
      updatedAt: now,
    },
    // Technozi Admin
    {
      id: "usr-technozi-admin",
      organizationId: orgTechnozi.id,
      name: "Direction Technozi",
      email: "sales@technozi-ht.com",
      passwordHash: technoziPass,
      role: "ORGANIZATION_ADMIN" as const,
      status: "ACTIVE" as const,
      createdAt: now,
      updatedAt: now,
    },
    // Global Super Admin (no org)
    {
      id: "usr-super-admin",
      organizationId: null,
      name: "Super Administrateur Plateforme",
      email: "superadmin@platform.local",
      passwordHash: superAdminPass,
      role: "SUPER_ADMIN" as const,
      status: "ACTIVE" as const,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const u of demoUsers) {
    await db.insert(users).values(u);
  }

  // 3. EMPLOYEES
  const departments = [
    "Opérations & Logistique",
    "Commercial & Ventes",
    "Support Client & Facturation",
    "Transport & Livraison",
    "Informatique & Réseau",
    "Ressources Humaines",
  ];
  const positions = [
    "Superviseur Logistique",
    "Agent Commercial",
    "Chauffeur Livreur",
    "Agent d'Accueil",
    "Responsable de Parc",
    "Comptable",
    "Coordinateur Transport",
    "Gestionnaire Stock",
  ];

  const firstNames = ["Jean", "Paul", "Marc", "Eric", "David", "Christian", "Michel", "Serge", "Yves", "Alexandre", "Amina", "Fatima", "Sarah", "Grace", "Esther", "Clarisse", "Nathalie", "Sandrine", "Carole", "Viviane", "Kouassi", "Koffi", "Yao", "Konan", "N'Guessan", "Brou", "Adjoua", "Amenan", "Akissi", "Affoue", "Ibrahim", "Mamadou", "Bakary", "Ousmane", "Seydou", "Issa", "Fanta", "Awa", "Mariam", "Assetou", "Kader", "Soro", "Gueu", "Dago"];
  const lastNames = ["Kouassi", "Konan", "Koffi", "N'Guessan", "Bamba", "Ouattara", "Coulibaly", "Touré", "Diallo", "Traoré", "Diomandé", "Gbagbo", "Bédié", "Drogba", "Yaya", "Zadi", "Meité", "Fofana", "Cissé", "Kéita", "Diabaté", "Sanogo", "Sangaré", "Koné"];

  for (let i = 1; i <= 44; i++) {
    const fName = firstNames[(i - 1) % firstNames.length];
    const lName = lastNames[(i - 1) % lastNames.length];
    const dept = departments[(i - 1) % departments.length];
    const pos = positions[(i - 1) % positions.length];
    const num = `WELJ-${String(i).padStart(3, "0")}`;

    const emp = {
      id: `emp-welj-${i}`,
      organizationId: orgWelj.id,
      employeeNumber: num,
      firstName: fName,
      lastName: lName,
      department: dept,
      position: pos,
      phone: `+225 05${String(10000000 + i).slice(1)}`,
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}@welj.com`,
      status: "ACTIVE" as const,
      createdAt: now - (45 - i) * 24 * 3600 * 1000,
      updatedAt: now - (45 - i) * 24 * 3600 * 1000,
    };
    await db.insert(employees).values(emp);
  }

  console.log("Database updated cleanly: Technozi and Welj Express Services.");
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed error:", err);
      process.exit(1);
    });
}
