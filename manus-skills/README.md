# Manus Skills — Dealer Website Fulfillment

Built to match [Manus Skills](https://manus.im/docs/features/skills) and the [share/import guide](https://help.manus.im/en/articles/14753565-how-to-share-and-use-skills-in-manus):

| Manus rule | How this pack complies |
|---|---|
| Modular, file-system-based | Five separate skill folders, each with its own `SKILL.md` |
| Progressive disclosure | Level 1 = YAML `name`/`description`; Level 2 = short `SKILL.md` body; Level 3 = `references/`, `scripts/`, `templates/` loaded on demand |
| Level 2 &lt; ~5k tokens | Each `SKILL.md` is intentionally short; long tables live in `references/` |
| Composability | Orchestrator routes intake → hydrate → wiring → launch |
| Standard dirs | `scripts/`, `references/`, `templates/` (not a single mega-skill) |
| Trigger | In Manus chat: type `/` and pick a skill |

## Skills in this pack

| Folder | Slash name | Job |
|---|---|---|
| `dealer-site-orchestrator/` | `/dealer-site-orchestrator` | Router + laws + checklist |
| `dealer-site-intake/` | `/dealer-site-intake` | Scaffold, validate config, images |
| `dealer-site-hydrate/` | `/dealer-site-hydrate` | Build `dist/` safely |
| `dealer-site-wiring/` | `/dealer-site-wiring` | Ten IDs live verification |
| `dealer-site-launch/` | `/dealer-site-launch` | Gate, IndexNow, launch + day-7 |

## How to put these into a Manus project

### Option A — Upload folders (recommended)

1. In Manus, open your **Project** (dealer website fulfillment).  
2. Open **Skills** for that project → **+ Add** → **Upload a skill**.  
3. Upload **each** of the five folders (or zip each folder first — one skill per zip).  
4. Lock them on the project if you do not want teammates editing the workflow.  
5. Paste `PROJECT_MASTER_INSTRUCTION.md` into the project’s **master instruction**.

### Option B — GitHub import

Manus GitHub import expects **`SKILL.md` at the repository root** for a single-skill repo. This pack is multi-skill, so either:

- Upload folders (Option A), or  
- Create five small public repos each containing one skill’s files at root, or  
- Zip each skill folder and upload.

### Option C — Zip locally

From this repo root:

```bash
cd manus-skills
for d in dealer-site-*; do zip -r "${d}.zip" "$d"; done
```

Upload each `.zip` via **Upload a skill**.

## Using in chat

1. Start a task **inside the Manus project**.  
2. Type `/dealer-site-orchestrator` (or ask “build a site for X Spas”).  
3. Manus should follow the orchestrator and pull the other skills / Level-3 files as needed.  
4. You can also slash a specialty skill directly (e.g. `/dealer-site-launch` for gate only).

## Security note (from Manus docs)

These skills include **executable Node scripts** (`gate.mjs`, `new-client.mjs`, etc.). Before first use in a new workspace, ask Manus:

> Review the Skill named dealer-site-launch. Analyze its SKILL.md and scripts. Explain what it does, identify any potential security risks, and tell me if it’s safe to use.

## Relation to `skills/client-site-build/`

The older single-folder skill remains as a **legacy pointer**. **Manus project installs should use `manus-skills/`** — this is the Manus-compliant pack.
