# Reverse Proxy

Light-weight reverse proxy implemented by using [Cloudflare Workers](https://workers.cloudflare.com/).

- `https://example.com/`, `/about`, `/pricing`, `/blog/*`, etc.<br>
  ↳ routed to `https://example.webflow.io`
- `https://example.com/help/*`<br>
  ↳ routed to `https://intercom.help`
- `https://example.com/graphql`, `/auth/google`, `/auth/google/return` etc.<br>
  ↳ routed to the GraphQL API server (Google Cloud Function or Cloud Run)
- `https://example.com/admin/*`<br>
  ↳ routed to the admin dashboard (Cloudflare Workers Site)
- `https://example.com/*` the rest of the pages<br>
  ↳ routed to the main web application (Cloudflare Workers Site)

## Tech Stack

- [Node.js](https://nodejs.org/) `v12+`, [Yarn](https://yarnpkg.com/) `v2` package manager
- [Babel](https://babeljs.io/), [TypeScript](https://www.typescriptlang.org/),
  [Webpack](https://webpack.js.org/) `v5`, [ESLint](https://eslint.org/)

## How to Build

```bash
$ yarn build                    # Builds the project using Webpack
```

## References

- [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)

## License

Copyright © 2016-present Kriasoft. This source code is licensed under the MIT license found in the
[LICENSE](https://github.com/kriasoft/nodejs-api-starter/blob/master/LICENSE) file.
