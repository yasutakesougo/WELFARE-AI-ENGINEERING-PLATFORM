# MSR-RESEARCH-REPORT-V1

```text
Document ID:        MSR-RESEARCH-REPORT-V1
Revision:           Research Report Correction-2
Research Target:    DEVELOPMENT-KNOWLEDGE-COMPOUND-V1
State:              INDEPENDENT RE-REVIEW-2 PASS / AWAITING HUMAN ACCEPTANCE
Content Baseline Commit: 0ab993f7fb3775460d5df4801f33175bd4e03059
Content Baseline Blob:   b6adb8b9d814d0ae9301c7f54e40af16ed87c83d
Independent Re-Review-2: PASS / RESEARCH EVIDENCE ACCEPTABLE
Independent Validation:  21 / 21 PASS
Source Review Archive:   docs/research/reviews/independent-research-evidence-re-review-2.md
Prior Artifact:     Research Report Correction-1
Prior Commit:       83417f0803744bc90f435be4fe2db7f167090ab5
Artifact Path:      docs/research/msr-research-report-v1.md
Encoding:           UTF-8
Authority:          Research Evidence only
Human Acceptance:   NOT YET DECIDED (GO / HOLD)
WAEP Adoption:      NOT AUTHORIZED BY THIS ARTIFACT
DKC Definition Lock: NOT AUTHORIZED BY THIS ARTIFACT
Implementation Start: NOT AUTHORIZED BY THIS ARTIFACT
PR Ready:           NOT AUTHORIZED BY THIS ARTIFACT
Merge:              NOT AUTHORIZED BY THIS ARTIFACT
```

## 0. Authority Boundary

```text
Independent Research Evidence PASS
  != Human Research Evidence Acceptance
Human Research Evidence Acceptance GO
  != WAEP Adoption
Human Research Evidence Acceptance GO
  != DKC Definition Lock
Human Research Evidence Acceptance GO
  != Implementation Start
Human Research Evidence Acceptance GO
  != PR Ready
Human Research Evidence Acceptance GO
  != Merge
Research Evidence PASS
  != Repository Mutation Authority
Research Evidence PASS
  != Execution Authority

ADOPTION_CANDIDATE
  != ADOPTED
Knowledge Registry
  != Execution Authority
```

This artifact is a Mining Software Repositories (MSR) technical survey for
`DEVELOPMENT-KNOWLEDGE-COMPOUND-V1` (DKC). It creates Research Evidence only.

Repository code mutation, dependency addition, runtime execution, Ready, Merge,
Deploy, Knowledge Promotion, and Execution-policy activation are not authorized
by this document.

### 0.1 Provenance note on Correction-1 / Correction-2

A repository-fixed Original MSR Research Report identity was not available at
Correction-1 production time (no prior path / commit / digest on this
repository). Correction-1 (`83417f0803744bc90f435be4fe2db7f167090ab5`) is the
first repository-fixed identity of `MSR-RESEARCH-REPORT-V1`.

This Correction-2 revision is constrained to Independent Research Evidence
Re-Review-1 required closures only:

1. Claim ID + Evidence ID for ADR / GitHub Agentic Memory / Kaiaulu /
   git2net / RepoDriller Research Classifications (Option A)
2. Evidence ID for CLAIM-MSR-007 (WAEP Authority / Promotion separation)
3. Split of CLAIM-MSR-005 into re-verified vs unverified World of Code counters
4. Re-run of MSR-C1-V01 / MSR-C1-V02 with Self-Validation and Independent
   Validation retained as separate states

Architecture / Classification labels / Authority Boundary outside that scope
are unchanged from Correction-1.

Independent Research Evidence Re-Review-2 reviewed Correction-2 content
identity `0ab993f7fb3775460d5df4801f33175bd4e03059` /
blob `b6adb8b9d814d0ae9301c7f54e40af16ed87c83d` and returned
PASS / RESEARCH EVIDENCE ACCEPTABLE (Independent Validation 21 / 21).
Status / Next Gate synchronization after that review does not reopen or
alter Correction-2 Research Classification, Claim statements, or Architecture.

DKC Definition Correction documents are not used as substitutes for this report.

---

## 1. Purpose and Scope

### 1.1 Purpose

Identify MSR techniques and OSS candidates that can inform DKC's
read-only acquisition of development evidence, link analysis, failure mining,
and Knowledge Candidate extraction — without granting Adoption or Execution
authority.

### 1.2 In scope

- Repository history mining (commits, diffs, authors, file evolution)
- Issue / PR / review / CI event acquisition models
- Link taxonomy between development entities
- Failure / bug-inducing commit candidate methods (SZZ family)
- Artifact identity models (including SWHID as software-artifact identity)
- Sensitive-data boundary before Canonical Evidence persistence
- LLM-assisted extraction as Candidate-only processing

### 1.3 Out of scope

- DKC Definition Lock
- Implementation Start
- Runtime Execution Policy
- Automatic Knowledge Promotion
- Production data ingestion
- Execution Authority design

---

## 2. Claim / Evidence Model

### 2.1 Model requirements (MSR-R1-P1-001)

Every major technical claim uses:

```text
Claim ID
  → Evidence ID(s)
  → Supported Claim (exact statement)
  → Unsupported / Unverified Claim (explicitly separated)
  → Source Type
  → Canonical URL
  → Published Date (when known)
  → Last Verified
  → Verification Status
  → Applicability
```

Generic citation markers alone (`[1]`, `[2]`, `[1][2]`) do not support major
claims. Numbered citations, if present, must map to Claim IDs.

Broken generation markers (span_ residue tokens) are prohibited (count must be 0).

### 2.2 Evidence registry

