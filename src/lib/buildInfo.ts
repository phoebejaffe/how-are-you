import { formatExactTime } from "./dates";

export const APP_BUILD_TIME = __APP_BUILD_TIME__;
export const APP_GIT_COMMIT_TIME = __APP_GIT_COMMIT_TIME__;

export function formatBuildTime(): string {
  return formatExactTime(APP_GIT_COMMIT_TIME);
}
