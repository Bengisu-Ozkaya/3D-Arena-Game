import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { ArenaMap } from "./game/world/ArenaMap"
import { PlayerController } from "./game/controls/PlayerController"

function App() {
  const mountRef = useRef(null) // HTML'de canvas'ın içine konacağı <div>

  //Oyunu durdurup/başlatma
  const [isRunning, SetIsRunning] = useState(false)
  const isRunningAnimRef = useRef(false);

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

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // yüksek çözünürlüklüekranlar için optimizasyon

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

    // Kamerayı oyuncuya doğru baksın
    camera.lookAt(player.position)

    // 6. Player hareket fonksiyonu bağlama
    const playerController = new PlayerController(player, camera, renderer.domElement)


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
    <>
      <div
        style={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          margin: '50px auto',
          border: '2px solid #555',
          overflow: 'hidden'
        }}
      >
        <div
          ref={mountRef}
          style={{ width: '100%', height: '100%' }}
        />
        {!isRunning && (
          <button
            onClick={toggleRunning}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              padding: '10px 20px',
              cursor: 'pointer',
            }}
          >
            Oyuna Başla
          </button>
        )}

        {isRunning && (
          <button
            onClick={toggleRunning}
            style={{
              width: "150px",
              height: "20px",
              position: 'absolute',
              top: '2%',
              left: '2%',
              transform: 'translate(-2%, -2%)',
              zIndex: 10,
              cursor: 'pointer',
            }}
          >
            Oyunu Durdur
          </button>
        )}
      </div>

      {/* Klasik Artı (+) Nişangah */}
      {isRunning && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '16px',
            height: '16px',
            pointerEvents: 'none', // ZORUNLU!
            zIndex: 20
          }}
        >
          {/* Dikey çizgi */}
          <div style={{ position: 'absolute', left: '7px', top: '0', width: '2px', height: '16px', backgroundColor: '#00ff88', boxShadow: '0 0 2px black' }} />
          {/* Yatay çizgi */}
          <div style={{ position: 'absolute', left: '0', top: '7px', width: '16px', height: '2px', backgroundColor: '#00ff88', boxShadow: '0 0 2px black' }} />
        </div>
      )}
    </>


  )
}

export default App