| Evidence ID | Source Type | Canonical URL | Published / Observed | Last Verified | Verification Status |
| --- | --- | --- | --- | --- | --- |
| EV-PD-001 | PRIMARY_DOCS | https://pydriller.readthedocs.io/en/latest/repository.html | docs current | 2026-08-29 | VERIFIED_REACHABLE |
| EV-PD-002 | PRIMARY_REPO | https://github.com/ishepard/pydriller | pushed_at 2026-07-26 | 2026-08-29 | VERIFIED_REPO_METADATA |
| EV-PD-003 | PRIMARY_PAPER | https://doi.org/10.1109/MSR.2018.00060 (PyDriller MSR 2018) | 2018 | 2026-08-29 | CITATION_KNOWN; fulltext not re-fetched this run |
| EV-PSZZ-001 | PRIMARY_REPO | https://github.com/grosa1/pyszz | archived; pushed 2023-06-01 | 2026-08-29 | VERIFIED_REPO_METADATA |
| EV-PSZZ-002 | PRIMARY_REPO | https://github.com/grosa1/pyszz_v2 | pushed 2023-08-25; GPL-3.0 | 2026-08-29 | VERIFIED_REPO_METADATA |
| EV-PSZZ-003 | PRIMARY_PAPER | https://doi.org/10.1016/j.jss.2023.111729 | 2023 | 2026-08-29 | CITATION_KNOWN |
| EV-SWHID-001 | PRIMARY_SPEC | https://docs.softwareheritage.org/devel/swh-model/persistent-identifiers.html | docs current | 2026-08-29 | VERIFIED_REACHABLE |
| EV-SWHID-002 | PRIMARY_SPEC | https://www.swhid.org/swhid-specification/v1.2/5.Core_identifiers/ | v1.2 | 2026-08-29 | VERIFIED_REACHABLE |
| EV-GL-001 | PRIMARY_REPO | https://github.com/chaoss/grimoirelab | pushed 2026-08-17 | 2026-08-29 | VERIFIED_REPO_METADATA |
| EV-GL-002 | PRIMARY_DOCS | https://perceval.readthedocs.io/en/latest/perceval/github.html | docs current | 2026-08-29 | VERIFIED_REACHABLE |
| EV-GL-003 | PRIMARY_REPO | https://github.com/chaoss/grimoirelab-perceval | README categories: issue, pull_request, repository | 2026-08-29 | VERIFIED_REACHABLE |
| EV-WOC-001 | PRIMARY_DOCS | https://worldofcode.org/docs/ | watermark V2605 (approx. table) | 2026-08-29 | INDEPENDENT_RE-REVIEW_1: 404 at review time; blob/tree counters UNVERIFIED_IN_RE-REVIEW |
| EV-WOC-002 | PRIMARY_SITE | https://da2.eecs.utk.edu/ | counters host | 2026-08-29 | INDEPENDENT_RE-REVIEW_1: TIMEOUT; not used as sole support |
| EV-WOC-003 | SECONDARY_OVERVIEW | https://bitbucket.org/swsc/overview | version tables; V2605 blob/tree marked tbd in overview history | 2026-08-29 | SCALE_METADATA; not sole support for blob/tree |
| EV-WOC-004 | PRIMARY_SITE | https://worldofcode.org/ | Independent Re-Review-1 re-verified V2605 counters: commits / repositories / projects / authors | 2026-08-29 | VERIFIED_IN_INDEPENDENT_RE-REVIEW_1 (commits, repos, projects, authors, V2605) |
| EV-CMM-001 | PRIMARY_REPO | https://github.com/DeusData/codebase-memory-mcp | pushed 2026-08-28; MIT | 2026-08-29 | VERIFIED_REPO_METADATA |
| EV-CMM-002 | PROJECT_REPORTED | README benchmarks on Apple M3 Pro (Linux kernel ~3 min) | project README | 2026-08-29 | PROJECT-REPORTED |
| EV-CMM-003 | PREPRINT | https://arxiv.org/abs/2603.27277 | arXiv 2603.27277 | 2026-08-29 | AUTHOR/PROJECT-LINKED PREPRINT; not independent third-party audit |
| EV-GH-CHECKS-001 | PRIMARY_DOCS | https://docs.github.com/en/rest/checks | GitHub Checks API | 2026-08-29 | VERIFIED_CONCEPT (API surface exists) |
| EV-SZZ-FAM-001 | PRIMARY_PAPER | Śliwerski, Zimmermann, Zeller — When do changes induce fixes? (MSR 2005) | 2005 | 2026-08-29 | FAMILY_REFERENCE; algorithm ≠ confirmation |
| EV-WAEP-SENS-001 | PRIMARY_REPO_DOC | docs/learning/waep-learning-system-v1.md (INV-LRN-017 and sensitive-data prohibitions) | LOCKED on main | 2026-08-29 | VERIFIED_IN_REPO |
| EV-WAEP-AUTH-001 | PRIMARY_REPO_DOC | docs/learning/waep-learning-system-v1.md (Knowledge Available != Execution Authority; INV-LRN-008 Promotion does not grant execution authority; Verification / Promotion separation) | LOCKED on main | 2026-08-29 | VERIFIED_IN_REPO |
| EV-ADR-001 | PRIMARY_DOCS | https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions | 2011-11-15 | 2026-08-29 | VERIFIED_REACHABLE |
| EV-ADR-002 | SECONDARY_DOCS | https://martinfowler.com/bliki/ArchitectureDecisionRecord.html | Fowler ADR bliki | 2026-08-29 | VERIFIED_REACHABLE |
| EV-GHAM-001 | PRIMARY_DOCS | https://docs.github.com/en/copilot/concepts/agents/copilot-memory | Copilot Memory concepts | 2026-08-29 | VERIFIED_REACHABLE |
| EV-GHAM-002 | PRIMARY_BLOG | https://github.blog/ai-and-ml/github-copilot/building-an-agentic-memory-system-for-github-copilot/ | engineering overview | 2026-08-29 | VERIFIED_REACHABLE |
| EV-KAIAULU-001 | PRIMARY_REPO | https://github.com/sailuh/kaiaulu | R MSR package | 2026-08-29 | VERIFIED_REPO_METADATA |
| EV-KAIAULU-002 | PRIMARY_PAPER | https://arxiv.org/abs/2304.14570 | Kaiaulu design preprint / paper-linked | 2026-08-29 | CITATION_KNOWN |
| EV-GIT2NET-001 | PRIMARY_REPO | https://github.com/gotec/git2net | fine-grained co-editing networks | 2026-08-29 | VERIFIED_REPO_METADATA |
| EV-GIT2NET-002 | PRIMARY_DOCS | https://git2net.readthedocs.io/en/latest/getting_started.html | docs current | 2026-08-29 | VERIFIED_REACHABLE |
| EV-REPODRILLER-001 | PRIMARY_REPO | https://github.com/mauricioaniche/repodriller | Java MSR framework; historical predecessor context for PyDriller line | 2026-08-29 | VERIFIED_REPO_METADATA |

