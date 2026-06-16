const shapeSelect = document.getElementById('shape-select');
const radiusInput = document.getElementById('radius-input');
const heightInput = document.getElementById('height-input');
const angleSlider = document.getElementById('angle-slider');
const angleDisplay = document.getElementById('angle-display');
const playBtn = document.getElementById('play-btn');
const valVolume = document.getElementById('val-volume');
const valArea = document.getElementById('val-area');

const generatorWrapper = document.getElementById('generator-wrapper');
const generatorShape = document.getElementById('generator-shape');
const solidShape = document.getElementById('solid-shape');

let isAnimating = false;
let animationFrameId;

// 1. Математичні обчислення
function calculateMath(type, r, h) {
  let volume = 0;
  let area = 0;

  if (type === 'cylinder') {
    volume = Math.PI * Math.pow(r, 2) * h;
    area = 2 * Math.PI * r * (r + h);
  } else if (type === 'cone') {
    let l = Math.sqrt(Math.pow(r, 2) + Math.pow(h, 2));
    volume = (1/3) * Math.PI * Math.pow(r, 2) * h;
    area = Math.PI * r * (r + l);
  } else if (type === 'ellipsoid') {
    let a = r;       // Радіус по осях X і Z
    let c = h / 2;   // Піввісь по осі Y
    
    volume = (4/3) * Math.PI * Math.pow(a, 2) * c;
    
    // Площа еліпсоїда обертання
    if (a === c) {
      area = 4 * Math.PI * a * a; // Звичайна куля
    } else if (a > c) {
      // Стиснутий (сплющений) еліпсоїд
      let e = Math.sqrt(1 - (c * c) / (a * a));
      area = 2 * Math.PI * a * a * (1 + ((1 - e * e) / e) * Math.atanh(e));
    } else {
      // Витягнутий еліпсоїд
      let e = Math.sqrt(1 - (a * a) / (c * c));
      area = 2 * Math.PI * a * a * (1 + (c / (a * e)) * Math.asin(e));
    }
  }

  valVolume.innerText = volume.toFixed(2) + " од.куб.";
  valArea.innerText = area.toFixed(2) + " од.кв.";
}

// 2. Оновлення геометрії на сцені
function updateGeometry() {
  let type = shapeSelect.value;
  let r = parseFloat(radiusInput.value);
  let h = parseFloat(heightInput.value);
  let angle = parseFloat(angleSlider.value);

  // Обертаємо оболонку плоскої фігури синхронно зі слідом
  generatorWrapper.setAttribute('rotation', `0 ${angle} 0`);

  if (type === 'cylinder') {
    // Площина для циліндра на осі Z
    generatorShape.setAttribute('geometry', `primitive: plane; width: ${r}; height: ${h}`);
    generatorShape.setAttribute('rotation', '0 90 0');
    generatorShape.setAttribute('position', `0 0 ${r/2}`);
    generatorShape.setAttribute('scale', '1 1 1');
    
    solidShape.setAttribute('geometry', `primitive: cylinder; radius: ${r}; height: ${h}; thetaLength: ${angle}; openEnded: false`);
    solidShape.setAttribute('scale', '1 1 1');
  } 
  else if (type === 'cone') {
    // Трикутник для конуса на осі Z
    generatorShape.setAttribute('geometry', `primitive: triangle; vertexA: 0 ${h/2} 0; vertexB: 0 ${-h/2} 0; vertexC: 0 ${-h/2} ${r}`);
    generatorShape.setAttribute('rotation', '0 0 0');
    generatorShape.setAttribute('position', '0 0 0');
    generatorShape.setAttribute('scale', '1 1 1');
    
    solidShape.setAttribute('geometry', `primitive: cone; radiusBottom: ${r}; height: ${h}; thetaLength: ${angle}`);
    solidShape.setAttribute('scale', '1 1 1');
  } 
  else if (type === 'ellipsoid') {
    // Півколо для еліпсоїда (орієнтоване на вісь Z)
    generatorShape.setAttribute('geometry', `primitive: circle; radius: ${r}; thetaStart: -90; thetaLength: 180`);
    generatorShape.setAttribute('rotation', '0 90 0');
    generatorShape.setAttribute('position', '0 0 0');
    
    // Слід сфера з відповідним масштабуванням по Y
    solidShape.setAttribute('geometry', `primitive: sphere; radius: ${r}; phiLength: ${angle}`);
    
    // Масштабуємо сферу та коло, щоб отримати еліпсоїд
    let scaleY = h / (2 * r);
    generatorShape.setAttribute('scale', `1 ${scaleY} 1`);
    solidShape.setAttribute('scale', `1 ${scaleY} 1`);
  }
}

// 3. Обробка подій "на льоту" (без кнопки застосування)
function handleInput() {
  let r = parseFloat(radiusInput.value);
  let h = parseFloat(heightInput.value);
  calculateMath(shapeSelect.value, r, h);
  updateGeometry();
}

shapeSelect.addEventListener('change', handleInput);
radiusInput.addEventListener('input', handleInput);
heightInput.addEventListener('input', handleInput);

angleSlider.addEventListener('input', () => {
  angleDisplay.innerText = angleSlider.value;
  updateGeometry();
});

// 4. Логіка анімації
function animateRotation() {
  if (!isAnimating) return;
  
  let currentAngle = parseFloat(angleSlider.value);
  currentAngle += 2; // Швидкість обертання
  
  if (currentAngle >= 360) {
    currentAngle = 360;
    isAnimating = false;
    playBtn.innerText = "▶ Анімувати";
    playBtn.style.background = "#2ecc71";
  }
  
  angleSlider.value = currentAngle;
  angleDisplay.innerText = Math.round(currentAngle);
  updateGeometry();
  
  if (isAnimating) {
    animationFrameId = requestAnimationFrame(animateRotation);
  }
}

playBtn.addEventListener('click', () => {
  if (isAnimating) {
    isAnimating = false;
    cancelAnimationFrame(animationFrameId);
    playBtn.innerText = "▶ Продовжити";
    playBtn.style.background = "#2ecc71";
  } else {
    if (parseFloat(angleSlider.value) >= 360) {
      angleSlider.value = 0;
    }
    isAnimating = true;
    playBtn.innerText = "⏸ Пауза";
    playBtn.style.background = "#e74c3c";
    animateRotation();
  }
});

// 5. Ініціалізація при завантаженні (без автозапуску)
window.onload = () => {
  handleInput(); // Тільки розраховує і будує фігуру (кут 0)
};
