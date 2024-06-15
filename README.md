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
