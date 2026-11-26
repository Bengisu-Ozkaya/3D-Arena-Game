import * as THREE from 'three';

export class WeaponSystem {
    constructor(scene, camera, arenaMap) {
        this.scene = scene
        this.camera = camera
        this.arenaMap = arenaMap

        this.raycaster = new THREE.Raycaster(); // lazer tabanca

        this.screenCenter = new THREE.Vector2(0, 0); // ekranın oratsındaki nişangah (0,0)
    }

    shoot() {
        this.raycaster.setFromCamera(this.screenCenter, this.camera)

        const intersects = this.raycaster.intersectObjects(this.arenaMap.mapGroup.children)

        // 1. Işın hiçbir şeye çarpmadıysa (gökyüzüne sıkıldıysa) çık:
        if (intersects.length === 0) return;

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
                hitObject.userData.hp = 3;
            }
        }
    }
}