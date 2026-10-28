export type Role = "cashier" | "barista" | "admin";
export type User = { login: string; roles: string[] };
export type Category = { id: number; name: string };
export type MenuItem = {
  id: number;
  categoryId: number;
  name: string;
  price: number;
  available: boolean;
};
export type Status = "accepted" | "preparing" | "ready" | "issued";
export type OrderItem = {
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};
export type Order = {
  id: number;
  createdAt: string;
  cashierId: number;
  status: Status;
  total: number;
  items?: OrderItem[];
};
export type Sale = { day: string; ordersCount: number; revenue: number };
export const rub = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
export const statusText: Record<Status, string> = {
  accepted: "В очереди",
  preparing: "Готовится",
  ready: "Готов",
  issued: "Выдан",
};
export const roleText: Record<Role, string> = {
  cashier: "Кассир",
  barista: "Бариста",
  admin: "Администратор",
};
export const photo = (name: string) => {
  const key = name.toLowerCase();
  if (/круас|булоч|выпеч/.test(key)) return "/images/croissant.jpg";
  if (/чиз|мафф|торт|десерт/.test(key)) return "/images/cake.jpg";
  if (/чай/.test(key)) return "/images/tea.jpg";
  if (/эспресс|америк/.test(key)) return "/images/espresso.jpg";
  if (/латте|раф/.test(key)) return "/images/latte-warm.jpg";
  return "/images/cappuccino.jpg";
};
export const volume = (name: string) =>
  /эспресс/i.test(name)
    ? "30 мл"
    : /америк|чай/i.test(name)
      ? "200 мл"
      : /круас|булоч|мафф|чиз/i.test(name)
        ? "1 порция"
        : "350 мл";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
let csrf: { headerName: string; token: string } | null = null;
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (method !== "GET") {
    if (!csrf) {
      const result = await fetch("/api/auth/csrf", { cache: "no-store" });
      if (!result.ok)
        throw new ApiError(
          "Не удалось получить токен безопасности",
          result.status,
        );
      csrf = await result.json();
    }
    if (csrf) headers[csrf.headerName] = csrf.token;
    headers["Content-Type"] =
      body instanceof URLSearchParams
        ? "application/x-www-form-urlencoded"
        : "application/json";
  }
  const result = await fetch(`/api${path}`, {
    method,
    headers,
    cache: "no-store",
    body:
      body === undefined
        ? undefined
        : body instanceof URLSearchParams
          ? body.toString()
          : JSON.stringify(body),
  });
  if (
    path === "/auth/login" ||
    path === "/auth/logout" ||
    result.status === 403
  )
    csrf = null;
  if (result.status === 204) return undefined as T;
  const data = await result
    .json()
    .catch(() => ({ message: "Сервер вернул некорректный ответ" }));
  if (!result.ok)
    throw new ApiError(
      data.message || "Не удалось выполнить запрос",
      result.status,
    );
  return data as T;
}
