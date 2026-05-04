/* ============================================
   PAPELCOOL - CHARACTER & TEXTURE DATA
   ============================================
   Este archivo contiene todos los datos de:
   - Texturas SVG para personajes
   - Configuraciones de presets
   - Enlaces raw de GitHub para texturas

   ORDEN: Del más NUEVO al más ANTIGUO (NO alfabético)
   ============================================ */

const TEXTURES_REPO_RAW_BASE = 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main';

function textureRepoUrl(...segments) {
    return `${TEXTURES_REPO_RAW_BASE}/${segments.map((segment) => encodeURIComponent(segment)).join('/')}`;
}

const minecraftTextureUrl = (character, ...segments) =>
    textureRepoUrl('Elementos', 'Texturas', 'Minecraft', character, ...segments);

const kpopTextureUrl = (character, ...segments) =>
    textureRepoUrl('Elementos', 'Texturas', 'Kpop Demon Hunters', character, ...segments);

const moratTextureUrl = (character, ...segments) =>
    textureRepoUrl('Elementos', 'Texturas', 'Morat', character, ...segments);

const basicTextureUrl = (...segments) =>
    textureRepoUrl('Elementos', 'Texturas', 'Basic-Textures', ...segments);

const textureUiAssetUrl = (...segments) =>
    textureRepoUrl('Elementos', ...segments);

function getTextureByName(collection, name) {
    return (collection || []).find((item) => item.name === name) || null;
}

function getPresetCharacterTextures(characterName) {
    return {
        eyeTexture: getTextureByName(eyeTextures, characterName),
        eyebrowTexture: getTextureByName(eyebrowTextures, characterName),
        noseTexture: getTextureByName(noseTextures, characterName) || getTextureByName(noseTextures, 'Default'),
        earTexture: getTextureByName(earTextures, characterName),
        hairTexture: getTextureByName(hairTextures, characterName),
        torsoTexture: getTextureByName(torsoClothingTextures, characterName),
        armTexture: getTextureByName(armTextures, characterName),
        legTexture: getTextureByName(legTextures, characterName)
    };
}