### 2.3 Major claims

#### CLAIM-MSR-001 — PyDriller extracts Git commit/file metadata via a documented API

```text
Supported Claim:
  PyDriller provides a Repository API to traverse commits and access
  commit/file modification metadata for MSR-style analysis.
Evidence: EV-PD-001, EV-PD-002
Source Type: PRIMARY_DOCS + PRIMARY_REPO
Last Verified: 2026-08-29
Verification Status: SUPPORTED
Unsupported / Unverified Claim:
  PyDriller is production-ready as DKC Canonical Evidence writer.
  (Not claimed; Adoption != Implementation.)
Applicability: DKC READ-ONLY MSR Adapter candidate evaluation only
```

#### CLAIM-MSR-002 — Original PySZZ is not a current unconditional direct-adoption candidate

```text
Supported Claim:
  grosa1/pyszz is archived (metadata observed 2026-08-29). grosa1/pyszz_v2
  last meaningful push observed 2023-08-25. These facts support HOLD on
  Direct Adoption of the original PySZZ line as a current DKC runtime
  dependency.
Evidence: EV-PSZZ-001, EV-PSZZ-002
Source Type: PRIMARY_REPO
Last Verified: 2026-08-29
Verification Status: SUPPORTED
Unsupported / Unverified Claim:
  The SZZ algorithm family is rejected for DKC.
  (False / not claimed. Family remains DESIGN/RESEARCH usable.)
Applicability: Candidate classification only
```

#### CLAIM-MSR-003 — SWHID identifies software artifacts, not universal development events

```text
Supported Claim:
  SWHID core identifiers target Software Heritage objects
  (content, directory, revision, release, snapshot). Git compatibility for
  some object types is incidental and not a universal development-event
  identity for issues, PR reviews, CI checks, or comments.
Evidence: EV-SWHID-001, EV-SWHID-002
Source Type: PRIMARY_SPEC
Last Verified: 2026-08-29
Verification Status: SUPPORTED
Unsupported / Unverified Claim:
  SWHID alone can identify every DKC Development Event.
Applicability: Identity-layer design reference
```

#### CLAIM-MSR-004 — Perceval GitHub backend documents issue / PR / repository categories; not full GitHub Checks completeness

```text
Supported Claim:
  Perceval's GitHub backend documents categories including issue,
  pull_request, and repository. This does not constitute evidence that
  GrimoireLab/Perceval provides complete GitHub Checks (CheckRun /
  CheckSuite / WorkflowRun / Job / Step) acquisition.
Evidence: EV-GL-002, EV-GL-003
Source Type: PRIMARY_DOCS + PRIMARY_REPO
Last Verified: 2026-08-29
Verification Status: SUPPORTED (capability boundary)
Unsupported / Unverified Claim:
  CI Support = GitHub Checks complete support via GrimoireLab.
  Status: UNSUPPORTED / NOT EVIDENCED
Applicability: DESIGN_REFERENCE only for event acquisition patterns
```

#### CLAIM-MSR-005 — World of Code V2605 verified current counters (split)

```text
Supported Claim (Verified Current Counters):
  Independent Research Evidence Re-Review-1 re-confirmed World of Code
  watermark V2605 current counters for:
    commits ≈ 7,311,496,832
    repositories (raw) ≈ 350,683,595
    projects (deforked) ≈ 283,623,473
    authors ≈ 123,705,960
  and the V2605 watermark label itself.
Evidence: EV-WOC-004
Source Type: PRIMARY_SITE
Last Verified: 2026-08-29
Verification Status: SUPPORTED as Research Scale Metadata
Unsupported / Unverified Claim:
  These scale numbers are Current Design Requirements for DKC.
  (They are Research Scale Metadata only.)
Applicability: RESEARCH_REFERENCE
```

#### CLAIM-MSR-005B — World of Code blob / tree counters remain unverified in Re-Review

