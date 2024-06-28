# Performance Metrics

Library to gather various performance metrics for the Opentrons Flex.

Currently being imported inside of `opentrons.util.performance_helpers` which defines
helper function used inside other projects

## Setup

It is assumed that you already have the other projects in the monorepo setup correctly.

```bash
make -C performance-metrics setup
```

### Testing against OT-2 Dev Server

```bash
make -C robot-server dev-ot2
```

### Testing against real OT-2

To push development packages to OT-2 run the following commands from the root directory of this repo:

```bash
make -C performance-metrics push-no-restart host=<ot2-ip>
make -C api push-no-restart host=<ot2-ip>
make -C robot-server push host=<ot2-ip>
```

### Testing against Flex Dev Server

```bash
make -C robot-server dev-flex
```

### Testing against real Flex

```bash
make -C performance-metrics push-no-restart-ot3 host=<flex-ip>
make -C api push-no-restart-ot3 host=<flex-ip>
make -C robot-server push-ot3 host=<flex-ip>
```

### Extra step when running against real robots

Once this is done you might need to hack getting your robot and app to think they are on the same version.
Go to your app -> Settings -> General and find your app version

Then run

```bash
make -C performance-metrics override-robot-version version=<app-version> host=<robot-ip>
```

this will make the app think that the robot is on the same version

### Enabling performance-metrics feature flag

Performance metrics usage is hidden behind a feature flag. To enable it run the following command:

```bash
make set-performance-metrics-ff host=<ip>
```

To disable it run:

```bash
make unset-performance-metrics-ff host=<ip>
```
