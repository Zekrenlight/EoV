import * as THREE from 'three';
import { PathNode } from '../types/GameTypes';

export class PathfindingSystem {
  private gridSize: number;
  private nodeSize: number;
  private nodes: Map<string, PathNode>;
  private obstacles: Set<string>;

  constructor(gridSize: number = 100, nodeSize: number = 1) {
    this.gridSize = gridSize;
    this.nodeSize = nodeSize;
    this.nodes = new Map();
    this.obstacles = new Set();
    this.initializeGrid();
  }

  private initializeGrid() {
    const halfGrid = this.gridSize / 2;
    
    for (let x = -halfGrid; x < halfGrid; x++) {
      for (let z = -halfGrid; z < halfGrid; z++) {
        const node: PathNode = {
          x: x * this.nodeSize,
          z: z * this.nodeSize,
          walkable: true,
          gCost: 0,
          hCost: 0,
          fCost: 0
        };
        
        this.nodes.set(this.getNodeKey(x, z), node);
      }
    }
    
    console.log(`PathfindingSystem initialized with ${this.nodes.size} nodes`);
  }

  private getNodeKey(x: number, z: number): string {
    return `${Math.floor(x)},${Math.floor(z)}`;
  }

  private worldToGrid(worldPos: THREE.Vector3): { x: number; z: number } {
    return {
      x: Math.floor(worldPos.x / this.nodeSize),
      z: Math.floor(worldPos.z / this.nodeSize)
    };
  }

  private gridToWorld(gridX: number, gridZ: number): THREE.Vector3 {
    return new THREE.Vector3(
      gridX * this.nodeSize,
      0,
      gridZ * this.nodeSize
    );
  }

