# HEARTBEAT.md

## Goal
Minimal token heartbeat.
- Only alert on real change or critical failure.
- Otherwise output exactly: HEARTBEAT_OK

## State file
`~/.openclaw/state/heartbeat-state.json`

Fields:
- lastSummary
- lastAlertAt
- lastOkAt

## Check
1) Run: `openclaw status --deep`
2) Extract only:
   - gateway reachable (up/down)
   - telegram state (OK/DOWN)
   - audit critical count
   - audit warning count

Build summary string:
`gateway=<up|down> telegram=<OK|DOWN> crit=<n> warn=<n>`

## Alert rules
ALWAYS alert if:
- gateway=down
- telegram=DOWN
- crit>0

Else:
- alert only if summary != lastSummary

## Output
If alerting, output max 3 bullets:
- Gateway: <up|down>
- Telegram: <OK|DOWN>
- Audit: crit=<n> warn=<n>

If not alerting, output exactly:
`HEARTBEAT_OK`

## State update
- Update lastSummary every run.
- Update lastAlertAt only when alerting.
- Update lastOkAt only when output is HEARTBEAT_OK.
