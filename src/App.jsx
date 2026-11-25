import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { ArenaMap } from "./game/world/ArenaMap"
import { PlayerController } from "./game/controls/PlayerController"

function App() {
  const mountRef = useRef(null) // HTML'de canvas'ın içine konacağı <div>

  //Oyunu durdurup/başlatma
  const [isRunning, SetIsRunning] = useState(false)
  const isRunningAnimRef = useRef(false);

  //mobilde zıplama butonu için
  const playerControllerRef = useRef(null)

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
    camera.position.set(0, 5, 25)
    camera.lookAt(0, 0, 0)

    // 5. Player oluşturma
    const playerGeo = new THREE.BoxGeometry(0.8, 1.8, 0.8)
    const playerMat = new THREE.MeshStandardMaterial({ color: 0x2468ac })
    const player = new THREE.Mesh(playerGeo, playerMat)
    player.position.set(0, 0.9, 15)
    scene.add(player)

    // Kamera oyuncuya doğru baksın
    camera.lookAt(player.position)

    // 6. Player hareket fonksiyonu bağlama
    const playerController = new PlayerController(player, camera, renderer.domElement)
    playerControllerRef.current = playerController

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
            backgroundColor: '#00ff88',
            color: '#111',
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
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: '#fff',
            border: '1px solid #555',
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
            bottom: '40px',
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
    </div>
  )
}

export default App
