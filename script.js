import { Viewer, utils } from '@photo-sphere-viewer/core';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { initAvatar } from './avatar.js';

// ===== CONFIGURATION =====
const animatedValues = {
    pitch: { start: -Math.PI / 2, end: 0 },
    yaw: { start: Math.PI / 2, end: 0 },
    zoom: { start: 0, end: 50 },
    maxFov: { start: 130, end: 90 },
    fisheye: { start: 2, end: 0 },
};

// ===== PANORAMAS (sans links pour éviter les hotspots par défaut) =====
const tourNodes = [
    { id: 'pano1', name: 'Accueil', panorama: 'bon/Gemini_Generated_Image_v9ijtav9ijtav9ij.png' },
    { id: 'pano2', name: 'Salle de formation', panorama: 'bon/Gemini_Generated_Image_cqphe4cqphe4cqph.png' },
    { id: 'pano3', name: 'Bâtiment Historique', panorama: 'bon/test2.JPG' },
    { id: 'pano4', name: 'Salle CertifBox', panorama: 'bon/Gemini_Generated_Image_k2tf19k2tf19k2tf.png' },
    { id: 'pano5', name: 'Place Publique', panorama: 'bon/test2.JPG' },
    { id: 'pano6', name: 'Salle à manger', panorama: 'bon/Gemini_Generated_Image_gl5ndqgl5ndqgl5n.jpeg' },
];

// ===== HOTSPOTS DE NAVIGATION (séparés des panoramas) =====
// type: 'floor' = cercle bleu au sol, 'chevron' = flèche directionnelle
// direction: 'up', 'down', 'left', 'right' (pour chevron)
const navigationHotspots = {
    'pano1': [
        { targetId: 'pano2', position: { yaw: '55deg', pitch: '-0.10deg' }, name: 'Salle de formation', type: 'floor' },
    ],
    'pano2': [
        { targetId: 'pano1', position: { yaw: '-135deg', pitch: '-30deg' }, name: 'Retour Accueil', type: 'floor' },
        { targetId: 'pano4', position: { yaw: '60deg', pitch: '-30deg' }, name: 'Salle CertifBox', type: 'floor' },
    ],
    'pano3': [
        { targetId: 'pano1', position: { yaw: '-90deg', pitch: '-30deg' }, name: 'Retour Accueil', type: 'floor' },
        { targetId: 'pano5', position: { yaw: '90deg', pitch: '5deg' }, name: 'Étage supérieur', type: 'chevron', direction: 'up' },
    ],
    'pano4': [
        { targetId: 'pano2', position: { yaw: '-120deg', pitch: '-30deg' }, name: 'Salle de formation', type: 'floor' },
        { targetId: 'pano6', position: { yaw: '45deg', pitch: '-30deg' }, name: 'Salle à manger', type: 'floor' },
    ],
    'pano5': [
        { targetId: 'pano3', position: { yaw: '-90deg', pitch: '15deg' }, name: 'Redescendre', type: 'chevron', direction: 'down' },
    ],
    'pano6': [
        { targetId: 'pano4', position: { yaw: '-135deg', pitch: '-30deg' }, name: 'Salle CertifBox', type: 'floor' },
        { targetId: 'pano1', position: { yaw: '45deg', pitch: '-30deg' }, name: 'Retour Accueil', type: 'floor' },
    ],
};

// ===== HOTSPOTS "REGARDER" (rotation caméra dans le même panorama, sans changer de scène) =====
const lookHotspots = {
    'pano1': [
        { position: { yaw: '-145deg', pitch: '-30deg' }, zoom: 55, name: 'Réception' },
        { position: { yaw: '-10deg', pitch: '-35deg' }, zoom: 55, name: 'Espace salon' },
        { position: { yaw: '100deg', pitch: '-30deg' }, zoom: 55, name: 'Ascenseurs' },
        { position: { yaw: '165deg', pitch: '-30deg' }, zoom: 55, name: 'Sortie' },
    ],
};

// ===== CRÉATION DU HTML POUR LES HOTSPOTS =====

