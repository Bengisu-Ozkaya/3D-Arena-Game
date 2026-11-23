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
    const width = mountRef.current.clientWidth
    const height = mountRef.current.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)

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
    const playerController = new PlayerController(player, camera)

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
        width: '720px',
        height: '400px',
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
  )
}

function followPlayer(cam, player) {
  // Kamerayı karakterin pozisyonuna göre konumlandırma
  cam.position.x = player.position.x
  cam.position.y = player.position.y + 1.5
  cam.position.z = player.position.z + 3

  cam.lookAt(player.position) //kameranın yüzünün player'a bakması için 
}

export default App
