(() => {
    "use strict";

    const APP = {
        screens: {
            intro: document.querySelector(".intro-screen"),
            book: document.querySelector(".book-screen"),
            ending: document.querySelector(".ending-screen")
        },

        controls: {
            open: document.querySelector(".open-button"),
            finish: document.querySelector(".finish-reading"),
            music: document.querySelector(".music-indicator")
        },

        book: {
            root: document.querySelector(".book"),
            stage: document.querySelector(".book-stage"),
            pages: document.querySelectorAll(".book-page"),
            coverFront: document.querySelector(".book-cover-front"),
            coverBack: document.querySelector(".book-cover-back")
        },

        overlay: document.querySelector(".transition-overlay"),

        state: {
            currentScreen: "intro",
            bookState: "cover",
            transitioning: false,
            initialized: false,
            ending: false
        }
    };

    const CONFIG = {
        transitions: {
            introToBook: 1150,
            bookToEnding: 1800,
            pageFlip: 1350,
            fade: 1200
        },

        selectors: {
            active: "active",
            leaving: "leaving",
            entering: "entering"
        }
    };

    function wait(duration) {
        return new Promise(resolve => {
            window.setTimeout(resolve, duration);
        });
    }

    function hasElement(element) {
        return element instanceof Element;
    }

    function setActiveScreen(name) {
        Object.entries(APP.screens).forEach(([key, screen]) => {
            if (!hasElement(screen)) {
                return;
            }

            screen.classList.toggle(
                CONFIG.selectors.active,
                key === name
            );
        });

        APP.state.currentScreen = name;
    }

    function prepareScreen(name) {
        const screen = APP.screens[name];

        if (!hasElement(screen)) {
            return;
        }

        screen.classList.remove(
            CONFIG.selectors.leaving,
            CONFIG.selectors.entering
        );

        void screen.offsetWidth;

        screen.classList.add(CONFIG.selectors.entering);
    }

    function leaveScreen(name) {
        const screen = APP.screens[name];

        if (!hasElement(screen)) {
            return;
        }

        screen.classList.remove(CONFIG.selectors.entering);
        screen.classList.add(CONFIG.selectors.leaving);
    }

    function removeTransitionClasses() {
        Object.values(APP.screens).forEach(screen => {
            if (!hasElement(screen)) {
                return;
            }

            screen.classList.remove(
                CONFIG.selectors.leaving,
                CONFIG.selectors.entering
            );
        });
    }

    function lockInteraction() {
        APP.state.transitioning = true;

        document.documentElement.classList.add("is-transitioning");
        document.body.classList.add("is-transitioning");
    }

    function unlockInteraction() {
        APP.state.transitioning = false;

        document.documentElement.classList.remove("is-transitioning");
        document.body.classList.remove("is-transitioning");
    }

    function activateOverlay() {
        if (!hasElement(APP.overlay)) {
            return;
        }

        APP.overlay.classList.remove("reverse");
        APP.overlay.classList.add("active");
    }

    function deactivateOverlay() {
        if (!hasElement(APP.overlay)) {
            return;
        }

        APP.overlay.classList.remove("active");
        APP.overlay.classList.add("reverse");
    }

    function setBookState(state) {
        if (!hasElement(APP.book.root)) {
            return;
        }

        APP.state.bookState = state;

        APP.book.root.dataset.state = state;

        APP.book.root.classList.remove(
            "state-cover",
            "state-page-one",
            "state-page-two",
            "state-back-cover"
        );

        APP.book.root.classList.add(`state-${state}`);

        updateBookInterface(state);
    }

    function updateBookInterface(state) {
        const progress = document.querySelector(".book-progress");
        const progressCurrent = document.querySelector(".book-progress-current");
        const progressTotal = document.querySelector(".book-progress-total");

        if (hasElement(progress)) {
            progress.dataset.state = state;
            progress.classList.add("visible");
        }

        if (!hasElement(progressCurrent)) {
            return;
        }

        const values = {
            cover: "01",
            "page-one": "01",
            "page-two": "02",
            "back-cover": "03"
        };

        progressCurrent.textContent = values[state] || "01";

        if (hasElement(progressTotal)) {
            progressTotal.textContent = "03";
        }
    }

    function clearPageAnimation() {
        APP.book.pages.forEach(page => {
            page.classList.remove(
                "flipping",
                "active-page",
                "inactive-page"
            );
        });
    }

    function animateBookTransition(from, to) {
        if (!hasElement(APP.book.root)) {
            return Promise.resolve();
        }

        clearPageAnimation();

        APP.book.root.dataset.previousState = from;
        APP.book.root.dataset.nextState = to;

        APP.book.root.classList.add("is-flipping");

        const direction =
            getStateIndex(to) > getStateIndex(from)
                ? "forward"
                : "backward";

        APP.book.root.classList.remove(
            "flip-forward",
            "flip-backward"
        );

        APP.book.root.classList.add(`flip-${direction}`);

        APP.book.pages.forEach(page => {
            page.classList.add("flipping");
        });

        return wait(CONFIG.transitions.pageFlip).then(() => {
            APP.book.root.classList.remove(
                "is-flipping",
                "flip-forward",
                "flip-backward"
            );

            clearPageAnimation();
            setBookState(to);
        });
    }

    function getStateIndex(state) {
        const order = {
            cover: 0,
            "page-one": 1,
            "page-two": 2,
            "back-cover": 3
        };

        return order[state] ?? 0;
    }

    async function openBook() {
        if (
            APP.state.transitioning ||
            APP.state.currentScreen !== "intro"
        ) {
            return;
        }

        lockInteraction();

        const intro = APP.screens.intro;

        if (hasElement(intro)) {
            intro.classList.add(CONFIG.selectors.leaving);
        }

        await wait(220);

        startMusic();

        prepareScreen("book");
        setActiveScreen("book");
        setBookState("cover");

        await wait(CONFIG.transitions.introToBook);

        removeTransitionClasses();
        unlockInteraction();
    }

    async function changeBookPage(targetState) {
        if (
            APP.state.transitioning ||
            APP.state.currentScreen !== "book" ||
            APP.state.bookState === targetState
        ) {
            return;
        }

        const currentState = APP.state.bookState;

        lockInteraction();

        await animateBookTransition(
            currentState,
            targetState
        );

        unlockInteraction();
    }

    async function finishReading() {
        if (
            APP.state.transitioning ||
            APP.state.currentScreen !== "book" ||
            APP.state.bookState !== "back-cover"
        ) {
            return;
        }

        lockInteraction();
        APP.state.ending = true;

        const finishButton = APP.controls.finish;

        if (hasElement(finishButton)) {
            finishButton.classList.add("hiding");
        }

        stopMusic();

        await wait(400);

        leaveScreen("book");
        activateOverlay();

        await wait(650);

        prepareScreen("ending");
        setActiveScreen("ending");

        await wait(CONFIG.transitions.bookToEnding);

        deactivateOverlay();
        removeTransitionClasses();

        unlockInteraction();
    }

    function startMusic() {
        if (
            window.MusicController &&
            typeof window.MusicController.start === "function"
        ) {
            window.MusicController.start();
            return;
        }

        const audio = document.querySelector("audio");

        if (!audio) {
            return;
        }

        audio.currentTime = 21;

        const playPromise = audio.play();

        if (playPromise instanceof Promise) {
            playPromise.catch(() => {});
        }
    }

    function stopMusic() {
        if (
            window.MusicController &&
            typeof window.MusicController.stop === "function"
        ) {
            window.MusicController.stop();
            return;
        }

        const audio = document.querySelector("audio");

        if (!audio) {
            return;
        }

        audio.pause();
    }

    function handleBookClick(event) {
        if (
            APP.state.transitioning ||
            APP.state.currentScreen !== "book"
        ) {
            return;
        }

        const target = event.target;

        if (!(target instanceof Element)) {
            return;
        }

        const page = target.closest(".book-page");

        if (page) {
            const side = page.dataset.side;

            if (
                APP.state.bookState === "page-one" &&
                side === "left"
            ) {
                changeBookPage("cover");
                return;
            }

            if (
                APP.state.bookState === "page-one" &&
                side === "right"
            ) {
                changeBookPage("page-two");
                return;
            }

            if (
                APP.state.bookState === "page-two" &&
                side === "left"
            ) {
                changeBookPage("page-one");
                return;
            }

            if (
                APP.state.bookState === "page-two" &&
                side === "right"
            ) {
                changeBookPage("back-cover");
                return;
            }
        }

        const frontCover = target.closest(".book-cover-front");

        if (
            frontCover &&
            APP.state.bookState === "cover"
        ) {
            changeBookPage("page-one");
            return;
        }

        const backCover = target.closest(".book-cover-back");

        if (
            backCover &&
            APP.state.bookState === "back-cover"
        ) {
            changeBookPage("page-two");
        }
    }

    function handleKeyboard(event) {
        if (APP.state.transitioning) {
            return;
        }

        if (
            event.key === "Enter" &&
            APP.state.currentScreen === "intro"
        ) {
            openBook();
            return;
        }

        if (APP.state.currentScreen !== "book") {
            return;
        }

        if (event.key === "ArrowRight") {
            const state = APP.state.bookState;

            if (state === "cover") {
                changeBookPage("page-one");
            } else if (state === "page-one") {
                changeBookPage("page-two");
            } else if (state === "page-two") {
                changeBookPage("back-cover");
            }

            return;
        }

        if (event.key === "ArrowLeft") {
            const state = APP.state.bookState;

            if (state === "back-cover") {
                changeBookPage("page-two");
            } else if (state === "page-two") {
                changeBookPage("page-one");
            } else if (state === "page-one") {
                changeBookPage("cover");
            }
        }
    }

    function initializeBook() {
        if (!hasElement(APP.book.root)) {
            return;
        }

        setBookState("cover");

        APP.book.root.classList.remove(
            "is-flipping",
            "flip-forward",
            "flip-backward"
        );

        clearPageAnimation();
    }

    function initializeScreens() {
        Object.values(APP.screens).forEach(screen => {
            if (!hasElement(screen)) {
                return;
            }

            screen.classList.remove(
                CONFIG.selectors.active,
                CONFIG.selectors.leaving,
                CONFIG.selectors.entering
            );
        });

        if (hasElement(APP.screens.intro)) {
            APP.screens.intro.classList.add(
                CONFIG.selectors.active
            );
        }

        APP.state.currentScreen = "intro";
    }

    function initializeControls() {
        if (hasElement(APP.controls.open)) {
            APP.controls.open.addEventListener(
                "click",
                openBook
            );
        }

        if (hasElement(APP.controls.finish)) {
            APP.controls.finish.addEventListener(
                "click",
                finishReading
            );
        }

        if (hasElement(APP.book.root)) {
            APP.book.root.addEventListener(
                "click",
                handleBookClick
            );
        }

        document.addEventListener(
            "keydown",
            handleKeyboard
        );
    }

    function initializeAccessibility() {
        if (hasElement(APP.controls.open)) {
            APP.controls.open.setAttribute(
                "role",
                "button"
            );

            APP.controls.open.setAttribute(
                "tabindex",
                "0"
            );

            APP.controls.open.setAttribute(
                "aria-label",
                "Open the book"
            );
        }

        if (hasElement(APP.controls.finish)) {
            APP.controls.finish.setAttribute(
                "role",
                "button"
            );

            APP.controls.finish.setAttribute(
                "tabindex",
                "0"
            );

            APP.controls.finish.setAttribute(
                "aria-label",
                "Finish reading"
            );
        }

        APP.book.pages.forEach(page => {
            page.setAttribute("role", "button");
            page.setAttribute("tabindex", "0");
        });
    }

    function initialize() {
        if (APP.state.initialized) {
            return;
        }

        initializeScreens();
        initializeBook();
        initializeControls();
        initializeAccessibility();

        APP.state.initialized = true;

        document.documentElement.classList.add(
            "app-ready"
        );

        document.body.classList.add(
            "app-ready"
        );
    }

    window.BookApp = {
        openBook,
        changeBookPage,
        finishReading,
        startMusic,
        stopMusic,
        setBookState,
        getState: () => ({
            screen: APP.state.currentScreen,
            book: APP.state.bookState,
            transitioning: APP.state.transitioning,
            ending: APP.state.ending
        })
    };

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }
})();