// --- CATALOGO DE PERSONAJES PREESTABLECIDOS ---
// ORDEN: Del más NUEVO al más ANTIGUO (NO alfabético)
const presetCatalog = Object.freeze([
    {
        name: 'Villamil-masdeloqueaposte',
        displayName: 'Villamil Más de lo que aposté',
        fandom: 'morat',
        has3dModel: false,
        pdfFile: 'Villamil-masdeloqueaposte.pdf',
        icon: moratTextureUrl('Villamil-Mas de lo que aposte', 'Villamil mas de lo que aposte-icon.svg')
    },
    {
        name: 'Villamil-faltastu',
        displayName: 'Villamil Faltas Tú',
        fandom: 'morat',
        has3dModel: false,
        pdfFile: 'Villamil-faltastu.pdf',
        icon: moratTextureUrl('Villamil-Faltastu', 'Villamil faltas tu-icon.svg')
    },
    {
        name: 'Villamil-faltastu-guitarra',
        displayName: 'Villamil Faltas Tú Guitarra',
        fandom: 'morat',
        has3dModel: false,
        pdfFile: 'Villamil-faltastu-guitarra.pdf',
        icon: moratTextureUrl('Villamil-Faltastu-Guitarra', 'Villamil faltas tu-icon.svg')
    },
    {
        name: 'Simon-masdeloqueaposte',
        displayName: 'Simon Más de lo que aposté',
        fandom: 'morat',
        has3dModel: false,
        pdfFile: 'Simon-masdeloqueaposte.pdf',
        icon: moratTextureUrl('Simon-Mas de lo que aposte', 'Simon mas de lo que aposte-icon.svg')
    },
    {
        name: 'Simon-faltastu',
        displayName: 'Simon Faltas Tú',
        fandom: 'morat',
        has3dModel: false,
        pdfFile: 'Simon-faltastu.pdf',
        icon: moratTextureUrl('Simon-Faltastu', 'Simon faltas tu-icon.svg')
    },
    {
        name: 'Simon-faltastu-bajo',
        displayName: 'Simon Faltas Tú Bajo',
        fandom: 'morat',
        has3dModel: false,
        pdfFile: 'Simon-faltastu-bajo.pdf',
        icon: moratTextureUrl('Simon-Faltastu-Bajo', 'Simon faltas tu-icon.svg')
    },
    {
        name: 'Martin-masdeloqueaposte',
        displayName: 'Martin Más de lo que aposté',
        fandom: 'morat',
        has3dModel: false,
        pdfFile: 'Martin-masdeloqueaposte.pdf',
        icon: moratTextureUrl('Martin-Mas de lo que aposte', 'Martin mas de lo que aposte-icon.svg')
    },
    {
        name: 'Martin-faltastu',
        displayName: 'Martin Faltas Tú',
        fandom: 'morat',
        has3dModel: false,
        pdfFile: 'Martin-faltastu.pdf',
        icon: moratTextureUrl('Martin-Faltastu', 'Martin faltas tu-icon.svg')
    },
    {
        name: 'Martin-faltastu-bateria',
        displayName: 'Martin Faltas Tú Batería',
        fandom: 'morat',
        has3dModel: false,
        pdfFile: 'Martin-faltastu-bateria.pdf',
        icon: moratTextureUrl('Martin-Faltastu-Bateria', 'Martin faltas tu-icon.svg')
    },
    {
        name: 'Isaza-masdeloqueaposte',
        displayName: 'Isaza Más de lo que aposté',
        fandom: 'morat',
        has3dModel: false,
        pdfFile: 'Isaza-masdeloqueaposte.pdf',
        icon: moratTextureUrl('Isaza-Mas de lo que aposte', 'Isaza mas de lo que aposte-icon.svg')
    },
    {
        name: 'Isaza-faltastu',
        displayName: 'Isaza Faltas Tú',
        fandom: 'morat',
        has3dModel: false,
        pdfFile: 'Isaza-faltastu.pdf',
        icon: moratTextureUrl('Isaza-Faltastu', 'Isaza faltas tu-icon.svg')
    },
    {
        name: 'Isaza-faltastu-guitarra',
        displayName: 'Isaza Faltas Tú Guitarra',
        fandom: 'morat',
        has3dModel: false,
        pdfFile: 'Isaza-faltastu-guitarra.pdf',
        icon: moratTextureUrl('Isaza-Faltastu-Guitarra', 'Isaza faltas tu-icon.svg')
    },
    {
        name: 'Mira',
        displayName: 'Mira',
        fandom: 'kpop',
        has3dModel: true,
        pdfFile: 'Mira.pdf',
        icon: kpopTextureUrl('Mira', 'Mira-icon.svg')
    },
    {
        name: 'Rumi',
        displayName: 'Rumi',
        fandom: 'kpop',
        has3dModel: true,
        pdfFile: 'Rumi.pdf',
        icon: kpopTextureUrl('Rumi', 'Rumi-icon.svg')
    },
    {
        name: 'Zoey',
        displayName: 'Zoey',
        fandom: 'kpop',
        has3dModel: true,
        pdfFile: 'Zoey.pdf',
        icon: kpopTextureUrl('Zoey', 'Zoey-icon.svg')
    },
    {
        name: 'Jinu',
        displayName: 'Jinu',
        fandom: 'kpop',
        has3dModel: true,
        pdfFile: 'Jinu.pdf',
        icon: kpopTextureUrl('Jinu', 'Jinu-icon.svg')
    },
    {
        name: 'Abby',
        displayName: 'Abby',
        fandom: 'kpop',
        has3dModel: true,
        pdfFile: 'Abby.pdf',
        icon: kpopTextureUrl('Abby', 'Abby-icon.svg')
    },
    {
        name: 'Romance',
        displayName: 'Romance',
        fandom: 'kpop',
        has3dModel: true,
        pdfFile: 'Romance.pdf',
        icon: kpopTextureUrl('Romance', 'Romance-icon.svg')
    },
    {
        name: 'Mystery',
        displayName: 'Mystery',
        fandom: 'kpop',
        has3dModel: true,
        pdfFile: 'Mystery.pdf',
        icon: kpopTextureUrl('Mystery', 'Mystery-icon.svg')
    },
    {
        name: 'Baby',
        displayName: 'Baby',
        fandom: 'kpop',
        has3dModel: true,
        pdfFile: 'Baby.pdf',
        icon: kpopTextureUrl('Baby', 'Baby-icon.svg')
    },
    {
        name: 'Enderman',
        displayName: 'Enderman',
        fandom: 'minecraft',
        has3dModel: true,
        pdfFile: 'Enderman.pdf',
        icon: minecraftTextureUrl('Enderman', 'Enderman-icon.svg')
    },
    {
        name: 'Creeper',
        displayName: 'Creeper',
        fandom: 'minecraft',
        has3dModel: true,
        pdfFile: 'Creeper.pdf',
        icon: minecraftTextureUrl('Creeper', 'Creeper-icon.svg')
    },
    {
        name: 'Skeleton',
        displayName: 'Skeleton',
        fandom: 'minecraft',
        has3dModel: true,
        pdfFile: 'Skeleton.pdf',
        icon: minecraftTextureUrl('Skeleton', 'Skeleton-icon.svg')
    },
    {
        name: 'Zombie',
        displayName: 'Zombie',
        fandom: 'minecraft',
        has3dModel: true,
        pdfFile: 'Zombie.pdf',
        icon: minecraftTextureUrl('Zombie', 'Zombie-icon.svg')
    },
    {
        name: 'Alex',
        displayName: 'Alex',
        fandom: 'minecraft',
        has3dModel: true,
        pdfFile: 'Alex.pdf',
        icon: minecraftTextureUrl('Alex', 'Alex-icon.svg')
    },
    {
        name: 'Steve',
        displayName: 'Steve',
        fandom: 'minecraft',
        has3dModel: true,
        pdfFile: 'Steve.pdf',
        icon: minecraftTextureUrl('Steve', 'Steve-icon.svg')
    }
]);

