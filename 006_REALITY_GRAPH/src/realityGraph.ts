/**
 * RealityStateOS — Reality Graph
 * Backs `rsos graph node/edge create|show`. Builds typed nodes/edges (using
 * Foundation's TypedEntity/Relationship — see EntityModel's own docstring:
 * "the layer Knowledge (005) and Reality Graph (006) build directly on") on
 * top of 012_STORAGE's GraphStore for persistence, adding the "temporal/
 * spatial/trust dimensions" RealityStateOS/README.md names for this module:
 * temporal via Relationship's validFrom/validTo, trust via edge weight,
 * spatial via an optional {lat,lng} node attribute.
 */
import { Id, newId } from "../../003_FOUNDATION/CoreTypes/dist/id";
import { defaultClock } from "../../003_FOUNDATION/CoreTypes/dist/timestamp";
import {
  TypedEntity,
  createTypedEntity,
  Relationship,
  createRelationship,
  endRelationship,
  Cardinality,
} from "../../003_FOUNDATION/EntityModel/dist/entityModel";
import { GraphStore, GraphNodeRecord, GraphEdgeRecord } from "../../012_STORAGE/dist/graphStore";

export interface SpatialCoords {
  lat: number;
  lng: number;
}

export class NodeNotFoundError extends Error {
  constructor(id: string) {
    super(`no graph node found with id "${id}"`);
  }
}

export class RealityGraph {
  constructor(private readonly store: GraphStore) {}

  async createNode<TType extends string, TAttrs>(
    nodeType: TType,
    attributes: TAttrs,
    createdBy: Id,
    spatial?: SpatialCoords
  ): Promise<TypedEntity<TType, TAttrs>> {
    const entity = createTypedEntity(nodeType, attributes, createdBy);
    await this.store.putNode({
      id: entity.id,
      nodeType: entity.entityType,
      data: { attributes: entity.attributes, createdBy: entity.createdBy, spatial },
      validFrom: Date.parse(entity.createdAt),
    });
    return entity;
  }

  async getNode(id: Id): Promise<GraphNodeRecord> {
    const node = await this.store.getNode(id);
    if (!node) throw new NodeNotFoundError(id);
    return node;
  }

  async createEdge<TRelType extends string>(
    relType: TRelType,
    fromId: Id,
    toId: Id,
    cardinality: Cardinality,
    trustWeight = 1.0
  ): Promise<Relationship<TRelType>> {
    await this.getNode(fromId); // NodeNotFoundError if missing
    await this.getNode(toId);
    const rel = createRelationship({ relType, fromId, toId, cardinality });
    await this.store.putEdge(this.toEdgeRecord(rel, trustWeight));
    return rel;
  }

  /** Ends a relationship as of now (soft-invalidate, never delete — keeps
   * temporal queries accurate, per EntityModel.endRelationship's contract). */
  async endEdge<TRelType extends string>(
    rel: Relationship<TRelType>,
    trustWeight = 1.0
  ): Promise<Relationship<TRelType>> {
    const ended = endRelationship(rel);
    await this.store.putEdge(this.toEdgeRecord(ended, trustWeight));
    return ended;
  }

  async neighbors(nodeId: Id, atTime?: number): Promise<GraphEdgeRecord[]> {
    return this.store.edgesFrom(nodeId, atTime);
  }

  async trustWeightedNeighbors(nodeId: Id, minTrust: number, atTime?: number): Promise<GraphEdgeRecord[]> {
    const edges = await this.store.edgesFrom(nodeId, atTime);
    return edges.filter((e) => e.weight >= minTrust);
  }

  private toEdgeRecord<TRelType extends string>(
    rel: Relationship<TRelType>,
    trustWeight: number
  ): GraphEdgeRecord {
    return {
      id: rel.id,
      fromId: rel.fromId,
      toId: rel.toId,
      edgeType: rel.relType,
      weight: trustWeight,
      validFrom: Date.parse(rel.validFrom),
      validTo: rel.validTo ? Date.parse(rel.validTo) : undefined,
    };
  }
}