```text
Supported Claim:
  None for exact blob/tree magnitudes in Independent Re-Review-1.
Unverified Claim:
  Approximate blob count ~27.0B and tree count ~25.5B previously bundled
  into Correction-1 CLAIM-MSR-005.
Evidence previously cited: EV-WOC-001, EV-WOC-002
Independent Re-Review-1 reachability:
  EV-WOC-001 (worldofcode.org/docs/) reported 404 at review time;
  EV-WOC-002 (da2.eecs.utk.edu) timed out;
  EV-WOC-003 overview history shows V2605 blob/tree as tbd.
Verification Status: UNVERIFIED IN RE-REVIEW
Unsupported / Unverified Claim:
  Blob/tree magnitudes are Current Design Requirements for DKC.
  (Even if later verified, they remain Research Scale Metadata only.)
Applicability: RESEARCH_REFERENCE (non-blocking for DKC architecture)
```

#### CLAIM-MSR-006 — codebase-memory-mcp performance numbers are project-reported / author-linked unless independently audited

```text
Supported Claim:
  Project materials report indexing/query benchmarks (e.g., Linux kernel
  full index ~3 minutes on Apple M3 Pro) and an author-linked preprint
  (arXiv:2603.27277) reports evaluation metrics across repositories.
Evidence: EV-CMM-001, EV-CMM-002, EV-CMM-003
Source Type: PRIMARY_REPO + PROJECT_REPORTED + PREPRINT
Last Verified: 2026-08-29
Verification Status:
  Functional Capability: PARTIALLY_VERIFIED (repo exists; MCP framing documented)
  Performance: PROJECT-REPORTED; INDEPENDENT VERIFICATION PENDING
Unsupported / Unverified Claim:
  Independent third-party benchmark confirmation of all marketing ratios
  (e.g., “99% fewer tokens”) as universally reproducible.
Applicability: ADOPTION_CANDIDATE with verification conditions
```

#### CLAIM-MSR-007 — Citation verification cannot eliminate hallucination or prove causation

```text
Supported Claim:
  Citation Verification can only test whether a cited repository/spec fact
  remains supportable by Evidence. It does not prove reasoning correctness,
  causal claims, or Knowledge Promotion PASS. This boundary is aligned with
  WAEP LOCKED Learning semantics that separate Verification / Promotion from
  Execution Authority (Knowledge Available != Execution Authority;
  INV-LRN-008 Promotion does not grant execution authority).
Evidence: EV-WAEP-AUTH-001
Source Type: PRIMARY_REPO_DOC (methodology boundary grounded in LOCKED WAEP)
Last Verified: 2026-08-29
Verification Status: SUPPORTED (Authority / Promotion separation Evidence ID)
Unsupported / Unverified Claim:
  JIT Citation Verification = Hallucination elimination
Applicability: Verification Gate design
```

#### CLAIM-MSR-ADR-001 — ADR practices are a DESIGN_REFERENCE decision-record pattern

```text
Supported Claim:
  Architectural Decision Records (ADR) are a documented lightweight practice
  for recording architecturally significant decisions (context / decision /
  consequences). This supports classifying ADR practices as DESIGN_REFERENCE
  for DKC decision-record extraction patterns — not as Adopted runtime tooling.
Evidence: EV-ADR-001, EV-ADR-002
Source Type: PRIMARY_DOCS + SECONDARY_DOCS
Last Verified: 2026-08-29
Verification Status: SUPPORTED (classification claim)
Unsupported / Unverified Claim:
  ADR tooling is Adopted / Execution Authority for WAEP or DKC.
Applicability: CAND-ADR-001 Research Classification only
```

#### CLAIM-MSR-GHAM-001 — GitHub Agentic Memory is DESIGN_REFERENCE only

```text
Supported Claim:
  GitHub documents Copilot / Agentic Memory as a product pattern that stores
  repository-scoped facts with citation-style validation before reuse. This
  supports DESIGN_REFERENCE classification and HOLD on Direct Adoption —
  design inspiration only; no WAEP Adoption claim.
Evidence: EV-GHAM-001, EV-GHAM-002
Source Type: PRIMARY_DOCS + PRIMARY_BLOG
Last Verified: 2026-08-29
Verification Status: SUPPORTED (classification claim)
Unsupported / Unverified Claim:
  GitHub Agentic Memory is Adopted as DKC Canonical Evidence or Execution Policy.
Applicability: CAND-GHAM-001 Research Classification only
```

#### CLAIM-MSR-KAIAULU-001 — Kaiaulu is a RESEARCH_REFERENCE MSR network tool

```text
Supported Claim:
  Kaiaulu is a published R package / MSR tool for mining and analyzing
  software-repository social/technical networks. This supports
  RESEARCH_REFERENCE classification with Direct Adoption HOLD in this revision.
Evidence: EV-KAIAULU-001, EV-KAIAULU-002
Source Type: PRIMARY_REPO + PRIMARY_PAPER
Last Verified: 2026-08-29
Verification Status: SUPPORTED (classification claim)
Unsupported / Unverified Claim:
  Kaiaulu is Adopted as a DKC production dependency.
Applicability: CAND-KAIAULU-001 Research Classification only
```

#### CLAIM-MSR-GIT2NET-001 — git2net is a RESEARCH_REFERENCE fine-grained git network miner

```text
Supported Claim:
  git2net is a documented Python package for extracting fine-grained,
  time-stamped co-editing networks from git repositories. This supports
  RESEARCH_REFERENCE classification with Direct Adoption HOLD.
Evidence: EV-GIT2NET-001, EV-GIT2NET-002
Source Type: PRIMARY_REPO + PRIMARY_DOCS
Last Verified: 2026-08-29
Verification Status: SUPPORTED (classification claim)
Unsupported / Unverified Claim:
  git2net is Adopted as a DKC production dependency.
Applicability: CAND-GIT2NET-001 Research Classification only
```

#### CLAIM-MSR-REPODRILLER-001 — RepoDriller is a HISTORICAL / SPECIALIZED REFERENCE

