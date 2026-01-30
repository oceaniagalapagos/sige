import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie } from "hono/cookie";
import {
  authMiddleware,
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { embarquesRoutes } from "./routes/embarques";
import { clientesRoutes } from "./routes/clientes";
import { documentosRoutes } from "./routes/documentos";
import { calendarioRoutes } from "./routes/calendario";
import { transportesRoutes } from "./routes/transportes";
import { configuracionRoutes } from "./routes/configuracion";
import { usuariosRoutes } from "./routes/usuarios";
import { destinosRoutes } from "./routes/destinos";
import { tiposProductosRoutes } from "./routes/tipos-productos";
import { tiposTransporteRoutes } from "./routes/tipos-transporte";
import { tiposServicioRoutes } from "./routes/tipos-servicio";
import { tiposEmbalajeRoutes } from "./routes/tipos-embalaje";
import { tiposDocumentoRoutes } from "./routes/tipos-documento";
import { ubicacionesRoutes } from "./routes/ubicaciones";
import { filesRoutes } from "./routes/files";
import { productosRoutes } from "./routes/productos";
import embarquesServiciosRoutes from "./routes/embarques-servicios";

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

// Auth routes
app.get("/api/oauth/google/redirect_url", async (c) => {
  const redirectUrl = await getOAuthRedirectUrl("google", {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60,
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// API routes
app.route("/api/usuarios", usuariosRoutes);
app.route("/api/embarques", embarquesRoutes);
app.route("/api/clientes", clientesRoutes);
app.route("/api/documentos", documentosRoutes);
app.route("/api/calendario", calendarioRoutes);
app.route("/api/transportes", transportesRoutes);
app.route("/api/destinos", destinosRoutes);
app.route("/api/tipos-productos", tiposProductosRoutes);
app.route("/api/tipos-transporte", tiposTransporteRoutes);
app.route("/api/tipos-servicio", tiposServicioRoutes);
app.route("/api/tipos-embalaje", tiposEmbalajeRoutes);
app.route("/api/tipos-documento", tiposDocumentoRoutes);
app.route("/api/ubicaciones", ubicacionesRoutes);
app.route("/api/configuracion", configuracionRoutes);
app.route("/api/files", filesRoutes);
app.route("/api/productos", productosRoutes);
app.route("/api/embarques-servicios", embarquesServiciosRoutes);

export default app;
