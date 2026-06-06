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
        lastLoadedPreset: null
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
                width: 58px;
                min-height: 74px;
                padding: 10px 6px;
                border: 3px solid #000;
                border-radius: 18px;
                background: #ffe600;
                color: #000;
                box-shadow: 4px 4px 0 rgba(0, 0, 0, 1);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
                cursor: pointer;
                transition: background-color 140ms ease, transform 140ms ease, box-shadow 140ms ease;
            }

            .pc-comments-trigger:hover,
            .pc-comments-trigger:focus-visible {
                background: #fff;
                transform: translate(1px, 1px);
                box-shadow: 3px 3px 0 rgba(0, 0, 0, 1);
                outline: none;
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
                background: #1b1e20;
                border-top: 3px solid #000;
                border-left: 3px solid #000;
                border-right: 3px solid #000;
                border-top-left-radius: 26px;
                border-top-right-radius: 26px;
                box-shadow: 0 -14px 30px rgba(0, 0, 0, 0.28);
                transform: translateY(105%);
                transition: transform 180ms ease;
                overflow: hidden;
            }

            .pc-comments-overlay.open .pc-comments-panel {
                transform: translateY(0);
            }

            .pc-comments-handle {
                width: 48px;
                height: 5px;
                margin: 10px auto 2px;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.45);
                flex: 0 0 auto;
            }

            .pc-comments-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 14px 16px 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                background: #1b1e20;
            }

            .pc-comments-title-wrap {
                min-width: 0;
            }

            .pc-comments-title {
                margin: 0;
                font-family: 'Fredoka', sans-serif;
                font-size: 1rem;
                font-weight: 700;
                color: #fff;
                line-height: 1.1;
            }

            .pc-comments-subtitle {
                margin: 4px 0 0;
                font-size: 0.8rem;
                font-weight: 600;
                color: rgba(255, 255, 255, 0.68);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .pc-comments-header-actions {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 0 0 auto;
            }

            .pc-comments-icon-btn {
                width: 40px;
                height: 40px;
                border: 2px solid #000;
                border-radius: 12px;
                background: #2a2e31;
                color: #fff;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.9);
                transition: background-color 140ms ease, transform 140ms ease, box-shadow 140ms ease;
            }

            .pc-comments-icon-btn:hover,
            .pc-comments-icon-btn:focus-visible {
                background: #ffe600;
                color: #000;
                transform: translate(1px, 1px);
                box-shadow: 1px 1px 0 rgba(0, 0, 0, 1);
                outline: none;
            }

            .pc-comments-status {
                padding: 10px 16px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                background: rgba(255, 255, 255, 0.04);
                color: rgba(255, 255, 255, 0.82);
                font-size: 0.78rem;
                font-weight: 600;
            }

            .pc-comments-status[data-tone="warning"] {
                background: rgba(255, 230, 0, 0.12);
                color: #ffe600;
            }

            .pc-comments-status[data-tone="error"] {
                background: rgba(255, 77, 148, 0.12);
                color: #ff8eb8;
            }

            .pc-comments-list {
                flex: 1 1 auto;
                overflow-y: auto;
                padding: 18px 18px 20px;
                display: flex;
                flex-direction: column;
                gap: 14px;
                background: #1b1e20;
            }

            .pc-comments-empty {
                min-height: 280px;
                padding: 40px 18px 24px;
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 18px;
                background: transparent;
                text-align: center;
                color: rgba(255, 255, 255, 0.66);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }

            .pc-comments-empty strong {
                display: block;
                font-family: 'Fredoka', sans-serif;
                font-size: clamp(1.2rem, 5vw, 2rem);
                margin-bottom: 10px;
                color: #fff;
                line-height: 1.08;
            }

            .pc-comments-empty span {
                font-size: 0.98rem;
                line-height: 1.45;
            }

            .pc-comment {
                display: grid;
                grid-template-columns: 40px minmax(0, 1fr);
                gap: 10px;
                align-items: start;
            }

            .pc-comment[data-depth="1"] {
                margin-left: 18px;
            }

            .pc-comment[data-depth="2"],
            .pc-comment[data-depth="3"] {
                margin-left: 32px;
            }

            .pc-comment-avatar {
                width: 40px;
                height: 40px;
                border-radius: 999px;
                border: 2px solid #000;
                background: #ffe600;
                color: #000;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-family: 'Fredoka', sans-serif;
                font-size: 1rem;
                font-weight: 700;
                box-shadow: 2px 2px 0 rgba(0, 0, 0, 1);
            }

            .pc-comment-card {
                background: #272b2f;
                border: 2px solid #000;
                border-radius: 18px;
                box-shadow: 3px 3px 0 rgba(0, 0, 0, 1);
                padding: 10px 12px 10px;
            }

            .pc-comment-card.is-highlighted {
                background: #343127;
            }

            .pc-comment-meta {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
                margin-bottom: 6px;
            }

            .pc-comment-author {
                border: 0;
                padding: 0;
                background: transparent;
                color: #fff;
                font-family: 'Fredoka', sans-serif;
                font-size: 0.95rem;
                font-weight: 700;
                cursor: pointer;
            }

            .pc-comment-author:hover,
            .pc-comment-author:focus-visible {
                color: #ff4d94;
                outline: none;
            }

            .pc-comment-time {
                font-size: 0.74rem;
                color: rgba(255, 255, 255, 0.52);
                font-weight: 600;
            }

            .pc-comment-body {
                margin: 0;
                color: rgba(255, 255, 255, 0.9);
                font-size: 0.92rem;
                font-weight: 500;
                line-height: 1.45;
                white-space: pre-wrap;
                word-break: break-word;
            }

            .pc-comment-actions {
                display: flex;
                align-items: center;
                gap: 6px 10px;
                flex-wrap: wrap;
                margin-top: 10px;
            }

            .pc-comment-action {
                border: 0;
                padding: 0;
                background: transparent;
                color: rgba(255, 255, 255, 0.72);
                display: inline-flex;
                align-items: center;
                gap: 5px;
                font-size: 0.8rem;
                font-weight: 700;
                cursor: pointer;
            }

            .pc-comment-action:hover,
            .pc-comment-action:focus-visible,
            .pc-comment-action.is-active {
                color: #ff4d94;
                outline: none;
            }

            .pc-comment-action .material-symbols-outlined {
                font-size: 18px;
                line-height: 1;
            }

            .pc-comments-composer {
                flex: 0 0 auto;
                padding: 10px 14px calc(12px + env(safe-area-inset-bottom, 0px));
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                background: #1b1e20;
            }

            .pc-comments-primary-btn {
                border: 2px solid #000;
                border-radius: 999px;
                background: #ffe600;
                color: #000;
                box-shadow: 2px 2px 0 rgba(0, 0, 0, 1);
                padding: 10px 14px;
                font-family: 'Fredoka', sans-serif;
                font-size: 0.86rem;
                font-weight: 700;
                cursor: pointer;
                transition: background-color 140ms ease, transform 140ms ease, box-shadow 140ms ease;
            }

            .pc-comments-primary-btn:hover,
            .pc-comments-primary-btn:focus-visible {
                background: #fff;
                transform: translate(1px, 1px);
                box-shadow: 1px 1px 0 rgba(0, 0, 0, 1);
                outline: none;
            }

            .pc-comments-primary-btn[disabled] {
                opacity: 0.6;
                cursor: wait;
            }

            .pc-comments-reply-chip {
                display: none;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin-bottom: 10px;
                padding: 10px 12px;
                border: 2px solid #000;
                border-radius: 16px;
                background: #2a2e31;
                box-shadow: 2px 2px 0 rgba(0, 0, 0, 1);
            }

            .pc-comments-reply-chip.active {
                display: flex;
            }

            .pc-comments-reply-chip strong {
                display: block;
                font-family: 'Fredoka', sans-serif;
                font-size: 0.84rem;
                color: #fff;
            }

            .pc-comments-reply-chip span {
                display: block;
                margin-top: 2px;
                font-size: 0.75rem;
                font-weight: 600;
                color: rgba(255, 255, 255, 0.65);
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
                width: 36px;
                height: 36px;
                border-radius: 999px;
                background: transparent;
                color: #fff;
                font-size: 1.25rem;
                line-height: 1;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                opacity: 0.92;
                transition: transform 140ms ease, opacity 140ms ease;
            }

            .pc-comments-reaction:hover,
            .pc-comments-reaction:focus-visible {
                transform: scale(1.06);
                opacity: 1;
                outline: none;
            }

            .pc-comments-form {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .pc-comments-input-row {
                display: grid;
                grid-template-columns: 42px minmax(0, 1fr) auto;
                align-items: center;
                gap: 10px;
            }

            .pc-comments-composer-avatar {
                width: 42px;
                height: 42px;
                border-radius: 999px;
                border: 2px solid #000;
                background: #fff;
                color: #000;
                font-family: 'Fredoka', sans-serif;
                font-size: 1rem;
                font-weight: 700;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                box-shadow: 2px 2px 0 rgba(0, 0, 0, 1);
            }

            .pc-comments-input-shell {
                min-width: 0;
                border: 2px solid rgba(255, 255, 255, 0.1);
                border-radius: 999px;
                background: #23272a;
                padding: 0 14px;
            }

            .pc-comments-textarea {
                width: 100%;
                min-height: 48px;
                max-height: 112px;
                resize: none;
                border: 0;
                border-radius: 0;
                background: transparent;
                padding: 13px 0 11px;
                color: #fff;
                font: 600 0.96rem/1.35 'Montserrat', sans-serif;
                box-shadow: none;
            }

            .pc-comments-textarea:focus-visible {
                outline: none;
            }

            .pc-comments-textarea::placeholder {
                color: rgba(255, 255, 255, 0.46);
            }

            .pc-comments-textarea[readonly] {
                cursor: pointer;
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
                color: rgba(255, 255, 255, 0.42);
            }

            .pc-comments-composer-actions {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-left: auto;
            }

            .pc-comments-send-btn {
                width: 44px;
                height: 44px;
                border: 2px solid #000;
                border-radius: 999px;
                background: #ffe600;
                color: #000;
                box-shadow: 2px 2px 0 rgba(0, 0, 0, 1);
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease;
            }

            .pc-comments-send-btn:hover,
            .pc-comments-send-btn:focus-visible {
                background: #fff;
                transform: translate(1px, 1px);
                box-shadow: 1px 1px 0 rgba(0, 0, 0, 1);
                outline: none;
            }

            .pc-comments-send-btn .material-symbols-outlined {
                font-size: 22px;
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
                color: rgba(255, 255, 255, 0.68);
                font: 700 0.78rem/1 'Montserrat', sans-serif;
                cursor: pointer;
                padding: 6px 0;
            }

            .pc-comments-secondary-btn:hover,
            .pc-comments-secondary-btn:focus-visible {
                color: #fff;
                outline: none;
            }

            .pc-comments-guest-cta {
                display: grid;
                gap: 10px;
                padding: 2px 0 0;
            }

            .pc-comments-guest-copy {
                margin: 0;
                color: rgba(255, 255, 255, 0.72);
                font: 700 0.84rem/1.35 'Montserrat', sans-serif;
            }

            .pc-comments-auth-actions {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .pc-comments-auth-btn {
                border: 2px solid #000;
                border-radius: 999px;
                background: #fff;
                color: #000;
                box-shadow: 2px 2px 0 rgba(0, 0, 0, 1);
                padding: 10px 14px;
                font-family: 'Fredoka', sans-serif;
                font-size: 0.84rem;
                font-weight: 700;
                cursor: pointer;
                transition: transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease;
            }

            .pc-comments-auth-btn:hover,
            .pc-comments-auth-btn:focus-visible {
                transform: translate(1px, 1px);
                box-shadow: 1px 1px 0 rgba(0, 0, 0, 1);
                outline: none;
            }

            .pc-comments-auth-btn[data-auth-mode="login"] {
                background: #ffe600;
            }

            .pc-comments-auth-btn[data-auth-mode="register"] {
                background: #2ecc71;
                color: #000;
            }

            @media (min-width: 980px), (orientation: landscape) and (min-width: 768px) {
                .pc-comments-rail {
                    top: 104px;
                    transform: none;
                    right: calc(env(safe-area-inset-right, 0px) + 18px);
                }

                .pc-comments-trigger {
                    width: 60px;
                    min-height: 76px;
                }

                .pc-comments-overlay {
                    background: transparent;
                }

                .pc-comments-panel {
                    left: auto;
                    right: calc(env(safe-area-inset-right, 0px) + 18px);
                    top: 96px;
                    bottom: 18px;
                    width: min(390px, calc(100vw - 110px));
                    max-height: none;
                    border: 3px solid #000;
                    border-radius: 26px;
                    box-shadow: 8px 8px 0 rgba(0, 0, 0, 1);
                    transform: translateX(108%);
                }

                .pc-comments-overlay.open .pc-comments-panel {
                    transform: translateX(0);
                }

                .pc-comments-handle {
                    display: none;
                }
            }

            @media (max-width: 479px) {
                .pc-comments-rail {
                    right: calc(env(safe-area-inset-right, 0px) + 8px);
                }

                .pc-comments-trigger {
                    width: 58px;
                    min-height: 74px;
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
                    min-height: 240px;
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
                    <div class="pc-comments-handle" aria-hidden="true"></div>
                    <header class="pc-comments-header">
                        <div class="pc-comments-title-wrap">
                            <p class="pc-comments-title">Comentarios</p>
                            <p class="pc-comments-subtitle">0 comentarios</p>
                        </div>
                        <div class="pc-comments-header-actions">
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
        dom.subtitle = root.querySelector('.pc-comments-subtitle');
        dom.status = root.querySelector('.pc-comments-status');
        dom.list = root.querySelector('.pc-comments-list');
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

        window.addEventListener('resize', render);
        window.addEventListener('orientationchange', render);
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
        state.isOpen = forceOpen ? true : !state.isOpen;
        dom.overlay.hidden = !state.isOpen;
        dom.overlay.classList.toggle('open', state.isOpen);
        document.body.style.overflow = state.isOpen && !isDesktopLayout() ? 'hidden' : '';
        render();
    }

    function closePanel(options = {}) {
        const { keepFocus = true } = options;
        state.isOpen = false;
        dom.overlay.hidden = true;
        dom.overlay.classList.remove('open');
        document.body.style.overflow = '';
        if (keepFocus) dom.trigger.focus();
        render();
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
        const nextHeight = Math.min(dom.textarea.scrollHeight, 112);
        dom.textarea.style.height = `${Math.max(nextHeight, 48)}px`;
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

            const { error } = await client.from(COMMENTS_TABLE).insert(payload);
            if (error) throw error;

            clearComposer();
            await refreshForCurrentPreset({ force: true });
            scrollListToBottom();
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

    function scrollListToBottom() {
        requestAnimationFrame(() => {
            dom.list.scrollTop = dom.list.scrollHeight;
        });
    }

    function render() {
        const entryVisible = canShowEntryPoint();
        dom.root.dataset.activeView = state.activeView || '';
        dom.root.dataset.currentPreset = state.currentPreset || '';
        dom.root.dataset.entryVisible = entryVisible ? 'true' : 'false';
        dom.rail.hidden = !entryVisible || state.isOpen;
        if (!entryVisible) {
            if (state.isOpen) closePanel({ keepFocus: false });
            return;
        }

        dom.triggerCount.textContent = `${state.comments.length}`;
        dom.subtitle.textContent = `${state.comments.length} comentario${state.comments.length === 1 ? '' : 's'}`;
        dom.overlay.hidden = !state.isOpen;
        dom.overlay.classList.toggle('open', state.isOpen);

        renderStatusVisibility();
        renderCommentList();
        renderComposer();
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
                    <strong>Todavía no hay comentarios</strong>
                    <span>Inicia la conversación.</span>
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

        return roots;
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

        return `
            <article class="pc-comment" data-depth="${Math.min(depth, 3)}">
                <div class="pc-comment-avatar">${initial}</div>
                <div class="pc-comment-card ${highlighted ? 'is-highlighted' : ''}">
                    <div class="pc-comment-meta">
                        <button type="button" class="pc-comment-author" data-author-id="${escapeAttribute(comment.user_id || '')}">${authorName}</button>
                        <span class="pc-comment-time">${escapeHtml(timeLabel)}</span>
                    </div>
                    <p class="pc-comment-body">${body}</p>
                    <div class="pc-comment-actions">
                        <button type="button" class="pc-comment-action ${liked ? 'is-active' : ''}" data-comment-action="like" data-comment-id="${escapeAttribute(comment.id)}">
                            <span class="material-symbols-outlined" aria-hidden="true">${liked ? 'favorite' : 'favorite_border'}</span>
                            <span>${likeCount}</span>
                        </button>
                        <button type="button" class="pc-comment-action" data-comment-action="reply" data-comment-id="${escapeAttribute(comment.id)}" data-comment-author="${authorName}">
                            <span class="material-symbols-outlined" aria-hidden="true">reply</span>
                            <span>Responder</span>
                        </button>
                    </div>
                    ${comment.children.map((child) => renderCommentNode(child, depth + 1)).join('')}
                </div>
            </article>
        `;
    }

    function renderComposer() {
        if (!canShowEntryPoint()) return;

        const isAuthenticated = Boolean(state.currentUser);
        const userName = state.currentUser?.user_metadata?.nickname
            || state.currentUser?.email?.split('@')[0]
            || 'P';
        dom.composerAvatar.textContent = userName.charAt(0).toUpperCase();
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
