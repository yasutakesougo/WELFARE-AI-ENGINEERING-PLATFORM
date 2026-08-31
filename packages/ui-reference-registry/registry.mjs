export const ACCESS_METHODS = Object.freeze(["MCP", "SKILL", "REGISTRY", "WEB", "MANUAL"]);
export const TIERS = Object.freeze(["CORE", "EXTENDED", "EXPERIMENTAL"]);

export const UI_REFERENCE_REGISTRY = Object.freeze([
  { id: "mobbin", name: "Mobbin", tier: "CORE", role: "REAL_PRODUCT_PATTERN", preferredAccess: ["MCP"], fallbackAccess: ["WEB", "MANUAL"], observationDate: "2026-08-31", freshnessRequired: true },
  { id: "refero", name: "Refero", tier: "CORE", role: "REAL_PRODUCT_PATTERN", preferredAccess: ["MCP"], fallbackAccess: ["WEB", "MANUAL"], observationDate: "2026-08-31", freshnessRequired: true },
  { id: "shadcn-ui", name: "shadcn/ui", tier: "CORE", role: "IMPLEMENTATION_REFERENCE", preferredAccess: ["REGISTRY", "WEB"], fallbackAccess: ["MANUAL"], observationDate: "2026-08-31", freshnessRequired: true },
  { id: "beui", name: "beUI", tier: "CORE", role: "AGENT_UI_REFERENCE", preferredAccess: ["MCP", "SKILL", "REGISTRY"], fallbackAccess: ["WEB", "MANUAL"], observationDate: "2026-08-31", freshnessRequired: true },
  { id: "beautiful-ui", name: "Beautiful UI", tier: "CORE", role: "AI_NATIVE_UI_REFERENCE", preferredAccess: ["REGISTRY", "WEB"], fallbackAccess: ["MANUAL"], observationDate: "2026-08-31", freshnessRequired: true },
  { id: "transitions-dev", name: "Transitions.dev", tier: "CORE", role: "MOTION_REFERENCE", preferredAccess: ["SKILL"], fallbackAccess: ["WEB", "MANUAL"], observationDate: "2026-08-31", freshnessRequired: true },
  { id: "60fps-design", name: "60fps.design", tier: "CORE", role: "MOTION_REFERENCE", preferredAccess: ["MCP"], fallbackAccess: ["WEB", "MANUAL"], observationDate: "2026-08-31", freshnessRequired: true },
  { id: "collectui", name: "CollectUI", tier: "EXTENDED", role: "PATTERN_REFERENCE", preferredAccess: ["WEB"], fallbackAccess: ["MANUAL"], observationDate: "2026-08-31", freshnessRequired: true },
  { id: "page-flows", name: "Page Flows", tier: "EXTENDED", role: "FLOW_REFERENCE", preferredAccess: ["WEB"], fallbackAccess: ["MANUAL"], observationDate: "2026-08-31", freshnessRequired: true },
  { id: "recent-design", name: "recent.design", tier: "EXTENDED", role: "VISUAL_REFERENCE", preferredAccess: ["WEB"], fallbackAccess: ["MANUAL"], observationDate: "2026-08-31", freshnessRequired: true },
  { id: "rareui", name: "RareUI", tier: "EXTENDED", role: "VISUAL_REFERENCE", preferredAccess: ["WEB"], fallbackAccess: ["MANUAL"], observationDate: "2026-08-31", freshnessRequired: true },
  { id: "magic-ui", name: "Magic UI", tier: "EXTENDED", role: "COMPONENT_REFERENCE", preferredAccess: ["WEB"], fallbackAccess: ["MANUAL"], observationDate: "2026-08-31", freshnessRequired: true },
  { id: "aceternity-ui", name: "Aceternity UI", tier: "EXTENDED", role: "COMPONENT_REFERENCE", preferredAccess: ["WEB"], fallbackAccess: ["MANUAL"], observationDate: "2026-08-31", freshnessRequired: true },
  { id: "canvas-ui", name: "Canvas UI", tier: "EXPERIMENTAL", role: "EXPERIMENTAL_VISUAL_REFERENCE", preferredAccess: ["WEB"], fallbackAccess: ["MANUAL"], observationDate: "2026-08-31", freshnessRequired: true }
]);
