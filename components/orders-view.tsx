"use client";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Coffee,
  Printer,
} from "lucide-react";
import { rub, statusText, type Order, type Role, type Status } from "@/lib/api";
import { Brand, Empty } from "./ui";
export const canTransition = (order: Order, role: Role) =>
  (role === "barista" && ["accepted", "preparing"].includes(order.status)) ||
  (role === "cashier" && order.status === "ready");
export const actionText = (status: Status) =>
  status === "accepted"
    ? "Начать готовить"
    : status === "preparing"
      ? "Заказ готов"
      : "Выдать заказ";
const time = (value: string) =>
  new Date(value).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
export function OrdersView({
  queue,
  orders,
  role,
  demo,
  busy,
  open,
  transition,
  refresh,
  page,
  hasMore,
  setPage,
}: {
  queue: boolean;
  orders: Order[];
  role: Role;
  demo: boolean;
  busy: boolean;
  open: (order: Order) => void;
  transition: (order: Order) => void;
  refresh: () => void;
  page: number;
  hasMore: boolean;
  setPage: (page: number) => void;
}) {
  const [tab, setTab] = useState("active");
  const filtered = queue
    ? orders.filter(
        (o) =>
          tab === "all" ||
          (tab === "ready" && o.status === "ready") ||
          (tab === "active" && ["accepted", "preparing"].includes(o.status)),
      )
    : orders;
  return (
    <section className="orders-view">
      <div className="page-heading">
        <div>
          <span className="eyebrow">КАЖДАЯ ЧАШКА — С ЗАБОТОЙ</span>
          <h1>{queue ? "Очередь заказов" : "Заказы"}</h1>
          <p>
            {queue
              ? "Всё под контролем — от первой чашки до выдачи."
              : "История заказов вашей кофейни."}
          </p>
        </div>
        <button className="secondary" disabled={busy} onClick={refresh}>
          <CheckCheck size={17} /> Обновить
        </button>
      </div>
      {queue && (
        <div className="queue-tabs">
          {[
            {
              id: "active",
              title: "В работе",
              count: orders.filter((o) =>
                ["accepted", "preparing"].includes(o.status),
              ).length,
            },
            {
              id: "ready",
              title: "Готовы",
              count: orders.filter((o) => o.status === "ready").length,
            },
            { id: "all", title: "Все", count: orders.length },
          ].map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? "selected" : ""}
              onClick={() => setTab(item.id)}
            >
              {item.title} <span>{item.count}</span>
            </button>
          ))}
          <span className="auto-refresh">
            <i /> {demo ? "Демоочередь" : "Обновление каждые 10 сек."}
          </span>
        </div>
      )}
      <div className="order-grid">
        {filtered.map((order) => (
          <article className="order-card panel" key={order.id}>
            <div className="order-card-top">
              <strong>№ {String(order.id).padStart(3, "0")}</strong>
              <span>{time(order.createdAt)}</span>
              <span className={`status ${order.status}`}>
                {statusText[order.status]}
              </span>
            </div>
            <div className="order-card-body">
              {order.items?.map((item) => (
                <div className="order-mini-line" key={item.menuItemId}>
                  <Coffee size={14} />
                  <span>{item.name}</span>
                  <small>× {item.quantity}</small>
                </div>
              )) || (
                <p className="muted">
                  Кассир № {order.cashierId}
                  <br />
                  Откройте состав заказа
                </p>
              )}
            </div>
            <div className="order-card-bottom">
              <strong>{rub(order.total)}</strong>
              <button
                className="quiet"
                onClick={() => open(order)}
                disabled={busy}
              >
                Подробнее <ChevronRight size={16} />
              </button>
            </div>
            {canTransition(order, role) && (
              <button
                className="primary"
                onClick={() => transition(order)}
                disabled={busy}
              >
                {actionText(order.status)}
                <ArrowRight size={16} />
              </button>
            )}
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className="panel">
          <Empty
            title="Здесь пока тихо"
            text={
              tab === "ready"
                ? "Готовые заказы появятся здесь."
                : "Новые заказы появятся здесь после оформления."
            }
          />
        </div>
      )}
      {!queue && !demo && (
        <div className="pagination">
          <button
            className="secondary"
            disabled={!page || busy}
            onClick={() => setPage(page - 1)}
          >
            <ArrowLeft size={15} /> Назад
          </button>
          <span>Страница {page + 1}</span>
          <button
            className="secondary"
            disabled={!hasMore || busy}
            onClick={() => setPage(page + 1)}
          >
            Далее <ArrowRight size={15} />
          </button>
        </div>
      )}
      <div className="queue-note">
        <Bell size={16} /> Хороший кофе стоит небольшого ожидания.
      </div>
    </section>
  );
}
export function ReceiptView({
  order,
  role,
  busy,
  transition,
  go,
}: {
  order: Order | null;
  role: Role;
  busy: boolean;
  transition: (order: Order) => void;
  go: (view: "menu" | "orders") => void;
}) {
  return (
    <section className="receipt-view">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ВСЁ В ДЕТАЛЯХ</span>
          <h1>
            Заказ {order ? `№ ${String(order.id).padStart(3, "0")}` : "и чек"}
          </h1>
        </div>
        {order && (
          <button className="secondary" onClick={() => window.print()}>
            <Printer size={17} /> Печать
          </button>
        )}
      </div>
      {!order ? (
        <div className="panel">
          <Empty
            title="Выберите заказ"
            text="Откройте заказ из истории или оформите новый, чтобы увидеть его состав."
          />
          <button
            className="secondary empty-action"
            onClick={() => go("orders")}
          >
            Перейти к заказам <ArrowRight size={15} />
          </button>
        </div>
      ) : (
        <div className="receipt-layout">
          <article className="receipt-paper">
            <Brand compact />
            <div className="receipt-title">Состав заказа</div>
            <div className="receipt-meta">
              <strong>№ {String(order.id).padStart(3, "0")}</strong>
              <span>
                {new Date(order.createdAt).toLocaleDateString("ru-RU")} ·{" "}
                {time(order.createdAt)}
              </span>
            </div>
            <div className="receipt-items">
              {order.items?.map((item) => (
                <div key={item.menuItemId}>
                  <span>
                    {item.name}
                    <small>
                      {item.quantity} × {rub(item.unitPrice)}
                    </small>
                  </span>
                  <strong>{rub(item.lineTotal)}</strong>
                </div>
              ))}
            </div>
            <div className="receipt-total">
              <strong>Итого</strong>
              <strong>{rub(order.total)}</strong>
            </div>
            <p className="receipt-disclaimer">
              Информационный документ.
              <br />
              Не является фискальным чеком.
            </p>
            <div className="receipt-thanks">
              <Coffee size={29} strokeWidth={1} />
              <p>Спасибо, что выбрали нас!</p>
              <span>♥</span>
            </div>
          </article>
          <section className="order-progress panel">
            <span className={`status ${order.status}`}>
              {statusText[order.status]}
            </span>
            <h2>
              {order.status === "issued"
                ? "До новой встречи!"
                : order.status === "ready"
                  ? "Можно забирать"
                  : "Готовим с любовью"}
            </h2>
            <p>В каждой чашке — немного хорошего настроения.</p>
            <div className="progress-track">
              {(["accepted", "preparing", "ready", "issued"] as Status[]).map(
                (status, index) => (
                  <div
                    className={
                      index <=
                      ["accepted", "preparing", "ready", "issued"].indexOf(
                        order.status,
                      )
                        ? "done"
                        : ""
                    }
                    key={status}
                  >
                    <span>
                      {index <
                      ["accepted", "preparing", "ready", "issued"].indexOf(
                        order.status,
                      ) ? (
                        <Check size={12} />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <small>{statusText[status]}</small>
                  </div>
                ),
              )}
            </div>
            {canTransition(order, role) && (
              <button
                className="primary"
                disabled={busy}
                onClick={() => transition(order)}
              >
                {actionText(order.status)}
                <ArrowRight size={16} />
              </button>
            )}
            <button className="secondary full" onClick={() => go("menu")}>
              Вернуться в меню <ArrowRight size={15} />
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
