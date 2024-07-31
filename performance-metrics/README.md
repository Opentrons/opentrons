# Performance Metrics

Library to gather various performance metrics for the Opentrons Flex.

Currently being imported inside of `opentrons.util.performance_helpers` which defines
helper function used inside other projects

## Setup

It is assumed that you already have the other projects in the monorepo setup correctly.

```bash
make -C performance-metrics setup
```

### Pushing performance-metrics package to Flex

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

## Available features

### Robot activity tracking

#### Description

Developers are able to track when the robot is in a block of code they choose to monitor. Looking at
`api/src/opentrons/util/performance_helpers.py` you will see a class called `TrackingFunctions`. This class
defines static methods which are decorators that can be used wrap arbitrary functions.

As of 2024-07-31, the following tracking functions are available:

- `track_analysis`
- `track_getting_cached_protocol_analysis`

Looking at `TrackingFunctions.track_analysis` we see that the underlying call to \_track_a_function specifies a string `"ANALYZING_PROTOCOL"`. Whenever a function that is wrapped with `TrackingFunctions.track_analysis` executes, the tracking function will label the underlying function as `"ANALYZING_PROTOCOL"`.

To see where tracking function is used look at `robot_server/robot-server/protocols/protocol_analyzer.py`. You will see that the `ProtocolAnalyzer.analyze` function is wrapped with `TrackingFunctions.track_analysis`. Whenever `ProtocolAnalyzer.analyze` is called, the tracking function will start a timer. When the `ProtocolAnalyzer.analyze` function completes, the tracking function will stop the timer. It will then store the function start time and duration to the csv file, /data/performance_metrics_data/robot_activity_data

#### Adding new tracking decorator

To add a new tracking decorator, go to `performance-metrics/src/performance_metrics/_types.py`, and look at RobotActivityState literal and add a new state.
Go to `api/src/opentrons/util/performance_helpers.py` and add a static method to the `TrackingFunctions` class that uses the new state.

You can now wrap your functions with your new tracking decorator.

### System resource tracking

performance-metrics also exposes a tracking application called `SystemResourceTracker`. The application is implemented as a systemd service on the robot and records system resource usage by process. See the `oe-core` repo for more details.
You can configure the system resource tracker by modifying the environment variables set for the service. The service file lives at `/lib/systemd/system/system-resource-tracker.service`. You can change the defined environment variables or remove them and define them in the robot's environment variables. See `performance-metrics/src/performance_metrics/system_resource_tracker/_config.py` to see what environment variables are available.
