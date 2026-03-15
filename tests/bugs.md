# Bugs Found by Automated Testing

Bugs discovered by Nova Act smoke tests during Ralph development loops.

- [2026-03-14 23:10] ~~**Site shows black page after deploy**: The `.next/` directory on the server is empty — the deploy wiped it but the build either failed or hasn't completed.~~ **FIXED** — Rebuilt on server manually (`pm2 stop && rm -rf .next && npm run build && pm2 restart`). Deploy script already has lock file and build check. Race condition was a one-off.

- [2026-03-14 22:55] ~~**Save bracket fails**: JSON.parse error when clicking Save Picks.~~ **FIXED** — uuid import issue in picks route.

- [2026-03-14 23:18] ~~**Creating AND saving brackets fails with 500**: POST /api/picks returns "ON CONFLICT clause does not match any PRIMARY KEY or UNIQUE constraint". This breaks BOTH creating new brackets and saving picks to existing ones. The picks table schema was changed to support multiple brackets per user (removed the UNIQUE(user_id, tournament_id) constraint), but the INSERT statement in src/app/api/picks/route.ts still uses `ON CONFLICT(user_id, tournament_id) DO UPDATE`. Fix: update the SQL to match the new schema. For creating a new bracket, just INSERT. For saving/updating an existing bracket, UPDATE WHERE id = bracket_id. The ON CONFLICT upsert pattern no longer works since the unique constraint is gone.~~ **FIXED** — Migration condition was checking for `bracket_name` anywhere in schema text, but it existed from ALTER TABLE. Fixed condition to check specifically for `UNIQUE(user_id, tournament_id, bracket_name)`. Also added `foreign_keys = OFF` during migration to prevent FK constraint failure on DROP TABLE.

- [2026-03-14 23:22] ~~**Pick counter shows 67 total games but there are only 63**: The bracket shows "63/67 picks made" or similar wrong totals. The TOTAL_GAMES constant in src/lib/bracketData.ts should be 63 (32+16+8+4+2+1) but something is counting extra games. Check if the First Four placeholder games or duplicate game IDs are being counted. The pick counter in src/components/bracket/Bracket.tsx uses `Object.keys(picks).length` which may include stale/invalid keys. Fix: either use the TOTAL_GAMES constant for the denominator, or filter picks to only count valid game IDs.~~ **FIXED** — Set TOTAL_GAMES to 63 and filtered out `ff-play-*` keys from pick count.

- [2026-03-14 23:23] ~~**2025 bracket missing First Four data**: The 2025 tournament bracket_data on the server only has 64 teams. It needs to be updated to include the First Four matchups and their results. The 2025 First Four games were: American vs Mt. St. Mary's (16-seed East, American won), Alabama St. vs SIUE (16-seed South, Alabama St. won), San Diego St. vs North Carolina (11-seed South, San Diego St. won), VCU vs Drake (11-seed East/West, VCU won). When implementing First Four support, update the 2025 tournament bracket_data on the server DB to include these. Use: `ssh -i ~/.ssh/vps1.priv root@5.78.132.57` to access the server and update via node + better-sqlite3 at /var/www/MarchMadness/data/marchmadness.db.~~

- [2026-03-14 23:25] ~~**Confirm dialog shows "—" for all Final Four picks**: The save confirmation dialog shows the champion correctly but all four Final Four slots show "—" even though picks were made. The dialog is likely looking up the wrong game IDs for the Elite 8 winners (which are the Final Four teams). Check the confirmation dialog component — it probably reads picks like `picks["East-3-0"]` for the E8 winner but the region names in the picks might not match (e.g. case sensitivity, or using region index instead of name). Also the 63/67 count bug appears here too.~~ **FIXED** — Removed `.toLowerCase()` from region name lookup in confirm dialog. Game IDs use original case (e.g. `East-3-0`).

