import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { VirtualJoystick } from './VirtualJoystick.js';

export class PlayerController {
    constructor(player, camera, domElement) {
        this.player = player;
        this.camera = camera;
        this.domElement = domElement;

        this.speed = 0.15;        // Karakterin yürüme hızı 
        this.velocityY = 0;       // Dikey anlık hız
        this.gravity = 0.012;     // Yerçekimi ivmesi 
        this.jumpStrength = 0.22; // Zıplama anındaki yukarı fırlatma gücü
        this.isGrounded = true;   // Karakter yere basıyor mu?

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

        // --- MOBİL DOKUNMATİK KAMERA KONTROLÜ (SAĞ EL) ---
        this.touchLookId = null; // Sadece sağ ele ait parmağın ID'si
        this.lastTouchX = 0;
        this.lastTouchY = 0;
        this.lookSensitivity = 0.003; // Dokunmatik bakış hassasiyeti

        // Kameranın düzgün dönmesi için Euler dönüş sırasını YXZ yapıyoruz:
        this.camera.rotation.order = 'YXZ';

        this.onTouchStart = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                // Eğer dokunma ekranın sağ yarısındaysa (ve henüz sağ parmak yoksa):
                if (touch.clientX > window.innerWidth / 2 && this.touchLookId === null) {
                    this.touchLookId = touch.identifier;
                    this.lastTouchX = touch.clientX;
                    this.lastTouchY = touch.clientY;
                    break;
                }
            }
        };

        this.onTouchMove = (e) => {
            if (this.touchLookId === null) return;

            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.touchLookId) {
                    const deltaX = touch.clientX - this.lastTouchX;
                    const deltaY = touch.clientY - this.lastTouchY;

                    this.lastTouchX = touch.clientX;
                    this.lastTouchY = touch.clientY;

                    // Sağa - Sola Bakış (Yaw)
                    this.camera.rotation.y -= deltaX * this.lookSensitivity;

                    // Yukarı - Aşağı Bakış (Pitch)
                    this.camera.rotation.x -= deltaY * this.lookSensitivity;

                    // Kafanın takla atmasını engellemek için sınırla (-85 ile +85 derece):
                    const maxPitch = Math.PI / 2 - 0.05;
                    this.camera.rotation.x = Math.max(-maxPitch, Math.min(maxPitch, this.camera.rotation.x));
                    break;
                }
            }
        };

        this.onTouchEnd = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.touchLookId) {
                    this.touchLookId = null; // Sağ el parmağını çekti
                    break;
                }
            }
        };

        window.addEventListener('touchstart', this.onTouchStart, { passive: false });
        window.addEventListener('touchmove', this.onTouchMove, { passive: false });
        window.addEventListener('touchend', this.onTouchEnd);
        window.addEventListener('touchcancel', this.onTouchEnd);
    }

    jump() {
        if (this.isGrounded) {
            //zıplama
            this.velocityY = this.jumpStrength
            this.isGrounded = false

        }
    }

    // Oyun kapandığında hafızayı temizlemek için dinleyicileri kaldırıyoruz:
    dispose() {
        this.controls.dispose();
        if (this.joystick) this.joystick.dispose(); // Joystick'i ekrandan kaldırır
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('touchstart', this.onTouchStart);
        window.removeEventListener('touchmove', this.onTouchMove);
        window.removeEventListener('touchend', this.onTouchEnd);
        window.removeEventListener('touchcancel', this.onTouchEnd);
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
        if (this.keys['Space']) this.jump();


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

        // 1. Yerçekimini uygula (Hızı her karede biraz azaltır)
        this.velocityY -= this.gravity;
        this.player.position.y += this.velocityY;

        // 2. Zemin Kontrolü (Karakter yerin dibine girmesin)
        if (this.player.position.y <= 0.9) {
            this.player.position.y = 0.9;
            this.velocityY = 0;       // Yere basınca düşme hızı sıfırlanır
            this.isGrounded = true;   // Tekrar zıplayabilir
        }

        // 3. X ve Z'de karakter kamerayı, Y'de ise kamera karakteri takip eder:
        this.player.position.x = this.camera.position.x;
        this.player.position.z = this.camera.position.z;
        this.camera.position.y = this.player.position.y + 0.7; // Kamerayı kafaya koy
    }
}