const presetCharacterOrder = Object.freeze(presetCatalog.map((character) => character.name));
const presetCharacterDisplayNames = Object.freeze(
    Object.fromEntries(presetCatalog.map((character) => [character.name, character.displayName]))
);
const presetCharacterFandoms = Object.freeze(
    Object.fromEntries(presetCatalog.map((character) => [character.name, character.fandom]))
);
const presetCharacter3dAvailability = Object.freeze(
    Object.fromEntries(presetCatalog.map((character) => [character.name, character.has3dModel]))
);
const presetCharacterPdfFiles = Object.freeze(
    Object.fromEntries(presetCatalog.map((character) => [character.name, character.pdfFile]))
);
const presetIcons = Object.freeze(
    Object.fromEntries(presetCatalog.map((character) => [character.name, character.icon]))
);

function hasPresetCharacter3dModel(characterName) {
    return presetCharacter3dAvailability[characterName] !== false;
}

// --- DATA PARA OJOS ---
// ORDEN: Del más NUEVO al más ANTIGUO (NO alfabético)
const eyeTextures = [
    { name: 'Steve', url: minecraftTextureUrl('Steve', 'eyes', 'Steve-eyes.svg') },
    { name: 'Alex', url: minecraftTextureUrl('Alex', 'eyes', 'Alex-eyes.svg') },
    { name: 'Zombie', url: minecraftTextureUrl('Zombie', 'eyes', 'Zombie-eyes.svg') },
    { name: 'Skeleton', url: minecraftTextureUrl('Skeleton', 'eyes', 'Skeleton-eyes.svg') },
    { name: 'Creeper', url: minecraftTextureUrl('Creeper', 'eyes', 'Creeper-eyes.svg') },
    { name: 'Enderman', url: minecraftTextureUrl('Enderman', 'eyes', 'Enderman-eyes.svg') },
    { name: 'Baby', url: kpopTextureUrl('Baby', 'eyes', 'Baby-eyes.svg') },
    { name: 'Romance', url: kpopTextureUrl('Romance', 'eyes', 'Romance-eyes.svg') },
    { name: 'Abby', url: kpopTextureUrl('Abby', 'eyes', 'Abby-eyes.svg') },
    { name: 'Jinu', url: kpopTextureUrl('Jinu', 'eyes', 'Jinu-eyes.svg') },
    { name: 'Male', url: basicTextureUrl('eyes', 'Male-eyes.svg') },
    { name: 'Female', url: basicTextureUrl('eyes', 'Female-eyes.svg') },
    { name: 'Zoey', url: kpopTextureUrl('Zoey', 'eyes', 'Zoey-eyes.svg') },
    { name: 'Rumi', url: kpopTextureUrl('Rumi', 'eyes', 'Rumi-eyes.svg') },
    { name: 'Mira', url: kpopTextureUrl('Mira', 'eyes', 'Mira-eyes.svg') }
];

