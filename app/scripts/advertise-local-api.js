// simple script to advertise a MDNS service for local API
// TODO(mc, 2017-10-31): remove this file once API can advertise for itself
const bonjour = require('bonjour')()
const randomstring = require('randomstring')

const id = randomstring.generate({
  length: 6,
  charset: 'hex',
  capitalization: 'uppercase'
})
const name = `Opentrons Beta ${id}`
const service = {
  name,
  host: 'localhost',
  port: 31950,
  // TODO(mc, 2017-10-26): we're relying right now on the fact that resin
  // advertises an SSH service. Instead, we should be registering an HTTP
  // service on port 31950 and listening for that instead
  type: 'ssh'
}

bonjour.publish(service)
  .on('up', () => {
    console.log(`Published MDNS service "${service.name}" on ${service.host}`)
  })
  .on('error', (error) => {
    console.error('Error publishing MDNS service', error)
  })
