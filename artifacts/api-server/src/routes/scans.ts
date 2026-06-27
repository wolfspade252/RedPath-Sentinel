import { Router, type IRouter } from "express";
import { db, scansTable, hostsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { parseNmapXml } from "../lib/nmapParser";
import { UploadScanBody, DeleteScanParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/scans", async (req, res): Promise<void> => {
  const scans = await db.select({
    id: scansTable.id,
    name: scansTable.name,
    uploadedAt: scansTable.uploadedAt,
    hostCount: scansTable.hostCount,
  }).from(scansTable).orderBy(scansTable.uploadedAt);
  res.json(scans.map((s) => ({ ...s, uploadedAt: s.uploadedAt.toISOString(), rawXml: null })));
});

router.post("/scans", async (req, res): Promise<void> => {
  const parsed = UploadScanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let parsedHosts: ReturnType<typeof parseNmapXml> = [];
  try {
    parsedHosts = parseNmapXml(parsed.data.xmlContent);
  } catch (err) {
    res.status(400).json({ error: "Invalid Nmap XML format" });
    return;
  }

  const [scan] = await db.insert(scansTable).values({
    name: parsed.data.name,
    rawXml: parsed.data.xmlContent,
    hostCount: parsedHosts.length,
  }).returning();

  if (parsedHosts.length > 0) {
    await db.insert(hostsTable).values(
      parsedHosts.map((h) => ({
        ip: h.ip,
        hostname: h.hostname,
        status: h.status,
        osGuess: h.osGuess,
        macAddress: h.macAddress,
        hostType: h.hostType,
        difficultyScore: h.difficultyScore,
        services: h.services,
        scanId: scan.id,
        isDemo: false,
      }))
    );
  }

  res.status(201).json({
    id: scan.id,
    name: scan.name,
    uploadedAt: scan.uploadedAt.toISOString(),
    hostCount: scan.hostCount,
    rawXml: null,
  });
});

router.delete("/scans/:id", async (req, res): Promise<void> => {
  const params = DeleteScanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [scan] = await db.delete(scansTable).where(eq(scansTable.id, params.data.id)).returning();
  if (!scan) {
    res.status(404).json({ error: "Scan not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