// --- DATA PARA CEJAS ---
// ORDEN: Del más NUEVO al más ANTIGUO (NO alfabético)
const eyebrowTextures = [
    { name: 'Baby', url: kpopTextureUrl('Baby', 'eyebrows', 'Baby-eyebrown.svg') },
    { name: 'Romance', url: kpopTextureUrl('Romance', 'eyebrows', 'Romance-eyebrown.svg') },
    { name: 'Abby', url: kpopTextureUrl('Abby', 'eyebrows', 'Abby-eyebrown.svg') },
    { name: 'Jinu', url: kpopTextureUrl('Jinu', 'eyebrows', 'Jinu-eyebrown.svg') },
    { name: 'Male', url: basicTextureUrl('eyebrows', 'Male-eyebrown.svg') },
    { name: 'Female', url: basicTextureUrl('eyebrows', 'Female-eyebrown.svg') },
    { name: 'Zoey', url: kpopTextureUrl('Zoey', 'eyebrows', 'Zoey-eyebrown.svg') },
    { name: 'Rumi', url: kpopTextureUrl('Rumi', 'eyebrows', 'Rumi-eyebrown.svg') },
    { name: 'Mira', url: kpopTextureUrl('Mira', 'eyebrows', 'Mira-eyebrown.svg') }
];

// --- DATA PARA NARIZ ---
const noseTextures = [
    { name: 'Steve', url: minecraftTextureUrl('Steve', 'nose', 'Steve-nose.svg') },
    { name: 'Alex', url: minecraftTextureUrl('Alex', 'nose', 'Alex-nose.svg') },
    { name: 'Zombie', url: minecraftTextureUrl('Zombie', 'nose', 'Zombie-nose.svg') },
    { name: 'Skeleton', url: minecraftTextureUrl('Skeleton', 'nose', 'Skeleton-nose.svg') },
    { name: 'Creeper', url: minecraftTextureUrl('Creeper', 'nose', 'Creeper-nose.svg') },
    { name: 'Enderman', url: minecraftTextureUrl('Enderman', 'nose', 'Enderman-nose.svg') },
    { name: 'Default', url: basicTextureUrl('nose', 'Nose-default.svg') }
];

// --- DATA PARA OREJAS ---
// ORDEN: Del más NUEVO al más ANTIGUO (NO alfabético)
const earTextures = [
    { name: 'Baby', url: kpopTextureUrl('Baby', 'ears', 'Baby-ears.svg') },
    { name: 'Mystery', url: kpopTextureUrl('Mystery', 'ears', 'Mystery-ears.svg') },
    { name: 'Abby', url: kpopTextureUrl('Abby', 'ears', 'Abby-ears.svg') },
    { name: 'Jinu', url: kpopTextureUrl('Jinu', 'ears', 'Jinu-ears.svg') },
    { name: 'Basic', url: basicTextureUrl('ears', 'Basic-ears.svg') },
    { name: 'Zoey', url: kpopTextureUrl('Zoey', 'ears', 'Zoey-ears.svg') },
    { name: 'Rumi', url: kpopTextureUrl('Rumi', 'ears', 'Rumi-ears.svg') },
    { name: 'Mira', url: kpopTextureUrl('Mira', 'ears', 'Mira-ears.svg') }
];

