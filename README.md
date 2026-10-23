# dokinomicon

An archive of every Doki in the Dokiverse, and of every one of Mint Fantome's characters.

The same code is built into a separate site for each streamer:

| Streamer     | Site                                                                               |
| ------------ | ---------------------------------------------------------------------------------- |
| Dokibird     | [The Dokinomicon](https://www.duck-automata.com/dokinomicon/) (`/dokinomicon/`)    |
| Mint Fantome | [The Mintonomicon](https://www.duck-automata.com/mintonomicon/) (`/mintonomicon/`) |

## Overview

_Development_

- **[Tech Used](#tech-used)**
- **[Running Locally](#running-locally)**
- **[Sites](#sites)**
- **[Contributing](#contributing)**
- **[Contributing Ideas](#contrubiting-ideas)**
- **[Building a Release](#building-a-new-release)**
- **[Release Process](#release-process)**

## Development

### Tech Used

- Node 22
- Vite to run locally
- React19

### Running Locally

1. Have Node 20 or later installed
2. Clone the repo locally
3. Run `npm install` to install dependencies
4. Run `npm run dev` and open the site it gives you. Or press `o` and enter to open the site.

Every time you save, Vite will automatically refresh the cache and the site should refresh with the new changes.

`npm run dev` runs the Dokinomicon. Use `npm run dev:mint` for the Mintonomicon, and `npm run dev:mock` / `npm run dev:mint:mock` to run either one against the mock suggestion API (nothing is sent to the backend). The dev server serves one site at a time, so links to the other site don't work there.

#### Previewing every site

To check the production build, and the links between the sites, run `npm run build`, then `npm run preview`. This serves `dist/` through the real Worker ([`src/worker.js`](src/worker.js)) with `wrangler dev`, the same way production does. Open `http://127.0.0.1:8787/<slug>/` for each site ([the Dokinomicon](http://127.0.0.1:8787/dokinomicon/), [the Mintonomicon](http://127.0.0.1:8787/mintonomicon/)); links between the sites work there. The preview only listens on `127.0.0.1`, so use that rather than `localhost`. If port 8787 is already taken, wrangler picks the next free one, so use the address on its "Ready on" line. It doesn't need a Cloudflare login and doesn't deploy anything. Run `npm run build` again after a change, since the preview only serves what's in `dist/`.

#### Update Command

```bash
npx npm-check-updates -u --cooldown 7; npm install; npm audit; npm audit signatures --min-release-age=0
```

if any of the install/update commands are failing, you can add `--min-release-age=0` to it to bypass the minimum release age restriction.

### Sites

Each site is an entry in [`sites.config.js`](sites.config.js): its `slug` (the URL path, the CDN/R2 prefix its data is read from at `https://content.duck-automata.com/<slug>/`, and the `site` sent with suggestions), title, short title (the nav-bar name), the streamer's name, the word for one entry in the archive ("Doki", "Mint"), description and theme color. There is no shared content between sites: each site only reads its own data.

The site for a build is picked with the `VITE_SITE` environment variable (`doki` or `mint`, defaults to `doki`). Each build gets the base path `/<slug>/` and is written to `dist/<slug>/`. You don't normally set it yourself:

- `npm run dev` / `npm run dev:mock` run Doki, `npm run dev:mint` / `npm run dev:mint:mock` run Mint.
- `npm run build` builds every site into `dist/<slug>/` (`dist/dokinomicon/` and `dist/mintonomicon/`), via [`scripts/sites.mjs`](scripts/sites.mjs).
- `npm run preview` serves every built site (see [Previewing every site](#previewing-every-site)).
- Tests run as Doki.

Each site's icons and preview image live in `public/<id>/` (`public/doki/`, `public/mint/`), which becomes the root of that site. It must contain:

- `favicon.ico`
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png`
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`
- `site_preview.png` (1200x630, used for link previews)
- `site.webmanifest`

`npm run build` warns about any that are missing.

### Contributing

1. create a branch and put your code onto it.
2. Run `npm run test`, `npm run format`, `npm run lint` and make sure everything is all good.
3. Push, raise pr, I'll approve.

### Contributing ideas

Raise an issue and detail what idea you have or would like to see.

### Building a new release

This project is hosted in a Cloudflare worker, which serves every site. Pushing to `master` deploys it automatically through GitHub Actions ([`ui-deploy.yml`](.github/workflows/ui-deploy.yml)).

To deploy manually (you need access to the worker), build every site and then deploy:

```bash
npm run build
npx wrangler deploy            # www.duck-automata.com
npx wrangler deploy --env dev  # dev.duck-automata.com
```

Always build with `npm run build`, never a bare `vite build`, before deploying. `wrangler deploy` uploads the whole `dist/` folder and replaces what was there, and `vite build` only builds the Dokinomicon, so the other sites would be taken down.
