# Snapshot fixtures

Files referenced by `snapshots/prompts.yaml` for prompts that use `protocol_file` or `attachments`. Paths in the YAML are relative to the `snapshots/` directory (e.g. `fixtures/reagent_transfer.py` points here).

**Protocol files (used as input or for “update” prompts):**

- `reagent_transfer.py` – 001 Reagent Transfer
- `pcr.py` – 002 PCR
- `serial_dilution.py` – 004 Serial Dilution
- `update_to_rtp.py` – 006 Update to RTP / Flex
- `pdf_attachment.py` – 007 PDF attachment (optional; prompt can use PDF only)

**Attachments (PDFs, CSVs):**

- `pcr_with_csv.csv` – 003 PCR with CSV
- `pdf_attachment.pdf` – 007 PDF attachment prompt

Descriptions and prompt text in `prompts.yaml` are placeholders until final content is added. If a fixture file is missing when you run `make snapshot-run`, that prompt is skipped and a message is printed.
