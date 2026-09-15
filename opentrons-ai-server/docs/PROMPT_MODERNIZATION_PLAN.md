# Anthropic Prompt Modernization Plan (Sonnet 5)

Status: **In progress** — Steps 1 & 2 implemented, plus a first-priority bug fix for
[AUTH-3347](https://opentrons.atlassian.net/browse/AUTH-3347). Steps 3–10 not started.

Owner: Josh McVey
Scope: `opentrons-ai-server/api/domain/config_anthropic.py` and its wiring in
`opentrons-ai-server/api/domain/anthropic_predict.py`. Does not cover
`config_pd.py` (Protocol Designer prompt) or `prompts.py` (unused OpenAI legacy
prompt) — those are candidates for a follow-up pass using the same approach.

## AUTH-3347: "OAI v1 sometimes requires more prompting and/or fails silently"

[AUTH-3347](https://opentrons.atlassian.net/browse/AUTH-3347) reports two symptoms that
appeared after the Sonnet 4.5 → Sonnet 5 upgrade, and was made first priority:

1. OAI v1 sometimes summarizes the request instead of generating the protocol in the
   first response.
2. OAI v1 sometimes fails silently, replying "No response was generated, please try
   again." or "Something went wrong. Please try again."

Root-caused both to the same place: `AnthropicPredict`'s tool-call handling
(`_handle_response`, previously duplicated in `process_message`) assumed exactly one
tool-call round trip and only ever inspected a single content block. Sonnet 5 is more
agentic than 4.5 and readily chains tool calls (e.g. `get_relevant_api_docs` more than
once, or `get_relevant_api_docs` then `simulate_protocol`) or issues more than one
`tool_use` block in a single turn. The old code:

- Only sent a `tool_result` for the _last_ `tool_use` block in a turn, violating the
  Anthropic API's requirement that every `tool_use` gets a matching `tool_result` —
  surfacing as a hard API error ("Something went wrong") whenever the model issued more
  than one tool call at once.
- Only handled a single follow-up round and blindly read `content[0]`, so a follow-up
  that led with a short "let me check that" text block followed by a second `tool_use`
  block returned the preamble as the final answer and silently dropped the actual
  protocol (symptom 1), or returned `None` → "No response was generated" (symptom 2)
  whenever the follow-up's first block wasn't text.

Fix (`opentrons-ai-server/api/domain/anthropic_predict.py`):

- `_handle_response` now loops (capped at `AnthropicPredict.MAX_TOOL_ROUNDS = 8`),
  collecting **every** `tool_use` block per turn, sending back a `tool_result` for each,
  and re-invoking the model until it returns a turn with no `tool_use` blocks at all.
- Final text is extracted by concatenating all `text` blocks in that terminal response,
  not just `content[0]`.
- `process_message` no longer duplicates the (broken) single-hop logic — it now calls
  the same fixed `_handle_response` used by `process_chat_with_attachments`.
- `_process_message` now logs `stop_reason` and the response's content-block-type
  sequence alongside token usage, so any future "no response" report is diagnosable
  from logs (e.g. `stop_reason == "max_tokens"` means the model was truncated) instead
  of only reproducible by guesswork.
- Per the ticket comment, `SYSTEM_PROMPT` gained a `<first_response_policy>`
  block: always output the complete protocol in the first response when the prompt is
  sufficiently detailed; don't summarize or present a plan without code; make a
  documented assumption instead of pausing on minor ambiguity; only ask a clarifying
  question when something genuinely required is missing.
- Regression tests added in `opentrons-ai-server/tests/test_anthropic_predict.py`
  covering: parallel tool calls in one turn, chained tool calls across rounds, the
  max-rounds bailout, and a final response with no text content.

## Problem

`config_anthropic.py` was written for Claude 3-era models: a long persona,
duplicated rules, a "common model issues" encyclopedia (~70 lines of "model
outputs X instead of Y"), and a per-turn procedural flowchart that gets
re-sent, unc­ached, on every single message via `PROMPT.format(USER_PROMPT=...)`.

Sonnet 5 is stronger, more literal, and more agentic. Anthropic's current
guidance is "less scaffolding, more curation." The existing harness fights
that: it over-specifies, repeats itself between `SYSTEM_PROMPT` and `PROMPT`,
and pays full token price every turn for content that should be cached or
retrieved on demand.

## Goals

- Reduce steady-state prompt tokens per request without regressing protocol
  correctness (tips, load names, trash placement, transfer/`new_tip` usage,
  module/adapter compatibility, thermocycler open/close ordering).
- Make durable policy cacheable (Anthropic prompt caching) instead of resent
  as fresh, uncached text every turn.
- Remove internal contradictions and stale defaults (e.g. hardcoded apiLevel
  in a helper prompt vs. `__DEFAULT_API_LEVEL__` everywhere else).
- Keep the change evaluable and reversible — no big-bang rewrite of tool
  wiring, retrieval, or thinking/effort config in this pass.

## Non-goals (this pass)

- Rebuilding `get_relevant_api_docs` / doc curation pipeline.
- Changing `thinking: {"type": "disabled"}` or per-task effort tuning.
- Touching `config_pd.py`, `prompts.py`, or the helper prompts
  (`PROMPT_RELEVANT_API`, `PROMPT_FIND_RELEVANT_DOCS`).
- Building a new retrieval mechanism for the "common model issues" trivia.

## Target shape

| Layer                  | Keep                                                                                                                                                 | Move out (future workstream)                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| System (cached)        | Role, product defaults, tool policy, protocol skeleton, transfer rules, validation checklist, citation format, load-name pitfalls that regress often | Long tail of rare-case trivia (Stacker A4/A3 detail, thermocycler temp ranges, PD-specific nuance)                        |
| Per-turn user          | `<user_prompt>` wrapper only                                                                                                                         | The 250-line decision tree that used to live here                                                                         |
| Tools / retrieved docs | —                                                                                                                                                    | Most of "common model issues"; encode into tool descriptions and curated docs instead of repeating in every system prompt |

## Workstreams

1. **Shrink hard** — consolidate `SYSTEM_PROMPT`, remove duplication between
   it and `PROMPT`, fix typos/contradictions, replace the vague classification
   flowchart with outcome-oriented rules, trim the "common model issues" list
   to a short positive checklist. _(This plan's Step 1.)_
2. **Stop re-injecting the entire `PROMPT` every turn** — move durable policy
   into `SYSTEM_PROMPT`, mark the system prompt as cacheable
   (`cache_control: {"type": "ephemeral"}`, matching the existing pattern
   already used for `config_pd.py`'s `system_prompt_pd` and for
   `cached_docs`/`cached_api_docs`), and reduce the per-turn user message to a
   short `<user_prompt>` wrapper. _(This plan's Step 2.)_
3. Resolve remaining conflicting/overlapping rules (simulate-on-request vs.
   tool guidance, filter vs. non-filter tiprack defaults, apiLevel hardcoded
   in `PROMPT_RELEVANT_API`).
4. Replace remainder of "common model issues" with retrieval-backed docs +
   2–3 positive few-shot examples for the highest-failure patterns.
5. Trim persona/competency claims; add an explicit uncertainty permission.
6. Revisit `thinking: {"type": "disabled"}` per task type (protocol
   generation vs. trivial edits) and rebalance tool-usage guidance between
   prompt text and tool descriptions.
7. Route `<source>` file reminders (e.g. `out_of_tips_error_219.md`,
   `serial_dilution_examples.md`) through `get_relevant_api_docs` / a
   dedicated pattern-matching tool instead of static prompt reminders.
8. Soften brittle response templates (fixed "API answer:" header, canned
   clarification text) into a described shape + one example.
9. Clean remaining structure/XML tag consistency issues.
10. Modernize `PROMPT_RELEVANT_API` / `PROMPT_FIND_RELEVANT_DOCS` helper
    prompts (shorter instructions, align default apiLevel, avoid
    "dump everything" extraction guidance).

## Migration approach (eval-driven)

1. Snapshot current Weave/eval failures (tips, load names, trash, Stacker,
   simulate-from-history) as a baseline before/after comparison.
2. Ship Steps 1 & 2 together (this PR) since they're mechanically linked —
   the per-turn shrink only pays off once the moved content is cached in
   `SYSTEM_PROMPT`.
3. Compare cache hit rate (`cache_read_input_tokens` vs.
   `cache_creation_input_tokens`, already logged in
   `AnthropicPredict._process_message`) and steady-state input token counts
   before/after.
4. Re-run protocol-generation evals; only proceed to Step 3+ once Steps 1–2
   show no correctness regression.
5. Tackle Steps 3–10 as separate, independently reviewable PRs.

## Step 1 & 2 implementation notes

- `SYSTEM_PROMPT` in `config_anthropic.py` now holds all durable policy:
  role, document-type handling, tool usage, protocol defaults/skeleton,
  transfer/`new_tip` rules, a validation checklist, a trimmed load-name
  pitfalls list, API citation format, update-protocol policy, and
  information-priority order.
- `PROMPT` is now a minimal `<user_prompt>{USER_PROMPT}</user_prompt>`
  wrapper — no procedural flowchart, no protocol template, no common-issues
  list.
- `AnthropicPredict.system_prompt` changed from a plain `str` to
  `List[TextBlockParam]` with `cache_control: {"type": "ephemeral"}`, mirroring
  the existing `system_prompt_pd` / `cached_docs` pattern, so Anthropic can
  cache it across requests instead of re-billing it every turn.
- No changes to `anthropic_predict.py`'s message-building control flow,
  tool definitions, `config_pd.py`, or helper prompts.

## Risks

- Content moved from `PROMPT` into `SYSTEM_PROMPT` changes cache
  invalidation: any future edit to `SYSTEM_PROMPT` busts the cache for all
  in-flight conversations until re-warmed. This is expected and acceptable
  (same trade-off `system_prompt_pd` already makes).
- Trimming the "common model issues" bullet list narrows coverage of rare
  edge cases; Step 1 keeps the highest-recurrence items (load names,
  transfer/`new_tip`, Stacker adjacency, thermocycler open/close, PCR
  adapter) and defers the rest to Step 4 (retrieval-backed).
