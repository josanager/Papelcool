/* ============================================
   PAPELCOOL - CHARACTER & TEXTURE DATA
   ============================================
   Este archivo contiene todos los datos de:
   - Texturas SVG para personajes
   - Configuraciones de presets
   - Enlaces a GitHub de texturas
   
   ORDEN: Del más NUEVO al más ANTIGUO (NO alfabético)
   ============================================ */

// --- ICONOS DE PERSONAJES PREESTABLECIDOS ---
const presetIcons = {
    'Abby': 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Abby/Abby-icon.svg',
    'Jinu': 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Jinu/Jinu-icon.svg',
    'Zoey': 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Zoey/Zoey-icon.svg',
    'Rumi': 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Rumi/Rumi-icon.svg',
    'Mira': 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Mira/Mira-icon.svg'
};

// --- DATA PARA OJOS ---
// ORDEN: Del más NUEVO al más ANTIGUO (NO alfabético)
const eyeTextures = [
    { name: 'Abby', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Abby/eyes/Abby-eyes.svg' },
    { name: 'Jinu', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Jinu/eyes/Jinu-eyes.svg' },
    { name: 'Male', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/eyes/Male-eyes.svg' },
    { name: 'Female', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/eyes/Female-eyes.svg' },
    { name: 'Zoey', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/eyes/Zoey-eyes.svg' },
    { name: 'Rumi', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/eyes/Rumi-eyes.svg' },
    { name: 'Mira', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/eyes/Mira-eyes.svg' }
];

// --- DATA PARA CEJAS ---
// ORDEN: Del más NUEVO al más ANTIGUO (NO alfabético)
const eyebrowTextures = [
    { name: 'Abby', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Abby/eyebrown/Abby-eyebrown.svg' },
    { name: 'Jinu', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Jinu/eyebrown/Jinu-eyebrown.svg' },
    { name: 'Male', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/eyesbrown/Male-eyebrown.svg' },
    { name: 'Female', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/eyesbrown/Female-eyebrown.svg' },
    { name: 'Zoey', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/eyesbrown/Zoey-eyebrown.svg' },
    { name: 'Rumi', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/eyesbrown/Rumi-eyebrown.svg' },
    { name: 'Mira', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/eyesbrown/Mira-eyebrown.svg' }
];

// --- DATA PARA NARIZ ---
const noseTextures = [
    { name: 'Default', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/nose/Nose-default.svg' }
];

// --- DATA PARA OREJAS ---
// ORDEN: Del más NUEVO al más ANTIGUO (NO alfabético)
const earTextures = [
    { name: 'Abby', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Abby/ears/Abby-ears.svg' },
    { name: 'Jinu', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Jinu/ears/Jinu-ears.svg' },
    { name: 'Basic', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/ears/Basic-ears.svg' },
    { name: 'Zoey', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/ears/Zoey-ears.svg' },
    { name: 'Rumi', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/ears/Rumi-ears.svg' },
    { name: 'Mira', url: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/ears/Mira-ears.svg' }
];

// --- DATA PARA CABELLO ---
// ORDEN: Del más NUEVO al más ANTIGUO (NO alfabético)
const hairTextures = [
    { name: 'None', frontUrl: null, backUrl: null, leftUrl: null, rightUrl: null, upUrl: null }, // Opción sin cabello
    { 
        name: 'Abby', 
        frontUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Abby/hair/Abby-hair-front.svg',
        backUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Abby/hair/Abby-hair-back.svg',
        leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Abby/hair/Abby-hair-left.svg',
        rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Abby/hair/Abby-hair-right.svg',
        upUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Abby/hair/Abby-hair-up.svg'
    },
    { 
        name: 'Jinu', 
        frontUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Jinu/hair/Jinu-hair-front.svg',
        backUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Jinu/hair/Jinu-hair-back.svg',
        leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Jinu/hair/Jinu-hair-left.svg',
        rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Jinu/hair/Jinu-hair-right.svg',
        upUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Jinu/hair/Jinu-hair-up.svg'
    },
    { 
        name: 'Zoey', 
        frontUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/hair/front/Zoey-front-hair.svg',
        backUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/hair/back/Zoey-back-hair.svg',
        leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Zoey/hair/Zoey-hair-left.svg',
        rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Zoey/hair/Zoey-hair-right.svg',
        upUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Zoey/hair/Zoey-hair-up.svg'
    },
    { 
        name: 'Rumi', 
        frontUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Rumi/hair/Rumi-hair-front.svg',
        backUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Rumi/hair/Rumi-hair-back.svg',
        leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Rumi/hair/Rumi-hair-left.svg',
        rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Rumi/hair/Rumi-hair-right.svg',
        upUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Rumi/hair/Rumi-hair-up.svg'
    },
    { 
        name: 'Mira', 
        frontUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/hair/front/Mira-front-hair.svg',
        backUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/hair/back/Mira-back-hair.svg',
        leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Mira/hair/Mira-hair-left.svg',
        rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Mira/hair/Mira-hair-right.svg',
        upUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Mira/hair/Mira-hair-up.svg'
    }
];

// --- DATA PARA VESTIMENTA DEL TORSO ---
// ORDEN: Del más NUEVO al más ANTIGUO (NO alfabético)
const torsoClothingTextures = [
    { name: 'None', frontUrl: null, backUrl: null }, // Opción sin ropa
    { 
        name: 'Abby', 
        frontUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Abby/torso/Abby-torso-front.svg',
        backUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Abby/torso/Abby-torso-back.svg'
    },
    { 
        name: 'Jinu', 
        frontUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Jinu/torso/Jinu-torso-front.svg',
        backUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Jinu/torso/Jinu-torso-back.svg'
    },
    { 
        name: 'Zoey', 
        frontUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Zoey/torso/Zoey-torso-front.svg',
        backUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Zoey/torso/Zoey-torso-back.svg'
    },
    { 
        name: 'Rumi', 
        frontUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Rumi/torso/Rumi-torso-front.svg',
        backUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Rumi/torso/Rumi-torso-back.svg'
    },
    { 
        name: 'Mira', 
        frontUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Mira/torso/Mira-torso-front.svg',
        backUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Mira/torso/Mira-torso-back.svg'
    }
];

// --- DATA PARA ESTILOS DE BRAZOS ---
// ORDEN: Del más NUEVO al más ANTIGUO (NO alfabético)
const armTextures = [
    { name: 'None', leftUrl: null, rightUrl: null }, // Opción sin estilo
    {
        name: 'Abby', 
        leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Abby/arms/Abby-arm-left.svg',
        rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Abby/arms/Abby-arm-right.svg'
    },
    {
        name: 'Jinu', 
        leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Jinu/arms/Jinu-arm-left.svg',
        rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Jinu/arms/Jinu-arm-right.svg'
    },
    {
        name: 'Zoey', 
        leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/arms/left/Zoey-arm-left.svg',
        rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/arms/right/Zoey-arm-right.svg'
    },
    {
        name: 'Rumi',
        leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/arms/left/Rumi-arm-left.svg',
        rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/arms/right/Rumi-arm-right.svg'
    },
    {
        name: 'Mira',
        leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/arms/left/Mira-arm-left.svg',
        rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/arms/right/Mira-arm-right.svg'
    }
];

// --- DATA PARA ESTILOS DE PIERNAS ---
// ORDEN: Del más NUEVO al más ANTIGUO (NO alfabético)
const legTextures = [
    { name: 'None', leftUrl: null, rightUrl: null }, // Opción sin estilo
    {
        name: 'Abby', 
        leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Abby/legs/Abby-leg-left.svg',
        rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Abby/legs/Abby-leg-right.svg'
    },
    {
        name: 'Jinu', 
        leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Jinu/legs/Jinu-leg-left.svg',
        rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Jinu/legs/Jinu-leg-right.svg'
    },
    {
        name: 'Zoey', 
        leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/legs/left/Zoey-leg-left.svg',
        rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/legs/right/Zoey-leg-right.svg'
    },
    { 
        name: 'Rumi', 
        leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Rumi/legs/Rumi-legs-left.svg',
        rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Rumi/legs/Rumi-legs-right.svg'
    },
    {
        name: 'Mira', 
        leftUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Mira/legs/Mira-legs-left.svg',
        rightUrl: 'https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/Kpop%20Demon%20Hunters/Mira/legs/Mira-legs-right.svg'
    }
];

/* ============================================
   NOTAS PARA AGREGAR NUEVOS PERSONAJES:
   ============================================
   
   1. Agregar icono del personaje en presetIcons
   2. Agregar texturas del personaje en cada array (eyes, eyebrows, hair, etc.)
   3. Mantener orden: NUEVO al principio, ANTIGUO al final
   4. Formato de URL: https://raw.githubusercontent.com/josanager/Textures-Papelcool/refs/heads/main/...
   
   EJEMPLO PARA NUEVO PERSONAJE "Luna":
   
   presetIcons: {
       'Luna': 'URL_DEL_ICONO',
       ...existentes
   }
   
   eyeTextures: [
       { name: 'Luna', url: 'URL_EYES' },
       ...existentes
   ]
   
   Y así para cada array de texturas.
   ============================================ */
