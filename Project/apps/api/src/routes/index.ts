import { registerHealthRoutes } from "./healthRegistration";
import { registerTaskRoutes } from "./taskRegistration";

export const registerRoutes = [registerHealthRoutes, registerTaskRoutes] as const;