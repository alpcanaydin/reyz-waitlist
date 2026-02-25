'use client';

import { Mesh, Program, Renderer, Triangle, Vec3 } from 'ogl';
import { useEffect, useRef } from 'react';

// Shader code inlined for portability
const vertexShader = `attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;
uniform float uNoiseStrength;
uniform float uMode; // 0=Mesh, 1=Aurora, 2=Grainy, 3=DeepSea, 4=Holographic, 5=Flow, 6=Radiant, 7=Kaleidoscope

// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Hue Shift
vec3 hueShift(vec3 color, float shift) {
    vec3 k = vec3(0.57735, 0.57735, 0.57735);
    float cosAngle = cos(shift);
    return vec3(color * cosAngle + cross(k, color) * sin(shift) + k * dot(k, color) * (1.0 - cosAngle));
}

// Voronoi / Caustics
vec2 hash2(vec2 p) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

float voronoi(vec2 uv, float time) {
    vec2 n = floor(uv);
    vec2 f = fract(uv);
    float m = 1.0;
    for(int j=-1; j<=1; j++) {
        for(int i=-1; i<=1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = hash2(n + g);
            o = 0.5 + 0.5 * sin(time + 6.2831 * o);
            vec2 r = g - f + o;
            float d = length(r);
            m = min(m, d);
        }
    }
    return m;
}

// Vibrance boost — selectively saturates desaturated midtones to prevent muddy blending
vec3 vibranceBoost(vec3 c, float amount) {
    float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
    float maxC = max(c.r, max(c.g, c.b));
    float minC = min(c.r, min(c.g, c.b));
    float sat = (maxC > 0.001) ? (maxC - minC) / maxC : 0.0;
    float boost = amount * (1.0 - sat);
    return mix(vec3(luma), c, 1.0 + boost);
}

void main() {
    vec2 uv = vUv;
    float time = uTime * 0.2;
    vec3 color = vec3(0.0);

    if (uMode < 0.5) {
         // --- MESH MODE (0) ---
         float noiseScale = 1.5;
         float warpStrength = 0.2;
         float moveScale = 0.1;
         float falloff = 0.1;

         float n = snoise(vec2(uv.x * noiseScale + time, uv.y * noiseScale - time));
         vec2 warpedUv = uv + vec2(n * warpStrength);

         vec2 p0 = vec2(0.5, 0.5);
         vec2 p1 = vec2(0.2, 0.2) + vec2(sin(time * 0.5) * moveScale, cos(time * 0.6) * moveScale);
         vec2 p2 = vec2(0.8, 0.2) + vec2(cos(time * 0.7) * moveScale, sin(time * 0.4) * moveScale);
         vec2 p3 = vec2(0.2, 0.8) + vec2(sin(time * 0.3) * moveScale, cos(time * 0.5) * moveScale);
         vec2 p4 = vec2(0.8, 0.8) + vec2(cos(time * 0.4) * moveScale, sin(time * 0.6) * moveScale);

         float w0 = 1.0 / (length(warpedUv - p0) * length(warpedUv - p0) + falloff);
         float w1 = 1.0 / (length(warpedUv - p1) * length(warpedUv - p1) + falloff);
         float w2 = 1.0 / (length(warpedUv - p2) * length(warpedUv - p2) + falloff);
         float w3 = 1.0 / (length(warpedUv - p3) * length(warpedUv - p3) + falloff);
         float w4 = 1.0 / (length(warpedUv - p4) * length(warpedUv - p4) + falloff);

         float total = w0 + w1 + w2 + w3 + w4;
         color = (uColor1 * w0 + uColor2 * w1 + uColor3 * w2 + uColor4 * w3 + uColor5 * w4) / total;

    } else if (uMode > 0.5 && uMode < 1.5) {
         // --- AURORA MODE (1) - Dreamy Northern Lights ---
         // FBM for organic curtain displacement (not rigid sine waves)
         float fbm = snoise(vec2(uv.x * 1.2 + time * 0.1, uv.y * 0.5)) * 0.5
                   + snoise(vec2(uv.x * 2.5 - time * 0.15, uv.y * 0.8 + time * 0.05)) * 0.25
                   + snoise(vec2(uv.x * 5.0 + time * 0.08, uv.y * 1.5)) * 0.125;

         // Displace vertical position with noise for organic band shapes
         float dy = uv.y + fbm * 0.15;

         // Wide, heavily overlapping bands — colors bleed into each other
         float band1 = smoothstep(0.0, 0.35, dy) * smoothstep(0.65, 0.25, dy);
         float band2 = smoothstep(0.15, 0.50, dy) * smoothstep(0.80, 0.40, dy);
         float band3 = smoothstep(0.30, 0.60, dy) * smoothstep(0.90, 0.55, dy);
         float band4 = smoothstep(0.45, 0.70, dy) * smoothstep(1.0, 0.65, dy);

         // Soft shimmer — low frequency noise modulation
         float shimmer = snoise(vec2(uv.x * 3.0 + time * 0.4, uv.y * 1.5 - time * 0.1)) * 0.5 + 0.5;
         shimmer = shimmer * 0.6 + 0.4;

         // Base: weighted mesh blend so user colors are always visible
         float moveScale = 0.2;
         float falloff = 0.3;
         vec2 wUv = uv + vec2(fbm * 0.1);
         vec2 p0 = vec2(0.5, 0.5);
         vec2 p1 = vec2(0.2, 0.3) + vec2(sin(time * 0.3) * moveScale, cos(time * 0.4) * moveScale);
         vec2 p2 = vec2(0.8, 0.3) + vec2(cos(time * 0.5) * moveScale, sin(time * 0.3) * moveScale);
         vec2 p3 = vec2(0.2, 0.7) + vec2(sin(time * 0.2) * moveScale, cos(time * 0.3) * moveScale);
         vec2 p4 = vec2(0.8, 0.7) + vec2(cos(time * 0.3) * moveScale, sin(time * 0.4) * moveScale);
         float bw0 = 1.0 / (length(wUv - p0) * length(wUv - p0) + falloff);
         float bw1 = 1.0 / (length(wUv - p1) * length(wUv - p1) + falloff);
         float bw2 = 1.0 / (length(wUv - p2) * length(wUv - p2) + falloff);
         float bw3 = 1.0 / (length(wUv - p3) * length(wUv - p3) + falloff);
         float bw4 = 1.0 / (length(wUv - p4) * length(wUv - p4) + falloff);
         float bTotal = bw0 + bw1 + bw2 + bw3 + bw4;
         vec3 baseGrad = (uColor1*bw0 + uColor2*bw1 + uColor3*bw2 + uColor4*bw3 + uColor5*bw4) / bTotal;

         // Aurora glow: each band carries a different user color
         vec3 auroraGlow = vec3(0.0);
         auroraGlow += uColor2 * band1 * shimmer * 0.6;
         auroraGlow += uColor3 * band2 * shimmer * 0.5;
         auroraGlow += uColor4 * band3 * shimmer * 0.45;
         auroraGlow += uColor5 * band4 * shimmer * 0.4;

         // Vertical fade so edges are soft
         float vFade = smoothstep(0.0, 0.25, uv.y) * smoothstep(1.0, 0.75, uv.y);

         // Composite: base gradient + additive aurora glow + color interaction
         color = baseGrad * 0.6 + auroraGlow * vFade + baseGrad * auroraGlow * 0.5;

    } else if (uMode > 1.5 && uMode < 2.5) {
         // --- GRAINY MODE (2) - Gradient-First with Animated Artistic Grain ---
         // Step 1: Smooth mesh gradient (base, identical to mode 0)
         float noiseScale = 1.5;
         float warpStrength = 0.2;
         float moveScale = 0.1;
         float falloff = 0.1;

         float n = snoise(vec2(uv.x * noiseScale + time, uv.y * noiseScale - time));
         vec2 warpedUv = uv + vec2(n * warpStrength);

         vec2 p0 = vec2(0.5, 0.5);
         vec2 p1 = vec2(0.2, 0.2) + vec2(sin(time * 0.5) * moveScale, cos(time * 0.6) * moveScale);
         vec2 p2 = vec2(0.8, 0.2) + vec2(cos(time * 0.7) * moveScale, sin(time * 0.4) * moveScale);
         vec2 p3 = vec2(0.2, 0.8) + vec2(sin(time * 0.3) * moveScale, cos(time * 0.5) * moveScale);
         vec2 p4 = vec2(0.8, 0.8) + vec2(cos(time * 0.4) * moveScale, sin(time * 0.6) * moveScale);

         float w0 = 1.0 / (length(warpedUv - p0) * length(warpedUv - p0) + falloff);
         float w1 = 1.0 / (length(warpedUv - p1) * length(warpedUv - p1) + falloff);
         float w2 = 1.0 / (length(warpedUv - p2) * length(warpedUv - p2) + falloff);
         float w3 = 1.0 / (length(warpedUv - p3) * length(warpedUv - p3) + falloff);
         float w4 = 1.0 / (length(warpedUv - p4) * length(warpedUv - p4) + falloff);

         float total = w0 + w1 + w2 + w3 + w4;
         vec3 smoothGrad = (uColor1 * w0 + uColor2 * w1 + uColor3 * w2 + uColor4 * w3 + uColor5 * w4) / total;

         // Step 2: Animated stipple overlay (risograph/printed paper texture)
         // Animate grain by slowly drifting the cell coordinate space
         float grainTime = time * 0.3;
         vec2 grainDrift = vec2(
             sin(grainTime * 0.7) * 30.0 + grainTime * 8.0,
             cos(grainTime * 0.5) * 25.0 + grainTime * 5.0
         );
         vec2 animatedCoord = gl_FragCoord.xy + grainDrift;

         // Multi-scale grain: large and small particles
         float cellSizeLg = 200.0;
         float cellSizeSm = 80.0;

         // Large grain layer
         vec2 cellCoord = floor(animatedCoord / cellSizeLg);
         vec2 cellFrac = fract(animatedCoord / cellSizeLg);

         float cellRand1 = fract(sin(dot(cellCoord, vec2(127.1, 311.7))) * 43758.5453);
         float cellRand2 = fract(sin(dot(cellCoord, vec2(269.5, 183.3))) * 43758.5453);
         float cellRand3 = fract(sin(dot(cellCoord, vec2(419.2, 371.9))) * 43758.5453);

         vec3 chosenColor;
         if (cellRand1 < 0.2) chosenColor = uColor1;
         else if (cellRand1 < 0.4) chosenColor = uColor2;
         else if (cellRand1 < 0.6) chosenColor = uColor3;
         else if (cellRand1 < 0.8) chosenColor = uColor4;
         else chosenColor = uColor5;

         vec3 stippleColor = mix(chosenColor, smoothGrad, 0.5);

         vec2 dotCenter = vec2(cellRand2, cellRand3);
         float dotRadius = 0.2 + cellRand2 * 0.15;
         float dist = length(cellFrac - dotCenter);
         float dotMask = smoothstep(dotRadius, dotRadius - 0.05, dist);

         // Small grain layer (finer stipple, faster drift)
         vec2 grainDrift2 = vec2(
             cos(grainTime * 0.9) * 15.0 - grainTime * 6.0,
             sin(grainTime * 0.6) * 20.0 + grainTime * 4.0
         );
         vec2 animCoord2 = gl_FragCoord.xy + grainDrift2;
         vec2 cellCoord2 = floor(animCoord2 / cellSizeSm);
         vec2 cellFrac2 = fract(animCoord2 / cellSizeSm);

         float cRand2a = fract(sin(dot(cellCoord2, vec2(217.3, 131.5))) * 43758.5453);
         float cRand2b = fract(sin(dot(cellCoord2, vec2(169.7, 283.1))) * 43758.5453);
         float cRand2c = fract(sin(dot(cellCoord2, vec2(319.4, 471.2))) * 43758.5453);

         vec3 chosenColor2;
         if (cRand2a < 0.25) chosenColor2 = uColor1;
         else if (cRand2a < 0.5) chosenColor2 = uColor2;
         else if (cRand2a < 0.75) chosenColor2 = uColor3;
         else chosenColor2 = uColor4;

         vec3 stippleColor2 = mix(chosenColor2, smoothGrad, 0.6);
         vec2 dotCenter2 = vec2(cRand2b, cRand2c);
         float dotRadius2 = 0.15 + cRand2b * 0.1;
         float dist2 = length(cellFrac2 - dotCenter2);
         float dotMask2 = smoothstep(dotRadius2, dotRadius2 - 0.04, dist2);

         // Composite: gradient base + large stipple + fine stipple
         color = smoothGrad;
         color = mix(color, stippleColor, dotMask * 0.3);
         color = mix(color, stippleColor2, dotMask2 * 0.18);

    } else if (uMode > 2.5 && uMode < 3.5) { 
        // --- DEEP SEA MODE (Voronoi Caustics) ---
        // Layer 1: Slow swell (Simplex)
        float swell = snoise(vec2(uv.x * 1.5 + time * 0.3, uv.y * 1.0 - time * 0.2));
        
        // Base Gradient: Mix 1, 2, and 5 (Depth gradient)
        vec3 baseColor = mix(uColor1, uColor2, swell * 0.5 + 0.5);
        baseColor = mix(baseColor, uColor5, uv.y * 0.6); // Add 5th color to bottom/depth

        // Layer 2: Caustics (Inverted Voronoi)
        float v = voronoi(uv * 4.0, time * 0.8);
        float caustic = pow(1.0 - v, 4.0); 
        
        // Caustic Color: Mix 3 (Primary)
        color = baseColor + uColor3 * caustic * 0.8; 
        
        // Layer 3: Secondary Caustics (Depth)
        float v2 = voronoi(uv * 6.0 + vec2(time), time * 1.2);
        // Mix 4 for secondary lights
        color += uColor4 * pow(1.0 - v2, 3.0) * 0.4;
        
        // Vignette
        float dist = distance(uv, vec2(0.5));
        color *= (1.0 - dist * 0.6);

    } else if (uMode > 3.5 && uMode < 4.5) {
        // --- HOLOGRAPHIC MODE - Soap Bubble / Iridescent Film ---
        // Step 1: Mesh gradient base (user colors always dominant)
        float hMoveScale = 0.15;
        float hFalloff = 0.15;
        vec2 hp0 = vec2(0.5, 0.5);
        vec2 hp1 = vec2(0.2, 0.25) + vec2(sin(time * 0.4) * hMoveScale, cos(time * 0.5) * hMoveScale);
        vec2 hp2 = vec2(0.8, 0.25) + vec2(cos(time * 0.6) * hMoveScale, sin(time * 0.35) * hMoveScale);
        vec2 hp3 = vec2(0.2, 0.75) + vec2(sin(time * 0.25) * hMoveScale, cos(time * 0.45) * hMoveScale);
        vec2 hp4 = vec2(0.8, 0.75) + vec2(cos(time * 0.35) * hMoveScale, sin(time * 0.55) * hMoveScale);
        float hw0 = 1.0 / (length(uv - hp0) * length(uv - hp0) + hFalloff);
        float hw1 = 1.0 / (length(uv - hp1) * length(uv - hp1) + hFalloff);
        float hw2 = 1.0 / (length(uv - hp2) * length(uv - hp2) + hFalloff);
        float hw3 = 1.0 / (length(uv - hp3) * length(uv - hp3) + hFalloff);
        float hw4 = 1.0 / (length(uv - hp4) * length(uv - hp4) + hFalloff);
        float hTotal = hw0 + hw1 + hw2 + hw3 + hw4;
        vec3 holoBase = (uColor1*hw0 + uColor2*hw1 + uColor3*hw2 + uColor4*hw3 + uColor5*hw4) / hTotal;

        // Step 2: Soap bubble thin-film interference
        // Multiple interference layers at different scales for organic filament look
        float filmNoise1 = snoise(uv * 3.0 + vec2(time * 0.06, time * 0.04));
        float filmNoise2 = snoise(uv * 5.5 - vec2(time * 0.08, -time * 0.05));
        float filmNoise3 = snoise(uv * 8.0 + vec2(-time * 0.04, time * 0.07));

        // Optical path difference — multiple layers create swirling filaments like soap film
        float opd = (uv.x * 4.0 + uv.y * 3.0) * 1.8
                   + filmNoise1 * 2.2
                   + filmNoise2 * 1.1
                   + filmNoise3 * 0.5;

        // Thin-film spectral colors — cycle through the full rainbow
        // These are physically-inspired interference fringes
        vec3 thinFilm;
        thinFilm.r = sin(opd * 3.14159 * 2.0) * 0.5 + 0.5;
        thinFilm.g = sin(opd * 3.14159 * 2.0 + 2.094) * 0.5 + 0.5;
        thinFilm.b = sin(opd * 3.14159 * 2.0 + 4.189) * 0.5 + 0.5;

        // Also hue-shift the base gradient for harmony
        vec3 filmShifted = hueShift(holoBase, opd * 1.8 + time * 0.25);

        // Blend the raw thin-film spectrum with the palette-shifted version
        vec3 filmColor = mix(filmShifted, thinFilm, 0.35);

        // Step 3: Spatial variation — organic patches where interference is strong
        float patchNoise = snoise(uv * 2.5 + vec2(time * 0.1, time * 0.08)) * 0.5 + 0.5;
        float patchNoise2 = snoise(uv * 4.0 - vec2(time * 0.15)) * 0.5 + 0.5;
        float intensity = smoothstep(0.2, 0.8, patchNoise) * (0.6 + patchNoise2 * 0.4);

        // Step 4: Fresnel effect — stronger at edges like a real soap bubble
        float viewAngle = abs(dot(normalize(vec3(uv - 0.5, 0.8)), vec3(0.0, 0.0, 1.0)));
        float fresnel = pow(1.0 - viewAngle, 1.8);

        // Step 5: Flowing filament streaks (soap bubble drainage lines)
        float streak1 = snoise(vec2(uv.x * 1.5 + time * 0.15, uv.y * 10.0 + time * 0.08)) * 0.5 + 0.5;
        float streak2 = snoise(vec2(uv.x * 2.0 - time * 0.1, uv.y * 6.0 - time * 0.12)) * 0.5 + 0.5;
        float streakMask = pow(streak1, 2.5) * 0.18 + pow(streak2, 3.0) * 0.10;

        // Step 6: Specular highlight (moving gloss spot)
        float gloss = snoise(vec2(uv.x * 3.0 - time * 0.3, uv.y * 3.0 + time * 0.2));
        gloss = pow(max(0.0, gloss), 4.0) * 0.15;

        // Composite: stronger film interference blended with base
        float filmStrength = intensity * (fresnel * 0.5 + 0.5) * 0.55;
        color = mix(holoBase, filmColor, filmStrength);
        color += hueShift(holoBase, streakMask * 6.0) * streakMask; // iridescent streaks
        color += vec3(gloss); // specular highlight

    } else if (uMode > 4.5 && uMode < 5.5) {
        // --- IMPASTO MODE (Oil Painting on Canvas) ---
        // 1. Brush stroke height map — directional strokes at multiple scales
        // Slow time for oil painting feel (paint doesn't move fast)
        float oilTime = time * 0.3;

        // Directional brush strokes (anisotropic noise — stretched along stroke direction)
        float strokeAngle = 0.4 + snoise(uv * 0.8 + vec2(oilTime * 0.02)) * 0.3;
        vec2 strokeDir = vec2(cos(strokeAngle), sin(strokeAngle));
        vec2 strokePerp = vec2(-strokeDir.y, strokeDir.x);

        // Stroke-aligned UV for anisotropic noise
        vec2 strokeUv = vec2(dot(uv, strokeDir), dot(uv, strokePerp));

        // Large palette knife strokes
        float n1 = snoise(vec2(strokeUv.x * 2.0 + oilTime * 0.04, strokeUv.y * 4.0));
        // Medium brush strokes
        float n2 = snoise(vec2(strokeUv.x * 5.0 - oilTime * 0.06, strokeUv.y * 8.0 + oilTime * 0.03));
        // Fine bristle detail
        float n3 = snoise(vec2(strokeUv.x * 12.0 + oilTime * 0.05, strokeUv.y * 18.0));
        // Very fine canvas weave texture
        float canvasWeave = snoise(uv * 40.0) * 0.3 + snoise(uv * 60.0 + vec2(0.5)) * 0.15;

        // Combine: thick impasto strokes dominate, canvas weave is subtle
        float height = n1 * 0.45 + n2 * 0.3 + n3 * 0.15 + canvasWeave * 0.10;

        // 2. Surface normals via finite difference (thicker epsilon for paint ridges)
        vec2 d = vec2(0.004, 0.0);

        // Height at offset positions
        vec2 uvDx = uv + d;
        vec2 uvDy = uv + d.yx;
        vec2 sDx = vec2(dot(uvDx, strokeDir), dot(uvDx, strokePerp));
        vec2 sDy = vec2(dot(uvDy, strokeDir), dot(uvDy, strokePerp));

        float hxVal = snoise(vec2(sDx.x * 2.0 + oilTime * 0.04, sDx.y * 4.0)) * 0.45
                    + snoise(vec2(sDx.x * 5.0 - oilTime * 0.06, sDx.y * 8.0 + oilTime * 0.03)) * 0.3
                    + snoise(vec2(sDx.x * 12.0 + oilTime * 0.05, sDx.y * 18.0)) * 0.15
                    + (snoise(uvDx * 40.0) * 0.3 + snoise(uvDx * 60.0 + vec2(0.5)) * 0.15) * 0.10;
        float hyVal = snoise(vec2(sDy.x * 2.0 + oilTime * 0.04, sDy.y * 4.0)) * 0.45
                    + snoise(vec2(sDy.x * 5.0 - oilTime * 0.06, sDy.y * 8.0 + oilTime * 0.03)) * 0.3
                    + snoise(vec2(sDy.x * 12.0 + oilTime * 0.05, sDy.y * 18.0)) * 0.15
                    + (snoise(uvDy * 40.0) * 0.3 + snoise(uvDy * 60.0 + vec2(0.5)) * 0.15) * 0.10;

        float hx = hxVal - height;
        float hy = hyVal - height;
        vec3 normal = normalize(vec3(hx * 7.0, hy * 7.0, 1.0)); // Stronger normals for thick paint

        // 3. Dual-light setup (warm key + cool fill, like a gallery)
        vec3 keyLightDir = normalize(vec3(-0.4, 0.6, 1.0));
        vec3 fillLightDir = normalize(vec3(0.5, -0.3, 0.8));
        float keyDiffuse = max(dot(normal, keyLightDir), 0.0);
        float fillDiffuse = max(dot(normal, fillLightDir), 0.0);
        float diffuse = keyDiffuse * 0.7 + fillDiffuse * 0.3;

        // Specular: glossy wet oil paint reflection
        vec3 viewDir = vec3(0.0, 0.0, 1.0);
        float keySpec = pow(max(dot(reflect(-keyLightDir, normal), viewDir), 0.0), 16.0);
        float fillSpec = pow(max(dot(reflect(-fillLightDir, normal), viewDir), 0.0), 12.0);
        float specular = keySpec * 0.25 + fillSpec * 0.08;

        // 4. Color mixing — thick paint smearing along stroke direction
        vec2 smearUv = uv + normal.xy * 0.12 + strokeDir * n1 * 0.04;

        // Paint regions defined by noise (like palette knife application areas)
        float region1 = snoise(smearUv * 2.0 + vec2(oilTime * 0.02));
        float region2 = snoise(smearUv * 3.5 - vec2(oilTime * 0.03));

        vec3 cBase = mix(uColor1, uColor2, smoothstep(-0.3, 0.7, smearUv.y + region1 * 0.2));
        cBase = mix(cBase, uColor3, smoothstep(0.1, 0.7, region1));
        cBase = mix(cBase, uColor4, smoothstep(0.3, 0.7, region2) * 0.7);

        // Paint thickness affects saturation (thicker = richer, impasto effect)
        float thickness = smoothstep(-0.3, 0.5, height);
        cBase = mix(cBase * 0.9, cBase * 1.1, thickness);

        // 5. Composition: paint + lighting + canvas
        color = cBase * (0.65 + 0.35 * diffuse);
        color += vec3(specular) * vec3(1.0, 0.97, 0.92); // Warm-tinted specular
        color = mix(color, uColor5, smoothstep(0.65, 1.0, height) * 0.4); // Highlight peaks

        // Subtle darkening in crevices between strokes
        float ao = smoothstep(-0.5, 0.1, height);
        color *= 0.85 + 0.15 * ao;

    } else if (uMode > 5.5 && uMode < 6.5) {
        // --- SPECTRAL MODE (Prismatic Glass) ---
        // 1. Create a "glass" distortion field
        float glassNoise = snoise(uv * 1.5 + vec2(time * 0.1));
        vec2 glassDistort = vec2(glassNoise) * 0.1;
        
        // 2. Strong Dispersion (Chromatic Aberration) based on distortion
        // The more distorted the area, the more color separation we want
        float dispersionStrength = 0.03 + 0.05 * abs(glassNoise); 
        
        // 3. Channel Splitting with Domain Warping
        // We distort each channel's UV lookup differently
        vec2 uvR = uv + glassDistort * (1.0 + dispersionStrength);
        vec2 uvG = uv + glassDistort;
        vec2 uvB = uv + glassDistort * (1.0 - dispersionStrength);
        
        // Sample base gradient (Color 1 -> Color 2) using warped UVs
        // Using radial distance for a "lens" feel
        float dR = length(uvR - 0.5);
        float dG = length(uvG - 0.5);
        float dB = length(uvB - 0.5);
        
        vec3 cR = mix(uColor1, uColor2, smoothstep(0.0, 1.0, dR * 1.5));
        vec3 cG = mix(uColor1, uColor2, smoothstep(0.0, 1.0, dG * 1.5));
        vec3 cB = mix(uColor1, uColor2, smoothstep(0.0, 1.0, dB * 1.5));
        
        // 4. Spectral Interference (Rainbows)
        // High frequency bands that shift hue based on viewing angle (simulated by UV)
        float interference = sin(dR * 20.0 - time * 2.0);
        vec3 spectrum = hueShift(uColor5, interference * 2.0); // Cycle through full spectrum
        
        // Mask interference to edges of the "glass"
        float prismMask = smoothstep(0.3, 0.8, abs(glassNoise));
        
        // Compose Channels
        color.r = cR.r + spectrum.r * prismMask * 0.6;
        color.g = cG.g + spectrum.g * prismMask * 0.6;
        color.b = cB.b + spectrum.b * prismMask * 0.6;
        
        // Add "Caustic" highlights (Color 3)
        float caustic = pow(max(0.0, snoise(uv * 5.0 - vec2(time * 0.2))), 5.0);
        color += uColor3 * caustic * 0.8;
        
        // Soft Glow (Color 4)
        color += uColor4 * 0.2;

    } else if (uMode > 6.5) {
        // --- FRACTAL MODE (7) - Kaleidoscope + Orbit Traps Hybrid ---

        // Step 1: 8-sided kaleidoscope folding BEFORE fractal iteration
        // This creates the trippy mandala/symmetric vibe
        vec2 fP = uv - 0.5;
        float fA = atan(fP.y, fP.x);
        float fR = length(fP);
        float fSides = 8.0;
        float fTau = 6.2831853;
        fA = mod(fA, fTau / fSides);
        fA = abs(fA - fTau / fSides / 2.0);
        vec2 z = fR * vec2(cos(fA), sin(fA)) * 2.2; // folded + zoomed

        // Step 2: Lissajous animated Julia constant (varies shape over time)
        vec2 jc = vec2(sin(time * 0.25) * 0.7885, cos(time * 0.33) * 0.7885);

        // Step 3: 32-iteration loop with orbit trap tracking
        float fIter = 0.0;
        float trapCircle = 1e6;  // distance to circle r=0.5
        float trapCross = 1e6;   // distance to axes
        float trapOrigin = 1e6;  // distance to origin

        for (int i = 0; i < 32; i++) {
            // z = z^2 + c (Julia iteration)
            z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + jc;

            // Track orbit traps — minimum distance to geometric shapes
            trapCircle = min(trapCircle, abs(length(z) - 0.5));
            trapCross = min(trapCross, min(abs(z.x), abs(z.y)));
            trapOrigin = min(trapOrigin, dot(z, z));

            if (dot(z, z) > 256.0) break;
            fIter += 1.0;
        }

        // Step 4: Smooth escape-time coloring (anti-aliased bands)
        float smoothIter = fIter - log2(log2(dot(z, z))) + 4.0;
        float fNorm = smoothIter / 32.0;

        // Step 5: Map orbit traps to all 5 user colors
        // Each trap shape highlights different structures in the fractal
        vec3 cTrapCircle = uColor1 * exp(-trapCircle * 5.0);
        vec3 cTrapCross = uColor2 * exp(-trapCross * 8.0);
        vec3 cTrapOrigin = uColor3 * exp(-sqrt(trapOrigin) * 3.0);
        vec3 cEscape = mix(uColor4, uColor5, fract(fNorm * 3.0));

        // Blend based on whether point escaped
        float escaped = step(32.0, fIter + 0.5); // 0 if escaped, 1 if trapped
        vec3 trapColor = cTrapCircle + cTrapCross + cTrapOrigin;
        vec3 escapeColor = cEscape * (0.5 + 0.5 * sin(fNorm * 12.0 + time));

        color = mix(escapeColor, trapColor, escaped * 0.7 + 0.3);
        // Add neon glow at fractal boundary
        color += uColor5 * smoothstep(0.8, 1.0, fNorm) * 0.5;
    } else {
        color = vec3(0.0);
    }
    
    // Vibrance boost — prevent muddy midtones from linear RGB blending
    color = vibranceBoost(color, 0.3);

    // Global Noise/Grain (Dithering)
    float finalNoiseStrength = uNoiseStrength;
    if (uMode > 1.5 && uMode < 2.5) { // Grainy Mode gets extra film grain on top of stipple
        finalNoiseStrength = 0.12;
    }

    float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);

    color += (grain - 0.5) * finalNoiseStrength;
    color += (ign - 0.5) / 255.0;

    gl_FragColor = vec4(color, 1.0);
}
`;

export default function GradientCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new Renderer({
      alpha: false,
      dpr: Math.min(window.devicePixelRatio, 2),
    });
    const gl = renderer.gl;

    containerRef.current.appendChild(gl.canvas);
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';

    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new Vec3(0.965, 0.937, 1.0) },
        uColor2: { value: new Vec3(0.988, 0.878, 0.996) },
        uColor3: { value: new Vec3(0.694, 0.894, 0.984) },
        uColor4: { value: new Vec3(0.843, 0.98, 1.0) },
        uColor5: { value: new Vec3(1.0, 0.914, 0.976) },
        uNoiseStrength: { value: 0.09 },
        uMode: { value: 0 },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      renderer.setSize(
        containerRef.current?.clientWidth ?? 0,
        containerRef.current?.clientHeight ?? 0,
      );
    }
    window.addEventListener('resize', resize);
    resize();

    let animateId: number;
    let time = 0;
    const speed = 1;
    function update() {
      animateId = requestAnimationFrame(update);
      time += 0.01 * speed;
      program.uniforms.uTime.value = time;
      renderer.render({ scene: mesh });
    }
    animateId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animateId);
      if (containerRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        containerRef.current.removeChild(gl.canvas);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    />
  );
}
