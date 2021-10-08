# Opentrons HTTP API Client

Opentrons robot HTTP API client for Node.js and browsers. Compatible with [Opentrons robot software][] `v4` and later.

[opentrons robot software]: https://github.com/Opentrons/opentrons

## Getting Started

### Installation

```shell
npm install @opentrons/api-client
```

### Usage

```typescript
import { HostConfig, Response, Health, getHealth } from '@opentrons/api-client'

const host: HostConfig = { hostname: 'OT2CEP9999999A99.local' }

getHealth(host)
  .then((response: Response<Health>) => console.log(response.data))
  .catch((error) => console.error(error))
```

## Details

The `@opentrons/api-client` module is built using [axios][].

[axios]: https://github.com/axios/axios
