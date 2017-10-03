// mock rpc session
// based on api/opentrons/session/session.py
export default function MockSession () {
  return {
    name: 'MOCK SESSION',
    protocol_text: '# mock protocol text',
    commands: [],
    command_log: {},
    state: 'loaded',

    run: jest.fn(() => Promise.resolve())
  }
}
