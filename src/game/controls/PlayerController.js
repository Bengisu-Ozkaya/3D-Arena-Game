import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

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
        this.controls.dispose(); // PointerLock'ı temizler
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
    }

    update() {
        // 1. Eğer oyuncu ekrana tıklayıp fareyi kilitlemediyse hareket etmesin:
        if (!this.controls.isLocked) return;

        // 2. İleri-Geri ve Sağ-Sol girdilerini hesaplayalım
        let forward = 0;
        let right = 0;

        if (this.keys['KeyW'] || this.keys['ArrowUp']) forward += 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) forward -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) right += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) right -= 1;

        // 3. Çapraz Koşma Hızı Düzeltmesi (Diagonal Normalization):
        // Hem W hem D'ye aynı anda basıldığında hızın %41 artmasını engellemek için
        // her iki değeri de 1 / sqrt(2) yani ~0.7071 ile çarpıyoruz:
        if (forward !== 0 && right !== 0) {
            forward *= 0.7071;
            right *= 0.7071;
        }

        // 4. Kamerayı baktığı yöne doğru hareket ettir:
        this.controls.moveForward(forward * this.speed);
        this.controls.moveRight(right * this.speed);

        // 5. Karakterin gövdesini de kameranın tam altına taşıyalım:
        // (Böylece multiplayer'da diğer oyuncular gövdemizi kameramızın altında görür)
        this.player.position.x = this.camera.position.x;
        this.player.position.z = this.camera.position.z;
        this.player.position.y = this.camera.position.y - 0.7; // Göz hizasından ayaklara indiriyoruz
    }
}