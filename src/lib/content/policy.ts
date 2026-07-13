import type { License, RawResult, ContentResult } from "./types";

/**
 * The single source of truth for what may be downloaded. Only open licenses
 * qualify; YouTube (embed-only) and news (link-only) never do.
 */
export function canDownload(license: License): boolean {
  return (
    license === "public-domain" || license === "cc" || license === "open-access"
  );
}

/** Strip `downloadUrl` from any result whose license does not permit download. */
export function applyPolicy(raw: RawResult): ContentResult {
  return canDownload(raw.license) ? { ...raw } : { ...raw, downloadUrl: undefined };
}
