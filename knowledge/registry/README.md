# Knowledge Registry

This directory is the materialization surface for AGENT-KNOWLEDGE-REGISTRY-V1.

Slice A implements the machine-readable contract, deterministic digest/snapshot logic, fail-closed intake validation, consumer resolution, and synthetic tests under `src/knowledge_registry` and `tests/knowledge_registry`.

Current population state: `EMPTY / BY DESIGN`.

Human Implementation Start GO for Slice A does not itself authorize Registry Population. Seed entries must not be created until a separate population authority is established.

Registry membership does not grant target adoption, Worker authority, repository mutation authority, Ready, Merge, Deploy, or LIVE WRITE authority.

Do not add personal, child-specific, family-specific, customer production, credential, secret, or otherwise sensitive source material to this registry.
