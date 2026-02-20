# Snapshot fixtures

Files referenced by `prompts.yaml` for prompts that use attachments or protocol updates.

Paths in `prompts.yaml` are relative to the `snapshots/` directory, so entries like `fixtures/sample.pdf` point here.

- **sample_protocol.py** – Minimal OT-2 Python protocol used by the "update to RTP" prompt (006). Committed.
- **sample.pdf** – Add your own PDF here for the PDF attachment prompt (007). Reference it in `prompts.yaml` as `fixtures/sample.pdf` (or another filename if you prefer; update the `attachments` list for that prompt).

If a fixture file is missing when you run `make snapshot-run`, that prompt is skipped and a message is printed.
