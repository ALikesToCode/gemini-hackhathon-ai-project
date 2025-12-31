import { kv } from "@vercel/kv";
import { promises as fs } from "fs";
import path from "path";
import {
  CoachSession,
  JobStatus,
  Pack,
  PackSummary,
  PackDraft,
  StoryboardSpec,
  TranscriptSegment,
  VaultDoc
} from "./types";

const STORE_PATH = path.join(process.cwd(), "data", "store.json");
const USE_KV = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
);

type LocalStoreShape = {
  jobs: Record<string, JobStatus>;
  packs: Record<string, Pack>;
  vault: Record<string, VaultDoc>;
  transcripts: Record<string, TranscriptSegment[]>;
  storyboards: Record<string, StoryboardSpec>;
  coachSessions: Record<string, CoachSession>;
  drafts: Record<string, PackDraft>;
};

async function readLocalStore(): Promise<LocalStoreShape> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as LocalStoreShape;
    return {
      jobs: parsed.jobs ?? {},
      packs: parsed.packs ?? {},
      vault: parsed.vault ?? {},
      transcripts: parsed.transcripts ?? {},
      storyboards: parsed.storyboards ?? {},
      coachSessions: parsed.coachSessions ?? {},
      drafts: parsed.drafts ?? {}
    };
  } catch {
    return {
      jobs: {},
      packs: {},
      vault: {},
      transcripts: {},
      storyboards: {},
      coachSessions: {},
      drafts: {}
    };
  }
}

async function writeLocalStore(next: LocalStoreShape) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(next, null, 2), "utf-8");
}

export async function getJob(jobId: string) {
  if (USE_KV) {
    return (await kv.get<JobStatus>(`job:${jobId}`)) ?? null;
  }
  const store = await readLocalStore();
  return store.jobs[jobId] ?? null;
}

export async function setJob(job: JobStatus) {
  if (USE_KV) {
    await kv.set(`job:${job.id}`, job);
    return;
  }
  const store = await readLocalStore();
  store.jobs[job.id] = job;
  await writeLocalStore(store);
}

export async function updateJob(jobId: string, updates: Partial<JobStatus>) {
  const current = await getJob(jobId);
  if (!current) return null;
  const next = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  await setJob(next);
  return next;
}

export async function getPack(packId: string) {
  if (USE_KV) {
    return (await kv.get<Pack>(`pack:${packId}`)) ?? null;
  }
  const store = await readLocalStore();
  return store.packs[packId] ?? null;
}

export async function setPack(pack: Pack) {
  if (USE_KV) {
    await kv.set(`pack:${pack.id}`, pack);
    await kv.sadd("packs:index", pack.id);
    return;
  }
  const store = await readLocalStore();
  store.packs[pack.id] = pack;
  await writeLocalStore(store);
}

export async function updatePack(packId: string, updates: Partial<Pack>) {
  const current = await getPack(packId);
  if (!current) return null;
  const next = { ...current, ...updates };
  await setPack(next);
  return next;
}

export async function deletePack(packId: string) {
  if (USE_KV) {
    await kv.del(`pack:${packId}`);
    await kv.srem("packs:index", packId);
    return true;
  }
  const store = await readLocalStore();
  if (!store.packs[packId]) return false;
  delete store.packs[packId];
  await writeLocalStore(store);
  return true;
}

export async function getVaultDoc(docId: string) {
  if (USE_KV) {
    return (await kv.get<VaultDoc>(`vault:${docId}`)) ?? null;
  }
  const store = await readLocalStore();
  return store.vault[docId] ?? null;
}

export async function setVaultDoc(doc: VaultDoc) {
  if (USE_KV) {
    await kv.set(`vault:${doc.id}`, doc);
    await kv.sadd("vault:index", doc.id);
    return;
  }
  const store = await readLocalStore();
  store.vault[doc.id] = doc;
  await writeLocalStore(store);
}

