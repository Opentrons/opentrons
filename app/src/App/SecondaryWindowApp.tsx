import { Fragment } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Navigate, Route, Routes } from 'react-router-dom'

import {
  Box,
  COLORS,
  OVERFLOW_AUTO,
  POSITION_RELATIVE,
} from '@opentrons/components'

import { LocalizationProvider } from '/app/LocalizationProvider'
// eslint-disable-next-line opentrons/no-imports-across-applications
import { LivestreamViewer } from '/app/pages/Desktop/LivestreamViewer'

import { DesktopAppFallback } from './DesktopAppFallback'
import { ReactQueryDevtools } from './tools'

import type { RouteProps } from './types'

// UI root for secondary windows in the desktop app.
export const SecondaryWindowApp = (): JSX.Element => {
  const secondaryRoutes: RouteProps[] = [
    {
      Component: LivestreamViewer,
      name: 'Camera Stream',
      path: '/camera-stream',
    },
  ]

  return (
    <LocalizationProvider>
      <ErrorBoundary FallbackComponent={DesktopAppFallback}>
        <ReactQueryDevtools />
        <Box width="100%">
          <Routes>
            {secondaryRoutes.map(({ Component, path }: RouteProps) => {
              return (
                <Route
                  key={path}
                  element={
                    <Fragment key={Component.name}>
                      <Box
                        position={POSITION_RELATIVE}
                        width="100%"
                        height="100vh"
                      >
                        <Box
                          width="100%"
                          height="100%"
                          backgroundColor={COLORS.grey10}
                          overflow={OVERFLOW_AUTO}
                        >
                          <Component />
                        </Box>
                      </Box>
                    </Fragment>
                  }
                  path={path}
                />
              )
            })}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Box>
      </ErrorBoundary>
    </LocalizationProvider>
  )
}
