// tests for service and candidate creation utils
import cloneDeep from 'lodash/cloneDeep'

import * as service from '../service'
import MOCK_BROWSER_SERVICE from '../__fixtures__/mdns-browser-service'

describe('service utils', () => {
  describe('makeService', () => {
    test('all info specified', () => {
      expect(service.makeService('name', 'ip', 1234, false, false)).toEqual({
        name: 'name',
        ip: 'ip',
        port: 1234,
        ok: false,
        serverOk: false,
      })
    })

    test('defaults', () => {
      expect(service.makeService('name')).toEqual(
        expect.objectContaining({
          ip: null,
          port: 31950,
          ok: null,
          serverOk: null,
        })
      )
    })
  })

  describe('makeCandidate', () => {
    test('all info specified', () => {
      expect(service.makeCandidate('ip', 1234)).toEqual({ip: 'ip', port: 1234})
    })

    test('defaults', () => {
      expect(service.makeCandidate('ip')).toEqual({ip: 'ip', port: 31950})
    })
  })

  describe('fromMdnsBrowser', () => {
    let mdnsService

    beforeEach(() => {
      mdnsService = cloneDeep(MOCK_BROWSER_SERVICE)
    })

    test('gets name from fqdn', () => {
      expect(service.fromMdnsBrowser(mdnsService)).toEqual(
        service.makeService(
          'opentrons-dev',
          expect.anything(),
          expect.anything()
        )
      )
    })

    test('with IPv4 service', () => {
      mdnsService.addresses = [
        'fe80::caf4:6db4:4652:e975',
        ...mdnsService.addresses,
      ]

      expect(service.fromMdnsBrowser(mdnsService)).toEqual(
        service.makeService('opentrons-dev', '192.168.1.42', 31950)
      )
    })

    test('with IPv6 service', () => {
      mdnsService.addresses = ['fe80::caf4:6db4:4652:e975']

      expect(service.fromMdnsBrowser(mdnsService)).toEqual(
        service.makeService(
          'opentrons-dev',
          '[fe80::caf4:6db4:4652:e975]',
          31950
        )
      )
    })

    test('return null if no IP found', () => {
      mdnsService.addresses = []

      expect(service.fromMdnsBrowser(mdnsService)).toEqual(null)
    })
  })
})