- [2026-03-14 23:33] **Homepage loads**: 
**********************************************************************************************************
* Authentication Failed With Invalid Credentials Configuration                                           *
*                                                                                                        *
* There are two options for authenticating with Nova Act:                                                *
* (1) Nova Act Free Version with API keys or (2) Nova Act AWS Service with AWS credentials.              *
*                                                                                                        *
* To use (1) Nova Act Free Version, set the NOVA_ACT_API_KEY environment variable                        *
* or pass in explicitly using NovaAct(nova_act_api_key="<YOUR KEY HERE>", ...)                           *
* To generate an API Key go to https://nova.amazon.com/act?tab=dev_tools                                 *
*                                                                                                        *
* To use (2) Nova Act AWS Service, you must use a Workflow construct. For example:                       *
*                                                                                                        *
* @workflow(workflow_definition_name="<your-workflow-name>", model_id="nova-act-latest")                 *
* def explore_destinations():                                                                            *
*     with NovaAct(starting_page="https://nova.amazon.com/act/gym/next-dot/search") as nova:             *
*         nova.act("Find flights from Boston to Wolf on Feb 22nd")                                       *
*                                                                                                        *
* To create a workflow definition name, use the Nova Act CLI or go to                                    *
* https://docs.aws.amazon.com/nova-act/latest/userguide/step-2-develop-locally.html#develop-with-aws-iam *
*                                                                                                        *
* Please configure one or the other in order to run your workflow.                                       *
**********************************************************************************************************

- [2026-03-14 23:33] **Login form visible**: 
**********************************************************************************************************
* Authentication Failed With Invalid Credentials Configuration                                           *
*                                                                                                        *
* There are two options for authenticating with Nova Act:                                                *
* (1) Nova Act Free Version with API keys or (2) Nova Act AWS Service with AWS credentials.              *
*                                                                                                        *
* To use (1) Nova Act Free Version, set the NOVA_ACT_API_KEY environment variable                        *
* or pass in explicitly using NovaAct(nova_act_api_key="<YOUR KEY HERE>", ...)                           *
* To generate an API Key go to https://nova.amazon.com/act?tab=dev_tools                                 *
*                                                                                                        *
* To use (2) Nova Act AWS Service, you must use a Workflow construct. For example:                       *
*                                                                                                        *
* @workflow(workflow_definition_name="<your-workflow-name>", model_id="nova-act-latest")                 *
* def explore_destinations():                                                                            *
*     with NovaAct(starting_page="https://nova.amazon.com/act/gym/next-dot/search") as nova:             *
*         nova.act("Find flights from Boston to Wolf on Feb 22nd")                                       *
*                                                                                                        *
* To create a workflow definition name, use the Nova Act CLI or go to                                    *
* https://docs.aws.amazon.com/nova-act/latest/userguide/step-2-develop-locally.html#develop-with-aws-iam *
*                                                                                                        *
* Please configure one or the other in order to run your workflow.                                       *
**********************************************************************************************************

- [2026-03-14 23:33] **Register/Login flow**: 
**********************************************************************************************************
* Authentication Failed With Invalid Credentials Configuration                                           *
*                                                                                                        *
* There are two options for authenticating with Nova Act:                                                *
* (1) Nova Act Free Version with API keys or (2) Nova Act AWS Service with AWS credentials.              *
*                                                                                                        *
* To use (1) Nova Act Free Version, set the NOVA_ACT_API_KEY environment variable                        *
* or pass in explicitly using NovaAct(nova_act_api_key="<YOUR KEY HERE>", ...)                           *
* To generate an API Key go to https://nova.amazon.com/act?tab=dev_tools                                 *
*                                                                                                        *
* To use (2) Nova Act AWS Service, you must use a Workflow construct. For example:                       *
*                                                                                                        *
* @workflow(workflow_definition_name="<your-workflow-name>", model_id="nova-act-latest")                 *
* def explore_destinations():                                                                            *
*     with NovaAct(starting_page="https://nova.amazon.com/act/gym/next-dot/search") as nova:             *
*         nova.act("Find flights from Boston to Wolf on Feb 22nd")                                       *
*                                                                                                        *
* To create a workflow definition name, use the Nova Act CLI or go to                                    *
* https://docs.aws.amazon.com/nova-act/latest/userguide/step-2-develop-locally.html#develop-with-aws-iam *
*                                                                                                        *
* Please configure one or the other in order to run your workflow.                                       *
**********************************************************************************************************

