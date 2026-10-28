"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  Coffee,
  Grid2X2,
  Leaf,
  LoaderCircle,
  LogOut,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import {
  api,
  ApiError,
  roleText,
  rub,
  statusText,
  volume,
  type Category,
  type MenuItem,
  type Order,
  type Role,
  type Status,
  type User,
} from "@/lib/api";
import {
  categories as sampleCategories,
  menu as sampleMenu,
  demoOrders,
} from "@/lib/demo";
import { Brand, FoodImage, Modal, Stepper, type CartLine } from "./ui";
import { MenuView } from "./menu-view";
import { OrdersView, ReceiptView } from "./orders-view";
import ReportsView from "./reports-view";
type View = "menu" | "orders" | "queue" | "receipt" | "reports" | "settings";
const navigation = [
  { id: "menu", title: "Меню", icon: Coffee },
  { id: "orders", title: "Заказы", icon: ShoppingBag },
  { id: "queue", title: "Очередь", icon: Grid2X2 },
  { id: "receipt", title: "Чек", icon: ReceiptText },
  { id: "reports", title: "Отчёт", icon: BarChart3 },
] as const;
export default function CoffeeApp() {
  const [user, setUser] = useState<User | null>(null),
    [checking, setChecking] = useState(true),
    [demo, setDemo] = useState(false),
    [role, setRole] = useState<Role>("cashier");
  const [view, setView] = useState<View>("menu"),
    [now, setNow] = useState<Date | null>(null),
    [menu, setMenu] = useState<MenuItem[]>([]),
    [categories, setCategories] = useState<Category[]>([]),
    [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState(0),
    [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState<MenuItem | null>(null),
    [quantity, setQuantity] = useState(1),
    [receipt, setReceipt] = useState<Order | null>(null),
    [edit, setEdit] = useState<MenuItem | null>(null),
    [createItem, setCreateItem] = useState(false);
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [page, setPage] = useState(0),
    [hasMore, setHasMore] = useState(false);
  const [queueOrders, setQueueOrders] = useState<Order[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useCallback((message: string) => {
    setNotice(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setNotice(""), 4000);
  }, []);
  const fail = useCallback((reason: unknown) => {
    setError(
      reason instanceof Error
        ? reason.message
        : "Не удалось выполнить действие",
    );
    if (reason instanceof ApiError && reason.status === 401) {
      setUser(null);
      setCart([]);
    }
  }, []);
  useEffect(() => {
    api<User>("/auth/me")
      .then((account) => {
        setUser(account);
        const r = (account.roles[0]?.replace("ROLE_", "") || "cashier") as Role;
        setRole(r);
        if (r === "barista") setView("queue");
      })
      .catch((reason) => {
        if (reason instanceof ApiError && reason.status === 404)
          setError(
            "На сервере недоступна авторизация. Перезапустите обновлённый backend.",
          );
        else if (!(reason instanceof ApiError) || reason.status !== 401)
          setError(reason.message);
      })
      .finally(() => setChecking(false));
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => {
      clearInterval(timer);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);
  const loadOrders = useCallback(async (nextPage = 0) => {
    const data = await api<Order[]>(`/orders?limit=50&offset=${nextPage * 50}`);
    setOrders(data);
    setHasMore(data.length === 50);
    setPage(nextPage);
  }, []);
  const loadQueue = useCallback(async () => {
    const batches = await Promise.all(
      (["accepted", "preparing", "ready"] as Status[]).map(async (status) => {
        const result: Order[] = [];
        for (let offset = 0; ; offset += 100) {
          const batch = await api<Order[]>(
            `/orders?status=${status}&limit=100&offset=${offset}`,
          );
          result.push(...batch);
          if (batch.length < 100) break;
        }
        return result;
      }),
    );
    setQueueOrders(
      batches
        .flat()
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id),
    );
  }, []);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [items, cats] = await Promise.all([
        api<MenuItem[]>("/menu"),
        api<Category[]>("/menu/categories"),
      ]);
      setMenu(items);
      setCategories(cats);
      await loadQueue();
    } catch (reason) {
      fail(reason);
    } finally {
      setLoading(false);
    }
  }, [fail, loadQueue]);
  useEffect(() => {
    if (user && !demo) void refresh();
  }, [user, demo, refresh]);
  useEffect(() => {
    if (!user || demo || view !== "queue") return;
    let pending = false;
    const poll = async () => {
      if (pending) return;
      pending = true;
      try {
        await loadQueue();
      } catch (reason) {
        fail(reason);
      } finally {
        pending = false;
      }
    };
    void poll();
    const timer = setInterval(() => {
      void poll();
    }, 10000);
    return () => clearInterval(timer);
  }, [user, demo, view, loadQueue, fail]);
  function startDemo() {
    setError("");
    setDemo(true);
    setUser({ login: "cashier1", roles: ["ROLE_cashier"] });
    setRole("cashier");
    setMenu(sampleMenu);
    setCategories(sampleCategories);
    setOrders(demoOrders());
    setView("menu");
  }
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const account = await api<User>(
        "/auth/login",
        "POST",
        new URLSearchParams({
          login: String(data.get("login")),
          password: String(data.get("password")),
        }),
      );
      setUser(account);
      const r = account.roles[0].replace("ROLE_", "") as Role;
      setRole(r);
      setView(r === "barista" ? "queue" : "menu");
    } catch (reason) {
      fail(reason);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      if (!demo) await api("/auth/logout", "POST");
      setUser(null);
      setDemo(false);
      setCart([]);
      setReceipt(null);
      setError("");
      setView("menu");
    } catch (reason) {
      fail(reason);
    } finally {
      setBusy(false);
    }
  }
  function go(next: View) {
    setView(next);
    setError("");
    setCartOpen(false);
    if (next === "orders" && !demo) void loadOrders(0).catch(fail);
  }
  function add(item: MenuItem, count = 1) {
    if (role !== "cashier" || !item.available || busy) return;
    setCart((previous) => {
      const existing = previous.find((line) => line.item.id === item.id);
      return existing
        ? previous.map((line) =>
            line.item.id === item.id
              ? { item, quantity: Math.min(1000, line.quantity + count) }
              : line,
          )
        : [...previous, { item, quantity: count }];
    });
    toast(`${item.name} — в заказе`);
  }
  function change(id: number, delta: number) {
    setCart((previous) =>
      previous
        .map((line) =>
          line.item.id === id
            ? { ...line, quantity: Math.min(1000, line.quantity + delta) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }
  const total = cart.reduce(
      (sum, line) => sum + line.item.price * line.quantity,
      0,
    ),
    cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const readyCount = (demo ? orders : queueOrders).filter(
    (order) => order.status === "ready",
  ).length;
  async function checkout() {
    if (!cart.length || busy) return;
    setBusy(true);
    setError("");
    try {
      let order: Order;
      if (demo) {
        order = {
          id: Math.max(46, ...orders.map((o) => o.id)) + 1,
          createdAt: new Date().toISOString(),
          cashierId: 1,
          status: "accepted",
          total,
          items: cart.map(({ item, quantity }) => ({
            menuItemId: item.id,
            name: item.name,
            quantity,
            unitPrice: item.price,
            lineTotal: item.price * quantity,
          })),
        };
        setOrders((previous) => [order, ...previous]);
      } else {
        order = await api<Order>("/orders", "POST", {
          items: cart.map((line) => ({
            menuItemId: line.item.id,
            quantity: line.quantity,
          })),
        });
        void loadOrders(0).catch(fail);
      }
      setReceipt(order);
      setCart([]);
      setCartOpen(false);
      setView("receipt");
      toast(`Заказ № ${order.id} принят`);
    } catch (reason) {
      fail(reason);
    } finally {
      setBusy(false);
    }
  }
  async function openOrder(order: Order) {
    setBusy(true);
    try {
      setReceipt(demo ? order : await api<Order>(`/orders/${order.id}`));
      setView("receipt");
    } catch (reason) {
      fail(reason);
    } finally {
      setBusy(false);
    }
  }
  async function transition(order: Order) {
    const status: Status =
      order.status === "accepted"
        ? "preparing"
        : order.status === "preparing"
          ? "ready"
          : "issued";
    setBusy(true);
    setError("");
    try {
      let updated: Order;
      if (demo) {
        updated = { ...order, status };
        setOrders((previous) =>
          previous.map((o) => (o.id === order.id ? updated : o)),
        );
      } else {
        updated = await api<Order>(`/orders/${order.id}/status`, "PATCH", {
          status,
        });
        setOrders((previous) => previous.map((item) => item.id === updated.id ? updated : item));
        void loadQueue().catch(fail);
      }
      if (receipt?.id === order.id) setReceipt(updated);
      toast(`Заказ № ${order.id}: ${statusText[status].toLowerCase()}`);
    } catch (reason) {
      fail(reason);
    } finally {
      setBusy(false);
    }
  }
  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const data = {
      categoryId: Number(form.get("categoryId")),
      name: String(form.get("name")).trim(),
      price: Number(form.get("price")),
      available: form.get("available") === "on",
    };
    try {
      if (demo) {
        if (edit)
          setMenu((previous) =>
            previous.map((item) =>
              item.id === edit.id ? { ...item, ...data } : item,
            ),
          );
        else
          setMenu((previous) => [
            ...previous,
            { id: Math.max(...previous.map((item) => item.id)) + 1, ...data },
          ]);
      } else {
        await api(
          edit ? `/menu/${edit.id}` : "/menu",
          edit ? "PUT" : "POST",
          data,
        );
        await refresh();
      }
      setEdit(null);
      setCreateItem(false);
      toast("Меню обновлено");
    } catch (reason) {
      fail(reason);
    } finally {
      setBusy(false);
    }
  }
  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name")).trim();
    setBusy(true);
    try {
      const created = demo
        ? { id: Math.max(0, ...categories.map((c) => c.id)) + 1, name }
        : await api<Category>("/menu/categories", "POST", { name });
      setCategories((previous) => [...previous, created]);
      form.reset();
      toast("Категория добавлена");
    } catch (reason) {
      fail(reason);
    } finally {
      setBusy(false);
    }
  }
  if (checking)
    return (
      <div className="boot">
        <Brand />
        <LoaderCircle className="spin" size={25} />
        <p>Готовим рабочее пространство…</p>
      </div>
    );
  if (!user)
    return (
      <main className="login-page">
        <section className="login-story">
          <Brand />
          <div>
            <span className="eyebrow">МАЛЕНЬКАЯ КОФЕЙНЯ. БОЛЬШОЙ ВКУС.</span>
            <h1>
              Хороший день
              <br />
              начинается здесь.
            </h1>
            <p>
              Любимый кофе, тёплые встречи
              <br />и всё для вашей команды.
            </p>
          </div>
          <span className="story-footer">
            С любовью к кофе и людям <span>✦</span>
          </span>
        </section>
        <section className="login-panel">
          <div className="login-form">
            <span className="eyebrow">РАБОЧЕЕ ПРОСТРАНСТВО</span>
            <h2>Рады видеть вас</h2>
            <p>Войдите, чтобы начать новую смену.</p>
            {error && (
              <div className="alert" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={login}>
              <label>
                Логин
                <input
                  name="login"
                  autoComplete="username"
                  placeholder="Например, cashier1"
                  required
                  maxLength={50}
                />
              </label>
              <label>
                Пароль
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Ваш пароль"
                  required
                  maxLength={72}
                />
              </label>
              <button className="primary" disabled={busy}>
                {busy ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <>
                    Начать смену <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
            <div className="login-divider">
              <span>или познакомьтесь с интерфейсом</span>
            </div>
            <button className="secondary full" onClick={startDemo}>
              Посмотреть демо <ChevronRight size={16} />
            </button>
            <p className="login-help">
              Доступ для кассира, бариста и администратора.
              <br />
              Учётные данные выдаёт администратор кофейни.
            </p>
          </div>
          <span className="login-bottom">
            ROAST POINT <span>·</span> кофе, который рядом
          </span>
        </section>
      </main>
    );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <nav>
          {navigation
            .filter((item) => item.id !== "reports" || role === "admin")
            .map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={view === item.id ? "active" : ""}
              >
                <item.icon size={20} strokeWidth={1.5} />
                <span>{item.title}</span>
                {item.id === "queue" && readyCount > 0 && (
                  <span className="nav-count">{readyCount}</span>
                )}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className={`settings-link ${view === "settings" ? "active" : ""}`}
            onClick={() => go("settings")}
          >
            <Settings size={20} strokeWidth={1.5} />
            <span>Настройки</span>
          </button>
          <div className="sidebar-clock">
            <span>
              {now?.toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <strong>
              {now?.toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>
            <small>
              <i /> Смена открыта
            </small>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="mobile-brand">ROAST POINT</div>
          {view === "menu" ? (
            <label className="search">
              <Search size={20} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по меню…"
                aria-label="Поиск по меню"
              />
              {search && (
                <button
                  aria-label="Очистить поиск"
                  onClick={() => setSearch("")}
                >
                  <X size={16} />
                </button>
              )}
            </label>
          ) : (
            <div className="breadcrumb">
              Рабочее пространство <ChevronRight size={14} />{" "}
              <span>
                {navigation.find((item) => item.id === view)?.title ||
                  "Настройки"}
              </span>
            </div>
          )}
          <div className="topbar-right">
            {demo && <span className="demo-pill">ДЕМО</span>}
            <span className="avatar">
              <UserRound size={21} />
            </span>
            <span className="account-name">
              {roleText[role]}
              <small>{user.login}</small>
            </span>
            <button
              className="icon-button logout"
              aria-label="Выйти"
              title="Выйти"
              onClick={logout}
              disabled={busy}
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
        {demo && (
          <div className="demo-banner">
            <span>
              Демонстрационный режим · изменения только до закрытия страницы
            </span>
            <label>
              Роль{" "}
              <select
                value={role}
                onChange={(e) => {
                  const next = e.target.value as Role;
                  setRole(next);
                  setCart([]);
                  if (view === "reports" && next !== "admin") go("menu");
                }}
              >
                <option value="cashier">Кассир</option>
                <option value="barista">Бариста</option>
                <option value="admin">Администратор</option>
              </select>
              <ChevronDown size={13} />
            </label>
          </div>
        )}
        {error && (
          <div className="alert global-alert" role="alert">
            <span>{error}</span>
            <button onClick={() => setError("")} aria-label="Закрыть сообщение">
              <X size={17} />
            </button>
          </div>
        )}
        <main className="main-content" aria-busy={loading}>
          {view === "menu" &&
            (loading && !menu.length ? (
              <div className="empty">
                <LoaderCircle className="spin" />
                <p>Загружаем меню…</p>
              </div>
            ) : (
              <MenuView
                menu={menu}
                categories={categories}
                role={role}
                busy={busy}
                search={search}
                category={category}
                setCategory={setCategory}
                add={add}
                show={(item) => {
                  setSelected(item);
                  setQuantity(1);
                }}
                edit={setEdit}
                newItem={() => setCreateItem(true)}
                cart={cart}
                change={change}
                clear={() => setCart([])}
                checkout={checkout}
                cartOpen={cartOpen}
                closeCart={() => setCartOpen(false)}
              />
            ))}
          {(view === "queue" || view === "orders") && (
            <OrdersView
              queue={view === "queue"}
              orders={view === "queue" && !demo ? queueOrders : orders}
              role={role}
              demo={demo}
              busy={busy}
              open={openOrder}
              transition={transition}
              refresh={() => {
                if (demo) toast("Демонстрационные заказы обновлены");
                else
                  void (
                    view === "queue" ? loadQueue() : loadOrders(page)
                  ).catch(fail);
              }}
              page={page}
              hasMore={hasMore}
              setPage={(next) => {
                void loadOrders(next).catch(fail);
              }}
            />
          )}
          {view === "receipt" && (
            <ReceiptView
              order={receipt}
              role={role}
              busy={busy}
              transition={transition}
              go={go}
            />
          )}
          {view === "reports" && role === "admin" && (
            <ReportsView demo={demo} fail={fail} />
          )}
          {view === "settings" && (
            <section className="settings-view">
              <div className="page-heading">
                <div>
                  <span className="eyebrow">ВАШЕ ПРОСТРАНСТВО</span>
                  <h1>Настройки</h1>
                </div>
              </div>
              <section className="panel settings-panel">
                <h2>Текущая смена</h2>
                <div className="settings-row">
                  <span>Сотрудник</span>
                  <strong>{user.login}</strong>
                </div>
                <div className="settings-row">
                  <span>Роль</span>
                  <strong>{roleText[role]}</strong>
                </div>
                <div className="settings-row">
                  <span>Подключение</span>
                  <span className="connection">
                    <i />
                    {demo ? "Демонстрационные данные" : "Spring Boot API"}
                  </span>
                </div>
                <button className="secondary" onClick={logout} disabled={busy}>
                  <LogOut size={16} /> Завершить сеанс
                </button>
              </section>
              {role === "admin" && (
                <section className="panel settings-panel">
                  <h2>Категории меню</h2>
                  <div className="category-list">
                    {categories.map((cat) => (
                      <span key={cat.id}>{cat.name}</span>
                    ))}
                  </div>
                  <form className="category-form" onSubmit={addCategory}>
                    <input
                      name="name"
                      placeholder="Название новой категории"
                      maxLength={100}
                      required
                    />
                    <button className="primary" disabled={busy}>
                      <Plus size={17} /> Добавить
                    </button>
                  </form>
                </section>
              )}
            </section>
          )}
        </main>
        <footer className="workspace-footer">
          <span>ROAST POINT</span>
          <span>
            Немного тепла в каждом дне <Leaf size={12} />
          </span>
        </footer>
      </div>
      {role === "cashier" && view === "menu" && (
        <button
          className="mobile-cart-button"
          onClick={() => setCartOpen(true)}
        >
          <ShoppingBag size={19} />
          <span>Текущий заказ · {cartCount}</span>
          <strong>{rub(total)}</strong>
        </button>
      )}
      {selected && (
        <Modal label={selected.name} onClose={() => setSelected(null)}>
          <FoodImage className="modal-photo" name={selected.name} />
          <div className="product-modal-body">
            <div className="section-heading">
              <h2>{selected.name}</h2>
              <strong>{rub(selected.price)}</strong>
            </div>
            <p className="muted">
              Готовим для вас из свежих ингредиентов, с вниманием к каждой
              детали.
            </p>
            <div className="product-info">
              <span>Порция</span>
              <strong>{volume(selected.name)}</strong>
            </div>
            <div className="product-info">
              <span>Наличие</span>
              <span>
                {selected.available ? "Можно заказать" : "Временно недоступно"}
              </span>
            </div>
            {role === "cashier" && (
              <div className="modal-actions">
                <Stepper
                  value={quantity}
                  onChange={(delta) =>
                    setQuantity((q) => Math.max(1, Math.min(1000, q + delta)))
                  }
                />
                <button
                  className="primary"
                  disabled={!selected.available || busy}
                  onClick={() => {
                    add(selected, quantity);
                    setSelected(null);
                  }}
                >
                  Добавить · {rub(selected.price * quantity)} <Plus size={17} />
                </button>
              </div>
            )}
            {role === "admin" && (
              <button
                className="primary"
                onClick={() => {
                  setEdit(selected);
                  setSelected(null);
                }}
              >
                Изменить позицию
              </button>
            )}
          </div>
        </Modal>
      )}
      {(edit || createItem) && (
        <Modal
          label={edit ? "Изменить позицию" : "Новая позиция"}
          onClose={() => {
            if (!busy) {
              setEdit(null);
              setCreateItem(false);
            }
          }}
        >
          <div className="edit-modal">
            <h2>{edit ? "Изменить позицию" : "Новая позиция"}</h2>
            <form onSubmit={saveItem}>
              <label>
                Название
                <input
                  name="name"
                  defaultValue={edit?.name}
                  required
                  maxLength={150}
                />
              </label>
              <label>
                Категория
                <select
                  name="categoryId"
                  defaultValue={edit?.categoryId || categories[0]?.id}
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Цена, ₽
                <input
                  name="price"
                  type="number"
                  min="0"
                  max="99999999.99"
                  step="0.01"
                  defaultValue={edit?.price}
                  required
                />
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="available"
                  defaultChecked={edit?.available ?? true}
                />{" "}
                Доступна для заказа
              </label>
              <p className="micro">
                Чтобы снять позицию с продажи, отключите доступность.
              </p>
              <button className="primary" disabled={busy}>
                {busy ? (
                  "Сохраняем…"
                ) : (
                  <>
                    Сохранить <Check size={17} />
                  </>
                )}
              </button>
            </form>
          </div>
        </Modal>
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
    </div>
  );
}
