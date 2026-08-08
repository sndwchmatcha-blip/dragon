(() => {
    "use strict";

    const EndingController = {
        screen: null,
        finishButton: null,
        content: null,
        initialized: false,
        active: false,
        transitioning: false,

        config: {
            transitionDuration: 1800,
            darknessDuration: 1500,
            contentDelay: 850
        }
    };

    function query(selector) {
        return document.querySelector(selector);
    }

    function queryAll(selector) {
        return Array.from(
            document.querySelectorAll(selector)
        );
    }

    function cacheElements() {
        EndingController.screen =
            query(".ending-screen");

        EndingController.finishButton =
            query(".finish-reading");

        EndingController.content =
            query(".ending-content");

        return Boolean(
            EndingController.screen
        );
    }

    function createEndingParticles() {
        if (
            !EndingController.screen
        ) {
            return;
        }

        let container =
            EndingController.screen.querySelector(
                ".ending-particles"
            );

        if (!container) {
            container =
                document.createElement("div");

            container.className =
                "ending-particles";

            container.setAttribute(
                "aria-hidden",
                "true"
            );

            EndingController.screen.appendChild(
                container
            );
        }

        if (
            container.children.length > 0
        ) {
            return;
        }

        const count =
            window.innerWidth < 600
                ? 18
                : 30;

        for (
            let index = 0;
            index < count;
            index += 1
        ) {
            const particle =
                document.createElement("span");

            particle.className =
                "ending-particle";

            const size =
                Math.random() *
                    2.5 +
                0.5;

            const x =
                Math.random() * 100;

            const y =
                Math.random() * 100;

            const duration =
                Math.random() *
                    7000 +
                6500;

            const delay =
                Math.random() *
                -8000;

            const driftX =
                Math.random() *
                    80 -
                40;

            const driftY =
                -(Math.random() *
                    100 +
                    50);

            particle.style.width =
                `${size}px`;

            particle.style.height =
                `${size}px`;

            particle.style.left =
                `${x}%`;

            particle.style.top =
                `${y}%`;

            particle.style.setProperty(
                "--particle-duration",
                `${duration}ms`
            );

            particle.style.setProperty(
                "--particle-delay",
                `${delay}ms`
            );

            particle.style.setProperty(
                "--particle-x",
                `${driftX}px`
            );

            particle.style.setProperty(
                "--particle-y",
                `${driftY}px`
            );

            container.appendChild(
                particle
            );
        }
    }

    function createAmbientLayers() {
        if (
            !EndingController.screen
        ) {
            return;
        }

        const requiredLayers = [
            "ending-glow-one",
            "ending-glow-two",
            "ending-glow-three"
        ];

        requiredLayers.forEach(
            className => {
                if (
                    EndingController.screen.querySelector(
                        `.${className}`
                    )
                ) {
                    return;
                }

                const layer =
                    document.createElement(
                        "div"
                    );

                layer.className =
                    className;

                layer.setAttribute(
                    "aria-hidden",
                    "true"
                );

                EndingController.screen.appendChild(
                    layer
                );
            }
        );
    }

    function prepareEnding() {
        if (
            !EndingController.screen
        ) {
            return;
        }

        EndingController.screen.classList.remove(
            "active",
            "entering",
            "visible"
        );

        EndingController.screen.setAttribute(
            "aria-hidden",
            "true"
        );

        createAmbientLayers();
        createEndingParticles();
    }

    function activateEnding() {
        if (
            !EndingController.screen
        ) {
            return;
        }

        EndingController.active =
            true;

        EndingController.screen.classList.add(
            "active",
            "entering",
            "visible"
        );

        EndingController.screen.setAttribute(
            "aria-hidden",
            "false"
        );

        if (
            EndingController.content
        ) {
            EndingController.content.classList.add(
                "visible"
            );
        }

        document.documentElement.classList.add(
            "ending-active"
        );

        document.body.classList.add(
            "ending-active"
        );
    }

    function deactivateEnding() {
        if (
            !EndingController.screen
        ) {
            return;
        }

        EndingController.active =
            false;

        EndingController.screen.classList.remove(
            "active",
            "visible",
            "entering"
        );

        EndingController.screen.setAttribute(
            "aria-hidden",
            "true"
        );

        if (
            EndingController.content
        ) {
            EndingController.content.classList.remove(
                "visible"
            );
        }

        document.documentElement.classList.remove(
            "ending-active"
        );

        document.body.classList.remove(
            "ending-active"
        );
    }

    function stopMusic() {
        if (
            window.MusicController &&
            typeof window.MusicController.stop ===
                "function"
        ) {
            return window.MusicController.stop();
        }

        const audio =
            document.querySelector(
                "#background-music"
            );

        if (!audio) {
            return Promise.resolve();
        }

        audio.pause();
        audio.currentTime = 0;

        return Promise.resolve();
    }

    function createDarknessOverlay() {
        let overlay =
            document.querySelector(
                ".ending-darkness"
            );

        if (overlay) {
            return overlay;
        }

        overlay =
            document.createElement(
                "div"
            );

        overlay.className =
            "ending-darkness";

        overlay.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.appendChild(
            overlay
        );

        return overlay;
    }

    function fadeToDark() {
        const overlay =
            createDarknessOverlay();

        overlay.classList.remove(
            "visible",
            "fade-out"
        );

        void overlay.offsetWidth;

        overlay.classList.add(
            "visible"
        );

        return new Promise(
            resolve => {
                window.setTimeout(
                    resolve,
                    EndingController.config
                        .darknessDuration
                );
            }
        );
    }

    function fadeFromDark() {
        const overlay =
            document.querySelector(
                ".ending-darkness"
            );

        if (!overlay) {
            return Promise.resolve();
        }

        overlay.classList.remove(
            "visible"
        );

        overlay.classList.add(
            "fade-out"
        );

        return new Promise(
            resolve => {
                window.setTimeout(
                    () => {
                        overlay.classList.remove(
                            "fade-out"
                        );

                        resolve();
                    },
                    900
                );
            }
        );
    }

    async function showEnding() {
        if (
            EndingController.transitioning ||
            EndingController.active
        ) {
            return;
        }

        EndingController.transitioning =
            true;

        const finishButton =
            EndingController.finishButton;

        if (
            finishButton
        ) {
            finishButton.classList.add(
                "hiding"
            );

            finishButton.setAttribute(
                "aria-hidden",
                "true"
            );
        }

        await stopMusic();

        const darknessPromise =
            fadeToDark();

        await new Promise(
            resolve => {
                window.setTimeout(
                    resolve,
                    500
                );
            }
        );

        activateEnding();

        await darknessPromise;

        const overlay =
            document.querySelector(
                ".ending-darkness"
            );

        if (overlay) {
            overlay.classList.remove(
                "visible"
            );

            overlay.classList.add(
                "fade-out"
            );
        }

        await new Promise(
            resolve => {
                window.setTimeout(
                    resolve,
                    950
                );
            }
        );

        if (overlay) {
            overlay.remove();
        }

        EndingController.transitioning =
            false;
    }

    function handleFinishClick(
        event
    ) {
        event.preventDefault();
        event.stopPropagation();

        showEnding();
    }

    function handleFinishKeyboard(
        event
    ) {
        if (
            event.key !== "Enter" &&
            event.key !== " "
        ) {
            return;
        }

        event.preventDefault();

        showEnding();
    }

    function setupFinishButton() {
        const button =
            EndingController.finishButton;

        if (!button) {
            return;
        }

        button.setAttribute(
            "role",
            "button"
        );

        button.setAttribute(
            "tabindex",
            "0"
        );

        button.setAttribute(
            "aria-label",
            "Finish reading"
        );

        button.addEventListener(
            "click",
            handleFinishClick
        );

        button.addEventListener(
            "keydown",
            handleFinishKeyboard
        );
    }

    function setupEndingEscape() {
        document.addEventListener(
            "keydown",
            event => {
                if (
                    !EndingController.active
                ) {
                    return;
                }

                if (
                    event.key === "Escape"
                ) {
                    event.preventDefault();
                }
            }
        );
    }

    function setupPageVisibility() {
        document.addEventListener(
            "visibilitychange",
            () => {
                if (
                    !EndingController.active
                ) {
                    return;
                }

                if (
                    document.hidden
                ) {
                    return;
                }

                const title =
                    query(
                        ".ending-title"
                    );

                if (
                    title
                ) {
                    title.classList.add(
                        "visible"
                    );
                }
            }
        );
    }

    function initialize() {
        if (
            EndingController.initialized
        ) {
            return;
        }

        if (
            !cacheElements()
        ) {
            return;
        }

        prepareEnding();
        setupFinishButton();
        setupEndingEscape();
        setupPageVisibility();

        EndingController.initialized =
            true;
    }

    window.EndingController = {
        show: showEnding,
        hide: deactivateEnding,
        isActive: () =>
            EndingController.active
    };

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once: true
            }
        );
    } else {
        initialize();
    }
})();
