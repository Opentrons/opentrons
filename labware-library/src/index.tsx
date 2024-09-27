// labware library entry
import { hydrate, render } from 'react-dom'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { App } from './components/App'
import { LabwareCreator } from './labware-creator'
import { getPublicPath } from './public-path'
import './styles.global.module.css'

export * from './labware-creator'

const $root = document.getElementById('root')

if (!$root) {
  throw new Error('fatal: :root not found')
}

const Root = (): JSX.Element => {
  const publicPath = getPublicPath()
  return (
    <BrowserRouter basename={publicPath}>
      <Routes>
        <Route path={`${publicPath}create`} element={<LabwareCreator />} />
        <Route path={`${publicPath}*`} element={<App />} />
      </Routes>
    </BrowserRouter>
  )
}

if ($root.hasChildNodes()) {
  hydrate(<Root />, $root)
} else {
  render(<Root />, $root)
}
