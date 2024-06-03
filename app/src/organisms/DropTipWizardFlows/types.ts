import type { DT_ROUTES } from './constants'

export type DropTipFlowsRoute = typeof DT_ROUTES[keyof typeof DT_ROUTES]
export type DropTipFlowsStep = DropTipFlowsRoute[number]
