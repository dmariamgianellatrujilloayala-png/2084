// ========== CONFIGURACIÓN DEL CANVAS ==========
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ========== VARIABLES GLOBALES ==========
let gameState = {
    inDialogue: false,
    inTutorial: true,
    inChallenge: false,
    tutorialStep: 0,
    currentChallenge: null,
    currentWaypoint: null
};

// ========== AUDIO ==========
const sounds = {
    ambient: document.getElementById('ambient-music'),
    interact: document.getElementById('interact-sound'),
    footstep: document.getElementById('footstep-sound')
};

// Configurar volúmenes
if (sounds.ambient) sounds.ambient.volume = 0.2;
if (sounds.interact) sounds.interact.volume = 0.4;
if (sounds.footstep) sounds.footstep.volume = 0.3;

// Variable para controlar inicio de música
let ambientStarted = false;

// ========== AVATAR DEL JUGADOR ==========
const playerSprite = new Image();
playerSprite.src = 'images/winston_student.jpg'; // Cambia si quieres otro avatar

// ========== JUGADOR ==========
const player = {
    x: 400,
    y: 300,
    width: 30,
    height: 30,
    speed: 3,
    color: '#00ff88',
    mentalFreedom: 50,
    unlockedWords: [],
    currentMission: 'Explora la escuela y habla con otros estudiantes'
};

// ========== CONTROLES ==========
const keys = {};

