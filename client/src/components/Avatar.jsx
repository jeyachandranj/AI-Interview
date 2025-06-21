import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

// Only include sitting idle and talking animations
const animationFiles = {
  "Sitting Idle": "/animations/Sitting Idle.fbx",
  "Sitting Talking": "/animations/Sitting Talking.fbx",
};

// Preload animations
Object.values(animationFiles).forEach((url) => {
  useFBX.preload(url);
});

// ReadyPlayerMe visemes map
const azureToOculusVisemes = {
  0: "viseme_sil",
  1: "viseme_PP",
  2: "viseme_aa",
  3: "viseme_aa",
  4: "viseme_E",
  5: "viseme_RR",
  6: "viseme_I",
  7: "viseme_U",
  8: "viseme_O",
  9: "viseme_aa",
  10: "viseme_O",
  11: "viseme_I",
  12: "viseme_sil",
  13: "viseme_RR",
  14: "viseme_nn",
  15: "viseme_SS",
  16: "viseme_CH",
  17: "viseme_TH",
  18: "viseme_FF",
  19: "viseme_DD",
  20: "viseme_kk",
  21: "viseme_PP",
};

export function Avatar(props) {
  // Configuration settings - simplified for production
  const { playAudio, headFollow, smoothMorphTarget, morphTargetSmoothing } = {
    playAudio: true,
    headFollow: true,
    smoothMorphTarget: true,
    morphTargetSmoothing: 0.5
  };

  // Audio setup
  let audio = useMemo(() => {
    let audioPath = props.response?.speechData?.audioFilePath || "";
    console.log("Audio path:", audioPath);
    return new Audio(audioPath);
  }, [props.response]);

  // Lipsync data
  let lipsync = useMemo(() => {
    return props.response?.speechData?.visemes || [];
  }, [props.response]);

  // Load the new model
  const { nodes, materials } = useGLTF("/models/men.glb");
  
  // Default animation is Sitting Idle
  const [animation, setAnimation] = useState("Sitting Idle");
  const group = useRef();

  // Load sitting idle and talking animations
  const animations = useMemo(() => {
    let anims = [];
    Object.entries(animationFiles).forEach(([name, path]) => {
      const { animations } = useFBX(path);
      animations[0].name = name;
      anims.push(animations[0]);
    });
    return anims;
  }, []);

  // Setup animations
  const { actions } = useAnimations(animations, group);

  // Handle visemes and lip-sync with avatar morphs
  useFrame(() => {
    let currentAudioTime = audio.currentTime;
    if (audio.paused || audio.ended) {
      setAnimation("Sitting Idle");
      return;
    }

    // Reset all visemes
    if (nodes.Wolf3D_Avatar?.morphTargetDictionary) {
      Object.values(azureToOculusVisemes).forEach((value) => {
        if (nodes.Wolf3D_Avatar.morphTargetDictionary[value] !== undefined) {
          if (!smoothMorphTarget) {
            nodes.Wolf3D_Avatar.morphTargetInfluences[nodes.Wolf3D_Avatar.morphTargetDictionary[value]] = 0;
          } else {
            nodes.Wolf3D_Avatar.morphTargetInfluences[nodes.Wolf3D_Avatar.morphTargetDictionary[value]] = THREE.MathUtils.lerp(
              nodes.Wolf3D_Avatar.morphTargetInfluences[nodes.Wolf3D_Avatar.morphTargetDictionary[value]],
              0,
              morphTargetSmoothing
            );
          }
        }
      });

      // Apply current viseme
      for (let i = 0; i < lipsync.length; i++) {
        let visemeId = lipsync[i].visemeId;
        let visemeOffsetTime = lipsync[i].audioOffset / 1000;
        let nextVisemeOffsetTime = lipsync[i + 1] ? lipsync[i + 1].audioOffset / 1000 : Infinity;

        if (currentAudioTime >= visemeOffsetTime && currentAudioTime < nextVisemeOffsetTime) {
          const visemeName = azureToOculusVisemes[visemeId];
          if (nodes.Wolf3D_Avatar.morphTargetDictionary[visemeName] !== undefined) {
            if (!smoothMorphTarget) {
              nodes.Wolf3D_Avatar.morphTargetInfluences[nodes.Wolf3D_Avatar.morphTargetDictionary[visemeName]] = 1;
            } else {
              nodes.Wolf3D_Avatar.morphTargetInfluences[nodes.Wolf3D_Avatar.morphTargetDictionary[visemeName]] = THREE.MathUtils.lerp(
                nodes.Wolf3D_Avatar.morphTargetInfluences[nodes.Wolf3D_Avatar.morphTargetDictionary[visemeName]],
                1,
                morphTargetSmoothing
              );
            }
          }

          // Blink occasionally
          if (Math.random() < 0.05 && nodes.Wolf3D_Avatar.morphTargetDictionary["blink"] !== undefined) {
            nodes.Wolf3D_Avatar.morphTargetInfluences[nodes.Wolf3D_Avatar.morphTargetDictionary["blink"]] = 1;
          }
          break;
        }
      }
    }
  });

  // Audio playback handling
  useEffect(() => {
    const handleAudioEnd = () => {
      const currentTime = Date.now();
      localStorage.setItem('questionStartTime', currentTime);
      console.log('Audio finished at time:', currentTime);
      // Always return to Sitting Idle when audio ends
      setAnimation("Sitting Idle");
    };

    // Initialize any default visemes if needed
    if (nodes.Wolf3D_Avatar?.morphTargetDictionary?.["viseme_I"] !== undefined) {
      nodes.Wolf3D_Avatar.morphTargetInfluences[nodes.Wolf3D_Avatar.morphTargetDictionary["viseme_I"]] = 0;
    }

    if (playAudio && audio.src) {
      audio.play();
      // Set to Sitting Talking when audio plays
      setAnimation("Sitting Talking");
      audio.addEventListener('ended', handleAudioEnd);
      
      return () => {
        audio.removeEventListener('ended', handleAudioEnd);
      };
    } else {
      setAnimation("Sitting Idle");
      audio.pause();
    }
  }, [props.response, audio, playAudio, nodes]);

  // Animation handling
  useEffect(() => {
    if (actions[animation]) {
      actions[animation].reset().fadeIn(0.5).play();
      return () => actions[animation].fadeOut(0.5);
    } else {
      console.error(`Animation "${animation}" not found.`);
    }
  }, [animation, actions]);

  // Head following
  useFrame((state) => {
    if (headFollow && group.current) {
      const head = group.current.getObjectByName("Head");
      if (head) {
        head.lookAt(state.camera.position);
      }
    }
  });

  return (
    <group {...props} dispose={null} ref={group}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        name="Wolf3D_Avatar"
        geometry={nodes.Wolf3D_Avatar.geometry}
        material={materials.Wolf3D_Avatar}
        skeleton={nodes.Wolf3D_Avatar.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Avatar.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Avatar.morphTargetInfluences}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Avatar_Transparent.geometry}
        material={materials.Wolf3D_Avatar_Transparent}
        skeleton={nodes.Wolf3D_Avatar_Transparent.skeleton}
      />
    </group>
  );
}

useGLTF.preload("/models/men.glb");