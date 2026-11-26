import * as THREE from 'three';

export class WeaponSystem {
    constructor(scene, camera, arenaMap) {
        this.scene = scene
        this.camera = camera
        this.arenaMap = arenaMap

        this.raycaster = new THREE.Raycaster(); // lazer tabanca

        this.screenCenter = new THREE.Vector2(0, 0); // ekranın oratsındaki nişangah (0,0)

        this.isFiring = false;   // Tetiğe basılı tutuluyor mu?
        this.fireRate = 130;     // İki mermi arası bekleme süresi (ms)
        this.lastShotTime = 0;   // Son merminin atıldığı zaman

        this.initGun()

        this.bulletHoles = [];     // Duvardaki mermi deliklerini tutan liste
        this.maxBulletHoles = 30;  // Ekranda aynı anda en fazla 30 delik kalsın
    }

    initGun() {
        // 1. Minimalist metalik silah gövdesi (En: 0.08, Boy: 0.1, Uzunluk: 0.4)
        const gunGeo = new THREE.BoxGeometry(0.08, 0.1, 0.4);
        const gunMat = new THREE.MeshStandardMaterial({
            color: 0x2b2d42, // Koyu metalik gri-lacivert
            metalness: 0.7,  // Metal parlaklığı
            roughness: 0.3   // Hafif pürüzsüz
        });
        this.gun = new THREE.Mesh(gunGeo, gunMat);

        // Kameraya göre konumu: Sağda (+0.28), Aşağıda (-0.22), İleride (-0.45)
        this.gun.position.set(0.28, -0.22, -0.45);

        // 2. Namlunun tam ucuna görünmez bir "Namlu Ucu Noktası" (Muzzle) koyuyoruz:
        this.muzzle = new THREE.Object3D();
        this.muzzle.position.set(0, 0, -0.21); // Silahın ön ucu
        this.gun.add(this.muzzle);

        // 3. Silahı kameraya, kamerayı da sahneye bağla!
        this.camera.add(this.gun);
        this.scene.add(this.camera);
    }

    startFiring() {
        this.isFiring = true;
        this.shoot(); // İlk tıklamada hiç beklemeden ilk mermiyi ateşle!
    }

    stopFiring() {
        this.isFiring = false;
    }

    update() {
        if (this.isFiring) {
            this.shoot();
        }
    }

    shoot() {
        const now = performance.now(); // Şu anki milisaniye
        if (now - this.lastShotTime < this.fireRate) return; // 130ms dolmadıysa ateş etme!
        this.lastShotTime = now; // Son atış saatini güncelle

        // Geri tepme (Recoil) efekti: Silahı 7cm geriye çekip 70ms sonra yerine oturt
        this.gun.position.z = -0.38;
        setTimeout(() => {
            this.gun.position.z = -0.45;
        }, 70);

        this.raycaster.setFromCamera(this.screenCenter, this.camera)

        const intersects = this.raycaster.intersectObjects(this.arenaMap.mapGroup.children)

        // 1. Işın hiçbir şeye çarpmadıysa (gökyüzüne sıkıldıysa) çık:
        if (intersects.length === 0) {
            // Gökyüzüne sıkıldıysa ışın yönünde 60 metre uzağa kadar iz çiz ve çık:
            const skyPoint = this.raycaster.ray.at(60, new THREE.Vector3());
            this.createTracer(skyPoint);
            return;
        }

        // Bir şeye çarptıysa tam çarptığı 3B noktaya (point) kadar iz çiz!
        this.createTracer(intersects[0].point);

        // 2. Işının İLK çarptığı nesneyi al (en yakındaki nesne):
        const hitObject = intersects[0].object;

        // 3. Çarptığımız nesne bir hedef mi? (Duvar veya zeminse burası false çıkar!)
        if (hitObject.userData.isTarget) {
            hitObject.userData.hp -= 1; // Canını 1 azalt

            // Vuruş Hissiyatı: 120 milisaniyeliğine kırmızıya parlat, sonra turuncuya döndür
            hitObject.material.color.setHex(0xff2222);
            setTimeout(() => {
                hitObject.material.color.setHex(0xffaa00);
            }, 120);

            // 4. Canı bittiyse arenada rastgele yeni bir konuma ışınla ve canını yenile!
            if (hitObject.userData.hp <= 0) {
                const randomX = (Math.random() - 0.5) * 40; // -20 ile +20 arası
                const randomZ = (Math.random() - 0.5) * 40; // -20 ile +20 arası
                hitObject.position.set(randomX, 0.9, randomZ);

                hitObject.userData.collider.setFromObject(hitObject); // Collider'ı da yeni konuma taşı

                hitObject.userData.hp = 3;
            }
        } else {
            // Hedef değilse (duvar, siper veya zeminse) mermi deliği bırak!
            this.createBulletHole(intersects[0]);
        }


    }

    createTracer(endPoint) {
        // Başlangıç: Kameranın konumu ama 0.25m aşağısı (silah namlusu hizası)
        const startPoint = new THREE.Vector3();
        this.muzzle.getWorldPosition(startPoint); // Namlunun dünyadaki tam koordinatını al!

        // İki nokta arasına çizgi geometrisi oluştur
        const geometry = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
        const material = new THREE.LineBasicMaterial({ color: 0xee4b2b }); // Parlak sarı
        const tracerLine = new THREE.Line(geometry, material);

        this.scene.add(tracerLine);

        // 60 milisaniye sonra çizgiyi sahneden ve ekran kartı hafızasından (VRAM) sil!
        setTimeout(() => {
            this.scene.remove(tracerLine);
            geometry.dispose();
            material.dispose();
        }, 60);
    }

    createBulletHole(hit) {
        // 6cm yarıçapında küçük koyu siyah mermi izi dairesi
        const holeGeo = new THREE.CircleGeometry(0.06, 8);
        const holeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const hole = new THREE.Mesh(holeGeo, holeMat);

        // Çarptığımız yüzeyin dünya uzayındaki bakış yönünü (Normal) al:
        const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);

        // Z-Fighting (titreme) olmasın diye duvarın 5 milimetre (0.005m) önüne koy:
        hole.position.copy(hit.point).addScaledVector(normal, 0.005);

        // Dairenin yüzünü duvarın baktığı yöne çevir (duvara tam paralel yapışsın):
        hole.lookAt(hit.point.clone().add(normal));

        this.scene.add(hole);
        this.bulletHoles.push(hole);

        // Eğer 30 delik sınırını aştıysak EN ESKİ deliği sahneden ve VRAM'den sil!
        if (this.bulletHoles.length > this.maxBulletHoles) {
            const oldestHole = this.bulletHoles.shift(); // İlk gireni listeden çıkar
            this.scene.remove(oldestHole);
            oldestHole.geometry.dispose();
            oldestHole.material.dispose();
        }
    }
}