// Hotspot au sol (cercle jaune avec pulsation)
function createFloorHotspotHTML(name) {
    return `
        <div class="hotspot-nav">
            <div class="hotspot-nav-inner">
                <div class="hotspot-pulse-ring"></div>
                <div class="hotspot-circle">
                    <span class="hotspot-arrow">↓</span>
                </div>
            </div>
            <div class="hotspot-tooltip">${name}</div>
        </div>
    `;
}

// Hotspot directionnel (chevron jaune)
function createChevronHotspotHTML(name, direction = 'down') {
    const arrow = direction === 'up' ? '↑' : direction === 'left' ? '←' : direction === 'right' ? '→' : '↓';
    return `
        <div class="hotspot-nav">
            <div class="hotspot-nav-inner">
                <div class="hotspot-pulse-ring"></div>
                <div class="hotspot-circle">
                    <span class="hotspot-arrow">${arrow}</span>
                </div>
            </div>
            <div class="hotspot-tooltip">${name}</div>
        </div>
    `;
}

// Hotspot "regarder" (cercle bleu, reste dans le même panorama)
function createLookHotspotHTML(name) {
    return `
        <div class="hotspot-nav hotspot-look">
            <div class="hotspot-nav-inner">
                <div class="hotspot-pulse-ring hotspot-look-ring"></div>
                <div class="hotspot-circle hotspot-look-circle">
                    <span class="hotspot-arrow">👁</span>
                </div>
            </div>
            <div class="hotspot-tooltip">${name}</div>
        </div>
    `;
}

// ===== INITIALISATION DU VIEWER =====
const viewer = new Viewer({
    container: 'viewer',
    plugins: [
        AutorotatePlugin.withConfig({
            autostartDelay: null,
            autostartOnIdle: false,
            autorotatePitch: 0,
        }),
        MarkersPlugin.withConfig({
            markers: [],
        }),
        VirtualTourPlugin.withConfig({
            nodes: tourNodes, // Nodes SANS links = pas de hotspots par défaut
            startNodeId: 'pano1',
        }),
    ],
    defaultPitch: animatedValues.pitch.start,
    defaultYaw: animatedValues.yaw.start,
    defaultZoomLvl: animatedValues.zoom.start,
    maxFov: animatedValues.maxFov.start,
    fisheye: animatedValues.fisheye.start,
    mousemove: false,
    mousewheel: false,
    navbar: [
        'autorotate',
        'zoom',
        {
            title: 'Réinitialiser',
            content: '🔄',
            onClick: reset,
        },
        '',
        'fullscreen',
    ],
});

const autorotate = viewer.getPlugin(AutorotatePlugin);
const virtualTour = viewer.getPlugin(VirtualTourPlugin);
const markersPlugin = viewer.getPlugin(MarkersPlugin);

// Élément de localisation
const locationEl = document.getElementById('current-location');

// ===== GESTION DES HOTSPOTS ANCRÉS =====
function updateHotspots(nodeId) {
    // Trouver le panorama actuel
    const currentNode = tourNodes.find(p => p.id === nodeId);
    const hotspots = navigationHotspots[nodeId] || [];

    // Mettre à jour le nom du lieu
    if (locationEl && currentNode) {
        locationEl.textContent = currentNode.name;
    }

    // Supprimer les anciens marqueurs
    markersPlugin.clearMarkers();

    // Créer les nouveaux hotspots de navigation
    hotspots.forEach((hotspot, index) => {
        let html;
        if (hotspot.type === 'chevron') {
            html = createChevronHotspotHTML(hotspot.name, hotspot.direction || 'down');
        } else {
            html = createFloorHotspotHTML(hotspot.name);
        }

        markersPlugin.addMarker({
            id: `nav-${hotspot.targetId}-${index}`,
            position: hotspot.position,
            html: html,
            anchor: 'bottom center',
            data: {
                targetNode: hotspot.targetId,
                type: 'navigation'
            }
        });
    });

    // Créer les hotspots "regarder" (déplacement de la caméra dans la même salle)
    const lookPoints = lookHotspots[nodeId] || [];
    lookPoints.forEach((point, index) => {
        markersPlugin.addMarker({
            id: `look-${index}`,
            position: point.position,
            html: createLookHotspotHTML(point.name),
            anchor: 'bottom center',
            data: {
                type: 'look',
                target: { yaw: point.position.yaw, pitch: point.position.pitch, zoom: point.zoom }
            }
        });
    });

    console.log(`📍 Hotspots créés pour ${nodeId}: ${hotspots.length} navigation + ${lookPoints.length} regarder`);
}