window.addEventListener('keydown', (e) => {
    // Iniciar música la primera vez que se presione una tecla
    if (!ambientStarted) {
        playSound('ambient');
        ambientStarted = true;
    }

    keys[e.key.toLowerCase()] = true;
    
    // Prevenir scroll
    if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
    
    // Interacción con ESPACIO o E
    if ((e.key === ' ' || e.key.toLowerCase() === 'e') && !gameState.inDialogue && !gameState.inTutorial && !gameState.inChallenge) {
        checkInteractions();
    }
    
    // Saltar cinemática con ESC
    if (e.key === 'Escape') {
        skipCinematic();
        closeReadingChallenge();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// ========== MAPA Y ZONAS ==========
const zones = [
    { name: 'Salón de Clases', x: 100, y: 100, width: 200, height: 150, color: 'rgba(100, 100, 255, 0.3)', interactive: true, description: 'Los estudiantes miran sus pantallas en silencio...' },
    { name: 'Sala de Computadoras', x: 400, y: 100, width: 200, height: 150, color: 'rgba(255, 100, 100, 0.3)', interactive: true, description: 'El SVE monitorea cada tecla presionada.' },
    { name: 'Biblioteca Antigua', x: 700, y: 100, width: 200, height: 150, color: 'rgba(100, 255, 100, 0.3)', interactive: true, description: 'Libros cubiertos de polvo... ¿Prohibidos?', challenge: 'challenge_1' },
    { name: 'Baño (Resistencia)', x: 100, y: 350, width: 150, height: 120, color: 'rgba(255, 255, 100, 0.3)', interactive: true, description: 'Grafitis secretos en las paredes...' },
    { name: 'Sala de Control', x: 400, y: 350, width: 200, height: 150, color: 'rgba(255, 50, 50, 0.3)', interactive: true, description: '⚠️ ZONA RESTRINGIDA - SVE' },
    { name: 'Patio', x: 700, y: 350, width: 200, height: 150, color: 'rgba(100, 255, 255, 0.3)', interactive: true, description: 'Estudiantes con teléfonos, sin hablar entre ellos.' }
];

// ========== NPCs ==========
const npcs = [
    {
        name: 'Julia',
        x: 500,
        y: 200,
        width: 30,
        height: 30,
        color: '#ff6b9d',
        image: 'images/julia_student.jpg',
        dialogueIndex: 0,
        met: false,
        dialogue: [
            {
                text: 'Hola... ¿Tú también sientes que algo está mal? Todos actúan como robots.',
                options: [
                    { text: 'Sí, lo siento. Necesitamos hacer algo.', action: 'progress' },
                    { text: 'No sé de qué hablas...', action: 'neutral' }
                ]
            },
            {
                text: '¡Gracias! Juntos podemos despertar a los demás. La lectura es nuestra arma. Encontré esto...',
                options: [
                    { text: 'Vamos a hacerlo', action: 'unlock_word', word: 'LIBERTAD', mentalFreedom: 10 }
                ]
            }
        ]
    },
    {
        name: 'O\'Brien',
        x: 500,
        y: 400,
        width: 30,
        height: 30,
        color: '#ff4444',
        image: 'images/obrien_teacher.jpg',
        dialogueIndex: 0,
        met: false,
        dialogue: [
            {
                text: 'El SVE lo ve todo, estudiante. ¿Realmente crees que puedes resistir?',
                options: [
                    { text: 'Sí, lo creo. El pensamiento es libre.', action: 'progress' },
                    { text: 'Tiene razón, profesor...', action: 'lose_freedom', mentalFreedom: -5 }
                ]
            },
            {
                text: 'Interesante... Quizás hay esperanza para ti. Pero ten cuidado, los drones están en todas partes.',
                options: [
                    { text: 'Entiendo. Gracias por la advertencia.', action: 'continue' }
                ]
            }
        ]
    },
    {
        name: 'Winston',
        x: 200,
        y: 400,
        width: 30,
        height: 30,
        color: '#88ccff',
        image: 'images/winston_student.jpg',
        dialogueIndex: 0,
        met: false,
        dialogue: [
            {
                text: 'Encontré un libro escondido... "1984" de Orwell. Es como si describiera nuestro presente.',
                options: [
                    { text: '¿Puedo leerlo?', action: 'unlock_word', word: 'MEMORIA', mentalFreedom: 15 },
                    { text: 'Eso es peligroso, deberías deshacerte de él.', action: 'neutral' }
                ]
            }
        ]
    }
];

// ========== ENEMIGOS (DRONES) ==========
const drones = [
    { x: 300, y: 250, width: 25, height: 25, color: '#ff0000', speed: 1.5, direction: 1, patrolStart: 200, patrolEnd: 600, axis: 'x' },
    { x: 600, y: 300, width: 25, height: 25, color: '#ff0000', speed: 1.2, direction: 1, patrolStart: 150, patrolEnd: 450, axis: 'y' }
];

// ========== DESAFÍOS DE LECTURA ==========
const readingChallenges = {
    challenge_1: {
        id: 'challenge_1',
        title: 'Fragmento de "Cien Años de Soledad"',
        instruction: 'Ordena los fragmentos de Gabriel García Márquez:',
        fragments: [
            'Muchos años después,',
            'frente al pelotón de fusilamiento,',
            'el coronel Aureliano Buendía',
            'había de recordar aquella tarde remota',
            'en que su padre lo llevó a conocer el hielo.'
        ],
        correctOrder: [0, 1, 2, 3, 4],
        reward: { 
            word: 'IMAGINACIÓN', 
            mentalFreedom: 20,
            message: '¡Excelente! Has desbloqueado la palabra IMAGINACIÓN'
        }
    },
    challenge_2: {
        id: 'challenge_2',
        title: 'Fragmento de "Rayuela"',
        instruction: 'Ordena los fragmentos de Julio Cortázar:',
        fragments: [
            '¿Encontraría a la Maga?',
            'Tantas veces me había bastado asomarme,',
            'viniendo por la rue de Seine,',
            'al arco que da al Quai de Conti,',
            'y apenas la luz de ceniza y olivo'
        ],
        correctOrder: [0, 1, 2, 3, 4],
        reward: { 
            word: 'BÚSQUEDA', 
            mentalFreedom: 20,
            message: '¡Perfecto! Has desbloqueado la palabra BÚSQUEDA'
        }
    },
    challenge_3: {
        id: 'challenge_3',
        title: 'Poema de Pablo Neruda',
        instruction: 'Ordena los versos de "Puedo escribir los versos más tristes esta noche":',
        fragments: [
            'Puedo escribir los versos más tristes esta noche.',
            'Escribir, por ejemplo: "La noche está estrellada,',
            'y tiritan, azules, los astros, a lo lejos".',
            'El viento de la noche gira en el cielo y canta.',
            'Puedo escribir los versos más tristes esta noche.'
        ],
        correctOrder: [0, 1, 2, 3, 4],
        reward: { 
            word: 'POESÍA', 
            mentalFreedom: 25,
            message: '¡Magnífico! Has desbloqueado la palabra POESÍA'
        }
    }
};

// Asignar desafíos a zonas
zones[2].challenge = 'challenge_1'; // Biblioteca
zones[3].challenge = 'challenge_2'; // Baño
zones[5].challenge = 'challenge_3'; // Patio

// ========== TUTORIAL ==========
const tutorialSteps = [
    {
        text: 'Bienvenido a 2084. El Sistema de Vigilancia Estudiantil (SVE) controla cada pensamiento. Tu misión: recuperar el poder de las palabras y la lectura.',
        action: null
    },
    {
        text: 'Usa las teclas WASD o las flechas para moverte por la escuela. Explora cada zona para descubrir secretos.',
        action: null
    },
    {
        text: 'Presiona ESPACIO o E cuando veas un indicador para interactuar con personas, objetos y zonas especiales.',
        action: null
    },
    {
        text: 'Completa desafíos de lectura para desbloquear palabras y aumentar tu Libertad Mental. ¡Buena suerte, resistente!',
        action: 'start_game'
    }
];

let currentTutorialStep = 0;

function nextTutorialStep() {
    playSound('interact');
    currentTutorialStep++;
    
    if (currentTutorialStep >= tutorialSteps.length) {
        // Terminar tutorial
        document.getElementById('tutorial-overlay').classList.remove('active');
        gameState.inTutorial = false;
        gameState.currentWaypoint = { x: 500, y: 200 }; // Apuntar a Julia
        showNotification('Misión Actual', 'Busca a otros estudiantes que piensen diferente. Habla con Julia.');
    } else {
        // Mostrar siguiente paso
        document.getElementById('tutorial-text').textContent = tutorialSteps[currentTutorialStep].text;
    }
}

// ========== CINEMÁTICA ==========
function skipCinematic() {
    const overlay = document.getElementById('cinematic-overlay');
    overlay.classList.add('hidden');
    setTimeout(() => {
        overlay.style.display = 'none';
        startTutorial();
    }, 500);
}

function startTutorial() {
    gameState.inTutorial = true;
    document.getElementById('tutorial-overlay').classList.add('active');
    document.getElementById('tutorial-text').textContent = tutorialSteps[0].text;
}

// Auto-skip cinemática después de 16 segundos
setTimeout(() => {
    skipCinematic();
}, 16000);

// ========== DESAFÍOS DE LECTURA ==========
let currentFragmentOrder = [];
let draggedElement = null;

function showReadingChallenge(challengeId) {
    const challenge = readingChallenges[challengeId];
    if (!challenge) return;
    
    gameState.inChallenge = true;
    gameState.currentChallenge = challenge;
    
    document.getElementById('challenge-title').textContent = challenge.title;
    document.getElementById('challenge-instruction').textContent = challenge.instruction;
    
    const fragmentsContainer = document.getElementById('challenge-fragments');
    fragmentsContainer.innerHTML = '';
    
    // Mezclar fragmentos
    const shuffled = [...challenge.fragments].sort(() => Math.random() - 0.5);
    currentFragmentOrder = [];
    
    shuffled.forEach((fragment, index) => {
        const div = document.createElement('div');
        div.className = 'fragment';
        div.textContent = fragment;
        div.draggable = true;
        div.dataset.originalIndex = challenge.fragments.indexOf(fragment);
        div.dataset.currentIndex = index;
        
        // Drag events
        div.addEventListener('dragstart', (e) => {
            draggedElement = div;
            div.classList.add('dragging');
        });
        
        div.addEventListener('dragend', () => {
            div.classList.remove('dragging');
        });
        
        div.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        div.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedElement !== div) {
                // Intercambiar posiciones
                const allFragments = [...fragmentsContainer.children];
                const draggedIndex = allFragments.indexOf(draggedElement);
                const targetIndex = allFragments.indexOf(div);
                
                if (draggedIndex < targetIndex) {
                    fragmentsContainer.insertBefore(draggedElement, div.nextSibling);
                } else {
                    fragmentsContainer.insertBefore(draggedElement, div);
                }
            }
        });
        
        fragmentsContainer.appendChild(div);
        currentFragmentOrder.push(parseInt(div.dataset.originalIndex));
    });
    
    document.getElementById('reading-challenge').classList.add('active');
    document.getElementById('challenge-feedback').classList.remove('success', 'error');
    document.getElementById('challenge-feedback').style.display = 'none';
}

