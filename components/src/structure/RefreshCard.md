Refreshable info Card with RefreshCard:

```js
import { LabeledValue, OutlineButton } from '@opentrons/components'
const [state, setState] = React.useState({
  name: 'foo',
  when: Date.now(),
  refreshing: false,
})

function refresh() {
  setState({ ...state, refreshing: true })
  setTimeout(
    () =>
      setState({
        ...state,
        when: Date.now(),
        refreshing: false,
      }),
    2000
  )
}

;<div style={{ width: '32rem' }}>
  <RefreshCard
    title={`Name: ${state.name}`}
    watch={state.name}
    refreshing={state.refreshing}
    refresh={refresh}
  >
    <div style={{ padding: '1rem' }}>
      <LabeledValue label={'Refreshed at'} value={state.when} />
    </div>
    <div style={{ padding: '1rem', textAlign: 'right' }}>
      <OutlineButton onClick={() => setState({ ...state, name: 'foo' })}>
        {'Name -> "foo"'}
      </OutlineButton>
      <OutlineButton onClick={() => setState({ ...state, name: 'bar' })}>
        {'Name -> "bar"'}
      </OutlineButton>
    </div>
  </RefreshCard>
</div>
```