// ===== EFFETS IMMERSIFS =====
const motionOverlay = document.getElementById('motion-overlay');
const viewerContainer = document.getElementById('viewer');

function triggerImmersiveTransition(targetNode) {
    // 1. Activer les lignes de vitesse + flash + vignette
    motionOverlay.classList.add('active');
    
    // 2. Vibration du viewer (tremblement de caméra)
    viewerContainer.classList.add('camera-shake');
    
    // 3. Vibration haptique si le device le supporte (mobile)
    if (navigator.vibrate) {
        navigator.vibrate([30, 20, 50, 20, 30]);
    }

    // 4. Micro-tremblements de la caméra dans le panorama
    const pos = viewer.getPosition();
    const shakeIntensity = 0.015;
    let shakeCount = 0;
    const shakeInterval = setInterval(() => {
        const offsetYaw = (Math.random() - 0.5) * shakeIntensity;
        const offsetPitch = (Math.random() - 0.5) * shakeIntensity;
        viewer.rotate({
            yaw: pos.yaw + offsetYaw,
            pitch: pos.pitch + offsetPitch,
        });
        shakeCount++;
        if (shakeCount > 8) clearInterval(shakeInterval);
    }, 30);

    // 5. Zoom avant rapide
    const startZoom = viewer.getZoomLevel();
    new utils.Animation({
        properties: {
            zoom: { start: startZoom, end: 100 },
        },
        duration: 250,
        easing: 'inOutQuad',
        onTick: (properties) => {
            viewer.zoom(properties.zoom);
        },
    }).then(() => {
        // 6. Changer de scène
        virtualTour.setCurrentNode(targetNode);

        // 7. Dézoom + fin des effets
        setTimeout(() => {
            new utils.Animation({
                properties: {
                    zoom: { start: 100, end: 50 },
                },
                duration: 400,
                easing: 'outQuad',
                onTick: (properties) => {
                    viewer.zoom(properties.zoom);
                },
            }).then(() => {
                isNavigating = false;
            });
            
            // Nettoyer les effets
            motionOverlay.classList.remove('active');
            viewerContainer.classList.remove('camera-shake');
        }, 200);
    });
}

// Effet "marche vers ce coin de la salle" (mêmes sensations que le changement de scène, sans changer de panorama)
function triggerLookTransition(target) {
    // 0. Stopper la rotation automatique pour qu'elle ne reprenne pas la main sur la caméra
    autorotate.stop();

    // 1. Activer les lignes de vitesse + flash + vignette
    motionOverlay.classList.add('active');

    // 2. Vibration du viewer (tremblement de caméra)
    viewerContainer.classList.add('camera-shake');

    // 3. Vibration haptique si le device le supporte (mobile)
    if (navigator.vibrate) {
        navigator.vibrate([20, 15, 30]);
    }

    // 4. Zoom avant rapide (sensation d'avancer)
    const startZoom = viewer.getZoomLevel();
    new utils.Animation({
        properties: {
            zoom: { start: startZoom, end: 100 },
        },
        duration: 220,
        easing: 'inOutQuad',
        onTick: (properties) => {
            viewer.zoom(properties.zoom);
        },
    }).then(() => {
        // 5. On tourne vers le nouveau point de vue pendant le pic de zoom (masqué par le flou de mouvement)
        viewer.rotate({ yaw: target.yaw, pitch: target.pitch });

        // 6. Dézoom sur le point d'arrivée + fin des effets
        setTimeout(() => {
            new utils.Animation({
                properties: {
                    zoom: { start: 100, end: target.zoom },
                },
                duration: 380,
                easing: 'outQuad',
                onTick: (properties) => {
                    viewer.zoom(properties.zoom);
                },
            }).then(() => {
                isNavigating = false;
                autorotate.start();
            });

            motionOverlay.classList.remove('active');
            viewerContainer.classList.remove('camera-shake');
        }, 150);
    });
}

