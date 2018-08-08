import mdns from 'mdns-js'
import DiscoveryClient from '..'
import * as poller from '../poller'

jest.mock('mdns-js')
jest.mock('../poller')

const BROWSER_SERVICE = {
  addresses: ['192.168.1.42'],
  query: ['_http._tcp.local'],
  type: [
    {
      name: 'http',
      protocol: 'tcp',
      subtypes: [],
      description: 'Web Site'
    }
  ],
  txt: [''],
  port: 31950,
  fullname: 'opentrons-dev._http._tcp.local',
  host: 'opentrons-dev.local',
  interfaceIndex: 0,
  networkInterface: 'en0'
}

describe('discovery client', () => {
  beforeEach(() => {
    mdns.__mockReset()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('start creates mdns browser searching for http', () => {
    const client = DiscoveryClient()
    const result = client.start()

    expect(result).toBe(client)
    expect(mdns.createBrowser).toHaveBeenCalledWith(mdns.tcp('http'))
    expect(mdns.__mockBrowser.discover).not.toHaveBeenCalled()
  })

  test('calls start on existing browser', () => {
    const client = DiscoveryClient()

    client.start()
    expect(mdns.createBrowser).toHaveBeenCalledTimes(1)
    expect(mdns.__mockBrowser.discover).toHaveBeenCalledTimes(0)
    mdns.__mockBrowser.emit('ready')
    expect(mdns.__mockBrowser.discover).toHaveBeenCalledTimes(1)
  })

  test('stops browser on client.stop', () => {
    const client = DiscoveryClient()

    client.start()
    const result = client.stop()
    expect(result).toBe(client)
    expect(mdns.__mockBrowser.stop).toHaveBeenCalled()
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

      mdns.__mockBrowser.emit('update', BROWSER_SERVICE)
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

      mdns.__mockBrowser.emit('update', BROWSER_SERVICE)
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

      mdns.__mockBrowser.emit('update', service)
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

      mdns.__mockBrowser.emit('update', service)
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

      mdns.__mockBrowser.emit('update', service)
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

    mdns.__mockBrowser.emit('update', BROWSER_SERVICE)
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
    mdns.__mockBrowser.emit('error', mockError)
  })

  test('can filter services by name', () => {
    const client = DiscoveryClient({nameFilter: /^OPENTRONS/i})

    client.start()
    mdns.__mockBrowser.emit('update', BROWSER_SERVICE)
    mdns.__mockBrowser.emit('update', {
      ...BROWSER_SERVICE,
      fullname: 'Opentrons-2._http._tcp.local'
    })
    mdns.__mockBrowser.emit('update', {
      ...BROWSER_SERVICE,
      fullname: 'fopentrons._http._tcp.local'
    })

    expect(client.services.map(s => s.name)).toEqual([
      'opentrons-dev',
      'Opentrons-2'
    ])
  })

  test('can filter services by port', () => {
    const client = DiscoveryClient({allowedPorts: [31950, 31951]})

    client.start()
    mdns.__mockBrowser.emit('update', BROWSER_SERVICE)
    mdns.__mockBrowser.emit('update', {
      ...BROWSER_SERVICE,
      fullname: '2._http._tcp.local',
      port: 31951
    })
    mdns.__mockBrowser.emit('update', {
      ...BROWSER_SERVICE,
      fullname: '3._http._tcp.local',
      port: 22
    })

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
