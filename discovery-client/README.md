# discovery client

> Node.js client for discovering Opentrons robots on the network

## overview

`@opentrons/discovery-client` provides the ability to discover [Opentrons robots][ot-2] on your network using [MDNS][].

[ot-2]: http://opentrons.com/ot-2
[mdns]: https://en.wikipedia.org/wiki/Multicast_DNS

## api

```js
const { createDiscoveryClient } = require('@opentrons/discovery-client')
```

### createDiscoveryClient(options?: Options): DiscoveryClient

Creates a new `DiscoveryClient`.

```js
const options = {
  nameFilter: ['opentrons'],
  portFilter: [31950],
  pollInterval: 5000,
  candidates: [{ ip: '[fd00:0:cafe:fefe::1]', port: 31950 }, 'localhost'],
}

const client = createDiscoveryClient(options)
```

The discovery client is an [Event Emitter][event-emitter]. In addition to the normal `EventEmitter` methods and properties, the client has:

```js
type DiscoveryClient = {
  /** list of discovered robot services */
  services: Array<Service>,

  /** list of extra service addresses the client is polling */
  candidates: Array<Candidate>,

  /**
   * start searching for robots
   *
   * @return {DiscoveryClient} `this` for chaining
   */
  start: () => DiscoveryClient,

  /**
   * stop searching for robots
   *
   * @return {DiscoveryClient} `this` for chaining
   */
  stop: () => DiscoveryClient,

  /**
   * adds an IP address to tracking manually (outside of MDNS discovery)
   *
   * @param {string} ip IP address to add to the tracking list
   * @param {number} port Optional port
   * @return {DiscoveryClient} `this` for chaining
   */
  add: (ip: string, port?: number) => DiscoveryClient,

  /**
   * removes a robot from the discovery list / tracking
   * (note: if a robot is and healthy, it will probably end up back on the list
   * automatically; this method is mostly for removing unhealthy robots)
   *
   * @param {string} name the name of the robot to remove
   * @return {DiscoveryClient} `this` for chaining
   */
  remove: (name: string) => DiscoveryClient

  /**
   * sets the health polling interval
   *
   * @param {?number} interval health polling interval; 0 sets to default
   * @return {DiscoveryClient} `this` for chaining
   */
  setPollInterval: (interval: number) => DiscoveryClient
}
```

```js
type Service = {
  /** unique robot name */
  name: string,

  /** possible ip address (null if an IP conflict occurred) */
  ip: ?string,

  /** service port (deafult 31950) */
  port: number,

  /** IP address (if known) is a link-local address */
  local: ?boolean,

  /** health status of the API server (null if not yet determined) */
  ok: ?boolean,

  /** health status of the update server (null if not yet determined) */
  serverOk: ?boolean,

  /** whether robot is advertising over MDNS (null if not yet determined) */
  advertising: ?boolean,

  /** last good health response */
  health: ?{
    name: string,
    api_version: string,
    fw_version: string,
    system_version?: string,
    logs?: Array<string>,
  },

  /** last good update server health response */
  serverHealth: ?{
    name: string,
    apiServerVersion: string,
    updateServerVersion: string,
    smoothieVersion: string,
    systemVersion: string,
  },
}
```

```js
type Candidate = {
  /** ip address */
  ip: string,

  /** service port (31950 if unspecified) */
  port: ?number,
}
```

`discovery.client` takes an optional `options` parameter:

```js
type Options = {
  /**
   * interval (ms) at which to poll an IP to find a robot
   * default: 5000
   */
  pollInterval?: number,

  /**
   * list of discovered robots to pre-populate the discovered list
   * default: {}
   */
  services?: Array<Service>,

  /**
   * list of extra IP addresses to add to the search list
   * default: []
   */
  candidates?: Array<string | Candidate>,

  /**
   * RegExps or strings to filter services by name
   * default: ''
   */
  nameFilter?: Array<string | RegExp>,

  /**
   * RegExps or strings to filter services by IP address
   * default: ''
   */
  ipFilter?: Array<string | RegExp>,

  /**
   * array of numbers to filter services by port
   * the default port of 31950 is always included
   * default: []
   */
  portFilter?: Array<number>,

  /** optional logger */
  logger?: {
    ['error' | 'warn' | 'info' | 'debug']: (message: string, meta: {}) => void,
  },
}
```

