export class VirtualJoystick {
  constructor(container) {
    this.container = container;
    this.maxRadius = 40; // Topuzun merkezden en fazla uzaklaşabileceği piksel

    // PlayerController'ın okuyacağı nihai girdi değerleri (-1 ile +1 arası)
    this.input = { x: 0, y: 0 }; //joystick topuz konumu
    this.isActive = false;

    // Joystick'in DOM (HTML) elemanlarını oluşturuyoruz
    this.createUI();

    // Dokunma dinleyicilerini bağlıyoruz
    this.initEvents();
  }

  createUI() {
    // 1. Dış Çember (Taban)
    this.base = document.createElement('div');
    this.base.style.position = 'absolute';
    this.base.style.left = '30px';
    this.base.style.bottom = '30px';
    this.base.style.width = '100px';
    this.base.style.height = '100px';
    this.base.style.borderRadius = '50%';
    this.base.style.border = '2px solid rgba(255, 255, 255, 0.4)';
    this.base.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
    this.base.style.zIndex = '50';
    this.base.style.touchAction = 'none'; // Tarayıcının sayfayı kaydırmasını engeller
    this.base.style.userSelect = 'none';

    // 2. İç Topuz (Knob)
    this.knob = document.createElement('div');
    this.knob.style.position = 'absolute';
    this.knob.style.left = '30px';
    this.knob.style.top = '30px';
    this.knob.style.width = '40px';
    this.knob.style.height = '40px';
    this.knob.style.borderRadius = '50%';
    this.knob.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    this.knob.style.pointerEvents = 'none';

    this.base.appendChild(this.knob);
    this.container.appendChild(this.base);
  }

  initEvents() {
    // Dokunma başladığında
    this.base.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.isActive = true;
      this.base.setPointerCapture(e.pointerId);
      this.updateKnob(e.clientX, e.clientY);
    });

    // Parmağı sürüklerken
    this.base.addEventListener('pointermove', (e) => {
      if (!this.isActive) return;
      e.preventDefault();
      e.stopPropagation();
      this.updateKnob(e.clientX, e.clientY);
    });

    // Parmağı kaldırdığında (Resetleme)
    const reset = () => {
      this.isActive = false;
      this.input = { x: 0, y: 0 };
      // Topuzu merkeze geri çek
      this.knob.style.transform = `translate(0px, 0px)`;
    };

    this.base.addEventListener('pointerup', reset);
    this.base.addEventListener('pointercancel', reset);
  }

  updateKnob(clientX, clientY) {
    const rect = this.base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;

    // Merkezden olan mesafeyi hesapla
    const distance = Math.hypot(deltaX, deltaY);

    // Eğer parmak çemberin dışına çıkarsa, topuzu çember sınırında tut (Clamp):
    if (distance > this.maxRadius) {
      const angle = Math.atan2(deltaY, deltaX);
      deltaX = Math.cos(angle) * this.maxRadius;
      deltaY = Math.sin(angle) * this.maxRadius;
    }

    // Topuzu ekranda hareket ettir:
    this.knob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    // Değerleri -1 ile +1 arasına normalize ederek input değişkenimize yazıyoruz:
    this.input.x = deltaX / this.maxRadius;
    this.input.y = -deltaY / this.maxRadius; // Y'yi ters çeviriyoruz (Yukarı = İleri)
  }

  dispose() {
    if (this.base && this.base.parentNode) {
      this.base.parentNode.removeChild(this.base);
    }
  }
}