import { describe, it, expect } from 'vitest'

import * as Fixtures from '../__fixtures__'
import * as selectors from '../selectors'

import type { State } from '../../types'

const firstProtocol = { ...Fixtures.storedProtocolData, protocolKey: 'first' }
const secondProtocol = { ...Fixtures.storedProtocolData, protocolKey: 'second' }

describe('protocol storage selectors', () => {
  it('getStoredProtocols', () => {
    const result = selectors.getStoredProtocols({
      protocolStorage: {
        addFailureFile: null,
        addFailureMessage: null,
        listFailureMessage: null,
        protocolKeys: [firstProtocol.protocolKey, secondProtocol.protocolKey],
        filesByProtocolKey: {
          [firstProtocol.protocolKey]: firstProtocol,
          [secondProtocol.protocolKey]: secondProtocol,
        },
      },
    } as State)
    expect(result).toEqual([firstProtocol, secondProtocol])
  })
  it('getStoredProtocol', () => {
    const result = selectors.getStoredProtocol(
      {
        protocolStorage: {
          addFailureFile: null,
          addFailureMessage: null,
          listFailureMessage: null,
          protocolKeys: [firstProtocol.protocolKey, secondProtocol.protocolKey],
          filesByProtocolKey: {
            [firstProtocol.protocolKey]: firstProtocol,
            [secondProtocol.protocolKey]: secondProtocol,
          },
        },
      } as State,
      secondProtocol.protocolKey
    )
    expect(result).toEqual(secondProtocol)
  })
  it('getIsProtocolAnalysisInProgress returns true if in progress', () => {
    const result = selectors.getIsProtocolAnalysisInProgress(
      {
        protocolStorage: {
          addFailureFile: null,
          addFailureMessage: null,
          listFailureMessage: null,
          protocolKeys: [firstProtocol.protocolKey, secondProtocol.protocolKey],
          filesByProtocolKey: {
            [firstProtocol.protocolKey]: firstProtocol,
            [secondProtocol.protocolKey]: secondProtocol,
          },
          inProgressAnalysisProtocolKeys: [secondProtocol.protocolKey],
        },
      } as State,
      secondProtocol.protocolKey
    )
    expect(result).toBe(true)
  })
  it('getIsProtocolAnalysisInProgress returns false if not in progress', () => {
    const result = selectors.getIsProtocolAnalysisInProgress(
      {
        protocolStorage: {
          addFailureFile: null,
          addFailureMessage: null,
          listFailureMessage: null,
          protocolKeys: [firstProtocol.protocolKey, secondProtocol.protocolKey],
          filesByProtocolKey: {
            [firstProtocol.protocolKey]: firstProtocol,
            [secondProtocol.protocolKey]: secondProtocol,
          },
          inProgressAnalysisProtocolKeys: [secondProtocol.protocolKey],
        },
      } as State,
      firstProtocol.protocolKey
    )
    expect(result).toBe(false)
  })
})
