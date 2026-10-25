// GRAFT synthetic membrane candidate. Original MEMENTO is an independent private donor.
const ROUTES = new Set(['ADMIT', 'REFUSE', 'FOG']);

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}
function required(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}
function sourceRefs(refs) {
  if (!Array.isArray(refs) || !refs.length) throw new TypeError('source_refs must be non-empty');
  return refs.map((v, i) => required(v, `source_refs[${i}]`));
}

// This is a *review receipt*, not a source of canonical truth or an executing writer.
export function reviewCrossing(input) {
  const { proposal, decision } = object(input, 'crossing');
  object(proposal, 'proposal'); object(decision, 'decision');
  const proposalId = required(proposal.id, 'proposal.id');
  const refs = sourceRefs(proposal.source_refs);
  const route = required(decision.route, 'decision.route');
  if (!ROUTES.has(route)) throw new TypeError('decision.route must be ADMIT, REFUSE, or FOG');
  const decisionId = required(decision.id, 'decision.id');
  const basis = Array.isArray(decision.basis) ? decision.basis.map((v, i) => required(v, `decision.basis[${i}]`)) : [];
  if (route === 'ADMIT' && (!basis.length || !decision.authorizer)) {
    throw new TypeError('ADMIT requires explicit basis and authorizer');
  }
  return {
    schema: 'graft.memento.review/v0', proposal_id: proposalId,
    source_refs: [...refs], decision_id: decisionId, route,
    admissible: route === 'ADMIT',
    // A recipient must separately perform and receipt its own local admission.
    local_write: 'not_performed', authority: 'review_only',
  };
}

// Context is metadata, not adoption: even an admitted edge in its own world has no
// automatic authority in the requesting world.
export function compileContextPack(graph, origin, maxDepth = 1) {
  object(graph, 'graph'); required(origin, 'origin');
  if (!Number.isInteger(maxDepth) || maxDepth < 0 || maxDepth > 4) {
    throw new RangeError('maxDepth must be an integer from 0 to 4');
  }
  if (!Array.isArray(graph.worlds) || !Array.isArray(graph.edges)) {
    throw new TypeError('graph requires worlds and edges arrays');
  }
  const worldIds = new Set();
  for (const world of graph.worlds) {
    object(world, 'world'); required(world.id, 'world.id');
    if (worldIds.has(world.id)) throw new Error(`duplicate world: ${world.id}`);
    worldIds.add(world.id);
  }
  if (!worldIds.has(origin)) throw new Error('origin world not found');
  const edgeIds = new Set();
  for (const edge of graph.edges) {
    object(edge, 'edge'); required(edge.id, 'edge.id');
    if (edgeIds.has(edge.id)) throw new Error(`duplicate edge: ${edge.id}`);
    edgeIds.add(edge.id);
    if (!worldIds.has(edge.from) || !worldIds.has(edge.to)) throw new Error(`edge ${edge.id} references unknown world`);
    if (!['proposed', 'admitted', 'refused', 'fog'].includes(edge.status)) throw new Error(`edge ${edge.id} has invalid status`);
    if (edge.status === 'admitted' && !edge.decision_ref) throw new Error(`edge ${edge.id} lacks admission receipt`);
  }
  const reached = new Set([origin]);
  let frontier = [origin];
  const edgesSeen = new Set();
  for (let distance = 0; distance < maxDepth; distance++) {
    const next = [];
    for (const edge of graph.edges) {
      // Only explicit admitted, receipted relations are traversable. Other statuses remain fog.
      if (edge.status !== 'admitted' || !edge.decision_ref) continue;
      const fromHere = frontier.includes(edge.from);
      const toHere = frontier.includes(edge.to);
      if (!fromHere && !toHere) continue;
      edgesSeen.add(edge.id);
      const other = fromHere ? edge.to : edge.from;
      if (!reached.has(other)) { reached.add(other); next.push(other); }
    }
    frontier = next;
  }
  return {
    schema: 'graft.memento.context-pack/v0', origin, max_depth: maxDepth,
    admission: 'none',
    worlds: graph.worlds.filter(w => reached.has(w.id)).map(w => ({ id: w.id, admission: 'none' })),
    relations: graph.edges.filter(e => edgesSeen.has(e.id)).map(e => ({
      id: e.id, from: e.from, to: e.to, decision_ref: e.decision_ref, admission: 'none',
    })),
  };
}

// A later encounter never mutates the earlier trace, even when it changes the reading.
export function resurface(trace, trigger) {
  object(trace, 'trace'); object(trigger, 'trigger');
  return {
    schema: 'graft.memento.activation/v0',
    old_trace_id: required(trace.id, 'trace.id'),
    new_trigger_id: required(trigger.id, 'trigger.id'),
    trigger_at: required(trigger.at, 'trigger.at'),
    proposed_relation: 'unreviewed', admission: 'none',
  };
}
