/**
 * RealityStateOS — Reality Graph / QueryLanguage
 * Backs `rsos query graph "<pattern>"`. A real, minimal parser + matcher for
 * a Cypher-like subset — one hop, `(a:Type)-[:REL_TYPE]->(b:Type)` — not the
 * full graph query language cli_commands.md gestures at. Multi-hop/filter
 * support is a straightforward follow-up on this same shape.
 */
import { GraphStore } from "../../012_STORAGE/dist/graphStore";

export interface ParsedPattern {
  fromType?: string;
  edgeType?: string;
  toType?: string;
}

export class InvalidPatternError extends Error {
  constructor(pattern: string) {
    super(`could not parse graph pattern: "${pattern}" (expected "(a:Type)-[:REL]->(b:Type)")`);
  }
}

const PATTERN_RE = /^\(\w*(?::(\w+))?\)-\[:?(\w+)?\]->\(\w*(?::(\w+))?\)$/;

export function parsePattern(pattern: string): ParsedPattern {
  const match = PATTERN_RE.exec(pattern.trim());
  if (!match) throw new InvalidPatternError(pattern);
  return { fromType: match[1], edgeType: match[2], toType: match[3] };
}

export interface QueryMatch {
  fromId: string;
  edgeType: string;
  toId: string;
}

export async function runGraphQuery(
  store: GraphStore,
  pattern: string,
  atTime?: number
): Promise<QueryMatch[]> {
  const parsed = parsePattern(pattern);
  const nodes = await store.allNodes(atTime);
  const matches: QueryMatch[] = [];

  for (const fromNode of nodes) {
    if (parsed.fromType && fromNode.nodeType !== parsed.fromType) continue;
    const edges = await store.edgesFrom(fromNode.id, atTime);
    for (const edge of edges) {
      if (parsed.edgeType && edge.edgeType !== parsed.edgeType) continue;
      const toNode = await store.getNode(edge.toId);
      if (!toNode) continue;
      if (parsed.toType && toNode.nodeType !== parsed.toType) continue;
      matches.push({ fromId: fromNode.id, edgeType: edge.edgeType, toId: toNode.id });
    }
  }
  return matches;
}
