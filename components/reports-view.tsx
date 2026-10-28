"use client";
import { useEffect, useState } from "react";
import {
  BarChart3,
  LoaderCircle,
  ReceiptText,
  ShoppingBag,
} from "lucide-react";
import { api, rub, type Sale } from "@/lib/api";
import { dateKey, demoSales } from "@/lib/demo";
import { Empty } from "./ui";
export default function ReportsView({
  demo,
  fail,
}: {
  demo: boolean;
  fail: (error: unknown) => void;
}) {
  const [from, setFrom] = useState(() => {
      const date = new Date();
      date.setDate(date.getDate() - 6);
      return dateKey(date);
    }),
    [to, setTo] = useState(() => dateKey(new Date())),
    [sales, setSales] = useState<Sale[]>([]),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!from || !to || from > to) {
      setSales([]);
      return;
    }
    let ignore = false;
    setLoading(true);
    const request = demo
      ? Promise.resolve(demoSales(from, to))
      : api<Sale[]>(`/reports/sales?from=${from}&to=${to}`);
    request
      .then((data) => {
        if (!ignore) setSales(data);
      })
      .catch((error) => {
        if (!ignore) {
          setSales([]);
          fail(error);
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [from, to, demo, fail]);
  const revenue = sales.reduce((sum, day) => sum + Number(day.revenue), 0),
    count = sales.reduce((sum, day) => sum + Number(day.ordersCount), 0);
  return (
    <section className="reports-view">
      <div className="page-heading">
        <div>
          <span className="eyebrow">КОФЕ В ЦИФРАХ</span>
          <h1>Отчёт</h1>
          <p>Результаты, за которыми стоит ваша команда.</p>
        </div>
        <span className="report-caption">По выданным заказам</span>
      </div>
      <div className="report-filters">
        <label>
          С{" "}
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            required
            max={to}
          />
        </label>
        <label>
          По{" "}
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
            min={from}
          />
        </label>
        {[1, 7, 30].map((days) => (
          <button
            key={days}
            onClick={() => {
              const date = new Date();
              date.setDate(date.getDate() - days + 1);
              setFrom(dateKey(date));
              setTo(dateKey(new Date()));
            }}
          >
            {days === 1 ? "Сегодня" : `${days} дней`}
          </button>
        ))}
      </div>
      {from > to && (
        <div className="alert">
          Дата начала должна быть раньше даты окончания.
        </div>
      )}
      <div className="stat-grid">
        <article className="stat-card panel">
          <span>Стоимость выданных заказов</span>
          <strong>{rub(revenue)}</strong>
          <BarChart3 size={22} />
        </article>
        <article className="stat-card panel">
          <span>Заказов</span>
          <strong>{count}</strong>
          <ShoppingBag size={22} />
        </article>
        <article className="stat-card panel">
          <span>Средний заказ</span>
          <strong>{rub(count ? revenue / count : 0)}</strong>
          <ReceiptText size={22} />
        </article>
      </div>
      <section className="chart-panel panel">
        <div className="section-heading">
          <div>
            <h2>Динамика по дням</h2>
            <p>Стоимость заказов, выданных в выбранный день</p>
          </div>
          <span className="chart-legend">
            <i /> Сумма заказов
          </span>
        </div>
        {loading ? (
          <div className="empty">
            <LoaderCircle className="spin" />
          </div>
        ) : !sales.length ? (
          <Empty
            title="Пока нет данных"
            text="В выбранном периоде ещё нет выданных заказов."
          />
        ) : (
          <div
            className="chart"
            role="img"
            aria-label="Столбчатая диаграмма суммы заказов по дням"
          >
            {sales.map((day) => (
              <div
                className="chart-column"
                key={day.day}
                title={`${day.day}: ${rub(Number(day.revenue))}, ${day.ordersCount} заказов`}
              >
                <span>{rub(Number(day.revenue))}</span>
                <div
                  style={{
                    height: `${Math.max(2, (Number(day.revenue) / Math.max(1, ...sales.map((s) => Number(s.revenue)))) * 190)}px`,
                  }}
                />
                <small>
                  {new Date(`${day.day}T12:00:00`).toLocaleDateString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </small>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="panel report-table">
        <h2>Подробности по дням</h2>
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Заказов</th>
              <th>Средний заказ</th>
              <th>Сумма</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((day) => (
              <tr key={day.day}>
                <td>
                  {new Date(`${day.day}T12:00:00`).toLocaleDateString("ru-RU")}
                </td>
                <td>{day.ordersCount}</td>
                <td>
                  {rub(
                    day.ordersCount ? Number(day.revenue) / day.ordersCount : 0,
                  )}
                </td>
                <td>{rub(Number(day.revenue))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
