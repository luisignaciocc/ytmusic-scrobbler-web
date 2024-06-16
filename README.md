## workers deploy

```bash
git pull
```

```bash
pnpm install
```

```bash
pnpm build --filter worker
```

```bash
# first time only
pm2 start apps/worker/dist/main.js --name "yt-music-scrobbler-worker" --env production
pm2 save
pm2 startup
```

```bash
# if not first time
pm2 restart yt-music-scrobbler-worker
```

## web local development

1. install [pnpm](https://pnpm.io/es/installation)

2. install libraries with:

```bash
pnpm install
```

3. set environment variables

4. create a new branch

5. start development server with:

```bash
pnpm dev --filter web
```
