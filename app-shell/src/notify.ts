/* eslint-disable @typescript-eslint/no-dynamic-delete */
import mqtt from 'mqtt'
import isEqual from 'lodash/isEqual'

import { createLogger } from './log'
import { FAILURE_STATUSES } from './constants'

import type { BrowserWindow } from 'electron'
import type {
  NotifyBrokerResponses,
  NotifyNetworkError,
  NotifyRefetchData,
  NotifyResponseData,
  NotifyTopic,
  NotifyUnsubscribeData,
} from '@opentrons/app/lib/redux/shell/types'
