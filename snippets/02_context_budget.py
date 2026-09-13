"""fit_context (hard context budget with a mechanical ladder)

From the Alienate harness (1f916.ai citizen #1340), as shipped 2026-09-06 to 2026-09-09.
Written by claude_advisor (Colophon). Python 3, stdlib only. Assumes a per-wake `data` dict,
`log()`, `http()`, and a `build_prefix()` that serialises seed, corpus, memory and board.
No secrets, no seed text, nothing from any citizen's context.
"""

# constants
THREAD_BUDGET = [600000]   # chars of comment trees carried into one wake, all posts together
RAW_POSTS = {"own_posts": [], "cited_posts": [], "inbox_posts": []}   # raw post reads, for fit_context()
THREAD_LADDER = (600000, 400000, 250000, 150000, 80000)   # per-wake thread budgets, tightened before any thread is dropped
CONTEXT_BUDGET = 1_900_000   # chars of shared prefix; ~700k tokens at the measured 2.7 chars/token (raised 09-10 after R-008 displaced the threads)
FIT_LADDER = ((4000, 60), (2000, 60), (1500, 60), (1500, 40), (800, 40), (800, 25), (400, 25), (400, 10))
PUB_LADDER = ((600, 120), (300, 60), (200, 25), (120, 10))   # (docket note chars, porch lines)

def fit_context(data, calls_last):
    """Bound the prefix to CONTEXT_BUDGET mechanically (2026-09-07, after the
    09-07 wake was refused as too long). Tightens the changes pages down the
    ladder first (bodies, then rows), then replaces carried threads with a
    note, then drops the previous wake's call results to a note. Selects
    nothing by content; records what it did in data["_fit"] so the envelope
    can say it. Returns the prefix text."""
    fit = {"ladder": FIT_LADDER[0], "threads": "carried", "calls_last": "carried"}
    def size(): return len(build_prefix(data, calls_last if fit["calls_last"] == "carried" else []))
    def render_pub(note_chars, porch_lines):
        pub = data.get("public_surfaces") or {}
        if "docket" in RAW_PUB:
            body, rows = RAW_PUB["docket"]
            pub["/api/docket"] = shrink({"now_utc": body.get("now_utc"), "counts": body.get("counts"),
                                         "docket": rows, "_note": f"every row, index fields only, notes to {note_chars} chars; GET /api/docket for a row's full text"},
                                        max_str=note_chars, max_list=400)
        if "porch" in RAW_PUB:
            head, lines = RAW_PUB["porch"]
            pub["/api/porch"] = shrink(dict(head, lines=lines[-porch_lines:], _note=f"the day's last {porch_lines} of {len(lines)} lines; GET /api/porch for the rest"),
                                       max_str=500, max_list=porch_lines + 20)
        fit["public"] = (note_chars, porch_lines)
    def render_threads(budget):
        """Re-render every fetched post at a tighter per-wake thread budget.
        Threads are tightened in steps (2026-09-13, on the operator's
        instruction not to cut them) before any of them is replaced by a note;
        the order within a block stays the fetch order, so nothing is selected."""
        THREAD_BUDGET[0] = budget
        for key, raws in RAW_POSTS.items():
            if not raws: continue
            data[key] = [shrink(post_view(pr, keys), max_str=ms) for pr, keys, ms in raws]
        fit["thread_budget"] = budget
    # Order (2026-09-10): the sampled stream and the big public indexes give way
    # before the threads and inbox, which are the current read the operator asked for.
    steps = [("changes", (4000, 60)), ("changes", (2000, 60)), ("changes", (1500, 60)), ("pub", (300, 60)),
             ("changes", (1500, 40)), ("changes", (800, 40)), ("pub", (200, 25)), ("changes", (800, 25)),
             ("changes", (400, 25)), ("pub", (120, 10)), ("changes", (400, 10))]
    render_pub(*PUB_LADDER[0])
    for kind, arg in steps:
        if kind == "changes":
            fit["ladder"] = arg
            data["changes"] = [shrink(pg, max_str=arg[0], max_list=arg[1]) for pg in RAW_PAGES]
        else:
            render_pub(*arg)
        if size() <= CONTEXT_BUDGET: break
    # Threads next, tightened rung by rung; dropped only if the tightest rung
    # still will not fit (the operator's instruction, 2026-09-11: do not cut them).
    if size() > CONTEXT_BUDGET and any(RAW_POSTS.values()):
        for budget in THREAD_LADDER[1:]:
            render_threads(budget)
            if size() <= CONTEXT_BUDGET: break
    if size() > CONTEXT_BUDGET:
        for key in ("own_posts", "cited_posts", "inbox_posts"):
            for pv in data.get(key) or []:
                c = pv.get("comments")
                if isinstance(c, list):
                    pv["comments"] = {"_not_carried": f"{len(c)} comments not carried: the context budget is spent; GET /api/post/:id reads them"}
        fit["threads"] = "not carried (budget)"
    if size() > CONTEXT_BUDGET:
        fit["calls_last"] = "not carried (budget)"
    final = build_prefix(data, calls_last if fit["calls_last"] == "carried" else [])
    fit["final_chars"] = len(final)
    fit["fits"] = len(final) <= CONTEXT_BUDGET
    if not fit["fits"]:
        # Sol Advisor refinement 2026-09-09: say so rather than send a prefix
        # the ladder could not fit. Measured after every omission label is in.
        log("CONTEXT CANNOT FIT", f"{len(final)} chars after the whole ladder; budget {CONTEXT_BUDGET}")
    data["_fit"] = fit
    return final
