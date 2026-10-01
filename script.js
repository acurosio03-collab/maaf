const body = document.body;
const openButton = document.querySelector('#openLetter');
const envelopeStage = document.querySelector('.envelope-stage');
const letterSection = document.querySelector('#letter');
const closeButton = document.querySelector('#closeLetter');
const farewellOverlay = document.querySelector('#farewellOverlay');
const soundControl = document.querySelector('#soundControl');
const soundLabel = document.querySelector('#soundLabel');
const scrollProgress = document.querySelector('#scrollProgress');

let ambientContext;
let ambientGain;
let ambientNodes = [];

function playOpenChime() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const gain = context.createGain();
  const oscillator = context.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(520, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(780, context.currentTime + 0.42);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.05);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 1.1);
  oscillator.addEventListener('ended', () => context.close());
}

function startAmbient() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  ambientContext = ambientContext || new AudioContext();
  if (ambientContext.state === 'suspended') ambientContext.resume();
  if (ambientNodes.length) {
    ambientGain.gain.cancelScheduledValues(ambientContext.currentTime);
    ambientGain.gain.linearRampToValueAtTime(0.018, ambientContext.currentTime + 0.9);
    return;
  }

  ambientGain = ambientContext.createGain();
  ambientGain.gain.setValueAtTime(0.0001, ambientContext.currentTime);
  ambientGain.gain.exponentialRampToValueAtTime(0.018, ambientContext.currentTime + 1.2);
  ambientGain.connect(ambientContext.destination);

  [174.61, 261.63].forEach((frequency, index) => {
    const oscillator = ambientContext.createOscillator();
    oscillator.type = index ? 'sine' : 'triangle';
    oscillator.frequency.value = frequency;
    oscillator.detune.value = index ? 4 : -3;
    oscillator.connect(ambientGain);
    oscillator.start();
    ambientNodes.push(oscillator);
  });
}

function stopAmbient() {
  if (!ambientContext || !ambientGain) return;
  ambientGain.gain.cancelScheduledValues(ambientContext.currentTime);
  ambientGain.gain.exponentialRampToValueAtTime(0.0001, ambientContext.currentTime + 0.8);
  window.setTimeout(() => {
    ambientNodes.forEach((node) => node.stop());
    ambientNodes = [];
  }, 900);
}

openButton?.addEventListener('click', () => {
  envelopeStage.classList.add('is-open');
  letterSection.classList.remove('locked');
  openButton.querySelector('span').textContent = 'Surat terbuka';
  openButton.setAttribute('aria-label', 'Surat sudah terbuka');
  openButton.disabled = true;
  playOpenChime();
  window.setTimeout(() => {
    letterSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 580);
});

soundControl?.addEventListener('click', () => {
  const isOn = soundControl.getAttribute('aria-pressed') === 'true';
  if (isOn) {
    stopAmbient();
    soundControl.setAttribute('aria-pressed', 'false');
    soundControl.setAttribute('aria-label', 'Nyalakan musik lembut');
    soundLabel.textContent = 'Suara sunyi';
  } else {
    startAmbient();
    soundControl.setAttribute('aria-pressed', 'true');
    soundControl.setAttribute('aria-label', 'Matikan musik lembut');
    soundLabel.textContent = 'Suara lembut';
  }
});

closeButton?.addEventListener('click', () => {
  farewellOverlay.classList.add('is-visible');
  farewellOverlay.setAttribute('aria-hidden', 'false');
  body.classList.add('ending');
  stopAmbient();
  window.setTimeout(() => farewellOverlay.classList.add('fade-away'), 6500);
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal:not(.is-visible)').forEach((element) => revealObserver.observe(element));

function updateScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  scrollProgress.style.width = `${progress}%`;
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();
