# Next Ticket Creation Template

Use this template after each Codex run, after reviewing:

- Codex completion report
- `docs/Repo_Current_State.md`
- `docs/Known_Issues_And_Followups.md`
- Current PR diff / local diff
- `docs/Tickets.md`

The reviewer/planner fills this out before creating the next ticket.

---

# 1. Review Input

## Previous Ticket

- Merge status:
  - [ ] Not merged
  - [ ] Merged
  - [ ] Rejected
  - [ ] Superseded

## Codex Completion Report Summary

## Repo Current State

## Known Issues / Follow-ups to Consider

## Reviewer Notes

## Scope Decision

Choose one.

* [ ] Continue with next planned feature ticket.
* [ ] Fix issues discovered in the previous ticket.
* [ ] Create a documentation/process cleanup ticket.
* [ ] Create a tooling/dev-environment ticket.
* [ ] Create a bug-fix ticket.
* [ ] Split the next work into smaller tickets before implementation.

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
