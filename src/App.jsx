import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { ArenaMap } from "./game/world/ArenaMap"
import { PlayerController } from "./game/controls/PlayerController"
import { WeaponSystem } from "./game/combat/WeaponSystem"

function App() {
  const mountRef = useRef(null) // HTML'de canvas'ın içine konacağı <div>

  //Oyunu durdurup/başlatma
  const [isRunning, SetIsRunning] = useState(false)
  const isRunningAnimRef = useRef(false);

  //mobilde zıplama butonu için
  const playerControllerRef = useRef(null)

  //dış dünya ile silahın durumunu haberleştirmek için
  const weaponSystemRef = useRef(null)

  //Mermi sayısı
  const [ammoInfo, setAmmoInfo] = useState({ ammo: 30, max: 90, isReloading: false })



  const toggleRunning = () => {
    SetIsRunning(!isRunning)
    isRunningAnimRef.current = !isRunning
  }

  useEffect(() => {
    if (!mountRef.current) return

    // 1. Sahne oluşturma
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#1a1a1a') // Koyu gri arka plan

    // 2. Arenayı yükleme
    const arenaMap = new ArenaMap(scene)

    // 3. Renderer oluşturma
    const width = window.innerWidth // Daha responsive
    const height = window.innerHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // yüksek çözünürlüklü ekranlar için optimizasyon

    // Canvas elementini div'in içine ekliyoruz
    mountRef.current.innerHTML = ''
    mountRef.current.appendChild(renderer.domElement)

    // 4. Camera Oluşturma
    const camera = new THREE.PerspectiveCamera(55, (width / height), 0.1, 1000)

    // 5. Player oluşturma
    const playerGeo = new THREE.BoxGeometry(0.8, 1.8, 0.8)
    const playerMat = new THREE.MeshStandardMaterial({ color: 0x2468ac })
    const player = new THREE.Mesh(playerGeo, playerMat)
    player.position.set(0, 0.9, 25)
    scene.add(player)

    // 6. Player hareket fonksiyonu bağlama
    const playerController = new PlayerController(player, camera, renderer.domElement, arenaMap.colliders)
    playerControllerRef.current = playerController

    // 7.Silah Sistemi oluşturma
    const weaponSystem = new WeaponSystem(scene, camera, arenaMap, (ammo, max, isReloading) => {
      setAmmoInfo({ ammo, max, isReloading })
    })
    weaponSystemRef.current = weaponSystem

    const handleMouseDown = (e) => {
      // e.button === 0 (Sol Tık), oyun çalışıyorsa VE fare ekrana kilitliyse ateş et!
      if (e.button === 0 && isRunningAnimRef.current && playerController.controls.isLocked) {
        weaponSystem.startFiring()
      }
    }

    const handleMouseUp = (e) => {
      if (e.button === 0) {
        weaponSystem.stopFiring()
      }
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    // Reload işlemi
    const handleReloadKey = (e) => {
      if (e.code === 'KeyR' && isRunningAnimRef.current) weaponSystem.reload()
    }
    window.addEventListener('keydown', handleReloadKey)




    // Pencere veya telefon boyutu değiştiğinde otomatik uyum sağla:
    const handleResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix() // Kameranın projeksiyon matrisini yeniler
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    let animationFrameId

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      if (isRunningAnimRef.current) {
        playerController.update()
        weaponSystem.update()
      }

      renderer.render(scene, camera)
    }

    animate() // Döngüyü dışarıda 1 kez başlatıyoruz

    // useEffect'in temizleme fonksiyonu:
    return () => {
      cancelAnimationFrame(animationFrameId)
      arenaMap.dispose()
      renderer.dispose()
      playerController.dispose()
      window.removeEventListener('resize', handleResize)
      if (mountRef.current) {
        mountRef.current.innerHTML = ''
      }
    }
  }, [])

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        backgroundColor: '#000'
      }}
    >
      {/* 1. Three.js 3D Tuvali */}
      <div
        ref={mountRef}
        style={{ width: '100%', height: '100%' }}
      />

      {/* 2. Başlat Butonu */}
      {!isRunning && (
        <button
          onClick={toggleRunning}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            padding: '12px 28px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Oyuna Başla
        </button>
      )}

      {/* 3. Durdur Butonu */}
      {isRunning && (
        <button
          onClick={toggleRunning}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 10,
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Oyunu Durdur
        </button>
      )}

      {/* 4. Crosshair (Nişangah) */}
      {isRunning && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '16px',
            height: '16px',
            pointerEvents: 'none',
            zIndex: 20
          }}
        >
          <div style={{ position: 'absolute', left: '7px', top: '0', width: '2px', height: '16px', backgroundColor: '#00ff88', boxShadow: '0 0 2px black' }} />
          <div style={{ position: 'absolute', left: '0', top: '7px', width: '16px', height: '2px', backgroundColor: '#00ff88', boxShadow: '0 0 2px black' }} />
        </div>
      )}

      {/* 5. Mobil Zıplama Butonu (Oyun alanının SAĞ ALT köşesine şıkça yerleşir) */}
      {isRunning && (
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            playerControllerRef.current?.jump();
          }}
          style={{
            position: 'absolute',
            bottom: '150px',
            right: '40px',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            color: '#ffffff',
            fontSize: '20px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            touchAction: 'none',
            zIndex: 30,
            backdropFilter: 'blur(6px)',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)'
          }}
        >
          ▲
        </button>
      )}

      {isRunning && (
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            weaponSystemRef.current?.startFiring();
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            weaponSystemRef.current?.stopFiring();
          }}
          onPointerCancel={() => {
            weaponSystemRef.current?.stopFiring();
          }}
          style={{
            position: 'absolute',
            bottom: '80px',
            right: '40px',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            color: '#ffffff',
            fontSize: '20px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            touchAction: 'none',
            zIndex: 30,
            backdropFilter: 'blur(6px)',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)'
          }}
        >
          🔫
        </button>
      )}

      {isRunning && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            weaponSystemRef.current?.reload();
          }}
          style={{
            position: 'absolute', top: '20px', right: '25px',
            padding: '10px 18px', backgroundColor: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px',
            color: ammoInfo.ammo <= 5 ? '#ff4444' : '#ffffff',
            fontFamily: 'monospace', fontSize: '20px', fontWeight: 'bold',
            cursor: 'pointer', zIndex: 30
          }}
        >
          {ammoInfo.isReloading ? 'DOLDURULUYOR...' : `🔫 ${ammoInfo.ammo} / ${ammoInfo.max}`}
        </div>
      )}
    </div>
  )
}

export default App
