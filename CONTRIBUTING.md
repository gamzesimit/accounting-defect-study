# Contributing

## Running the study

```bash
git clone https://github.com/akaunting/docker akaunting-docker
cd akaunting-docker
cp env/db.env.example env/db.env
cp env/run.env.example env/run.env   # set APP_URL to http://localhost:8080
AKAUNTING_SETUP=true docker compose up -d
```

Then from this repository:

```bash
npm ci
npx playwright install chromium
npx playwright test
```

The AK-001 tests skip themselves when the documented workaround is in place,
because the defect cannot be observed once the create screens open. To see them
prove the defect, clear the plan cache first:

```bash
docker compose exec akaunting php artisan tinker --execute='Illuminate\Support\Facades\Cache::forget("plans.limits");'
```

## What belongs in this repository

This is a defect study, not a regression suite. A test earns its place when it
demonstrates a defect or pins behaviour a report depends on. A test that only
exercises a screen belongs in an automation repository instead.

## Reporting a defect

Every entry in `docs/defect-reports.md` states the steps, the result, what was
expected, the impact, and the test that covers it. Where the cause was found in
the source, the file and the mechanism are named, because a report that stops at
the symptom leaves the next person to do the same work again.