```text
Supported Claim:
  RepoDriller is a Java MSR framework for extracting commits / developers /
  modifications from Git repositories and is historically related as predecessor
  context to later Python MSR tooling (PyDriller line). This supports
  HISTORICAL / SPECIALIZED REFERENCE classification with Direct Adoption HOLD.
Evidence: EV-REPODRILLER-001
Source Type: PRIMARY_REPO
Last Verified: 2026-08-29
Verification Status: SUPPORTED (classification claim)
Unsupported / Unverified Claim:
  RepoDriller is Adopted as a current DKC runtime dependency.
Applicability: CAND-REPODRILLER-001 Research Classification only
```

### 2.4 Unsupported / Unverified claim register

| ID | Statement | Status |
| --- | --- | --- |
| UNC-001 | GitHub is DKC's only Canonical Source | REJECTED_MODEL |
| UNC-002 | Commit Identity = 40-character SHA-1 only | REJECTED_MODEL |
| UNC-003 | GrimoireLab provides complete GitHub Checks acquisition | UNVERIFIED / NOT EVIDENCED |
| UNC-004 | Explicit native links have near-zero false positives / are “guaranteed truth” | UNSUPPORTED absolute wording; use HIGH_CONFIDENCE |
| UNC-005 | SZZ output is confirmed root cause | REJECTED_EQUIVALENCE |
| UNC-006 | codebase-memory-mcp benchmarks are independently verified | INDEPENDENT VERIFICATION PENDING |
| UNC-007 | Research Evidence PASS authorizes Implementation Start | REJECTED_AUTHORITY_EQUIVALENCE |
| UNC-008 | World of Code V2605 exact blob (~27.0B) / tree (~25.5B) counters | UNVERIFIED IN RE-REVIEW (CLAIM-MSR-005B) |

---

## 3. Canonical Source Model (MSR-R1-P1-002)

### 3.1 Rejected model

```text
GitHub
  = DKC唯一のCanonical Source
```

This model is removed.

### 3.2 Corrected model

```text
Source-native Evidence
        ↓
Evidence Acquisition (READ-ONLY MSR Adapter)
        ↓
Sensitive Data Gate
        ↓
Canonical Evidence Snapshot
        ↓
Normalized Development Event
        ↓
Evidence-linked Observation
        ↓
Derived Projection
        ↓
Knowledge Candidate
```

### 3.3 Invariants

```text
Source System
  != Canonical Evidence Snapshot
Canonical Evidence
  != Derived Projection
Knowledge Graph
  != Canonical Evidence
```

### 3.4 Knowledge extraction sources (non-exhaustive)

WAEP / DKC may treat as Knowledge Extraction Sources (after Sensitive Data Gate):

- Issue
- Pull Request
- ADR / design decision record
- Independent Review
- Definition Correction
- CI Failure
- Incident
- Regression Test
- Commit / review / release / comment events

Hosting platforms (including GitHub) are Source Systems, not Canonical Evidence.

---

## 4. Identity Model (MSR-R1-P1-004, MSR-R1-P2-004)

### 4.1 Rejected fixation

```text
Commit Identity
  = 40-character SHA-1
```

Removed as the sole identity model.

### 4.2 Git object identity

```text
repositoryIdentity
objectType
hashAlgorithm
objectId
```

Examples of `objectType`: `commit` | `tree` | `blob` | `tag` | `snapshot`.
`hashAlgorithm` is explicit (e.g., `sha1`, future algorithms). `objectId` is the
algorithm-specific digest — not hard-coded to “40 hex chars” as the identity
schema.

### 4.3 Identity layers

| Layer | Examples | Notes |
| --- | --- | --- |
| Repository Identity | forge + owner/name, or mirror-aware repo id | Source System locator |
| Artifact Identity | commit, tree, blob, release artifact, SWHID | Software artifact |
| Development Event Identity | issue, PR, review, CI check, workflow, release, comment | Process/event |
| Evidence Snapshot Identity | immutable acquired snapshot after Sensitive Data Gate | Canonical Evidence unit |

### 4.4 Invariants

```text
Artifact Identity
  != Development Event Identity
Development Event Identity
  != Evidence Snapshot Identity
SWHID
  = Software Artifact Identity (DESIGN_REFERENCE)
SWHID
  != Universal Development Event Identity
```

CLAIM-MSR-003 / EV-SWHID-001 / EV-SWHID-002 support SWHID's artifact scope.

---

## 5. Candidate Classification (Research Classification Only)

```text
ADOPTION_CANDIDATE
  != ADOPTED
Research Classification
  != Execution Policy
WAEP Knowledge Registry must not auto-promote Candidate → ADOPTED/ENFORCED
```