// --- DATA PARA CABELLO ---
// ORDEN: Del más NUEVO al más ANTIGUO (NO alfabético)
const hairTextures = [
    { name: 'None', frontUrl: null, backUrl: null, leftUrl: null, rightUrl: null, upUrl: null },
    {
        name: 'Steve',
        frontUrl: minecraftTextureUrl('Steve', 'hair', 'Steve-hair-front.svg'),
        backUrl: minecraftTextureUrl('Steve', 'hair', 'Steve-hair-back.svg'),
        leftUrl: minecraftTextureUrl('Steve', 'hair', 'Steve-hair-left.svg'),
        rightUrl: minecraftTextureUrl('Steve', 'hair', 'Steve-hair-right.svg'),
        upUrl: minecraftTextureUrl('Steve', 'hair', 'Steve-hair-up.svg')
    },
    {
        name: 'Alex',
        frontUrl: minecraftTextureUrl('Alex', 'hair', 'Alex-hair-front.svg'),
        backUrl: minecraftTextureUrl('Alex', 'hair', 'Alex-hair-back.svg'),
        leftUrl: minecraftTextureUrl('Alex', 'hair', 'Alex-hair-left.svg'),
        rightUrl: minecraftTextureUrl('Alex', 'hair', 'Alex-hair-right.svg'),
        upUrl: minecraftTextureUrl('Alex', 'hair', 'Alex-hair-up.svg')
    },
    {
        name: 'Zombie',
        frontUrl: minecraftTextureUrl('Zombie', 'hair', 'Zombie-hair-front.svg'),
        backUrl: minecraftTextureUrl('Zombie', 'hair', 'Zombie-hair-back.svg'),
        leftUrl: minecraftTextureUrl('Zombie', 'hair', 'Zombie-hair-left.svg'),
        rightUrl: minecraftTextureUrl('Zombie', 'hair', 'Zombie-hair-right.svg'),
        upUrl: minecraftTextureUrl('Zombie', 'hair', 'Zombie-hair-up.svg')
    },
    {
        name: 'Creeper',
        frontUrl: minecraftTextureUrl('Creeper', 'hair', 'Creeper-hair-front.svg'),
        backUrl: minecraftTextureUrl('Creeper', 'hair', 'Creeper-hair-back.svg'),
        leftUrl: minecraftTextureUrl('Creeper', 'hair', 'Creeper-hair-left.svg'),
        rightUrl: minecraftTextureUrl('Creeper', 'hair', 'Creeper-hair-right.svg'),
        upUrl: minecraftTextureUrl('Creeper', 'hair', 'Creeper-hair-up.svg')
    },
    {
        name: 'Enderman',
        frontUrl: minecraftTextureUrl('Enderman', 'hair', 'Enderman-hair-front.svg'),
        backUrl: minecraftTextureUrl('Enderman', 'hair', 'Enderman-hair-back.svg'),
        leftUrl: minecraftTextureUrl('Enderman', 'hair', 'Enderman-hair-left.svg'),
        rightUrl: minecraftTextureUrl('Enderman', 'hair', 'Enderman-hair-right.svg'),
        upUrl: minecraftTextureUrl('Enderman', 'hair', 'Enderman-hair-up.svg')
    },
    {
        name: 'Baby',
        frontUrl: kpopTextureUrl('Baby', 'hair', 'Baby-hair-front.svg'),
        backUrl: kpopTextureUrl('Baby', 'hair', 'Baby-hair-back.svg'),
        leftUrl: kpopTextureUrl('Baby', 'hair', 'Baby-hair-left.svg'),
        rightUrl: kpopTextureUrl('Baby', 'hair', 'Baby-hair-right.svg'),
        upUrl: kpopTextureUrl('Baby', 'hair', 'Baby-hair-up.svg')
    },
    {
        name: 'Mystery',
        frontUrl: kpopTextureUrl('Mystery', 'hair', 'Mystery-hair-front.svg'),
        backUrl: kpopTextureUrl('Mystery', 'hair', 'Mystery-hair-back.svg'),
        leftUrl: kpopTextureUrl('Mystery', 'hair', 'Mystery-hair-left.svg'),
        rightUrl: kpopTextureUrl('Mystery', 'hair', 'Mystery-hair-right.svg'),
        upUrl: kpopTextureUrl('Mystery', 'hair', 'Mystery-hair-up.svg')
    },
    {
        name: 'Romance',
        frontUrl: kpopTextureUrl('Romance', 'hair', 'Romance-hair-front.svg'),
        backUrl: kpopTextureUrl('Romance', 'hair', 'Romance-hair-back.svg'),
        leftUrl: kpopTextureUrl('Romance', 'hair', 'Romance-hair-left.svg'),
        rightUrl: kpopTextureUrl('Romance', 'hair', 'Romance-hair-right.svg'),
        upUrl: kpopTextureUrl('Romance', 'hair', 'Romance-hair-up.svg')
    },
    {
        name: 'Abby',
        frontUrl: kpopTextureUrl('Abby', 'hair', 'Abby-hair-front.svg'),
        backUrl: kpopTextureUrl('Abby', 'hair', 'Abby-hair-back.svg'),
        leftUrl: kpopTextureUrl('Abby', 'hair', 'Abby-hair-left.svg'),
        rightUrl: kpopTextureUrl('Abby', 'hair', 'Abby-hair-right.svg'),
        upUrl: kpopTextureUrl('Abby', 'hair', 'Abby-hair-up.svg')
    },
    {
        name: 'Jinu',
        frontUrl: kpopTextureUrl('Jinu', 'hair', 'Jinu-hair-front.svg'),
        backUrl: kpopTextureUrl('Jinu', 'hair', 'Jinu-hair-back.svg'),
        leftUrl: kpopTextureUrl('Jinu', 'hair', 'Jinu-hair-left.svg'),
        rightUrl: kpopTextureUrl('Jinu', 'hair', 'Jinu-hair-right.svg'),
        upUrl: kpopTextureUrl('Jinu', 'hair', 'Jinu-hair-up.svg')
    },
    {
        name: 'Zoey',
        frontUrl: kpopTextureUrl('Zoey', 'hair', 'Zoey-front-hair.svg'),
        backUrl: kpopTextureUrl('Zoey', 'hair', 'Zoey-back-hair.svg'),
        leftUrl: kpopTextureUrl('Zoey', 'hair', 'Zoey-hair-left.svg'),
        rightUrl: kpopTextureUrl('Zoey', 'hair', 'Zoey-hair-right.svg'),
        upUrl: kpopTextureUrl('Zoey', 'hair', 'Zoey-hair-up.svg')
    },
    {
        name: 'Rumi',
        frontUrl: kpopTextureUrl('Rumi', 'hair', 'Rumi-hair-front.svg'),
        backUrl: kpopTextureUrl('Rumi', 'hair', 'Rumi-hair-back.svg'),
        leftUrl: kpopTextureUrl('Rumi', 'hair', 'Rumi-hair-left.svg'),
        rightUrl: kpopTextureUrl('Rumi', 'hair', 'Rumi-hair-right.svg'),
        upUrl: kpopTextureUrl('Rumi', 'hair', 'Rumi-hair-up.svg')
    },
    {
        name: 'Mira',
        frontUrl: kpopTextureUrl('Mira', 'hair', 'Mira-front-hair.svg'),
        backUrl: kpopTextureUrl('Mira', 'hair', 'Mira-back-hair.svg'),
        leftUrl: kpopTextureUrl('Mira', 'hair', 'Mira-hair-left.svg'),
        rightUrl: kpopTextureUrl('Mira', 'hair', 'Mira-hair-right.svg'),
        upUrl: kpopTextureUrl('Mira', 'hair', 'Mira-hair-up.svg')
    }
];

