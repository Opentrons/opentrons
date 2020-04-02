Basic usage:

```js
const [state, setState] = React.useState({ alert: 'success' })
;<div
  style={{
    width: '50%',
    height: '4rem',
    padding: '0.1rem',
    position: 'relative',
  }}
>
  {state.alert && (
    <AlertItem
      type="success"
      onCloseClick={() => setState({ alert: '' })}
      title={'good job!'}
    />
  )}
</div>
```

```js
const [state, setState] = React.useState({ alert: 'warning' })
;<div
  style={{
    width: '50%',
    height: '4rem',
    padding: '0.1rem',
    position: 'relative',
  }}
>
  {state.alert && (
    <AlertItem
      type="warning"
      onCloseClick={() => setState({ alert: '' })}
      title={'some sort of warning...'}
    />
  )}
</div>
```

```js
<div
  style={{
    width: '50%',
    height: '4rem',
    padding: '0.1rem',
    position: 'relative',
  }}
>
  <AlertItem type="error" title={'some sort of error...'} />
</div>
```

```js
const [state, setState] = React.useState({ alert: 'info' })
;<div
  style={{
    width: '50%',
    height: '4rem',
    padding: '0.1rem',
    position: 'relative',
  }}
>
  {state.alert && (
    <AlertItem
      type="info"
      onCloseClick={() => setState({ alert: '' })}
      title={'some informative text...'}
    />
  )}
</div>
```

Override the default icon with iconName:

```js
const [state, setState] = React.useState({ alert: 'info' })
;<div
  style={{
    width: '50%',
    height: '4rem',
    padding: '0.1rem',
    position: 'relative',
  }}
>
  {state.alert && (
    <AlertItem
      type="info"
      onCloseClick={() => setState({ alert: '' })}
      icon={{ name: 'pause-circle' }}
      title={'alert icon default override'}
    />
  )}
</div>
```

Add additional information with children:

```js
const [state, setState] = React.useState({ alert: 'warning' })
;<div
  style={{
    width: '50%',
    height: '14rem',
    padding: '0.1rem',
    position: 'relative',
  }}
>
  {state.alert && (
    <AlertItem
      type="warning"
      onCloseClick={() => setState({ alert: '' })}
      title={'some sort of warning...'}
    >
      <h3>More informative warning title</h3>
      <p>
        and some info on how to <a href="#">fix it</a>
      </p>
    </AlertItem>
  )}
</div>
```

Stackable:

```js
<div>
  <AlertItem
    type="warning"
    onCloseClick={() => console.log('dismiss warning 1')}
    title={
      'Warning 1 with longer text longer text longer text longer text longer text longer text has X'
    }
  />
  <AlertItem
    type="warning"
    title={
      'Warning 1 with longer text longer text longer text longer text longer text longer text no X'
    }
  />
  <AlertItem type="warning" title={'Warning'} />
  <AlertItem
    type="warning"
    onCloseClick={() => console.log('dismiss warning 3')}
    title={'Warning 3'}
  >
    <p>Some additional info</p>
  </AlertItem>
  <AlertItem
    type="warning"
    onCloseClick={() => console.log('dismiss warning 4')}
    title={'Warning 4'}
  />
</div>
```
