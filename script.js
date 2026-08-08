(() => {
    "use strict";

    const CONFIG = {
        musicStart: 21,
        introDuration: 1400,
        bookDuration: 1500,
        endingDuration: 2200,
        transitionDuration: 900
    };

    const app = document.querySelector("#app");
    const body = document.body;

    const introScreen = document.querySelector(".intro-screen");
    const bookScreen = document.querySelector(".book-screen");
    const endingScreen = document.querySelector(".ending-screen");

    const openButton = document.querySelector(".open-button");
    const finishReading = document.querySelector(".finish-reading");

    const book = document.querySelector(".book");

    const coverFront = document.querySelector(".book-cover-front");
    const coverBack = document.querySelector(".book-cover-back");

    const spreadOne = document.querySelector(".spread-one");
    const spreadTwo = document.querySelector(".spread-two");

    const pageOneLeft = document.querySelector(".page-one-left");
    const pageOneRight = document.querySelector(".page-one-right");

    const pageTwoLeft = document.querySelector(".page-two-left");
    const pageTwoRight = document.querySelector(".page-two-right");

    const transitionOverlay = document.querySelector(".transition-overlay");

    const musicIndicator = document.querySelector(".music-indicator");

    const audio = new Audio("music.mp3");
    audio.preload = "auto";
    audio.loop = false;
    audio.volume = 0.82;

    let currentState = "cover";
    let isTransitioning = false;
    let hasStarted = false;
    let endingStarted = false;

    const particlesContainer = document.querySelector(".particle-layer");
    const heartsContainer = document.querySelector(".heart-layer");
    const endingParticlesContainer = document.querySelector(".ending-particles");

    function setState(state) {
        currentState = state;

        if (app) {
            app.dataset.state = state;
        }

        body.dataset.state = state;

        updateProgress();
        updateFinishButton();
    }

    function updateProgress() {
        const dots = document.querySelectorAll(".progress-dot");

        dots.forEach((dot, index) => {
            dot.classList.toggle(
                "active",
                (currentState === "cover" && index === 0) ||
                (currentState === "page-one" && index === 1) ||
                (currentState === "page-two" && index === 2) ||
                (currentState === "back-cover" && index === 3)
            );
        });
    }

    function updateFinishButton() {
        if (!finishReading) {
            return;
        }

        const visible = currentState === "back-cover";

        finishReading.style.opacity = visible ? "1" : "0";
        finishReading.style.visibility = visible ? "visible" : "hidden";
        finishReading.style.pointerEvents = visible ? "auto" : "none";
    }

    function wait(duration) {
        return new Promise(resolve => {
            window.setTimeout(resolve, duration);
        });
    }

    async function transition(callback) {
        if (isTransitioning) {
            return;
        }

        isTransitioning = true;

        if (transitionOverlay) {
            transitionOverlay.style.visibility = "visible";
            transitionOverlay.style.pointerEvents = "auto";
            transitionOverlay.style.opacity = "0";

            await wait(20);

            transitionOverlay.style.transition =
                `opacity ${CONFIG.transitionDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`;

            transitionOverlay.style.opacity = "0.18";
        }

        await wait(CONFIG.transitionDuration * 0.42);

        callback();

        if (transitionOverlay) {
            transitionOverlay.style.opacity = "0";
        }

        await wait(CONFIG.transitionDuration * 0.58);

        if (transitionOverlay) {
            transitionOverlay.style.visibility = "hidden";
            transitionOverlay.style.pointerEvents = "none";
        }

        isTransitioning = false;
    }

    function prepareAudio() {
        audio.pause();
        audio.currentTime = CONFIG.musicStart;
    }

    async function startMusic() {
        try {
            audio.currentTime = CONFIG.musicStart;
            await audio.play();

            if (musicIndicator) {
                musicIndicator.classList.add("playing");
            }
        } catch (error) {
            document.addEventListener(
                "pointerdown",
                () => {
                    audio.currentTime = CONFIG.musicStart;
                    audio.play().catch(() => {});
                },
                { once: true }
            );
        }
    }

    audio.addEventListener("ended", () => {
        if (!hasStarted || endingStarted) {
            return;
        }

        audio.currentTime = CONFIG.musicStart;

        audio.play().catch(() => {});
    });

    audio.addEventListener("play", () => {
        if (musicIndicator) {
            musicIndicator.classList.add("playing");
        }
    });

    audio.addEventListener("pause", () => {
        if (musicIndicator) {
            musicIndicator.classList.remove("playing");
        }
    });

    function stopMusic() {
        audio.pause();

        try {
            audio.currentTime = 0;
        } catch (error) {}

        if (musicIndicator) {
            musicIndicator.classList.remove("playing");
        }
    }

    function activateBook() {
        body.classList.remove("intro-ready");
        body.classList.add("book-active");

        if (bookScreen) {
            bookScreen.classList.add("active");
        }

        if (introScreen) {
            introScreen.classList.remove("active");
        }

        setState("cover");

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                body.classList.add("book-visible");
            });
        });
    }

    async function openExperience() {
        if (hasStarted || isTransitioning) {
            return;
        }

        hasStarted = true;

        prepareAudio();
        startMusic();

        await transition(() => {
            activateBook();
        });

        body.classList.add("book-opened");

        await wait(100);
    }

    async function openCoverToPageOne() {
        if (currentState !== "cover") {
            return;
        }

        await transition(() => {
            setState("page-one");
        });
    }

    async function pageOneToCover() {
        if (currentState !== "page-one") {
            return;
        }

        await transition(() => {
            setState("cover");
        });
    }

    async function pageOneToPageTwo() {
        if (currentState !== "page-one") {
            return;
        }

        await transition(() => {
            setState("page-two");
        });
    }

    async function pageTwoToPageOne() {
        if (currentState !== "page-two") {
            return;
        }

        await transition(() => {
            setState("page-one");
        });
    }

    async function pageTwoToBackCover() {
        if (currentState !== "page-two") {
            return;
        }

        await transition(() => {
            setState("back-cover");
        });
    }

    async function backCoverToPageTwo() {
        if (currentState !== "back-cover") {
            return;
        }

        await transition(() => {
            setState("page-two");
        });
    }

    async function finishExperience() {
        if (endingStarted || currentState !== "back-cover") {
            return;
        }

        endingStarted = true;

        stopMusic();

        if (transitionOverlay) {
            transitionOverlay.style.visibility = "visible";
            transitionOverlay.style.pointerEvents = "auto";
            transitionOverlay.style.transition =
                `opacity ${CONFIG.endingDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
            transitionOverlay.style.opacity = "0";
        }

        await wait(40);

        if (transitionOverlay) {
            transitionOverlay.style.opacity = "1";
        }

        await wait(CONFIG.endingDuration);

        if (bookScreen) {
            bookScreen.classList.remove("active");
        }

        if (endingScreen) {
            endingScreen.classList.add("active");
        }

        body.classList.remove("book-active");
        body.classList.add("ending-active");

        createEndingParticles();

        await wait(120);

        if (transitionOverlay) {
            transitionOverlay.style.transition =
                "opacity 1800ms cubic-bezier(0.16, 1, 0.3, 1)";
            transitionOverlay.style.opacity = "0";

            await wait(1800);

            transitionOverlay.style.visibility = "hidden";
            transitionOverlay.style.pointerEvents = "none";
        }
    }

    function createParticles() {
        if (!particlesContainer) {
            return;
        }

        const amount = Math.min(
            70,
            Math.max(
                30,
                Math.floor((window.innerWidth * window.innerHeight) / 18000)
            )
        );

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < amount; i++) {
            const particle = document.createElement("span");

            particle.className = "particle";

            const size = Math.random() * 2 + 0.5;
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const duration = 5000 + Math.random() * 9000;
            const delay = Math.random() * -9000;
            const driftX = (Math.random() - 0.5) * 160;
            const driftY = -80 - Math.random() * 180;

            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${x}%`;
            particle.style.top = `${y}%`;

            particle.animate(
                [
                    {
                        opacity: 0,
                        transform: "translate3d(0, 0, 0) scale(0.6)"
                    },
                    {
                        opacity: 0.45,
                        transform: `translate3d(${driftX * 0.25}px, ${driftY * 0.25}px, 0) scale(1)`
                    },
                    {
                        opacity: 0,
                        transform: `translate3d(${driftX}px, ${driftY}px, 0) scale(0.5)`
                    }
                ],
                {
                    duration,
                    delay,
                    iterations: Infinity,
                    easing: "ease-in-out"
                }
            );

            fragment.appendChild(particle);
        }

        particlesContainer.appendChild(fragment);
    }

    function createHearts() {
        if (!heartsContainer) {
            return;
        }

        const symbols = ["♡", "♥", "♡", "·", "♡"];
        const amount = 18;
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < amount; i++) {
            const heart = document.createElement("span");

            heart.className = "floating-heart";
            heart.textContent =
                symbols[Math.floor(Math.random() * symbols.length)];

            const x = Math.random() * 100;
            const y = 105 + Math.random() * 20;
            const size = 12 + Math.random() * 20;
            const duration = 10000 + Math.random() * 12000;
            const delay = Math.random() * -15000;
            const drift = (Math.random() - 0.5) * 120;

            heart.style.left = `${x}%`;
            heart.style.top = `${y}%`;
            heart.style.fontSize = `${size}px`;

            heart.animate(
                [
                    {
                        opacity: 0,
                        transform: `translate3d(0, 0, 0) rotate(0deg)`
                    },
                    {
                        opacity: 0.8,
                        transform: `translate3d(${drift * 0.35}px, -28vh, 0) rotate(${drift * 0.08}deg)`
                    },
                    {
                        opacity: 0.35,
                        transform: `translate3d(${drift * 0.7}px, -62vh, 0) rotate(${drift * 0.16}deg)`
                    },
                    {
                        opacity: 0,
                        transform: `translate3d(${drift}px, -110vh, 0) rotate(${drift * 0.24}deg)`
                    }
                ],
                {
                    duration,
                    delay,
                    iterations: Infinity,
                    easing: "ease-in-out"
                }
            );

            fragment.appendChild(heart);
        }

        heartsContainer.appendChild(fragment);
    }

    function createEndingParticles() {
        if (!endingParticlesContainer) {
            return;
        }

        endingParticlesContainer.innerHTML = "";

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < 35; i++) {
            const particle = document.createElement("span");

            particle.className = "ending-particle";

            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const scale = 0.4 + Math.random() * 1.4;
            const duration = 5000 + Math.random() * 7000;
            const delay = Math.random() * -7000;

            particle.style.left = `${x}%`;
            particle.style.top = `${y}%`;

            particle.animate(
                [
                    {
                        opacity: 0,
                        transform: `scale(${scale * 0.4}) translate3d(0, 0, 0)`
                    },
                    {
                        opacity: 0.45,
                        transform: `scale(${scale}) translate3d(0, -15px, 0)`
                    },
                    {
                        opacity: 0,
                        transform: `scale(${scale * 0.5}) translate3d(0, -40px, 0)`
                    }
                ],
                {
                    duration,
                    delay,
                    iterations: Infinity,
                    easing: "ease-in-out"
                }
            );

            fragment.appendChild(particle);
        }

        endingParticlesContainer.appendChild(fragment);
    }

    function setupPointerEffects() {
        const cursorGlow = document.querySelector(".cursor-glow");

        if (!cursorGlow) {
            return;
        }

        if (!window.matchMedia("(pointer: fine)").matches) {
            return;
        }

        cursorGlow.style.opacity = "1";

        let raf = null;
        let targetX = -500;
        let targetY = -500;
        let currentX = targetX;
        let currentY = targetY;

        function render() {
            currentX += (targetX - currentX) * 0.12;
            currentY += (targetY - currentY) * 0.12;

            cursorGlow.style.transform =
                `translate3d(${currentX}px, ${currentY}px, 0)`;

            raf = requestAnimationFrame(render);
        }

        window.addEventListener(
            "pointermove",
            event => {
                targetX = event.clientX;
                targetY = event.clientY;
            },
            { passive: true }
        );

        window.addEventListener(
            "pointerleave",
            () => {
                targetX = -500;
                targetY = -500;
            },
            { passive: true }
        );

        if (!raf) {
            render();
        }
    }

    function setupBookTilt() {
        if (!book) {
            return;
        }

        if (!window.matchMedia("(pointer: fine)").matches) {
            return;
        }

        let targetRotateX = 0;
        let targetRotateY = 0;
        let currentRotateX = 0;
        let currentRotateY = 0;
        let raf = null;

        function render() {
            currentRotateX += (targetRotateX - currentRotateX) * 0.08;
            currentRotateY += (targetRotateY - currentRotateY) * 0.08;

            if (currentState !== "cover") {
                book.style.transform =
                    `translate(-50%, -50%) translateZ(0) rotateX(${currentRotateX}deg) rotateY(${currentRotateY}deg)`;
            } else {
                book.style.transform =
                    "translate(-50%, -50%) translateZ(0) rotateX(0deg) rotateY(0deg)";
            }

            raf = requestAnimationFrame(render);
        }

        window.addEventListener(
            "pointermove",
            event => {
                if (!body.classList.contains("book-active")) {
                    return;
                }

                const x = event.clientX / window.innerWidth - 0.5;
                const y = event.clientY / window.innerHeight - 0.5;

                targetRotateY = x * 2.5;
                targetRotateX = y * -2.5;
            },
            { passive: true }
        );

        window.addEventListener(
            "pointerleave",
            () => {
                targetRotateX = 0;
                targetRotateY = 0;
            },
            { passive: true }
        );

        if (!raf) {
            render();
        }
    }

    function setupButtons() {
        if (openButton) {
            openButton.addEventListener("click", openExperience);
        }

        if (pageOneLeft) {
            pageOneLeft.addEventListener("click", pageOneToCover);
        }

        if (pageOneRight) {
            pageOneRight.addEventListener("click", pageOneToPageTwo);
        }

        if (pageTwoLeft) {
            pageTwoLeft.addEventListener("click", pageTwoToPageOne);
        }

        if (pageTwoRight) {
            pageTwoRight.addEventListener("click", pageTwoToBackCover);
        }

        if (coverBack) {
            coverBack.addEventListener("click", backCoverToPageTwo);
        }

        if (finishReading) {
            finishReading.addEventListener("click", finishExperience);
        }
    }

    function setupKeyboard() {
        window.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                return;
            }

            if (event.key === "ArrowRight") {
                if (currentState === "cover") {
                    openCoverToPageOne();
                } else if (currentState === "page-one") {
                    pageOneToPageTwo();
                } else if (currentState === "page-two") {
                    pageTwoToBackCover();
                }
            }

            if (event.key === "ArrowLeft") {
                if (currentState === "page-one") {
                    pageOneToCover();
                } else if (currentState === "page-two") {
                    pageTwoToPageOne();
                } else if (currentState === "back-cover") {
                    backCoverToPageTwo();
                }
            }

            if (event.key === "Enter" && currentState === "back-cover") {
                finishExperience();
            }
        });
    }

    function setupResize() {
        let resizeTimer = null;

        window.addEventListener(
            "resize",
            () => {
                window.clearTimeout(resizeTimer);

                resizeTimer = window.setTimeout(() => {
                    document.documentElement.style.setProperty(
                        "--viewport-width",
                        `${window.innerWidth}px`
                    );

                    document.documentElement.style.setProperty(
                        "--viewport-height",
                        `${window.innerHeight}px`
                    );
                }, 100);
            },
            { passive: true }
        );
    }

    function setupVisibility() {
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                audio.pause();
            } else if (
                hasStarted &&
                !endingStarted &&
                audio.paused
            ) {
                audio.play().catch(() => {});
            }
        });
    }

    function initialize() {
        setState("cover");

        if (introScreen) {
            introScreen.classList.add("active");
        }

        if (bookScreen) {
            bookScreen.classList.remove("active");
        }

        if (endingScreen) {
            endingScreen.classList.remove("active");
        }

        body.classList.add("intro-ready");

        createParticles();
        createHearts();
        setupButtons();
        setupKeyboard();
        setupPointerEffects();
        setupBookTilt();
        setupResize();
        setupVisibility();

        document.documentElement.style.setProperty(
            "--viewport-width",
            `${window.innerWidth}px`
        );

        document.documentElement.style.setProperty(
            "--viewport-height",
            `${window.innerHeight}px`
        );

        if (window.matchMedia("(pointer: fine)").matches) {
            document.body.classList.add("desktop-pointer");
        }

        window.setTimeout(() => {
            const preloader = document.querySelector(".preloader");

            if (preloader) {
                preloader.classList.add("hidden");
            }
        }, 1850);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, {
            once: true
        });
    } else {
        initialize();
    }
})();
