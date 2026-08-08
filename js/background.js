(() => {
    "use strict";

    const Background = {
        root: null,
        canvas: null,
        context: null,
        animationFrame: null,
        resizeObserver: null,
        width: 0,
        height: 0,
        pixelRatio: 1,
        time: 0,
        lastFrame: 0,
        running: false,
        initialized: false,

        particles: [],
        hearts: [],
        stars: [],

        config: {
            particleCount: 26,
            heartCount: 12,
            starCount: 34,
            maxDelta: 40,
            targetFPS: 60
        }
    };

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function createCanvas() {
        Background.root = document.querySelector(".book-screen");

        if (!Background.root) {
            return false;
        }

        Background.canvas = document.createElement("canvas");

        Background.canvas.className = "aurora-canvas";
        Background.canvas.setAttribute(
            "aria-hidden",
            "true"
        );

        Background.root.insertBefore(
            Background.canvas,
            Background.root.firstChild
        );

        Background.context =
            Background.canvas.getContext("2d", {
                alpha: true
            });

        if (!Background.context) {
            return false;
        }

        return true;
    }

    function resizeCanvas() {
        if (
            !Background.canvas ||
            !Background.context
        ) {
            return;
        }

        const rect =
            Background.root.getBoundingClientRect();

        Background.pixelRatio = clamp(
            window.devicePixelRatio || 1,
            1,
            2
        );

        Background.width = Math.max(
            1,
            Math.floor(rect.width)
        );

        Background.height = Math.max(
            1,
            Math.floor(rect.height)
        );

        Background.canvas.width =
            Background.width * Background.pixelRatio;

        Background.canvas.height =
            Background.height * Background.pixelRatio;

        Background.canvas.style.width =
            `${Background.width}px`;

        Background.canvas.style.height =
            `${Background.height}px`;

        Background.context.setTransform(
            Background.pixelRatio,
            0,
            0,
            Background.pixelRatio,
            0,
            0
        );

        rebuildScene();
    }

    function createParticle() {
        return {
            x: random(0, Background.width),
            y: random(0, Background.height),
            radius: random(0.4, 1.5),
            opacity: random(0.025, 0.12),
            speedX: random(-0.008, 0.008),
            speedY: random(-0.014, -0.004),
            pulse: random(0, Math.PI * 2),
            pulseSpeed: random(0.0007, 0.0018)
        };
    }

    function createHeart() {
        const size =
            Math.min(
                Background.width,
                Background.height
            ) * random(0.008, 0.022);

        return {
            x: random(
                Background.width * 0.02,
                Background.width * 0.98
            ),
            y: random(
                Background.height * 0.05,
                Background.height * 0.98
            ),
            size,
            opacity: random(0.015, 0.06),
            rotation: random(-0.35, 0.35),
            rotationSpeed: random(-0.00015, 0.00015),
            speedX: random(-0.003, 0.003),
            speedY: random(-0.012, -0.003),
            phase: random(0, Math.PI * 2),
            phaseSpeed: random(0.0004, 0.001)
        };
    }

    function createStar() {
        return {
            x: random(0, Background.width),
            y: random(0, Background.height),
            radius: random(0.2, 0.75),
            opacity: random(0.02, 0.09),
            phase: random(0, Math.PI * 2),
            phaseSpeed: random(0.001, 0.0025)
        };
    }

    function rebuildScene() {
        Background.particles = [];
        Background.hearts = [];
        Background.stars = [];

        const area =
            Background.width *
            Background.height;

        const scale =
            clamp(
                area / 1200000,
                0.65,
                1.35
            );

        const particleCount =
            Math.round(
                Background.config.particleCount *
                scale
            );

        const heartCount =
            Math.round(
                Background.config.heartCount *
                scale
            );

        const starCount =
            Math.round(
                Background.config.starCount *
                scale
            );

        for (
            let index = 0;
            index < particleCount;
            index += 1
        ) {
            Background.particles.push(
                createParticle()
            );
        }

        for (
            let index = 0;
            index < heartCount;
            index += 1
        ) {
            Background.hearts.push(
                createHeart()
            );
        }

        for (
            let index = 0;
            index < starCount;
            index += 1
        ) {
            Background.stars.push(
                createStar()
            );
        }
    }

    function drawAurora(time) {
        const ctx = Background.context;
        const width = Background.width;
        const height = Background.height;

        const minDimension =
            Math.min(width, height);

        const auroraScale =
            Math.max(
                minDimension / 900,
                0.75
            );

        const gradients = [
            {
                x:
                    width *
                    (
                        0.28 +
                        Math.sin(time * 0.00011) *
                        0.08
                    ),
                y:
                    height *
                    (
                        0.25 +
                        Math.cos(time * 0.00013) *
                        0.08
                    ),
                radius:
                    360 * auroraScale,
                opacity: 0.075
            },
            {
                x:
                    width *
                    (
                        0.74 +
                        Math.cos(time * 0.00009) *
                        0.1
                    ),
                y:
                    height *
                    (
                        0.62 +
                        Math.sin(time * 0.00012) *
                        0.1
                    ),
                radius:
                    430 * auroraScale,
                opacity: 0.055
            },
            {
                x:
                    width *
                    (
                        0.5 +
                        Math.sin(time * 0.00007) *
                        0.14
                    ),
                y:
                    height *
                    (
                        0.86 +
                        Math.cos(time * 0.0001) *
                        0.06
                    ),
                radius:
                    330 * auroraScale,
                opacity: 0.045
            }
        ];

        gradients.forEach((gradient, index) => {
            const colors = [
                [
                    `rgba(119, 82, 255, ${gradient.opacity})`,
                    "rgba(119, 82, 255, 0)"
                ],
                [
                    `rgba(255, 79, 154, ${gradient.opacity})`,
                    "rgba(255, 79, 154, 0)"
                ],
                [
                    `rgba(72, 173, 255, ${gradient.opacity})`,
                    "rgba(72, 173, 255, 0)"
                ]
            ];

            const selected =
                colors[index];

            const radial =
                ctx.createRadialGradient(
                    gradient.x,
                    gradient.y,
                    0,
                    gradient.x,
                    gradient.y,
                    gradient.radius
                );

            radial.addColorStop(
                0,
                selected[0]
            );

            radial.addColorStop(
                1,
                selected[1]
            );

            ctx.fillStyle = radial;

            ctx.fillRect(
                0,
                0,
                width,
                height
            );
        });
    }

    function drawAtmosphere(time) {
        const ctx = Background.context;
        const width = Background.width;
        const height = Background.height;

        const centerX = width * 0.5;
        const centerY = height * 0.5;

        const radius =
            Math.max(width, height) *
            0.72;

        const pulse =
            1 +
            Math.sin(time * 0.00025) *
            0.025;

        const gradient =
            ctx.createRadialGradient(
                centerX,
                centerY,
                radius * 0.05,
                centerX,
                centerY,
                radius * pulse
            );

        gradient.addColorStop(
            0,
            "rgba(255,255,255,0.008)"
        );

        gradient.addColorStop(
            0.42,
            "rgba(255,255,255,0.004)"
        );

        gradient.addColorStop(
            1,
            "rgba(0,0,0,0.3)"
        );

        ctx.fillStyle = gradient;

        ctx.fillRect(
            0,
            0,
            width,
            height
        );
    }

    function drawStars(time) {
        const ctx = Background.context;

        Background.stars.forEach(star => {
            star.phase += star.phaseSpeed;

            const alpha =
                star.opacity *
                (
                    0.6 +
                    Math.sin(star.phase) *
                    0.4
                );

            ctx.beginPath();

            ctx.arc(
                star.x,
                star.y,
                star.radius,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                `rgba(255,255,255,${alpha})`;

            ctx.fill();
        });
    }

    function updateParticles(delta) {
        const width = Background.width;
        const height = Background.height;

        Background.particles.forEach(particle => {
            particle.x +=
                particle.speedX * delta;

            particle.y +=
                particle.speedY * delta;

            particle.pulse +=
                particle.pulseSpeed * delta;

            if (
                particle.y <
                -particle.radius * 3
            ) {
                particle.y =
                    height +
                    particle.radius * 3;

                particle.x =
                    random(0, width);
            }

            if (
                particle.x <
                -particle.radius * 3
            ) {
                particle.x =
                    width +
                    particle.radius * 3;
            }

            if (
                particle.x >
                width +
                particle.radius * 3
            ) {
                particle.x =
                    -particle.radius * 3;
            }
        });
    }

    function drawParticles() {
        const ctx = Background.context;

        Background.particles.forEach(
            particle => {
                const pulse =
                    0.75 +
                    Math.sin(
                        particle.pulse
                    ) *
                    0.25;

                ctx.beginPath();

                ctx.arc(
                    particle.x,
                    particle.y,
                    particle.radius,
                    0,
                    Math.PI * 2
                );

                ctx.fillStyle =
                    `rgba(255,255,255,${
                        particle.opacity *
                        pulse
                    })`;

                ctx.fill();
            }
        );
    }

    function heartPath(
        ctx,
        x,
        y,
        size,
        rotation
    ) {
        ctx.save();

        ctx.translate(x, y);
        ctx.rotate(rotation);

        const scale = size / 100;

        ctx.scale(scale, scale);

        ctx.beginPath();

        ctx.moveTo(0, 30);

        ctx.bezierCurveTo(
            -55,
            -5,
            -50,
            -55,
            -20,
            -55
        );

        ctx.bezierCurveTo(
            -2,
            -55,
            0,
            -42,
            0,
            -34
        );

        ctx.bezierCurveTo(
            0,
            -42,
            2,
            -55,
            20,
            -55
        );

        ctx.bezierCurveTo(
            50,
            -55,
            55,
            -5,
            0,
            30
        );

        ctx.closePath();

        ctx.restore();
    }

    function updateHearts(delta) {
        const width = Background.width;
        const height = Background.height;

        Background.hearts.forEach(heart => {
            heart.x +=
                heart.speedX * delta;

            heart.y +=
                heart.speedY * delta;

            heart.rotation +=
                heart.rotationSpeed * delta;

            heart.phase +=
                heart.phaseSpeed * delta;

            heart.x +=
                Math.sin(heart.phase) *
                0.004 *
                delta;

            if (
                heart.y <
                -heart.size * 2
            ) {
                heart.y =
                    height +
                    heart.size * 2;

                heart.x =
                    random(
                        width * 0.02,
                        width * 0.98
                    );
            }

            if (
                heart.x <
                -heart.size
            ) {
                heart.x =
                    width + heart.size;
            }

            if (
                heart.x >
                width + heart.size
            ) {
                heart.x =
                    -heart.size;
            }
        });
    }

    function drawHearts(time) {
        const ctx = Background.context;

        Background.hearts.forEach(heart => {
            const pulse =
                0.85 +
                Math.sin(heart.phase) *
                0.15;

            ctx.save();

            heartPath(
                ctx,
                heart.x,
                heart.y,
                heart.size * pulse,
                heart.rotation
            );

            ctx.fillStyle =
                `rgba(255,255,255,${
                    heart.opacity
                })`;

            ctx.fill();

            ctx.restore();
        });
    }

    function drawFilmGrain(time) {
        const ctx = Background.context;

        const width = Background.width;
        const height = Background.height;

        const amount = 110;

        ctx.save();

        ctx.globalAlpha = 0.018;

        for (
            let index = 0;
            index < amount;
            index += 1
        ) {
            const x =
                Math.random() * width;

            const y =
                Math.random() * height;

            const size =
                Math.random() * 1.2;

            ctx.fillStyle =
                Math.random() > 0.5
                    ? "#ffffff"
                    : "#000000";

            ctx.fillRect(
                x,
                y,
                size,
                size
            );
        }

        ctx.restore();
    }

    function clear() {
        if (!Background.context) {
            return;
        }

        Background.context.clearRect(
            0,
            0,
            Background.width,
            Background.height
        );
    }

    function render(timestamp) {
        if (!Background.running) {
            return;
        }

        if (!Background.lastFrame) {
            Background.lastFrame = timestamp;
        }

        const delta =
            Math.min(
                timestamp -
                Background.lastFrame,
                Background.config.maxDelta
            );

        Background.lastFrame = timestamp;
        Background.time = timestamp;

        clear();

        drawAurora(timestamp);
        drawAtmosphere(timestamp);
        drawStars(timestamp);

        if (!prefersReducedMotion.matches) {
            updateParticles(delta);
            updateHearts(delta);
        }

        drawParticles();
        drawHearts(timestamp);

        if (!prefersReducedMotion.matches) {
            drawFilmGrain(timestamp);
        }

        Background.animationFrame =
            window.requestAnimationFrame(
                render
            );
    }

    function start() {
        if (Background.running) {
            return;
        }

        Background.running = true;
        Background.lastFrame = 0;

        Background.animationFrame =
            window.requestAnimationFrame(
                render
            );
    }

    function stop() {
        Background.running = false;

        if (
            Background.animationFrame !== null
        ) {
            window.cancelAnimationFrame(
                Background.animationFrame
            );

            Background.animationFrame = null;
        }
    }

    function observeResize() {
        if (
            typeof ResizeObserver ===
            "undefined"
        ) {
            window.addEventListener(
                "resize",
                resizeCanvas,
                { passive: true }
            );

            return;
        }

        Background.resizeObserver =
            new ResizeObserver(() => {
                resizeCanvas();
            });

        Background.resizeObserver.observe(
            Background.root
        );
    }

    function handleVisibility() {
        document.addEventListener(
            "visibilitychange",
            () => {
                if (
                    document.hidden
                ) {
                    stop();
                } else {
                    start();
                }
            }
        );
    }

    function handleMotionPreference() {
        const update =
            () => {
                rebuildScene();
            };

        if (
            typeof prefersReducedMotion
                .addEventListener ===
            "function"
        ) {
            prefersReducedMotion.addEventListener(
                "change",
                update
            );
        } else if (
            typeof prefersReducedMotion
                .addListener ===
            "function"
        ) {
            prefersReducedMotion.addListener(
                update
            );
        }
    }

    function initialize() {
        if (Background.initialized) {
            return;
        }

        if (!createCanvas()) {
            return;
        }

        resizeCanvas();
        observeResize();
        handleVisibility();
        handleMotionPreference();

        Background.initialized = true;

        start();
    }

    window.AuroraBackground = {
        start,
        stop,
        resize: resizeCanvas,
        rebuild: rebuildScene
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
