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
    camera.position.z = 5; //Varsayılan olark (0,0,0) konumunda oluşturulduğu için sahnedeki şeyleri görebilmke için pozisyonunu değiştirdik

    /*const geometry = new THREE.BoxGeometry(1, 1, 1) //kenarları 1 birim olan küp şekli
    const material = new THREE.MeshBasicMaterial({ color: '#ef3e11' }) //Küpün materyali (rengi,parlaklığı,matlığı...)
    const cube = new THREE.Mesh(geometry, material) //Şekli Materyal ile birleştirme
  
    const geometry2 = new THREE.BoxGeometry(1, 1, 1) //kenarları 1 birim olan küp şekli
    const material2 = new THREE.MeshBasicMaterial({ color: '#12a182' }) //Küpün materyali (rengi,parlaklığı,matlığı...)
    const cube2 = new THREE.Mesh(geometry2, material2) //Şekli Materyal ile birleştirme
  
    scene.add(cube)
    scene.add(cube2)*/

    const characterGeo = new THREE.BoxGeometry(1, 1, 1)
    const characterMat = new THREE.MeshBasicMaterial({ color: '#2468ac' })
    const character = new THREE.Mesh(characterGeo, characterMat)
    scene.add(character)

    //Klavye Kontrolü
    const keys = {}
    const handleKeyDown = (e) => {
      console.log("TUŞA BASILDI: ", e.code)
      keys[e.key.toLowerCase()] = true
      keys[e.code] = true // <-- Bunu ekle (KeyW, KeyA, ArrowUp gibi fiziksel tuş kodunu tutar)
    }
    const handleKeyUp = (e) => {
      keys[e.key.toLowerCase()] = false
      keys[e.code] = false // <-- Bunu ekle
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)


    let animationFrameId
    /*let speed = 0.03
    let rotationSpeed = 0.03*/

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      /*if (isRunningAnimRef.current) {
        cube.rotation.y += rotationSpeed
        cube.rotation.x += rotationSpeed
        cube2.rotation.x += rotationSpeed
  
        cube.position.x += speed
        cube2.position.y += speed
  
        if (cube.position.x >= 1.5 || cube2.position.y >= 1.5) {
          speed = -0.03
        } else if (cube.position.x <= -1.5 || cube2.position.y <= -1.5) {
          speed = 0.03
        }
      }*/

      if (isRunningAnimRef.current) {
        const moveSpeed = 0.08 // Karakterin hareket hızı

        // Yukarı / Aşağı
        if (keys['w'] || keys['KeyW'] || keys['ArrowUp']) {
          character.position.y += moveSpeed
          console.log("KARAKTERİN POZİSYONU: ", character.position.y)
        }
        if (keys['s'] || keys['KeyS'] || keys['ArrowDown']) character.position.y -= moveSpeed

        // Sola / Sağa
        if (keys['a'] || keys['KeyA'] || keys['ArrowLeft']) character.position.x -= moveSpeed
        if (keys['d'] || keys['KeyD'] || keys['ArrowRight']) character.position.x += moveSpeed

        // Dönüşler (Q ve E için 'rotation.y' fırıldak gibi sağa-sola döndürür)
        if (keys['q'] || keys['KeyQ']) character.rotation.y -= moveSpeed
        if (keys['e'] || keys['KeyE']) character.rotation.y += moveSpeed

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
        width: '400px',
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

     {isRunning &&  <button
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
      </button>}
    </div>
  )
}



export default App
