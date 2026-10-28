# Project architecture rules

- Brand and onboarding artwork must live under `public/images` and use root-relative paths so external TanStack/Nitro deployments copy and serve it without Lovable-specific infrastructure.- The public landing page owns `/`; the member app lives under `/app/*` (`src/routes/app/`), and every pre-move top-level path is kept as a thin redirect route via `redirectToAppPath` so old bookmarks, emails, push links and installed PWAs keep working.
- The public neighbourhood directory reads only through the `get_active_neighbourhoods()` security-definer function (country, city, name); never expose member counts or profile data to anonymous visitors.
