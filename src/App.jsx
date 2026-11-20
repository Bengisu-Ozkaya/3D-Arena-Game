import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

function App() {
  const mountRef = useRef(null) // HTML'de canvas'ın içine konacağı <div>

  //Animasyonu durdurup/başlatma
  const [isRunning, SetIsRunning] = useState(false)
  const isRunningAnimRef = useRef(false);

  const toggleRunning = () => {
    SetIsRunning(!isRunning)
    isRunningAnimRef.current = !isRunning
  }

  //Skor
  const [score, setScore] = useState(0)


  useEffect(() => {
    if (!mountRef.current) return
    // 1. Sahne oluşturma
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#1a1a1a') // Koyu gri arka plan

    // 2. Renderer oluşturma
    const width = mountRef.current.clientWidth
    const height = mountRef.current.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)

    // Canvas elementini div'in içine ekliyoruz
    mountRef.current.innerHTML = ''
    mountRef.current.appendChild(renderer.domElement)

    const camera = new THREE.PerspectiveCamera(55, (width / height), 0.1, 1000) //perpektif kamera oluşturma
    camera.position.z = 4; //Varsayılan olark (0,0,0) konumunda oluşturulduğu için sahnedeki şeyleri görebilmke için pozisyonunu değiştirdik
    camera.position.y = 1;

    //player
    const characterGeo = new THREE.BoxGeometry(0.5, 1, 0.5)
    const characterMat = new THREE.MeshBasicMaterial({ color: '#2468ac' })
    const character = new THREE.Mesh(characterGeo, characterMat)

    //player collider
    const characterBox = new THREE.Box3()

    character.position.y = -0.5
    scene.add(character)

    //coin
    const coinGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2)
    const coinMat = new THREE.MeshBasicMaterial({ color: '#f2ff00' })
    const coin = new THREE.Mesh(coinGeo, coinMat)

    coin.position.x = Math.random() * 4 - 2
    coin.position.y = Math.random() - 2

    scene.add(coin)

    //zemin
    const floorGeo = new THREE.BoxGeometry(10, 0, 15)
    const floorMat = new THREE.MeshBasicMaterial({ color: '#00ff2a' })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.position.z = -2
    floor.position.y = -1
    scene.add(floor)

    const wall1 = createWallPrefab(4, 2, 0.5, -2, 0, -1, '#112548')
    const wall2 = createWallPrefab(2, 1, 0.5, 2, -0.5, -5, '#7865ae')

    scene.add(wall1)
    scene.add(wall2)



    //Klavye Kontrolü
    const keys = {}
    const handleKeyDown = (e) => {
      keys[e.key.toLowerCase()] = true
      keys[e.code] = true
    }
    const handleKeyUp = (e) => {
      keys[e.key.toLowerCase()] = false
      keys[e.code] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)


    let animationFrameId

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      if (isRunningAnimRef.current) {
        followPlayer(camera, character)

        //player
        const moveSpeed = 0.08
        const prevX = character.position.x
        const prevZ = character.position.z

        //coin
        coin.rotation.y += 0.02

        //player hareket alanı sınırı
        if (character.position.x >= 3.5) {
          character.position.x = 3.5
        }
        if (character.position.x <= -3.5) {
          character.position.x = -3.5
        }
        if (character.position.y >= 2) {
          character.position.y = 2
        }
        if (character.position.y <= -1) {
          character.position.y = -1
        }

        //player hareket
        // Yukarı / Aşağı
        if (keys['w'] || keys['KeyW'] || keys['ArrowUp']) {
          character.position.z -= moveSpeed
          console.log("KARAKTERİN POZİSYONU: ", character.position.y)
        }
        if (keys['s'] || keys['KeyS'] || keys['ArrowDown']) character.position.z += moveSpeed

        // Sola / Sağa
        if (keys['a'] || keys['KeyA'] || keys['ArrowLeft']) character.position.x -= moveSpeed
        if (keys['d'] || keys['KeyD'] || keys['ArrowRight']) character.position.x += moveSpeed

        // Dönüşler (Q ve E için 'rotation.y' fırıldak gibi sağa-sola döndürür)
        if (keys['q'] || keys['KeyQ']) character.rotation.y -= moveSpeed
        if (keys['e'] || keys['KeyE']) character.rotation.y += moveSpeed


        characterBox.setFromObject(character) //collider, character nesnesini her frame de takip etsin diye
        if (characterBox.intersectsBox(wall1.box) || characterBox.intersectsBox(wall2.box)) {
          // Çarptı! İçinden geçememesi için pozisyonunu eski yerine geri al:
          character.position.x = prevX
          character.position.z = prevZ
        }

        //coin ile character arası mesafe
        const distance = character.position.distanceTo(coin.position)
        if (distance < 0.7) {
          setScore(prev => prev + 1)

          coin.position.x = Math.random() * 2 - 1
          coin.position.y = Math.random() * 2 - 1
        }
      }

      renderer.render(scene, camera) //Sahneyi kameranın gözünden görme
    }

    animate()

    // React StrictMode veya bileşen kapandığında hafızayı temizler
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)

      renderer.dispose()
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
      {/* > işaretini özelliklerin sonuna aldık: */}
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

      {isRunning && <button
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
      }

      {isRunning && <p
        style={{
          width: "150px",
          height: "20px",
          position: 'absolute',
          top: '35px',
          right: '10px',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          color: '#ffffff'
        }}>{score}</p>}



    </div>
  )
}

function createWallPrefab(sizeX, sizeY, sizeZ, posX, posY, posZ, colors) {
  const wallPrefabGeo = new THREE.BoxGeometry(sizeX, sizeY, sizeZ)
  const wallPrefabMat = new THREE.MeshBasicMaterial({ color: colors })
  const wallPrefab = new THREE.Mesh(wallPrefabGeo, wallPrefabMat)
  wallPrefab.position.set(posX, posY, posZ)

  wallPrefab.box = new THREE.Box3().setFromObject(wallPrefab)

  return wallPrefab
}

function followPlayer(cam, player) {
  // Kamerayı karakterin pozisyonuna göre konumlandırma
  cam.position.x = player.position.x
  cam.position.y = player.position.y + 1.5  
  cam.position.z = player.position.z + 4    

  cam.lookAt(player.position) //kameranın yüzünün player'a bakması için 
}


export default App
