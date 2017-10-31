// simple script to advertise a MDNS service for local API
// TODO(mc, 2017-10-31): remove this file once API can advertise for itself
const bonjour = require('bonjour')()

console.log('Publishing local MDNS service for API')

const service = bonjour.publish({
  name: 'ot-local-api',
  host: 'localhost',
  port: 31950,
  // TODO(mc, 2017-10-26): we're relying right now on the fact that resin
  // advertises an SSH service. Instead, we should be registering an HTTP
  // service on port 31950 and listening for that instead
  type: 'ssh'
})

service.on('error', (error) => {
  console.error('Error advertising MDNS service for local API', error)
})
