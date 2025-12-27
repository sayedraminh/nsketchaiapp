/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as autopilot from "../autopilot.js";
import type * as autopilotCronActions from "../autopilotCronActions.js";
import type * as clerk from "../clerk.js";
import type * as clonedVoices from "../clonedVoices.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as generations from "../generations.js";
import type * as http from "../http.js";
import type * as polling from "../polling.js";
import type * as sessions from "../sessions.js";
import type * as subscriptions from "../subscriptions.js";
import type * as talkingPhoto from "../talkingPhoto.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  autopilot: typeof autopilot;
  autopilotCronActions: typeof autopilotCronActions;
  clerk: typeof clerk;
  clonedVoices: typeof clonedVoices;
  crons: typeof crons;
  email: typeof email;
  generations: typeof generations;
  http: typeof http;
  polling: typeof polling;
  sessions: typeof sessions;
  subscriptions: typeof subscriptions;
  talkingPhoto: typeof talkingPhoto;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
