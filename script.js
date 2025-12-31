(() => {
    const display = document.getElementById('countdown');
    let intervalId = null;
    let currentTime = null;
    // test mode via URL param ?time_remaining=SECONDS or via setTestSeconds(seconds)
    let testMode = false;
    let testSeconds = 0;
    let testStart = 0;
    (function parseTestParam(){
        try {
            const p = new URLSearchParams(window.location.search);
            if (p.has('time_remaining')) {
                const v = parseInt(p.get('time_remaining'), 10);
                if (!Number.isNaN(v) && v >= 0) {
                    testMode = true; testSeconds = v; testStart = Date.now();
                }
            }
        } catch (e) { /* ignore */ }
    })();

    function createDigitContainer(digit) {
        return `<div class="digit-container"><span class="digit">${digit}</span></div>`;
    }

    function formatHMS(hours, minutes, seconds) {
        return [
            Math.floor(hours / 10), hours % 10,
            ':',
            Math.floor(minutes / 10), minutes % 10,
            ':',
            Math.floor(seconds / 10), seconds % 10
        ];
    }

    function updateDigit(container, newDigit) {
        // Find the current visible digit (prefer plain .digit without in/out)
        const oldDigit = container.querySelector('.digit:not(.in):not(.out)') || container.querySelector('.digit');
        const newElement = document.createElement('span');
        newElement.className = 'digit in';
        newElement.textContent = newDigit;

        // Append new digit and animate
        container.appendChild(newElement);

        setTimeout(() => {
            if (oldDigit) oldDigit.classList.add('out');
            newElement.classList.remove('in');
        }, 50);

        // Remove old digit and any extra children after animation
        setTimeout(() => {
            if (oldDigit && oldDigit.parentNode) oldDigit.parentNode.removeChild(oldDigit);
            // ensure only one child remains (safety)
            while (container.children.length > 1) container.removeChild(container.firstChild);
        }, 450);
    }

    function getNextJan1() {
        const now = new Date();
        const year = now.getFullYear();
        return new Date(year + 1, 0, 1, 0, 0, 0, 0);
    }

    function pad(num, size = 2) {
        return num.toString().padStart(size, '0');
    }

    // --- Confetti animation ---
    let confettiRunning = false;
    let confettiStopRequested = false;
    function startConfetti(duration = 0) { // duration=0 => run indefinitely
        if (confettiRunning) return;
        confettiRunning = true;
        confettiStopRequested = false;
        const canvas = document.createElement('canvas');
        canvas.className = 'confetti-canvas';
        Object.assign(canvas.style, {
            position: 'fixed', left: '0', top: '0', width: '100%', height: '100%',
            pointerEvents: 'none', zIndex: '9999'
        });
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
        resize(); window.addEventListener('resize', resize);

        const colors = ['#ff0a54','#ff477e','#ff7096','#ff85a1','#fbb1bd','#f9bec7','#f6a6b2','#c9184a','#ff6b6b','#ffd166'];
        const particles = [];
        const count = 150;
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * -canvas.height,
                vx: (Math.random() - 0.5) * 6,
                vy: Math.random() * 3 + 2,
                size: Math.random() * 8 + 4,
                color: colors[(Math.random() * colors.length) | 0],
                rot: Math.random() * 360,
                vr: (Math.random() - 0.5) * 10
            });
        }

        const start = performance.now();
        function frame(now) {
            const elapsed = now - start;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const p of particles) {
                p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.rot += p.vr;
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
                ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
                if (p.y > canvas.height + 20) { p.y = -10; p.x = Math.random() * canvas.width; p.vy = Math.random() * 3 + 2; }
            }
            // If duration > 0, run for that duration. If duration == 0, run until stop requested.
            if ((duration > 0 && elapsed < duration) || (duration === 0 && !confettiStopRequested)) {
                requestAnimationFrame(frame);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                window.removeEventListener('resize', resize);
                if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
                confettiRunning = false;
                confettiStopRequested = false;
            }
        }

        requestAnimationFrame(frame);
    }

    // Expose test helpers globally for manual testing
    window.startConfetti = startConfetti;
    window.stopConfetti = function () { confettiStopRequested = true; };
    window.setTestSeconds = function (s) {
        const n = Number(s) | 0;
        if (n >= 0) { testMode = true; testSeconds = n; testStart = Date.now(); if (!isSmallScreen()) ensureRunning(); }
    };

    // --- Small screen handling ---
    const MIN_WIDTH = 880;
    let mobileMessageEl = null;
    function isSmallScreen() { return window.innerWidth < MIN_WIDTH; }

    function ensureRunning() {
        // start update interval if not running
        if (!intervalId) {
            update();
            intervalId = setInterval(update, 1000);
        }
    }

    function stopRunning() {
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
    }

    function showMobileMessage() {
        // hide timer and controls, show message
        const timerContainer = document.querySelector('.timer-container');
        const controls = document.querySelector('.controls');
        if (timerContainer) timerContainer.style.display = 'none';
        if (controls) controls.style.display = 'none';
        if (!mobileMessageEl) {
            mobileMessageEl = document.createElement('div');
            mobileMessageEl.className = 'mobile-message';
            mobileMessageEl.style.cssText = 'color:white;font-family:Orbitron, sans-serif;font-size:20px;text-align:center;padding:20px;';
            mobileMessageEl.textContent = 'This overlay is not supported on small screens. Please use a desktop with width ≥ 880px.';
            document.body.appendChild(mobileMessageEl);
        }
    }

    function hideMobileMessage() {
        const timerContainer = document.querySelector('.timer-container');
        const controls = document.querySelector('.controls');
        if (timerContainer) timerContainer.style.display = '';
        if (controls) controls.style.display = '';
        if (mobileMessageEl && mobileMessageEl.parentNode) {
            mobileMessageEl.parentNode.removeChild(mobileMessageEl);
            mobileMessageEl = null;
        }
    }

    function checkScreen() {
        if (isSmallScreen()) {
            stopRunning();
            showMobileMessage();
        } else {
            hideMobileMessage();
            ensureRunning();
        }
    }

    function renderInitial(days, hours, minutes, seconds) {
        const timeArr = formatHMS(hours, minutes, seconds);
        let prefix = '';
        if (days > 0) prefix = `<span class="days">${days}d </span>`;
        display.innerHTML = prefix + timeArr.map(digit => digit === ':' ? '<span class="colon">:</span>' : createDigitContainer(digit)).join('');
        currentTime = timeArr;
    }

    function update() {
        const now = new Date();
        let diff = 0;
        if (testMode) {
            const elapsed = Math.floor((Date.now() - testStart) / 1000);
            diff = Math.max(0, testSeconds - elapsed);
        } else {
            const target = getNextJan1();
            diff = Math.max(0, Math.floor((target - now) / 1000));
        }

        const days = Math.floor(diff / 86400);
        diff -= days * 86400;
        const hours = Math.floor(diff / 3600);
        diff -= hours * 3600;
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;

        const newTime = formatHMS(hours, minutes, seconds);

        if (!currentTime) {
            renderInitial(days, hours, minutes, seconds);
            return;
        }

        const daysSpan = display.querySelector('.days');
        if (days > 0) {
            if (daysSpan) {
                if (daysSpan.textContent !== `${days}d `) daysSpan.textContent = `${days}d `;
            } else {
                const temp = document.createElement('span');
                temp.className = 'days';
                temp.textContent = `${days}d `;
                display.insertBefore(temp, display.firstChild);
            }
        } else if (daysSpan) {
            daysSpan.remove();
        }

        const digitContainers = display.getElementsByClassName('digit-container');

        let containerIndex = 0;
        for (let i = 0; i < newTime.length; i++) {
            const ch = newTime[i];
            if (ch === ':') continue; 

            const prev = currentTime[i];
            if (prev !== ch) {
                const container = digitContainers[containerIndex];
                if (container) updateDigit(container, ch);
            }
            containerIndex++;
        }

        currentTime = newTime;

        if (diff <= 0) {
            const ds = display.querySelector('.days');
            if (ds) ds.textContent = '0d ';
            const zeros = formatHMS(0, 0, 0);
            let idx = 0;
            for (let i = 0; i < zeros.length; i++) {
                if (zeros[i] === ':') continue;
                const c = digitContainers[idx];
                if (c) updateDigit(c, zeros[i]);
                idx++;
            }
            // launch confetti celebration (indefinitely until stopped)
            try { startConfetti(0); } catch (e) { console.warn('Confetti failed', e); }
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }
    }

    // Start only if screen large enough; listen for resize
    checkScreen();

    window.addEventListener('resize', checkScreen);
    window.addEventListener('orientationchange', checkScreen);

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            if (!isSmallScreen()) update();
        }
    });
})();