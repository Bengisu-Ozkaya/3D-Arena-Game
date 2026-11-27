import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { VirtualJoystick } from './VirtualJoystick.js';

export class PlayerController {
    constructor(player, camera, domElement, colliders = []) {
        this.player = player;
        this.camera = camera;
        this.domElement = domElement;
        this.colliders = colliders

        this.speed = 9.0;        // Karakterin yürüme hızı 
        this.velocityY = 0;       // Dikey anlık hız
        this.gravity = 42;     // Yerçekimi ivmesi 
        this.jumpStrength = 14.8 // Zıplama anındaki yukarı fırlatma gücü
        this.isGrounded = true;   // Karakter yere basıyor mu?

        this.crouchSpeed = 4.5;  // Çömelirken yürüme hızı (yarı hız)
        this.isCrouching = false;  // Şu an çömeliyor mu?
        this.mobileCrouch = false; // Mobil butonla çömelme açık mı? (Bas-Aç / Bas-Kapat)
        this.cameraOffsetY = 0.7;  // Göz hizası yüksekliği (Ayakta: 0.7, Çömelince: 0.15)

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

    //Zıplama
    jump() {
        if (this.isGrounded) {
            //zıplama
            this.velocityY = this.jumpStrength
            this.isGrounded = false //space e bir daha basıldığında zıplamamak için
            this.mobileCrouch = false

        }
    }

    toggleCrouch() {
        this.mobileCrouch = !this.mobileCrouch;
    }

    checkCollision(x, y, z) {
        // Oyuncunun o noktadaki hayali sınır kutusunu oluşturma
        const playerBox = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(x, y, z),
            new THREE.Vector3(0.8, 1.8, 0.8)
        );

        // Haritadaki tüm engelleri tek tek kontrol et
        for (const box of this.colliders) {
            if (playerBox.intersectsBox(box)) {
                return box; // Çarpışma var
            }
        }

        return null; // Hiçbir şeye çarpmadı, yol temiz!
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

    update(delta = 0.016) {
        let forward = 0;
        let right = 0;

        // Sekme arka planda kalıp 5 saniye sonra dönülürse duvar içinden geçmemek için max 0.05sn ile sınırla:
        const dt = Math.min(delta, 0.05);

        // 1. Klavye Girdileri (Sadece masaüstünde fare kilitliyken çalışsın)
        if (this.controls.isLocked) {
            if (this.keys['KeyW'] || this.keys['ArrowUp']) forward += 1;
            if (this.keys['KeyS'] || this.keys['ArrowDown']) forward -= 1;
            if (this.keys['KeyD'] || this.keys['ArrowRight']) right += 1;
            if (this.keys['KeyA'] || this.keys['ArrowLeft']) right -= 1;
            if (this.keys['Space']) this.jump();
        }

        //çömelmek için ctrl veya c tuşuna basılı tutuluyor mu?
        const isKeyCrouch = this.controls.isLocked && (this.keys['ControlLeft'] || this.keys['KeyC']);
        this.isCrouching = isKeyCrouch || this.mobileCrouch;

        // 2. Sanal Joystick Girdileri (Mobil)
        if (this.joystick.isActive) {
            forward += this.joystick.input.y;
            right += this.joystick.input.x;
        }

        // 3. Çapraz Koşma Hız Sınırlaması (Vektör Normalizasyonu)
        const length = Math.hypot(forward, right);
        if (length > 1) {
            forward /= length;
            right /= length;
        }

        // 4. YATAY HAREKET VE DUVAR KAYMASI (X ve Z Ayrı Kontrol Edilir)
        const oldZ = this.player.position.z;

        // Kamerayı geçici olarak yeni hedef konuma ilerlet
        // Çömelme varsa çömelme hızında git yoksa normal hızda git
        const currentSpeed = this.isCrouching ? this.crouchSpeed : this.speed;
        this.controls.moveForward(forward * currentSpeed * dt);
        this.controls.moveRight(right * currentSpeed * dt);

        const newX = this.camera.position.x;
        const newZ = this.camera.position.z;

        // Önce sadece X eksenini dene: Çarpmıyorsa X'i güncelle
        if (!this.checkCollision(newX, this.player.position.y, oldZ)) {
            this.player.position.x = newX;
        }

        // Sonra sadece Z eksenini dene: Çarpmıyorsa Z'yi güncelle
        if (!this.checkCollision(this.player.position.x, this.player.position.y, newZ)) {
            this.player.position.z = newZ;
        }

        // 5. DİKEY HAREKET (Yerçekimi ve Kutuların Üstüne Çıkma)
        this.isGrounded = false; // Havada varsay, yere veya kutuya değerse true yapacağız
        this.velocityY -= this.gravity * dt
        this.player.position.y += this.velocityY * dt

        // Y ekseninde bir kutuya çarptık mı?
        const hitBox = this.checkCollision(
            this.player.position.x,
            this.player.position.y,
            this.player.position.z
        );

        if (hitBox) {
            if (this.velocityY <= 0) {
                // Yukarıdan kutunun üstüne düştük -> Kutunun tavanına oturt!
                this.player.position.y = hitBox.max.y + 0.901;
                this.velocityY = 0;
                this.isGrounded = true;
            } else {
                // Aşağıdan zıplayıp kafamızı bir engele vurduk
                this.player.position.y = hitBox.min.y - 0.901;
                this.velocityY = 0;
            }
        }

        // 6. Ana Zemin Kontrolü (y = 0 zemininin altına düşmesin)
        if (this.player.position.y <= 0.9) {
            this.player.position.y = 0.9;
            this.velocityY = 0;
            this.isGrounded = true;
        }

        // 7. Kamerayı oyuncunun onaylanmış (çarpışmasız) konumuna eşitle
        this.camera.position.x = this.player.position.x;
        this.camera.position.z = this.player.position.z;

        //çömelme durmunda kameranın bakış açısı
        const targetOffset = this.isCrouching ? 0.15 : 0.7;
        this.cameraOffsetY += (targetOffset - this.cameraOffsetY) * Math.min(1, 12 * dt); // yumuşak eğilip kalkma
        this.camera.position.y = this.player.position.y + this.cameraOffsetY;
        this.player.scale.y = this.isCrouching ? 0.6 : 1.0; // Multiplayer için gövdeyi de küçült!


    }
}