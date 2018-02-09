Basic usage:

```js
<FlatButton onClick={() => alert('you clicked me')}>
  {'Click me!'}
</FlatButton>
```

Disabled:

```js
<FlatButton onClick={() => alert("can't click me")} disabled>
  {"Can't click"}
</FlatButton>
```

With icon:

```js
<FlatButton onClick={() => alert('you clicked me')} iconName='flask'>
  {'Click me!'}
</FlatButton>
```

Sometimes you need `<FlatButton>` that isn't a native `<button>`. To do this, pass a string or React component to the `Component` prop. If you pass `Component`, any extra props will get passed to your custom component.

Use the inspector on this example to see that the "button" is a `<div>` with the `role` attribute set.

```js
<FlatButton
  Component='div'
  role='button'
  iconName={'flask'}
  onClick={() => alert('click!')}
>
  {"I'm a div!"}
</FlatButton>
```