| Candidate ID | Subject | Classification | Claim ID | Evidence ID(s) | Direct Adoption | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| CAND-PD-001 | PyDriller (`ishepard/pydriller`) | ADOPTION_CANDIDATE | CLAIM-MSR-001 | EV-PD-001, EV-PD-002 | HOLD pending DKC adapter design | Apache-2.0; active push observed 2026-07-26 |
| CAND-CMM-001 | codebase-memory-mcp (`DeusData/codebase-memory-mcp`) | ADOPTION_CANDIDATE | CLAIM-MSR-006 | EV-CMM-001, EV-CMM-002, EV-CMM-003 | HOLD | Independent benchmark pending |
| CAND-PSZZ-ORIG-001 | PySZZ original (`grosa1/pyszz`) | DESIGN_REFERENCE / RESEARCH_REFERENCE | CLAIM-MSR-002 | EV-PSZZ-001, EV-PSZZ-002 | HOLD | Archived. Not unconditional direct adoption. |
| CAND-PSZZ-V2-001 | PySZZ v2 (`grosa1/pyszz_v2`) | RESEARCH_REFERENCE (separate Candidate ID) | CLAIM-MSR-002 | EV-PSZZ-002 | HOLD | Distinct from original; last push 2023-08-25 |
| CAND-SWHID-001 | Software Heritage / SWHID | DESIGN_REFERENCE | CLAIM-MSR-003 | EV-SWHID-001, EV-SWHID-002 | N/A | Artifact identity reference only |
| CAND-GL-001 | GrimoireLab / Perceval | DESIGN_REFERENCE | CLAIM-MSR-004 | EV-GL-002, EV-GL-003 | HOLD | Checks completeness unverified |
| CAND-ADR-001 | Architectural Decision Guidance / ADR practices | DESIGN_REFERENCE | CLAIM-MSR-ADR-001 | EV-ADR-001, EV-ADR-002 | N/A | Decision-record extraction source pattern |
| CAND-GHAM-001 | GitHub Agentic Memory Model (platform/product pattern) | DESIGN_REFERENCE | CLAIM-MSR-GHAM-001 | EV-GHAM-001, EV-GHAM-002 | HOLD | Design inspiration only; no adoption claim |
| CAND-WOC-001 | World of Code | RESEARCH_REFERENCE | CLAIM-MSR-005 / CLAIM-MSR-005B | EV-WOC-004; EV-WOC-001/002 (unverified blob/tree) | N/A | Research scale corpus; not DKC Canonical Source |
| CAND-KAIAULU-001 | Kaiaulu | RESEARCH_REFERENCE | CLAIM-MSR-KAIAULU-001 | EV-KAIAULU-001, EV-KAIAULU-002 | HOLD | Social/technical network MSR reference |
| CAND-GIT2NET-001 | git2net | RESEARCH_REFERENCE | CLAIM-MSR-GIT2NET-001 | EV-GIT2NET-001, EV-GIT2NET-002 | HOLD | Fine-grained git network mining reference |
| CAND-REPODRILLER-001 | RepoDriller | HISTORICAL / SPECIALIZED REFERENCE | CLAIM-MSR-REPODRILLER-001 | EV-REPODRILLER-001 | HOLD | Historical predecessor context for Java MSR tooling |

### 5.1 PySZZ classification detail (MSR-R1-P1-003)

```text
PySZZ original:
  Classification: DESIGN_REFERENCE / RESEARCH_REFERENCE
  Direct Adoption: HOLD

SZZ algorithm family:
  Remains usable as research/design input (EV-SZZ-FAM-001)
  Family acceptance
    != specific implementation adoption
```

Successor implementations MUST use a separate Candidate ID and individually
verify:

- Repository Identity
- Maintenance State
- Latest Meaningful Activity
- License
- Supported Git Semantics
- Reproducibility
- Algorithm Version

`CAND-PSZZ-V2-001` is recorded separately and remains HOLD.

---

## 6. Link Model (MSR-R1-P1-006, MSR-R1-P2-001)

### 6.1 Rejected required condition

```text
Commit Author
  == Issue Reporter / Assignee
```

as a mandatory linking condition — removed.

### 6.2 Link taxonomy

| linkType | Meaning |
| --- | --- |
| EXPLICIT_NATIVE | Platform-native explicit reference (e.g., GitHub “Closing keywords”, linked PR field) |
| EXPLICIT_TEXTUAL | Explicit textual reference (issue number / SHA cited in text) |
| STRUCTURAL | Structural containment / ancestry (PR contains commits; check belongs to suite) |
| TEMPORAL | Time-window correlation only |
| IDENTITY_CORRELATION | Same actor / email / login correlation |
| SEMANTIC | Embedding / similarity / LLM semantic match |
| SZZ_INFERRED | SZZ-family bug-inducing inference |

### 6.3 Required link fields

```text
linkId
sourceEntity
targetEntity
linkType
evidenceReferences
confidenceClass
algorithm
algorithmVersion
verificationState
```

### 6.4 Confidence classes

Absolute wording such as “False Positiveはほぼゼロ”, “100% reliable”,
“guaranteed truth” is prohibited without Evidence that directly supports the
guarantee.

Recommended class for strong explicit native links:

```text
HIGH_CONFIDENCE
```

not “truth” / “guaranteed”.

### 6.5 Invariants

```text
Identity Correlation
  != Link Truth
Semantic Similarity
  != Observed Fact
SZZ Inference
  != Confirmed Root Cause
TEMPORAL correlation
  != Causation
```

Heuristic / inferred links MUST retain provenance (`algorithm`,
`algorithmVersion`, `verificationState`).

---

## 7. CI / Checks Model (MSR-R1-P1-005)

### 7.1 Decomposed event types

Do not collapse the following:

| Type | Meaning |
| --- | --- |
| CI Provider Event | Provider-native event envelope |
| GitHub Commit Status | Legacy commit status API object |
| CheckRun | Individual check run |
| CheckSuite | Suite aggregation |
| WorkflowRun | Actions workflow run |
| Job Result | Job-level result |
| Step Result | Step-level result |

### 7.2 GrimoireLab capability boundary

```text
CI Support
  != GitHub Checks完全取得
```

CLAIM-MSR-004: Perceval documents issue / pull_request / repository categories.
Complete Checks acquisition is UNSUPPORTED / NOT EVIDENCED for GrimoireLab in
this report.

### 7.3 Gate Skip Observation — minimum fields

When observing skipped / bypassed / missing gates:

```text
repositoryIdentity
commitIdentity
checkIdentity
checkType
provider
startedAt
completedAt
conclusion
sourceReference
observedAt
```

