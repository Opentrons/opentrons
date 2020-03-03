// tests for service and candidate creation utils
import { setIn } from '@thi.ng/paths'

import * as service from '../service'
import { MOCK_BROWSER_SERVICE } from '../__fixtures__/mdns-browser-service'

describe('service utils', () => {
  describe('makeService', () => {
    const SPECS = [
      {
        name: 'all info specified',
        args: [
          'name',
          'ip',
          1234,
          false,
          false,
          false,
          { name: 'name' },
          { name: 'name' },
        ],
        expected: {
          name: 'name',
          ip: 'ip',
          port: 1234,
          local: false,
          ok: false,
          serverOk: false,
          advertising: false,
          health: { name: 'name' },
          serverHealth: { name: 'name' },
        },
      },
      {
        name: 'defaults',
        args: ['name'],
        expected: {
          name: 'name',
          ip: null,
          port: 31950,
          local: null,
          ok: null,
          serverOk: null,
          advertising: null,
          health: null,
          serverHealth: null,
        },
      },
      {
        name: 'link-local IPv4',
        args: ['name', '169.254.1.2'],
        expected: expect.objectContaining({ local: true }),
      },
    ]

    SPECS.forEach(spec => {
      const { name, args, expected } = spec
      test(name, () =>
        expect(service.makeService.apply(null, args)).toEqual(expected)
      )
    })
  })

  describe('makeCandidate', () => {
    const SPECS = [
      {
        name: 'all info specified',
        args: ['ip', 1234],
        expected: { ip: 'ip', port: 1234 },
      },
      {
        name: 'defaults',
        args: ['ip'],
        expected: { ip: 'ip', port: 31950 },
      },
    ]

    SPECS.forEach(spec => {
      const { name, args, expected } = spec
      test(name, () =>
        expect(service.makeCandidate.apply(null, args)).toEqual(expected)
      )
    })
  })

  describe('fromMdnsBrowser', () => {
    const SPECS = [
      {
        name: 'returns null if no IP',
        args: [setIn(MOCK_BROWSER_SERVICE, 'addresses', [])],
        expected: null,
      },
      {
        name: 'gets name from fqdn and populates IP, port, and advertising',
        args: [MOCK_BROWSER_SERVICE],
        expected: {
          name: 'opentrons-dev',
          ip: MOCK_BROWSER_SERVICE.addresses[0],
          port: MOCK_BROWSER_SERVICE.port,
          local: false,
          ok: null,
          serverOk: null,
          advertising: true,
          health: null,
          serverHealth: null,
        },
      },
      {
        name: 'prefers IPv4',
        args: [
          setIn(MOCK_BROWSER_SERVICE, 'addresses', [
            'fe80::caf4:6db4:4652:e975',
            ...MOCK_BROWSER_SERVICE.addresses,
          ]),
        ],
        expected: {
          name: 'opentrons-dev',
          ip: '192.168.1.42',
          port: 31950,
          local: false,
          ok: null,
          serverOk: null,
          advertising: true,
          health: null,
          serverHealth: null,
        },
      },
      {
        name: 'adds brackets to IPv6',
        args: [
          setIn(MOCK_BROWSER_SERVICE, 'addresses', [
            'fe80::caf4:6db4:4652:e975',
          ]),
        ],
        expected: {
          name: 'opentrons-dev',
          ip: '[fe80::caf4:6db4:4652:e975]',
          port: 31950,
          local: true,
          ok: null,
          serverOk: null,
          advertising: true,
          health: null,
          serverHealth: null,
        },
      },
    ]

    SPECS.forEach(spec => {
      const { name, args, expected } = spec
      test(name, () =>
        expect(service.fromMdnsBrowser.apply(null, args)).toEqual(expected)
      )
    })
  })

  describe('fromResponse', () => {
    const MOCK_CANDIDATE = { ip: '192.168.1.42', port: 31950 }
    const SPECS = [
      {
        name: 'returns null if no responses',
        args: [MOCK_CANDIDATE, null, null],
        expected: null,
      },
      {
        name: 'gets ip from candidate and name from responses',
        args: [
          MOCK_CANDIDATE,
          { name: 'opentrons-dev', api_version: '1.0.0' },
          { name: 'opentrons-dev', apiServerVersion: '1.0.0' },
        ],
        expected: {
          name: 'opentrons-dev',
          ip: '192.168.1.42',
          port: 31950,
          local: false,
          ok: true,
          serverOk: true,
          advertising: null,
          health: { name: 'opentrons-dev', api_version: '1.0.0' },
          serverHealth: { name: 'opentrons-dev', apiServerVersion: '1.0.0' },
        },
      },
      {
        name: 'flags ok false if no /health response',
        args: [
          MOCK_CANDIDATE,
          null,
          { name: 'opentrons-dev', apiServerVersion: '1.0.0' },
        ],
        expected: {
          name: 'opentrons-dev',
          ip: '192.168.1.42',
          port: 31950,
          local: false,
          ok: false,
          serverOk: true,
          advertising: null,
          health: null,
          serverHealth: { name: 'opentrons-dev', apiServerVersion: '1.0.0' },
        },
      },
      {
        name: 'flags serverOk false if no /server/update/health response',
        args: [
          MOCK_CANDIDATE,
          { name: 'opentrons-dev', api_version: '1.0.0' },
          null,
        ],
        expected: {
          name: 'opentrons-dev',
          ip: '192.168.1.42',
          port: 31950,
          local: false,
          ok: true,
          serverOk: false,
          advertising: null,
          health: { name: 'opentrons-dev', api_version: '1.0.0' },
          serverHealth: null,
        },
      },
      {
        name: 'flags ok false if name mismatch in responses',
        args: [
          MOCK_CANDIDATE,
          { name: 'opentrons-wrong', api_version: '1.0.0' },
          { name: 'opentrons-dev', apiServerVersion: '1.0.0' },
        ],
        expected: {
          name: 'opentrons-dev',
          ip: '192.168.1.42',
          port: 31950,
          local: false,
          ok: false,
          serverOk: true,
          advertising: null,
          health: { name: 'opentrons-wrong', api_version: '1.0.0' },
          serverHealth: { name: 'opentrons-dev', apiServerVersion: '1.0.0' },
        },
      },
    ]

    SPECS.forEach(spec => {
      const { name, args, expected } = spec
      test(name, () =>
        expect(service.fromResponse.apply(null, args)).toEqual(expected)
      )
    })
  })
})
