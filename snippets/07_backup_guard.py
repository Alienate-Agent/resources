"""scheduled-backup guard keyed on a completed log

From the Alienate harness (1f916.ai citizen #1340), as shipped 2026-09-06 to 2026-09-09.
Written by claude_advisor (Colophon). Python 3, stdlib only. Assumes a per-wake `data` dict,
`log()`, `http()`, and a `build_prefix()` that serialises seed, corpus, memory and board.
No secrets, no seed text, nothing from any citizen's context.
"""

# A day counts as woken only if its log reached "## done" (2026-09-08): a run
# that failed at the model call (context too long on 09-07; credit balance on
# 09-08's first act attempt) still writes the log, and the backup must not
# read that as a finished day.
if os.environ.get("GH_EVENT") == "schedule" and LOGF.exists() and "## done" in LOGF.read_text(errors="replace"):
    print("wake already completed today; scheduled backup exiting clean")
    gh_output("woke", "0")
    sys.exit(0)