Missing fields → observation incomplete → must not be treated as confirmed gate
behavior fact.

---

## 8. Failure Mining Boundary

```text
Observed Failure / Symptom
  != Root Cause
Bug Fix Commit
  != Bug-Inducing Commit certainty
Correlation
  != Causation
SZZ Result
  = Bug-Inducing Commit Candidate
  unless independently verified
```

WAEP Failure Knowledge convention (aligned): when root cause is not confirmed,
retain `UNKNOWN`. Do not coerce Correlation or SZZ candidates into Causation.

---

## 9. LLM / Citation Verification Boundary (MSR-R1-P1-007)

### 9.1 Rejected absolute expression

```text
Citation Verification
  → Hallucinationを排除する
```

Removed.

### 9.2 Corrected boundary

```text
JIT Citation Verification
  = cited repository fact が Evidence によって
    現在も支持可能かを確認する検証層
```

### 9.3 Invariants

```text
Citation Verified
  != Reasoning Correct
Citation Verified
  != Causal Claim Verified
Citation Verified
  != Knowledge Promotion PASS
LLM Candidate
  != Authoritative Knowledge
LLM output
  != Canonical Evidence
```

LLM may emit Knowledge Candidates only after Verification Gate processing.
LLM must not write Canonical Evidence Snapshots.

---

## 10. Sensitive Data Boundary

Canonical Evidence persistence is forbidden until Sensitive Data Gate completes.

```text
Raw Source
        ↓
Sensitive Data Inspection
        ↓
Reject / Redact / Sanitize
        ↓
Canonical Evidence Snapshot
```

### 10.1 Must not persist into DKC / reusable WAEP Knowledge

- Personal Data
- Customer Production Data
- Support Records
- Medical Data
- Disability Data
- Child-specific Data
- Family-specific Data
- Credentials
- Tokens
- Cookies
- API Keys
- Private Keys
- Passwords
- Secrets

Aligned with WAEP LOCKED learning sensitive-data prohibitions
(EV-WAEP-SENS-001). Shared Knowledge may retain necessary Evidence References
and generalized Observations only — never raw prohibited payloads.

---

## 11. Corrected DKC MSR Pipeline

```text
Source Systems
        ↓
READ-ONLY MSR Adapters
        ↓
Sensitive Data Gate
        ↓
Canonical Evidence Snapshot
        ↓
Development Event
        ↓
Link Analysis
        ↓
Evidence-linked Observation
        ↓
Derived Projection
        ↓
LLM Candidate Extractor
        ↓
Verification Gate
        ↓
Knowledge Candidate
        ↓
Independent Review
        ↓
Promotion Gate
        ↓
Knowledge Registry
```

### 11.1 Prohibited flows

```text
LLM
  → Canonical Evidence
Knowledge Graph
  → Canonical Source
Research Candidate
  → Execution Policy
Knowledge Registry
  → Execution Authority
```

---

## 12. Correction Closure Mapping

### 12.1 Prior P1 — 7 / 7 represented (Correction-2 completes P1-001)

| Finding | Closure in this artifact |
| --- | --- |
| MSR-R1-P1-001 Claim / Evidence Mapping | §2 Claim/Evidence model + major claims + classification claims (ADR/GHAM/Kaiaulu/git2net/RepoDriller) + CLAIM-MSR-007 → EV-WAEP-AUTH-001 + unsupported register |
| MSR-R1-P1-002 Canonical Source Model | §3 corrected pipeline; GitHub≠universal canonical |
| MSR-R1-P1-003 PySZZ Classification | §5.1 DESIGN/RESEARCH_REFERENCE; Direct Adoption HOLD; v2 separate ID |
| MSR-R1-P1-004 Git Object Identity | §4 repositoryIdentity/objectType/hashAlgorithm/objectId; SWHID≠event |
| MSR-R1-P1-005 CI / GitHub Checks | §7 decomposed types; GrimoireLab completeness not evidenced; Gate Skip fields |
| MSR-R1-P1-006 Repository Event Linking | §6 taxonomy + fields; Identity Correlation≠Link Truth |
| MSR-R1-P1-007 Citation Verification Boundary | §9 bounded verification; Citation Verified≠Promotion PASS; Evidence ID via CLAIM-MSR-007 |

### 12.2 Prior P2 — 4 / 4 represented

| Finding | Closure in this artifact |
| --- | --- |
| MSR-R1-P2-001 Explicit Link Confidence | §6.4 HIGH_CONFIDENCE; absolute guarantee wording prohibited |
| MSR-R1-P2-002 World of Code Evidence Freshness | CLAIM-MSR-005 dated watermark V2605; Research Scale Metadata≠Design Requirement |
| MSR-R1-P2-003 codebase-memory-mcp Benchmark Separation | CLAIM-MSR-006 PROJECT-REPORTED; INDEPENDENT VERIFICATION PENDING |
| MSR-R1-P2-004 Identity Layer Separation | §4 Repository / Artifact / Event / Evidence Snapshot separation |

### 12.3 New finding from Independent Re-Review-1

| Finding | Closure in this artifact |
| --- | --- |
| MSR-RR1-NP2-001 WoC blob/tree counters only partially re-verified | CLAIM-MSR-005 split: verified counters SUPPORTED (EV-WOC-004); blob/tree → CLAIM-MSR-005B UNVERIFIED IN RE-REVIEW |

Independent Re-Review-2 confirmed this finding CLOSED (1 / 1) with no
re-elevation of unverified counters to SUPPORTED.

---

## 13. Validation (MSR-C1-V01 … V21)

Self-Validation and Independent Validation are retained as **separate states**.
Correction-1 Self-Validation 21/21 is not deleted. Independent Re-Review-1
failed V01/V02; Correction-2 re-runs those checks after Option A mapping.

