(() => {
    "use strict";

    const MusicController = {
        audio: null,
        initialized: false,
        playing: false,
        started: false,
        loopHandlerAttached: false,

        config: {
            source: "assets/music.mp3",
            startTime: 21,
            fadeInDuration: 900,
            fadeOutDuration: 700,
            volume: 0.72
        },

        elements: {
            indicator: null,
            icon: null,
            label: null,
            bars: null
        }
    };

    function getAudio() {
        if (MusicController.audio) {
            return MusicController.audio;
        }

        let audio = document.querySelector(
            "#background-music"
        );

        if (!audio) {
            audio = document.createElement("audio");

            audio.id = "background-music";
            audio.preload = "auto";
            audio.setAttribute(
                "aria-hidden",
                "true"
            );

            audio.src =
                MusicController.config.source;

            document.body.appendChild(audio);
        }

        audio.loop = false;
        audio.volume = 0;

        MusicController.audio = audio;

        return audio;
    }

    function getInterface() {
        MusicController.elements.indicator =
            document.querySelector(
                ".music-indicator"
            );

        if (
            !MusicController.elements.indicator
        ) {
            return;
        }

        MusicController.elements.icon =
            MusicController.elements.indicator.querySelector(
                ".music-icon"
            );

        MusicController.elements.label =
            MusicController.elements.indicator.querySelector(
                ".music-label"
            );

        MusicController.elements.bars =
            MusicController.elements.indicator.querySelectorAll(
                ".music-bar"
            );
    }

    function setIndicatorPlaying(playing) {
        const indicator =
            MusicController.elements.indicator;

        if (!indicator) {
            return;
        }

        indicator.classList.toggle(
            "is-playing",
            playing
        );

        indicator.classList.toggle(
            "is-paused",
            !playing
        );

        indicator.setAttribute(
            "aria-label",
            playing
                ? "Music playing"
                : "Music paused"
        );

        if (
            MusicController.elements.label
        ) {
            MusicController.elements.label.textContent =
                playing
                    ? "now playing"
                    : "music paused";
        }

        if (
            MusicController.elements.bars
        ) {
            MusicController.elements.bars.forEach(
                (bar, index) => {
                    bar.style.setProperty(
                        "--bar-index",
                        index
                    );
                }
            );
        }
    }

    function attachLoopHandler() {
        if (
            MusicController.loopHandlerAttached
        ) {
            return;
        }

        const audio = getAudio();

        audio.addEventListener(
            "ended",
            handleEnded
        );

        MusicController.loopHandlerAttached =
            true;
    }

    function handleEnded() {
        const audio =
            MusicController.audio;

        if (!audio) {
            return;
        }

        audio.currentTime =
            MusicController.config.startTime;

        const playPromise =
            audio.play();

        if (
            playPromise &&
            typeof playPromise.catch ===
                "function"
        ) {
            playPromise.catch(() => {
                MusicController.playing =
                    false;

                setIndicatorPlaying(
                    false
                );
            });
        }
    }

    function fadeVolume(
        from,
        to,
        duration
    ) {
        const audio =
            MusicController.audio;

        if (!audio) {
            return Promise.resolve();
        }

        if (
            duration <= 0
        ) {
            audio.volume = to;
            return Promise.resolve();
        }

        const start =
            performance.now();

        return new Promise(resolve => {
            function animate(now) {
                const elapsed =
                    now - start;

                const progress =
                    Math.min(
                        elapsed / duration,
                        1
                    );

                const eased =
                    1 -
                    Math.pow(
                        1 - progress,
                        3
                    );

                audio.volume =
                    from +
                    (to - from) *
                    eased;

                if (
                    progress < 1
                ) {
                    requestAnimationFrame(
                        animate
                    );
                } else {
                    audio.volume = to;
                    resolve();
                }
            }

            requestAnimationFrame(
                animate
            );
        });
    }

    async function start() {
        const audio = getAudio();

        attachLoopHandler();

        if (
            MusicController.playing
        ) {
            return;
        }

        MusicController.started =
            true;

        try {
            audio.currentTime =
                MusicController.config.startTime;
        } catch {
            audio.currentTime = 0;
        }

        audio.volume = 0;

        try {
            await audio.play();
        } catch {
            MusicController.playing =
                false;

            setIndicatorPlaying(
                false
            );

            return;
        }

        MusicController.playing =
            true;

        setIndicatorPlaying(
            true
        );

        await fadeVolume(
            0,
            MusicController.config.volume,
            MusicController.config.fadeInDuration
        );
    }

    async function stop() {
        const audio =
            MusicController.audio;

        if (!audio) {
            return;
        }

        if (
            !MusicController.playing
        ) {
            audio.pause();
            audio.currentTime =
                MusicController.config.startTime;

            setIndicatorPlaying(
                false
            );

            return;
        }

        const currentVolume =
            audio.volume;

        await fadeVolume(
            currentVolume,
            0,
            MusicController.config.fadeOutDuration
        );

        audio.pause();

        try {
            audio.currentTime =
                MusicController.config.startTime;
        } catch {
            audio.currentTime = 0;
        }

        MusicController.playing =
            false;

        setIndicatorPlaying(
            false
        );
    }

    async function toggle() {
        if (
            MusicController.playing
        ) {
            await stop();
        } else {
            await start();
        }
    }

    function setVolume(value) {
        const audio =
            getAudio();

        const volume =
            Math.max(
                0,
                Math.min(
                    1,
                    Number(value)
                )
            );

        audio.volume = volume;
    }

    function getVolume() {
        const audio =
            getAudio();

        return audio.volume;
    }

    function initialize() {
        if (
            MusicController.initialized
        ) {
            return;
        }

        getAudio();
        getInterface();
        attachLoopHandler();

        if (
            MusicController.elements.indicator
        ) {
            MusicController.elements.indicator.addEventListener(
                "click",
                event => {
                    event.preventDefault();
                    event.stopPropagation();

                    toggle();
                }
            );

            MusicController.elements.indicator.setAttribute(
                "role",
                "button"
            );

            MusicController.elements.indicator.setAttribute(
                "tabindex",
                "0"
            );

            MusicController.elements.indicator.setAttribute(
                "aria-label",
                "Music paused"
            );

            MusicController.elements.indicator.addEventListener(
                "keydown",
                event => {
                    if (
                        event.key ===
                            "Enter" ||
                        event.key ===
                            " "
                    ) {
                        event.preventDefault();
                        toggle();
                    }
                }
            );
        }

        document.addEventListener(
            "visibilitychange",
            () => {
                const audio =
                    MusicController.audio;

                if (!audio) {
                    return;
                }

                if (
                    document.hidden &&
                    MusicController.playing
                ) {
                    audio.pause();
                } else if (
                    !document.hidden &&
                    MusicController.playing
                ) {
                    const promise =
                        audio.play();

                    if (
                        promise &&
                        typeof promise.catch ===
                            "function"
                    ) {
                        promise.catch(() => {});
                    }
                }
            }
        );

        MusicController.initialized =
            true;
    }

    window.MusicController = {
        start,
        stop,
        toggle,
        setVolume,
        getVolume,
        isPlaying: () =>
            MusicController.playing,
        getAudio: () =>
            MusicController.audio
    };

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }
})();
