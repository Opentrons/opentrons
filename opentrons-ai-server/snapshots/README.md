# Snapshot testing

Scripted capture of API responses for a fixed prompt suite. Used to evaluate API, model, or prompt changes by reviewing diffs and promoting when appropriate.

- **Prompt suite:** [prompts.yaml](prompts.yaml) – each entry has `id`, `slug`, `description`, `prompt`; optional `protocol_file`, `attachments`, `fake_key`.
- **Fixtures:** [fixtures/](fixtures/) – protocol files, PDFs, and CSVs referenced by the prompts (see [fixtures/README.md](fixtures/README.md)).
- **Full workflow:** See the main [README.md](../README.md) section “Snapshot testing” for how to run, diff, promote, and generate the PM report.

**Directories:**

| Directory   | Purpose                                                                 |
| ----------- | ----------------------------------------------------------------------- |
| `approved/` | Committed baseline snapshots; compare against `temp/` before promoting. |
| `temp/`     | Output of the latest `make snapshot-run` (not committed).               |
| `archive/`  | Previous approved snapshots after promote (timestamped).                |
