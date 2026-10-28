"use client";
import {
  ArrowRight,
  ChevronRight,
  Coffee,
  Crown,
  Leaf,
  Plus,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import {
  rub,
  volume,
  type MenuItem,
  type Category,
  type Role,
} from "@/lib/api";
import { Empty, FoodImage, Stepper, type CartLine } from "./ui";
export function MenuView({
  menu,
  categories,
  role,
  busy,
  search,
  category,
  setCategory,
  add,
  show,
  edit,
  newItem,
  cart,
  change,
  clear,
  checkout,
  cartOpen,
  closeCart,
}: {
  menu: MenuItem[];
  categories: Category[];
  role: Role;
  busy: boolean;
  search: string;
  category: number;
  setCategory: (id: number) => void;
  add: (item: MenuItem) => void;
  show: (item: MenuItem) => void;
  edit: (item: MenuItem) => void;
  newItem: () => void;
  cart: CartLine[];
  change: (id: number, delta: number) => void;
  clear: () => void;
  checkout: () => void;
  cartOpen: boolean;
  closeCart: () => void;
}) {
  const filtered = menu.filter(
    (item) =>
      (!category || item.categoryId === category) &&
      item.name.toLowerCase().includes(search.toLowerCase()),
  );
  const count = cart.reduce((sum, line) => sum + line.quantity, 0),
    total = cart.reduce(
      (sum, line) => sum + line.item.price * line.quantity,
      0,
    );
  return (
    <div className={`menu-layout ${role !== "cashier" ? "no-cart" : ""}`}>
      <section className="menu-panel panel">
        <div className="category-tabs">
          <button
            className={!category ? "selected" : ""}
            onClick={() => setCategory(0)}
          >
            Все
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={category === cat.id ? "selected" : ""}
              onClick={() => setCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
          {role === "admin" && (
            <button onClick={newItem}>
              <Plus size={15} /> Позиция
            </button>
          )}
        </div>
        <div className="menu-intro">
          <div>
            <span className="eyebrow">СВЕЖИЙ КОФЕ. КАЖДЫЙ ДЕНЬ.</span>
            <h1>Что приготовим сегодня?</h1>
          </div>
          <Coffee size={32} strokeWidth={1} />
        </div>
        {!filtered.length ? (
          <Empty
            title="Ничего не нашлось"
            text="Попробуйте другое название или выберите другую категорию."
          />
        ) : (
          categories
            .filter((cat) =>
              filtered.some((item) => item.categoryId === cat.id),
            )
            .map((cat) => (
              <section className="menu-category" key={cat.id}>
                <div className="category-heading">
                  <h2>{cat.name}</h2>
                  <span>
                    {
                      filtered.filter((item) => item.categoryId === cat.id)
                        .length
                    }{" "}
                    позиций
                  </span>
                </div>
                <div className="product-grid">
                  {filtered
                    .filter((item) => item.categoryId === cat.id)
                    .map((item) => (
                      <article
                        className={`product-card ${!item.available ? "unavailable" : ""}`}
                        key={item.id}
                      >
                        <button
                          className="product-image-button"
                          onClick={() => show(item)}
                          aria-label={`Подробнее: ${item.name}`}
                        >
                          <FoodImage name={item.name} />
                          {!item.available && (
                            <span className="unavailable-tag">
                              Временно нет
                            </span>
                          )}
                        </button>
                        <div className="product-body">
                          <button
                            className="product-name"
                            onClick={() => show(item)}
                          >
                            {item.name}
                          </button>
                          <span className="product-volume">
                            {volume(item.name)}
                          </span>
                          <div className="product-bottom">
                            <strong>{rub(item.price)}</strong>
                            {role === "admin" ? (
                              <button
                                className="add-button"
                                onClick={() => edit(item)}
                                aria-label={`Изменить ${item.name}`}
                              >
                                <SlidersHorizontal size={15} />
                              </button>
                            ) : role === "cashier" ? (
                              <button
                                className="add-button"
                                onClick={() => add(item)}
                                disabled={!item.available || busy}
                                aria-label={`Добавить ${item.name}`}
                              >
                                <Plus size={18} />
                              </button>
                            ) : (
                              <span className="available-dot" />
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                </div>
              </section>
            ))
        )}
        <div className="menu-footer">
          <Leaf size={15} /> Создаём маленькие поводы для хорошего дня.
        </div>
      </section>
      {role === "cashier" && (
        <div className="right-column">
          <aside
            className={`cart-panel panel ${cartOpen ? "mobile-open" : ""}`}
          >
            <div className="section-heading">
              <h2>
                Текущий заказ <span className="count">{count}</span>
              </h2>
              <button
                className="quiet clear-cart"
                aria-label="Очистить корзину"
                onClick={clear}
                disabled={!cart.length || busy}
              >
                <Trash2 size={14} />
                <span>Очистить</span>
              </button>
              <button
                className="mobile-close icon-button"
                aria-label="Закрыть корзину"
                onClick={closeCart}
              >
                <X size={20} />
              </button>
            </div>
            <div className="cart-lines">
              {!cart.length ? (
                <Empty
                  title="Начнём с кофе?"
                  text="Выберите что-нибудь в меню — здесь появится ваш заказ."
                />
              ) : (
                cart.map(({ item, quantity }) => (
                  <div className="cart-line" key={item.id}>
                    <FoodImage name={item.name} />
                    <div className="cart-line-main">
                      <strong>{item.name}</strong>
                      <small>{volume(item.name)}</small>
                      <Stepper
                        value={quantity}
                        onChange={(delta) => change(item.id, delta)}
                        disabled={busy}
                      />
                    </div>
                    <b>{rub(item.price * quantity)}</b>
                  </div>
                ))
              )}
            </div>
            <div className="cart-summary">
              <div>
                <span>Сумма заказа</span>
                <span>{rub(total)}</span>
              </div>
              <div className="muted">
                <span>Позиций</span>
                <span>{count}</span>
              </div>
              <div className="grand-total">
                <strong>Итого</strong>
                <strong>{rub(total)}</strong>
              </div>
              <button
                className="primary"
                disabled={!cart.length || busy}
                onClick={checkout}
              >
                {busy ? "Оформляем…" : "Оформить заказ"}
                <ArrowRight size={17} />
              </button>
              <p className="micro">Заказ сразу появится в очереди бариста</p>
            </div>
          </aside>
          <section className="quick-panel panel">
            <div className="section-heading">
              <div className="quick-heading">
                <Crown size={18} />
                <div>
                  <h2>Быстрый выбор</h2>
                  <small>Любимое — всегда под рукой</small>
                </div>
              </div>
              <ChevronRight size={17} />
            </div>
            {menu
              .filter((item) => item.available)
              .slice(0, 5)
              .map((item, index) => (
                <button
                  className="quick-item"
                  key={item.id}
                  onClick={() => add(item)}
                  disabled={busy}
                >
                  <span className="quick-rank">{index + 1}</span>
                  <FoodImage name={item.name} />
                  <span>
                    {item.name}
                    <small>{volume(item.name)}</small>
                  </span>
                  <strong>{rub(item.price)}</strong>
                  <Plus size={14} />
                </button>
              ))}
          </section>
        </div>
      )}
    </div>
  );
}
