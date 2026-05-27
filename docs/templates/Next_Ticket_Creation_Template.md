# 1. Review Input

## Previous Ticket
Use Github tool to review repository at docs/implementation_logs/

## Codex Completion Report Summary

## Repo Current State
Use Github tool to review repository at docs/Repo_Current_State.md

## Known Issues / Follow-ups to Consider
Use Github tool to review repository at docs/Known_Issues_And_Followups.md

## Reviewer Notes

---

# 2. Tickets.md Row Output

```md
| [Ticket ID] | [Title] | Not Started | [Depends On] | [Area] |
```

Rules:

* Reviewer/planner may set: `Proposed`, `Ready`, `Done`, `Superseded`.
* Codex may set only: `In Progress`, `Implemented — Pending Review`, `Blocked`.
* Codex must not mark tickets as `Done`.

Example:

```md
| T0001 | Dockerized Developer Tooling Baseline | Not Started | T0000 | Dev tooling |
```

---

# 3. Full Ticket Output

```markdown
# [Ticket ID] — [Title]

## Goal

[One small outcome only.]

## Dependencies

- [Required completed tickets]
- [Required docs]
- [Required existing files/systems]

## Allowed Areas

Codex may edit only:

- `[path]`
- `[path]`

Always allowed for ticket bookkeeping:

- `docs/Repo_Current_State.md`
- `docs/Known_Issues_And_Followups.md`

## Do Not Touch

Codex must not edit:

- `[path]`
- `[system]`
- `[feature area]`

## Requirements

- [Specific behavior]
- [Specific implementation constraint]
- [Specific DealSach requirement ID if applicable]

## Non-Goals

- Do not implement [future feature].
- Do not refactor [unrelated system].
- Do not add [new dependency/architecture].

## Acceptance Criteria

- [ ] [Observable result]
- [ ] [Build/test result]
- [ ] [Doc/state update if applicable]

## Manual Verification

1. [Command or UI step]
2. [Expected result]
3. [Command or UI step]
4. [Expected result]

## Completion Report Required

Codex must report:

- Summary of changes
- Files changed
- Commands run
- Build/test results
- Manual verification steps performed
- Risks
- Follow-up tickets
- Docs updated
```
