#!/usr/bin/env bash
# Workaround for AK-001 so the rest of the study can run.
#
# The application asks akaunting.com for plan limits before it will render any
# create form, and blocks the form when the call fails. This writes a permissive
# answer straight into the cache so the forms open on an instance with no
# outbound access. It changes nothing in the application source.
set -euo pipefail

docker compose exec -T akaunting php artisan tinker --execute='
$ok = function () { $o = new stdClass(); $o->action_status = true; $o->view_status = true; $o->message = "Success"; return $o; };
$limits = new stdClass();
$limits->user = $ok(); $limits->company = $ok(); $limits->invoice = $ok();
Illuminate\Support\Facades\Cache::put("plans.limits", $limits, now()->addYear());
echo "create screens unblocked";
'
