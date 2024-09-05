# astro-copy-prod-deps

`astro-copy-prod-deps` is an Astro plugin for use with hybrid and SSR websites that copies only the dependencies needed in production from `node_modules` to the `dist/server` directory.

This is useful if you have a CI server building your website and don't want to run `npm install` on your production web server.

![Image](https://cdn.truewinter.net/i/c6ac19.png)

## Installation

### Automatic

Run `npx astro add astro-copy-prod-deps` to install the dependency.

### Manual

Modify your `astro.config.mjs` file as follows:

```js
import copyProdDeps from `astro-copy-prod-deps`;

export default defineConfig({
  integrations: [copyProdDeps()]
});
```
