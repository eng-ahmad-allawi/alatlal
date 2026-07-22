# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight into your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js 20+ and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Deploying to Cloudflare

The build output is pre-configured for Cloudflare (Nitro `cloudflare-module` preset).

```sh
npm run build                  # produces .output/ (worker + static assets)
npx wrangler --cwd .output/server deploy
```

Required Cloudflare account variables are already in `.env`; if you switch
Supabase projects, update the `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
values before rebuilding.

## Time format

All visible appointment times are rendered in 12-hour format with an Arabic
AM/PM label (صباحا / مساء) on the leading edge of the cell. The internal
storage and `WorkingHour` / `Appointment` shapes still use 24-hour `HH:mm`
strings, so no DB migration is required — the conversion happens in the
`<Time12h />` component (`src/components/salon/time-12h.tsx`).

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
- Supabase
- Cloudflare (Nitro `cloudflare-module`)
<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
