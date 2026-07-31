import { ContractError } from "./errors.mjs";
import { newId } from "./mock-store.mjs";

/**
 * Persist an explicit slug lock when the first managed resource reaches `created`.
 * Status transitions never unlock the slug.
 */
export function markManagedResourceCreated(
  store,
  {
    client_id,
    resource_id = null,
    resource_type = "cloudflare_pages",
    nowMs = Date.now(),
  }
) {
  const client = store.clients.get(client_id);
  if (!client) throw new ContractError("not_found", "client_id");

  const id = resource_id || newId();
  const resource = {
    resource_id: id,
    client_id,
    resource_type,
    status: "created",
    created_at: new Date(nowMs).toISOString(),
  };
  store.managed_resources.set(id, resource);

  if (!client.slug_locked) {
    client.slug_locked = true;
    client.slug_locked_at = new Date(nowMs).toISOString();
    client.slug_locked_by_resource_id = id;
    client.slug_locked_reason = "first_managed_resource_created";
    store.clients.set(client_id, client);
    store.workflow_events.push({
      event_type: "slug_locked",
      client_id,
      payload: {
        slug_locked: true,
        slug_locked_at: client.slug_locked_at,
        slug_locked_by_resource_id: id,
        slug_locked_reason: "first_managed_resource_created",
      },
    });
  }

  return { client: { ...client }, resource };
}

export function assertSlugChangeAllowed(store, client_id, nextSlug) {
  const client = store.clients.get(client_id);
  if (!client) throw new ContractError("not_found", "client_id");
  if (!nextSlug || nextSlug === client.client_slug) return true;
  if (client.slug_locked === true) {
    throw new ContractError(
      "slug_locked",
      "client_slug is locked after first managed resource creation and never unlocks"
    );
  }
  return true;
}

export function renameClientSlug(store, { client_id, next_slug, actor }) {
  if (!actor) throw new ContractError("invalid_argument", "actor is required");
  assertSlugChangeAllowed(store, client_id, next_slug);
  const client = store.clients.get(client_id);
  const previous = client.client_slug;
  client.client_slug = next_slug;
  store.clients.set(client_id, client);
  store.workflow_events.push({
    event_type: "slug_renamed",
    client_id,
    actor,
    payload: { from: previous, to: next_slug },
  });
  return { ...client };
}
