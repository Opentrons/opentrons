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

Stackable:
```js
<div>
  <AlertItem type='warning' onCloseClick={() => console.log('dismiss warning 1')} title={'Warning 1 with longer text longer text longer text longer text longer text longer text has X'} />
  <AlertItem type='warning' title={'Warning 1 with longer text longer text longer text longer text longer text longer text no X'} />
  <AlertItem type='warning' title={'Warning'} />
  <AlertItem type='warning' onCloseClick={() => console.log('dismiss warning 3')} title={'Warning 3'} >
    <p>Some additional info</p>
  </AlertItem>
  <AlertItem type='warning' onCloseClick={() => console.log('dismiss warning 4')} title={'Warning 4'} />
</div>
```
