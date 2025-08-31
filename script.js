import { Viewer, utils } from '@photo-sphere-viewer/core';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';

const animatedValues = {
    pitch: { start: -Math.PI / 2, end: 0 },
    yaw: { start: Math.PI / 2, end: 0 },
    zoom: { start: 0, end: 50 },
    maxFov: { start: 130, end: 90 },
    fisheye: { start: 2, end: 0 },
};

const tourPanoramas = [
    {
        id: 'pano1',
        panorama: 'bon/test5.JPG',
        links: [
            {
                nodeId: 'pano2',
                position: { yaw: '90deg', pitch: '0deg' },
            },
            {
                nodeId: 'pano3',
                position: { yaw: '0deg', pitch: '10deg' },
                tooltip: 'Aller au bâtiment',
            },
        ],
        // Ajout des marqueurs pour ce panorama
        markers: [
            {
                id: 'info-marker-pano1',
                position: { yaw: '50deg', pitch: '20deg' },
                html: '<div style="background: white; border-radius: 50%; padding: 5px;">📍</div>',
                tooltip: 'Informations sur ce panorama.',
            },
        ],
    },
    {
        id: 'pano2',
        panorama: 'bon/test7.JPG',
        links: [
            {
                nodeId: 'pano1',
                position: { yaw: '270deg', pitch: '0deg' },
            },
            {
                nodeId: 'pano4',
                position: { yaw: '150deg', pitch: '5deg' },
                tooltip: 'Aller à la fontaine',
            },
        ],
        // Ajout des marqueurs pour ce panorama
        markers: [
            {
                id: 'info-marker-pano2',
                position: { yaw: '220deg', pitch: '0deg' },
                html: '<div style="background: white; border-radius: 50%; padding: 5px;">🏛️</div>',
                tooltip: 'Informations sur la fontaine.',
            },
        ],
    },
    {
        id: 'pano3',
        panorama: 'bon/test2.JPG',
        links: [
            {
                nodeId: 'pano1',
                position: { yaw: '180deg', pitch: '0deg' },
            },
            {
                nodeId: 'pano5',
                position: { yaw: '60deg', pitch: '0deg' },
                tooltip: 'Aller à la place publique',
            },
        ],
        // Ajout des marqueurs pour ce panorama
        markers: [
            {
                id: 'info-marker-pano3',
                position: { yaw: '100deg', pitch: '5deg' },
                html: '<div style="background: white; border-radius: 50%; padding: 5px;">🌳</div>',
                tooltip: 'Informations sur le bâtiment.',
            },
        ],
    },
    {
        id: 'pano4',
        panorama: 'bon/test4.JPG',
        links: [
            {
                nodeId: 'pano2',
                position: { yaw: '30deg', pitch: '0deg' },
            },
            {
                nodeId: 'pano6',
                position: { yaw: '200deg', pitch: '-5deg' },
                tooltip: 'Aller à la vue sur la ville',
            },
        ],
        // Ajout des marqueurs pour ce panorama
        markers: [
            {
                id: 'info-marker-pano4',
                position: { yaw: '300deg', pitch: '10deg' },
                html: '<div style="background: white; border-radius: 50%; padding: 5px;">🏞️</div>',
                tooltip: 'Vue sur la ville.',
            },
        ],
    },
    {
        id: 'pano5',
        panorama: 'bon/test2.JPG',
        links: [
            {
                nodeId: 'pano3',
                position: { yaw: '240deg', pitch: '0deg' },
            },
        ],
        // Ajout des marqueurs pour ce panorama
        markers: [
            {
                id: 'info-marker-pano5',
                position: { yaw: '150deg', pitch: '0deg' },
                html: '<div style="background: white; border-radius: 50%; padding: 5px;">⛲</div>',
                tooltip: 'La place publique.',
            },
        ],
    },
    {
        id: 'pano6',
        panorama: 'bon/test6.JPG',
        links: [
            {
                nodeId: 'pano4',
                position: { yaw: '20deg', pitch: '5deg' },
            },
        ],
        // Ajout des marqueurs pour ce panorama
        markers: [
            {
                id: 'info-marker-pano6',
                position: { yaw: '120deg', pitch: '10deg' },
                html: '<div style="background: white; border-radius: 50%; padding: 5px;">🏙️</div>',
                tooltip: 'Vue sur la ville.',
            },
        ],
    },
];

const viewer = new Viewer({
    container: 'viewer',
    plugins: [
        AutorotatePlugin.withConfig({
            autostartDelay: null,
            autostartOnIdle: false,
            autorotatePitch: 0,
        }),
        VirtualTourPlugin.withConfig({
            nodes: tourPanoramas,
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
            title: 'Rerun animation',
            content: '🔄',
            onClick: reset,
        },
        '',
        'fullscreen',
    ],
});

const autorotate = viewer.getPlugin(AutorotatePlugin);
const virtualTour = viewer.getPlugin(VirtualTourPlugin);

let isInit = true;

viewer.addEventListener('click', ({ data }) => {
    console.log(`Coordonnées du clic - Yaw: ${data.yaw}°, Pitch: ${data.pitch}°`);
    if (isInit) {
        intro(data.pitch, data.yaw);
    }
});

viewer.addEventListener('ready', () => {
    viewer.navbar.hide();
    virtualTour.addEventListener('node-changed', ({ node }) => {
        console.log(`Le panorama a changé. Le nouveau noeud est ${node.id}`);
    });
    setTimeout(() => {
        if (isInit) {
            intro(animatedValues.pitch.end, animatedValues.pitch.end);
        }
    }, 5000);
}, { once: true });

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