function checkReadingAnswer() {
    const challenge = gameState.currentChallenge;
    const fragmentsContainer = document.getElementById('challenge-fragments');
    const fragments = [...fragmentsContainer.children];
    
    // Obtener orden actual
    const currentOrder = fragments.map(f => parseInt(f.dataset.originalIndex));
    
    // Verificar si es correcto
    const isCorrect = JSON.stringify(currentOrder) === JSON.stringify(challenge.correctOrder);
    
    const feedback = document.getElementById('challenge-feedback');
    
    if (isCorrect) {
        feedback.className = 'challenge-feedback success';
        feedback.textContent = challenge.reward.message;
        feedback.style.display = 'block';
        
        // Marcar fragmentos como correctos
        fragments.forEach(f => f.classList.add('correct'));
        
        // Otorgar recompensa
        setTimeout(() => {
            unlockWord(challenge.reward.word);
            player.mentalFreedom = Math.min(100, player.mentalFreedom + challenge.reward.mentalFreedom);
            updateHUD();
            closeReadingChallenge();
            showNotification('¡Desafío Completado!', `+${challenge.reward.mentalFreedom}% Libertad Mental`);
        }, 2000);
        
    } else {
        feedback.className = 'challenge-feedback error';
        feedback.textContent = '❌ Orden incorrecto. Intenta de nuevo.';
        feedback.style.display = 'block';
        
        // Marcar fragmentos como incorrectos temporalmente
        fragments.forEach(f => f.classList.add('incorrect'));
        setTimeout(() => {
            fragments.forEach(f => f.classList.remove('incorrect'));
            feedback.style.display = 'none';
        }, 2000);
    }
    
    playSound('interact');
}

