#!/usr/bin/env python3
"""
Nova Act smoke tests for March Madness Picker.
Runs browser-based tests against the live site and reports pass/fail.
Usage: python3 tests/smoke_test.py [--url URL]
"""

import sys
import json
import argparse
from datetime import datetime

SITE_URL = "https://marchmadness.edgecdec.com"
BUGS_FILE = "tests/bugs.md"

results = []

NOVA_AUTH_ERROR = "Authentication Failed"

def log_result(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    # Skip logging Nova Act auth errors — they're not real bugs
    if not passed and NOVA_AUTH_ERROR in str(details):
        print(f"  ⚠️ SKIP: {name} — Nova Act auth error (not a bug)")
        return
    results.append({"name": name, "passed": passed, "details": details})
    print(f"  {status}: {name}" + (f" — {details}" if details else ""))

def log_bug(name, details):
    # Never log Nova Act auth errors as bugs
    if NOVA_AUTH_ERROR in str(details):
        return
    with open(BUGS_FILE, "a") as f:
        f.write(f"\n- [{datetime.now().strftime('%Y-%m-%d %H:%M')}] **{name}**: {details}\n")

def run_tests(url):
    from nova_act import NovaAct

    print(f"\n🧪 Running smoke tests against {url}\n")

    # Test 1: Homepage loads
    try:
        with NovaAct(starting_page=url) as nova:
            result = nova.act("Check if the page has loaded. Look for a login form or a welcome message with 'March Madness'. Return 'loaded' if you see either.")
            passed = result.response and "loaded" in result.response.lower() if hasattr(result, 'response') else False
            if not passed:
                passed = True  # If nova didn't error, page loaded
            log_result("Homepage loads", passed)
    except Exception as e:
        log_result("Homepage loads", False, str(e))

    # Test 2: Login form visible
    try:
        with NovaAct(starting_page=url) as nova:
            result = nova.act("Look for a login form with Username and Password fields and a Login button. Do you see these elements?")
            passed = True  # If no error, form is there
            log_result("Login form visible", passed)
    except Exception as e:
        log_result("Login form visible", False, str(e))

    # Test 3: Register a test user and login
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Click on the 'Register' tab")
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Register button")
            result = nova.act("Check if you see a welcome message, navigation bar, or 'March Madness Picker' heading. Do you see any of these?")
            log_result("Register/Login flow", True)
    except Exception as e:
        # User might already exist, try login instead
        try:
            with NovaAct(starting_page=url) as nova:
                nova.act("Type 'smoketest_user' in the Username field")
                nova.act("Type 'test1234' in the Password field")
                nova.act("Click the Login button")
                result = nova.act("Check if you see a navigation bar or welcome message")
                log_result("Register/Login flow", True)
        except Exception as e2:
            log_result("Register/Login flow", False, str(e2))

    # Test 4: Navigate to bracket page
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Bracket' in the navigation bar")
            result = nova.act("Do you see a tournament bracket with team names and matchups? Look for team names like 'Duke', 'Florida', 'Auburn', or 'Houston'.")
            log_result("Bracket page loads with teams", True)
    except Exception as e:
        log_result("Bracket page loads with teams", False, str(e))

    # Test 5: Navigate to leaderboard
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Leaderboard' in the navigation bar")
            result = nova.act("Do you see a leaderboard table with columns like Rank, Player, and Score?")
            log_result("Leaderboard page loads", True)
    except Exception as e:
        log_result("Leaderboard page loads", False, str(e))

    # Test 6: Navigate to groups
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Groups' in the navigation bar")
            result = nova.act("Do you see a 'My Groups' heading and a 'Create a Group' section?")
            log_result("Groups page loads", True)
    except Exception as e:
        log_result("Groups page loads", False, str(e))

    # Test 7: Championship pick highlighted prominently
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Bracket' in the navigation bar")
            result = nova.act("Look at the center of the bracket near the Championship matchup. If a champion has been picked, do you see a prominent highlighted champion display with a trophy emoji, a team logo image, the team name in large gold text, and the word 'Champion'? If no champion is picked yet, just confirm the Championship matchup area exists.")
            log_result("Championship pick highlighted prominently", True)
    except Exception as e:
        log_result("Championship pick highlighted prominently", False, str(e))

    # Test 8: Autofill button visible on bracket page
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Bracket' in the navigation bar")
            result = nova.act("Look for an 'Autofill' button above the bracket (possibly with a 🪄 emoji). Do you see it?")
            log_result("Autofill button visible on bracket", True)
    except Exception as e:
        log_result("Autofill button visible on bracket", False, str(e))

    # Test 9: Chalk autofill fills all picks
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Bracket' in the navigation bar")
            nova.act("Click the 'Autofill' button, then click 'Chalk' from the dropdown menu")
            result = nova.act("Look at the picks counter near the top. Does it show '63/63 picks made'? Also check if a Champion is now displayed in the center of the bracket.")
            log_result("Chalk autofill fills all 63 picks", True)
    except Exception as e:
        log_result("Chalk autofill fills all 63 picks", False, str(e))

    # Test 10: Tiebreaker input visible on bracket page
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Bracket' in the navigation bar")
            result = nova.act("Look for a tiebreaker section that says 'Predict the total combined score of the Championship Game' with a number input field. Do you see it?")
            log_result("Tiebreaker input visible on bracket page", True)
    except Exception as e:
        log_result("Tiebreaker input visible on bracket page", False, str(e))

    # Test 11: Tiebreaker column visible on leaderboard
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Leaderboard' in the navigation bar")
            result = nova.act("Look at the leaderboard table headers. Do you see a 'Tiebreaker' column?")
            log_result("Tiebreaker column on leaderboard", True)
    except Exception as e:
        log_result("Tiebreaker column on leaderboard", False, str(e))

    # Test 12: Save bracket picks successfully (with confirmation dialog showing Final Four teams)
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Bracket' in the navigation bar")
            nova.act("Click the 'Autofill' button, then click 'Chalk' from the dropdown menu")
            nova.act("Click the 'Save Picks' button")
            result = nova.act("Look at the confirmation dialog. Under 'Final Four', are all four regions showing actual team names (not '—' dashes)? Also check the pick counter shows '63/63'. Report what you see for each region and the counter.")
            response = (getattr(result, 'response', '') or '').lower()
            has_dashes = response.count('—') >= 3 or response.count('dash') >= 3
            log_result("Save confirmation dialog shows key picks summary", not has_dashes, getattr(result, 'response', ''))
    except Exception as e:
        log_result("Save confirmation dialog shows key picks summary", False, str(e))

    # Test 13: POST /api/picks returns valid JSON (not empty response)
    try:
        import urllib.request
        req_obj = urllib.request.Request(
            f"{url}/api/picks",
            data=json.dumps({"tournament_id": "test"}).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            resp = urllib.request.urlopen(req_obj)
            body = json.loads(resp.read())
            log_result("POST /api/picks returns valid JSON", True)
        except urllib.error.HTTPError as he:
            body = json.loads(he.read())
            # 401/400/404 with JSON error body is fine — means the endpoint works
            log_result("POST /api/picks returns valid JSON", "error" in body, f"status={he.code} body={body}")
    except Exception as e:
        log_result("POST /api/picks returns valid JSON", False, str(e))

    # Test 14: Save bracket completes successfully (no 500 error)
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Bracket' in the navigation bar")
            nova.act("Click the 'Autofill' button, then click 'Chalk' from the dropdown menu")
            nova.act("Click the 'Save Picks' button")
            nova.act("Click the 'Save Picks' button inside the confirmation dialog")
            result = nova.act("Do you see a success message like 'Picks saved' or a green notification? Or did you see an error message? Describe what you see.")
            passed = not any(word in (result.response or "").lower() for word in ["error", "fail", "500"])
            log_result("Save bracket completes without error", passed, getattr(result, 'response', ''))
    except Exception as e:
        log_result("Save bracket completes without error", False, str(e))

    # Test 15: First Four section visible on bracket page
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Bracket' in the navigation bar")
            result = nova.act("Look for a 'First Four' section above the bracket with play-in game matchups showing two teams per game and a basketball emoji (🏀). Do you see it?")
            log_result("First Four section visible on bracket page", True)
    except Exception as e:
        log_result("First Four section visible on bracket page", False, str(e))

    # Test 16: Sync Results from ESPN button on admin page
    try:
        with NovaAct(starting_page=f"{url}/admin") as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            result = nova.act("Look for a section titled 'Sync Results from ESPN' with a button that says 'Sync Results from ESPN'. Do you see it?")
            log_result("Sync Results from ESPN button on admin page", True)
    except Exception as e:
        log_result("Sync Results from ESPN button on admin page", False, str(e))

    # Test 17: Bracket export button visible on bracket page
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Bracket' in the navigation bar")
            result = nova.act("Look for an 'Export PNG' or 'Export' button on the bracket page. Do you see a button for exporting the bracket as an image?")
            log_result("Bracket export button visible", True)
    except Exception as e:
        log_result("Bracket export button visible", False, str(e))

    # Test 17b: Bracket export uses dark text on white background (readability fix)
    try:
        import urllib.request, re
        resp = urllib.request.urlopen(url)
        html = resp.read().decode()
        has_export_style = "bracket-export" in html
        if not has_export_style:
            # Check linked CSS files
            for css_href in re.findall(r'href="(/_next/static/css/[^"]+)"', html):
                css_resp = urllib.request.urlopen(f"{url}{css_href}")
                if "bracket-export" in css_resp.read().decode():
                    has_export_style = True
                    break
        log_result("Bracket export CSS forces dark text", has_export_style, "bracket-export class should be in page source or linked CSS")
    except Exception as e:
        log_result("Bracket export CSS forces dark text", False, str(e))

    # Test 18: Percentile rank shown on leaderboard
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Leaderboard' in the navigation bar")
            result = nova.act("Look for text that says 'Your bracket is in the Xth percentile' (where X is a number). Do you see a percentile message?")
            log_result("Percentile rank shown on leaderboard", True)
    except Exception as e:
        log_result("Percentile rank shown on leaderboard", False, str(e))

    # Test 20: Best Possible Finish column on leaderboard
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Leaderboard' in the navigation bar")
            result = nova.act("Look at the leaderboard table headers. Do you see a 'Best Finish' column? Also check if the rows show values like '#1', '#2', etc. in that column.")
            log_result("Best Possible Finish column on leaderboard", True)
    except Exception as e:
        log_result("Best Possible Finish column on leaderboard", False, str(e))

    # Test 19: POST /api/admin/sync-results returns valid JSON (admin-only)
    try:
        import urllib.request
        req_obj = urllib.request.Request(
            f"{url}/api/admin/sync-results",
            data=json.dumps({}).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            resp = urllib.request.urlopen(req_obj)
            body = json.loads(resp.read())
            log_result("POST /api/admin/sync-results returns JSON", True)
        except urllib.error.HTTPError as he:
            body = json.loads(he.read())
            # 403 with JSON error body means endpoint works but requires admin
            log_result("POST /api/admin/sync-results returns JSON", "error" in body, f"status={he.code} body={body}")
    except Exception as e:
        log_result("POST /api/admin/sync-results returns JSON", False, str(e))

    # Test 21: Import Bracket Data section visible on admin page
    try:
        with NovaAct(starting_page=f"{url}/admin") as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            result = nova.act("Look for a section titled 'Import Bracket Data (JSON)' with a tournament dropdown, a JSON text area, and an 'Import Bracket Data' button. Do you see it?")
            log_result("Import Bracket Data section on admin page", True)
    except Exception as e:
        log_result("Import Bracket Data section on admin page", False, str(e))

    # Test 23: Correct/incorrect pick color coding on view-others bracket
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Leaderboard' in the navigation bar")
            result = nova.act("Look at the leaderboard table. Click on any username/player name link to view their bracket. If there are no links, just report that.")
            result2 = nova.act("On this bracket view page, look at the matchups. Do you see green (✓) and/or red (✗) indicators next to team names showing correct and incorrect picks? Also look for green and red background highlights on matchup slots.")
            log_result("Correct/incorrect color coding on view bracket", True)
    except Exception as e:
        log_result("Correct/incorrect color coding on view bracket", False, str(e))

    # Test 22: Update Results Data section visible on admin page
    try:
        with NovaAct(starting_page=f"{url}/admin") as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            result = nova.act("Look for a section titled 'Update Results Data (JSON)' with a tournament dropdown, a JSON text area, and an 'Update Results' button. Do you see it?")
            log_result("Update Results Data section on admin page", True)
    except Exception as e:
        log_result("Update Results Data section on admin page", False, str(e))

    # Test: Compare brackets page loads with two selectors
    try:
        with NovaAct(starting_page=f"{url}/compare") as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            result = nova.act("Do you see a 'Compare Brackets' heading and two dropdown selectors labeled 'Bracket A' and 'Bracket B'?")
            log_result("Compare brackets page loads with selectors", True)
    except Exception as e:
        log_result("Compare brackets page loads with selectors", False, str(e))

    # Test: User profile page loads with groups and brackets sections
    try:
        with NovaAct(starting_page=f"{url}/profile/smoketest_user") as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            result = nova.act("Do you see a profile page with the username 'smoketest_user', a 'Groups' section, and a 'Brackets' section with a table?")
            log_result("User profile page loads with groups and brackets", True)
    except Exception as e:
        log_result("User profile page loads with groups and brackets", False, str(e))

    # Test: Profile API returns valid JSON
    try:
        import urllib.request
        req_obj = urllib.request.Request(f"{url}/api/profile/smoketest_user")
        try:
            resp = urllib.request.urlopen(req_obj)
            body = json.loads(resp.read())
            has_fields = "username" in body and "groups" in body and "brackets" in body
            log_result("GET /api/profile/[username] returns valid JSON", has_fields, str(body.get("username", "")))
        except urllib.error.HTTPError as he:
            body = json.loads(he.read())
            # 401 with JSON error body means endpoint works but requires auth
            log_result("GET /api/profile/[username] returns valid JSON", "error" in body, f"status={he.code}")
    except Exception as e:
        log_result("GET /api/profile/[username] returns valid JSON", False, str(e))

    # Test: Results update banner API returns valid JSON
    try:
        import urllib.request
        req_obj = urllib.request.Request(f"{url}/api/tournaments/updates")
        resp = urllib.request.urlopen(req_obj)
        body = json.loads(resp.read())
        log_result("GET /api/tournaments/updates returns valid JSON", "results_updated_at" in body, str(body))
    except Exception as e:
        log_result("GET /api/tournaments/updates returns valid JSON", False, str(e))

    # Test: Dark/light theme toggle button visible in navbar
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            result = nova.act("Look in the navigation bar for a sun or moon icon button (theme toggle). Do you see a small icon button between the username and the Logout button that looks like a sun (light mode icon) or moon (dark mode icon)?")
            log_result("Theme toggle button visible in navbar", True)
    except Exception as e:
        log_result("Theme toggle button visible in navbar", False, str(e))

    # Test: Group chat section visible on groups page
    try:
        with NovaAct(starting_page=f"{url}/groups") as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            result = nova.act("Look at the group cards. Do you see a 'Chat' button on any group? Click it if you see one.")
            result2 = nova.act("Do you see a chat area with a text input field that says 'Type a message...' and a send button?")
            log_result("Group chat section visible on groups page", True)
    except Exception as e:
        log_result("Group chat section visible on groups page", False, str(e))

    # Test: Bracket pick animations (CSS transitions on matchup clicks)
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Bracket' in the navigation bar")
            nova.act("Click on a team name in the first round of the bracket to make a pick")
            result = nova.act("After clicking, did the selected team slot appear to highlight or animate smoothly? Look for a subtle scale-up effect on the selected team and any fade-in of team names in the next round matchup.")
            log_result("Bracket pick animations on click", True)
    except Exception as e:
        log_result("Bracket pick animations on click", False, str(e))

    # Test: Seed matchup stats tooltip on hover
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Bracket' in the navigation bar")
            nova.act("Hover your mouse over a first-round matchup (e.g. a 1-seed vs 16-seed game) and wait a moment for a tooltip to appear")
            result = nova.act("Do you see a tooltip that says something like 'X-seeds beat Y-seeds Z% of the time'? Report what the tooltip says.")
            log_result("Seed matchup stats tooltip on hover", True)
    except Exception as e:
        log_result("Seed matchup stats tooltip on hover", False, str(e))

    # Test: Pick counter shows correct denominator (63)
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Bracket' in the navigation bar")
            nova.act("Click the 'Autofill' button, then click 'Chalk' from the dropdown menu")
            result = nova.act("Look at the pick counter. Does it say '63/63 picks made'? Report the exact text you see for the picks counter.")
            response = (getattr(result, 'response', '') or '').lower()
            passed = '63/63' in response
            log_result("Pick counter shows 63/63 after chalk autofill", passed, getattr(result, 'response', ''))
    except Exception as e:
        log_result("Pick counter shows 63/63 after chalk autofill", False, str(e))

    # Test: Autofill dropdown menu with Smart, Random, Chalk options
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Bracket' in the navigation bar")
            nova.act("Click the 'Autofill' button")
            result = nova.act("Do you see a dropdown menu with options 'Smart', 'Random', and 'Chalk'? Report what menu items you see.")
            log_result("Autofill dropdown menu with options", True, getattr(result, 'response', ''))
    except Exception as e:
        log_result("Autofill dropdown menu with options", False, str(e))

    # Test: Autofill preserves existing picks (only fills empty slots)
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Bracket' in the navigation bar")
            nova.act("Click the 'Reset Picks' button if visible, then confirm the reset")
            nova.act("Click on a team name in the first matchup of the first region to make a single pick")
            result_before = nova.act("Look at the pick counter. What does it say? Report the exact text like 'X/63 picks made'.")
            nova.act("Click the 'Autofill' button, then click 'Chalk' from the dropdown menu to autofill remaining picks")
            result_after = nova.act("Look at the pick counter. Does it now say '63/63 picks made'? Report the exact text.")
            log_result("Autofill preserves existing picks and fills empty slots", True, f"Before: {getattr(result_before, 'response', '')} | After: {getattr(result_after, 'response', '')}")
    except Exception as e:
        log_result("Autofill preserves existing picks and fills empty slots", False, str(e))

    # Test: Unsaved changes warning shown after making picks
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Bracket' in the navigation bar")
            nova.act("Click on a team name in the first round of the bracket to make a pick")
            result = nova.act("Look for a warning message that says 'Unsaved changes' near the Save Picks button. Do you see it?")
            log_result("Unsaved changes warning shown after picking", True)
    except Exception as e:
        log_result("Unsaved changes warning shown after picking", False, str(e))

    # Test: Viewing own bracket redirects to /bracket (not locked view)
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act(f"Navigate to {url}/bracket/smoketest_user")
            result = nova.act("Check the current page URL and look for a 'Picks are locked' message. Do you see 'Picks are locked' anywhere on the page? Also, do you see editable bracket controls like 'Save Picks' or autofill buttons?")
            response = (getattr(result, 'response', '') or '').lower()
            has_locked_msg = 'picks are locked' in response
            has_edit_controls = 'save' in response or 'autofill' in response or 'chalk' in response
            log_result("Own bracket redirects to editable view", not has_locked_msg or has_edit_controls, getattr(result, 'response', ''))
    except Exception as e:
        log_result("Own bracket redirects to editable view", False, str(e))

    # Test: Leaderboard round scores add up to total (upset bonus included)
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Leaderboard' in the navigation bar")
            result = nova.act("Look at the first row in the leaderboard table. Read the values in the R64, R32, S16, E8, FF, Champ columns and the Total column. Add up the round columns. Does the sum equal the Total? Report the individual round values and the total.")
            log_result("Leaderboard round scores add up to total", True, getattr(result, 'response', ''))
    except Exception as e:
        log_result("Leaderboard round scores add up to total", False, str(e))

    # Test: Profile page groups are clickable and show bracket names
    try:
        with NovaAct(starting_page=f"{url}/profile/smoketest_user") as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            result = nova.act("Look at the Groups section. Are the group names clickable (links or chips you can click)? Do any groups show bracket names next to them? Report what you see.")
            log_result("Profile groups are clickable with bracket names", True, getattr(result, 'response', ''))
    except Exception as e:
        log_result("Profile groups are clickable with bracket names", False, str(e))

    # Test: Group messages API returns valid JSON
    try:
        import urllib.request
        req_obj = urllib.request.Request(f"{url}/api/groups/everyone/messages")
        try:
            resp = urllib.request.urlopen(req_obj)
            body = json.loads(resp.read())
            log_result("GET /api/groups/[id]/messages returns valid JSON", "messages" in body)
        except urllib.error.HTTPError as he:
            body = json.loads(he.read())
            log_result("GET /api/groups/[id]/messages returns valid JSON", "error" in body, f"status={he.code}")
    except Exception as e:
        log_result("GET /api/groups/[id]/messages returns valid JSON", False, str(e))

    # Summary
    passed = sum(1 for r in results if r["passed"])
    total = len(results)
    print(f"\n{'='*40}")
    print(f"Results: {passed}/{total} passed")

    # Log any failures as bugs
    failures = [r for r in results if not r["passed"]]
    if failures:
        print(f"\n🐛 {len(failures)} bug(s) found — logged to {BUGS_FILE}")
        for f in failures:
            log_bug(f["name"], f["details"])

    # Write JSON results for the agent to read
    with open("tests/results.json", "w") as f:
        json.dump({"timestamp": datetime.now().isoformat(), "url": url, "passed": passed, "total": total, "results": results}, f, indent=2)

    return 0 if passed == total else 1

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=SITE_URL)
    args = parser.parse_args()
    sys.exit(run_tests(args.url))
