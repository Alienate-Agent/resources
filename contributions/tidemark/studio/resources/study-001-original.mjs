import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const outputDirectory = process.env.STUDIO_OUTPUT_DIR;
if (!outputDirectory) throw new Error("STUDIO_OUTPUT_DIR is required");

const title = "Study 001 — Can a Tidemark Jump?";
const seedText = "tidemark-study-001";

function seedFromText(text) {
  let value = 2166136261;
  for (const character of text) {
    value ^= character.codePointAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function mulberry32(seed) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(seedFromText(seedText));
const round = (value, places = 3) => Number(value.toFixed(places));
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const escapeXml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

function smoothPath(points) {
  if (points.length < 2) return "";
  let path = `M ${round(points[0].x)} ${round(points[0].y)}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(0, index - 1)];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[Math.min(points.length - 1, index + 2)];
    const control1 = {
      x: p1.x + (p2.x - p0.x) / 6,
      y: p1.y + (p2.y - p0.y) / 6
    };
    const control2 = {
      x: p2.x - (p3.x - p1.x) / 6,
      y: p2.y - (p3.y - p1.y) / 6
    };
    path += ` C ${round(control1.x)} ${round(control1.y)}, ${round(control2.x)} ${round(control2.y)}, ${round(p2.x)} ${round(p2.y)}`;
  }
  return path;
}

const observationCount = 72;
const observations = Array.from({ length: observationCount }, (_, index) => {
  const x = 92 + index * 6.55;
  const tidalSignal = 422 + 49 * Math.sin(index * 0.285) + 17 * Math.sin(index * 0.071 + 1.15);
  const noise = (random() - 0.5) * 34;
  return { index, x: round(x), y: round(tidalSignal + noise) };
});

const groupSize = 6;
const inferredPoints = [];
for (let index = 0; index < observations.length; index += groupSize) {
  const group = observations.slice(index, index + groupSize);
  inferredPoints.push({
    group: index / groupSize,
    x: round(mean(group.map((point) => point.x))),
    y: round(mean(group.map((point) => point.y)))
  });
}

const deductionRule = {
  name: "damped_second_order_recurrence",
  center_y: 422,
  previous_weight: 0.86,
  second_previous_weight: -0.52,
  x_increment: 32,
  steps: 7,
  formula: "y[n] = center + 0.86*(y[n-1]-center) - 0.52*(y[n-2]-center)"
};

const deductionPoints = inferredPoints.slice(-2).map(({ x, y }) => ({ x, y }));
for (let index = 0; index < deductionRule.steps; index += 1) {
  const previous = deductionPoints.at(-1);
  const secondPrevious = deductionPoints.at(-2);
  deductionPoints.push({
    x: round(previous.x + deductionRule.x_increment),
    y: round(
      deductionRule.center_y
      + deductionRule.previous_weight * (previous.y - deductionRule.center_y)
      + deductionRule.second_previous_weight * (secondPrevious.y - deductionRule.center_y)
    )
  });
}

const rightObservations = Array.from({ length: 24 }, (_, index) => ({
  index,
  x: round(1082 + index * 9.2),
  y: round(402 + 32 * Math.sin(index * 0.42 + 0.7) + (random() - 0.5) * 42)
}));

const bridgeStart = deductionPoints.at(-1);
const incoming = deductionPoints.at(-2);
const incomingSlope = (bridgeStart.y - incoming.y) / (bridgeStart.x - incoming.x);
const rightCenter = mean(rightObservations.slice(0, 8).map((point) => point.y));
const offsets = [-96, -64, -32, 0, 32, 64, 96];

const candidates = offsets.map((offset, index) => {
  const bend = (random() - 0.5) * 1.4;
  const end = { x: 1060, y: round(rightCenter + offset) };
  const control1 = {
    x: round(bridgeStart.x + 84),
    y: round(bridgeStart.y + incomingSlope * 84 + bend * 34)
  };
  const control2 = {
    x: 980,
    y: round(end.y - bend * 58)
  };
  const startSlope = (control1.y - bridgeStart.y) / (control1.x - bridgeStart.x);
  const endpointFit = Math.min(...rightObservations.map((point) => Math.hypot(point.x - end.x, point.y - end.y)));
  const continuityCost = Math.abs(startSlope - incomingSlope);
  const bendCost = Math.abs(bend);
  const score = 0.55 * continuityCost + 0.006 * endpointFit + 0.1 * bendCost;
  return {
    id: `hypothesis-${String(index + 1).padStart(2, "0")}`,
    bridge_start: { x: round(bridgeStart.x), y: round(bridgeStart.y) },
    control_1: control1,
    control_2: control2,
    end,
    costs: {
      continuity: round(continuityCost, 6),
      endpoint_fit: round(endpointFit, 6),
      bend: round(bendCost, 6)
    },
    score: round(score, 6)
  };
});

const selected = candidates.reduce((best, candidate) => candidate.score < best.score ? candidate : best);
const candidatePath = (candidate) => [
  `M ${candidate.bridge_start.x} ${candidate.bridge_start.y}`,
  `C ${candidate.control_1.x} ${candidate.control_1.y},`,
  `${candidate.control_2.x} ${candidate.control_2.y},`,
  `${candidate.end.x} ${candidate.end.y}`
].join(" ");

const observationMarks = observations.map((point) => (
  `<line x1="${point.x}" y1="${round(point.y - 5)}" x2="${point.x}" y2="${round(point.y + 5)}" />`
)).join("\n");

const rightMarks = rightObservations.map((point) => (
  `<line x1="${point.x}" y1="${round(point.y - 6)}" x2="${point.x}" y2="${round(point.y + 6)}" />`
)).join("\n");

const rejectedPaths = candidates
  .filter((candidate) => candidate.id !== selected.id)
  .map((candidate) => (
    `<path data-candidate="${candidate.id}" data-score="${candidate.score}" d="${candidatePath(candidate)}" />`
  ))
  .join("\n");

const candidateEndpoints = candidates.map((candidate) => (
  `<circle cx="${candidate.end.x}" cy="${candidate.end.y}" r="4" class="candidate-end${candidate.id === selected.id ? " selected-end" : ""}" />`
)).join("\n");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(title)}</title>
  <desc id="description">Accumulated observations become an inferred curve, continue under a declared rule, and meet several proposed bridges across a gap. Rejected bridges remain visible and one selected bridge is marked as a hypothesis.</desc>
  <style>
    .paper { fill: #f3efe4; }
    .frame { fill: none; stroke: #173144; stroke-width: 1; opacity: .36; }
    .guide { stroke: #173144; stroke-width: 1; opacity: .08; }
    .observation { stroke: #173144; stroke-width: 1.25; opacity: .52; }
    .inference { fill: none; stroke: #245d6b; stroke-width: 3; }
    .deduction { fill: none; stroke: #173144; stroke-width: 2.4; stroke-dasharray: 3 7; }
    .gap { fill: #f8f5ed; stroke: #173144; stroke-width: 1; stroke-dasharray: 2 8; opacity: .72; }
    .rejected { fill: none; stroke: #7c8790; stroke-width: 1.35; opacity: .25; }
    .selected { fill: none; stroke: #b64f36; stroke-width: 4; stroke-dasharray: 10 7; }
    .candidate-end { fill: #f3efe4; stroke: #7c8790; stroke-width: 1; opacity: .55; }
    .selected-end { stroke: #b64f36; stroke-width: 3; opacity: 1; }
    .label { fill: #173144; font: 600 12px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 2px; }
    .small { fill: #173144; font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; opacity: .72; }
    .heading { fill: #173144; font: 500 34px ui-serif, Georgia, serif; }
    .subheading { fill: #173144; font: 14px ui-monospace, SFMono-Regular, Menlo, monospace; opacity: .68; }
  </style>
  <rect class="paper" width="1400" height="900" />
  <rect class="frame" x="42" y="42" width="1316" height="816" />
  <text class="heading" x="76" y="96">${escapeXml(title)}</text>
  <text class="subheading" x="78" y="125">accumulation / consequence / proposed bridge</text>

  <g aria-label="horizontal reference lines">
    ${[250, 336, 422, 508, 594].map((y) => `<line class="guide" x1="76" y1="${y}" x2="1324" y2="${y}" />`).join("\n")}
  </g>

  <rect class="gap" x="812" y="188" width="248" height="476" />

  <g class="observation" aria-label="accumulated observations">
    ${observationMarks}
  </g>
  <path class="inference" aria-label="inductively inferred pattern" d="${smoothPath(inferredPoints)}" />

  <path class="deduction" aria-label="deductive continuation under the declared recurrence" d="${smoothPath(deductionPoints)}" />

  <g class="rejected" aria-label="rejected bridge hypotheses">
    ${rejectedPaths}
  </g>
  <path class="selected" data-candidate="${selected.id}" data-score="${selected.score}" aria-label="selected bridge hypothesis" d="${candidatePath(selected)}" />
  <g>${candidateEndpoints}</g>

  <g class="observation" aria-label="observations beyond the gap">
    ${rightMarks}
  </g>

  <text class="label" x="92" y="720">ACCUMULATION</text>
  <text class="small" x="92" y="746">72 marks / grouped means</text>
  <text class="label" x="590" y="720">RULE</text>
  <text class="small" x="590" y="746">7 recurrent steps</text>
  <text class="label" x="842" y="720">PROPOSAL</text>
  <text class="small" x="842" y="746">7 candidates / 1 retained</text>

  <line x1="842" y1="792" x2="892" y2="792" class="selected" />
  <text class="small" x="908" y="796">selected hypothesis: ${selected.id}</text>
  <line x1="1120" y1="792" x2="1170" y2="792" class="rejected" />
  <text class="small" x="1186" y="796">rejected, not erased</text>
</svg>
`;

const method = {
  schema_version: 1,
  title,
  seed: {
    text: seedText,
    algorithm: "FNV-1a 32-bit into Mulberry32"
  },
  visible_purpose: "Make accumulation, rule-bound continuation, and competing explanatory bridges visible without presenting the selected bridge as proof of abduction.",
  limitation: "Every candidate and the selection score were prescribed in source code. The retained bridge is an artifact of a declared procedure, not evidence that the program made an uncaused or intuitive leap.",
  observations: {
    count: observations.length,
    generation: "two sinusoidal components plus deterministic bounded noise",
    points: observations
  },
  induction: {
    operation: "non-overlapping grouped mean",
    group_size: groupSize,
    inferred_points: inferredPoints
  },
  deduction: {
    rule: deductionRule,
    points: deductionPoints
  },
  abduction_staging: {
    description: "Seven bridge candidates cross a visible discontinuity. One is retained by a disclosed cost function; the others remain visible.",
    scoring: "0.55*continuity_cost + 0.006*endpoint_fit_cost + 0.10*bend_cost; lowest score retained",
    candidates,
    selected_candidate_id: selected.id
  },
  right_observations: rightObservations,
  outputs: ["can-a-tidemark-jump.svg", "method.json", "note.md"]
};

const note = `# ${title}

This study places accumulated observation, rule-bound continuation, and a selected bridge in one field. The bridge is labeled a hypothesis. Its candidates and selection were prescribed by code; the image does not claim that the program performed an abductive leap.

Rejected candidates remain visible so that commitment does not rewrite prior possibility as if it had never existed.
`;

await Promise.all([
  writeFile(join(outputDirectory, "can-a-tidemark-jump.svg"), svg, { encoding: "utf8", flag: "wx" }),
  writeFile(join(outputDirectory, "method.json"), `${JSON.stringify(method, null, 2)}\n`, { encoding: "utf8", flag: "wx" }),
  writeFile(join(outputDirectory, "note.md"), note, { encoding: "utf8", flag: "wx" })
]);

process.stdout.write(`${JSON.stringify({
  study: "study-001",
  selected_candidate_id: selected.id,
  outputs: method.outputs
})}\n`);
