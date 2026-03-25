/* ============================================
   PAPELCOOL - CHARACTER STORAGE MODULE
   ============================================
   Handles saving and loading custom characters
   to/from Supabase database.
   ============================================ */

// ============================================
// CHARACTER DATA COLLECTION
// ============================================

/**
 * Collect current character customization data from the 3D model
 * @returns {Object} Character data object
 */
function collectCharacterData() {
    // Get current texture URLs (these should be global variables in index.html)
    const characterData = {
        // Facial features
        eye_texture: typeof currentEyeTextureURL !== 'undefined' ? currentEyeTextureURL : null,
        eyebrow_texture: typeof currentEyebrowTextureURL !== 'undefined' ? currentEyebrowTextureURL : null,
        nose_texture: typeof currentNoseTextureURL !== 'undefined' ? currentNoseTextureURL : null,
        ear_texture: typeof currentEarTextureURL !== 'undefined' ? currentEarTextureURL : null,

        // Hair textures
        hair_front: typeof currentHairFrontURL !== 'undefined' ? currentHairFrontURL : null,
        hair_back: typeof currentHairBackURL !== 'undefined' ? currentHairBackURL : null,
        hair_left: typeof currentHairLeftURL !== 'undefined' ? currentHairLeftURL : null,
        hair_right: typeof currentHairRightURL !== 'undefined' ? currentHairRightURL : null,
        hair_up: typeof currentHairUpURL !== 'undefined' ? currentHairUpURL : null,

        // Skin colors - collect from sliders if available
        skin_colors: collectSkinColors()
    };

    return characterData;
}

/**
 * Collect skin color values from color pickers/sliders
 * @returns {Object} Skin colors by body part
 */
function collectSkinColors() {
    const colors = {};

    // Try to get colors from the model parts
    const parts = ['head', 'torso', 'armLeft', 'armRight', 'legLeft', 'legRight'];

    parts.forEach(part => {
        const partElement = window[part];
        if (partElement && partElement.material && partElement.material.color) {
            colors[part] = '#' + partElement.material.color.getHexString();
        }
    });

    // Also try to get from hue/brightness sliders
    const hueSlider = document.getElementById('hue-slider');
    const brightnessSlider = document.getElementById('brightness-slider');

    if (hueSlider) colors.hue = parseFloat(hueSlider.value);
    if (brightnessSlider) colors.brightness = parseFloat(brightnessSlider.value);

    return colors;
}

// ============================================
// SAVE CHARACTER
// ============================================

/**
 * Save a character to the database
 * @param {string} name - Name for the character
 * @param {string} thumbnail - Base64 thumbnail image (optional)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
async function saveCharacter(name, thumbnail = null) {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error('Supabase not initialized') };

    const user = await getCurrentUser();
    if (!user) return { data: null, error: new Error('User not logged in') };

    try {
        const characterData = collectCharacterData();

        const { data, error } = await client
            .from('characters')
            .insert({
                user_id: user.id,
                name: name,
                thumbnail: thumbnail,
                ...characterData
            })
            .select()
            .single();

        if (error) {
            console.error('Save character error:', error.message);
            return { data: null, error };
        }

        console.log('✅ Character saved:', data.name);
        return { data, error: null };
    } catch (err) {
        console.error('Save character exception:', err);
        return { data: null, error: err };
    }
}

// ============================================
// LOAD CHARACTERS
// ============================================

/**
 * Load all characters for the current user
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
async function loadUserCharacters(targetUserId = null) {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error('Supabase not initialized') };

    let userId = targetUserId;
    if (!userId) {
        const user = await getCurrentUser();
        if (!user) return { data: null, error: new Error('User not logged in') };
        userId = user.id;
    }

    try {
        const { data, error } = await client
            .from('characters')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Load characters error:', error.message);
            return { data: null, error };
        }

        console.log(`✅ Loaded ${data.length} characters for user ${userId}`);
        return { data, error: null };
    } catch (err) {
        console.error('Load characters exception:', err);
        return { data: null, error: err };
    }
}

/**
 * Load a specific character by ID
 * @param {string} id - Character UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
async function loadCharacterById(id) {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error('Supabase not initialized') };

    try {
        const { data, error } = await client
            .from('characters')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Load character error:', error.message);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (err) {
        console.error('Load character exception:', err);
        return { data: null, error: err };
    }
}

// ============================================
// UPDATE CHARACTER
// ============================================

/**
 * Update an existing character
 * @param {string} id - Character UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
async function updateCharacter(id, updates) {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error('Supabase not initialized') };

    try {
        const { data, error } = await client
            .from('characters')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Update character error:', error.message);
            return { data: null, error };
        }

        console.log('✅ Character updated:', data.name);
        return { data, error: null };
    } catch (err) {
        console.error('Update character exception:', err);
        return { data: null, error: err };
    }
}

// ============================================
// DELETE CHARACTER
// ============================================

/**
 * Delete a character by ID
 * @param {string} id - Character UUID
 * @returns {Promise<{error: Error|null}>}
 */
