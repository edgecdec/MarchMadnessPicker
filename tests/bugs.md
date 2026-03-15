# Bugs — Fix these BEFORE working on any PLAN.md tasks

- [2026-03-14 23:10] **Deploy race condition**: Concurrent deploys can wipe .next while another build is running. Fix: add `flock /tmp/marchmadness-deploy.lock` to deploy_webhook.sh to prevent concurrent deploys.

- [2026-03-14 23:18] **FIXED - Creating AND saving brackets fails with 500**: POST /api/picks returns "ON CONFLICT clause does not match any PRIMARY KEY or UNIQUE constraint". The picks table schema was changed for multiple brackets (removed UNIQUE(user_id, tournament_id)) but the INSERT in src/app/api/picks/route.ts still uses `ON CONFLICT(user_id, tournament_id) DO UPDATE`. Fix: for new brackets just INSERT, for updating existing brackets UPDATE WHERE id = bracket_id. **RESOLVED**: DB migration in db.ts already recreated the picks table with UNIQUE(user_id, tournament_id, bracket_name), and the route uses ON CONFLICT(user_id, tournament_id, bracket_name) which matches.

- [2026-03-14 23:22] **FIXED - Pick counter shows wrong total**: Shows "63/67 picks made" — the denominator should always be 63 (TOTAL_GAMES constant). The numerator `Object.keys(picks).length` is counting stale/invalid keys. Fix: use TOTAL_GAMES for denominator, filter picks to only count valid game IDs for numerator. **RESOLVED**: Added `validGameIds` useMemo set that generates all 63 valid game IDs from regions + Final Four, and filters picks against it.

- [2026-03-14 23:25] **FIXED - Confirm dialog shows "—" for all Final Four picks**: The save confirmation shows champion correctly but all four Final Four slots show "—". The dialog is looking up wrong game IDs for Elite 8 winners. Check the game ID format it expects vs what the bracket actually stores. **RESOLVED**: Fixed in commit 140c621 — dialog was using `r.name.toLowerCase()` (e.g. "east-3-0") but game IDs use original case (e.g. "East-3-0"). Changed to `r.name`.

- [2026-03-14 23:35] **FIXED - Bracket PNG export unreadable**: Export has white background but uses dark theme text colors (light grey text on white). Team names and seeds are nearly invisible. Fix: force dark text colors (black/dark grey) when rendering the export, regardless of app theme. **RESOLVED**: Added `.bracket-export` CSS class that forces `color: #222` on all elements. Export now adds/removes this class during html2canvas render with white background.

- [2026-03-14 23:23] **2025 bracket missing First Four data**: Update the 2025 tournament bracket_data on the server to include First Four matchups. The 2025 First Four: American vs Mt. St. Mary's (16-seed East, American won), Alabama St. vs SIUE (16-seed South, Alabama St. won), San Diego St. vs North Carolina (11-seed South, San Diego St. won), VCU vs Drake (11-seed, VCU won).

NOTE: The Nova Act smoke tests are broken because NOVA_ACT_API_KEY is not set in Ralph's shell. Ignore all Nova Act auth errors — they are NOT real bugs. Do NOT try to fix Nova Act. Focus on the bugs listed above.

- [2026-03-15 01:34] **Homepage loads**: 
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

- [2026-03-15 01:34] **Login form visible**: 
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

- [2026-03-15 01:34] **Register/Login flow**: 
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

- [2026-03-15 01:34] **Bracket page loads with teams**: 
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

- [2026-03-15 01:34] **Leaderboard page loads**: 
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

- [2026-03-15 01:34] **Groups page loads**: 
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

- [2026-03-15 01:34] **Championship pick highlighted prominently**: 
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

- [2026-03-15 01:34] **Autofill buttons visible on bracket**: 
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

- [2026-03-15 01:34] **Chalk autofill fills all 63 picks**: 
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

- [2026-03-15 01:34] **Tiebreaker input visible on bracket page**: 
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