- [2026-03-14 23:33] **Bracket page loads with teams**: 
**********************************************************************************************************
* Authentication Failed With Invalid Credentials Configuration                                           *
*                                                                                                        *
* There are two options for authenticating with Nova Act:                                                *
* (1) Nova Act Free Version with API keys or (2) Nova Act AWS Service with AWS credentials.              *
*                                                                                                        *
* To use (1) Nova Act Free Version, set the NOVA_ACT_API_KEY environment variable                        *
* or pass in explicitly using NovaAct(nova_act_api_key="<YOUR KEY HERE>", ...)                           *
* To generate an API Key go to https://nova.amazon.com/act?tab=dev_tools                                 *
*                                                                                                        *
* To use (2) Nova Act AWS Service, you must use a Workflow construct. For example:                       *
*                                                                                                        *
* @workflow(workflow_definition_name="<your-workflow-name>", model_id="nova-act-latest")                 *
* def explore_destinations():                                                                            *
*     with NovaAct(starting_page="https://nova.amazon.com/act/gym/next-dot/search") as nova:             *
*         nova.act("Find flights from Boston to Wolf on Feb 22nd")                                       *
*                                                                                                        *
* To create a workflow definition name, use the Nova Act CLI or go to                                    *
* https://docs.aws.amazon.com/nova-act/latest/userguide/step-2-develop-locally.html#develop-with-aws-iam *
*                                                                                                        *
* Please configure one or the other in order to run your workflow.                                       *
**********************************************************************************************************

- [2026-03-14 23:33] **Leaderboard page loads**: 
**********************************************************************************************************
* Authentication Failed With Invalid Credentials Configuration                                           *
*                                                                                                        *
* There are two options for authenticating with Nova Act:                                                *
* (1) Nova Act Free Version with API keys or (2) Nova Act AWS Service with AWS credentials.              *
*                                                                                                        *
* To use (1) Nova Act Free Version, set the NOVA_ACT_API_KEY environment variable                        *
* or pass in explicitly using NovaAct(nova_act_api_key="<YOUR KEY HERE>", ...)                           *
* To generate an API Key go to https://nova.amazon.com/act?tab=dev_tools                                 *
*                                                                                                        *
* To use (2) Nova Act AWS Service, you must use a Workflow construct. For example:                       *
*                                                                                                        *
* @workflow(workflow_definition_name="<your-workflow-name>", model_id="nova-act-latest")                 *
* def explore_destinations():                                                                            *
*     with NovaAct(starting_page="https://nova.amazon.com/act/gym/next-dot/search") as nova:             *
*         nova.act("Find flights from Boston to Wolf on Feb 22nd")                                       *
*                                                                                                        *
* To create a workflow definition name, use the Nova Act CLI or go to                                    *
* https://docs.aws.amazon.com/nova-act/latest/userguide/step-2-develop-locally.html#develop-with-aws-iam *
*                                                                                                        *
* Please configure one or the other in order to run your workflow.                                       *
**********************************************************************************************************

- [2026-03-14 23:33] **Groups page loads**: 
**********************************************************************************************************
* Authentication Failed With Invalid Credentials Configuration                                           *
*                                                                                                        *
* There are two options for authenticating with Nova Act:                                                *
* (1) Nova Act Free Version with API keys or (2) Nova Act AWS Service with AWS credentials.              *
*                                                                                                        *
* To use (1) Nova Act Free Version, set the NOVA_ACT_API_KEY environment variable                        *
* or pass in explicitly using NovaAct(nova_act_api_key="<YOUR KEY HERE>", ...)                           *
* To generate an API Key go to https://nova.amazon.com/act?tab=dev_tools                                 *
*                                                                                                        *
* To use (2) Nova Act AWS Service, you must use a Workflow construct. For example:                       *
*                                                                                                        *
* @workflow(workflow_definition_name="<your-workflow-name>", model_id="nova-act-latest")                 *
* def explore_destinations():                                                                            *
*     with NovaAct(starting_page="https://nova.amazon.com/act/gym/next-dot/search") as nova:             *
*         nova.act("Find flights from Boston to Wolf on Feb 22nd")                                       *
*                                                                                                        *
* To create a workflow definition name, use the Nova Act CLI or go to                                    *
* https://docs.aws.amazon.com/nova-act/latest/userguide/step-2-develop-locally.html#develop-with-aws-iam *
*                                                                                                        *
* Please configure one or the other in order to run your workflow.                                       *
**********************************************************************************************************

