import { Router, type IRouter } from "express";
import { db, identityUsersTable, identityGroupsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/identities/users", async (req, res): Promise<void> => {
  const users = await db.select().from(identityUsersTable);
  res.json(users.map((u) => ({
    id: u.id,
    username: u.username,
    privilegeLevel: u.privilegeLevel,
    mfaEnabled: u.mfaEnabled,
    accountType: u.accountType,
    groups: (u.groups as string[]) ?? [],
    linkedHosts: (u.linkedHosts as string[]) ?? [],
    riskFlags: (u.riskFlags as string[]) ?? [],
  })));
});

router.get("/identities/groups", async (req, res): Promise<void> => {
  const groups = await db.select().from(identityGroupsTable);
  res.json(groups.map((g) => ({
    id: g.id,
    name: g.name,
    memberCount: g.memberCount,
    accessLevel: g.accessLevel,
    members: (g.members as string[]) ?? [],
    permissions: (g.permissions as string[]) ?? [],
  })));
});

export default router;
