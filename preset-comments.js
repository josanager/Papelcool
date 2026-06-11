(() => {
    const VIEW_PARAM = 'view';
    const PRESET_PARAM = 'preset';
    const COMMENTS_TABLE = 'preset_comments';
    const COMMENT_LIKES_TABLE = 'preset_comment_likes';
    const MAX_COMMENT_LENGTH = 500;
    const REQUEST_TIMEOUT_MS = 8000;
    const DESKTOP_QUERY = '(min-width: 980px), (orientation: landscape) and (min-width: 768px)';

    const state = {
        activeView: 'showcase',
        currentPreset: null,
        currentUser: null,
        comments: [],
        likeCounts: new Map(),
        likedCommentIds: new Set(),
        profiles: new Map(),
        isOpen: false,
        isLoading: false,
        isSubmitting: false,
        hasLoadError: false,
        isSetupMissing: false,
        setupErrorMessage: '',
        replyToId: null,
        replyToAuthor: '',
        highlightedCommentId: null,
        lastLoadedPreset: null,
        sortMode: 'newest'
    };

    const dom = {};
    const controller = {
        open: () => togglePanel(true),
        close: () => closePanel(),
        refresh: (options = {}) => refreshForCurrentPreset(options),
        getState: () => ({
            activeView: state.activeView,
            currentPreset: state.currentPreset,
            currentUserId: state.currentUser?.id || null,
            isOpen: state.isOpen,
            isLoading: state.isLoading,
            isSetupMissing: state.isSetupMissing,
            commentCount: state.comments.length,
            lastLoadedPreset: state.lastLoadedPreset
        })
    };

    async function init() {
        window.presetCommentsController = controller;
        injectStyles();
        buildDom();
        bindEvents();
        wrapGlobalHooks();
        syncFromLocation();
        render();
        refreshCurrentUser()
            .then(() => renderComposer())
            .catch((error) => console.warn('Preset comments user sync warning:', error));
        refreshForCurrentPreset({ force: true })
            .catch((error) => console.warn('Preset comments refresh warning:', error));
        subscribeToAuth();
    }

    function injectStyles() {
        if (document.getElementById('pc-preset-comments-style')) return;

        const style = document.createElement('style');
        style.id = 'pc-preset-comments-style';
        style.textContent = `
            .pc-comments-root {
                position: fixed;
                inset: 0;
                z-index: 9200;
                pointer-events: none;
                font-family: 'Montserrat', sans-serif;
            }

            .pc-comments-root [hidden] {
                display: none !important;
            }

            .pc-comments-rail {
                position: fixed;
                right: calc(env(safe-area-inset-right, 0px) + 12px);
                top: 50%;
                transform: translateY(-50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                z-index: 9201;
                pointer-events: auto;
            }

            .pc-comments-rail[hidden] {
                display: none;
            }

            .pc-comments-trigger {
                width: 54px;
                min-height: 54px;
                padding: 6px;
                border: 0;
                background: transparent;
                color: #000;
                box-shadow: none;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 2px;
                cursor: pointer;
                transition: transform 140ms ease, color 140ms ease;
            }

            .pc-comments-trigger:hover,
            .pc-comments-trigger:focus-visible {
                transform: scale(1.1);
                outline: none;
                color: #ff4d94;
            }

            .pc-comments-trigger .material-symbols-outlined {
                font-size: 28px;
                line-height: 1;
            }

            .pc-comments-trigger-count {
                font-family: 'Fredoka', sans-serif;
                font-size: 0.98rem;
                font-weight: 800;
                line-height: 1;
            }

            .pc-comments-trigger-label {
                display: none;
            }

            .pc-comments-overlay {
                position: fixed;
                inset: 0;
                background: rgba(6, 11, 18, 0.22);
                display: none;
                pointer-events: auto;
            }

            .pc-comments-overlay.open {
                display: block;
            }

            .pc-comments-panel {
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                max-height: min(78dvh, 760px);
                display: flex;
                flex-direction: column;
                background: #FFFFFF;
                border-top-left-radius: 24px;
                border-top-right-radius: 24px;
                box-shadow: 0px -8px 24px rgba(0, 0, 0, 0.15);
                transform: translateY(105%);
                transition: transform 180ms ease;
                overflow: hidden;
                pointer-events: auto;
            }

            .pc-comments-overlay.open .pc-comments-panel {
                transform: translateY(0);
            }

            .pc-comments-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 14px 18px 12px;
                border-bottom: 3px solid #000;
                background: #FFFFFF;
            }

            .pc-comments-title-wrap {
                min-width: 0;
            }

            .pc-comments-title {
                margin: 0;
                font-family: 'Fredoka', sans-serif;
                font-size: 1.25rem;
                font-weight: 800;
                text-transform: uppercase;
                color: #111827;
                line-height: 1.1;
                letter-spacing: 0.02em;
            }

            .pc-comments-subtitle {
                margin: 4px 0 0;
                font-family: 'Fredoka', sans-serif;
                font-size: 0.8rem;
                font-weight: 700;
                text-transform: uppercase;
                color: #6B7280;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                letter-spacing: 0.02em;
            }

            .pc-comments-header-actions {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 0 0 auto;
            }

            .pc-comments-sort-wrapper {
                position: relative;
                width: 32px;
                height: 32px;
                display: inline-block;
            }

            .pc-comments-sort-wrapper .pc-comments-icon-btn {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                margin: 0;
            }

            .pc-comments-sort-wrapper select.pc-comments-sort {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                opacity: 0;
                cursor: pointer;
                margin: 0;
                padding: 0;
                border: 0;
                min-width: 0;
                appearance: none;
                -webkit-appearance: none;
            }

            .pc-comments-sort-wrapper:hover .pc-comments-icon-btn {
                background: #ff4d94;
                color: #fff;
                transform: translate(-1px, -1px);
                box-shadow: 3px 3px 0 rgba(0, 0, 0, 1);
            }

            .pc-comments-sort-wrapper:active .pc-comments-icon-btn {
                transform: translate(1px, 1px);
                box-shadow: 1px 1px 0 rgba(0, 0, 0, 1);
            }

            .pc-comments-sort-wrapper:focus-within .pc-comments-icon-btn {
                outline: 2px solid #0ea5e9;
                outline-offset: 2px;
            }

            .pc-comments-icon-btn {
                width: 32px;
                height: 32px;
                border: 2px solid #000;
                border-radius: 8px;
                background: #fff;
                color: #111827;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 2px 2px 0 rgba(0, 0, 0, 1);
                transition: background-color 100ms ease, transform 100ms ease, box-shadow 100ms ease;
            }

            .pc-comments-icon-btn:hover,
            .pc-comments-icon-btn:focus-visible {
                background: #ff4d94;
                color: #fff;
                transform: translate(-1px, -1px);
                box-shadow: 3px 3px 0 rgba(0, 0, 0, 1);
                outline: none;
            }

            .pc-comments-icon-btn:active {
                transform: translate(1px, 1px);
                box-shadow: 1px 1px 0 rgba(0, 0, 0, 1);
            }

            .pc-comments-status {
                padding: 10px 16px;
                border-bottom: 2px solid #000;
                background: rgba(255, 255, 255, 0.9);
                color: rgba(17, 24, 39, 0.82);
                font-size: 0.78rem;
                font-weight: 700;
                text-transform: uppercase;
                font-family: 'Fredoka', sans-serif;
            }

            .pc-comments-status[data-tone="warning"] {
                background: rgba(255, 230, 0, 0.16);
                color: #7a5200;
            }

            .pc-comments-status[data-tone="error"] {
                background: rgba(255, 77, 148, 0.12);
                color: #9f1239;
            }

            .pc-comments-list {
                flex: 1 1 auto;
                overflow-y: auto;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 16px;
                background: #FFFFFF;
            }

            .pc-comments-empty {
                min-height: 240px;
                padding: 40px 18px 24px;
                text-align: center;
                color: rgba(17, 24, 39, 0.54);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: 'Fredoka', sans-serif;
                font-size: 1.15rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.02em;
            }

            /* INSTAGRAM STYLE THREADED LAYOUT */
            .pc-comment-row {
                display: flex;
                flex-direction: column;
                gap: 12px;
                width: 100%;
            }

            .pc-comment-item {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                width: 100%;
                position: relative;
                padding: 4px 0;
                transition: background-color 0.3s ease, padding 0.3s ease;
                border-radius: 12px;
            }

            .pc-comment-item.is-highlighted {
                background-color: #FEF9C3;
                padding-left: 8px;
                padding-right: 8px;
            }

            .pc-comment-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: 2px solid #000;
                background: #ffe600;
                color: #000;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-family: 'Fredoka', sans-serif;
                font-size: 0.95rem;
                font-weight: 800;
                box-shadow: 2px 2px 0 rgba(0, 0, 0, 1);
                flex-shrink: 0;
                user-select: none;
            }

            .pc-comment-content {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                gap: 4px;
                min-width: 0;
            }

            .pc-comment-text-wrap {
                font-size: 0.88rem;
                line-height: 1.4;
                color: #1F2937;
                word-break: break-word;
                white-space: pre-wrap;
            }

            .pc-comment-author {
                border: 0;
                padding: 0;
                background: transparent;
                color: #111827;
                font-family: 'Fredoka', sans-serif;
                font-size: 0.9rem;
                font-weight: 800;
                cursor: pointer;
                display: inline;
                margin-right: 6px;
            }

            .pc-comment-author:hover,
            .pc-comment-author:focus-visible {
                color: #ff4d94;
                text-decoration: underline;
                outline: none;
            }

            .pc-comment-body {
                font-family: 'Montserrat', sans-serif;
                font-weight: 500;
                color: #374151;
            }

            .pc-comment-meta-row {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 0.76rem;
                font-weight: 600;
                color: #9CA3AF;
            }

            .pc-comment-time {
                /* standard text */
            }

            .pc-comment-meta-action {
                border: 0;
                padding: 0;
                background: transparent;
                color: #6B7280;
                font-family: 'Montserrat', sans-serif;
                font-weight: 700;
                cursor: pointer;
                transition: color 150ms ease;
            }

            .pc-comment-meta-action:hover,
            .pc-comment-meta-action:focus-visible {
                color: #ff4d94;
                outline: none;
            }

            .pc-comment-likes-count {
                /* standard text */
            }

            .pc-comment-like-btn {
                border: 0;
                padding: 4px;
                background: transparent;
                color: #D1D5DB;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: color 100ms ease, transform 100ms ease;
                flex-shrink: 0;
                align-self: center;
            }

            .pc-comment-like-btn:hover,
            .pc-comment-like-btn:focus-visible {
                color: #ff4d94;
                transform: scale(1.15);
                outline: none;
            }

            .pc-comment-like-btn.is-active {
                color: #ff4d94;
            }

            .pc-comment-like-btn .material-symbols-outlined {
                font-size: 20px;
                font-variation-settings: 'FILL' 0;
                line-height: 1;
            }

            .pc-comment-like-btn.is-active .material-symbols-outlined {
                font-variation-settings: 'FILL' 1;
            }

            .pc-comment-replies {
                padding-left: 44px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            /* COMPOSER */
            .pc-comments-composer {
                flex: 0 0 auto;
                padding: 14px 18px calc(14px + env(safe-area-inset-bottom, 0px));
                border-top: 3px solid #000;
                background: #FFF;
                z-index: 5;
            }

            .pc-comments-reply-chip {
                display: none;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin-bottom: 12px;
                padding: 8px 12px;
                border: 2px solid #000;
                border-radius: 12px;
                background: #F3F4F6;
            }

            .pc-comments-reply-chip.active {
                display: flex;
            }

            .pc-comments-reply-chip strong {
                display: block;
                font-family: 'Fredoka', sans-serif;
                font-size: 0.8rem;
                font-weight: 800;
                text-transform: uppercase;
                color: #111827;
            }

            .pc-comments-reply-chip span {
                display: block;
                margin-top: 2px;
                font-size: 0.78rem;
                font-weight: 500;
                color: #4B5563;
            }

            .pc-comments-quick-reactions {
                display: flex;
                align-items: center;
                gap: 8px;
                overflow-x: auto;
                padding: 0 0 10px;
                scrollbar-width: none;
            }

            .pc-comments-quick-reactions::-webkit-scrollbar {
                display: none;
            }

            .pc-comments-reaction {
                border: 0;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: transparent;
                font-size: 1.35rem;
                line-height: 1;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: transform 100ms ease;
            }

            .pc-comments-reaction:hover,
            .pc-comments-reaction:focus-visible {
                transform: scale(1.2);
                outline: none;
            }

            .pc-comments-form {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .pc-comments-input-row {
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
            }

            .pc-comments-composer-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 2px solid #000;
                background: #fff;
                color: #000;
                font-family: 'Fredoka', sans-serif;
                font-size: 0.88rem;
                font-weight: 800;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                box-shadow: 2px 2px 0 rgba(0, 0, 0, 1);
                flex-shrink: 0;
            }

            .pc-comments-input-shell {
                flex-grow: 1;
                border: 2px solid #000;
                border-radius: 20px;
                background: #fff;
                padding: 0 12px;
                min-width: 0;
            }

            .pc-comments-textarea {
                width: 100%;
                min-height: 38px;
                max-height: 96px;
                resize: none;
                border: 0;
                border-radius: 0;
                background: transparent;
                padding: 8px 0;
                color: #111827;
                font: 600 0.88rem/1.35 'Montserrat', sans-serif;
                box-shadow: none;
                outline: none;
            }

            .pc-comments-textarea::placeholder {
                color: #9CA3AF;
            }

            .pc-comments-form-footer {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                gap: 12px;
            }

            .pc-comments-hint {
                font-size: 0.78rem;
                font-weight: 700;
                color: rgba(17, 24, 39, 0.42);
            }

            .pc-comments-composer-actions {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-left: auto;
            }

            .pc-comments-send-btn {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: 2px solid #000;
                background: #FFE600;
                color: #000;
                box-shadow: 2px 2px 0px #000;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: transform 100ms ease, box-shadow 100ms ease, background-color 150ms ease;
                flex-shrink: 0;
            }

            .pc-comments-send-btn:hover,
            .pc-comments-send-btn:focus-visible {
                background: #fff;
                transform: translate(-1px, -1px);
                box-shadow: 3px 3px 0 rgba(0, 0, 0, 1);
                outline: none;
            }

            .pc-comments-send-btn:active {
                transform: translate(1px, 1px);
                box-shadow: 1px 1px 0 rgba(0, 0, 0, 1);
            }

            .pc-comments-send-btn .material-symbols-outlined {
                font-size: 20px;
                line-height: 1;
            }

            .pc-comments-send-btn[data-mode="login"] {
                width: auto;
                padding: 0 16px;
                font-family: 'Fredoka', sans-serif;
                font-size: 0.9rem;
                font-weight: 700;
            }

            .pc-comments-secondary-btn {
                border: 0;
                background: transparent;
                color: rgba(17, 24, 39, 0.68);
                font: 700 0.78rem/1 'Montserrat', sans-serif;
                cursor: pointer;
                padding: 6px 0;
            }

            .pc-comments-secondary-btn:hover,
            .pc-comments-secondary-btn:focus-visible {
                color: #111827;
                outline: none;
            }

            .pc-comments-guest-cta {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                gap: 12px;
                padding: 4px 0;
            }

            .pc-comments-guest-copy {
                font-family: 'Montserrat', sans-serif;
                font-weight: 700;
                font-size: 0.84rem;
                color: #374151;
                margin: 0;
            }

            .pc-comments-auth-actions {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 10px;
            }

            .pc-comments-auth-btn {
                font-family: 'Fredoka', sans-serif;
                font-weight: 800;
                font-size: 0.8rem;
                text-transform: uppercase;
                padding: 8px 16px;
                border: 2px solid #000;
                border-radius: 12px;
                box-shadow: 2px 2px 0px #000;
                cursor: pointer;
                transition: transform 100ms ease, box-shadow 100ms ease;
            }

            .pc-comments-auth-btn:hover,
            .pc-comments-auth-btn:focus-visible {
                transform: translate(-1px, -1px);
                box-shadow: 3px 3px 0 rgba(0, 0, 0, 1);
                outline: none;
            }

            .pc-comments-auth-btn:active {
                transform: translate(1px, 1px);
                box-shadow: 1px 1px 0 rgba(0, 0, 0, 1);
            }

            .pc-comments-auth-btn[data-auth-mode="login"] {
                background: #FFE600;
                color: #000;
            }

            .pc-comments-auth-btn[data-auth-mode="register"] {
                background: #2ECC71;
                color: #fff;
            }

            @media (min-width: 980px), (orientation: landscape) and (min-width: 768px) {
                .pc-comments-rail {
                    display: none !important;
                }

                .pc-comments-overlay {
                    background: transparent;
                    pointer-events: none;
                }

                .pc-comments-panel {
                    left: auto;
                    right: 0;
                    top: var(--header-height, 84px);
                    bottom: 0;
                    width: var(--custom-editor-width, clamp(320px, 25vw, 420px));
                    max-height: none;
                    border-top: 0;
                    border-right: 0;
                    border-bottom: 0;
                    border-left: 4px solid #000;
                    border-radius: 0;
                    box-shadow: none;
                    transform: translateX(0);
                }

                .pc-comments-overlay.open .pc-comments-panel {
                    transform: translateX(0);
                }

                .pc-comments-handle {
                    display: none;
                }

                .pc-comments-header {
                    padding: 18px 20px;
                }

                .pc-comments-list {
                    padding: 20px;
                }

                .pc-comments-composer {
                    padding: 14px 20px calc(14px + env(safe-area-inset-bottom, 0px));
                }

                .pc-comments-header-actions [data-action="close"] {
                    display: none;
                }
            }

            @media (max-width: 479px) {
                .pc-comments-rail {
                    right: calc(env(safe-area-inset-right, 0px) + 8px);
                }

                .pc-comments-panel {
                    max-height: 84dvh;
                }

                .pc-comments-header {
                    padding-left: 14px;
                    padding-right: 14px;
                }

                .pc-comments-list,
                .pc-comments-composer {
                    padding-left: 14px;
                    padding-right: 14px;
                }

                .pc-comments-empty {
                    min-height: 200px;
                }

                .pc-comment-replies {
                    padding-left: 32px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function buildDom() {
        const root = document.createElement('div');
        root.className = 'pc-comments-root';
        root.innerHTML = `
            <div class="pc-comments-rail" hidden>
                <button type="button" class="pc-comments-trigger" aria-label="Abrir comentarios">
                    <span class="material-symbols-outlined" aria-hidden="true">chat_bubble</span>
                    <span class="pc-comments-trigger-count">0</span>
                </button>
            </div>
            <div class="pc-comments-overlay" hidden>
                <section class="pc-comments-panel" aria-label="Comentarios del preset">
                    <header class="pc-comments-header">
                        <div class="pc-comments-title-wrap">
                            <p class="pc-comments-title">Comentarios</p>
                            <p class="pc-comments-subtitle">0 comentarios</p>
                        </div>
                        <div class="pc-comments-header-actions">
                            <div class="pc-comments-sort-wrapper">
                                <button type="button" class="pc-comments-icon-btn" aria-label="Filtrar comentarios">
                                    <span class="material-symbols-outlined" aria-hidden="true">filter_list</span>
                                </button>
                                <select class="pc-comments-sort" aria-label="Ordenar comentarios">
                                    <option value="newest">Más recientes</option>
                                    <option value="popular">Más gustados</option>
                                </select>
                            </div>
                            <button type="button" class="pc-comments-icon-btn" data-action="close" aria-label="Cerrar comentarios">
                                <span class="material-symbols-outlined" aria-hidden="true">close</span>
                            </button>
                        </div>
                    </header>
                    <div class="pc-comments-status" hidden></div>
                    <div class="pc-comments-list"></div>
                    <footer class="pc-comments-composer">
                        <div class="pc-comments-reply-chip">
                            <div>
                                <strong>Respondiendo</strong>
                                <span></span>
                            </div>
                            <button type="button" class="pc-comments-icon-btn" data-action="cancel-reply" aria-label="Cancelar respuesta">
                                <span class="material-symbols-outlined" aria-hidden="true">close</span>
                            </button>
                        </div>
                        <div class="pc-comments-quick-reactions" aria-label="Reacciones rápidas">
                            <button type="button" class="pc-comments-reaction" data-reaction="❤️" aria-label="Corazón">❤️</button>
                            <button type="button" class="pc-comments-reaction" data-reaction="🙌" aria-label="Celebrar">🙌</button>
                            <button type="button" class="pc-comments-reaction" data-reaction="🔥" aria-label="Fuego">🔥</button>
                            <button type="button" class="pc-comments-reaction" data-reaction="👏" aria-label="Aplaudir">👏</button>
                            <button type="button" class="pc-comments-reaction" data-reaction="😭" aria-label="Emoción">😭</button>
                            <button type="button" class="pc-comments-reaction" data-reaction="😍" aria-label="Amor">😍</button>
                            <button type="button" class="pc-comments-reaction" data-reaction="😮" aria-label="Sorpresa">😮</button>
                            <button type="button" class="pc-comments-reaction" data-reaction="😂" aria-label="Risa">😂</button>
                        </div>
                        <div class="pc-comments-guest-cta" hidden>
                            <p class="pc-comments-guest-copy">Inicia sesión o regístrate para comentar.</p>
                            <div class="pc-comments-auth-actions">
                                <button type="button" class="pc-comments-auth-btn" data-auth-mode="login">Inicia sesión</button>
                                <button type="button" class="pc-comments-auth-btn" data-auth-mode="register">Regístrate</button>
                            </div>
                        </div>
                        <form class="pc-comments-form">
                            <div class="pc-comments-input-row">
                                <div class="pc-comments-composer-avatar" aria-hidden="true">P</div>
                                <div class="pc-comments-input-shell">
                                    <textarea class="pc-comments-textarea" maxlength="${MAX_COMMENT_LENGTH}" placeholder="Agrega un comentario..."></textarea>
                                </div>
                                <button type="submit" class="pc-comments-send-btn" data-role="submit" aria-label="Enviar comentario">
                                    <span class="material-symbols-outlined" aria-hidden="true">arrow_upward</span>
                                </button>
                            </div>
                            <div class="pc-comments-form-footer">
                                <span class="pc-comments-hint">0/${MAX_COMMENT_LENGTH}</span>
                                <div class="pc-comments-composer-actions">
                                    <button type="button" class="pc-comments-secondary-btn" data-action="clear">Limpiar</button>
                                </div>
                            </div>
                        </form>
                    </footer>
                </section>
            </div>
        `;

        document.body.appendChild(root);

        dom.root = root;
        dom.rail = root.querySelector('.pc-comments-rail');
        dom.trigger = root.querySelector('.pc-comments-trigger');
        dom.triggerCount = root.querySelector('.pc-comments-trigger-count');
        dom.overlay = root.querySelector('.pc-comments-overlay');
        dom.panel = root.querySelector('.pc-comments-panel');
        dom.title = root.querySelector('.pc-comments-title');
        dom.subtitle = root.querySelector('.pc-comments-subtitle');
        dom.status = root.querySelector('.pc-comments-status');
        dom.list = root.querySelector('.pc-comments-list');
        dom.sortSelect = root.querySelector('.pc-comments-sort');
        dom.replyChip = root.querySelector('.pc-comments-reply-chip');
        dom.replyChipText = root.querySelector('.pc-comments-reply-chip span');
        dom.quickReactions = root.querySelector('.pc-comments-quick-reactions');
        dom.guestCta = root.querySelector('.pc-comments-guest-cta');
        dom.composerAvatar = root.querySelector('.pc-comments-composer-avatar');
        dom.form = root.querySelector('.pc-comments-form');
        dom.textarea = root.querySelector('.pc-comments-textarea');
        dom.charCount = root.querySelector('.pc-comments-hint');
        dom.clearButton = root.querySelector('[data-action="clear"]');
        dom.submitButton = root.querySelector('[data-role="submit"]');
    }

    function bindEvents() {
        dom.trigger.addEventListener('click', () => togglePanel(true));
        dom.overlay.addEventListener('click', (event) => {
            if (event.target === dom.overlay) closePanel();
        });

        dom.panel.querySelector('[data-action="close"]').addEventListener('click', closePanel);
        dom.panel.querySelector('[data-action="cancel-reply"]').addEventListener('click', clearReplyTarget);
        dom.form.querySelector('[data-action="clear"]').addEventListener('click', clearComposer);
        dom.sortSelect.addEventListener('change', () => {
            state.sortMode = dom.sortSelect.value === 'popular' ? 'popular' : 'newest';
            renderCommentList();
        });
        dom.quickReactions.addEventListener('click', handleQuickReactionClick);
        dom.guestCta.addEventListener('click', handleGuestAuthClick);

        dom.textarea.addEventListener('input', () => {
            dom.charCount.textContent = `${dom.textarea.value.trim().length}/${MAX_COMMENT_LENGTH}`;
            autoSizeTextarea();
        });

        dom.textarea.addEventListener('focus', async (event) => {
            if (!state.currentUser) {
                event.target.blur();
                await ensureAuthenticatedAction();
            }
        });

        dom.form.addEventListener('submit', async (event) => {
            event.preventDefault();
            await submitComment();
        });

        dom.list.addEventListener('click', async (event) => {
            const actionButton = event.target.closest('[data-comment-action]');
            if (actionButton) {
                const commentId = actionButton.getAttribute('data-comment-id');
                const action = actionButton.getAttribute('data-comment-action');

                if (action === 'like') {
                    await toggleCommentLike(commentId);
                    return;
                }

                if (action === 'reply') {
                    const author = actionButton.getAttribute('data-comment-author') || 'este comentario';
                    setReplyTarget(commentId, author);
                    return;
                }
            }

            const authorButton = event.target.closest('[data-author-id]');
            if (authorButton && typeof window.toggleUserProfile === 'function') {
                const authorId = authorButton.getAttribute('data-author-id');
                if (authorId) window.toggleUserProfile(true, authorId);
            }
        });

        window.addEventListener('popstate', () => {
            syncFromLocation();
            refreshForCurrentPreset();
        });

        window.addEventListener('resize', renderLayout);
        window.addEventListener('orientationchange', renderLayout);
    }

    function wrapGlobalHooks() {
        if (typeof window.navigateToView === 'function' && !window.navigateToView.__pcCommentsWrapped) {
            const originalNavigate = window.navigateToView;
            window.navigateToView = function wrappedNavigateToView(view, options) {
                const result = originalNavigate.apply(this, arguments);
                queueMicrotask(() => {
                    state.activeView = view || 'showcase';
                    if (state.activeView !== 'preset-preview') closePanel({ keepFocus: false });
                    syncFromLocation();
                    render();
                    refreshForCurrentPreset();
                });
                return result;
            };
            window.navigateToView.__pcCommentsWrapped = true;
        }

        if (typeof window.setPresetCharacter === 'function' && !window.setPresetCharacter.__pcCommentsWrapped) {
            const originalSetPresetCharacter = window.setPresetCharacter;
            window.setPresetCharacter = async function wrappedSetPresetCharacter(name) {
                const result = await originalSetPresetCharacter.apply(this, arguments);
                state.currentPreset = name || getPresetFromLocation();
                refreshForCurrentPreset({ force: true });
                render();
                return result;
            };
            window.setPresetCharacter.__pcCommentsWrapped = true;
        }
    }

    function subscribeToAuth() {
        if (typeof window.onAuthStateChange !== 'function') return;
        window.onAuthStateChange(async (_event, session) => {
            state.currentUser = session?.user || null;
            renderComposer();
            if (state.currentUser) {
                await refreshForCurrentPreset({ force: true });
            } else {
                state.likedCommentIds = new Set();
                render();
            }
        });
    }

    async function refreshCurrentUser() {
        if (typeof window.getCurrentUser !== 'function') return;
        state.currentUser = await withTimeout(
            window.getCurrentUser().catch(() => null),
            REQUEST_TIMEOUT_MS,
            'La sesión de usuario tardó demasiado en responder.'
        ).catch(() => null);
        renderComposer();
    }

    function syncFromLocation() {
        const params = new URLSearchParams(window.location.search);
        state.activeView = params.get(VIEW_PARAM) || 'showcase';
        state.currentPreset = params.get(PRESET_PARAM) || state.currentPreset;
        if (state.activeView !== 'preset-preview') {
            state.currentPreset = params.get(PRESET_PARAM) || state.currentPreset;
        }
    }

    function getPresetFromLocation() {
        return new URLSearchParams(window.location.search).get(PRESET_PARAM);
    }

    function getPresetLabel() {
        const fallback = state.currentPreset || 'Preset';
        if (typeof window.getPresetDisplayName === 'function') {
            try {
                return window.getPresetDisplayName(fallback);
            } catch (_error) {
                return fallback;
            }
        }
        return fallback;
    }

    function canShowEntryPoint() {
        const params = new URLSearchParams(window.location.search);
        const urlView = params.get(VIEW_PARAM) || state.activeView;
        const urlPreset = params.get(PRESET_PARAM) || state.currentPreset;

        state.activeView = urlView || state.activeView;
        state.currentPreset = urlPreset || state.currentPreset;

        return urlView === 'preset-preview' && Boolean(urlPreset);
    }

    function isDesktopLayout() {
        return window.matchMedia(DESKTOP_QUERY).matches;
    }

    async function refreshForCurrentPreset(options = {}) {
        const { force = false } = options;

        if (!canShowEntryPoint()) {
            state.comments = [];
            state.likeCounts = new Map();
            state.likedCommentIds = new Set();
            state.isLoading = false;
            state.hasLoadError = false;
            state.isSetupMissing = false;
            state.setupErrorMessage = '';
            render();
            return;
        }

        if (!force && state.lastLoadedPreset === state.currentPreset && state.comments.length > 0) {
            render();
            return;
        }

        const client = typeof window.getSupabaseClient === 'function' ? window.getSupabaseClient() : null;
        if (!client) {
            state.comments = [];
            state.likeCounts = new Map();
            state.hasLoadError = false;
            state.isSetupMissing = true;
            state.setupErrorMessage = 'Supabase no está disponible en esta vista.';
            render();
            return;
        }

        state.isLoading = true;
        renderStatus('', 'default', true);
        render();

        try {
            const { data: commentRows, error: commentsError } = await withTimeout(
                client
                    .from(COMMENTS_TABLE)
                    .select('id, preset_slug, parent_id, body, user_id, created_at, updated_at')
                    .eq('preset_slug', state.currentPreset)
                    .order('created_at', { ascending: true })
                    .limit(300),
                REQUEST_TIMEOUT_MS,
                'La carga de comentarios tardó demasiado.'
            );

            if (commentsError) throw commentsError;

            const comments = Array.isArray(commentRows) ? commentRows : [];
            const userIds = [...new Set(comments.map((comment) => comment.user_id).filter(Boolean))];
            const commentIds = comments.map((comment) => comment.id);

            let profiles = [];
            if (userIds.length > 0) {
                const { data: profileRows, error: profilesError } = await withTimeout(
                    client
                        .from('profiles')
                        .select('id, nickname, avatar_url')
                        .in('id', userIds),
                    REQUEST_TIMEOUT_MS,
                    'La carga de perfiles tardó demasiado.'
                );

                if (profilesError) throw profilesError;
                profiles = Array.isArray(profileRows) ? profileRows : [];
            }

            let likes = [];
            if (commentIds.length > 0) {
                const { data: likeRows, error: likesError } = await withTimeout(
                    client
                        .from(COMMENT_LIKES_TABLE)
                        .select('comment_id, user_id')
                        .in('comment_id', commentIds)
                        .limit(2000),
                    REQUEST_TIMEOUT_MS,
                    'La carga de likes tardó demasiado.'
                );

                if (likesError) throw likesError;
                likes = Array.isArray(likeRows) ? likeRows : [];
            }

            state.comments = comments;
            state.profiles = new Map(profiles.map((profile) => [profile.id, profile]));
            state.likeCounts = buildLikeCounts(likes);
            state.likedCommentIds = buildLikedCommentIds(likes, state.currentUser?.id || null);
            state.hasLoadError = false;
            state.isSetupMissing = false;
            state.setupErrorMessage = '';
            state.lastLoadedPreset = state.currentPreset;
            state.isLoading = false;
            renderStatus('', 'default', true);
            render();
        } catch (error) {
            state.comments = [];
            state.likeCounts = new Map();
            state.likedCommentIds = new Set();
            state.isLoading = false;
            state.hasLoadError = true;
            state.lastLoadedPreset = null;

            if (looksLikeSetupError(error)) {
                state.hasLoadError = false;
                state.isSetupMissing = true;
                state.setupErrorMessage = 'Falta configurar las tablas de comentarios en Supabase.';
                renderStatus(state.setupErrorMessage, 'warning');
            } else {
                state.isSetupMissing = false;
                state.setupErrorMessage = error?.message || 'No se pudieron cargar los comentarios.';
                renderStatus(state.setupErrorMessage, 'error');
            }

            render();
            console.error('Preset comments load error:', error);
        }
    }

    function buildLikeCounts(rows) {
        const counts = new Map();
        rows.forEach((row) => {
            if (!row?.comment_id) return;
            counts.set(row.comment_id, (counts.get(row.comment_id) || 0) + 1);
        });
        return counts;
    }

    function buildLikedCommentIds(rows, userId) {
        if (!userId) return new Set();
        return new Set(
            rows
                .filter((row) => row?.user_id === userId && row?.comment_id)
                .map((row) => row.comment_id)
        );
    }

    function looksLikeSetupError(error) {
        const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
        return message.includes('does not exist') ||
            message.includes('relation') ||
            message.includes('schema cache') ||
            message.includes('permission denied for table') ||
            error?.code === '42P01';
    }

    function togglePanel(forceOpen = false) {
        if (!canShowEntryPoint()) return;
        if (isDesktopLayout()) {
            state.isOpen = true;
            dom.overlay.hidden = false;
            dom.overlay.classList.add('open');
            document.body.classList.add('comments-panel-open');
            document.body.style.overflow = '';
            render();
            window.dispatchEvent(new Event('resize'));
            if (typeof window.startSmoothResizeLoop === 'function') window.startSmoothResizeLoop(350);
            setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
            return;
        }
        state.isOpen = forceOpen ? true : !state.isOpen;
        dom.overlay.hidden = !state.isOpen;
        dom.overlay.classList.toggle('open', state.isOpen);
        document.body.classList.toggle('comments-panel-open', state.isOpen);
        document.body.style.overflow = state.isOpen && !isDesktopLayout() ? 'hidden' : '';
        render();
        window.dispatchEvent(new Event('resize'));
        if (typeof window.startSmoothResizeLoop === 'function') window.startSmoothResizeLoop(350);
        setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
    }

    function closePanel(options = {}) {
        const { keepFocus = true } = options;
        if (isDesktopLayout() && canShowEntryPoint()) {
            state.isOpen = true;
            dom.overlay.hidden = false;
            dom.overlay.classList.add('open');
            document.body.classList.add('comments-panel-open');
            document.body.style.overflow = '';
            render();
            return;
        }
        state.isOpen = false;
        dom.overlay.hidden = true;
        dom.overlay.classList.remove('open');
        document.body.classList.remove('comments-panel-open');
        document.body.style.overflow = '';
        if (keepFocus) dom.trigger.focus();
        render();
        window.dispatchEvent(new Event('resize'));
        if (typeof window.startSmoothResizeLoop === 'function') window.startSmoothResizeLoop(350);
        setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
    }

    function setReplyTarget(commentId, author) {
        state.replyToId = commentId;
        state.replyToAuthor = author || 'este comentario';
        renderComposer();
        dom.textarea.focus();
    }

    function clearReplyTarget() {
        state.replyToId = null;
        state.replyToAuthor = '';
        renderComposer();
    }

    function clearComposer() {
        dom.textarea.value = '';
        dom.charCount.textContent = `0/${MAX_COMMENT_LENGTH}`;
        autoSizeTextarea();
        clearReplyTarget();
    }

    async function handleQuickReactionClick(event) {
        const button = event.target.closest('[data-reaction]');
        if (!button) return;

        const emoji = button.getAttribute('data-reaction');
        if (!emoji) return;

        const isAuthenticated = await ensureAuthenticatedAction();
        if (!isAuthenticated) return;

        const currentValue = dom.textarea.value.trim();
        dom.textarea.value = currentValue ? `${currentValue} ${emoji}` : emoji;
        dom.charCount.textContent = `${dom.textarea.value.trim().length}/${MAX_COMMENT_LENGTH}`;
        autoSizeTextarea();
        dom.textarea.focus();
    }

    function handleGuestAuthClick(event) {
        const button = event.target.closest('[data-auth-mode]');
        if (!button) return;
        const mode = button.getAttribute('data-auth-mode') || 'login';
        openCommentsAuth(mode);
    }

    function autoSizeTextarea() {
        dom.textarea.style.height = 'auto';
        const nextHeight = Math.min(dom.textarea.scrollHeight, 96);
        dom.textarea.style.height = `${Math.max(nextHeight, 38)}px`;
    }

    async function ensureAuthenticatedAction() {
        await refreshCurrentUser();
        if (state.currentUser) return true;

        openCommentsAuth('login');
        return false;
    }

    function getCommentsAuthContext() {
        return {
            url: window.location.href,
            view: 'preset-preview',
            preset: state.currentPreset,
            reopenComments: true,
            source: 'preset-comments'
        };
    }

    function openCommentsAuth(mode = 'login') {
        if (typeof window.openAuthWithReturn === 'function') {
            window.openAuthWithReturn(mode, getCommentsAuthContext());
            return;
        }

        if (typeof window.setAuthReturnContext === 'function') {
            window.setAuthReturnContext(getCommentsAuthContext());
        }

        if (typeof window.showAuthModal === 'function') {
            window.showAuthModal(mode);
        } else if (typeof window.navigateToView === 'function') {
            window.navigateToView(mode);
        }
    }

    async function submitComment() {
        const body = dom.textarea.value.trim();
        if (state.isSubmitting || !state.currentPreset) return;

        const isAuthenticated = state.currentUser ? true : await ensureAuthenticatedAction();
        if (!isAuthenticated) return;
        if (!body) return;

        const client = typeof window.getSupabaseClient === 'function' ? window.getSupabaseClient() : null;
        if (!client) return;

        state.isSubmitting = true;
        dom.submitButton.disabled = true;
        dom.submitButton.textContent = '...';

        try {
            const payload = {
                preset_slug: state.currentPreset,
                parent_id: state.replyToId || null,
                user_id: state.currentUser.id,
                body
            };

            const { data: insertedComment, error } = await client
                .from(COMMENTS_TABLE)
                .insert(payload)
                .select('id')
                .single();
            if (error) throw error;

            clearComposer();
            await refreshForCurrentPreset({ force: true });
            highlightComment(insertedComment?.id || null);
        } catch (error) {
            renderStatus(error?.message || 'No se pudo publicar el comentario.', 'error');
            console.error('Preset comment insert error:', error);
        } finally {
            state.isSubmitting = false;
            dom.submitButton.disabled = false;
            renderComposer();
        }
    }

    async function toggleCommentLike(commentId) {
        if (!commentId) return;
        const isAuthenticated = await ensureAuthenticatedAction();
        if (!isAuthenticated) return;

        const client = typeof window.getSupabaseClient === 'function' ? window.getSupabaseClient() : null;
        if (!client || !state.currentUser) return;

        const hasLiked = state.likedCommentIds.has(commentId);

        try {
            if (hasLiked) {
                const { error } = await client
                    .from(COMMENT_LIKES_TABLE)
                    .delete()
                    .eq('comment_id', commentId)
                    .eq('user_id', state.currentUser.id);
                if (error) throw error;
            } else {
                const { error } = await client
                    .from(COMMENT_LIKES_TABLE)
                    .insert({ comment_id: commentId, user_id: state.currentUser.id });
                if (error) throw error;
            }

            await refreshForCurrentPreset({ force: true });
        } catch (error) {
            renderStatus(error?.message || 'No se pudo actualizar el like.', 'error');
            console.error('Preset comment like error:', error);
        }
    }

    function renderLayout() {
        const entryVisible = canShowEntryPoint();
        const desktopLayout = isDesktopLayout();
        dom.root.dataset.activeView = state.activeView || '';
        dom.root.dataset.currentPreset = state.currentPreset || '';
        dom.root.dataset.entryVisible = entryVisible ? 'true' : 'false';
        if (entryVisible && desktopLayout) {
            state.isOpen = true;
        }
        dom.rail.hidden = !entryVisible || state.isOpen || desktopLayout;
        if (!entryVisible) {
            if (state.isOpen) closePanel({ keepFocus: false });
            return;
        }

        dom.overlay.hidden = !state.isOpen;
        dom.overlay.classList.toggle('open', state.isOpen);
        document.body.classList.toggle('comments-panel-open', state.isOpen);
        document.body.style.overflow = state.isOpen && !desktopLayout ? 'hidden' : '';
        syncHostLayout(entryVisible, desktopLayout);
    }

    function render() {
        renderLayout();
        const entryVisible = canShowEntryPoint();
        if (!entryVisible) return;

        dom.triggerCount.textContent = `${state.comments.length}`;
        dom.title.textContent = getPresetLabel();
        dom.subtitle.textContent = `${state.comments.length} comentario${state.comments.length === 1 ? '' : 's'}`;
        dom.sortSelect.value = state.sortMode;

        renderStatusVisibility();
        renderCommentList();
        renderComposer();
    }

    function syncHostLayout(entryVisible, desktopLayout) {
        const canvasContainer = document.getElementById('canvas-container');
        const previewStage = document.getElementById('preset-preview-stage');
        const shouldSplitDesktop = entryVisible && state.isOpen && desktopLayout;

        if (canvasContainer) {
            canvasContainer.style.left = '0px';
            canvasContainer.style.width = shouldSplitDesktop ? 'calc(100vw - var(--custom-editor-width))' : '100vw';
            canvasContainer.style.right = shouldSplitDesktop ? 'var(--custom-editor-width)' : '0px';
        }

        if (previewStage) {
            previewStage.style.right = shouldSplitDesktop ? 'var(--custom-editor-width)' : '';
        }
    }

    function renderStatus(message, tone = 'default', hide = false) {
        if (hide) {
            dom.status.hidden = true;
            dom.status.textContent = '';
            dom.status.removeAttribute('data-tone');
            return;
        }

        dom.status.hidden = !message;
        dom.status.textContent = message || '';
        if (message) dom.status.setAttribute('data-tone', tone);
    }

    function renderStatusVisibility() {
        if (state.isLoading) return;

        if (state.isSetupMissing) {
            renderStatus(state.setupErrorMessage || 'Comentarios no listos.', 'warning');
            return;
        }

        if (dom.status.textContent && dom.status.getAttribute('data-tone') === 'error') return;
        renderStatus('', 'default', true);
    }

    function renderCommentList() {
        if (state.isLoading && state.comments.length === 0) {
            dom.list.innerHTML = `<div class="pc-comments-empty"><strong>Cargando...</strong></div>`;
            return;
        }

        if (state.isSetupMissing) {
            dom.list.innerHTML = `
                <div class="pc-comments-empty">
                    <strong>Comentarios no listos</strong>
                    <span>Configura Supabase.</span>
                </div>
            `;
            return;
        }

        if (state.hasLoadError) {
            dom.list.innerHTML = `
                <div class="pc-comments-empty">
                    <strong>No se pudo cargar</strong>
                    <span>Inténtalo otra vez.</span>
                </div>
            `;
            return;
        }

        if (state.comments.length === 0) {
            dom.list.innerHTML = `
                <div class="pc-comments-empty">
                    Sé el primero en comentar
                </div>
            `;
            return;
        }

        const tree = buildCommentTree(state.comments);
        dom.list.innerHTML = tree.map((comment) => renderCommentNode(comment, 0)).join('');
    }

    function buildCommentTree(comments) {
        const byId = new Map();
        const roots = [];

        comments.forEach((comment) => {
            byId.set(comment.id, { ...comment, children: [] });
        });

        comments.forEach((comment) => {
            const node = byId.get(comment.id);
            if (comment.parent_id && byId.has(comment.parent_id)) {
                byId.get(comment.parent_id).children.push(node);
            } else {
                roots.push(node);
            }
        });

        roots.forEach(sortCommentChildren);
        roots.sort((left, right) => compareComments(left, right, state.sortMode));
        return roots;
    }

    function sortCommentChildren(comment) {
        comment.children.sort((left, right) => compareComments(left, right, 'oldest'));
        comment.children.forEach(sortCommentChildren);
    }

    function compareComments(left, right, mode = 'newest') {
        const leftTime = new Date(left?.created_at || 0).getTime();
        const rightTime = new Date(right?.created_at || 0).getTime();
        const leftLikes = state.likeCounts.get(left?.id) || 0;
        const rightLikes = state.likeCounts.get(right?.id) || 0;

        if (mode === 'popular') {
            if (rightLikes !== leftLikes) return rightLikes - leftLikes;
            return rightTime - leftTime;
        }

        if (mode === 'oldest') {
            return leftTime - rightTime;
        }

        return rightTime - leftTime;
    }

    function hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    }

    function getAvatarColor(userId) {
        const colors = ['#FF4D94', '#FFE600', '#407BFF', '#2ECC71'];
        if (!userId) return colors[0];
        const index = Math.abs(hashCode(userId)) % colors.length;
        return colors[index];
    }

    function renderCommentNode(comment, depth) {
        const profile = state.profiles.get(comment.user_id) || null;
        const authorName = escapeHtml(profile?.nickname || 'Coleccionista');
        const initial = escapeHtml((profile?.nickname || 'P').charAt(0).toUpperCase());
        const body = escapeHtml(comment.body || '').replace(/\n/g, '<br>');
        const likeCount = state.likeCounts.get(comment.id) || 0;
        const liked = state.likedCommentIds.has(comment.id);
        const timeLabel = formatRelativeTime(comment.created_at);
        const highlighted = state.highlightedCommentId === comment.id;
        const avatarBg = getAvatarColor(comment.user_id || authorName);

        return `
            <div class="pc-comment-row" data-comment-node-id="${escapeAttribute(comment.id)}">
                <article class="pc-comment-item ${highlighted ? 'is-highlighted' : ''}" data-comment-id="${escapeAttribute(comment.id)}">
                    <div class="pc-comment-avatar" style="background: ${avatarBg};">${initial}</div>
                    <div class="pc-comment-content">
                        <div class="pc-comment-text-wrap">
                            <button type="button" class="pc-comment-author" data-author-id="${escapeAttribute(comment.user_id || '')}">${authorName}</button>
                            <span class="pc-comment-body">${body}</span>
                        </div>
                        <div class="pc-comment-meta-row">
                            <span class="pc-comment-time">${escapeHtml(timeLabel)}</span>
                            <span class="pc-comment-likes-count">${likeCount} ${likeCount === 1 ? 'me gusta' : 'me gusta'}</span>
                            <button type="button" class="pc-comment-meta-action" data-comment-action="reply" data-comment-id="${escapeAttribute(comment.id)}" data-comment-author="${authorName}">Responder</button>
                        </div>
                    </div>
                    <button type="button" class="pc-comment-like-btn ${liked ? 'is-active' : ''}" data-comment-action="like" data-comment-id="${escapeAttribute(comment.id)}" aria-label="Me gusta">
                        <span class="material-symbols-outlined" aria-hidden="true">${liked ? 'favorite' : 'favorite_border'}</span>
                    </button>
                </article>
                ${comment.children && comment.children.length > 0 ? `
                    <div class="pc-comment-replies">
                        ${comment.children.map((child) => renderCommentNode(child, depth + 1)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    function renderComposer() {
        if (!canShowEntryPoint()) return;

        const isAuthenticated = Boolean(state.currentUser);
        const userName = state.currentUser?.user_metadata?.nickname
            || state.currentUser?.email?.split('@')[0]
            || 'P';
        dom.composerAvatar.textContent = userName.charAt(0).toUpperCase();
        if (isAuthenticated && state.currentUser?.id) {
            dom.composerAvatar.style.background = getAvatarColor(state.currentUser.id);
        } else {
            dom.composerAvatar.style.background = '#FFFFFF';
        }
        dom.quickReactions.hidden = !isAuthenticated || state.isSetupMissing;
        dom.guestCta.hidden = isAuthenticated || state.isSetupMissing;
        dom.form.hidden = !isAuthenticated || state.isSetupMissing;
        dom.textarea.readOnly = !isAuthenticated;
        dom.textarea.disabled = state.isSetupMissing;
        dom.replyChip.classList.toggle('active', Boolean(state.replyToId));
        dom.replyChipText.textContent = state.replyToAuthor ? `a ${state.replyToAuthor}` : '';
        dom.textarea.placeholder = isAuthenticated
            ? (state.replyToId ? `Responde a ${state.replyToAuthor}...` : 'Agrega un comentario...')
            : 'Agrega un comentario...';
        dom.submitButton.disabled = state.isSubmitting || state.isSetupMissing;
        dom.submitButton.dataset.mode = isAuthenticated ? 'send' : 'login';
        dom.submitButton.setAttribute('aria-label', isAuthenticated ? 'Enviar comentario' : 'Iniciar sesión');
        dom.submitButton.innerHTML = isAuthenticated
            ? '<span class="material-symbols-outlined" aria-hidden="true">arrow_upward</span>'
            : 'Entrar';
        dom.charCount.textContent = `${dom.textarea.value.trim().length}/${MAX_COMMENT_LENGTH}`;
        dom.charCount.hidden = !isAuthenticated;
        dom.clearButton.hidden = !dom.textarea.value.trim() && !state.replyToId;
        autoSizeTextarea();
    }

    function highlightComment(commentId) {
        state.highlightedCommentId = commentId || null;
        renderCommentList();

        if (!commentId) return;

        requestAnimationFrame(() => {
            const commentNode = dom.list.querySelector(`[data-comment-node-id="${escapeAttribute(commentId)}"]`);
            commentNode?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });

        window.setTimeout(() => {
            if (state.highlightedCommentId === commentId) {
                state.highlightedCommentId = null;
                renderCommentList();
            }
        }, 2200);
    }

    function formatRelativeTime(input) {
        if (!input) return 'Ahora';
        const date = new Date(input);
        const diffMs = Date.now() - date.getTime();
        const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

        if (diffMinutes < 1) return 'Ahora';
        if (diffMinutes < 60) return `Hace ${diffMinutes} min`;

        const diffHours = Math.round(diffMinutes / 60);
        if (diffHours < 24) return `Hace ${diffHours} h`;

        const diffDays = Math.round(diffHours / 24);
        if (diffDays < 7) return `Hace ${diffDays} d`;

        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric'
        });
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/`/g, '&#96;');
    }

    function withTimeout(promise, timeoutMs, message) {
        let timerId = null;
        const normalizedPromise = Promise.resolve(promise);

        return Promise.race([
            normalizedPromise.finally(() => {
                if (timerId) window.clearTimeout(timerId);
            }),
            new Promise((_, reject) => {
                timerId = window.setTimeout(() => {
                    reject(new Error(message));
                }, timeoutMs);
            })
        ]);
    }

    document.addEventListener('DOMContentLoaded', () => {
        init().catch((error) => {
            console.error('Preset comments init error:', error);
        });
    });
})();
