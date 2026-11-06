export interface CommitItem {
  hash: string;
  shortHash: string;
  date: string;
  message: string;
  author_name: string;
  author_email?: string;
  parents: string[];
  refs?: string[];
}

export interface GraphConnection {
  fromLane: number;
  toLane: number;
  fromIndex: number;
  toIndex: number;
  parentHash: string;
  d: string;
  color: string;
}

export interface GraphNode {
  commit: CommitItem;
  index: number;
  lane: number;
  x: number;
  y: number;
  color: string;
  isMerge: boolean;
}

export interface GitGraphLayout {
  nodes: GraphNode[];
  connections: GraphConnection[];
  maxLanes: number;
  totalWidth: number;
  totalHeight: number;
}

export const LANE_COLORS = [
  '#10b981', // 0: Emerald (Trunk/Main)
  '#38bdf8', // 1: Sky
  '#a855f7', // 2: Purple
  '#f59e0b', // 3: Amber
  '#ec4899', // 4: Pink
  '#06b6d4', // 5: Cyan
  '#84cc16', // 6: Lime
  '#f97316', // 7: Orange
  '#6366f1', // 8: Indigo
  '#14b8a6', // 9: Teal
];

export function getColorForLane(lane: number): string {
  return LANE_COLORS[lane % LANE_COLORS.length];
}

export function computeGitGraph(
  commits: CommitItem[],
  rowHeight = 64,
  laneWidth = 24,
  offsetX = 20
): GitGraphLayout {
  if (!commits || commits.length === 0) {
    return { nodes: [], connections: [], maxLanes: 0, totalWidth: 60, totalHeight: 0 };
  }

  const activeLanes: (string | null)[] = [];
  const nodes: GraphNode[] = [];
  const connections: GraphConnection[] = [];
  const commitIndexMap = new Map<string, number>();

  commits.forEach((c, idx) => {
    commitIndexMap.set(c.hash, idx);
  });

  let maxLanesObserved = 0;

  commits.forEach((commit, index) => {
    // 1. Allocate or retrieve lane for this commit
    let lane = activeLanes.indexOf(commit.hash);
    if (lane === -1) {
      lane = activeLanes.indexOf(null);
      if (lane === -1) {
        lane = activeLanes.length;
        activeLanes.push(commit.hash);
      } else {
        activeLanes[lane] = commit.hash;
      }
    }

    if (lane + 1 > maxLanesObserved) {
      maxLanesObserved = lane + 1;
    }

    // Free the slot
    activeLanes[lane] = null;

    // 2. Connect commit to its parents
    commit.parents.forEach((parentHash, pIdx) => {
      const parentIndex = commitIndexMap.get(parentHash);

      // Check if parent is already active in a lane
      let parentLane = activeLanes.indexOf(parentHash);

      if (pIdx === 0 && activeLanes[lane] === null && parentLane === -1) {
        // Continue current lane for the primary parent
        activeLanes[lane] = parentHash;
        parentLane = lane;
      } else if (parentLane === -1) {
        // Allocate a new slot for branch fork or secondary parent
        const freeSlot = activeLanes.indexOf(null);
        if (freeSlot === -1) {
          parentLane = activeLanes.length;
          activeLanes.push(parentHash);
        } else {
          parentLane = freeSlot;
          activeLanes[parentLane] = parentHash;
        }
      }

      if (parentLane + 1 > maxLanesObserved) {
        maxLanesObserved = parentLane + 1;
      }

      // Generate SVG path if parent is within loaded commit range
      if (parentIndex !== undefined) {
        const x1 = offsetX + lane * laneWidth;
        const y1 = index * rowHeight + rowHeight / 2;
        const x2 = offsetX + parentLane * laneWidth;
        const y2 = parentIndex * rowHeight + rowHeight / 2;

        let d = '';
        if (x1 === x2) {
          d = `M ${x1} ${y1} L ${x2} ${y2}`;
        } else if (parentIndex === index + 1) {
          d = `M ${x1} ${y1} C ${x1} ${y1 + 24}, ${x2} ${y2 - 24}, ${x2} ${y2}`;
        } else {
          const bendY = y1 + rowHeight;
          d = `M ${x1} ${y1} C ${x1} ${y1 + 24}, ${x2} ${bendY - 24}, ${x2} ${bendY} L ${x2} ${y2}`;
        }

        connections.push({
          fromLane: lane,
          toLane: parentLane,
          fromIndex: index,
          toIndex: parentIndex,
          parentHash,
          d,
          color: getColorForLane(lane)
        });
      } else {
        // Parent is outside loaded limit - draw terminal stub
        const x1 = offsetX + lane * laneWidth;
        const y1 = index * rowHeight + rowHeight / 2;
        connections.push({
          fromLane: lane,
          toLane: lane,
          fromIndex: index,
          toIndex: index + 1,
          parentHash,
          d: `M ${x1} ${y1} L ${x1} ${y1 + 28}`,
          color: getColorForLane(lane)
        });
      }
    });

    // Clean trailing nulls
    while (activeLanes.length > 0 && activeLanes[activeLanes.length - 1] === null) {
      activeLanes.pop();
    }

    const x = offsetX + lane * laneWidth;
    const y = index * rowHeight + rowHeight / 2;

    nodes.push({
      commit,
      index,
      lane,
      x,
      y,
      color: getColorForLane(lane),
      isMerge: commit.parents.length > 1
    });
  });

  const totalWidth = Math.max(80, offsetX + maxLanesObserved * laneWidth + 16);
  const totalHeight = commits.length * rowHeight;

  return {
    nodes,
    connections,
    maxLanes: maxLanesObserved,
    totalWidth,
    totalHeight
  };
}
