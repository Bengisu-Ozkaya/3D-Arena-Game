import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { VirtualJoystick } from './VirtualJoystick.js';

export class PlayerController {
    constructor(player, camera, domElement) {
        this.player = player;
        this.camera = camera;
        this.domElement = domElement;

        // Karakterin yürüme hızı
        this.speed = 0.15;

        // PointerLock Kontrollerini oluşturuyoruz
        this.controls = new PointerLockControls(this.camera, this.domElement);

        // Ekrana (canvas'a) tıklandığında fareyi ekrana kilitle:
        this.domElement.addEventListener('click', () => {
            this.controls.lock();
        });

        // Kamerayı oyuncunun kafasının (göz) hizasına koyuyoruz:
        this.camera.position.set(
            this.player.position.x,
            this.player.position.y + 0.7, // 1.8 boyundaki karakterin göz hizası
            this.player.position.z
        );

        // Sanal Joystick'i oluşturup canvas'ın bulunduğu kutunun içine ekliyoruz:
        this.joystick = new VirtualJoystick(this.domElement.parentElement || document.body);

        // Hangi tuşlara basıldığını tutan nesne
        this.keys = {};

        this.onKeyDown = (e) => {
            this.keys[e.code] = true;
        };

        this.onKeyUp = (e) => {
            this.keys[e.code] = false;
        };

        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }

    // Oyun kapandığında hafızayı temizlemek için dinleyicileri kaldırıyoruz:
    dispose() {
        this.controls.dispose();
        if (this.joystick) this.joystick.dispose(); // Joystick'i ekrandan kaldırır
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
    }

    update() {
        // 1. Eğer fare kilitli değilse VE joystick'e de dokunulmuyorsa hareket etme:
        if (!this.controls.isLocked && !this.joystick.isActive) return;

        let forward = 0;
        let right = 0;

        // 2. Klavye Girdileri (WASD)
        if (this.keys['KeyW'] || this.keys['ArrowUp']) forward += 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) forward -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) right += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) right -= 1;

        // 3. Sanal Joystick Girdileri (Mobil)
        forward += this.joystick.input.y;
        right += this.joystick.input.x;

        // 4. Çapraz Koşma Hız Sınırlaması (Evrensel Vektör Normalizasyonu):
        // İster klavye ister joystick olsun, toplam uzunluk 1'den büyükse 1'e çekiyoruz:
        const length = Math.hypot(forward, right);
        if (length > 1) {
            forward /= length;
            right /= length;
        }

        // 5. Kamerayı ve karakteri hareket ettir:
        this.controls.moveForward(forward * this.speed);
        this.controls.moveRight(right * this.speed);

        this.player.position.x = this.camera.position.x;
        this.player.position.z = this.camera.position.z;
        this.player.position.y = this.camera.position.y - 0.7;
    }
}