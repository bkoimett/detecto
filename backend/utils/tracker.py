import time


class CentroidTracker:
    """Dependency-free multi-object tracker for live detections.

    Assigns stable IDs to people across frames via centroid nearest-neighbour
    matching, keeps a short motion trail per track (for tracking lines), and
    prunes tracks that stop being seen. Module-level singleton: pass the same
    instance across /detect/live calls.
    """

    def __init__(self, max_distance=200.0, max_missed=12, max_trail=24, max_tracks=80):
        self.max_distance = max_distance
        self.max_missed = max_missed
        self.max_trail = max_trail
        self.max_tracks = max_tracks
        self.tracks = {}
        self.next_id = 1

    def update(self, boxes):
        """box: dict with x1, y1, x2, y2 (and optional confidence)."""
        now = time.time()
        cur = []
        for t in self.tracks.values():
            cur.append({
                "id": t["id"], "cx": t["cx"], "cy": t["cy"],
                "last_seen": t["last_seen"],
            })

        matched = set()
        updated = {}
        for b in boxes:
            cx = (b["x1"] + b["x2"]) / 2
            cy = (b["y1"] + b["y2"]) / 2
            best_id, best_d = None, self.max_distance
            for t in cur:
                if t["id"] in matched:
                    continue
                d = ((t["cx"] - cx) ** 2 + (t["cy"] - cy) ** 2) ** 0.5
                if d < best_d:
                    best_d = d
                    best_id = t["id"]
            if best_id is not None:
                matched.add(best_id)
                track = self.tracks[best_id]
                trail = track["trail"] + [(cx, cy)]
                updated[best_id] = {
                    "id": best_id,
                    "x1": b["x1"], "y1": b["y1"], "x2": b["x2"], "y2": b["y2"],
                    "cx": cx, "cy": cy,
                    "first_seen": track["first_seen"],
                    "last_seen": now,
                    "trail": trail[-self.max_trail:],
                }
            else:
                tid = self.next_id
                self.next_id += 1
                updated[tid] = {
                    "id": tid,
                    "x1": b["x1"], "y1": b["y1"], "x2": b["x2"], "y2": b["y2"],
                    "cx": cx, "cy": cy,
                    "first_seen": now,
                    "last_seen": now,
                    "trail": [(cx, cy)],
                }

        for t in cur:
            if t["id"] not in matched and now - t["last_seen"] <= self.max_missed:
                updated[t["id"]] = self.tracks[t["id"]]

        self.tracks = dict(
            sorted(updated.items(), key=lambda kv: kv[1]["first_seen"])
        )
        if len(self.tracks) > self.max_tracks:
            self.tracks = dict(list(self.tracks.items())[-self.max_tracks:])
        return self.snapshot(boxes)

    def snapshot(self, boxes):
        """Return track ids aligned with the input box order (None if unmatched)."""
        box_centers = [
            ((b["x1"] + b["x2"]) / 2, (b["y1"] + b["y2"]) / 2) for b in boxes
        ]
        by_center = {(t["cx"], t["cy"]): t["id"] for t in self.tracks.values()}
        ids = []
        for center in box_centers:
            best = None
            best_d = self.max_distance
            for tc, tid in by_center.items():
                d = ((tc[0] - center[0]) ** 2 + (tc[1] - center[1]) ** 2) ** 0.5
                if d < best_d:
                    best_d = d
                    best = tid
            ids.append(best)
        return ids

    def trails(self):
        """Return [(track_id, [(x, y), ...]), ...] for drawing motion lines."""
        return [(t["id"], t["trail"]) for t in self.tracks.values() if len(t["trail"]) > 1]