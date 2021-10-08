# Opentrons JavaScript HTTP API Clients

**Experimental work-in progress! None of these things are actually released yet!**

Opentrons robot HTTP API clients for JavaScript

| package              | source                        | install                                   | description                              |
| -------------------- | ----------------------------- | ----------------------------------------- | ---------------------------------------- |
| [api-client][]       | [packages/api-client][]       | `npm install @opentrons/api-client`       | HTTP API client for Node.js and browsers |
| [react-api-client][] | [packages/react-api-client][] | `npm install @opentrons/react-api-client` | HTTP API client for React apps           |

[api-client]: https://www.npmjs.com/package/@opentrons/api-client
[react-api-client]: https://www.npmjs.com/package/@opentrons/react-api-client
[packages/api-client]: ./packages/api-client
[packages/react-api-client]: ./packages/react-api-client

## Contributing

### Development setup

Ensure you have [Node.js][] v12 or higher installed along with the latest version of [yarn v1][].

```shell
# install development dependencies
yarn
```

### Development tasks

```shell
# test code
yarn test

# run tests in watch mode
yarn test --watch

# format code
yarn format

# lint code
yarn lint

# typecheck code
yarn typecheck

# build distributable artifacts
yarn build

# run example application
yarn dev
```

[node.js]: https://nodejs.org/en/
[yarn v1]: https://classic.yarnpkg.com
