Basic usage:

```js
initialState = {alert: 'success'}
;
<div style={{width:'50%', height:'4rem', position:'relative'}}>
  {state.alert && (
    <AlertItem type='success' onCloseClick={() => setState({alert: ''})} title={'good job!'} />
  )}
</div>
```

```js
initialState = {alert: 'warning'}
;
<div style={{width:'50%', height:'4rem', position:'relative'}}>
  {state.alert && (
    <AlertItem type='warning' onCloseClick={() => setState({alert: ''})} title={'some sort of warning...'} />
  )}
</div>
```

Add additional information with children:
```js
initialState = {alert: 'warning'}
;
<div style={{width:'50%', height:'14rem', position:'relative'}}>
  {state.alert && (
    <AlertItem type='warning' onCloseClick={() => setState({alert: ''})} title={'some sort of warning...'}>
      <h3>More informative warning title</h3>
      <p>and some info on how to <a href='#'>fix it</a></p>
    </AlertItem>
  )}
</div>
```
