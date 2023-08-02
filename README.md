# api-read-hook

[![npm version](https://img.shields.io/npm/v/api-read-hook.svg)](https://www.npmjs.com/package/api-read-hook)

Hook-based library for simple yet flexible data fetching and display in React apps.

- Compatible with any data fetching backend
  (e.g. [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API))
  and API format (e.g. REST, GraphQL).
- Predictable default mode of operation:
  fresh data is always fetched when the component first mounts.
- Pagination support (flexible enough for any server mechanism).
- Manual invalidation controls to wipe out stale responses across all components, including automatic time-based invalidation.
- Manual mutation controls to update responses across mounted components.
- Configurable per-instance or via React context.
- Full type-safety with TypeScript or Flow,
  including easy typing of expected responses.
- Supports chaining API multiple dependent API requests.
- Opt-in fine-grained control of a response cache,
  with clear identification of stale responses and their age.
- **TODO**: A global cache,
  which can persist across screen unmounts.

## Installation

```bash
$ npm install --save api-read-hook

# Or, with Yarn
$ yarn add api-read-hook
```

## Getting started

```tsx
import { ApiReadProvider, useApiRead } from 'api-read-hook';

/**
 * Build a specific reader using HTTP Fetch on a bespoke REST API
 */
async function myApiReader(path) {
  const response = await fetch(`https://example.com${path}`);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  const data = await response.json();
  return data;
}

function MyApp() {
  return (
    {/* Context configuration for all useApiRead calls */}
    <ApiReadProvider config={{ reader: myApiReader }}>
      <Navigation />
    </ApiReadProvider>
  );
}

function HomeScreen() {
  const { data, error } = useApiRead('/posts');

  if (error) return 'An error occurred!';
  if (!data) return 'Loading...';

  return (
    <ul>
      {data.map(post => (
        <Post key={post.id} post={post} />
      ))}
    </ul>
  );
}
```

## Rationale

### Compared with SWR

SWR is designed around (and even named after)
the model of stale data being shown to the user by defualt,
while new data fetches in the background.

In our view,
this isn't desirable behaviour in the vast majority of cases for dynamic apps
(particularly when considering React Native).

api-read-hook uses a simpler and more predictable model by default,
where when a screen mounts,
it always fetches fresh data,
and the user sees a loading state.

This is in our opinion more intuitive for the user,
as they can trust they're seeing the latest data every time they open a new screen,
not worry the app may be opaquely digging up outdated stale data.

3 years after this library was created based on this justification,
the situation seems unchanged.
Vercel (SWR maintainers) are stil pushing ahead with their vision that data should be stale by default,
despite much pushback:
https://github.com/vercel/next.js/issues/42991#issuecomment-1569986363

## API reference

### `reader` function

The `reader` function is the only required piece of setup to make this library functional.
It's how the library knows how to perform requests against your API
(which could be REST, GraphQL, or any other type of protocol).

Your `reader` function,
when provided with a `string` path
(essentially a unique "key" for the request),
should asynchronously perform the appropriate request against your API,
carry out any processing on the response (e.g. parsing JSON),
and returns it.

If the request fails,
you should throw an `Error`.
Feel free to extend `Error` adding as much extra metadata as you'd like to use in your app.

### Configuration options

The library can be configured with the `ReadConfig` options,
either as a second argument to `useApiRead` to change just a single instance,
or in the top level `ApiReadProvider` `config` prop to set the defaults for all instances.

- **`reader`**: `(path: string) => Promise<mixed>` -
  A reader function for your app's API, as described above.
- **`staleWhileInvalidated?`**: `boolean` -
  If `true`, then when an API response is considered invalidated
  (either because you manually invalidated it, or it's become too old),
  the stale (invalidated) response will continue to be returned by the `useApiRead` hook.
- **`staleWhileError?`**: `boolean` -
  If `true`, then when an API response returns an error,
  if there was a previous response returned by this hook,
  that will continue to be returned by the hook.
- **`invalidateAge?`**: `number` -
  If provided, defines the number of seconds after which the current response will be marked as "invalidated",
  and therefore re-fetched.
  This is useful to ensure the user is never looking at content which is too old,
  even if they've kept the same screen open for a long time.

### Read result

The `useApiRead` hook returns a `ReadResult` object.
The following properties tell you about the data returned:

- **`data`**: `T | undefined` -
  If the data hasn't been fetched yet,
  or has been invalidated without the `staleWhileInvalidated` option enabled,
  this will return `undefined`.
  You will want to check for the absence of `data` and use that to display a loading screen.
  Once the request succeeds,
  it will return the data from your `reader` function.
  In TypeScript/Flow, you can use generics
  (`useApiRead<{ expected: string }>('/path')`)
  to indicate the type `T` of this property.
- **`error`**: `Error | undefined` -
  If the request failed,
  this can be used to display a relevant error message to the user.
- **`stale`**: `boolean` -
  Will be set to `true` if the current `data` being returned is considered stale.
- **`staleReason`**: `null | 'invalidated' | 'error'` -
  If a stale response is being returned (`stale: true`),
  indicates why.
- **`receivedAt`**: `null | number` -
  If `data` is being returned,
  a unix timestamp (seconds) of when the data was received
  (i.e. when the `reader` returned the data).

The `ReadResult` also contains some functions which can be called to control invalidation of responses.
`invalidate` works directly on the current response,
while `invalidateExact` and `invalidateMatching` allow searching through all currently held responses;
they are also available via the `useInvalidation` hook this library provides.

- **`invalidate`**: `() => void` -
  Call this when you know the current response is invalid and needs refetching
  (e.g. because the user just saved a change to entity).
- **`invalidateExact`**: `(search: string) => void` -
  Searches through all currently held responses
  (i.e. any mounted hooks current displaying a response),
  and invalidates those where `path` is an **exact** match of `search`.
- **`invalidateMatching`**: `(search: string | RegExp) => void` -
  Searchs through all currently held responses,
  and invalidates those where:
  - `search` is a `string`: `path` **contains** `search`.
  - `search` is a `RegExp`: `path` matches the `search` regexp.

Finally, `ReadResult` also contains some properties that can be used for pagination:

- **`readMore`**: `(path: string, updater: (moreData: T) => T) => void`
- **`loadingMore`**: `boolean`
- **`moreError`**: `Error` | `undefined`

## Examples

### Path of one API call dependent on another

Apart from splitting the hooks across 2 components,
and having the parent only render the child once its API call has succeeded,
you can also approach this by passing `null` to `path` for the 2nd hook
(which bypasses your `reader`)
until you have enough information to construct the 2nd path:

```js
function ProfileScreen({ name }: Props) {
  const apiSearch = useApiRead(`/find-user?name=${name}`);
  const apiUser = useApiRead(
    apiSearch.data ? `/profiles/${apiSearch.data.id}` : null
  );

  if (apiSearch.error || apiUser.error) return 'An error occurred!';
  if (!apiUser.data) return 'Loading...';
  const user = apiUser.data;

  return <h1>{user.name}</h1>;
}
```