// ===== ÉVÉNEMENT CLIC SUR LES MARQUEURS =====
let isNavigating = false;

markersPlugin.addEventListener('select-marker', ({ marker }) => {
    if (marker.data?.type === 'navigation' && marker.data?.targetNode && !isNavigating) {
        isNavigating = true;
        console.log(`🔗 Navigation immersive vers: ${marker.data.targetNode}`);
        triggerImmersiveTransition(marker.data.targetNode);
    } else if (marker.data?.type === 'look' && !isNavigating) {
        isNavigating = true;
        console.log(`👁 Déplacement vers: ${JSON.stringify(marker.data.target)}`);
        triggerLookTransition(marker.data.target);
    }
});

// ===== ÉVÉNEMENTS DU VIEWER =====
let isInit = true;

viewer.addEventListener('click', ({ data }) => {
    console.log(`📐 Clic - Yaw: ${data.yaw.toFixed(2)}°, Pitch: ${data.pitch.toFixed(2)}°`);
    if (isInit) {
        intro(data.pitch, data.yaw);
    }
});

viewer.addEventListener('ready', () => {
    viewer.navbar.hide();
    
    // Créer les hotspots initiaux
    updateHotspots('pano1');

    // Injecter l'avatar 3D animé (guide de visite)
    initAvatar(viewer);
    
    // Mettre à jour les hotspots quand on change de panorama
    virtualTour.addEventListener('node-changed', ({ node }) => {
        console.log(`🌍 Panorama changé: ${node.id}`);
        updateHotspots(node.id);
    });
    
    setTimeout(() => {
        if (isInit) {
            intro(animatedValues.pitch.end, animatedValues.pitch.end);
        }
    }, 5000);
}, { once: true });

// ===== ANIMATION D'INTRO =====
function intro(pitch, yaw) {
    isInit = false;
    autorotate.stop();
    viewer.navbar.hide();
    
    new utils.Animation({
        properties: {
            ...animatedValues,
            pitch: { start: animatedValues.pitch.start, end: pitch },
            yaw: { start: animatedValues.yaw.start, end: yaw },
        },
        duration: 2500,
        easing: 'inOutQuad',
        onTick: (properties) => {
            viewer.setOptions({
                fisheye: properties.fisheye,
                maxFov: properties.maxFov,
            });
            viewer.rotate({ yaw: properties.yaw, pitch: properties.pitch });
            viewer.zoom(properties.zoom);
        },
    }).then(() => {
        autorotate.start();
        viewer.navbar.show();
        viewer.setOptions({
            mousemove: true,
            mousewheel: true,
        });
    });
}

// ===== RÉINITIALISATION =====
function reset() {
    isInit = true;
    autorotate.stop();
    viewer.navbar.hide();
    viewer.setOptions({
        mousemove: false,
        mousewheel: false,
    });
    
    new utils.Animation({
        properties: {
            pitch: { start: viewer.getPosition().pitch, end: animatedValues.pitch.start },
            yaw: { start: viewer.getPosition().yaw, end: animatedValues.yaw.start },
            zoom: { start: viewer.getZoomLevel(), end: animatedValues.zoom.start },
            maxFov: { start: animatedValues.maxFov.end, end: animatedValues.maxFov.start },
            fisheye: { start: animatedValues.fisheye.end, end: animatedValues.fisheye.start },
        },
        duration: 1500,
        easing: 'inOutQuad',
        onTick: (properties) => {
            viewer.setOptions({
                fisheye: properties.fisheye,
                maxFov: properties.maxFov,
            });
            viewer.rotate({ yaw: properties.yaw, pitch: properties.pitch });
            viewer.zoom(properties.zoom);
        },
    });
}

// ===== DEBUG =====
console.log('🎮 Photo Sphere Viewer - Visite Immersive');
console.log('📐 Cliquez pour voir les coordonnées yaw/pitch');
console.log('🎯 Hotspots ancrés via MarkersPlugin');
