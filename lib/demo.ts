import type { Category, MenuItem, Order, Sale } from "./api";
export const categories: Category[] = [
  { id: 1, name: "Кофе" },
  { id: 2, name: "Чай" },
  { id: 3, name: "Выпечка" },
  { id: 4, name: "Десерты" },
];
export const menu: MenuItem[] = [
  { id: 1, categoryId: 1, name: "Эспрессо", price: 120, available: true },
  { id: 2, categoryId: 1, name: "Американо", price: 150, available: true },
  { id: 3, categoryId: 1, name: "Капучино", price: 200, available: true },
  { id: 4, categoryId: 1, name: "Латте", price: 220, available: true },
  { id: 5, categoryId: 1, name: "Раф", price: 260, available: true },
  { id: 6, categoryId: 2, name: "Чай чёрный", price: 100, available: true },
  { id: 7, categoryId: 2, name: "Чай зелёный", price: 100, available: true },
  { id: 8, categoryId: 3, name: "Круассан", price: 160, available: true },
  { id: 9, categoryId: 3, name: "Маффин", price: 140, available: true },
  {
    id: 10,
    categoryId: 3,
    name: "Булочка с корицей",
    price: 180,
    available: false,
  },
  { id: 11, categoryId: 4, name: "Чизкейк", price: 250, available: true },
  { id: 12, categoryId: 1, name: "Флэт уайт", price: 190, available: true },
];
export function demoOrders(): Order[] {
  return ["preparing", "preparing", "accepted", "ready", "issued"].map(
    (status, index) => {
      const item = menu[index + 2];
      return {
        id: 42 + index,
        createdAt: new Date(
          Date.now() - (20 - index * 3) * 60000,
        ).toISOString(),
        cashierId: 1,
        status: status as Order["status"],
        total: item.price + 160,
        items: [
          {
            menuItemId: item.id,
            name: item.name,
            quantity: 1,
            unitPrice: item.price,
            lineTotal: item.price,
          },
          {
            menuItemId: 8,
            name: "Круассан",
            quantity: 1,
            unitPrice: 160,
            lineTotal: 160,
          },
        ],
      };
    },
  );
}
export function demoSales(from: string, to: string): Sale[] {
  const days: Sale[] = [];
  const cursor = new Date(`${from}T12:00:00`);
  for (
    let i = 0;
    cursor <= new Date(`${to}T23:59:59`) && i < 367;
    i++, cursor.setDate(cursor.getDate() + 1)
  )
    days.push({
      day: dateKey(cursor),
      ordersCount: 31 + ((i * 13) % 29),
      revenue: 12450 + ((i * 3231) % 13000),
    });
  return days;
}
export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