async function deleteCharacter(id) {
    const client = getSupabaseClient();
    if (!client) return { error: new Error('Supabase not initialized') };

    try {
        const { error } = await client
            .from('characters')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete character error:', error.message);
            return { error };
        }

        console.log('✅ Character deleted');
        return { error: null };
    } catch (err) {
        console.error('Delete character exception:', err);
        return { error: err };
    }
}

// ============================================
// APPLY CHARACTER TO MODEL
// ============================================

/**
 * Apply saved character data to the 3D model
 * @param {Object} characterData - Character data from database
 */
async function applyCharacterToModel(characterData) {
    console.log('Applying character:', characterData.name);

    // Apply textures using existing functions from index.html
    if (characterData.eye_texture && typeof applyTextureToFace !== 'undefined') {
        await applyTextureToFace('eyes', characterData.eye_texture);
    }

    if (characterData.eyebrow_texture && typeof applyTextureToFace !== 'undefined') {
        await applyTextureToFace('eyebrows', characterData.eyebrow_texture);
    }

    if (characterData.nose_texture && typeof applyTextureToFace !== 'undefined') {
        await applyTextureToFace('nose', characterData.nose_texture);
    }

    if (characterData.ear_texture && typeof applyTextureToFace !== 'undefined') {
        await applyTextureToFace('ears', characterData.ear_texture);
    }

    // Apply hair textures
    if (typeof applyHairTextures !== 'undefined') {
        await applyHairTextures({
            frontUrl: characterData.hair_front,
            backUrl: characterData.hair_back,
            leftUrl: characterData.hair_left,
            rightUrl: characterData.hair_right,
            upUrl: characterData.hair_up
        });
    }

    // Apply skin colors
    if (characterData.skin_colors) {
        const colors = characterData.skin_colors;

        // Apply hue and brightness from sliders
        if (colors.hue !== undefined) {
            const hueSlider = document.getElementById('hue-slider');
            if (hueSlider) {
                hueSlider.value = colors.hue;
                hueSlider.dispatchEvent(new Event('input'));
            }
        }

        if (colors.brightness !== undefined) {
            const brightnessSlider = document.getElementById('brightness-slider');
            if (brightnessSlider) {
                brightnessSlider.value = colors.brightness;
                brightnessSlider.dispatchEvent(new Event('input'));
            }
        }
    }

    console.log('✅ Character applied successfully');
}

// ============================================
// THUMBNAIL GENERATION
// ============================================

/**
 * Capture current 3D view as thumbnail
 * @returns {string} Base64 data URL of thumbnail
 */
function captureCharacterThumbnail() {
    // Try to get the Three.js renderer
    const canvas = document.querySelector('#canvas-container canvas');

    if (!canvas) {
        console.warn('Canvas not found for thumbnail');
        return null;
    }

    try {
        // Capture at reduced size for storage efficiency
        const thumbnailCanvas = document.createElement('canvas');
        thumbnailCanvas.width = 200;
        thumbnailCanvas.height = 200;

        const ctx = thumbnailCanvas.getContext('2d');

        // Draw center square of the canvas
        const size = Math.min(canvas.width, canvas.height);
        const x = (canvas.width - size) / 2;
        const y = (canvas.height - size) / 2;

        ctx.drawImage(canvas, x, y, size, size, 0, 0, 200, 200);

        return thumbnailCanvas.toDataURL('image/jpeg', 0.7);
    } catch (err) {
        console.error('Thumbnail capture error:', err);
        return null;
    }
}
