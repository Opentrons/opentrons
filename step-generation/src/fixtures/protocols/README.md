# Protocol fixtures for step-generation tests

## `Test_8channel_with_reservoir_partial_column.py`

Protocol Designer export exercising a 4-tip partial-column transfer from a
12-channel reservoir to a 96-well plate. Used by
`src/__tests__/test_8channel_with_reservoir_partial_column.test.ts`.

### Regenerating the analysis fixture

From the monorepo root:

```bash
cd analyses-snapshot-testing
make setup
make cli-analyze-single \
  PROTOCOL=../step-generation/src/fixtures/protocols/Test_8channel_with_reservoir_partial_column.py
cp analysis_results/single/Test_8channel_with_reservoir_partial_column_analysis.json \
  ../step-generation/src/fixtures/analysis/test_8channel_with_reservoir_partial_column_analysis.json
```
