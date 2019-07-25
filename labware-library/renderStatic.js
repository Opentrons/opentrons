'use strict'
const { run } = require('react-snap')

// TODO IMMEDIATELY: add all labware routes
const allLabwareRoutes = []

run({
  source: 'dist',
  include: ['create', ...allLabwareRoutes].map(p => `/${p}`),
})
