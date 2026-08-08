(() => {
    "use strict";

    /*
     * ==========================================
     * CONFIGURATION
     * ==========================================
     */

    const CONFIG = {
        musicStart: 21,

        transitionDuration: 900,

        endingDuration: 2200,

        musicVolume: 0.82,

        swipeThreshold: 60
    };


    /*
     * ==========================================
     * DOM ELEMENTS
     * ==========================================
     */

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

    const pageOneLeft = document.querySelector(".page-one-left");
    const pageOneRight = document.querySelector(".page-one-right");

    const pageTwoLeft = document.querySelector(".page-two-left");
    const pageTwoRight = document.querySelector(".page-two-right");

    const transitionOverlay =
        document.querySelector(".transition-overlay");

    const musicIndicator =
        document.querySelector(".music-indicator");

    const particlesContainer =
        document.querySelector(".particle-layer");

    const heartsContainer =
        document.querySelector(".heart-layer");

    const endingParticlesContainer =
        document.querySelector(".ending-particles");

    /*
     * Gunakan audio yang SUDAH ada di HTML.
     * HTML:
     * <audio id="backgroundMusic">
     */

    const audio =
        document.querySelector("#backgroundMusic");


    /*
     * ==========================================
     * STATE
     * ==========================================
     */

    const state = {
        current: "cover",

        transitioning: false,

        hasStarted: false,

        endingStarted: false,

        touchStartX: 0,

        touchStartY: 0,

        pointerFine:
            window.matchMedia("(pointer: fine)").matches,

        pointerRaf: null,

        tiltRaf: null
    };


    /*
     * ==========================================
     * BASIC HELPERS
     * ==========================================
     */

    function wait(duration) {
        return new Promise((resolve) => {
            window.setTimeout(resolve, duration);
        });
    }


    function setState(nextState) {
        state.current = nextState;

        if (app) {
            app.dataset.state = nextState;
        }

        body.dataset.state = nextState;

        updateProgress();
        updateFinishButton();
        updateBookInstruction();
    }


    function activateScreen(screen) {
        document
            .querySelectorAll(".screen")
            .forEach((item) => {
                item.classList.remove("active");
            });

        if (screen) {
            screen.classList.add("active");
        }
    }


    /*
     * ==========================================
     * PROGRESS
     * ==========================================
     */

    function updateProgress() {
        const dots =
            document.querySelectorAll(".progress-dot");

        dots.forEach((dot, index) => {
            const active =
                (state.current === "cover" &&
                    index === 0) ||

                (state.current === "page-one" &&
                    index === 1) ||

                (state.current === "page-two" &&
                    index === 2) ||

                (state.current === "back-cover" &&
                    index === 3);

            dot.classList.toggle("active", active);
        });
    }


    /*
     * ==========================================
     * FINISH BUTTON
     * ==========================================
     */

    function updateFinishButton() {
        if (!finishReading) {
            return;
        }

        const visible =
            state.current === "back-cover" &&
            !state.endingStarted;

        finishReading.style.opacity =
            visible ? "1" : "0";

        finishReading.style.visibility =
            visible ? "visible" : "hidden";

        finishReading.style.pointerEvents =
            visible ? "auto" : "none";
    }


    /*
     * ==========================================
     * BOOK INSTRUCTION
     * ==========================================
     */

    function updateBookInstruction() {
        const instruction =
            document.querySelector("#bookInstruction");

        if (!instruction) {
            return;
        }

        const textMap = {
            cover: "Tap to open",
            "page-one": "Keep reading",
            "page-two": "One more page",
            "back-cover": "The last page"
        };

        instruction.textContent =
            textMap[state.current] || "";
    }


    /*
     * ==========================================
     * MUSIC
     * ==========================================
     */

    function prepareAudio() {
        if (!audio) {
            return;
        }

        audio.pause();

        try {
            audio.currentTime = CONFIG.musicStart;
        } catch (error) {
            // Ignore browser timing errors.
        }

        audio.volume = CONFIG.musicVolume;
    }


    async function startMusic() {
        if (!audio || state.endingStarted) {
            return;
        }

        try {
            audio.volume = CONFIG.musicVolume;

            if (
                !Number.isFinite(audio.currentTime) ||
                audio.currentTime < CONFIG.musicStart
            ) {
                audio.currentTime = CONFIG.musicStart;
            }

            await audio.play();

            updateMusicIndicator();

        } catch (error) {
            /*
             * Beberapa browser dapat menolak autoplay.
             * Karena tombol Open merupakan user interaction,
             * biasanya play() tetap diizinkan.
             *
             * Jika tetap ditolak, kita coba lagi pada
             * pointer interaction berikutnya.
             */

            const retryMusic = () => {
                if (
                    state.hasStarted &&
                    !state.endingStarted
                ) {
                    audio.play().catch(() => {});
                }
            };

            document.addEventListener(
                "pointerdown",
                retryMusic,
                { once: true, passive: true }
            );
        }
    }


    function updateMusicIndicator() {
        if (!musicIndicator || !audio) {
            return;
        }

        musicIndicator.classList.toggle(
            "playing",
            !audio.paused &&
            !audio.ended
        );
    }


    function stopMusic() {
        if (!audio) {
            return;
        }

        audio.pause();

        try {
            audio.currentTime = 0;
        } catch (error) {
            // Ignore browser timing errors.
        }

        updateMusicIndicator();
    }


    function fadeMusic(duration = 1400) {
        if (!audio) {
            return;
        }

        const startVolume = audio.volume;
        const startTime = performance.now();

        function fade(now) {
            const progress =
                Math.min(
                    (now - startTime) / duration,
                    1
                );

            audio.volume =
                startVolume * (1 - progress);

            if (progress < 1) {
                window.requestAnimationFrame(fade);
            } else {
                stopMusic();

                audio.volume =
                    CONFIG.musicVolume;
            }
        }

        window.requestAnimationFrame(fade);
    }


    if (audio) {
        audio.volume = CONFIG.musicVolume;

        audio.addEventListener(
            "play",
            updateMusicIndicator
        );

        audio.addEventListener(
            "pause",
            updateMusicIndicator
        );

        audio.addEventListener(
            "ended",
            () => {
                /*
                 * Musik kembali ke detik 21 ketika selesai.
                 * Ending tidak melakukan loop.
                 */

                if (
                    !state.hasStarted ||
                    state.endingStarted
                ) {
                    return;
                }

                try {
                    audio.currentTime =
                        CONFIG.musicStart;
                } catch (error) {}

                audio.play().catch(() => {});

                updateMusicIndicator();
            }
        );
    }


    /*
     * ==========================================
     * TRANSITION
     * ==========================================
     */

    async function transition(callback) {
        if (state.transitioning) {
            return;
        }

        state.transitioning = true;

        if (transitionOverlay) {
            transitionOverlay.style.visibility =
                "visible";

            transitionOverlay.style.pointerEvents =
                "auto";

            transitionOverlay.style.transition =
                `opacity ${CONFIG.transitionDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`;

            transitionOverlay.style.opacity = "0";

            await wait(20);

            transitionOverlay.style.opacity =
                "0.22";
        }

        await wait(
            CONFIG.transitionDuration * 0.45
        );

        callback();

        if (transitionOverlay) {
            transitionOverlay.style.opacity = "0";
        }

        await wait(
            CONFIG.transitionDuration * 0.55
        );

        if (transitionOverlay) {
            transitionOverlay.style.visibility =
                "hidden";

            transitionOverlay.style.pointerEvents =
                "none";
        }

        state.transitioning = false;
    }


    /*
     * ==========================================
     * OPEN EXPERIENCE
     * ==========================================
     */

    async function openExperience() {
        if (
            state.hasStarted ||
            state.transitioning ||
            state.endingStarted
        ) {
            return;
        }

        state.hasStarted = true;

        prepareAudio();

        /*
         * Mulai musik secepat mungkin setelah
         * user menekan tombol Open.
         */
        startMusic();

        await transition(() => {
            activateBook();
        });

        body.classList.add("book-opened");
    }


    function activateBook() {
        body.classList.remove("intro-ready");
        body.classList.add("book-active");

        activateScreen(bookScreen);

        setState("cover");

        /*
         * Sedikit delay agar CSS transition
         * book-visible bisa berjalan dengan halus.
         */
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                body.classList.add("book-visible");
            });
        });
    }


    /*
     * ==========================================
     * BOOK NAVIGATION
     * ==========================================
     */

    async function goToCover() {
        if (
            state.current !== "page-one" ||
            state.transitioning
        ) {
            return;
        }

        await transition(() => {
            setState("cover");
        });
    }


    async function goToPageOne() {
        if (
            state.current !== "cover" &&
            state.current !== "page-two"
        ) {
            return;
        }

        await transition(() => {
            setState("page-one");
        });
    }


    async function goToPageTwo() {
        if (
            state.current !== "page-one" &&
            state.current !== "back-cover"
        ) {
            return;
        }

        await transition(() => {
            setState("page-two");
        });
    }


    async function goToBackCover() {
        if (
            state.current !== "page-two" ||
            state.transitioning
        ) {
            return;
        }

        await transition(() => {
            setState("back-cover");
        });
    }


    /*
     * NEXT
     */

    function goNext() {
        if (
            state.transitioning ||
            state.endingStarted
        ) {
            return;
        }

        if (state.current === "cover") {
            goToPageOne();
            return;
        }

        if (state.current === "page-one") {
            goToPageTwo();
            return;
        }

        if (state.current === "page-two") {
            goToBackCover();
        }
    }


    /*
     * PREVIOUS
     */

    function goPrevious() {
        if (
            state.transitioning ||
            state.endingStarted
        ) {
            return;
        }

        if (state.current === "page-one") {
            goToCover();
            return;
        }

        if (state.current === "page-two") {
            goToPageOne();
            return;
        }

        if (state.current === "back-cover") {
            goToPageTwo();
        }
    }


    /*
     * ==========================================
     * ENDING
     * ==========================================
     */

    async function finishExperience() {
        if (
            state.endingStarted ||
            state.transitioning ||
            state.current !== "back-cover"
        ) {
            return;
        }

        state.endingStarted = true;
        state.transitioning = true;

        updateFinishButton();

        /*
         * Fade musik terlebih dahulu.
         */
        fadeMusic(1600);

        /*
         * Fade ke hitam.
         */
        if (transitionOverlay) {
            transitionOverlay.style.visibility =
                "visible";

            transitionOverlay.style.pointerEvents =
                "auto";

            transitionOverlay.style.transition =
                `opacity ${CONFIG.endingDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`;

            transitionOverlay.style.opacity = "0";

            await wait(40);

            transitionOverlay.style.opacity = "1";
        }

        await wait(CONFIG.endingDuration);

        /*
         * Sembunyikan buku.
         */
        if (bookScreen) {
            bookScreen.classList.remove("active");
        }

        /*
         * Tampilkan ending.
         */
        if (endingScreen) {
            endingScreen.classList.add("active");
        }

        body.classList.remove("book-active");
        body.classList.remove("book-opened");
        body.classList.remove("book-visible");

        body.classList.add("ending-active");

        setState("ending");

        /*
         * Partikel ending dibuat setelah screen
         * aktif agar animasinya mulai dengan halus.
         */
        createEndingParticles();

        await wait(120);

        /*
         * Fade dari hitam ke ending.
         */
        if (transitionOverlay) {
            transitionOverlay.style.transition =
                "opacity 1800ms cubic-bezier(0.16, 1, 0.3, 1)";

            transitionOverlay.style.opacity = "0";

            await wait(1800);

            transitionOverlay.style.visibility =
                "hidden";

            transitionOverlay.style.pointerEvents =
                "none";
        }

        state.transitioning = false;
    }


    /*
     * ==========================================
     * BUTTONS
     * ==========================================
     */

    function setupButtons() {
        /*
         * OPEN
         */

        if (openButton) {
            openButton.addEventListener(
                "click",
                (event) => {
                    event.preventDefault();

                    openExperience();
                }
            );
        }


        /*
         * COVER → PAGE ONE
         */

        if (coverFront) {
            coverFront.addEventListener(
                "click",
                () => {
                    if (
                        state.current === "cover" &&
                        !state.transitioning
                    ) {
                        goNext();
                    }
                }
            );
        }


        /*
         * PAGE ONE LEFT → COVER
         */

        if (pageOneLeft) {
            pageOneLeft.addEventListener(
                "click",
                () => {
                    if (
                        state.current === "page-one" &&
                        !state.transitioning
                    ) {
                        goPrevious();
                    }
                }
            );
        }


        /*
         * PAGE ONE RIGHT → PAGE TWO
         */

        if (pageOneRight) {
            pageOneRight.addEventListener(
                "click",
                () => {
                    if (
                        state.current === "page-one" &&
                        !state.transitioning
                    ) {
                        goNext();
                    }
                }
            );
        }


        /*
         * PAGE TWO LEFT → PAGE ONE
         */

        if (pageTwoLeft) {
            pageTwoLeft.addEventListener(
                "click",
                () => {
                    if (
                        state.current === "page-two" &&
                        !state.transitioning
                    ) {
                        goPrevious();
                    }
                }
            );
        }


        /*
         * PAGE TWO RIGHT → BACK COVER
         */

        if (pageTwoRight) {
            pageTwoRight.addEventListener(
                "click",
                () => {
                    if (
                        state.current === "page-two" &&
                        !state.transitioning
                    ) {
                        goNext();
                    }
                }
            );
        }


        /*
         * BACK COVER → PAGE TWO
         */

        if (coverBack) {
            coverBack.addEventListener(
                "click",
                () => {
                    if (
                        state.current === "back-cover" &&
                        !state.transitioning
                    ) {
                        goPrevious();
                    }
                }
            );
        }


        /*
         * FINISH
         */

        if (finishReading) {
            finishReading.addEventListener(
                "click",
                (event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    finishExperience();
                }
            );
        }
    }


    /*
     * ==========================================
     * KEYBOARD
     * ==========================================
     */

    function setupKeyboard() {
        window.addEventListener(
            "keydown",
            (event) => {
                if (state.transitioning) {
                    return;
                }

                /*
                 * Jangan ganggu browser dengan
                 * tombol yang tidak diperlukan.
                 */

                if (event.key === "ArrowRight") {
                    event.preventDefault();

                    if (
                        state.current === "cover" ||
                        state.current === "page-one" ||
                        state.current === "page-two"
                    ) {
                        goNext();
                    }

                    return;
                }


                if (event.key === "ArrowLeft") {
                    event.preventDefault();

                    if (
                        state.current === "page-one" ||
                        state.current === "page-two" ||
                        state.current === "back-cover"
                    ) {
                        goPrevious();
                    }

                    return;
                }


                if (
                    event.key === "Enter" &&
                    state.current === "cover" &&
                    !state.hasStarted
                ) {
                    event.preventDefault();

                    openExperience();

                    return;
                }


                if (
                    event.key === "Enter" &&
                    state.current === "back-cover"
                ) {
                    event.preventDefault();

                    finishExperience();
                }
            }
        );
    }


    /*
     * ==========================================
     * TOUCH / SWIPE
     * ==========================================
     */

    function setupTouch() {
        window.addEventListener(
            "touchstart",
            (event) => {
                if (!event.changedTouches.length) {
                    return;
                }

                const touch =
                    event.changedTouches[0];

                state.touchStartX =
                    touch.clientX;

                state.touchStartY =
                    touch.clientY;
            },
            {
                passive: true
            }
        );


        window.addEventListener(
            "touchend",
            (event) => {
                if (
                    state.transitioning ||
                    state.endingStarted
                ) {
                    return;
                }

                if (!event.changedTouches.length) {
                    return;
                }

                const touch =
                    event.changedTouches[0];

                const deltaX =
                    touch.clientX -
                    state.touchStartX;

                const deltaY =
                    touch.clientY -
                    state.touchStartY;


                /*
                 * Abaikan scroll vertikal.
                 */

                if (
                    Math.abs(deltaX) <
                        CONFIG.swipeThreshold
                ) {
                    return;
                }

                if (
                    Math.abs(deltaX) <
                    Math.abs(deltaY) * 1.25
                ) {
                    return;
                }


                /*
                 * Swipe kiri = next.
                 * Swipe kanan = previous.
                 */

                if (deltaX < 0) {
                    goNext();
                } else {
                    goPrevious();
                }
            },
            {
                passive: true
            }
        );
    }


    /*
     * ==========================================
     * POINTER GLOW
     * ==========================================
     */

    function setupPointerGlow() {
        const cursorGlow =
            document.querySelector(".cursor-glow");

        if (!cursorGlow || !state.pointerFine) {
            return;
        }

        let targetX = -500;
        let targetY = -500;

        let currentX = targetX;
        let currentY = targetY;


        cursorGlow.style.opacity = "1";


        function render() {
            currentX +=
                (targetX - currentX) * 0.12;

            currentY +=
                (targetY - currentY) * 0.12;

            cursorGlow.style.transform =
                `translate3d(${currentX}px, ${currentY}px, 0)`;

            state.pointerRaf =
                window.requestAnimationFrame(
                    render
                );
        }


        window.addEventListener(
            "pointermove",
            (event) => {
                targetX = event.clientX;
                targetY = event.clientY;
            },
            {
                passive: true
            }
        );


        window.addEventListener(
            "pointerleave",
            () => {
                targetX = -500;
                targetY = -500;
            },
            {
                passive: true
            }
        );


        render();
    }


    /*
     * ==========================================
     * BOOK TILT
     * ==========================================
     */

    function setupBookTilt() {
        if (!book || !state.pointerFine) {
            return;
        }

        let targetRotateX = 0;
        let targetRotateY = 0;

        let currentRotateX = 0;
        let currentRotateY = 0;


        function render() {
            currentRotateX +=
                (targetRotateX - currentRotateX) *
                0.08;

            currentRotateY +=
                (targetRotateY - currentRotateY) *
                0.08;


            /*
             * Cover dibuat tetap lurus.
             * Tilt aktif setelah buku dibuka.
             */

            if (
                state.current !== "cover" &&
                body.classList.contains("book-active")
            ) {
                book.style.transform =
                    `translate(-50%, -50%) translateZ(0) rotateX(${currentRotateX}deg) rotateY(${currentRotateY}deg)`;
            } else {
                book.style.transform =
                    "translate(-50%, -50%) translateZ(0) rotateX(0deg) rotateY(0deg)";
            }


            state.tiltRaf =
                window.requestAnimationFrame(
                    render
                );
        }


        window.addEventListener(
            "pointermove",
            (event) => {
                if (
                    !body.classList.contains(
                        "book-active"
                    )
                ) {
                    return;
                }

                const x =
                    event.clientX /
                        window.innerWidth -
                    0.5;

                const y =
                    event.clientY /
                        window.innerHeight -
                    0.5;

                targetRotateY = x * 2.5;
                targetRotateX = y * -2.5;
            },
            {
                passive: true
            }
        );


        window.addEventListener(
            "pointerleave",
            () => {
                targetRotateX = 0;
                targetRotateY = 0;
            },
            {
                passive: true
            }
        );


        render();
    }


    /*
     * ==========================================
     * PARTICLES
     * ==========================================
     */

    function createParticles() {
        if (!particlesContainer) {
            return;
        }

        /*
         * Hindari duplicate particles jika initialize
         * dipanggil ulang.
         */

        particlesContainer.innerHTML = "";


        const amount =
            Math.min(
                70,
                Math.max(
                    30,
                    Math.floor(
                        (
                            window.innerWidth *
                            window.innerHeight
                        ) / 18000
                    )
                )
            );


        const fragment =
            document.createDocumentFragment();


        for (let i = 0; i < amount; i++) {
            const particle =
                document.createElement("span");

            particle.className = "particle";


            const size =
                Math.random() * 2 + 0.5;

            const x =
                Math.random() * 100;

            const y =
                Math.random() * 100;

            const duration =
                5000 + Math.random() * 9000;

            const delay =
                Math.random() * -9000;

            const driftX =
                (Math.random() - 0.5) * 160;

            const driftY =
                -80 - Math.random() * 180;


            particle.style.width =
                `${size}px`;

            particle.style.height =
                `${size}px`;

            particle.style.left =
                `${x}%`;

            particle.style.top =
                `${y}%`;


            particle.animate(
                [
                    {
                        opacity: 0,

                        transform:
                            "translate3d(0, 0, 0) scale(0.6)"
                    },

                    {
                        opacity: 0.45,

                        transform:
                            `translate3d(${driftX * 0.25}px, ${driftY * 0.25}px, 0) scale(1)`
                    },

                    {
                        opacity: 0,

                        transform:
                            `translate3d(${driftX}px, ${driftY}px, 0) scale(0.5)`
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
    

    /*
     * ==========================================
     * FLOATING HEARTS
     * ==========================================
     */

    function createHearts() {
        if (!heartsContainer) {
            return;
        }

        heartsContainer.innerHTML = "";


        const symbols = [
            "♡",
            "♥",
            "♡",
            "·",
            "♡"
        ];


        const amount = 18;


        const fragment =
            document.createDocumentFragment();


        for (let i = 0; i < amount; i++) {
            const heart =
                document.createElement("span");


            heart.className =
                "floating-heart";


            heart.textContent =
                symbols[
                    Math.floor(
                        Math.random() *
                        symbols.length
                    )
                ];


            const x =
                Math.random() * 100;

            const y =
                105 + Math.random() * 20;

            const size =
                12 + Math.random() * 20;

            const duration =
                10000 + Math.random() * 12000;

            const delay =
                Math.random() * -15000;

            const drift =
                (Math.random() - 0.5) * 120;


            heart.style.left =
                `${x}%`;

            heart.style.top =
                `${y}%`;

            heart.style.fontSize =
                `${size}px`;


            heart.animate(
                [
                    {
                        opacity: 0,

                        transform:
                            "translate3d(0, 0, 0) rotate(0deg)"
                    },

                    {
                        opacity: 0.8,

                        transform:
                            `translate3d(${drift * 0.35}px, -28vh, 0) rotate(${drift * 0.08}deg)`
                    },

                    {
                        opacity: 0.35,

                        transform:
                            `translate3d(${drift * 0.7}px, -62vh, 0) rotate(${drift * 0.16}deg)`
                    },

                    {
                        opacity: 0,

                        transform:
                            `translate3d(${drift}px, -110vh, 0) rotate(${drift * 0.24}deg)`
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


    /*
     * ==========================================
     * ENDING PARTICLES
     * ==========================================
     */

    function createEndingParticles() {
        if (!endingParticlesContainer) {
            return;
        }

        endingParticlesContainer.innerHTML = "";


        const fragment =
            document.createDocumentFragment();


        for (let i = 0; i < 35; i++) {
            const particle =
                document.createElement("span");


            particle.className =
                "ending-particle";


            const x =
                Math.random() * 100;

            const y =
                Math.random() * 100;

            const scale =
                0.4 + Math.random() * 1.4;

            const duration =
                5000 + Math.random() * 7000;

            const delay =
                Math.random() * -7000;


            particle.style.left =
                `${x}%`;

            particle.style.top =
                `${y}%`;


            particle.animate(
                [
                    {
                        opacity: 0,

                        transform:
                            `scale(${scale * 0.4}) translate3d(0, 0, 0)`
                    },

                    {
                        opacity: 0.45,

                        transform:
                            `scale(${scale}) translate3d(0, -15px, 0)`
                    },

                    {
                        opacity: 0,

                        transform:
                            `scale(${scale * 0.5}) translate3d(0, -40px, 0)`
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


        endingParticlesContainer.appendChild(
            fragment
        );
    }


    /*
     * ==========================================
     * RESIZE
     * ==========================================
     */

    function updateViewportVariables() {
        document.documentElement.style.setProperty(
            "--viewport-width",
            `${window.innerWidth}px`
        );

        document.documentElement.style.setProperty(
            "--viewport-height",
            `${window.innerHeight}px`
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
                            updateViewportVariables();
                        },
                        100
                    );
            },
            {
                passive: true
            }
        );
    }


    /*
     * ==========================================
     * VISIBILITY
     * ==========================================
     */

    function setupVisibility() {
        document.addEventListener(
            "visibilitychange",
            () => {
                if (!audio) {
                    return;
                }


                if (document.hidden) {
                    if (!audio.paused) {
                        audio.pause();
                    }

                    return;
                }


                if (
                    state.hasStarted &&
                    !state.endingStarted &&
                    audio.paused
                ) {
                    audio.play().catch(() => {});
                }
            }
        );
    }


    /*
     * ==========================================
     * ACCESSIBILITY
     * ==========================================
     */

    function setupPageKeyboardAccess() {
        /*
         * Elemen halaman punya tabindex="0".
         * Jadi Enter / Space juga bisa digunakan
         * untuk membuka halaman.
         */

        const interactivePages = [
            coverFront,
            pageOneLeft,
            pageOneRight,
            pageTwoLeft,
            pageTwoRight,
            coverBack
        ];


        interactivePages.forEach((element) => {
            if (!element) {
                return;
            }


            element.addEventListener(
                "keydown",
                (event) => {
                    if (
                        event.key !== "Enter" &&
                        event.key !== " "
                    ) {
                        return;
                    }


                    event.preventDefault();


                    if (
                        state.transitioning ||
                        state.endingStarted
                    ) {
                        return;
                    }


                    if (
                        element === coverFront &&
                        state.current === "cover"
                    ) {
                        goNext();

                    } else if (
                        element === pageOneLeft &&
                        state.current === "page-one"
                    ) {
                        goPrevious();

                    } else if (
                        element === pageOneRight &&
                        state.current === "page-one"
                    ) {
                        goNext();

                    } else if (
                        element === pageTwoLeft &&
                        state.current === "page-two"
                    ) {
                        goPrevious();

                    } else if (
                        element === pageTwoRight &&
                        state.current === "page-two"
                    ) {
                        goNext();

                    } else if (
                        element === coverBack &&
                        state.current === "back-cover"
                    ) {
                        goPrevious();
                    }
                }
            );
        });
                }
    

    /*
     * ==========================================
     * DISABLE UNWANTED IMAGE DRAGGING
     * ==========================================
     */

    function setupImageProtection() {
        document
            .querySelectorAll("img")
            .forEach((image) => {
                image.setAttribute(
                    "draggable",
                    "false"
                );


                image.addEventListener(
                    "dragstart",
                    (event) => {
                        event.preventDefault();
                    }
                );
            });
    }


    /*
     * ==========================================
     * INITIALIZE
     * ==========================================
     */

    function initialize() {
        /*
         * Initial state.
         */

        setState("cover");


        /*
         * Screen visibility.
         */

        activateScreen(introScreen);


        /*
         * Body state.
         */

        body.classList.add(
            "intro-ready"
        );

        body.classList.remove(
            "book-active"
        );

        body.classList.remove(
            "book-opened"
        );

        body.classList.remove(
            "book-visible"
        );

        body.classList.remove(
            "ending-active"
        );


        /*
         * Viewport.
         */

        updateViewportVariables();


        /*
         * Effects.
         */

        createParticles();

        createHearts();

        setupPointerGlow();

        setupBookTilt();


        /*
         * Interaction.
         */

        setupButtons();

        setupKeyboard();

        setupPageKeyboardAccess();

        setupTouch();


        /*
         * Browser / window.
         */

        setupResize();

        setupVisibility();

        setupImageProtection();


        /*
         * Desktop pointer class.
         */

        if (state.pointerFine) {
            body.classList.add(
                "desktop-pointer"
            );
        }


        /*
         * Preloader.
         */

        window.setTimeout(
            () => {
                const preloader =
                    document.querySelector(
                        ".preloader"
                    );

                if (preloader) {
                    preloader.classList.add(
                        "hidden"
                    );
                }
            },
            1850
        );


        /*
         * Final UI sync.
         */

        updateProgress();

        updateFinishButton();

        updateBookInstruction();

        updateMusicIndicator();
    }


    /*
     * ==========================================
     * START
     * ==========================================
     */

    if (
        document.readyState === "loading"
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