If you need access to the `DiscoveryClient` class itself for some reason:

```js
import { DiscoveryClient } from '@opentrons/discovery-client'

const client = new DiscoveryClient({})
```

[event-emitter]: https://nodejs.org/api/events.html

#### events

```js
import {SERVICE_EVENT, SERVICE_REMOVED_EVENT} from '@opentrons/discovery-client'

client.on(SERVICE_EVENT, (data) => console.log('service added/updated', data))
client.on(SERVICE_REMOVED_EVENT, (data) => console.log('service removed', data))
client.on('error', (error) => console.error(error)
```

| event name       | data             | description                                    |
| ---------------- | ---------------- | ---------------------------------------------- |
| `service`        | `Array<Service>` | Services added or updated in the services list |
| `serviceRemoved` | `Array<Service>` | Services removed from the services list        |
| `error`          | `Error`          | MDNS encountered an error                      |

## cli

`@opentrons/discovery` includes a simple CLI for convenience. After building the project by running `make -C discovery-client`, it is accessible through the `node_modules` directory of the monorepo. Launch it with:

```shell
# prereq: build project before first run or after changes
make -C discovery-client

# run via yarn run
yarn run discovery [command] [options]

# run via npx
npx discovery [command] [options]

# run from node_modules directly
node_modules/.bin/discovery [command] [options]
```

### global options

The CLI's global options are almost completely the same as the API's options, with the addition of `logLevel`:

| flag                 | description               | default  | example          |
| -------------------- | ------------------------- | -------- | ---------------- |
| `-p, --pollInterval` | see `pollInterval` option | `1000`   | `-p 500`         |
| `-c, --candidates`   | see `candidates` option   | `[]`     | `-c localhost`   |
| `-n, --nameFilter`   | see `nameFilter` option   | `[]`     | `-n opentrons`   |
| `-i, --ipFilter`     | see `ipFilter` option     | `[]`     | `-i 169.254`     |
| `-a, --portFilter`   | see `portFilter` option   | `[]`     | `-a 31951 31952` |
| `-l, --logLevel`     | log level for printout    | `'info'` | `-l debug`       |

### `discovery (browse) [options]`

Print out robots as it discovers them.

```shell
# example: browse for robots, including at localhost
discovery browse -c localhost

# browse is the default command, so you can leave the "browse" out
discovery --nameFilter moon
```

### `discovery find [name] [options]`

Find the first robot you can, optionally specifying name or any other global options, and print out the IP address to `stdout` (bypassing any log level settings).

```shell
# example: find a specific robot
discovery find opentrons-moon-moon

# example: find the IP address of a link-local wired robot
discovery find --ipFilter 169.254

# example: find the IP address of a wired robot that may be IPv4 or IPv6
# (IPv6 means legacy non-mDNS wired configuration)
discovery find -i "169.254" "fd00" -c "[fd00:0:cafe:fefe::1]"
```

#### command specific options

| flag            | description                  | default | example    |
| --------------- | ---------------------------- | ------- | ---------- |
| `-t, --timeout` | How long to wait for a robot | `5000`  | `-t 10000` |

### `discovery-ssh [name] [options]`

Calls `discovery find` and using the output to SSH into the robot it finds. **Takes all the same arguments and options as `discovery find`.**

`discovery-ssh` is a Bash script, so it must be called from a command line with Bash available.

```shell
# example: SSH into a link-local wired robot
discovery-ssh --ipFilter 169.254

# example: SSH into any wired robot, including legacy wired configuration
discovery-ssh -i "169.254" "fd00" -c "[fd00:0:cafe:fefe::1]"
```
