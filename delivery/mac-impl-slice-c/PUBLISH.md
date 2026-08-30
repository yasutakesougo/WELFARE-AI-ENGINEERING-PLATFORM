# MAC-IMPL-SLICE-C publish payloads

## Exact commit identity (preferred)

```text
Base: f146e6544ba16f19be7237691a7d43efa955c36c
Implementation: 24a3937680a25c8e0a5ce5e136dd1c98395d1f51
Parent relation: 24a3937 is direct child of f146e65 (ff-only safe)
```

### A. Exact commit publish (preserves HEAD 24a3937)

Requires shell + ADCC git write:

```bash
cd /path/to/ai-development-control-center
git fetch origin feat/multi-agent-coordination-slice-c-correction-3
git checkout feat/multi-agent-coordination-slice-c-correction-3
git reset --hard f146e6544ba16f19be7237691a7d43efa955c36c
git fetch ./delivery-or-downloaded/mac-slice-c-implementation.bundle
git merge --ff-only 24a3937680a25c8e0a5ce5e136dd1c98395d1f51
git push origin feat/multi-agent-coordination-slice-c-correction-3
```

Bundle: `delivery/mac-impl-slice-c/mac-slice-c-implementation.bundle`

### B. Content-exact publish via whole-file replacement

When only Contents API / connector whole-file write is available (no git apply / no shell):

Replace exactly these two paths on branch
`feat/multi-agent-coordination-slice-c-correction-3`
(currently at `f146e654…`) with post-apply payloads:

```text
src/domain/multiAgentCoordination.ts
  <- post-apply/multiAgentCoordination.ts
  git blob: 2e08f8d2eab7087441fac8dc358510f4e97c5b02
  bytes: 57534

test/multiAgentCoordination.test.ts
  <- post-apply/multiAgentCoordination.test.ts
  git blob: f2442daedc527afd53df4a609a9e1bedbd4b68d5
  bytes: 63545
```

After both files are written, remote commit SHA will differ from `24a3937`, but tree content must match those blobs. Record the new remote HEAD as Implementation exact HEAD.

Do not edit any other path.

## Already proven locally

```text
npm run verify: PASS
git diff --check: PASS
Independent Implementation Review-1: PASS (local)
Authorized files only: 2
```
