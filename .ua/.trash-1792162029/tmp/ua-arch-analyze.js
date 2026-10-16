const fs = require('fs');

const inputPath = process.argv[2];
const outputPath = process.argv[3];
if (!inputPath || !outputPath) {
  console.error('Usage: node ua-arch-analyze.js <input.json> <output.json>');
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch (e) {
  console.error('Failed to read/parse input: ' + e.message);
  process.exit(1);
}

const { fileNodes = [], importEdges = [], allEdges = [] } = data;

// Map id -> filePath
const pathOf = {};
for (const n of fileNodes) pathOf[n.id] = n.filePath || '';

function topGroup(filePath) {
  if (!filePath) return 'root';
  const parts = filePath.split('/').filter(Boolean);
  if (parts.length <= 1) return 'root';
  return parts[0];
}

// Common prefix: longest shared leading segments across all paths
function commonPrefix(paths) {
  const split = paths.filter(Boolean).map(p => p.split('/').filter(Boolean));
  if (!split.length) return [];
  let prefix = split[0].slice(0, -1); // exclude filename initially? use dirs only
  // Actually compute common leading dirs
  let cp = [];
  const first = split[0].slice(0, -1);
  for (let i = 0; i < first.length; i++) {
    if (split.every(s => s[i] === first[i])) cp.push(first[i]);
    else break;
  }
  return cp;
}

const allPaths = fileNodes.map(n => n.filePath || '');
const prefixSegs = commonPrefix(allPaths);

function groupOf(filePath) {
  if (!filePath) return 'root';
  const parts = filePath.split('/').filter(Boolean);
  const rest = parts.slice(prefixSegs.length);
  if (rest.length <= 1) return prefixSegs.length ? '(prefix-root)' : 'root';
  return rest[0];
}

// A. Directory grouping
const directoryGroups = {};
for (const n of fileNodes) {
  const g = groupOf(n.filePath || '');
  (directoryGroups[g] = directoryGroups[g] || []).push(n.id);
}
for (const g of Object.keys(directoryGroups)) directoryGroups[g].sort();

// B. Node type grouping
const nodeTypeGroups = {};
for (const n of fileNodes) {
  (nodeTypeGroups[n.type] = nodeTypeGroups[n.type] || []).push(n.id);
}
for (const t of Object.keys(nodeTypeGroups)) nodeTypeGroups[t].sort();

// C. Import adjacency: fan-in/fan-out per file
const fileFanOut = {};
const fileFanIn = {};
for (const n of fileNodes) { fileFanOut[n.id] = 0; fileFanIn[n.id] = 0; }
for (const e of importEdges) {
  if (e.source in fileFanOut) fileFanOut[e.source]++;
  if (e.target in fileFanIn) fileFanIn[e.target]++;
}

// Group-level import relations
const idToGroup = {};
for (const n of fileNodes) idToGroup[n.id] = groupOf(n.filePath || '');
const groupImportsFrom = {}; // g -> Set
const groupImportedBy = {};
for (const g of Object.keys(directoryGroups)) { groupImportsFrom[g] = new Set(); groupImportedBy[g] = new Set(); }
for (const e of importEdges) {
  const gs = idToGroup[e.source], gt = idToGroup[e.target];
  if (gs === undefined || gt === undefined) continue;
  groupImportsFrom[gs].add(gt);
  groupImportedBy[gt].add(gs);
}

// D. Cross-category edges
const crossMap = {};
for (const e of allEdges) {
  const s = fileNodes.find(n => n.id === e.source);
  const t = fileNodes.find(n => n.id === e.target);
  if (!s || !t) continue;
  const key = s.type + '|' + t.type + '|' + e.type;
  crossMap[key] = (crossMap[key] || 0) + 1;
}
const crossCategoryEdges = Object.entries(crossMap).map(([k, count]) => {
  const [fromType, toType, edgeType] = k.split('|');
  return { fromType, toType, edgeType, count };
}).sort((a, b) => b.count - a.count);

// E. Inter-group import frequency
const pairCounts = {};
for (const e of importEdges) {
  const gs = idToGroup[e.source], gt = idToGroup[e.target];
  if (gs === undefined || gt === undefined) continue;
  const key = gs + '|' + gt;
  pairCounts[key] = (pairCounts[key] || 0) + 1;
}
const interGroupImports = Object.entries(pairCounts).map(([k, count]) => {
  const [from, to] = k.split('|');
  return { from, to, count };
}).sort((a, b) => b.count - a.count);

// F. Intra-group density
const intraGroupDensity = {};
for (const g of Object.keys(directoryGroups)) {
  const members = new Set(directoryGroups[g]);
  let internal = 0, total = 0;
  for (const e of importEdges) {
    const inS = members.has(e.source), inT = members.has(e.target);
    if (inS && inT) { internal++; total++; }
    else if (inS || inT) total++;
  }
  intraGroupDensity[g] = { internalEdges: internal, totalEdges: total, density: total ? +(internal / total).toFixed(3) : 0 };
}

// G. Directory pattern matching
const dirPatterns = [
  [/^(routes|api|controllers|endpoints|handlers|routers|blueprints)$/, 'api'],
  [/^(services|service|core|lib|domain|logic|internal|composables|mailers|jobs|channels)$/, 'service'],
  [/^(models|model|db|data|persistence|repository|entities|entity|sql|database|schema)$/, 'data'],
  [/^(components|views|pages|ui|layouts|screens)$/, 'ui'],
  [/^(middleware|plugins|interceptors|guards)$/, 'middleware'],
  [/^(utils|helpers|common|shared|tools|pkg)$/, 'utility'],
  [/^(config|constants|env|settings)$/, 'config'],
  [/^(__tests__|test|tests|spec|specs)$/, 'test'],
  [/^(types|interfaces|schemas|contracts|dtos|dto|request|response)$/, 'types'],
  [/^(hooks)$/, 'hooks'],
  [/^(store|state|reducers|actions|slices)$/, 'state'],
  [/^(assets|static|public)$/, 'assets'],
  [/^(docs|documentation|wiki)$/, 'documentation'],
  [/^(deploy|deployment|infra|infrastructure|k8s|kubernetes|helm|charts|terraform|tf|docker)$/, 'infrastructure'],
  [/^(\.github|\.gitlab|\.circleci)$/, 'ci-cd'],
  [/^(game)$/, 'service'],
  [/^(audio)$/, 'service'],
  [/^(migrations)$/, 'data'],
  [/^(management|commands)$/, 'config'],
  [/^(bin|cmd)$/, 'entry'],
  [/^(src)$/, 'service'],
];
function matchDir(name) {
  const lower = name.toLowerCase();
  for (const [re, label] of dirPatterns) if (re.test(lower)) return label;
  return null;
}
const patternMatches = {};
for (const g of Object.keys(directoryGroups)) {
  const m = matchDir(g);
  if (m) patternMatches[g] = m;
}
// file-level pattern overrides (informational): count test files per group
const testFileRe = /(\.test\.|\.spec\.|_test\.|Test\.java|^test_)/;
const testFiles = fileNodes.filter(n => testFileRe.test(n.name || '') || (n.tags || []).includes('test')).map(n => n.id);

// H. Deployment topology
const allIdPaths = fileNodes.map(n => (n.filePath || '').toLowerCase());
const hasDockerfile = allIdPaths.some(p => p.endsWith('dockerfile') || p.includes('docker-compose'));
const hasCompose = allIdPaths.some(p => p.includes('docker-compose'));
const hasK8s = allIdPaths.some(p => p.includes('k8s') || p.includes('kubernetes') || p.includes('helm'));
const hasTerraform = allIdPaths.some(p => p.endsWith('.tf') || p.endsWith('.tfvars'));
const hasCI = allIdPaths.some(p => p.includes('.github/workflows') || p.includes('.gitlab-ci') || p.endsWith('jenkinsfile'));
const infraFiles = fileNodes.filter(n => {
  const p = (n.filePath || '').toLowerCase();
  return p.includes('dockerfile') || p.includes('docker-compose') || p.includes('k8s') || p.endsWith('.tf') || p.includes('.github/workflows') || p.endsWith('makefile');
}).map(n => n.filePath);

// I. Data pipeline
const schemaFiles = fileNodes.filter(n => /\.(sql|graphql|gql|proto|prisma)$/i.test(n.filePath || '')).map(n => n.filePath);
const migrationFiles = fileNodes.filter(n => /(migrations?|migrate)/i.test(n.filePath || '') && /\.sql$/i.test(n.filePath || '')).map(n => n.filePath);
const dataModelFiles = fileNodes.filter(n => /(models?|entities|schemas?)\//i.test(n.filePath || '') || (n.tags || []).includes('data-model')).map(n => n.filePath);
const apiHandlerFiles = fileNodes.filter(n => /(routes?|controllers?|handlers?|endpoints?)\//i.test(n.filePath || '')).map(n => n.filePath);

// J. Documentation coverage
const groups = Object.keys(directoryGroups);
const docGroups = new Set();
for (const n of fileNodes) {
  if (n.type === 'document' || /\.md$/i.test(n.filePath || '')) docGroups.add(groupOf(n.filePath || ''));
}
// root-level docs cover all? No — count groups that contain docs
const groupsWithDocs = docGroups.size;
const undocumentedGroups = groups.filter(g => !docGroups.has(g));

// K. Dependency direction
const dependencyDirection = [];
for (const { from, to, count } of interGroupImports) {
  if (from === to) continue;
  const rev = pairCounts[to + '|' + from] || 0;
  if (count >= rev) dependencyDirection.push({ dependent: from, dependsOn: to });
}
dependencyDirection.sort((a, b) => (a.dependent + a.dependsOn).localeCompare(b.dependent + b.dependsOn));

// fileStats
const filesPerGroup = {};
for (const g of Object.keys(directoryGroups)) filesPerGroup[g] = directoryGroups[g].length;
const nodeTypeCounts = {};
for (const t of Object.keys(nodeTypeGroups)) nodeTypeCounts[t] = nodeTypeGroups[t].length;

const out = {
  scriptCompleted: true,
  commonPrefix: prefixSegs.join('/') || '(none)',
  directoryGroups,
  nodeTypeGroups,
  crossCategoryEdges,
  interGroupImports,
  intraGroupDensity,
  patternMatches,
  testFiles,
  deploymentTopology: { hasDockerfile, hasCompose, hasK8s, hasTerraform, hasCI, infraFiles },
  dataPipeline: { schemaFiles, migrationFiles, dataModelFiles, apiHandlerFiles },
  docCoverage: { groupsWithDocs, totalGroups: groups.length, coverageRatio: groups.length ? +(groupsWithDocs / groups.length).toFixed(2) : 0, undocumentedGroups },
  dependencyDirection,
  fileStats: { totalFileNodes: fileNodes.length, filesPerGroup, nodeTypeCounts },
  fileFanIn,
  fileFanOut,
};

fs.writeFileSync(outputPath, JSON.stringify(out, null, 1));
console.log('wrote ' + outputPath + ' groups=' + groups.length + ' files=' + fileNodes.length);
