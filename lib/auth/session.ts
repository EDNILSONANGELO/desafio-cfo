import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { SessionPayload } from "@/types";

const COOKIE_NAME = "desafio_cfo_session";
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_secret_change_in_production_please"
);

const SESSION_DAYS = 30; // dias de sessão persistente

export async function signJWT(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret);
}

export async function verifyJWT(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJWT(token);
}

export async function getSessionFromRequest(
  req: NextRequest
): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJWT(token);
}

export function setSessionCookie(response: NextResponse, token: string) {
  const maxAge = SESSION_DAYS * 24 * 60 * 60; // em segundos
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",            // "lax" permite navegação normal entre abas/links
    maxAge,                     // garante cookie persistente (não apaga ao fechar browser)
    expires: new Date(Date.now() + maxAge * 1000), // data absoluta — compatibilidade máxima
    path: "/",
  });
  return response;
}

export function deleteSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}
