import type { SourceAdapter } from "../types";
import { gutendex } from "./gutendex";
import { youtube } from "./youtube";
import { archive } from "./archive";
import { openalex } from "./openalex";
import { wikimedia } from "./wikimedia";
import { arxiv } from "./arxiv";
import { news } from "./news";

/** The active source registry. Adding a source = implement its adapter + list it here. */
export const adapters: SourceAdapter[] = [
  gutendex,
  youtube,
  archive,
  openalex,
  wikimedia,
  arxiv,
  news,
];