// --- DATA PARA VESTIMENTA DEL TORSO ---
// ORDEN: Del más NUEVO al más ANTIGUO (NO alfabético)
const torsoClothingTextures = [
    { name: 'None', frontUrl: null, backUrl: null },
    { name: 'Steve', frontUrl: minecraftTextureUrl('Steve', 'torso', 'Steve-torso-front.svg'), backUrl: minecraftTextureUrl('Steve', 'torso', 'Steve-torso-back.svg') },
    { name: 'Alex', frontUrl: minecraftTextureUrl('Alex', 'torso', 'Alex-torso-front.svg'), backUrl: minecraftTextureUrl('Alex', 'torso', 'Alex-torso-back.svg') },
    { name: 'Zombie', frontUrl: minecraftTextureUrl('Zombie', 'torso', 'Zombie-torso-front.svg'), backUrl: minecraftTextureUrl('Zombie', 'torso', 'Zombie-torso-back.svg') },
    { name: 'Skeleton', frontUrl: minecraftTextureUrl('Skeleton', 'torso', 'Skeleton-torso-front.svg'), backUrl: minecraftTextureUrl('Skeleton', 'torso', 'Skeleton-torso-back.svg') },
    { name: 'Creeper', frontUrl: minecraftTextureUrl('Creeper', 'torso', 'Creeper-torso-front.svg'), backUrl: minecraftTextureUrl('Creeper', 'torso', 'Creeper-torso-back.svg') },
    { name: 'Enderman', frontUrl: minecraftTextureUrl('Enderman', 'torso', 'Enderman-torso-front.svg'), backUrl: minecraftTextureUrl('Enderman', 'torso', 'Enderman-torso-back.svg') },
    { name: 'Baby', frontUrl: kpopTextureUrl('Baby', 'torso', 'Baby-torso-front.svg'), backUrl: kpopTextureUrl('Baby', 'torso', 'Baby-torso-back.svg') },
    { name: 'Mystery', frontUrl: kpopTextureUrl('Mystery', 'torso', 'Mystery-torso-front.svg'), backUrl: kpopTextureUrl('Mystery', 'torso', 'Mystery-torso-back.svg') },
    { name: 'Romance', frontUrl: kpopTextureUrl('Romance', 'torso', 'Romance-torso-front.svg'), backUrl: kpopTextureUrl('Romance', 'torso', 'Romance-torso-back.svg') },
    { name: 'Abby', frontUrl: kpopTextureUrl('Abby', 'torso', 'Abby-torso-front.svg'), backUrl: kpopTextureUrl('Abby', 'torso', 'Abby-torso-back.svg') },
    { name: 'Jinu', frontUrl: kpopTextureUrl('Jinu', 'torso', 'Jinu-torso-front.svg'), backUrl: kpopTextureUrl('Jinu', 'torso', 'Jinu-torso-back.svg') },
    { name: 'Zoey', frontUrl: kpopTextureUrl('Zoey', 'torso', 'Zoey-torso-front.svg'), backUrl: kpopTextureUrl('Zoey', 'torso', 'Zoey-torso-back.svg') },
    { name: 'Rumi', frontUrl: kpopTextureUrl('Rumi', 'torso', 'Rumi-torso-front.svg'), backUrl: kpopTextureUrl('Rumi', 'torso', 'Rumi-torso-back.svg') },
    { name: 'Mira', frontUrl: kpopTextureUrl('Mira', 'torso', 'Mira-torso-front.svg'), backUrl: kpopTextureUrl('Mira', 'torso', 'Mira-torso-back.svg') }
];

