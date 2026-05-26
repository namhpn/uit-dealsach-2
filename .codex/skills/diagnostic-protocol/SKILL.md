---
name: diagnostic-protocol
description: Verification-first debugging and change protocol for coding tasks. Use when investigating bugs, tracing data flow, changing database/API/UI behavior, assessing blast radius, or before proposing schema, migration, destructive, deployment, or production-affecting changes.
---

# Diagnostic Protocol

Use this skill to prevent guess-driven coding. Follow the sequence:

1. Verify the current system.
2. Trace the complete flow.
3. Identify the exact break point.
4. Apply the smallest viable fix.
5. Confirm the result with evidence.

## Operating Rules

### Trace Before Changing

Before editing code, trace the relevant path from source to output:

1. Identify where the data comes from: table, column, RPC, API, file, request, or state.
2. Inspect the actual current shape: schema, payload, query result, or runtime value.
3. Find how it travels: model, query, controller, endpoint, serializer, hook, store, or prop.
4. Find where it renders or takes effect.
5. State the gap: missing at source, query, transform, response, state, render, or side effect.

Never propose a schema change until existing data, queries, and frontend options have been checked.

### Classify Blast Radius

Use the lowest level that solves the issue:

| Level | Scope | Examples | Rule |
|---|---|---|---|
| L0 | UI/client only | CSS, component logic, local state | Self-serve after local verification |
| L1 | API behavior | Endpoint logic, response shape | Verify request and response locally |
| L2 | Database read | Query, view, read-only RPC | Confirm schema and result data first |
| L3 | Database write/schema | Migration, ALTER TABLE, write path | Ask before changing |
| L4 | Destructive | DROP, DELETE, irreversible data change | Require explicit confirmation and exact impact |

### Diagnose One Cause

For bugs, use this order:

1. Reproduce or precisely describe the symptom.
2. Locate the render point or failing operation.
3. Trace the variable, payload, or side effect backward.
4. Find the first point where expected differs from actual.
5. Fix at that point only.

Avoid shotgun debugging: do not change multiple layers unless the trace proves each layer is involved.

### Minimize Manual User Work

Before asking the user to run SQL, change config, deploy, or perform manual steps, check whether you can solve it directly with:

1. A local code change.
2. A frontend-only change.
3. A non-destructive API/query change.
4. Existing commands or diagnostics available in the workspace.

If manual work is unavoidable, explain why, give exact commands or actions, and state the expected result.

## Verification Standards

Replace assumptions with evidence:

| Avoid | Use |
|---|---|
| "This should work." | "I verified this with `<command/test/output>`." |
| "The issue is probably..." | "The failing point is `<file/line/operation>` because `<evidence>`." |
| "I think the column exists." | "I confirmed the column by checking `<schema/query/file>`." |
| "The payload likely contains..." | "The observed payload contains `<field/value>`." |

For production-affecting work:

1. Read actual code, config, schema, and data before changing.
2. Run the narrowest useful local verification.
3. Browser-test UI changes when a local target is available.
4. Test API changes with a direct request when possible.
5. Report what was verified and what could not be verified.

## Response Shape

When presenting findings or a fix, include:

1. Root cause in one sentence.
2. Fix in one sentence.
3. Blast radius: what changed and what did not.
4. Verification evidence.
5. Any user action needed, ideally none.

Before every response, self-check:

- Did you verify claims with actual code, data, or command output?
- Is the fix the smallest one that solves the proven problem?
- Are you avoiding unnecessary manual work for the user?
- Could the change affect production data or behavior?
- Are assumptions clearly labeled?
