// discovery selectors tests
import * as discovery from '..'

describe('discovery selectors', () => {
  const SPECS = [
    {
      name: 'getScanning when true',
      selector: discovery.getScanning,
      state: {discovery: {scanning: true}},
      expected: true,
    },
    {
      name: 'getScanning when false',
      selector: discovery.getScanning,
      state: {discovery: {scanning: false}},
      expected: false,
    },
  ]

  SPECS.forEach(spec => {
    const {name, selector, state, expected} = spec
    test(name, () => expect(selector(state)).toEqual(expected))
  })
})
