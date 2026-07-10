import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// ===== AVATAR 3D ANIMÉ (guide de visite) =====
// Modèle GLB animé injecté dans la scène three.js de Photo Sphere Viewer.
// La caméra PSV est à l'origine (0,0,0) ; la sphère panoramique a un rayon de 10.
// On place donc l'avatar À L'INTÉRIEUR de cette sphère, devant la caméra, au sol.

// --- Constantes de réglage (à ajuster visuellement) ---
// Avatar humain (Ready Player Me, homme en costume). Les avatars RPM sont
// exportés SANS animation (pose T) : on charge donc une animation idle séparée
// depuis la bibliothèque officielle RPM et on l'applique au squelette au runtime.
// Pour mettre TON propre avatar : crée-le sur readyplayer.me (tenue costume) et
// colle son URL .glb ici. L'échelle et l'animation s'appliquent automatiquement.
const AVATAR_MODEL_URL =
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js/examples/models/gltf/Soldier.glb';

// Animation appliquée si le modèle n'en contient pas (idle RPM masculine).
// Mets à null si ton modèle embarque déjà ses propres animations.
const ANIMATION_URL = null;

const AVATAR_DISTANCE = 6;        // distance depuis la caméra (max ~9, sphère = 10)
const AVATAR_YAW_DEG = 0;         // angle horizontal où placer l'avatar (0 = devant à l'init)
const AVATAR_FEET_HEIGHT = -2.7;  // hauteur des pieds (négatif = vers le sol)
const AVATAR_TARGET_HEIGHT = 3.2; // hauteur du personnage en unités monde (auto-échelle)
const FACING_OFFSET_DEG = 180;    // correction d'orientation (Soldier=180, avatar RPM=0)

// Convertit un yaw PSV + une distance en position monde three.js.
// Mapping vérifié : direction monde = (-sin(yaw), 0, cos(yaw)) pour le yaw PSV.
function placeOnFloor(yawDeg, distance, height) {
    const yaw = THREE.MathUtils.degToRad(yawDeg);
    return new THREE.Vector3(
        -distance * Math.sin(yaw),
        height,
        distance * Math.cos(yaw),
    );
}

export function initAvatar(viewer) {
    const renderer = viewer.renderer;

    // --- Éclairage (le panorama n'a aucune lumière : un modèle PBR serait noir sans ça) ---
    const hemi = new THREE.HemisphereLight(0xffffff, 0x606060, 3.5);
    hemi.position.set(0, 20, 0);
    renderer.addObject(hemi);

    // Lumière principale placée côté visiteur (z négatif) pour éclairer la face
    // de l'avatar tournée vers la caméra.
    const dir = new THREE.DirectionalLight(0xffffff, 3.0);
    dir.position.set(-2, 9, -6);
    renderer.addObject(dir);

    // --- Conteneur de l'avatar ---
    const group = new THREE.Group();
    group.position.copy(placeOnFloor(AVATAR_YAW_DEG, AVATAR_DISTANCE, AVATAR_FEET_HEIGHT));
    renderer.addObject(group);

    const clock = new THREE.Clock();
    let mixer = null;

    // Choisit une animation par mot-clé (insensible à la casse), sinon repli.
    function pickClip(clips, keyword) {
        return clips.find((c) => new RegExp(keyword, 'i').test(c.name));
    }

    // Mesure fiable de la taille d'un modèle : on unit les bounding-box de
    // GÉOMÉTRIE des meshes (setFromObject est faux sur les SkinnedMesh / RPM).
    function measureModel(model) {
        model.updateMatrixWorld(true);
        const box = new THREE.Box3();
        const tmp = new THREE.Box3();
        model.traverse((o) => {
            if (o.isMesh && o.geometry) {
                o.geometry.computeBoundingBox();
                tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
                box.union(tmp);
            }
        });
        return box;
    }

    // --- Chargement du modèle GLB (avec support Draco pour les modèles compressés) ---
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);
    loader.load(
        AVATAR_MODEL_URL,
        (gltf) => {
            const model = gltf.scene;
            model.rotation.y = THREE.MathUtils.degToRad(FACING_OFFSET_DEG);

            // Auto-échelle vers une hauteur humaine réaliste, pieds posés au sol.
            const box = measureModel(model);
            const height = box.max.y - box.min.y;
            const scale = AVATAR_TARGET_HEIGHT / (height || 1);
            model.scale.setScalar(scale);
            model.position.y = -box.min.y * scale; // pieds à l'origine du groupe
            group.add(model);

            mixer = new THREE.AnimationMixer(model);

            // Joue une liste de clips : salut (une fois) puis boucle idle, ou idle direct.
            function playClips(clips) {
                const idleClip = pickClip(clips, 'idle|stand') || clips[0];
                const greetClip = pickClip(clips, 'wave|greet|hello|salut');
                const idle = idleClip && mixer.clipAction(idleClip);
                const greet = greetClip && greetClip !== idleClip && mixer.clipAction(greetClip);

                if (greet) {
                    greet.setLoop(THREE.LoopOnce, 1);
                    greet.clampWhenFinished = true;
                    greet.play();
                    mixer.addEventListener('finished', () => {
                        if (idle) {
                            idle.reset().play();
                            greet.crossFadeTo(idle, 0.4, false);
                        }
                    });
                } else if (idle) {
                    idle.play();
                }
                console.log('🧍 Avatar humain animé :', clips.map((a) => a.name).join(', ') || '(aucune animation)');
            }

            // Priorité à l'animation externe (idle plein corps) si fournie : les
            // avatars RPM n'embarquent que des micro-animations (doigts, yeux) et
            // resteraient en pose T sans un idle de corps. Sinon, on joue les
            // animations du modèle (cas d'un GLB déjà animé, type Soldier).
            if (ANIMATION_URL) {
                loader.load(
                    ANIMATION_URL,
                    (animGltf) => playClips(animGltf.animations),
                    undefined,
                    (err) => {
                        console.error('❌ Échec du chargement de l’animation :', err);
                        playClips(gltf.animations);
                    },
                );
            } else {
                playClips(gltf.animations);
            }
        },
        undefined,
        (err) => console.error('❌ Échec du chargement de l’avatar 3D :', err),
    );

    // --- Boucle d'animation : met à jour le mixer, oriente l'avatar vers le
    //     visiteur et force PSV à refaire un rendu à chaque frame ---
    function tick() {
        const delta = clock.getDelta();
        if (mixer) {
            mixer.update(delta);
            // L'avatar reste toujours tourné vers la caméra (origine)
            group.lookAt(0, group.position.y, 0);
        }
        viewer.needsUpdate();
        requestAnimationFrame(tick);
    }
    tick();

    return group;
}
