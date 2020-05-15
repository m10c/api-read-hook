# api-read-hook

[![npm version](https://img.shields.io/npm/v/api-read-hook.svg)](https://www.npmjs.com/package/api-read-hook)

Hook-based library for simple yet flexible data fetching and display in React apps.

**WARNING**: API is not yet stable in 0.0.x releases.

- Compatible with any data fetching backend
  (e.g. [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API))
  and API format (e.g. REST, GraphQL).
- Predictable default mode of operation:
  fresh data is always fetched when the component first mounts.
- Pagination support (flexible enough for any server mechanism).
- Manual invalidation controls to wipe out stale responses across all components.
- Configurable per-instance or via React context.
- Full type-safety with TypeScript,
  including easy typing of expected responses
  (Flow support coming soon).
- Supports chaining API multiple dependent API requests.
- Opt-in fine-grained control of a response cache,
  with clear identification of stale responses.
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