// --- DATA PARA ESTILOS DE BRAZOS ---
// ORDEN: Del más NUEVO al más ANTIGUO (NO alfabético)
const armTextures = [
    { name: 'None', leftUrl: null, rightUrl: null },
    { name: 'Steve', leftUrl: minecraftTextureUrl('Steve', 'arms', 'Steve-arm-left.svg'), rightUrl: minecraftTextureUrl('Steve', 'arms', 'Steve-arm-right.svg') },
    { name: 'Alex', leftUrl: minecraftTextureUrl('Alex', 'arms', 'Alex-arm-left.svg'), rightUrl: minecraftTextureUrl('Alex', 'arms', 'Alex-arm-right.svg') },
    { name: 'Zombie', leftUrl: minecraftTextureUrl('Zombie', 'arms', 'Zombie-arm-left.svg'), rightUrl: minecraftTextureUrl('Zombie', 'arms', 'Zombie-arm-right.svg') },
    { name: 'Skeleton', leftUrl: minecraftTextureUrl('Skeleton', 'arms', 'Skeleton-arm-left.svg'), rightUrl: minecraftTextureUrl('Skeleton', 'arms', 'Skeleton-arm-right.svg') },
    { name: 'Baby', leftUrl: kpopTextureUrl('Baby', 'arms', 'Baby-arm-left.svg'), rightUrl: kpopTextureUrl('Baby', 'arms', 'Baby-arm-right.svg') },
    { name: 'Mystery', leftUrl: kpopTextureUrl('Mystery', 'arms', 'Mystery-arm-left.svg'), rightUrl: kpopTextureUrl('Mystery', 'arms', 'Mystery-arm-right.svg') },
    { name: 'Romance', leftUrl: kpopTextureUrl('Romance', 'arms', 'Romance-arm-left.svg'), rightUrl: kpopTextureUrl('Romance', 'arms', 'Romance-arm-right.svg') },
    { name: 'Abby', leftUrl: kpopTextureUrl('Abby', 'arms', 'Abby-arm-left.svg'), rightUrl: kpopTextureUrl('Abby', 'arms', 'Abby-arm-right.svg') },
    { name: 'Jinu', leftUrl: kpopTextureUrl('Jinu', 'arms', 'Jinu-arm-left.svg'), rightUrl: kpopTextureUrl('Jinu', 'arms', 'Jinu-arm-right.svg') },
    { name: 'Zoey', leftUrl: kpopTextureUrl('Zoey', 'arms', 'Zoey-arm-left.svg'), rightUrl: kpopTextureUrl('Zoey', 'arms', 'Zoey-arm-right.svg') },
    { name: 'Rumi', leftUrl: kpopTextureUrl('Rumi', 'arms', 'Rumi-arm-left.svg'), rightUrl: kpopTextureUrl('Rumi', 'arms', 'Rumi-arm-right.svg') },
    { name: 'Mira', leftUrl: kpopTextureUrl('Mira', 'arms', 'Mira-arm-left.svg'), rightUrl: kpopTextureUrl('Mira', 'arms', 'Mira-arm-right.svg') }
];

