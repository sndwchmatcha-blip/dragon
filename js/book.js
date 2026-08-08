(() => {
    "use strict";

    const BookController = {
        book: null,
        stage: null,
        pages: {},
        layers: {},
        initialized: false,
        busy: false,
        currentState: "cover",
        previousState: null,
        animationTimer: null,

        config: {
            duration: 1350,
            states: [
                "cover",
                "page-one",
                "page-two",
                "back-cover"
            ]
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

    function getStateIndex(state) {
        return (
            BookController.config.states.indexOf(
                state
            )
        );
    }

    function getDirection(from, to) {
        return getStateIndex(to) >
            getStateIndex(from)
            ? "forward"
            : "backward";
    }

    function cacheElements() {
        BookController.book =
            query(".book");

        BookController.stage =
            query(".book-stage");

        if (!BookController.book) {
            return false;
        }

        BookController.pages = {
            leftOne:
                query(
                    '.book-page[data-page="1"][data-side="left"]'
                ),

            rightOne:
                query(
                    '.book-page[data-page="1"][data-side="right"]'
                ),

            leftTwo:
                query(
                    '.book-page[data-page="2"][data-side="left"]'
                ),

            rightTwo:
                query(
                    '.book-page[data-page="2"][data-side="right"]'
                )
        };

        BookController.layers = {
            front:
                query(".book-cover-front"),

            back:
                query(".book-cover-back"),

            pageOne:
                query(".book-spread-page-one"),

            pageTwo:
                query(".book-spread-page-two")
        };

        return true;
    }

    function setStateAttributes(state) {
        const book =
            BookController.book;

        if (!book) {
            return;
        }

        book.dataset.state = state;

        book.classList.remove(
            "state-cover",
            "state-page-one",
            "state-page-two",
            "state-back-cover"
        );

        book.classList.add(
            `state-${state}`
        );

        updatePageVisibility(state);
        updateProgress(state);
    }

    function updatePageVisibility(state) {
        const layers =
            BookController.layers;

        Object.values(layers).forEach(
            layer => {
                if (!layer) {
                    return;
                }

                layer.classList.remove(
                    "is-visible",
                    "is-hidden",
                    "is-current"
                );
            }
        );

        if (state === "cover") {
            if (layers.front) {
                layers.front.classList.add(
                    "is-visible",
                    "is-current"
                );
            }

            if (layers.pageOne) {
                layers.pageOne.classList.add(
                    "is-hidden"
                );
            }

            if (layers.pageTwo) {
                layers.pageTwo.classList.add(
                    "is-hidden"
                );
            }

            if (layers.back) {
                layers.back.classList.add(
                    "is-hidden"
                );
            }

            return;
        }

        if (state === "page-one") {
            if (layers.front) {
                layers.front.classList.add(
                    "is-hidden"
                );
            }

            if (layers.pageOne) {
                layers.pageOne.classList.add(
                    "is-visible",
                    "is-current"
                );
            }

            if (layers.pageTwo) {
                layers.pageTwo.classList.add(
                    "is-hidden"
                );
            }

            if (layers.back) {
                layers.back.classList.add(
                    "is-hidden"
                );
            }

            return;
        }

        if (state === "page-two") {
            if (layers.front) {
                layers.front.classList.add(
                    "is-hidden"
                );
            }

            if (layers.pageOne) {
                layers.pageOne.classList.add(
                    "is-hidden"
                );
            }

            if (layers.pageTwo) {
                layers.pageTwo.classList.add(
                    "is-visible",
                    "is-current"
                );
            }

            if (layers.back) {
                layers.back.classList.add(
                    "is-hidden"
                );
            }

            return;
        }

        if (state === "back-cover") {
            if (layers.front) {
                layers.front.classList.add(
                    "is-hidden"
                );
            }

            if (layers.pageOne) {
                layers.pageOne.classList.add(
                    "is-hidden"
                );
            }

            if (layers.pageTwo) {
                layers.pageTwo.classList.add(
                    "is-hidden"
                );
            }

            if (layers.back) {
                layers.back.classList.add(
                    "is-visible",
                    "is-current"
                );
            }
        }
    }

    function updateProgress(state) {
        const current =
            query(".book-progress-current");

        const total =
            query(".book-progress-total");

        const progress =
            query(".book-progress");

        const map = {
            cover: "01",
            "page-one": "01",
            "page-two": "02",
            "back-cover": "03"
        };

        if (current) {
            current.textContent =
                map[state] || "01";
        }

        if (total) {
            total.textContent = "03";
        }

        if (progress) {
            progress.dataset.state = state;
            progress.classList.add("visible");
        }
    }

    function clearAnimationClasses() {
        if (!BookController.book) {
            return;
        }

        BookController.book.classList.remove(
            "is-flipping",
            "flip-forward",
            "flip-backward",
            "flip-cover-to-page",
            "flip-page-to-cover",
            "flip-page-one-to-page-two",
            "flip-page-two-to-page-one",
            "flip-page-two-to-back",
            "flip-back-to-page-two"
        );

        queryAll(
            ".book-page, .book-cover-front, .book-cover-back"
        ).forEach(element => {
            element.classList.remove(
                "flipping",
                "flip-active",
                "flip-origin",
                "flip-target"
            );
        });
    }

    function getTransitionClass(
        from,
        to
    ) {
        const transition =
            `${from}-to-${to}`;

        const map = {
            "cover-to-page-one":
                "flip-cover-to-page",

            "page-one-to-cover":
                "flip-page-to-cover",

            "page-one-to-page-two":
                "flip-page-one-to-page-two",

            "page-two-to-page-one":
                "flip-page-two-to-page-one",

            "page-two-to-back-cover":
                "flip-page-two-to-back",

            "back-cover-to-page-two":
                "flip-back-to-page-two"
        };

        return (
            map[transition] ||
            null
        );
    }

    function getAnimationElements(
        from,
        to
    ) {
        const result = [];

        const transition =
            `${from}-to-${to}`;

        if (
            transition ===
            "cover-to-page-one"
        ) {
            if (
                BookController.layers.front
            ) {
                result.push(
                    BookController.layers.front
                );
            }
        }

        if (
            transition ===
            "page-one-to-cover"
        ) {
            if (
                BookController.layers.pageOne
            ) {
                result.push(
                    BookController.layers.pageOne
                );
            }
        }

        if (
            transition ===
            "page-one-to-page-two"
        ) {
            if (
                BookController.layers.pageOne
            ) {
                result.push(
                    BookController.layers.pageOne
                );
            }
        }

        if (
            transition ===
            "page-two-to-page-one"
        ) {
            if (
                BookController.layers.pageTwo
            ) {
                result.push(
                    BookController.layers.pageTwo
                );
            }
        }

        if (
            transition ===
            "page-two-to-back-cover"
        ) {
            if (
                BookController.layers.pageTwo
            ) {
                result.push(
                    BookController.layers.pageTwo
                );
            }
        }

        if (
            transition ===
            "back-cover-to-page-two"
        ) {
            if (
                BookController.layers.back
            ) {
                result.push(
                    BookController.layers.back
                );
            }
        }

        return result;
    }

    function prepareFlip(
        from,
        to
    ) {
        if (!BookController.book) {
            return;
        }

        clearAnimationClasses();

        const direction =
            getDirection(
                from,
                to
            );

        const transitionClass =
            getTransitionClass(
                from,
                to
            );

        BookController.book.classList.add(
            "is-flipping",
            `flip-${direction}`
        );

        if (transitionClass) {
            BookController.book.classList.add(
                transitionClass
            );
        }

        const animatedElements =
            getAnimationElements(
                from,
                to
            );

        animatedElements.forEach(
            element => {
                element.classList.add(
                    "flipping",
                    "flip-active"
                );
            }
        );

        const currentLayers =
            Object.values(
                BookController.layers
            ).filter(Boolean);

        currentLayers.forEach(
            element => {
                if (
                    element.classList.contains(
                        "is-current"
                    )
                ) {
                    element.classList.add(
                        "flip-origin"
                    );
                }
            }
        );
    }

    function finalizeFlip(
        from,
        to
    ) {
        if (!BookController.book) {
            return;
        }

        clearAnimationClasses();

        BookController.previousState =
            from;

        BookController.currentState =
            to;

        setStateAttributes(to);
    }

    function animateFlip(
        from,
        to
    ) {
        if (
            !BookController.book
        ) {
            return Promise.resolve();
        }

        if (
            from === to
        ) {
            return Promise.resolve();
        }

        if (
            BookController.busy
        ) {
            return Promise.resolve();
        }

        BookController.busy = true;

        prepareFlip(
            from,
            to
        );

        return new Promise(
            resolve => {
                BookController.animationTimer =
                    window.setTimeout(
                        () => {
                            finalizeFlip(
                                from,
                                to
                            );

                            BookController.animationTimer =
                                null;

                            BookController.busy =
                                false;

                            resolve();
                        },
                        BookController.config.duration
                    );
            }
        );
    }

    function setState(
        state,
        immediate = false
    ) {
        if (
            !BookController.book
        ) {
            return Promise.resolve();
        }

        if (
            !BookController.config.states.includes(
                state
            )
        ) {
            return Promise.resolve();
        }

        const current =
            BookController.currentState;

        if (
            current === state
        ) {
            return Promise.resolve();
        }

        if (
            immediate
        ) {
            clearAnimationClasses();

            BookController.currentState =
                state;

            setStateAttributes(
                state
            );

            return Promise.resolve();
        }

        return animateFlip(
            current,
            state
        );
    }

    function handleCoverClick(
        event
    ) {
        if (
            BookController.busy
        ) {
            return;
        }

        const target =
            event.target.closest(
                ".book-cover-front"
            );

        if (!target) {
            return;
        }

        if (
            BookController.currentState !==
            "cover"
        ) {
            return;
        }

        setState(
            "page-one"
        );
    }

    function handleBackCoverClick(
        event
    ) {
        if (
            BookController.busy
        ) {
            return;
        }

        const target =
            event.target.closest(
                ".book-cover-back"
            );

        if (!target) {
            return;
        }

        if (
            BookController.currentState !==
            "back-cover"
        ) {
            return;
        }

        setState(
            "page-two"
        );
    }

    function handlePageClick(
        event
    ) {
        if (
            BookController.busy
        ) {
            return;
        }

        const page =
            event.target.closest(
                ".book-page"
            );

        if (!page) {
            return;
        }

        const side =
            page.dataset.side;

        const pageNumber =
            page.dataset.page;

        if (
            pageNumber === "1" &&
            side === "left" &&
            BookController.currentState ===
                "page-one"
        ) {
            setState(
                "cover"
            );

            return;
        }

        if (
            pageNumber === "1" &&
            side === "right" &&
            BookController.currentState ===
                "page-one"
        ) {
            setState(
                "page-two"
            );

            return;
        }

        if (
            pageNumber === "2" &&
            side === "left" &&
            BookController.currentState ===
                "page-two"
        ) {
            setState(
                "page-one"
            );

            return;
        }

        if (
            pageNumber === "2" &&
            side === "right" &&
            BookController.currentState ===
                "page-two"
        ) {
            setState(
                "back-cover"
            );
        }
    }

    function handleKeyboard(
        event
    ) {
        if (
            BookController.busy
        ) {
            return;
        }

        if (
            !BookController.book
        ) {
            return;
        }

        const active =
            document.activeElement;

        if (
            active &&
            (
                active.tagName ===
                    "INPUT" ||
                active.tagName ===
                    "TEXTAREA"
            )
        ) {
            return;
        }

        if (
            event.key ===
            "ArrowRight"
        ) {
            const state =
                BookController.currentState;

            if (
                state === "cover"
            ) {
                setState(
                    "page-one"
                );
            } else if (
                state === "page-one"
            ) {
                setState(
                    "page-two"
                );
            } else if (
                state === "page-two"
            ) {
                setState(
                    "back-cover"
                );
            }

            return;
        }

        if (
            event.key ===
            "ArrowLeft"
        ) {
            const state =
                BookController.currentState;

            if (
                state === "back-cover"
            ) {
                setState(
                    "page-two"
                );
            } else if (
                state === "page-two"
            ) {
                setState(
                    "page-one"
                );
            } else if (
                state === "page-one"
            ) {
                setState(
                    "cover"
                );
            }
        }
    }

    function handleTouchSwipe() {
        if (
            !BookController.book
        ) {
            return;
        }

        let startX = 0;
        let startY = 0;

        BookController.book.addEventListener(
            "touchstart",
            event => {
                if (
                    BookController.busy
                ) {
                    return;
                }

                const touch =
                    event.changedTouches[0];

                if (!touch) {
                    return;
                }

                startX =
                    touch.clientX;

                startY =
                    touch.clientY;
            },
            {
                passive: true
            }
        );

        BookController.book.addEventListener(
            "touchend",
            event => {
                if (
                    BookController.busy
                ) {
                    return;
                }

                const touch =
                    event.changedTouches[0];

                if (!touch) {
                    return;
                }

                const deltaX =
                    touch.clientX -
                    startX;

                const deltaY =
                    touch.clientY -
                    startY;

                if (
                    Math.abs(deltaX) <
                    50
                ) {
                    return;
                }

                if (
                    Math.abs(deltaX) <
                    Math.abs(deltaY)
                ) {
                    return;
                }

                const state =
                    BookController.currentState;

                if (
                    deltaX < 0
                ) {
                    if (
                        state === "cover"
                    ) {
                        setState(
                            "page-one"
                        );
                    } else if (
                        state === "page-one"
                    ) {
                        setState(
                            "page-two"
                        );
                    } else if (
                        state === "page-two"
                    ) {
                        setState(
                            "back-cover"
                        );
                    }
                } else {
                    if (
                        state === "back-cover"
                    ) {
                        setState(
                            "page-two"
                        );
                    } else if (
                        state === "page-two"
                    ) {
                        setState(
                            "page-one"
                        );
                    } else if (
                        state === "page-one"
                    ) {
                        setState(
                            "cover"
                        );
                    }
                }
            },
            {
                passive: true
            }
        );
    }

    function setupAccessibility() {
        const interactiveElements =
            queryAll(
                ".book-cover-front, .book-cover-back, .book-page"
            );

        interactiveElements.forEach(
            element => {
                element.setAttribute(
                    "role",
                    "button"
                );

                element.setAttribute(
                    "tabindex",
                    "0"
                );
            }
        );
    }

    function setupEvents() {
        if (
            !BookController.book
        ) {
            return;
        }

        BookController.book.addEventListener(
            "click",
            event => {
                handleCoverClick(
                    event
                );

                handleBackCoverClick(
                    event
                );

                handlePageClick(
                    event
                );
            }
        );

        BookController.book.addEventListener(
            "keydown",
            event => {
                if (
                    event.key !==
                        "Enter" &&
                    event.key !==
                        " "
                ) {
                    return;
                }

                event.preventDefault();

                const target =
                    event.target;

                if (
                    !(target instanceof Element)
                ) {
                    return;
                }

                target.click();
            }
        );

        document.addEventListener(
            "keydown",
            handleKeyboard
        );

        handleTouchSwipe();
    }

    function initialize() {
        if (
            BookController.initialized
        ) {
            return;
        }

        if (
            !cacheElements()
        ) {
            return;
        }

        setStateAttributes(
            "cover"
        );

        setupAccessibility();
        setupEvents();

        BookController.initialized =
            true;
    }

    window.BookController = {
        setState,
        getState: () =>
            BookController.currentState,
        isBusy: () =>
            BookController.busy
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
