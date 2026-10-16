const fs = require('fs');
function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath) { console.error('usage: node ua-tour-analyze.js <input> <output>'); process.exit(1); }
  let data;
  try { data = JSON.parse(fs.readFileSync(inputPath, 'utf8')); }
  catch (e) { console.error('failed to read input: ' + e.message); process.exit(1); }
  const nodes = data.nodes || [];
  const edges = data.edges || [];
  const layers = data.layers || [];
  const nodeIds = new Set(nodes.map(n => n.id));
  const byId = {};
  for (const n of nodes) byId[n.id] = n;

  const fanIn = {}, fanOut = {};
  for (const n of nodes) { fanIn[n.id] = 0; fanOut[n.id] = 0; }
  for (const e of edges) {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
    fanOut[e.source] = (fanOut[e.source] || 0) + 1;
    fanIn[e.target] = (fanIn[e.target] || 0) + 1;
  }
  const fanInRanking = nodes.map(n => ({ id: n.id, fanIn: fanIn[n.id] || 0, name: n.name }))
    .sort((a, b) => b.fanIn - a.fanIn).slice(0, 20);
  const fanOutRanking = nodes.map(n => ({ id: n.id, fanOut: fanOut[n.id] || 0, name: n.name }))
    .sort((a, b) => b.fanOut - a.fanOut).slice(0, 20);

  // Entry point candidates
  const entryNames = new Set(['index.ts','index.js','main.ts','main.js','app.ts','app.js','server.ts','server.js','mod.rs','main.go','main.py','main.rs','manage.py','app.py','wsgi.py','asgi.py','run.py','__main__.py','Application.java','Main.java','Program.cs','config.ru','index.php','App.swift','Application.kt','main.cpp','main.c','main.tsx','app.tsx','App.tsx']);
  const fanOutVals = fanOutRanking.map(r => r.fanOut).sort((a,b)=>a-b);
  const fanInVals = nodes.map(n => fanIn[n.id]||0).sort((a,b)=>a-b);
  const top10pctCut = fanOutVals.length ? fanOutVals[Math.floor(fanOutVals.length*0.9)] : Infinity;
  const bottom25Cut = fanInVals.length ? fanInVals[Math.floor(fanInVals.length*0.25)] : 0;
  const scored = nodes.map(n => {
    let s = 0;
    const fp = n.filePath || n.id;
    const base = (n.name || fp.split('/').pop() || '');
    if (n.type === 'file' || n.type === 'endpoint') {
      if (entryNames.has(base)) s += 3;
      const depth = fp.split('/').length - 1;
      if (depth <= 1) s += 1;
      if ((fanOut[n.id]||0) >= top10pctCut && (fanOut[n.id]||0) > 0) s += 1;
      if ((fanIn[n.id]||0) <= bottom25Cut) s += 1;
    }
    if (n.type === 'document') {
      if (fp === 'README.md' || base === 'README.md') s += 5;
      else if (base.endsWith('.md') && (fp.split('/').length - 1) <= 1) s += 2;
    }
    return { id: n.id, score: s, name: n.name, summary: n.summary || '' };
  }).filter(x => x.score > 0).sort((a,b) => b.score - a.score).slice(0, 5);

  // BFS from top code entry point (skip documents)
  const codeCands = scored.filter(c => { const n = byId[c.id]; return n && n.type !== 'document'; });
  const startNode = (codeCands[0] || scored[0] || {}).id || (nodes[0] && nodes[0].id);
  const adj = {};
  for (const n of nodes) adj[n.id] = [];
  for (const e of edges) {
    if (e.type !== 'imports' && e.type !== 'calls') continue;
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
    adj[e.source].push(e.target);
  }
  const order = [], depthMap = {};
  if (startNode && nodeIds.has(startNode)) {
    const q = [startNode]; depthMap[startNode] = 0;
    const seen = new Set([startNode]);
    while (q.length) {
      const cur = q.shift(); order.push(cur);
      for (const nb of adj[cur]) {
        if (!seen.has(nb)) { seen.add(nb); depthMap[nb] = depthMap[cur] + 1; q.push(nb); }
      }
    }
  }
  const byDepth = {};
  for (const [k, v] of Object.entries(depthMap)) {
    const key = String(v);
    (byDepth[key] = byDepth[key] || []).push(k);
  }

  // Non-code inventory
  const nonCodeFiles = { documentation: [], infrastructure: [], data: [], config: [] };
  for (const n of nodes) {
    const item = { id: n.id, name: n.name, type: n.type, summary: n.summary || '' };
    if (n.type === 'document') nonCodeFiles.documentation.push(item);
    else if (n.type === 'service' || n.type === 'pipeline' || n.type === 'resource') nonCodeFiles.infrastructure.push(item);
    else if (n.type === 'table' || n.type === 'schema' || n.type === 'endpoint') nonCodeFiles.data.push(item);
    else if (n.type === 'config') nonCodeFiles.config.push(item);
  }

  // Clusters: bidirectional pairs via imports/calls, expand
  const pairEdges = {};
  const key2 = (a,b) => a < b ? a+'||'+b : b+'||'+a;
  for (const e of edges) {
    if (e.type !== 'imports' && e.type !== 'calls') continue;
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
    if (e.source === e.target) continue;
    const k = key2(e.source, e.target);
    (pairEdges[k] = pairEdges[k] || []).push(e);
  }
  const neighborSet = {};
  for (const n of nodes) neighborSet[n.id] = new Set();
  for (const e of edges) {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
    neighborSet[e.source].add(e.target); neighborSet[e.target].add(e.source);
  }
  const bidirPairs = [];
  for (const [k, list] of Object.entries(pairEdges)) {
    const [a, b] = k.split('||');
    const fwd = list.some(e => e.source === a && e.target === b);
    const rev = list.some(e => e.source === b && e.target === a);
    if (fwd && rev) {
      const edgeCount = list.length;
      bidirPairs.push({ nodes: [a, b], edgeCount });
    }
  }
  bidirPairs.sort((x,y)=>y.edgeCount-x.edgeCount);
  const clusters = bidirPairs.slice(0, 10).map(c => {
    const set = new Set(c.nodes);
    let ec = c.edgeCount;
    for (const nid of [...nodes.map(n=>n.id)]) {
      if (set.has(nid) || set.size >= 5) continue;
      let links = 0;
      for (const m of set) { if (neighborSet[nid].has(m)) links++; }
      if (links >= 2) { set.add(nid); ec += links; }
    }
    return { nodes: [...set], edgeCount: ec };
  });

  // Node summary index
  const nodeSummaryIndex = {};
  for (const n of nodes) nodeSummaryIndex[n.id] = { name: n.name, type: n.type, summary: n.summary || '' };

  const out = {
    scriptCompleted: true,
    entryPointCandidates: scored,
    fanInRanking, fanOutRanking,
    bfsTraversal: { startNode, order, depthMap, byDepth },
    nonCodeFiles, clusters,
    layers: { count: layers.length, list: layers.map(l => ({ id: l.id, name: l.name, description: l.description })) },
    nodeSummaryIndex,
    totalNodes: nodes.length, totalEdges: edges.length
  };
  fs.writeFileSync(outputPath, JSON.stringify(out, null, 1));
}
main();
