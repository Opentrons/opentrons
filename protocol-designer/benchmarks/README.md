# Protocol Designer Benchmarks

Note: this tooling around benchmark testing is very minimal and subject to change!

To run all PD benchmarks, navigate to the monorepo root dir and do `NODE_ENV=test node ./scripts/runBenchmarks.js protocol-designer/benchmarks/*.js`

These benchmarks use [Nanobench](https://github.com/mafintosh/nanobench), so you can pipe the output to a file and compare benchmark runs with `yarn nanobench-compare fileA fileB`

## Local benchmarking guidelines

- Do not compare benchmarks across different machines.
- Make sure the same resources are available between runs (eg if you kill your dev servers and editor etc, it will likely affect the benchmarks from the run that competed with those processes)
