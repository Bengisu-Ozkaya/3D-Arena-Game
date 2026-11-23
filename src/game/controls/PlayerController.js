import * as THREE from 'three';

export class PlayerController {
  constructor(player, camera) {
    this.player = player;
    this.camera = camera;

    // Karakterin yürüme hızı
    this.speed = 0.15;

    // Hangi tuşlara basıldığını tutan nesne
    this.keys = {};

    // Tuş dinleyicileri (Arrow function ile 'this' kaybolmaz)
    this.onKeyDown = (e) => {
      this.keys[e.code] = true;
    };

    this.onKeyUp = (e) => {
      this.keys[e.code] = false;
    };

    // Tarayıcıya dinleyicileri ekliyoruz
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  // Oyun kapandığında hafızayı temizlemek için dinleyicileri kaldırıyoruz:
  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

    update() {
    // 1. Başlangıçta yön vektörümüzü sıfırlıyoruz: (0, 0, 0)
    const moveDir = new THREE.Vector3(0, 0, 0);

    // 2. Basılan tuşlara göre yön vektörünü belirliyoruz:
    // İleri (W) / Geri (S)
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveDir.z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveDir.z += 1;

    // Sola (A) / Sağa (D)
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDir.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDir.x += 1;

    // 3. Eğer oyuncu en az bir tuşa basıyorsa hareket ettir:
    if (moveDir.lengthSq() > 0) {
      // Çapraz koşarken hızın artmasını engellemek için vektörü 1'e eşitliyoruz:
      moveDir.normalize();

      // Vektörü hızımızla çarpıyoruz:
      moveDir.multiplyScalar(this.speed);

      // Karakterin anlık pozisyonuna ekliyoruz:
      this.player.position.add(moveDir);
    }

    // 4. Kamera karakteri arkasından takip etsin:
    this.camera.position.x = this.player.position.x;
    this.camera.position.y = this.player.position.y + 1.5;
    this.camera.position.z = this.player.position.z + 4;
    this.camera.lookAt(this.player.position);
  }
}