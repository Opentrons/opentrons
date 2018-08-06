import Bonjour from 'bonjour'
import DiscoveryClient from '..'
import * as poller from '../poller'

jest.mock('bonjour')
jest.mock('../poller')

const BROWSER_SERVICE = {
  addresses: ['192.168.1.42'],
  name: 'opentrons-dev',
  fqdn: 'opentrons-dev.local._http._tcp.local',
  host: 'opentrons-dev.local',
  referer: {
    address: '192.168.1.1',
    family: 'IPv4',
    port: 5353,
    size: 514
  },
  port: 31950,
  type: 'local',
  protocol: 'http',
  subtypes: ['tcp'],
  rawTxt: {'0': 0},
  txt: {}
}

describe('discovery client', () => {
  let bonjour

  beforeEach(() => {
    Bonjour.__mockReset()
    bonjour = Bonjour()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('start creates mdns browser searching for http', () => {
    const client = DiscoveryClient()
    const result = client.start()

    expect(result).toBe(client)
    expect(bonjour.find).toHaveBeenCalledWith({type: 'http'})
    expect(bonjour.__mockBrowser.start).not.toHaveBeenCalled()
  })

  test('calls start on existing browser', () => {
    const client = DiscoveryClient()

    client.start()
    client.start()
    expect(bonjour.find).toHaveBeenCalledTimes(1)
    expect(bonjour.__mockBrowser.start).toHaveBeenCalledTimes(1)
  })

  test('stops browser on client.stop', () => {
    const client = DiscoveryClient()

    client.start()
    const result = client.stop()
    expect(result).toBe(client)
    expect(bonjour.__mockBrowser.stop).toHaveBeenCalled()
  })

  test(
    'emits "service" if browser finds a service',
    done => {
      const client = DiscoveryClient()

      client.start()
      client.once('service', robot => {
        expect(robot).toEqual({
          name: 'opentrons-dev',
          ip: '192.168.1.42',
          port: 31950,
          ok: null
        })

        done()
      })

      bonjour.__mockBrowser.emit('up', BROWSER_SERVICE)
    },
    10
  )

  test(
    'adds robot to client.services if browser finds a service',
    done => {
      const client = DiscoveryClient()

      client.start()
      client.once('service', service => {
        expect(client.services).toEqual([service])
        expect(client.candidates).toEqual([])
        done()
      })

      bonjour.__mockBrowser.emit('up', BROWSER_SERVICE)
    },
    10
  )

  test(
    'selects IPv4 as ip from service.addresses',
    done => {
      const client = DiscoveryClient()
      const service = {
        ...BROWSER_SERVICE,
        addresses: ['fe80::caf4:6db4:4652:e975', ...BROWSER_SERVICE.addresses]
      }

      client.start()
      client.once('service', service => {
        expect(service.ip).toBe('192.168.1.42')
        done()
      })

      bonjour.__mockBrowser.emit('up', service)
    },
    10
  )

  test(
    'ip falls back to IPv6 if no IPv4',
    done => {
      const client = DiscoveryClient()
      const service = {
        ...BROWSER_SERVICE,
        addresses: ['fe80::caf4:6db4:4652:e975']
      }

      client.start()
      client.once('service', service => {
        expect(service.ip).toBe('[fe80::caf4:6db4:4652:e975]')
        done()
      })

      bonjour.__mockBrowser.emit('up', service)
    },
    10
  )

  test(
    'ip falls back to host if no IPv6 nor IPv4',
    done => {
      const client = DiscoveryClient()
      const service = {
        ...BROWSER_SERVICE,
        addresses: []
      }

      client.start()
      client.once('service', service => {
        expect(service.ip).toBe('opentrons-dev.local')
        done()
      })

      bonjour.__mockBrowser.emit('up', service)
    },
    10
  )

  test('services and candidates can be prepopulated', () => {
    const client = DiscoveryClient({
      services: [
        {
          name: 'opentrons-dev',
          ip: '192.168.1.42',
          port: 31950,
          ok: true
        }
      ],
      candidates: [{ip: '192.168.1.43', port: 31950}]
    })

    expect(client.services).toEqual([
      {
        name: 'opentrons-dev',
        ip: '192.168.1.42',
        port: 31950,
        // ok flag should be nulled out
        ok: null
      }
    ])
    expect(client.candidates).toEqual([{ip: '192.168.1.43', port: 31950}])
  })

  test('candidates should be deduped by services', () => {
    const client = DiscoveryClient({
      services: [
        {
          name: 'opentrons-dev',
          ip: '192.168.1.42',
          port: 31950,
          ok: true
        }
      ],
      candidates: [{ip: '192.168.1.42', port: 31950}]
    })

    expect(client.candidates).toEqual([])
  })

  test('client.start should start polling with default interval 5000', () => {
    const client = DiscoveryClient({
      services: [
        {
          name: 'opentrons-dev',
          ip: 'foo',
          port: 1
        }
      ],
      candidates: [{ip: 'bar', port: 2}, {ip: 'baz', port: 3}]
    })

    client.start()
    expect(poller.poll).toHaveBeenCalledWith(
      [{ip: 'foo', port: 1}, {ip: 'bar', port: 2}, {ip: 'baz', port: 3}],
      5000,
      expect.any(Function),
      client._logger
    )
  })

  test('client should have configurable poll interval', () => {
    const client = DiscoveryClient({
      pollInterval: 1000,
      candidates: [{ip: 'foo', port: 31950}]
    })

    client.start()
    expect(poller.poll).toHaveBeenCalledWith(
      expect.anything(),
      1000,
      expect.anything(),
      client._logger
    )
  })

  test('client.stop should stop polling', () => {
    const client = DiscoveryClient()

    poller.poll.mockReturnValueOnce({id: 'foobar'})
    client.start()
    client.stop()
    expect(poller.stop).toHaveBeenCalledWith({id: 'foobar'}, client._logger)
  })

  test('if poll comes back bad, ok should be flagged false', () => {
    const client = DiscoveryClient({
      services: [
        {
          name: 'opentrons-dev',
          ip: '192.168.1.42',
          port: 31950,
          ok: null
        }
      ]
    })

    client.start()
    const onHealth = poller.poll.mock.calls[0][2]
    onHealth({ip: '192.168.1.42', port: 31950}, null)
    expect(client.services[0].ok).toBe(false)
    expect(client.services).toHaveLength(1)
  })

  test(
    'if poll comes back good, ok should be flagged true',
    done => {
      const client = DiscoveryClient({
        services: [
          {
            name: 'opentrons-dev',
            ip: '192.168.1.42',
            port: 31950,
            ok: null
          }
        ]
      })

      client.once('service', () => {
        expect(client.services[0].ok).toBe(true)
        expect(client.services).toHaveLength(1)
        done()
      })

      client.start()
      const onHealth = poller.poll.mock.calls[0][2]
      onHealth({ip: '192.168.1.42', port: 31950}, {name: 'opentrons-dev'})
    },
    10
  )

  test(
    'if health comes back for a candidate, it should be promoted',
    done => {
      const client = DiscoveryClient({candidates: [{ip: 'foo', port: 31950}]})

      client.once('service', () => {
        expect(client.candidates).toEqual([])
        expect(client.services).toEqual([
          {
            name: 'opentrons-dev',
            ip: 'foo',
            port: 31950,
            ok: true
          }
        ])
        done()
      })

      client.start()
      const onHealth = poller.poll.mock.calls[0][2]
      onHealth({ip: 'foo', port: 31950}, {name: 'opentrons-dev'})
    },
    10
  )

  test(
    'if health comes back with IP conflict, null out old service',
    done => {
      const client = DiscoveryClient({
        services: [{name: 'bar', ip: 'foo', port: 31950}]
      })

      client.once('service', () => {
        expect(client.services).toEqual([
          {name: 'bar', ip: null, port: 31950, ok: null},
          {
            name: 'opentrons-dev',
            ip: 'foo',
            port: 31950,
            ok: true
          }
        ])
        done()
      })

      client.start()
      const onHealth = poller.poll.mock.calls[0][2]
      onHealth({ip: 'foo', port: 31950}, {name: 'opentrons-dev'})
    },
    10
  )

  test('if new service is added, poller is restarted', () => {
    const client = DiscoveryClient()

    poller.poll.mockReturnValueOnce({id: 1234})

    client.start()
    expect(poller.poll).toHaveBeenLastCalledWith(
      [],
      expect.anything(),
      expect.anything(),
      client._logger
    )

    client.once('service', robot => {
      expect(poller.stop).toHaveBeenLastCalledWith({id: 1234}, client._logger)
      expect(poller.poll).toHaveBeenLastCalledWith(
        [{ip: '192.168.1.42', port: 31950}],
        expect.anything(),
        expect.anything(),
        client._logger
      )
    })

    bonjour.__mockBrowser.emit('up', BROWSER_SERVICE)
  })

  test('services may be removed and removes candidates', () => {
    const client = DiscoveryClient({
      services: [
        {
          name: 'opentrons-dev',
          ip: '192.168.1.42',
          port: 31950
        },
        {
          name: 'opentrons-dev',
          ip: '[fd00:0:cafe:fefe::1]',
          port: 31950
        }
      ]
    })

    client.start()
    const result = client.remove('opentrons-dev')
    expect(result).toBe(client)
    expect(client.services).toEqual([])
    expect(client.candidates).toEqual([])
  })

  test('candidate removal restarts poll', () => {
    const client = DiscoveryClient({
      services: [
        {
          name: 'opentrons-dev',
          ip: '192.168.1.42',
          port: 31950
        }
      ]
    })

    poller.poll.mockReturnValueOnce({id: 1234})
    client.start()
    client.remove('opentrons-dev')
    expect(poller.stop).toHaveBeenLastCalledWith({id: 1234}, client._logger)
    expect(poller.poll).toHaveBeenLastCalledWith(
      [],
      expect.anything(),
      expect.anything(),
      client._logger
    )
  })

  test(
    'candidate removal emits removal events',
    done => {
      let services = [
        {
          name: 'opentrons-dev',
          ip: '192.168.1.42',
          port: 31950,
          ok: null
        },
        {
          name: 'opentrons-dev',
          ip: '[fd00:0:cafe:fefe::1]',
          port: 31950,
          ok: null
        }
      ]

      const client = DiscoveryClient({services})

      client.on('serviceRemoved', service => {
        expect(services).toContainEqual(service)
        services = services.filter(
          s => s.name !== service.name || s.ip !== service.ip
        )

        if (services.length === 0) done()
      })

      client.start()
      client.remove('opentrons-dev')
    },
    10
  )

  test('passes along mdns errors', done => {
    const mockError = new Error('AH')
    const client = DiscoveryClient().once('error', error => {
      expect(error).toEqual(mockError)
      done()
    })

    client.start()
    bonjour.__mockBrowser.emit('error', mockError)
  })

  test('can filter services by name', () => {
    const client = DiscoveryClient({nameFilter: /^OPENTRONS/i})

    client.start()
    bonjour.__mockBrowser.emit('up', BROWSER_SERVICE)
    bonjour.__mockBrowser.emit('up', {...BROWSER_SERVICE, name: 'Opentrons-2'})
    bonjour.__mockBrowser.emit('up', {...BROWSER_SERVICE, name: 'fopentrons'})

    expect(client.services.map(s => s.name)).toEqual([
      'opentrons-dev',
      'Opentrons-2'
    ])
  })

  test('can filter services by port', () => {
    const client = DiscoveryClient({allowedPorts: [31950, 31951]})

    client.start()
    bonjour.__mockBrowser.emit('up', BROWSER_SERVICE)
    bonjour.__mockBrowser.emit('up', {
      ...BROWSER_SERVICE,
      name: '2',
      port: 31951
    })
    bonjour.__mockBrowser.emit('up', {...BROWSER_SERVICE, name: '3', port: 22})

    expect(client.services.map(s => s.port)).toEqual([31950, 31951])
  })

  test('can add a candidate manually (with deduping)', () => {
    const client = DiscoveryClient()
    const result = client.add('localhost').add('localhost')

    const expectedCandidates = [{ip: 'localhost', port: null}]
    expect(result).toBe(client)
    expect(client.candidates).toEqual(expectedCandidates)
    expect(poller.poll).toHaveBeenLastCalledWith(
      expectedCandidates,
      expect.anything(),
      expect.anything(),
      client._logger
    )
  })

  test('can change polling interval on the fly', () => {
    const client = DiscoveryClient({candidates: ['localhost']})
    const expectedCandidates = [{ip: 'localhost', port: null}]

    let result = client.setPollInterval(1000)
    expect(result).toBe(client)
    expect(poller.poll).toHaveBeenLastCalledWith(
      expectedCandidates,
      1000,
      expect.anything(),
      client._logger
    )

    client.setPollInterval(0)
    expect(poller.poll).toHaveBeenLastCalledWith(
      expectedCandidates,
      5000,
      expect.anything(),
      client._logger
    )
  })
})