function closeReadingChallenge() {
    document.getElementById('reading-challenge').classList.remove('active');
    gameState.inChallenge = false;
    gameState.currentChallenge = null;
}

// ========== SISTEMA DE DIÁLOGOS ==========
function showDialogue(npc) {
    if (!npc || !npc.dialogue || npc.dialogueIndex >= npc.dialogue.length) return;
    
    gameState.inDialogue = true;
    const dialogue = npc.dialogue[npc.dialogueIndex];
    
    const dialogueBox = document.getElementById('dialogue-box');
    const dialogueName = document.getElementById('dialogue-name');
    const dialogueText = document.getElementById('dialogue-text');
    const dialogueOptions = document.getElementById('dialogue-options');
    const dialogueImage = document.getElementById('dialogue-image');
    
    // Mostrar imagen del personaje
    if (dialogueImage && npc.image) {
        dialogueImage.src = npc.image;
        dialogueImage.style.display = 'block';
        dialogueImage.onerror = function() {
            console.log('⚠️ Error cargando imagen:', npc.image);
            console.log('Verifica que el archivo existe en la carpeta images/');
            this.style.display = 'none';
        };
        dialogueImage.onload = function() {
            console.log('✅ Imagen cargada correctamente:', npc.image);
        };
    } else {
        if (dialogueImage) dialogueImage.style.display = 'none';
    }
    
    dialogueName.textContent = npc.name;
    dialogueBox.classList.add('active');
    
    // Efecto de escritura
    let charIndex = 0;
    dialogueText.textContent = '';
    const typingInterval = setInterval(() => {
        if (charIndex < dialogue.text.length) {
            dialogueText.textContent += dialogue.text[charIndex];
            charIndex++;
        } else {
            clearInterval(typingInterval);
        }
    }, 30);
    
    // Limpiar opciones anteriores
    dialogueOptions.innerHTML = '';
    
    // Crear botones de opciones
    if (dialogue.options) {
        dialogue.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'dialogue-option';
            button.textContent = option.text;
            button.onclick = () => handleDialogueChoice(npc, option);
            dialogueOptions.appendChild(button);
        });
    } else {
        const button = document.createElement('button');
        button.className = 'dialogue-option';
        button.textContent = 'Continuar';
        button.onclick = () => closeDialogue(npc);
        dialogueOptions.appendChild(button);
    }
    
    playSound('interact');
}