  // A* pathfinding implementation
  findPath(start: THREE.Vector3, end: THREE.Vector3): THREE.Vector3[] {
    const startGrid = this.worldToGrid(start);
    const endGrid = this.worldToGrid(end);
    
    const startNode = this.nodes.get(this.getNodeKey(startGrid.x, startGrid.z));
    const endNode = this.nodes.get(this.getNodeKey(endGrid.x, endGrid.z));
    
    if (!startNode || !endNode || !startNode.walkable || !endNode.walkable) {
      console.warn('Invalid start or end position for pathfinding');
      return [];
    }

    // Reset all nodes
    this.nodes.forEach(node => {
      node.gCost = 0;
      node.hCost = 0;
      node.fCost = 0;
      node.parent = undefined;
    });

    const openSet: PathNode[] = [startNode];
    const closedSet: Set<PathNode> = new Set();

    startNode.gCost = 0;
    startNode.hCost = this.calculateHeuristic(startNode, endNode);
    startNode.fCost = startNode.gCost + startNode.hCost;

    while (openSet.length > 0) {
      // Find node with lowest fCost
      let currentNode = openSet[0];
      let currentIndex = 0;
      
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].fCost < currentNode.fCost || 
           (openSet[i].fCost === currentNode.fCost && openSet[i].hCost < currentNode.hCost)) {
          currentNode = openSet[i];
          currentIndex = i;
        }
      }

      // Move current node from open to closed set
      openSet.splice(currentIndex, 1);
      closedSet.add(currentNode);

      // Check if we reached the target
      if (currentNode === endNode) {
        return this.reconstructPath(currentNode);
      }

      // Check all neighbors
      const neighbors = this.getNeighbors(currentNode);
      
      for (const neighbor of neighbors) {
        if (!neighbor.walkable || closedSet.has(neighbor)) {
          continue;
        }

        const tentativeGCost = currentNode.gCost + this.calculateDistance(currentNode, neighbor);
        
        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        } else if (tentativeGCost >= neighbor.gCost) {
          continue;
        }

        neighbor.parent = currentNode;
        neighbor.gCost = tentativeGCost;
        neighbor.hCost = this.calculateHeuristic(neighbor, endNode);
        neighbor.fCost = neighbor.gCost + neighbor.hCost;
      }
    }

    console.warn('No path found');
    return [];
  }

  private getNeighbors(node: PathNode): PathNode[] {
    const neighbors: PathNode[] = [];
    const directions = [
      { x: -1, z: 0 }, { x: 1, z: 0 }, { x: 0, z: -1 }, { x: 0, z: 1 }, // Cardinal
      { x: -1, z: -1 }, { x: -1, z: 1 }, { x: 1, z: -1 }, { x: 1, z: 1 } // Diagonal
    ];

    for (const dir of directions) {
      const neighborX = node.x / this.nodeSize + dir.x;
      const neighborZ = node.z / this.nodeSize + dir.z;
      const neighborKey = this.getNodeKey(neighborX, neighborZ);
      const neighbor = this.nodes.get(neighborKey);
      
      if (neighbor) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  private calculateHeuristic(nodeA: PathNode, nodeB: PathNode): number {
    // Manhattan distance for grid-based movement
    const dx = Math.abs(nodeA.x - nodeB.x);
    const dz = Math.abs(nodeA.z - nodeB.z);
    return dx + dz;
  }

  private calculateDistance(nodeA: PathNode, nodeB: PathNode): number {
    const dx = Math.abs(nodeA.x - nodeB.x);
    const dz = Math.abs(nodeA.z - nodeB.z);
    
    // Diagonal movement cost (1.4) vs straight movement cost (1.0)
    if (dx === dz) {
      return 1.4; // Diagonal
    }
    return 1.0; // Straight
  }

  private reconstructPath(endNode: PathNode): THREE.Vector3[] {
    const path: THREE.Vector3[] = [];
    let currentNode: PathNode | undefined = endNode;

    while (currentNode) {
      path.unshift(new THREE.Vector3(currentNode.x, 0, currentNode.z));
      currentNode = currentNode.parent;
    }

    // Smooth the path by removing unnecessary waypoints
    return this.smoothPath(path);
  }

  private smoothPath(path: THREE.Vector3[]): THREE.Vector3[] {
    if (path.length <= 2) return path;

    const smoothedPath: THREE.Vector3[] = [path[0]];
    
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const current = path[i];
      const next = path[i + 1];
      
      // Check if current point is necessary (not in straight line)
      const dir1 = new THREE.Vector3().subVectors(current, prev).normalize();
      const dir2 = new THREE.Vector3().subVectors(next, current).normalize();
      
      if (dir1.dot(dir2) < 0.9) { // Not a straight line
        smoothedPath.push(current);
      }
    }
    
    smoothedPath.push(path[path.length - 1]);
    
    console.log(`Path smoothed from ${path.length} to ${smoothedPath.length} points`);
    return smoothedPath;
  }

  // Obstacle management
  addObstacle(position: THREE.Vector3, size: number = 1) {
    const gridPos = this.worldToGrid(position);
    const halfSize = Math.floor(size / 2);
    
    for (let x = gridPos.x - halfSize; x <= gridPos.x + halfSize; x++) {
      for (let z = gridPos.z - halfSize; z <= gridPos.z + halfSize; z++) {
        const nodeKey = this.getNodeKey(x, z);
        const node = this.nodes.get(nodeKey);
        
        if (node) {
          node.walkable = false;
          this.obstacles.add(nodeKey);
        }
      }
    }
    
    console.log(`Added obstacle at (${gridPos.x}, ${gridPos.z}) with size ${size}`);
  }

  removeObstacle(position: THREE.Vector3, size: number = 1) {
    const gridPos = this.worldToGrid(position);
    const halfSize = Math.floor(size / 2);
    
    for (let x = gridPos.x - halfSize; x <= gridPos.x + halfSize; x++) {
      for (let z = gridPos.z - halfSize; z <= gridPos.z + halfSize; z++) {
        const nodeKey = this.getNodeKey(x, z);
        const node = this.nodes.get(nodeKey);
        
        if (node) {
          node.walkable = true;
          this.obstacles.delete(nodeKey);
        }
      }
    }
    
    console.log(`Removed obstacle at (${gridPos.x}, ${gridPos.z})`);
  }

  // Terrain integration
  updateTerrainWalkability(heightMap: number[][], terrainSize: number, maxSlope: number = 0.5) {
    const mapSize = heightMap.length;
    const scale = terrainSize / mapSize;
    
    for (let x = 0; x < mapSize - 1; x++) {
      for (let z = 0; z < mapSize - 1; z++) {
        const worldX = (x - mapSize / 2) * scale;
        const worldZ = (z - mapSize / 2) * scale;
        
        const nodeKey = this.getNodeKey(worldX / this.nodeSize, worldZ / this.nodeSize);
        const node = this.nodes.get(nodeKey);
        
        if (node) {
          // Calculate slope based on height differences
          const height = heightMap[x][z];
          const heightRight = heightMap[x + 1][z];
          const heightDown = heightMap[x][z + 1];
          
          const slopeX = Math.abs(height - heightRight);
          const slopeZ = Math.abs(height - heightDown);
          const maxSlopeAtNode = Math.max(slopeX, slopeZ);
          
          // Mark as unwalkable if slope is too steep
          node.walkable = maxSlopeAtNode <= maxSlope;
          
          if (!node.walkable) {
            this.obstacles.add(nodeKey);
          }
        }
      }
    }
    
    console.log('Updated pathfinding grid with terrain walkability');
  }

  // Dynamic pathfinding for moving targets
  findDynamicPath(
    start: THREE.Vector3, 
    target: THREE.Vector3, 
    targetVelocity: THREE.Vector3,
    interceptTime: number = 2.0
  ): THREE.Vector3[] {
    // Predict target position
    const predictedPosition = target.clone().add(
      targetVelocity.clone().multiplyScalar(interceptTime)
    );
    
    return this.findPath(start, predictedPosition);
  }

  // Line of sight checking
  hasLineOfSight(start: THREE.Vector3, end: THREE.Vector3): boolean {
    const startGrid = this.worldToGrid(start);
    const endGrid = this.worldToGrid(end);
    
    // Bresenham's line algorithm
    const dx = Math.abs(endGrid.x - startGrid.x);
    const dz = Math.abs(endGrid.z - startGrid.z);
    const sx = startGrid.x < endGrid.x ? 1 : -1;
    const sz = startGrid.z < endGrid.z ? 1 : -1;
    let err = dx - dz;
    
    let currentX = startGrid.x;
    let currentZ = startGrid.z;
    
    while (true) {
      const nodeKey = this.getNodeKey(currentX, currentZ);
      const node = this.nodes.get(nodeKey);
      
      if (!node || !node.walkable) {
        return false;
      }
      
      if (currentX === endGrid.x && currentZ === endGrid.z) {
        break;
      }
      
      const e2 = 2 * err;
      if (e2 > -dz) {
        err -= dz;
        currentX += sx;
      }
      if (e2 < dx) {
        err += dx;
        currentZ += sz;
      }
    }
    
    return true;
  }

  // Area search for finding nearby walkable positions
  findNearestWalkablePosition(position: THREE.Vector3, searchRadius: number = 5): THREE.Vector3 | null {
    const gridPos = this.worldToGrid(position);
    
    for (let radius = 0; radius <= searchRadius; radius++) {
      for (let x = gridPos.x - radius; x <= gridPos.x + radius; x++) {
        for (let z = gridPos.z - radius; z <= gridPos.z + radius; z++) {
          // Only check border of current radius
          if (radius > 0 && 
              x > gridPos.x - radius && x < gridPos.x + radius && 
              z > gridPos.z - radius && z < gridPos.z + radius) {
            continue;
          }
          
          const nodeKey = this.getNodeKey(x, z);
          const node = this.nodes.get(nodeKey);
          
          if (node && node.walkable) {
            return this.gridToWorld(x, z);
          }
        }
      }
    }
    
    return null;
  }

  // Path validation and repair
  validatePath(path: THREE.Vector3[]): boolean {
    for (let i = 0; i < path.length; i++) {
      const gridPos = this.worldToGrid(path[i]);
      const nodeKey = this.getNodeKey(gridPos.x, gridPos.z);
      const node = this.nodes.get(nodeKey);
      
      if (!node || !node.walkable) {
        return false;
      }
    }
    
    return true;
  }

  repairPath(path: THREE.Vector3[]): THREE.Vector3[] {
    if (path.length === 0) return path;
    
    const repairedPath: THREE.Vector3[] = [];
    let lastValidIndex = 0;
    
    for (let i = 0; i < path.length; i++) {
      if (this.validatePath([path[i]])) {
        repairedPath.push(path[i]);
        lastValidIndex = i;
      } else {
        // Find path from last valid point to next valid point
        let nextValidIndex = -1;
        for (let j = i + 1; j < path.length; j++) {
          if (this.validatePath([path[j]])) {
            nextValidIndex = j;
            break;
          }
        }
        
        if (nextValidIndex !== -1) {
          const repairSegment = this.findPath(path[lastValidIndex], path[nextValidIndex]);
          repairedPath.push(...repairSegment.slice(1)); // Skip first point to avoid duplicates
          i = nextValidIndex - 1; // Continue from next valid point
        }
      }
    }
    
    return repairedPath;
  }

  // Debug visualization helpers
  getObstacles(): THREE.Vector3[] {
    const obstaclePositions: THREE.Vector3[] = [];
    
    for (const obstacleKey of this.obstacles) {
      const [x, z] = obstacleKey.split(',').map(Number);
      obstaclePositions.push(this.gridToWorld(x, z));
    }
    
    return obstaclePositions;
  }

  getGridBounds(): { min: THREE.Vector3; max: THREE.Vector3 } {
    const halfGrid = this.gridSize / 2;
    return {
      min: new THREE.Vector3(-halfGrid * this.nodeSize, 0, -halfGrid * this.nodeSize),
      max: new THREE.Vector3(halfGrid * this.nodeSize, 0, halfGrid * this.nodeSize)
    };
  }
}
