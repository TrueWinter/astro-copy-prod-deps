import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nodeFileTrace } from '@vercel/nft';

export default function () {
  /** @type{import('astro').AstroConfig} */
  let config;

  return {
    name: 'copy-prod-deps',
    hooks: {
      'astro:config:done': ({ config: _config }) => {
        config = _config;
      },
      // Using the done hook here because the manifest file doesn't exist yet when the ssr hook runs
      'astro:build:done': async ({ logger }) => {
        if (config.output === 'static') return;

        const serverDist = fileURLToPath(config.build.server.href);
        logger.info('Server output directory: ' + serverDist);

        const entryPath = path.join(serverDist, 'entry.mjs');
        const result = await nodeFileTrace([entryPath]);

        // https://github.com/withastro/adapters/blob/main/packages/netlify/src/lib/nft.ts
        for (const error of result.warnings) {
          if (error.message.startsWith('Failed to resolve dependency')) {
            const [, module, file] =
              /Cannot find module '(.+?)' loaded from (.+)/.exec(error.message) || [];
      
            // The import(astroRemark) sometimes fails to resolve, but it's not a problem
            if (module === '@astrojs/') continue;
      
            // Sharp is always external and won't be able to be resolved, but that's also not a problem
            if (module === 'sharp') continue;
      
            if (entryPath === file) {
              logger.info(
                `The module "${module}" couldn't be resolved. This may not be a problem, but it's worth checking.`
              );
            } else {
              logger.info(
                `The module "${module}" inside the file "${file}" couldn't be resolved. This may not be a problem, but it's worth checking.`
              );
            }
          }
          // parse errors are likely not js and can safely be ignored,
          // such as this html file in "main" meant for nw instead of node:
          // https://github.com/vercel/nft/issues/311
          else if (!error.message.startsWith('Failed to parse')) {
            throw error;
          }
        }

        let modules = new Set([...result.fileList]
          .filter(m => m.startsWith('node_modules'))
          .map(m => m.split(path.sep).slice(1, 2).join(path.sep)));

        const serverDistNodeModules = path.join(serverDist, 'node_modules');
        if (!fs.existsSync(serverDistNodeModules)) {
          fs.mkdirSync(serverDistNodeModules);
          logger.info('Created node_modules directory in dist/server');
        }

        logger.info('Copying production dependencies');
        modules.forEach(m => {
          fs.cpSync(path.join('node_modules', m), path.join(serverDistNodeModules, m), {
            recursive: true
          });
        });
        logger.info('Copied production dependencies');
      }
    }
  }
}
