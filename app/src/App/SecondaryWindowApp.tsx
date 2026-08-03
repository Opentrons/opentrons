import { Fragment } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Navigate, Route, Routes, useMatch } from 'react-router-dom'

import {
  Box,
  COLORS,
  OVERFLOW_AUTO,
  POSITION_RELATIVE,
} from '@opentrons/components'

import { LocalizationProvider } from '/app/LocalizationProvider'
// eslint-disable-next-line opentrons/no-imports-across-applications
import { CameraPhotoViewer } from '/app/pages/Desktop/CameraPhotoViewer'
// eslint-disable-next-line opentrons/no-imports-across-applications
import { LivestreamViewer } from '/app/pages/Desktop/LivestreamViewer'
// eslint-disable-next-line opentrons/no-imports-across-applications
import { StepDetailViewer } from '/app/pages/Desktop/StepDetailViewer'

import { ApiHostProvider } from '../local-resources/api-host-provider/ApiHostProvider'
import { SecondaryWindowAppFallback } from './SecondaryWindowAppFallback'
import { ReactQueryDevtools } from './tools'

import type { ReactNode } from 'react'
import type { RouteProps } from './types'

// UI root for secondary windows in the desktop app.
export const SecondaryWindowApp = (): JSX.Element => {
  const secondaryRoutes: RouteProps[] = [
    {
      Component: LivestreamViewer,
      name: 'Camera Stream',
      path: '/devices/:robotName/camera-stream',
    },
    {
      Component: CameraPhotoViewer,
      name: 'Camera Photo',
      path: '/devices/:robotName/camera-photo',
    },
    {
      Component: StepDetailViewer,
      name: 'Step Detail Viewer',
      path: '/protocols/:protocolKey/visualization',
    },
  ]

  return (
    <LocalizationProvider>
      <ErrorBoundary FallbackComponent={SecondaryWindowAppFallback}>
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
                          <HostProvider>
                            <Component />
                          </HostProvider>
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

interface HostProviderProps {
  children: ReactNode
}

function HostProvider({ children }: HostProviderProps): JSX.Element | null {
  const deviceRouteMatch = useMatch('/devices/:robotName/*')
  const params = deviceRouteMatch?.params
  const robotName = params?.robotName ?? null

  return <ApiHostProvider robotName={robotName}>{children}</ApiHostProvider>
}
