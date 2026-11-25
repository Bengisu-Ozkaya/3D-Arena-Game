import * as THREE from 'three';

/**
 * ArenaMap
 * Minimalist 3D Arena FPS Haritası
 * 
 * Sorumlulukları:
 * 1. Zemin, sınır duvarları ve taktiksel siperleri (kutular, sütunlar) oluşturur.
 * 2. Sahneye derinlik katan ortam (ambient) ve yönlü (directional) ışıkları ekler.
 */
export class ArenaMap {
  constructor(scene) {
    this.scene = scene;

    // Haritadaki tüm görsel nesneleri tek bir grup altında topluyoruz.
    // Bu sayede haritayı tek seferde açıp kapatabilir veya silebiliriz.
    this.mapGroup = new THREE.Group();

    this.colliders = [] //çarpışma yaşanabilecek tüm duvar ve siperlerin kutularını tutar

    this.initLights();
    this.initFloor();
    this.initPerimeterWalls();
    this.initCovers();

    // Tüm harita grubunu ana Three.js sahnesine ekliyoruz
    this.scene.add(this.mapGroup);
  }

  /**
   * 1. IŞIKLANDIRMA:
   * MeshStandardMaterial veya MeshLambertMaterial gibi gerçekçi materyallerin
   * görünebilmesi için ışık ZORUNLUDUR (MeshBasicMaterial ışıksız da görünür ama 3D derinlik vermez).
   */
  initLights() {
    // AmbientLight: Her yönden eşit gelen yumuşak ışık. Gölgelerin zifiri karanlık olmasını engeller.
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Yönlü Işık (DirectionalLight): Güneş gibi belirli bir açıdan vuran ışık. Nesnelerin kenarlarını belirginleştirir.
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(20, 40, 20); // Sağ-üst-çaprazdan sahneye vursun
    this.scene.add(sunLight);
  }

  /**
   * 2. ZEMİN (FLOOR):
   * 60x60 birimlik geniş bir arena zemini.
   */
  initFloor() {
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    // MeshStandardMaterial ışığı yansıtır ve nesnelerin 3D görünmesini sağlar
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x8C8C8C, // Koyu antrasit zemin
      roughness: 0.8,
      metalness: 0.2
    });

    const floor = new THREE.Mesh(floorGeo, floorMat);
    // PlaneGeometry varsayılan olarak dik durur; zemine yatırmak için X ekseninde -90 derece çeviriyoruz
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;

    this.mapGroup.add(floor);
  }

  /**
   * 3. ÇEVRE SINIR DUVARLARI:
   * Oyuncunun arenadan dışarı düşmesini engelleyen 4 adet dış duvar.
   */
  initPerimeterWalls() {
    const wallHeight = 5;
    const arenaSize = 60;
    const halfSize = arenaSize / 2;
    const wallThickness = 1;

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a42, // Koyu gri duvarlar
      roughness: 0.9
    });

    // 4 duvarın konum ve boyut tanımları: [genişlik, yükseklik, derinlik, x, y, z]
    const wallsConfig = [
      // Kuzey Duvarı (İleri)
      { size: [arenaSize, wallHeight, wallThickness], pos: [0, wallHeight / 2, -halfSize] },
      // Güney Duvarı (Geri)
      { size: [arenaSize, wallHeight, wallThickness], pos: [0, wallHeight / 2, halfSize] },
      // Batı Duvarı (Sol)
      { size: [wallThickness, wallHeight, arenaSize], pos: [-halfSize, wallHeight / 2, 0] },
      // Doğu Duvarı (Sağ)
      { size: [wallThickness, wallHeight, arenaSize], pos: [halfSize, wallHeight / 2, 0] },
    ];

    wallsConfig.forEach(config => {
      const geo = new THREE.BoxGeometry(...config.size);
      const wall = new THREE.Mesh(geo, wallMat);
      wall.position.set(...config.pos);

      //PerimeterWall Collider
      const box = new THREE.Box3().setFromObject(wall); 
      this.colliders.push(box);

      this.mapGroup.add(wall);
    });
  }

  /**
   * 4. TAKTİKSEL SİPERLER VE ENGELLER (COVERS):
   * Klasik arena FPS'lerde oyuncuların arkasına saklanabileceği siper kutuları ve sütunlar.
   */
  initCovers() {
    const coverMat = new THREE.MeshStandardMaterial({
      color: 0x00adb5, // Turkuaz taktiksel renk
      roughness: 0.5
    });

    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0xf38181, // Kırmızı sütunlar
      roughness: 0.6
    });

    // Çeşitli taktiksel engeller [genişlik, yükseklik, derinlik, x, y, z, materyal]
    const obstacles = [
      // Merkez Yapı (Orta alan çatışmaları için 4 adet siper)
      { size: [4, 2, 1], pos: [-5, 1, -5], mat: coverMat },
      { size: [4, 2, 1], pos: [5, 1, -5], mat: coverMat },
      { size: [4, 2, 1], pos: [-5, 1, 5], mat: coverMat },
      { size: [4, 2, 1], pos: [5, 1, 5], mat: coverMat },

      // Köşe Yüksek Sütunlar (Keskin nişancı/saklanma noktaları)
      { size: [2, 6, 2], pos: [-15, 3, -15], mat: pillarMat },
      { size: [2, 6, 2], pos: [15, 3, -15], mat: pillarMat },
      { size: [2, 6, 2], pos: [-15, 3, 15], mat: pillarMat },
      { size: [2, 6, 2], pos: [15, 3, 15], mat: pillarMat },

      // Yan Kanat Siperleri
      { size: [1, 2, 8], pos: [-20, 1, 0], mat: coverMat },
      { size: [1, 2, 8], pos: [20, 1, 0], mat: coverMat },
    ];

    obstacles.forEach(obs => {
      const geo = new THREE.BoxGeometry(...obs.size);
      const mesh = new THREE.Mesh(geo, obs.mat);
      mesh.position.set(...obs.pos);

      //Covers Collider
      const box = new THREE.Box3().setFromObject(mesh); 
      this.colliders.push(box);

      this.mapGroup.add(mesh);
    });
  }

  /**
   * Haritayı sahneden tamamen temizlemek gerektiğinde (hafıza optimizasyonu)
   */
  dispose() {
    this.mapGroup.traverse(child => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    this.scene.remove(this.mapGroup);
  }
}