function handleDialogueChoice(npc, option) {
    playSound('interact');
    
    // Ejecutar acción
    if (option.action === 'unlock_word' && option.word) {
        unlockWord(option.word);
        if (option.mentalFreedom) {
            player.mentalFreedom = Math.min(100, player.mentalFreedom + option.mentalFreedom);
        }
    } else if (option.action === 'lose_freedom' && option.mentalFreedom) {
        player.mentalFreedom = Math.max(0, player.mentalFreedom + option.mentalFreedom);
    }
    
    // Avanzar diálogo
    if (option.action === 'progress' || option.action === 'unlock_word') {
        npc.dialogueIndex++;
        if (npc.dialogueIndex < npc.dialogue.length) {
            setTimeout(() => showDialogue(npc), 300);
        } else {
            closeDialogue(npc);
        }
    } else {
        closeDialogue(npc);
    }
    
    updateHUD();
}

function closeDialogue(npc) {
    document.getElementById('dialogue-box').classList.remove('active');
    gameState.inDialogue = false;
    
    if (npc && !npc.met) {
        npc.met = true;
    }
}

// ========== INTERACCIONES ==========
function checkInteractions() {
    // Prioridad 1: NPCs
    for (let npc of npcs) {
        const distance = Math.sqrt(Math.pow(player.x - npc.x, 2) + Math.pow(player.y - npc.y, 2));
        if (distance < 60) {
            showDialogue(npc);
            return;
        }
    }
    
    // Prioridad 2: Zonas con desafíos
    for (let zone of zones) {
        if (zone.interactive && isPlayerInZone(zone)) {
            if (zone.challenge && readingChallenges[zone.challenge]) {
                // Verificar si ya completó el desafío
                const challenge = readingChallenges[zone.challenge];
                if (!player.unlockedWords.includes(challenge.reward.word)) {
                    showReadingChallenge(zone.challenge);
                    return;
                } else {
                    showNotification(zone.name, 'Ya completaste el desafío de esta zona.');
                    return;
                }
            } else {
                showNotification(zone.name, zone.description);
                return;
            }
        }
    }
}

function isPlayerInZone(zone) {
    return player.x > zone.x && 
           player.x < zone.x + zone.width && 
           player.y > zone.y && 
           player.y < zone.y + zone.height;
}

// ========== NOTIFICACIONES ==========
function showNotification(title, message) {
    const notification = document.getElementById('notification');
    notification.innerHTML = `
        <div class="notification-title">${title}</div>
        <div class="notification-text">${message}</div>
    `;
    notification.classList.add('active');
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 5000);
    
    playSound('interact');
}

// ========== PALABRAS DESBLOQUEADAS ==========
function unlockWord(word) {
    if (!player.unlockedWords.includes(word)) {
        player.unlockedWords.push(word);
        updateHUD();
        showNotification('¡Palabra Desbloqueada!', `"${word}" ha sido añadida a tu vocabulario.`);
    }
}

