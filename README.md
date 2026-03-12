# dokinomicon

An archive of every Doki in the Dokiverse.

## Overview

_Development_

- **[Tech Used](#tech-used)**
- **[Running Locally](#running-locally)**
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

### Contributing

1. create a branch and put your code onto it.
2. Run `npm run test`, `npm run format`, `npm run lint` and make sure everything is all good.
3. Push, raise pr, I'll approve.

### Contributing ideas

Raise an issue and detail what idea you have or would like to see.

### Building a new release

This project is hosted in a Cloudflare worker. If you have access to the worker, then run the deploy command to update the contents.

```bash
npm run deploy
```
