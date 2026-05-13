import type { getAuth } from "../modules/auth/auth.server.js";
import type { Request } from "express";

type AuthInstance = Awaited<ReturnType<typeof getAuth>>;

export type AppAuthSession = NonNullable<Awaited<ReturnType<AuthInstance["api"]["getSession"]>>>;

export type AuthedRequest = Request & { authSession?: AppAuthSession | undefined };