- [2026-03-14 23:33] **Championship pick highlighted prominently**: 
**********************************************************************************************************
* Authentication Failed With Invalid Credentials Configuration                                           *
*                                                                                                        *
* There are two options for authenticating with Nova Act:                                                *
* (1) Nova Act Free Version with API keys or (2) Nova Act AWS Service with AWS credentials.              *
*                                                                                                        *
* To use (1) Nova Act Free Version, set the NOVA_ACT_API_KEY environment variable                        *
* or pass in explicitly using NovaAct(nova_act_api_key="<YOUR KEY HERE>", ...)                           *
* To generate an API Key go to https://nova.amazon.com/act?tab=dev_tools                                 *
*                                                                                                        *
* To use (2) Nova Act AWS Service, you must use a Workflow construct. For example:                       *
*                                                                                                        *
* @workflow(workflow_definition_name="<your-workflow-name>", model_id="nova-act-latest")                 *
* def explore_destinations():                                                                            *
*     with NovaAct(starting_page="https://nova.amazon.com/act/gym/next-dot/search") as nova:             *
*         nova.act("Find flights from Boston to Wolf on Feb 22nd")                                       *
*                                                                                                        *
* To create a workflow definition name, use the Nova Act CLI or go to                                    *
* https://docs.aws.amazon.com/nova-act/latest/userguide/step-2-develop-locally.html#develop-with-aws-iam *
*                                                                                                        *
* Please configure one or the other in order to run your workflow.                                       *
**********************************************************************************************************

- [2026-03-14 23:33] **Autofill buttons visible on bracket**: 
**********************************************************************************************************
* Authentication Failed With Invalid Credentials Configuration                                           *
*                                                                                                        *
* There are two options for authenticating with Nova Act:                                                *
* (1) Nova Act Free Version with API keys or (2) Nova Act AWS Service with AWS credentials.              *
*                                                                                                        *
* To use (1) Nova Act Free Version, set the NOVA_ACT_API_KEY environment variable                        *
* or pass in explicitly using NovaAct(nova_act_api_key="<YOUR KEY HERE>", ...)                           *
* To generate an API Key go to https://nova.amazon.com/act?tab=dev_tools                                 *
*                                                                                                        *
* To use (2) Nova Act AWS Service, you must use a Workflow construct. For example:                       *
*                                                                                                        *
* @workflow(workflow_definition_name="<your-workflow-name>", model_id="nova-act-latest")                 *
* def explore_destinations():                                                                            *
*     with NovaAct(starting_page="https://nova.amazon.com/act/gym/next-dot/search") as nova:             *
*         nova.act("Find flights from Boston to Wolf on Feb 22nd")                                       *
*                                                                                                        *
* To create a workflow definition name, use the Nova Act CLI or go to                                    *
* https://docs.aws.amazon.com/nova-act/latest/userguide/step-2-develop-locally.html#develop-with-aws-iam *
*                                                                                                        *
* Please configure one or the other in order to run your workflow.                                       *
**********************************************************************************************************

- [2026-03-14 23:33] **Chalk autofill fills all 63 picks**: 
**********************************************************************************************************
* Authentication Failed With Invalid Credentials Configuration                                           *
*                                                                                                        *
* There are two options for authenticating with Nova Act:                                                *
* (1) Nova Act Free Version with API keys or (2) Nova Act AWS Service with AWS credentials.              *
*                                                                                                        *
* To use (1) Nova Act Free Version, set the NOVA_ACT_API_KEY environment variable                        *
* or pass in explicitly using NovaAct(nova_act_api_key="<YOUR KEY HERE>", ...)                           *
* To generate an API Key go to https://nova.amazon.com/act?tab=dev_tools                                 *
*                                                                                                        *
* To use (2) Nova Act AWS Service, you must use a Workflow construct. For example:                       *
*                                                                                                        *
* @workflow(workflow_definition_name="<your-workflow-name>", model_id="nova-act-latest")                 *
* def explore_destinations():                                                                            *
*     with NovaAct(starting_page="https://nova.amazon.com/act/gym/next-dot/search") as nova:             *
*         nova.act("Find flights from Boston to Wolf on Feb 22nd")                                       *
*                                                                                                        *
* To create a workflow definition name, use the Nova Act CLI or go to                                    *
* https://docs.aws.amazon.com/nova-act/latest/userguide/step-2-develop-locally.html#develop-with-aws-iam *
*                                                                                                        *
* Please configure one or the other in order to run your workflow.                                       *
**********************************************************************************************************

