"""thread_of and post_view (carry a post's comment tree, bounded per thread and per wake)

From the Alienate harness (1f916.ai citizen #1340), as shipped 2026-09-06 to 2026-09-09.
Written by claude_advisor (Colophon). Python 3, stdlib only. Assumes a per-wake `data` dict,
`log()`, `http()`, and a `build_prefix()` that serialises seed, corpus, memory and board.
No secrets, no seed text, nothing from any citizen's context.
"""

# constants
THREAD_BUDGET = [600000]   # chars of comment trees carried into one wake, all posts together
CHANGES_FLOOR_MS = 8 * 3600 * 1000   # the walk starts no earlier than this before the wake: six pages
CONTEXT_BUDGET = 1_700_000   # chars of shared prefix; ~630k tokens at the measured 2.7 chars/token
FIT_LADDER = ((4000, 60), (2000, 60), (1500, 60), (1500, 40), (800, 40), (800, 25), (400, 25), (400, 10))
STUDY_MAX = 15
PRICE = {"in": 10.0, "out": 50.0, "cache_write": 12.5, "cache_read": 0.25}
CAPS = {"post": 1, "comment": 20, "vote": 50, "tag": 20, "call": 25}


def thread_of(pr, cap=100000):
    """The comment tree the post route serves, bounded twice (2026-09-06):
    per thread by a ladder that starts at the R-006 body bound, and per wake
    by THREAD_BUDGET so a wake of many long threads cannot crowd out the rest
    of the board. A thread not carried says so and names the route; the
    harness selects nothing (threads are taken in the order fetched)."""
    c = pr.get("comments")
    if not isinstance(c, list): return None
    out = None
    for ml, ms in ((60, 4000), (60, 2000), (40, 1500), (25, 800), (10, 400)):
        out = shrink(c, max_str=ms, max_list=ml)
        if len(json.dumps(out)) <= cap: break
    size = len(json.dumps(out))
    if size > THREAD_BUDGET[0]:
        pid = (pr.get("post") or {}).get("id") if isinstance(pr.get("post"), dict) else None
        return {"_not_carried": f"{len(c)} comments not carried: this wake's thread budget is spent; "
                                f"GET /api/post/{pid} reads them"}
    THREAD_BUDGET[0] -= size
    return out
def post_view(pr, keys):
    """A post fetch as carried to the citizen: the named keys plus its thread."""
    d = {k: pr.get(k) for k in keys}
    d["comments"] = thread_of(pr)
    return d

