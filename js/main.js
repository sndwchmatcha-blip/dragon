(() => {
    "use strict";

    const App = {
        initialized: false,
        phase: "opening",
        transitioning: false,

        elements: {
            opening: null,
            openButton: null,
            bookScreen: null,
            bookStage: null,
            finishButton: null,
            ending: null,
            loading: null,
            audio: null
        },

        config: {
            openingDuration: 1200,
            phaseTransitionDuration: 1500,
            bookRevealDuration: 1100
        }
    };

    function query(selector) {
        return document.querySelector(selector);
    }

    function cacheElements() {
        App.elements.opening =
            query(".opening-screen");

        App.elements.openButton =
            query(".open-button");

        App.elements.bookScreen =
            query(".book-screen");

        App.elements.bookStage =
            query(".book-stage");

        App.elements.finishButton =
            query(".finish-reading");

        App.elements.ending =
            query(".ending-screen");

        App.elements.loading =
            query(".loading-screen");

        App.elements.audio =
            query("#background-music");
    }

    function lockScroll() {
        document.documentElement.classList.add(
            "is-locked"
        );

        document.body.classList.add(
            "is-locked"
        );
    }

    function unlockScroll() {
        document.documentElement.classList.remove(
            "is-locked"
        );

        document.body.classList.remove(
            "is-locked"
        );
    }

    function setPhase(phase) {
        App.phase = phase;

        document.documentElement.dataset.phase =
            phase;

        document.body.dataset.phase =
            phase;

        if (
            App.elements.opening
        ) {
            App.elements.opening.classList.toggle(
                "phase-active",
                phase === "opening"
            );

            App.elements.opening.classList.toggle(
                "phase-hidden",
                phase !== "opening"
            );
        }

        if (
            App.elements.bookScreen
        ) {
            App.elements.bookScreen.classList.toggle(
                "phase-active",
                phase === "book"
            );

            App.elements.bookScreen.classList.toggle(
                "phase-hidden",
                phase !== "book"
            );
        }

        if (
            App.elements.ending
        ) {
            App.elements.ending.classList.toggle(
                "phase-active",
                phase === "ending"
            );

            App.elements.ending.classList.toggle(
                "phase-hidden",
                phase !== "ending"
            );
        }
    }

    function prepareOpening() {
        setPhase("opening");

        lockScroll();

        document.body.classList.add(
            "app-ready"
        );
    }

    function prepareBook() {
        if (
            App.elements.bookScreen
        ) {
            App.elements.bookScreen.classList.add(
                "entering"
            );
        }

        setPhase("book");

        window.setTimeout(
            () => {
                if (
                    App.elements.bookScreen
                ) {
                    App.elements.bookScreen.classList.remove(
                        "entering"
                    );

                    App.elements.bookScreen.classList.add(
                        "entered"
                    );
                }

                if (
                    window.AuroraBackground
                ) {
                    window.AuroraBackground.resize();
                }
            },
            App.config.bookRevealDuration
        );
    }

    function playMusic() {
        if (
            window.MusicController &&
            typeof window.MusicController.start ===
                "function"
        ) {
            return window.MusicController.start();
        }

        const audio =
            App.elements.audio;

        if (!audio) {
            return Promise.resolve();
        }

        audio.volume = 0;

        try {
            audio.currentTime = 21;
        } catch {
            audio.currentTime = 0;
        }

        const promise =
            audio.play();

        if (
            promise &&
            typeof promise.then ===
                "function"
        ) {
            return promise
                .then(() => {
                    audio.volume = 0.72;
                })
                .catch(() => {});
        }

        audio.volume = 0.72;

        return Promise.resolve();
    }

    function transitionToBook() {
        if (
            App.transitioning ||
            App.phase !== "opening"
        ) {
            return;
        }

        App.transitioning = true;

        if (
            App.elements.openButton
        ) {
            App.elements.openButton.classList.add(
                "is-pressed"
            );

            App.elements.openButton.setAttribute(
                "aria-disabled",
                "true"
            );
        }

        playMusic();

        if (
            App.elements.opening
        ) {
            App.elements.opening.classList.add(
                "is-opening"
            );
        }

        window.setTimeout(
            () => {
                prepareBook();

                window.setTimeout(
                    () => {
                        App.transitioning =
                            false;

                        if (
                            App.elements.openButton
                        ) {
                            App.elements.openButton.removeAttribute(
                                "aria-disabled"
                            );
                        }
                    },
                    App.config.bookRevealDuration
                );
            },
            App.config.openingDuration
        );
    }

    function setupOpenButton() {
        const button =
            App.elements.openButton;

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
            "Open"
        );

        button.addEventListener(
            "click",
            event => {
                event.preventDefault();
                transitionToBook();
            }
        );

        button.addEventListener(
            "keydown",
            event => {
                if (
                    event.key !== "Enter" &&
                    event.key !== " "
                ) {
                    return;
                }

                event.preventDefault();

                transitionToBook();
            }
        );
    }

    function setupBookFinishBridge() {
        if (
            !App.elements.finishButton
        ) {
            return;
        }

        document.addEventListener(
            "click",
            event => {
                const target =
                    event.target instanceof Element
                        ? event.target.closest(
                              ".finish-reading"
                          )
                        : null;

                if (!target) {
                    return;
                }

                if (
                    window.EndingController &&
                    typeof window.EndingController.show ===
                        "function"
                ) {
                    return;
                }

                transitionToEndingFallback();
            },
            true
        );
    }

    function transitionToEndingFallback() {
        if (
            App.transitioning ||
            App.phase === "ending"
        ) {
            return;
        }

        App.transitioning = true;

        const finishButton =
            App.elements.finishButton;

        if (finishButton) {
            finishButton.classList.add(
                "hiding"
            );
        }

        if (
            window.MusicController
        ) {
            if (
                typeof window.MusicController.stop ===
                    "function"
            ) {
                window.MusicController.stop();
            }
        }

        const overlay =
            document.createElement("div");

        overlay.className =
            "ending-darkness";

        document.body.appendChild(
            overlay
        );

        requestAnimationFrame(
            () => {
                overlay.classList.add(
                    "visible"
                );
            }
        );

        window.setTimeout(
            () => {
                setPhase("ending");

                if (
                    App.elements.ending
                ) {
                    App.elements.ending.classList.add(
                        "visible"
                    );
                }

                overlay.classList.remove(
                    "visible"
                );

                overlay.classList.add(
                    "fade-out"
                );

                window.setTimeout(
                    () => {
                        overlay.remove();
                        App.transitioning =
                            false;
                    },
                    1000
                );
            },
            1200
        );
    }

    function setupEndingObserver() {
        if (
            !App.elements.ending
        ) {
            return;
        }

        const observer =
            new MutationObserver(
                () => {
                    if (
                        App.elements.ending.classList.contains(
                            "active"
                        )
                    ) {
                        App.phase =
                            "ending";

                        document.documentElement.dataset.phase =
                            "ending";

                        document.body.dataset.phase =
                            "ending";
                    }
                }
            );

        observer.observe(
            App.elements.ending,
            {
                attributes: true,
                attributeFilter: [
                    "class"
                ]
            }
        );
    }

    function setupPageLifecycle() {
        window.addEventListener(
            "pageshow",
            () => {
                if (
                    App.phase ===
                    "opening"
                ) {
                    prepareOpening();
                }
            }
        );

        window.addEventListener(
            "pagehide",
            () => {
                if (
                    window.AuroraBackground
                ) {
                    window.AuroraBackground.stop();
                }
            }
        );
    }

    function setupResize() {
        let resizeTimer = null;

        window.addEventListener(
            "resize",
            () => {
                window.clearTimeout(
                    resizeTimer
                );

                resizeTimer =
                    window.setTimeout(
                        () => {
                            if (
                                window.AuroraBackground
                            ) {
                                window.AuroraBackground.resize();
                            }
                        },
                        150
                    );
            },
            {
                passive: true
            }
        );

        window.addEventListener(
            "orientationchange",
            () => {
                window.setTimeout(
                    () => {
                        if (
                            window.AuroraBackground
                        ) {
                            window.AuroraBackground.resize();
                        }
                    },
                    250
                );
            },
            {
                passive: true
            }
        );
    }

    function preventContextSelection() {
        document.addEventListener(
            "dragstart",
            event => {
                const target =
                    event.target;

                if (
                    target instanceof
                        HTMLImageElement ||
                    target instanceof
                        HTMLAudioElement
                ) {
                    event.preventDefault();
                }
            }
        );
    }

    function initialize() {
        if (
            App.initialized
        ) {
            return;
        }

        cacheElements();

        prepareOpening();

        setupOpenButton();
        setupBookFinishBridge();
        setupEndingObserver();
        setupPageLifecycle();
        setupResize();
        preventContextSelection();

        if (
            window.AuroraBackground
        ) {
            window.AuroraBackground.start();
        }

        App.initialized = true;
    }

    window.AppController = {
        getPhase: () =>
            App.phase,

        goToBook: () =>
            transitionToBook(),

        goToEnding: () =>
            transitionToEndingFallback()
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