// ========== ACTUALIZAR HUD ==========
function updateHUD() {
    // Libertad Mental
    const mentalBar = document.getElementById('mental-freedom-bar');
    const mentalText = document.getElementById('mental-freedom-text');
    mentalBar.style.width = player.mentalFreedom + '%';
    mentalText.textContent = player.mentalFreedom + '%';
    
    // Palabras
    const wordsList = document.getElementById('words-list');
    wordsList.innerHTML = '';
    player.unlockedWords.forEach(word => {
        const badge = document.createElement('span');
        badge.className = 'word-badge';
        badge.textContent = word;
        wordsList.appendChild(badge);
    });
    
    // Misión
    document.getElementById('current-mission').textContent = player.currentMission;
}

// ========== WAYPOINT ==========
function updateWaypoint() {
    if (!gameState.currentWaypoint) {
        document.getElementById('waypoint-indicator').classList.remove('active');
        return;
    }
    
    const dx = gameState.currentWaypoint.x - player.x;
    const dy = gameState.currentWaypoint.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 50) {
        gameState.currentWaypoint = null;
        document.getElementById('waypoint-indicator').classList.remove('active');
        return;
    }
    
    document.getElementById('waypoint-indicator').classList.add('active');
    document.getElementById('waypoint-distance').textContent = Math.floor(distance) + 'm';
    
    // Rotar flecha (simplificado - siempre apunta a la derecha si el objetivo está a la derecha)
    const arrow = document.querySelector('.waypoint-arrow');
    if (arrow) {
        if (dx > 0) {
            arrow.style.transform = 'rotate(0deg)';
        } else {
            arrow.style.transform = 'rotate(180deg)';
        }
    }
}

// ========== AUDIO ==========
function playSound(soundName) {
    if (sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(e => {
            // Silenciar errores de audio si no hay archivos
            if (e.name !== 'NotSupportedError') {
                console.log('Audio no disponible:', soundName);
            }
        });
    }
}

// ========== MOVIMIENTO DEL JUGADOR ==========
function updatePlayer() {
    if (gameState.inDialogue || gameState.inTutorial || gameState.inChallenge) return;
    
    let moving = false;
    
    if (keys['w'] || keys['arrowup']) {
        player.y -= player.speed;
        moving = true;
    }
    if (keys['s'] || keys['arrowdown']) {
        player.y += player.speed;
        moving = true;
    }
    if (keys['a'] || keys['arrowleft']) {
        player.x -= player.speed;
        moving = true;
    }
    if (keys['d'] || keys['arrowright']) {
        player.x += player.speed;
        moving = true;
    }
    
    // Límites del canvas
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    
    // Sonido de pasos (ocasional)
    if (moving && Math.random() < 0.02) {
        playSound('footstep');
    }
}

// ========== MOVIMIENTO DE DRONES ==========
function updateDrones() {
    drones.forEach(drone => {
        if (drone.axis === 'x') {
            drone.x += drone.speed * drone.direction;
            if (drone.x >= drone.patrolEnd || drone.x <= drone.patrolStart) {
                drone.direction *= -1;
            }
        } else {
            drone.y += drone.speed * drone.direction;
            if (drone.y >= drone.patrolEnd || drone.y <= drone.patrolStart) {
                drone.direction *= -1;
            }
        }
        
        // Detectar colisión con jugador
        const distance = Math.sqrt(Math.pow(player.x - drone.x, 2) + Math.pow(player.y - drone.y, 2));
        if (distance < 40) {
            player.mentalFreedom = Math.max(0, player.mentalFreedom - 0.1);
            updateHUD();
        }
    });
}

