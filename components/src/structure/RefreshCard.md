Refreshable info Card with RefreshCard:

```js
initialState = {name: 'foo', when: Date.now(), refreshing: false}

function refresh () {
  setState({...state, refreshing: true})
  setTimeout(() => setState({
    ...state,
    when: Date.now(),
    refreshing: false
  }), 2000)
}

;<div style={{width: '32rem'}}>
  <RefreshCard
    watch={state.name}
    refreshing={state.refreshing}
    refresh={refresh}
    title={`Name: ${state.name}`}
  >
    <LabeledValue label={'Refreshed at'} value={state.when} />
    <FlatButton onClick={() => setState({...state, name: 'foo'})}>
      Name -> "foo"
    </FlatButton>
    <FlatButton onClick={() => setState({...state, name: 'bar'})}>
      Name -> "bar"
    </FlatButton>
  </RefreshCard>
</div>
```