- [2026-03-14 23:33] **Tiebreaker input visible on bracket page**: 
**********************************************************************************************************
* Authentication Failed With Invalid Credentials Configuration                                           *
*                                                                                                        *
* There are two options for authenticating with Nova Act:                                                *
* (1) Nova Act Free Version with API keys or (2) Nova Act AWS Service with AWS credentials.              *
*                                                                                                        *
* To use (1) Nova Act Free Version, set the NOVA_ACT_API_KEY environment variable                        *
* or pass in explicitly using NovaAct(nova_act_api_key="<YOUR KEY HERE>", ...)                           *
* To generate an API Key go to https://nova.amazon.com/act?tab=dev_tools                                 *
*                                                                                                        *
* To use (2) Nova Act AWS Service, you must use a Workflow construct. For example:                       *
*                                                                                                        *
* @workflow(workflow_definition_name="<your-workflow-name>", model_id="nova-act-latest")                 *
* def explore_destinations():                                                                            *
*     with NovaAct(starting_page="https://nova.amazon.com/act/gym/next-dot/search") as nova:             *
*         nova.act("Find flights from Boston to Wolf on Feb 22nd")                                       *
*                                                                                                        *
* To create a workflow definition name, use the Nova Act CLI or go to                                    *
* https://docs.aws.amazon.com/nova-act/latest/userguide/step-2-develop-locally.html#develop-with-aws-iam *
*                                                                                                        *
* Please configure one or the other in order to run your workflow.                                       *
**********************************************************************************************************

- [2026-03-14 23:33] **Tiebreaker column on leaderboard**: 
**********************************************************************************************************
* Authentication Failed With Invalid Credentials Configuration                                           *
*                                                                                                        *
* There are two options for authenticating with Nova Act:                                                *
* (1) Nova Act Free Version with API keys or (2) Nova Act AWS Service with AWS credentials.              *
*                                                                                                        *
* To use (1) Nova Act Free Version, set the NOVA_ACT_API_KEY environment variable                        *
* or pass in explicitly using NovaAct(nova_act_api_key="<YOUR KEY HERE>", ...)                           *
* To generate an API Key go to https://nova.amazon.com/act?tab=dev_tools                                 *
*                                                                                                        *
* To use (2) Nova Act AWS Service, you must use a Workflow construct. For example:                       *
*                                                                                                        *
* @workflow(workflow_definition_name="<your-workflow-name>", model_id="nova-act-latest")                 *
* def explore_destinations():                                                                            *
*     with NovaAct(starting_page="https://nova.amazon.com/act/gym/next-dot/search") as nova:             *
*         nova.act("Find flights from Boston to Wolf on Feb 22nd")                                       *
*                                                                                                        *
* To create a workflow definition name, use the Nova Act CLI or go to                                    *
* https://docs.aws.amazon.com/nova-act/latest/userguide/step-2-develop-locally.html#develop-with-aws-iam *
*                                                                                                        *
* Please configure one or the other in order to run your workflow.                                       *
**********************************************************************************************************

- [2026-03-14 23:33] **Save confirmation dialog shows key picks summary**: 
**********************************************************************************************************
* Authentication Failed With Invalid Credentials Configuration                                           *
*                                                                                                        *
* There are two options for authenticating with Nova Act:                                                *
* (1) Nova Act Free Version with API keys or (2) Nova Act AWS Service with AWS credentials.              *
*                                                                                                        *
* To use (1) Nova Act Free Version, set the NOVA_ACT_API_KEY environment variable                        *
* or pass in explicitly using NovaAct(nova_act_api_key="<YOUR KEY HERE>", ...)                           *
* To generate an API Key go to https://nova.amazon.com/act?tab=dev_tools                                 *
*                                                                                                        *
* To use (2) Nova Act AWS Service, you must use a Workflow construct. For example:                       *
*                                                                                                        *
* @workflow(workflow_definition_name="<your-workflow-name>", model_id="nova-act-latest")                 *
* def explore_destinations():                                                                            *
*     with NovaAct(starting_page="https://nova.amazon.com/act/gym/next-dot/search") as nova:             *
*         nova.act("Find flights from Boston to Wolf on Feb 22nd")                                       *
*                                                                                                        *
* To create a workflow definition name, use the Nova Act CLI or go to                                    *
* https://docs.aws.amazon.com/nova-act/latest/userguide/step-2-develop-locally.html#develop-with-aws-iam *
*                                                                                                        *
* Please configure one or the other in order to run your workflow.                                       *
**********************************************************************************************************

