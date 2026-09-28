# Defect reports

Application under test: Akaunting 3.1.21, open source accounting software,
running from the official container image on a machine with no special network
restrictions. Tested September 2026.

Both findings share one cause: the application depends on an outbound call to a
vendor service in places the user cannot see, and when that call does not
succeed it fails silently or blames the wrong thing.

---

## AK-001 — On a fresh install no record of any kind can be created

**Severity:** Blocker
**Area:** Every create screen
**Status:** Reproducible on every attempt

**Steps**

1. Install from the official container image and finish the setup wizard.
2. Sign in as the administrator created during setup.
3. Open any of these addresses:
   - `/1/sales/customers/create`
   - `/1/common/items/create`
   - `/1/sales/invoices/create`
   - `/1/settings/taxes/create`
   - `/1/banking/transactions/create?type=income`

**Result**
Every one of them answers `302` and lands on the Users page. No form is shown.
No message is shown. The invoice list page carries a banner reading
"Not able to create a new invoice." with no explanation of what to do.

The administrator holds all five create permissions, confirmed in the database,
so this is not a permissions problem.

**Root cause**
`app/Http/Middleware/RedirectIfHitPlanLimits.php` runs on every GET request whose
last path segment is `create`. It calls `getUserLimitOfPlan()` in
`app/Traits/Plans.php`, which asks the vendor service at `plans/limits` what the
account is allowed to do. When that call returns nothing, the trait builds a
limit object with `action_status = false` and the message
"Not able to create a new $type", and the middleware redirects to the Users page
without surfacing the message.

**Expected**
A self hosted installation of open source accounting software creates records
without asking an outside service for permission. If the check is intended, a
failed check must say so plainly: what was being checked, why it failed, and what
the administrator should do.

**Impact**
The product is unusable out of the box on any machine that cannot reach the
vendor, including an air gapped install, an install behind a strict proxy, and
any install made while the vendor service is down. Nothing in the interface
points at the cause, so an administrator has no path to a fix.

**Workaround used for this study**
`scripts/unblock-create-screens.sh` writes a permissive answer into the cache so
the forms open. It touches no application source.

**Covered by** `tests/create-screens.spec.ts`.

---

## AK-002 — Email fields are validated against live mail records, and the message blames the address

**Severity:** High
**Area:** Customer, vendor and user forms
**Status:** Reproducible on every attempt

**Steps**

1. Open a customer form.
2. Enter a name and the address `billing@example.com`.
3. Save.

**Result**
The server answers `422` with
"The email must be a valid **email address**." The same form saves without
complaint when the address ends in `@gmail.com`.

`example.com` is reserved by the standards body for documentation and has no
mail records, which is why the check fails. The address itself is correctly
formed.

**Expected**
Either accept a correctly formed address, or say that the domain could not be
verified and that the check needs outbound access. The current wording sends the
user looking for a typing mistake that is not there.

**Impact**
On an install without outbound DNS, no customer, vendor or user can be saved at
all, and the message gives no clue why. On a normal install it blocks legitimate
internal domains and test data.

**Covered by** `tests/email-validation.spec.ts`.
