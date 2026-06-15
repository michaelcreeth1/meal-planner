import { HomeAssistantShoppingList, HomeAssistantShoppingListItem, ShoppingList, ShoppingListItem } from "../../shared/domain.js";

export type HomeAssistantShoppingListExport = {
  addedCount: number;
  duplicateCount: number;
  skippedCount: number;
  items: string[];
  duplicates: string[];
};

export function isHomeAssistantConfigured(): boolean {
  return Boolean(getHomeAssistantToken());
}

export function getHomeAssistantUrl(): string {
  return (process.env.HOME_ASSISTANT_URL ?? "http://ha.home.arpa").replace(/\/+$/, "");
}

export function getHomeAssistantTodoEntityId(): string {
  return process.env.HOME_ASSISTANT_TODO_ENTITY_ID?.trim() || "todo.safeway_list";
}

export async function getHomeAssistantShoppingList(): Promise<HomeAssistantShoppingList> {
  const token = getHomeAssistantToken();
  if (!token) {
    return {
      configured: false,
      title: "Home Assistant list",
      url: getHomeAssistantUrl(),
      todoEntityId: getHomeAssistantTodoEntityId(),
      items: []
    };
  }

  return {
    configured: true,
    title: "Home Assistant list",
    url: getHomeAssistantUrl(),
    todoEntityId: getHomeAssistantTodoEntityId(),
    items: (await getHomeAssistantTodoItems(token, ["needs_action", "completed"])).map(mapHomeAssistantTodoItem)
  };
}

export async function sendShoppingListToHomeAssistant(
  list: ShoppingList,
  input: { itemIds?: string[] } = {}
): Promise<HomeAssistantShoppingListExport> {
  const token = getHomeAssistantToken();
  if (!token) {
    throw new HomeAssistantConfigurationError(
      "Home Assistant is not configured. Set HOME_ASSISTANT_TOKEN on the backend."
    );
  }

  const selectedIds = input.itemIds ? new Set(input.itemIds) : null;
  const selectedItems = list.items.filter((item) => !selectedIds || selectedIds.has(item.id));
  const items = selectedItems
    .map(formatShoppingListItem)
    .filter(Boolean);
  const existingItems = await getHomeAssistantTodoItems(token, ["needs_action"]);
  const existingNames = new Set(existingItems.map((item) => duplicateKey(item.summary)));
  const duplicates: string[] = [];
  const itemsToAdd: string[] = [];

  for (const item of items) {
    if (existingNames.has(duplicateKey(item))) {
      duplicates.push(item);
      continue;
    }
    existingNames.add(duplicateKey(item));
    itemsToAdd.push(item);
  }

  for (const item of itemsToAdd) {
    await callHomeAssistantTodoAddItem(item, token);
  }

  return {
    addedCount: itemsToAdd.length,
    duplicateCount: duplicates.length,
    skippedCount: list.items.length - selectedItems.length + duplicates.length,
    items: itemsToAdd,
    duplicates
  };
}

export class HomeAssistantConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HomeAssistantConfigurationError";
  }
}

export class HomeAssistantRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HomeAssistantRequestError";
  }
}

function getHomeAssistantToken(): string | undefined {
  const token = process.env.HOME_ASSISTANT_TOKEN?.trim();
  return token || undefined;
}

function formatShoppingListItem(item: ShoppingListItem): string {
  return item.quantity ? `${item.quantity} ${item.name}` : item.name;
}

type HomeAssistantTodoItem = {
  summary: string;
  uid?: string;
  status?: string;
};

async function getHomeAssistantTodoItems(
  token: string,
  statuses: Array<"needs_action" | "completed">
): Promise<HomeAssistantTodoItem[]> {
  const response = await fetch(`${getHomeAssistantUrl()}/api/services/todo/get_items?return_response`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      entity_id: getHomeAssistantTodoEntityId(),
      status: statuses
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new HomeAssistantRequestError(
      `Home Assistant could not read the Safeway list (${response.status} ${response.statusText})${body ? `: ${body}` : ""}`
    );
  }

  const payload = (await response.json()) as {
    service_response?: Record<string, { items?: HomeAssistantTodoItem[] }>;
  };
  return payload.service_response?.[getHomeAssistantTodoEntityId()]?.items ?? [];
}

function mapHomeAssistantTodoItem(item: HomeAssistantTodoItem): HomeAssistantShoppingListItem {
  return {
    id: item.uid ?? `${item.status ?? "unknown"}:${item.summary}`,
    name: item.summary,
    status: item.status ?? null
  };
}

async function callHomeAssistantTodoAddItem(item: string, token: string): Promise<void> {
  const response = await fetch(`${getHomeAssistantUrl()}/api/services/todo/add_item`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      entity_id: getHomeAssistantTodoEntityId(),
      item
    })
  });

  if (response.ok) return;

  const body = await response.text().catch(() => "");
  throw new HomeAssistantRequestError(
    `Home Assistant rejected "${item}" (${response.status} ${response.statusText})${body ? `: ${body}` : ""}`
  );
}

function duplicateKey(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