// --- DATA PARA ESTILOS DE PIERNAS ---
// ORDEN: Del más NUEVO al más ANTIGUO (NO alfabético)
const legTextures = [
    { name: 'None', leftUrl: null, rightUrl: null },
    { name: 'Steve', leftUrl: minecraftTextureUrl('Steve', 'legs', 'Steve-leg-left.svg'), rightUrl: minecraftTextureUrl('Steve', 'legs', 'Steve-leg-right.svg') },
    { name: 'Alex', leftUrl: minecraftTextureUrl('Alex', 'legs', 'Alex-leg-left.svg'), rightUrl: minecraftTextureUrl('Alex', 'legs', 'Alex-leg-right.svg') },
    { name: 'Zombie', leftUrl: minecraftTextureUrl('Zombie', 'legs', 'Zombie-leg-left.svg'), rightUrl: minecraftTextureUrl('Zombie', 'legs', 'Zombie-leg-right.svg') },
    { name: 'Skeleton', leftUrl: minecraftTextureUrl('Skeleton', 'legs', 'Skeleton-leg-left.svg'), rightUrl: minecraftTextureUrl('Skeleton', 'legs', 'Skeleton-leg-right.svg') },
    { name: 'Creeper', leftUrl: minecraftTextureUrl('Creeper', 'legs', 'Creeper-leg-left.svg'), rightUrl: minecraftTextureUrl('Creeper', 'legs', 'Creeper-leg-right.svg') },
    { name: 'Baby', leftUrl: kpopTextureUrl('Baby', 'legs', 'Baby-leg-left.svg'), rightUrl: kpopTextureUrl('Baby', 'legs', 'Baby-leg-right.svg') },
    { name: 'Mystery', leftUrl: kpopTextureUrl('Mystery', 'legs', 'Mystery-leg-left.svg'), rightUrl: kpopTextureUrl('Mystery', 'legs', 'Mystery-leg-right.svg') },
    { name: 'Romance', leftUrl: kpopTextureUrl('Romance', 'legs', 'Romance-leg-left.svg'), rightUrl: kpopTextureUrl('Romance', 'legs', 'Romance-leg-right.svg') },
    { name: 'Abby', leftUrl: kpopTextureUrl('Abby', 'legs', 'Abby-leg-left.svg'), rightUrl: kpopTextureUrl('Abby', 'legs', 'Abby-leg-right.svg') },
    { name: 'Jinu', leftUrl: kpopTextureUrl('Jinu', 'legs', 'Jinu-leg-left.svg'), rightUrl: kpopTextureUrl('Jinu', 'legs', 'Jinu-leg-right.svg') },
    { name: 'Zoey', leftUrl: kpopTextureUrl('Zoey', 'legs', 'Zoey-leg-left.svg'), rightUrl: kpopTextureUrl('Zoey', 'legs', 'Zoey-leg-right.svg') },
    { name: 'Rumi', leftUrl: kpopTextureUrl('Rumi', 'legs', 'Rumi-legs-left.svg'), rightUrl: kpopTextureUrl('Rumi', 'legs', 'Rumi-legs-right.svg') },
    { name: 'Mira', leftUrl: kpopTextureUrl('Mira', 'legs', 'Mira-legs-left.svg'), rightUrl: kpopTextureUrl('Mira', 'legs', 'Mira-legs-right.svg') }
];

/* ============================================
   NOTAS PARA AGREGAR NUEVOS PERSONAJES:
   ============================================

   1. Agregar icono del personaje en presetIcons
   2. Agregar texturas del personaje en cada array (eyes, eyebrows, hair, etc.)
   3. Mantener orden: NUEVO al principio, ANTIGUO al final
   4. Usar los helpers `minecraftTextureUrl`, `kpopTextureUrl`, `basicTextureUrl`
      o `textureRepoUrl` según corresponda
   ============================================ */
