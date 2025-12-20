(() => {
    const display = document.getElementById('countdown');
    let intervalId = null;
    let currentTime = null;

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
        const oldDigit = container.children[0];
        const newElement = document.createElement('span');
        newElement.className = 'digit in';
        newElement.textContent = newDigit;

        container.appendChild(newElement);

        setTimeout(() => {
            if (oldDigit) oldDigit.className = 'digit out';
            newElement.className = 'digit';
        }, 50);

        setTimeout(() => {
            if (oldDigit) oldDigit.remove();
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

    function renderInitial(days, hours, minutes, seconds) {
        const timeArr = formatHMS(hours, minutes, seconds);
        let prefix = '';
        if (days > 0) prefix = `<span class="days">${days}d </span>`;
        display.innerHTML = prefix + timeArr.map(digit => digit === ':' ? '<span class="colon">:</span>' : createDigitContainer(digit)).join('');
        currentTime = timeArr;
    }

    function update() {
        const now = new Date();
        const target = getNextJan1();
        let diff = Math.max(0, Math.floor((target - now) / 1000));

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

        if (target - now <= 0) {
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
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }
    }

    update();
    intervalId = setInterval(update, 1000);

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) update();
    });
})();