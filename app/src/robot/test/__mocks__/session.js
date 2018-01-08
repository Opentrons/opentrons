// mock rpc session
// based on api/opentrons/api/session.py
export default function MockSession () {
  return {
    name: 'MOCK SESSION',
    protocol_text: '# mock protocol text',
    commands: [],
    command_log: {},
    state: 'loaded',
    instruments: [],
    containers: [],

    run: jest.fn()
  }
}