export async function listVaultDocs() {
  if (USE_KV) {
    const ids = (await kv.smembers<string>("vault:index")) ?? [];
    const docs = await Promise.all(ids.map((id) => kv.get<VaultDoc>(`vault:${id}`)));
    return docs.filter(Boolean) as VaultDoc[];
  }
  const store = await readLocalStore();
  return Object.values(store.vault);
}

export async function getTranscript(videoId: string) {
  if (USE_KV) {
    return (await kv.get<TranscriptSegment[]>(`transcript:${videoId}`)) ?? null;
  }
  const store = await readLocalStore();
  return store.transcripts[videoId] ?? null;
}

export async function setTranscript(videoId: string, segments: TranscriptSegment[]) {
  if (USE_KV) {
    await kv.set(`transcript:${videoId}`, segments);
    return;
  }
  const store = await readLocalStore();
  store.transcripts[videoId] = segments;
  await writeLocalStore(store);
}

export async function getDraft(jobId: string) {
  if (USE_KV) {
    return (await kv.get<PackDraft>(`draft:${jobId}`)) ?? null;
  }
  const store = await readLocalStore();
  return store.drafts[jobId] ?? null;
}

export async function setDraft(draft: PackDraft) {
  if (USE_KV) {
    await kv.set(`draft:${draft.jobId}`, draft);
    return;
  }
  const store = await readLocalStore();
  store.drafts[draft.jobId] = draft;
  await writeLocalStore(store);
}

export async function deleteDraft(jobId: string) {
  if (USE_KV) {
    await kv.del(`draft:${jobId}`);
    return true;
  }
  const store = await readLocalStore();
  if (!store.drafts[jobId]) return false;
  delete store.drafts[jobId];
  await writeLocalStore(store);
  return true;
}

export async function getStoryboard(videoId: string) {
  if (USE_KV) {
    return (await kv.get<StoryboardSpec>(`storyboard:${videoId}`)) ?? null;
  }
  const store = await readLocalStore();
  return store.storyboards[videoId] ?? null;
}

export async function setStoryboard(videoId: string, spec: StoryboardSpec) {
  if (USE_KV) {
    await kv.set(`storyboard:${videoId}`, spec);
    return;
  }
  const store = await readLocalStore();
  store.storyboards[videoId] = spec;
  await writeLocalStore(store);
}

export async function getCoachSession(sessionId: string) {
  if (USE_KV) {
    return (await kv.get<CoachSession>(`coach:${sessionId}`)) ?? null;
  }
  const store = await readLocalStore();
  return store.coachSessions[sessionId] ?? null;
}

export async function setCoachSession(session: CoachSession) {
  if (USE_KV) {
    await kv.set(`coach:${session.id}`, session);
    return;
  }
  const store = await readLocalStore();
  store.coachSessions[session.id] = session;
  await writeLocalStore(store);
}

export async function updateCoachSession(
  sessionId: string,
  updates: Partial<CoachSession>
) {
  const current = await getCoachSession(sessionId);
  if (!current) return null;
  const next = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  await setCoachSession(next);
  return next;
}

export async function deleteCoachSession(sessionId: string) {
  if (USE_KV) {
    await kv.del(`coach:${sessionId}`);
    return true;
  }
  const store = await readLocalStore();
  if (!store.coachSessions[sessionId]) return false;
  delete store.coachSessions[sessionId];
  await writeLocalStore(store);
  return true;
}

export async function listPacks(): Promise<PackSummary[]> {
  if (USE_KV) {
    const ids = (await kv.smembers<string>("packs:index")) ?? [];
    const packs = await Promise.all(
      ids.map((id) => kv.get<Pack>(`pack:${id}`))
    );
    return packs
      .filter(Boolean)
      .map((pack) => ({
        id: pack!.id,
        title: pack!.title,
        createdAt: pack!.createdAt,
        input: pack!.input
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const store = await readLocalStore();
  return Object.values(store.packs)
    .map((pack) => ({
      id: pack.id,
      title: pack.title,
      createdAt: pack.createdAt,
      input: pack.input
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
