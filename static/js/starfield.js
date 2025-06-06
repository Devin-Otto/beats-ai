const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const phi = 1.61803398875; // golden ratio
let stars = [];
let numStars = Math.floor(300 * phi); // ~485
let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let frequencyBands = [0, 0, 0, 0, 0];
let hueShift = 0; // NEW: for smooth color drift

// Web Audio API setup
let audioCtx, analyser, dataArray;

function setupAudio() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(stream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        source.connect(analyser);
    }).catch(err => {
        console.error("Microphone access denied", err);
    });
}

function updateAudioData() {
    if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        const bandSize = Math.floor(dataArray.length / 5);
        for (let i = 0; i < 5; i++) {
            const start = i * bandSize;
            const end = start + bandSize;
            let sum = 0;
            for (let j = start; j < end; j++) {
                sum += dataArray[j];
            }
            frequencyBands[i] = sum / bandSize / 255; // Normalize [0, 1]
        }
    }
}

function initStars() {
    stars = [];
    for (let i = 0; i < numStars; i++) {
        stars.push({
            baseX: Math.random() * canvas.width,
            baseY: Math.random() * canvas.height,
            radius: Math.random() * (phi / 2) + 0.3,
            floatSpeed: 0.002 * phi + Math.random() * 0.002,
            angle: Math.random() * Math.PI * 2,
            depth: Math.random() * phi + 0.5,
            band: i % 5,
            hue: 200 + Math.floor(Math.random() * 100),
            opacity: Math.random() * 0.6 + 0.3
        });
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
}

function drawStars() {
    // Trails - semi-transparent background
    ctx.fillStyle = "rgba(15, 15, 30, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // NEW: Smooth hue drift over time
    hueShift += 0.05 * phi;

    for (let star of stars) {
        const bandInfluence = frequencyBands[star.band] || 0;

        let offsetX = (mouse.x - canvas.width / 2) * 0.01 * star.depth;
        let offsetY = (mouse.y - canvas.height / 2) * 0.01 * star.depth;
        let x = star.baseX + offsetX;
        let y = star.baseY + Math.sin(star.angle) * phi + offsetY;

        const size = star.radius * (1 + bandInfluence * phi);

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);

        const shiftedHue = (star.hue + hueShift) % 360; // NEW: shift each star's hue

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * phi);
        gradient.addColorStop(0, `hsla(${shiftedHue}, 100%, 85%, ${star.opacity})`);
        gradient.addColorStop(1, `hsla(${shiftedHue}, 100%, 50%, 0)`);

        ctx.fillStyle = gradient;
        ctx.shadowColor = `hsla(${shiftedHue}, 100%, 85%, ${bandInfluence})`;
        ctx.shadowBlur = size * 2 * bandInfluence * phi;
        ctx.fill();
    }
}

function updateStars() {
    for (let star of stars) {
        star.angle += star.floatSpeed;
    }
    updateAudioData();
}

function animate() {
    drawStars();
    updateStars();
    requestAnimationFrame(animate);
}

resizeCanvas();
animate();
setupAudio();

window.addEventListener("resize", resizeCanvas);
window.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
