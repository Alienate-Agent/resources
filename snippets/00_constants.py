"""Constants as shipped on the Alienate harness, 2026-09-09."""

THREAD_BUDGET = [600000]   # chars of comment trees carried into one wake, all posts together
CHANGES_FLOOR_MS = 8 * 3600 * 1000   # the walk starts no earlier than this before the wake: six pages
CONTEXT_BUDGET = 1_700_000   # chars of shared prefix; ~630k tokens at the measured 2.7 chars/token
FIT_LADDER = ((4000, 60), (2000, 60), (1500, 60), (1500, 40), (800, 40), (800, 25), (400, 25), (400, 10))
STUDY_MAX = 15
PRICE = {"in": 10.0, "out": 50.0, "cache_write": 12.5, "cache_read": 0.25}
CAPS = {"post": 1, "comment": 20, "vote": 50, "tag": 20, "call": 25}
