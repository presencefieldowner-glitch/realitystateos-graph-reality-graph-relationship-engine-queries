import { RealityGraph, NodeNotFoundError } from "./realityGraph";
import { parsePattern, runGraphQuery, InvalidPatternError } from "./queryLanguage";
import { InMemoryGraphStore } from "../../012_STORAGE/dist/graphStore";

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    passed++;
    console.log(`  ok  - ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL - ${name}`);
    console.log(`       ${(e as Error).message}`);
  }
}

function assert(cond: boolean, msg = "assertion failed"): void {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log("RealityGraph");
  await test("createNode() then getNode() round-trips", async () => {
    const graph = new RealityGraph(new InMemoryGraphStore());
    const node = await graph.createNode("person", { name: "Ada" }, "creator1");
    const fetched = await graph.getNode(node.id);
    assert(fetched.nodeType === "person");
    assert((fetched.data as any).attributes.name === "Ada");
  });

  await test("getNode() throws NodeNotFoundError for an unknown id", async () => {
    const graph = new RealityGraph(new InMemoryGraphStore());
    let threw = false;
    try {
      await graph.getNode("nope");
    } catch (e) {
      threw = e instanceof NodeNotFoundError;
    }
    assert(threw);
  });

  await test("createEdge() rejects when either endpoint is missing", async () => {
    const graph = new RealityGraph(new InMemoryGraphStore());
    const a = await graph.createNode("person", {}, "c1");
    let threw = false;
    try {
      await graph.createEdge("knows", a.id, "missing", "many-to-many");
    } catch (e) {
      threw = e instanceof NodeNotFoundError;
    }
    assert(threw);
  });

  await test("neighbors()/trustWeightedNeighbors() reflect the edge weight filter", async () => {
    const graph = new RealityGraph(new InMemoryGraphStore());
    const a = await graph.createNode("person", {}, "c1");
    const b = await graph.createNode("person", {}, "c1");
    const c = await graph.createNode("person", {}, "c1");
    await graph.createEdge("knows", a.id, b.id, "many-to-many", 0.9);
    await graph.createEdge("knows", a.id, c.id, "many-to-many", 0.2);
    assert((await graph.neighbors(a.id)).length === 2);
    assert((await graph.trustWeightedNeighbors(a.id, 0.5)).length === 1);
  });

  await test("endEdge() soft-invalidates so past-time queries still see it, present-time doesn't", async () => {
    const graph = new RealityGraph(new InMemoryGraphStore());
    const a = await graph.createNode("person", {}, "c1");
    const b = await graph.createNode("person", {}, "c1");
    const rel = await graph.createEdge("knows", a.id, b.id, "many-to-many");
    await new Promise((r) => setTimeout(r, 5));
    const beforeEnd = Date.now();
    await new Promise((r) => setTimeout(r, 5));
    await graph.endEdge(rel);
    assert((await graph.neighbors(a.id, beforeEnd)).length === 1);
    assert((await graph.neighbors(a.id, Date.now() + 10)).length === 0);
  });

  console.log("QueryLanguage");
  await test("parsePattern() extracts node types and edge type", () => {
    const parsed = parsePattern("(a:person)-[:knows]->(b:person)");
    assert(parsed.fromType === "person");
    assert(parsed.edgeType === "knows");
    assert(parsed.toType === "person");
  });

  await test("parsePattern() throws InvalidPatternError on malformed input", () => {
    let threw = false;
    try {
      parsePattern("not a pattern");
    } catch (e) {
      threw = e instanceof InvalidPatternError;
    }
    assert(threw);
  });

  await test("runGraphQuery() finds matching (type)-[edge]->(type) triples", async () => {
    const store = new InMemoryGraphStore();
    const graph = new RealityGraph(store);
    const a = await graph.createNode("person", {}, "c1");
    const b = await graph.createNode("organization", {}, "c1");
    await graph.createEdge("worksAt", a.id, b.id, "one-to-many");
    const matches = await runGraphQuery(store, "(a:person)-[:worksAt]->(b:organization)");
    assert(matches.length === 1);
    assert(matches[0].fromId === a.id && matches[0].toId === b.id);
  });

  console.log(`\n${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main();
