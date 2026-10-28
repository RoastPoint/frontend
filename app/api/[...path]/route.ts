import { NextRequest } from "next/server";
export const dynamic = "force-dynamic";
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const allowed =
    /^(auth\/(csrf|login|logout|me)|menu(?:\/categories|\/\d+)?|orders(?:\/\d+(?:\/status)?)?|reports\/sales)$/;
  const endpoint = path.join("/");
  if (!allowed.test(endpoint))
    return Response.json({ message: "Маршрут не найден" }, { status: 404 });
  try {
    const base = process.env.BACKEND_URL || "http://localhost:8080";
    const headers = new Headers();
    for (const name of [
      "cookie",
      "content-type",
      "x-csrf-token",
      "x-xsrf-token",
    ]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    const response = await fetch(
      `${base}/api/${endpoint}${request.nextUrl.search}`,
      {
        method: request.method,
        headers,
        redirect: "manual",
        cache: "no-store",
        body: ["GET", "HEAD"].includes(request.method)
          ? undefined
          : await request.arrayBuffer(),
        signal: AbortSignal.timeout(15000),
      },
    );
    const output = new Headers({ "Cache-Control": "no-store" });
    for (const name of ["content-type", "location"]) {
      const value = response.headers.get(name);
      if (value) output.set(name, value);
    }
    for (const cookie of response.headers.getSetCookie())
      output.append("set-cookie", cookie);
    return new Response(response.body, {
      status: response.status,
      headers: output,
    });
  } catch {
    return Response.json(
      {
        message:
          "Не удалось подключиться к серверу. Проверьте, что backend запущен.",
      },
      { status: 503 },
    );
  }
}
export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH };
