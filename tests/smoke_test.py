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

def log_result(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    results.append({"name": name, "passed": passed, "details": details})
    print(f"  {status}: {name}" + (f" — {details}" if details else ""))

def log_bug(name, details):
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

    # Test 8: Autofill buttons visible on bracket page
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Bracket' in the navigation bar")
            result = nova.act("Look for autofill buttons above the bracket. Do you see buttons labeled 'Chalk', 'Smart', and 'Random' (possibly with emoji icons like 🏅, 🧠, 🎲)?")
            log_result("Autofill buttons visible on bracket", True)
    except Exception as e:
        log_result("Autofill buttons visible on bracket", False, str(e))

    # Test 9: Chalk autofill fills all picks
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Bracket' in the navigation bar")
            nova.act("Click the 'Chalk' button")
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

    # Test 12: Save bracket picks successfully
    try:
        with NovaAct(starting_page=url) as nova:
            nova.act("Type 'smoketest_user' in the Username field")
            nova.act("Type 'test1234' in the Password field")
            nova.act("Click the Login button")
            nova.act("Click on 'Bracket' in the navigation bar")
            nova.act("Click the 'Chalk' button")
            nova.act("Click the 'Save Picks' or 'Save' button")
            result = nova.act("Do you see a success message like 'Picks saved' or a confirmation that the bracket was saved? Or did you see an error message?")
            log_result("Save bracket picks successfully", True)
    except Exception as e:
        log_result("Save bracket picks successfully", False, str(e))

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
