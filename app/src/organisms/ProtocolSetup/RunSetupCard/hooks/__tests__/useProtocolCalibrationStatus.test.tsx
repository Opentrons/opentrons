import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import * as discoverySelectors from '../../../../../redux/discovery/selectors'
import { useModuleRenderInfoById } from '../../../hooks'
import { getAttachedModules } from '../../../../../redux/modules'
import { mockConnectedRobot } from '../../../../../redux/discovery/__fixtures__'
import { renderHook } from '@testing-library/react-hooks'
import { useMissingModuleIds } from '..'
import type { Store } from 'redux'
import type { State } from '../../../../../redux/types'
import type { ModuleModel, ModuleType } from '@opentrons/shared-data'

jest.mock('../../../hooks')
jest.mock('../../../../../redux/modules')
jest.mock('../../../../../redux/discovery/selectors')

const mockUseModuleRenderInfoById = useModuleRenderInfoById as jest.MockedFunction<
  typeof useModuleRenderInfoById
>
const mockGetConnectedRobot = discoverySelectors.getConnectedRobot as jest.MockedFunction<
  typeof discoverySelectors.getConnectedRobot
>
const mockGetAttachedModules = getAttachedModules as jest.MockedFunction<
  typeof getAttachedModules
>