- [2026-03-15 01:34] **Tiebreaker column on leaderboard**: 
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

- [2026-03-15 01:34] **Save confirmation dialog shows key picks summary**: 
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

- [2026-03-15 01:34] **Save bracket completes without error**: 
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

- [2026-03-15 01:34] **First Four section visible on bracket page**: 
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

- [2026-03-15 01:34] **Sync Results from ESPN button on admin page**: 
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

- [2026-03-15 01:34] **Bracket export button visible**: 
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

- [2026-03-15 01:34] **Percentile rank shown on leaderboard**: 
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

- [2026-03-15 01:34] **Best Possible Finish column on leaderboard**: 
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

- [2026-03-15 01:34] **Import Bracket Data section on admin page**: 
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

- [2026-03-15 01:34] **Correct/incorrect color coding on view bracket**: 
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

- [2026-03-15 01:34] **Update Results Data section on admin page**: 
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

- [2026-03-15 01:34] **Compare brackets page loads with selectors**: 
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

- [2026-03-15 01:34] **User profile page loads with groups and brackets**: 
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

- [2026-03-15 01:34] **Theme toggle button visible in navbar**: 
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

- [2026-03-15 01:34] **Group chat section visible on groups page**: 
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

- [2026-03-15 01:34] **Bracket pick animations on click**: 
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

- [2026-03-15 01:34] **Seed matchup stats tooltip on hover**: 
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

- [2026-03-15 01:39] **Homepage loads**: 
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

- [2026-03-15 01:39] **Login form visible**: 
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

- [2026-03-15 01:39] **Register/Login flow**: 
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

- [2026-03-15 01:39] **Bracket page loads with teams**: 
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

- [2026-03-15 01:39] **Leaderboard page loads**: 
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

- [2026-03-15 01:39] **Groups page loads**: 
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

- [2026-03-15 01:39] **Championship pick highlighted prominently**: 
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

- [2026-03-15 01:39] **Autofill buttons visible on bracket**: 
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

- [2026-03-15 01:39] **Chalk autofill fills all 63 picks**: 
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

- [2026-03-15 01:39] **Tiebreaker input visible on bracket page**: 
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

- [2026-03-15 01:39] **Tiebreaker column on leaderboard**: 
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

- [2026-03-15 01:39] **Save confirmation dialog shows key picks summary**: 
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

- [2026-03-15 01:39] **Save bracket completes without error**: 
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

- [2026-03-15 01:39] **First Four section visible on bracket page**: 
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

- [2026-03-15 01:39] **Sync Results from ESPN button on admin page**: 
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

- [2026-03-15 01:39] **Bracket export button visible**: 
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

- [2026-03-15 01:39] **Bracket export CSS forces dark text**: bracket-export class should be in page source

- [2026-03-15 01:39] **Percentile rank shown on leaderboard**: 
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

- [2026-03-15 01:39] **Best Possible Finish column on leaderboard**: 
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

- [2026-03-15 01:39] **Import Bracket Data section on admin page**: 
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

- [2026-03-15 01:39] **Correct/incorrect color coding on view bracket**: 
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

- [2026-03-15 01:39] **Update Results Data section on admin page**: 
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

- [2026-03-15 01:39] **Compare brackets page loads with selectors**: 
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

- [2026-03-15 01:39] **User profile page loads with groups and brackets**: 
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

- [2026-03-15 01:39] **Theme toggle button visible in navbar**: 
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

- [2026-03-15 01:39] **Group chat section visible on groups page**: 
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

- [2026-03-15 01:39] **Bracket pick animations on click**: 
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

- [2026-03-15 01:39] **Seed matchup stats tooltip on hover**: 
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

- [2026-03-15 01:42] **Bracket export CSS forces dark text**: bracket-export class should be in page source

- [2026-03-15 01:48] **Bracket export CSS forces dark text**: bracket-export class should be in page source
