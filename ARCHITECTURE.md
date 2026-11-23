# Çok Platformlu Minimalist Arena FPS - Mimari Dokümantasyonu 

---

## 1. Teknoloji Yığını (Tech Stack)
* **Frontend / Oyun Motoru:** Three.js + React 19 + Vite
* **Hedef Platformlar:** Web, Masaüstü (Electron/Tauri), Mobil (Capacitor ile Android APK)
* **Backend:** Python (FastAPI) + WebSockets
* **Dağıtım:** Docker & Google Cloud Run

---

## 2. Proje Klasör Mimarisi ve Sorumluluk Dağılımı

Oyun motoru mantığı ile React UI bileşenlerini birbirinden izole etmek için **ayrık sorumluluk (Separation of Concerns)** prensibi uygulanmıştır:

```text
src/
├── game/
│   ├── core/
│   │   └── Engine.js         # Sahne (Scene), Kamera (Camera), Renderer ve requestAnimationFrame (Game Loop) yönetimi.
│   ├── world/
│   │   └── ArenaMap.js       # Harita geometrileri (zemin, dış duvarlar, siper kutuları, aydınlatma) ve collider listesi.
│   ├── controls/
│   │   ├── FPSControls.js    # Hibrit Kontrol Yöneticisi: Masaüstü (Pointer Lock + WASD) ve Mobil (Joystick + Touch).
│   │   └── VirtualJoystick.js# Mobil ekran için saf JavaScript dokunmatik joystick mantığı.
├── components/
│   ├── GameCanvas.jsx        # Three.js motorunu React DOM div'ine bağlayan sarmalayıcı (wrapper).
│   └── UIOverlay.jsx         # HUD Arayüzü: Crosshair (nişangah), FPS/Ping sayacı, Cephane, Mobil Kontrol UI.
├── App.jsx                   # Sadece arayüz bileşenlerini çağıran üst React bileşeni.
```

---

## 3. 1. Hafta Mimarisi: 3D Sahne, Harita ve Hibrit Kontroller

### 3.1. Rendering ve Oyun Döngüsü (Game Loop)
* **Three.js Scene:** Tüm 3D nesnelerin barındığı hiyerarşik ağaç yapısı.
* **PerspectiveCamera:** İnsan gözü perspektifine uygun (Görüş Açısı: 75 derece) 1. şahıs bakış kamerası.
* **WebGLRenderer:** Donanım ivmeli (GPU) çizim yapan motor.
* **Game Loop (`requestAnimationFrame`):** Ekran yenileme hızında (genelde 60 FPS) çalışan, kontrolleri ve fizik hesaplarını kare bazında güncelleyen döngü.

### 3.2. Harita ve Çevre Mimarisi (`ArenaMap.js`)
* **Minimalist Geometri:** FPS performansını korumak için kutu (`BoxGeometry`) tabanlı zemin, sınır duvarları ve taktiksel siperler.
* **Aydınlatma:**
  * `AmbientLight`: Sahneye gölgesiz temel ortam ışığı sağlar (karanlıkta kalan yüzeylerin tamamen siyah olmasını önler).
  * `DirectionalLight`: Güneş ışığı gibi belirli bir açıdan gelerek nesnelere 3D derinlik ve yüzey ayrımı kazandırır.
* **Collider Kayıt Sistemi:** Duvarlar ve siperler `colliders` dizisine kaydedilir, böylece 2. haftada yazılacak fizik motoru doğrudan bu listeyi dinler.

### 3.3. Hibrit Kontrol Sistemi (Desktop + Mobile)
1. **Masaüstü (Desktop/Web):**
   * **Pointer Lock API:** Fare imlecini pencereye kilitler. Farenin `movementX` ve `movementY` delta değerleri doğrudan kameranın yatay (Yaw) ve dikey (Pitch) rotasyonuna dönüştürülür.
   * **WASD / Ok Tuşları:** Kameranın o an baktığı yöne göre vektörel hareket (Forward/Backward, Strafe Left/Right).
2. **Mobil (Android / Touch):**
   * **Sol Taraf (Ekranın sol yarısı):** Sanal Joystick ile karaktere 360 derece hareket vektörü üretilir.
   * **Sağ Taraf (Ekranın sağ yarısı):** Dokunmatik sürükleme (Touch Drag) ile kamera serbestçe döndürülür.
