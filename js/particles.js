/* =========================================
   PARTICLES.JS — Anti-Gravity Particle System
   Pure vanilla JS canvas, no libraries
   ========================================= */

(function () {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const COLORS = ['#b06aff', '#ff6acd', '#6afff3', '#e8e0ff', '#d4aaff'];
  let particles = [];
  let W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function randomBetween(a, b) {
    return a + Math.random() * (b - a);
  }

  function createParticle() {
    return {
      x: randomBetween(0, W),
      y: randomBetween(H * 0.2, H + 20),
      size: randomBetween(1.5, 5),
      speedY: randomBetween(0.3, 1.2),
      speedX: randomBetween(-0.3, 0.3),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: 0,
      fadeIn: true,
      life: 0,
      maxLife: randomBetween(180, 400),
    };
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < 28; i++) {
      const p = createParticle();
      p.y = randomBetween(0, H); // spread on init
      p.life = randomBetween(0, p.maxLife);
      p.opacity = Math.random() * 0.7;
      particles.push(p);
    }
  }

  function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.shadowBlur = p.size * 4;
    ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function updateParticle(p) {
    p.life++;
    p.y -= p.speedY;
    p.x += p.speedX;

    const halfLife = p.maxLife / 2;
    if (p.life < halfLife * 0.3) {
      p.opacity = Math.min(0.75, p.opacity + 0.015);
    } else if (p.life > p.maxLife * 0.75) {
      p.opacity = Math.max(0, p.opacity - 0.012);
    }

    if (p.life >= p.maxLife || p.y < -10 || p.x < -10 || p.x > W + 10) {
      Object.assign(p, createParticle());
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p) => {
      updateParticle(p);
      drawParticle(p);
    });
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => {
    resize();
    initParticles();
  });

  resize();
  initParticles();
  loop();
})();
