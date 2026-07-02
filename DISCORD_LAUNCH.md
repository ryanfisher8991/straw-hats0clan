# Discord Verification Launch Runbook

One-time steps to turn on member verification, role gating, and nickname sync.

## 1. Env vars (Vercel project settings, not just `.env.local`)
Confirm these are set for the **production** environment:
- `DISCORD_BOT_TOKEN`
- `DISCORD_APPLICATION_ID`
- `DISCORD_PUBLIC_KEY`
- `DISCORD_GUILD_ID`
- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL`

## 2. Deploy
Merge/deploy this branch to production on Vercel.

## 3. Re-register slash commands
```
node scripts/register-discord-commands.mjs
```
This adds `/admin-preview-resync` and `/admin-apply-resync` (admin-only — Discord hides them from anyone without Manage Roles).

## 4. Run the new table SQL
In the Supabase SQL editor, run (also checked into `supabase/schema.sql`):
```sql
create table if not exists discord_seen_members (
  discord_user_id text primary key,
  first_seen_at timestamptz default now()
);
```

## 5. Role hierarchy — mostly fine, one deliberate exception
Current role order (top → bottom): **Leader, Admin, Devil Fruit Bot, Co-Leader, Elder, Crew Member, Hashira, Special Grade, Diamond, Gold, Silver, Copper, Verified, Unverified, Out of Clan, everyone**.

Discord requires a role to sit *above* another to assign/remove it (Administrator doesn't bypass this — only the server owner does). The bot's role (`Devil Fruit Bot`) already sits above everything it needs to manage — Co-Leader, Elder, Crew Member, all fame tiers, Verified, Unverified, Out of Clan — so no changes are needed there.

**Leader is the one exception**, and it's staying that way by design: the bot's role can't be moved above it, and clan leadership rarely changes anyway, so `Leader` is treated as a protected, manually-managed role — same as `Admin`. The bot will never add or remove it. A member with the Leader role still gets gated behind `Unverified` until they `/register` (Leader is preserved, not touched, while `Unverified` is layered on top), and still gets their fame-tier role and nickname synced normally — only the rank role itself is hands-off.

If an admin ever needs to hand out or revoke the Leader role manually going forward, they'll need a role positioned above it (currently only the server owner and any role above Leader can) — that's a separate manual-permissions question, not something this system depends on.

Confirm the bot has **Manage Roles** and **Manage Nicknames** enabled (nickname sync is new — role sync already required Manage Roles). If it was invited with a narrower permission set, either re-invite via the updated link on the Discord Bot config page (`/discord`) or toggle both on directly on its role.

## 6. Roles already exist — no creation needed
`Verified`, `Unverified`, and `Out of Clan` are already present in the server, so skip any role-creation step. Just confirm the names match exactly (case-sensitive) — the bot looks them up by name.

**Out of Clan** is assigned automatically to a *registered* member whose player tag drops out of the live clan roster (checked during the Mon/Fri member snapshot cron). Rejoining the clan automatically restores their previous rank/fame/Verified roles on the next sync — no manual step needed.

## 7. Gate your channels (do this carefully — the classic Discord footgun)
For every channel that should be hidden until verified:
- Set **`@everyone`** → **Deny View Channel**
- Set **`Verified`** (and `Admin`) → **Allow View Channel**

Do **not** put the deny on the `Unverified` role itself — Discord unions role overwrites, so a deny on Unverified plus "no overwrite" on Verified would still hide the channel from verified members too. Deny-on-`@everyone` + allow-on-`Verified` is the reliable pattern.

Leave your welcome/rules channel and wherever `/register` is meant to be run visible to `@everyone`.

## 8. Point the welcome webhook
On the clan website's Discord Bot config page, add a webhook URL for the feature key **`welcome_gate`**, pointed at your welcome channel. (Uses the same `discord_channels` table/UI as every other feature webhook.)

## 9. Preview the one-time cleanup
Run `/admin-preview-resync` in Discord. Sanity-check the numbers:
- Registered + in-clan members → will be synced to their real rank/fame roles + Verified
- Registered members no longer in the clan → will be set to Out of Clan
- Unregistered members with existing roles → will be stripped and set to Unverified
- Already-clean members → no-op

Nothing is changed by this step.

## 10. Apply the one-time cleanup
Run `/admin-apply-resync`. It strips every role except `Admin` and any Discord-managed (bot) role from every member, then re-applies the correct roles. This can take a minute or two for a full clan — it'll edit its own message with a summary when done.

Spot-check a few known members afterward — including at least one Leader/Co-Leader, since that's the role most likely to break if step 5 wasn't done.

## 11. Turn on new-member gating
The `/api/discord/gatekeeper` cron (runs every 2 min) is live as soon as this deploys — it assigns Unverified + posts a welcome message to anyone new who joins and isn't already verified. No extra step needed here, just confirm it's firing (Vercel → Cron Jobs → logs).

## 12. Announce
Post in the clan that registration is open: members run `/register <their player tag>` to get verified, their real Discord roles, and their nickname automatically set to their in-game name.

## Notes
- **Admin manual overrides**: giving Admin/Leader Discord roles Manage Roles lets them hand-adjust anyone's roles. Be aware the next automatic sync (after every war snapshot or member snapshot, or a future `/admin-apply-resync` run) recomputes rank/fame roles from stored data and can overwrite a manual change — this is existing behavior, not new. A "sticky override" flag is a possible follow-up, not needed for launch.
- Registration can start immediately after step 3 — you don't have to wait for gating/cleanup to let people run `/register`.