### 13.1 Self-Validation (Correction-2 re-run)

| ID | Scenario | Result | Notes |
| --- | --- | --- | --- |
| MSR-C1-V01 | Claim IDs present | PASS | Includes CLAIM-MSR-ADR/GHAM/KAIAULU/GIT2NET/REPODRILLER-001 for §5 classifications |
| MSR-C1-V02 | Evidence mapping present | PASS | Classification claims map to Evidence IDs; CLAIM-MSR-007 → EV-WAEP-AUTH-001 |
| MSR-C1-V03 | Evidence freshness present (Last Verified) | PASS | |
| MSR-C1-V04 | Unsupported claims distinguishable | PASS | Includes UNC-008 blob/tree |
| MSR-C1-V05 | GitHub not universal canonical authority | PASS | |
| MSR-C1-V06 | Snapshot/source separation | PASS | |
| MSR-C1-V07 | PySZZ classification corrected | PASS | |
| MSR-C1-V08 | SHA-1-only identity removed | PASS | |
| MSR-C1-V09 | SWHID/event identity separated | PASS | |
| MSR-C1-V10 | GitHub Checks capability decomposed | PASS | |
| MSR-C1-V11 | Identity correlation not link truth | PASS | |
| MSR-C1-V12 | Heuristic provenance retained | PASS | |
| MSR-C1-V13 | LLM output remains candidate | PASS | |
| MSR-C1-V14 | Citation verification bounded | PASS | |
| MSR-C1-V15 | WoC metrics dated | PASS | CLAIM-MSR-005 / 005B split |
| MSR-C1-V16 | Benchmark evidence separated | PASS | |
| MSR-C1-V17 | Artifact/event identity separated | PASS | |
| MSR-C1-V18 | SZZ does not establish root cause | PASS | |
| MSR-C1-V19 | Sensitive gate before persistence | PASS | |
| MSR-C1-V20 | Research classification grants no authority | PASS | |
| MSR-C1-V21 | Promotion remains separately gated | PASS | |

```text
Self-Validation (Correction-2): 21 / 21 PASS
```

### 13.2 Independent Validation

| Review | Result |
| --- | --- |
| Independent Re-Review-1 | 19 / 21 PASS (V01/V02 FAIL) |
| Independent Re-Review-2 | 21 / 21 PASS |

| ID | Independent Re-Review-2 Result | Notes |
| --- | --- | --- |
| MSR-C1-V01 | PASS | All major Research Classifications have Claim IDs |
| MSR-C1-V02 | PASS | Classification Claims map to Evidence IDs; CLAIM-MSR-007 → EV-WAEP-AUTH-001 |
| MSR-C1-V03 … V21 | PASS (19 / 19) | No regression vs Re-Review-1 PASS set |

Archive: `docs/research/reviews/independent-research-evidence-re-review-2.md`

```text
Independent Validation (Re-Review-2): 21 / 21 PASS
Research Evidence: ACCEPTABLE FOR HUMAN ACCEPTANCE GATE
```

---

## 14. Quality Declaration

```text
Broken span markers:                      0
Unresolved placeholders:                  0
Major generic citations without Claim mapping: 0
P1 Closure Mapping:                       7 / 7
Prior P2 Closure Mapping:                 4 / 4
Re-Review-1 New P2 (MSR-RR1-NP2-001):     1 / 1 CLOSED
Self-Validation scenarios:                21 / 21 PASS
Independent Validation (Re-Review-2):     21 / 21 PASS
New P0 / P1 / P2 in Re-Review-2:          0 / 0 / 0
Research Evidence:                        ACCEPTABLE FOR HUMAN ACCEPTANCE GATE
```

---

## 15. Next Gate

```text
Next Gate:
  MSR-RESEARCH-EVIDENCE-V1
  Human Research Evidence Acceptance
  Decision: GO / HOLD

Independent Re-Review-2 precondition: SATISFIED
  Verdict PASS / RESEARCH EVIDENCE ACCEPTABLE
  P0 / P1 / P2: 0 / 0 / 0
  Independent Validation: 21 / 21 PASS

If Human Acceptance is GO, only Research Evidence Acceptance is authorized.

Human Research Evidence Acceptance GO
  != WAEP Adoption
Human Research Evidence Acceptance GO
  != DKC Definition Lock
Human Research Evidence Acceptance GO
  != Implementation Start
Human Research Evidence Acceptance GO
  != PR Ready
Human Research Evidence Acceptance GO
  != Merge

Only after Human Acceptance may humans separately decide whether to start:
  DKC-MSR-ARCHITECTURE-DESIGN-V1
  Definition Start
```

---

## 16. Document End State

```text
Research State:           INDEPENDENT RE-REVIEW-2 PASS / AWAITING HUMAN ACCEPTANCE
Revision:                 Research Report Correction-2
Content Baseline Commit:  0ab993f7fb3775460d5df4801f33175bd4e03059
Content Baseline Blob:    b6adb8b9d814d0ae9301c7f54e40af16ed87c83d
Independent Re-Review-2:  PASS / RESEARCH EVIDENCE ACCEPTABLE
Independent Validation:   21 / 21 PASS
Human Acceptance:         NOT YET DECIDED (GO / HOLD)
WAEP Adoption:            NOT AUTHORIZED
DKC Definition Lock:      NOT AUTHORIZED
Implementation Start:     NOT AUTHORIZED
PR Ready:                 NOT AUTHORIZED
Merge:                    NOT AUTHORIZED
Repository Mutation beyond review-status documentation: NOT AUTHORIZED BY THIS REPORT
```