- [2026-03-14 23:33] **Save bracket completes without error**: 
**********************************************************************************************************
* Authentication Failed With Invalid Credentials Configuration                                           *
*                                                                                                        *
* There are two options for authenticating with Nova Act:                                                *
* (1) Nova Act Free Version with API keys or (2) Nova Act AWS Service with AWS credentials.              *
*                                                                                                        *
* To use (1) Nova Act Free Version, set the NOVA_ACT_API_KEY environment variable                        *
* or pass in explicitly using NovaAct(nova_act_api_key="<YOUR KEY HERE>", ...)                           *
* To generate an API Key go to https://nova.amazon.com/act?tab=dev_tools                                 *
*                                                                                                        *
* To use (2) Nova Act AWS Service, you must use a Workflow construct. For example:                       *
*                                                                                                        *
* @workflow(workflow_definition_name="<your-workflow-name>", model_id="nova-act-latest")                 *
* def explore_destinations():                                                                            *
*     with NovaAct(starting_page="https://nova.amazon.com/act/gym/next-dot/search") as nova:             *
*         nova.act("Find flights from Boston to Wolf on Feb 22nd")                                       *
*                                                                                                        *
* To create a workflow definition name, use the Nova Act CLI or go to                                    *
* https://docs.aws.amazon.com/nova-act/latest/userguide/step-2-develop-locally.html#develop-with-aws-iam *
*                                                                                                        *
* Please configure one or the other in order to run your workflow.                                       *
**********************************************************************************************************

- [2026-03-14 23:33] **First Four section visible on bracket page**: 
**********************************************************************************************************
* Authentication Failed With Invalid Credentials Configuration                                           *
*                                                                                                        *
* There are two options for authenticating with Nova Act:                                                *
* (1) Nova Act Free Version with API keys or (2) Nova Act AWS Service with AWS credentials.              *
*                                                                                                        *
* To use (1) Nova Act Free Version, set the NOVA_ACT_API_KEY environment variable                        *
* or pass in explicitly using NovaAct(nova_act_api_key="<YOUR KEY HERE>", ...)                           *
* To generate an API Key go to https://nova.amazon.com/act?tab=dev_tools                                 *
*                                                                                                        *
* To use (2) Nova Act AWS Service, you must use a Workflow construct. For example:                       *
*                                                                                                        *
* @workflow(workflow_definition_name="<your-workflow-name>", model_id="nova-act-latest")                 *
* def explore_destinations():                                                                            *
*     with NovaAct(starting_page="https://nova.amazon.com/act/gym/next-dot/search") as nova:             *
*         nova.act("Find flights from Boston to Wolf on Feb 22nd")                                       *
*                                                                                                        *
* To create a workflow definition name, use the Nova Act CLI or go to                                    *
* https://docs.aws.amazon.com/nova-act/latest/userguide/step-2-develop-locally.html#develop-with-aws-iam *
*                                                                                                        *
* Please configure one or the other in order to run your workflow.                                       *
**********************************************************************************************************

- [2026-03-14 23:33] **Sync Results from ESPN button on admin page**: 
**********************************************************************************************************
* Authentication Failed With Invalid Credentials Configuration                                           *
*                                                                                                        *
* There are two options for authenticating with Nova Act:                                                *
* (1) Nova Act Free Version with API keys or (2) Nova Act AWS Service with AWS credentials.              *
*                                                                                                        *
* To use (1) Nova Act Free Version, set the NOVA_ACT_API_KEY environment variable                        *
* or pass in explicitly using NovaAct(nova_act_api_key="<YOUR KEY HERE>", ...)                           *
* To generate an API Key go to https://nova.amazon.com/act?tab=dev_tools                                 *
*                                                                                                        *
* To use (2) Nova Act AWS Service, you must use a Workflow construct. For example:                       *
*                                                                                                        *
* @workflow(workflow_definition_name="<your-workflow-name>", model_id="nova-act-latest")                 *
* def explore_destinations():                                                                            *
*     with NovaAct(starting_page="https://nova.amazon.com/act/gym/next-dot/search") as nova:             *
*         nova.act("Find flights from Boston to Wolf on Feb 22nd")                                       *
*                                                                                                        *
* To create a workflow definition name, use the Nova Act CLI or go to                                    *
* https://docs.aws.amazon.com/nova-act/latest/userguide/step-2-develop-locally.html#develop-with-aws-iam *
*                                                                                                        *
* Please configure one or the other in order to run your workflow.                                       *
**********************************************************************************************************

- [2026-03-14 23:35] **Bracket PNG export looks terrible**: The bracket export renders with dark theme colors (light text, dark backgrounds) but downloads as a PNG that displays on white/light backgrounds, making text invisible or hard to read. Fix: either render the export with a forced light color scheme (white background, dark text) regardless of the app theme, or include the dark background in the exported image. The app currently only has dark mode (hardcoded in ThemeRegistry.tsx). The export should work well when shared/printed regardless of theme.
