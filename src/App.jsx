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

  //Silah
  let isGunCollected = false
  //Silah cephanesi
  const [cephane, setCephane] = useState(0)


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
    character.position.z = 6

    //player collider
    const characterBox = new THREE.Box3()

    character.position.y = -0.5
    scene.add(character)

    //gun
    const gunGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 32)
    const gunMat = new THREE.MeshBasicMaterial({ color: '#f2ff00' })
    const gun = new THREE.Mesh(gunGeo, gunMat)

    gun.rotation.x = Math.PI / 2
    let gunBaseY = -0.5
    gun.position.x = Math.random() * 4 - 2
    gun.position.y = gunBaseY

    scene.add(gun)

    //zemin
    const floorGeo = new THREE.BoxGeometry(10, 0, 15)
    const floorMat = new THREE.MeshBasicMaterial({ color: '#00ff2a' })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.position.y = -1
    scene.add(floor)

    const wall1 = createWallPrefab(4, 2, 0.5, -2, 0, -1, '#112548')
    const wall2 = createWallPrefab(2, 1, 0.5, 2, -0.5, -5, '#7865ae')

    scene.add(wall1)
    scene.add(wall2)



    //Klavye Kontrolü
    const keys = {}
    const handleKeyDown = (e) => {
      if (e.code === 'Space') e.preventDefault()
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

        //gun
        gun.rotation.y += 0.03 
        gun.position.y = gunBaseY + Math.sin(Date.now() * 0.004) * 0.15

        //player hareket alanı sınırı
        if (character.position.x >= 4) {
          character.position.x = 4
        }
        if (character.position.x <= -4) {
          character.position.x = -4
        }
        if (character.position.z >= 7) {
          character.position.z = 7
        }
        if (character.position.z <= -7) {
          character.position.z = -7
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

        // Silah atış
        if (keys['Space'] && isGunCollected) {
          setCephane(prev => {
            if (prev > 0) {
              console.log("Silah Ateşlendi! Kalan Mermi:", prev - 1)
              return prev - 1
            } else {
              console.log("Mermi bitti!")
              return 0
            }
          })
          keys['Space'] = false // Her basışta tek tek ateş etmesi için
        }
        


        characterBox.setFromObject(character) //collider, character nesnesini her frame de takip etsin diye
        if (characterBox.intersectsBox(wall1.box) || characterBox.intersectsBox(wall2.box)) {
          // Çarptı! İçinden geçememesi için pozisyonunu eski yerine geri al:
          character.position.x = prevX
          character.position.z = prevZ
        }

        //gun ile character arası mesafe
        const distance = character.position.distanceTo(gun.position)
        if (distance < 0.7 && !isGunCollected && (keys['f'] || keys['KeyF'])) {
          isGunCollected = true
          console.log("Silah alındı")
          setCephane(30)
          scene.remove(gun)
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
        }}>{cephane}</p>}



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
  cam.position.z = player.position.z + 3    

  cam.lookAt(player.position) //kameranın yüzünün player'a bakması için 
}


export default App
