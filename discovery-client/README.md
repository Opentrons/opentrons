# discovery client

> Node.js client for discovering Opentrons robots on the network

## overview

`@opentrons/discovery-client` provides the ability to discover [Opentrons robots][ot-2] on your network using [MDNS][].

[ot-2]: http://opentrons.com/ot-2
[mdns]: https://en.wikipedia.org/wiki/Multicast_DNS

## api

```js
const DiscoveryClient = require('@opentrons/discovery-client')
```

### DiscoveryClientFactory(options?: Options): DiscoveryClient

Creates a new `DiscoveryClient`.

```js
const options = {
  nameFilter: /^opentrons/i,
  allowedPorts: [31950],
  pollInterval: 5000,
  candidates: [{ip: '[fd00:0:cafe:fefe::1]', port: 31950}, 'localhost']
}

const client = DiscoveryClientFactory(options)
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

  /** possible service port (31950 if unspecified) */
  port: ?number,

  /** possible health status (null if not yet determined) */
  ok: ?boolean
}
```

```js
type Candidate = {
  /** ip address */
  ip: string,

  /** service port (31950 if unspecified) */
  port: ?number
}
```

`discovery.client` takes an optional `options` parameter:

```js
type Option = {
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
   * default: {} + ip/port from all Robots in options.discovered
   */
  candidates?: Array<string | Candidate>,

  /**
   * regexp or string (passed to `new RegExp`) to filter mDNS service names
   * default: ''
   */
  nameFilter?: string | RegExp,

  /**
   * regexp or string (passed to `new RegExp`) to filter mDNS service names
   * default: ''
   */
  allowedPorts?: Array<number>,

  /** optional logger */
  logger?: {
    ['error' | 'warn' | 'info' | 'debug']: (message: string, meta: {}) => void
  }
}
```

If you need access to the `DiscoveryClient` class itself for some reason:

```js
import {DiscoveryClient} from '@opentrons/discovery-client'

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

| event name       | data      | description                                   |
| ---------------- | --------- | --------------------------------------------- |
| `service`        | `Service` | Service added or updated in the services list |
| `serviceRemoved` | `Service` | Service removed from the services list        |
| `error`          | `Error`   | MDNS encountered an error                     |

## cli

`@opentrons/discovery` includes a simple CLI for convenience. After building the project by running `make -C discovery-client`, it is accessible through the `node_modules` directory of the monorepo. Launch it with:

```shell
# prereq: build project before first run or after changes
make -C discovery-client

# run via yarn run
yarn run discovery [options]
# or run from node_modules directly
node_modules/.bin/discovery [options]
```

It will print out robots as it discovers them. It has the same options the API:

| api option     | cli flag             | example                              |
| -------------- | -------------------- | ------------------------------------ |
| `pollInterval` | `-p, --pollInterval` | `--pollInterval 1000`                |
| `services`     | `-s, --services`     | `-s.0.name=foo -s.0.ip=192.168.1.42` |
| `candidates`   | `-c, --candidates`   | `-c localhost 192.168.1.42`          |
| `nameFilter`   | `-n, --nameFilter`   | `-n opentrons`                       |
| `allowedPorts` | `-a, --allowedPorts` | `-a 31951 31952 31953`               |

`--services` and `--candidates` may be passed multiple times to add more than one service or candidate.
