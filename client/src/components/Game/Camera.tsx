import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';

import { Controls } from '../../App';
import { usePlayer } from '../../lib/stores/usePlayer';

const Camera = () => {
  const { camera } = useThree();
  const { player } = usePlayer();
  const [subscribe, get] = useKeyboardControls<Controls>();
  
  const cameraRef = useRef({
    offset: new THREE.Vector3(10, 10, 10),
    targetOffset: new THREE.Vector3(0, 0, 0),
    distance: 15,
    height: 12,
    rotationY: 0.785, // 45 degrees for isometric view
    rotationX: -0.4, // Looking down angle
    minDistance: 8,
    maxDistance: 25,
    smoothing: 0.05
  });

  // Camera movement constants
  const CAMERA_MOVE_SPEED = 10;
  const CAMERA_ZOOM_SPEED = 5;
  const CAMERA_ROTATION_SPEED = 2;

  useFrame((state, delta) => {
    const controls = get();
    const cameraData = cameraRef.current;
    let cameraUpdated = false;

    // Handle camera controls (arrow keys)
    if (controls.cameraUp) {
      cameraData.targetOffset.z -= CAMERA_MOVE_SPEED * delta;
      cameraUpdated = true;
      console.log('Camera panning up');
    }
    if (controls.cameraDown) {
      cameraData.targetOffset.z += CAMERA_MOVE_SPEED * delta;
      cameraUpdated = true;
      console.log('Camera panning down');
    }
    if (controls.cameraLeft) {
      cameraData.targetOffset.x -= CAMERA_MOVE_SPEED * delta;
      cameraUpdated = true;
      console.log('Camera panning left');
    }
    if (controls.cameraRight) {
      cameraData.targetOffset.x += CAMERA_MOVE_SPEED * delta;
      cameraUpdated = true;
      console.log('Camera panning right');
    }

    // Handle camera zoom
    if (controls.cameraZoomIn) {
      cameraData.distance = Math.max(
        cameraData.minDistance, 
        cameraData.distance - CAMERA_ZOOM_SPEED * delta
      );
      cameraUpdated = true;
      console.log('Camera zooming in:', cameraData.distance);
    }
    if (controls.cameraZoomOut) {
      cameraData.distance = Math.min(
        cameraData.maxDistance, 
        cameraData.distance + CAMERA_ZOOM_SPEED * delta
      );
      cameraUpdated = true;
      console.log('Camera zooming out:', cameraData.distance);
    }

    // Calculate camera position
    let targetPosition = new THREE.Vector3(0, 0, 0);
    
    if (player) {
      // Follow player
      targetPosition.copy(player.position);
    }
    
    // Add camera offset
    targetPosition.add(cameraData.targetOffset);

    // Calculate isometric camera position
    const cameraPosition = new THREE.Vector3(
      targetPosition.x + Math.cos(cameraData.rotationY) * cameraData.distance,
      targetPosition.y + cameraData.height,
      targetPosition.z + Math.sin(cameraData.rotationY) * cameraData.distance
    );

    // Smooth camera movement
    camera.position.lerp(cameraPosition, cameraData.smoothing);
    
    // Look at target position slightly above ground
    const lookAtTarget = new THREE.Vector3(
      targetPosition.x,
      targetPosition.y + 2,
      targetPosition.z
    );
    
    camera.lookAt(lookAtTarget);

    // Update camera projection for isometric feel
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 50;
      camera.updateProjectionMatrix();
    }

    if (cameraUpdated) {
      console.log('Camera updated - Position:', camera.position.toArray(), 'Target:', targetPosition.toArray());
    }
  });

  // Debug camera controls
  useEffect(() => {
    return subscribe(
      (state) => state.cameraUp,
      (pressed) => console.log('Camera up key:', pressed ? 'pressed' : 'released')
    );
  }, [subscribe]);

  useEffect(() => {
    return subscribe(
      (state) => state.cameraDown,
      (pressed) => console.log('Camera down key:', pressed ? 'pressed' : 'released')
    );
  }, [subscribe]);

  useEffect(() => {
    return subscribe(
      (state) => state.cameraLeft,
      (pressed) => console.log('Camera left key:', pressed ? 'pressed' : 'released')
    );
  }, [subscribe]);

  useEffect(() => {
    return subscribe(
      (state) => state.cameraRight,
      (pressed) => console.log('Camera right key:', pressed ? 'pressed' : 'released')
    );
  }, [subscribe]);

  // Initialize camera position
  useEffect(() => {
    camera.position.set(10, 12, 10);
    camera.lookAt(0, 0, 0);
    console.log('Camera initialized with isometric view');
  }, [camera]);

  // This component doesn't render anything visible
  return null;
};

export default Camera;