// ========== DIBUJAR ==========
function draw() {
    // Limpiar canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar zonas
    zones.forEach(zone => {
        ctx.fillStyle = zone.color;
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
        
        // Nombre de zona
        ctx.fillStyle = '#00ff88';
        ctx.font = '14px Orbitron';
        ctx.fillText(zone.name, zone.x + 10, zone.y + 25);
    });
    
    // Dibujar NPCs
    npcs.forEach(npc => {
        ctx.fillStyle = npc.color;
        ctx.fillRect(npc.x, npc.y, npc.width, npc.height);
        
        // Nombre
        ctx.fillStyle = '#fff';
        ctx.font = '12px Orbitron';
        ctx.fillText(npc.name, npc.x - 10, npc.y - 10);
        
        // Indicador de interacción
        const distance = Math.sqrt(Math.pow(player.x - npc.x, 2) + Math.pow(player.y - npc.y, 2));
        if (distance < 60) {
            ctx.fillStyle = '#00ff88';
            ctx.font = '20px Orbitron';
            ctx.fillText('💬', npc.x + 5, npc.y - 20);
        }
    });
    
    // Dibujar drones
    drones.forEach(drone => {
        ctx.fillStyle = drone.color;
        ctx.fillRect(drone.x, drone.y, drone.width, drone.height);
        
        // Ojo del drone
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(drone.x + 12, drone.y + 12, 5, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Dibujar jugador (AVATAR CON IMAGEN)
    if (playerSprite.complete && playerSprite.naturalWidth > 0) {
        ctx.drawImage(
            playerSprite,
            player.x,
            player.y,
            player.width,
            player.height
        );
    } else {
        // Mientras carga la imagen, dibujar el cubo
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Indicador de interacción en zonas
    zones.forEach(zone => {
        if (zone.interactive && isPlayerInZone(zone)) {
            ctx.fillStyle = '#00ff88';
            ctx.font = '24px Orbitron';
            ctx.fillText('⚡ ESPACIO', player.x - 30, player.y - 20);
        }
    });
    
    // Dibujar minimapa
    drawMinimap();
}

// ========== MINIMAPA ==========
function drawMinimap() {
    const minimapCanvas = document.getElementById('minimap-canvas');
    if (!minimapCanvas) return;
    
    const mCtx = minimapCanvas.getContext('2d');
    const scale = 0.15;
    
    // Limpiar
    mCtx.fillStyle = '#000';
    mCtx.fillRect(0, 0, 150, 150);
    
    // Zonas
    zones.forEach(zone => {
        mCtx.fillStyle = zone.color;
        mCtx.fillRect(zone.x * scale, zone.y * scale, zone.width * scale, zone.height * scale);
    });
    
    // NPCs
    npcs.forEach(npc => {
        mCtx.fillStyle = npc.color;
        mCtx.fillRect(npc.x * scale, npc.y * scale, 5, 5);
    });
    
    // Jugador
    mCtx.fillStyle = '#00ff88';
    mCtx.fillRect(player.x * scale, player.y * scale, 5, 5);
}

// ========== GAME LOOP ==========
function gameLoop() {
    updatePlayer();
    updateDrones();
    updateWaypoint();
    draw();
    requestAnimationFrame(gameLoop);
}
// ========== REINICIAR JUEGO ==========
const restartBtn = document.getElementById('restart-button');
if (restartBtn) {
    restartBtn.addEventListener('click', () => {
        // Reset de estado del jugador
        player.x = 400;
        player.y = 300;
        player.mentalFreedom = 50;
        player.unlockedWords = [];
        player.currentMission = 'Explora la escuela y habla con otros estudiantes';
        
        // Reset de diálogos NPC
        npcs.forEach(npc => {
            npc.met = false;
            npc.dialogueIndex = 0;
        });
        
        // Quitar waypoints
        gameState.currentWaypoint = { x: 500, y: 200 }; // de nuevo hacia Julia
        
        // Actualizar HUD
        updateHUD();
        showNotification('Juego reiniciado', 'Tu progreso se ha reiniciado. Vuelve a empezar la misión.');
    });
}

// ========== INICIAR JUEGO ==========
updateHUD();
gameLoop();

// Guardar progreso cada 30 segundos
setInterval(() => {
    localStorage.setItem('player2084', JSON.stringify(player));
}, 30000);

// Cargar progreso guardado
const savedPlayer = localStorage.getItem('player2084');
if (savedPlayer) {
    const loaded = JSON.parse(savedPlayer);
    player.mentalFreedom = loaded.mentalFreedom || 50;
    player.unlockedWords = loaded.unlockedWords || [];
    updateHUD();
}