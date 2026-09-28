# Akaunting defect study

A short defect study of Akaunting 3.1.21, open source accounting software, run
from the official container image.

Two defects, both reproducible on every attempt, both traced to the same cause:
the application makes an outbound call to a vendor service in places the user
cannot see, and when the call does not succeed it either fails silently or
reports the wrong reason.

On a fresh install nothing can be created at all. Not a customer, not an invoice,
not a tax rate. The screens redirect to the Users page with no message. The cause
is a middleware that asks the vendor how many records the account is allowed to
have, and treats no answer as no permission.

## Findings at a glance

| Id     | Area                | Severity | What happens                                                                                                                                                                                                  |
| ------ | ------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AK-001 | Every create screen | Blocker  | On a fresh install no record can be created. The screens redirect to the Users page with no message. Traced to a middleware that asks a vendor service for plan limits and treats no answer as no permission. |
| AK-002 | Email fields        | High     | A correctly formed address on a domain without live mail records is refused, and the message blames the address rather than the lookup.                                                                       |

Both share one cause: an outbound call the user cannot see, failing silently.

## Rules that hold

The tax rate form and the currency rate form both refuse the values that would
corrupt a ledger: negative rates, rates above one hundred per cent, rates of
zero, and anything that is not a number. Those are recorded in the reports too,
because a study that lists only faults is not a test result.

Full reports: [docs/defect-reports.md](docs/defect-reports.md)

## Running it

```bash
git clone https://github.com/akaunting/docker akaunting-docker
cd akaunting-docker
cp env/db.env.example env/db.env
cp env/run.env.example env/run.env   # set APP_URL to http://localhost:8080
AKAUNTING_SETUP=true docker compose up -d
```

Then, from this repository:

```bash
npm ci
npx playwright install chromium
npx playwright test
```

The AK-001 tests are marked as expected failures with `test.fail()`, so the suite
is green while the defect stays visible. Remove the mark to watch them fail on a
fresh install.

To run the AK-002 tests the create screens have to open first, which means
applying the documented workaround:

```bash
cd ../akaunting-docker && bash ../accounting-defect-study/scripts/unblock-create-screens.sh
```

## What is here

```
tests/create-screens.spec.ts     AK-001, every create route
tests/email-validation.spec.ts   AK-002, reserved domain against a live domain
pages/LoginPage.ts               sign in
scripts/                         the workaround, so the study is repeatable
docs/defect-reports.md           the reports
```

## Note on scope

This is a defect study, not a regression suite. The value is in the two findings
and the root cause behind them. A full automation suite with continuous
integration lives in
[parabank-test-automation](https://github.com/gamzesimit/parabank-test-automation).
