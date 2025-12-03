// ===========================
// CONFIGURACIÓN DEL CANVAS
// ===========================

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

const minimap = document.getElementById('minimap');
const minimapCtx = minimap.getContext('2d');

// ===========================
// VARIABLES GLOBALES
// ===========================

let gameRunning = false;
let isPaused = false;

const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    interact: false,
    missions: false,
    pause: false
};

// ===========================
// JUGADOR
// ===========================

const player = {
    x: 400,
    y: 300,
    width: 30,
    height: 30,
    speed: 3,
    color: '#00ffcc',
    mentalFreedom: 50,
    unlockedWords: []
};

// ===========================
// ZONAS DEL MAPA
// ===========================

const zones = [
    { name: 'Salón de Clases', x: 50, y: 50, width: 200, height: 150, color: '#1a4d7a', interactive: true },
    { name: 'Sala de Computadoras', x: 300, y: 50, width: 200, height: 150, color: '#4a1a7a', interactive: true },
    { name: 'Patio', x: 550, y: 50, width: 200, height: 150, color: '#1a7a4d', interactive: true },
    { name: 'Baño (Resistencia)', x: 50, y: 250, width: 200, height: 150, color: '#7a4d1a', interactive: true },
    { name: 'Biblioteca Antigua', x: 300, y: 250, width: 200, height: 150, color: '#7a1a4d', interactive: true },
    { name: 'Sala de Control SVE', x: 550, y: 250, width: 200, height: 300, color: '#7a1a1a', interactive: true },
    { name: 'Exterior del Colegio', x: 50, y: 450, width: 450, height: 100, color: '#2a4a2a', interactive: true }
];

// ===========================
// NPCs
// ===========================

const npcs = [
    { 
        name: 'Julia', 
        x: 150, 
        y: 120, 
        width: 25, 
        height: 25, 
        color: '#ff6b9d',
        dialogue: 'Winston... he encontrado algo. Palabras prohibidas escondidas en la biblioteca antigua.',
        hasMission: true,
        missionId: 'mission1'
    },
    { 
        name: 'O\'Brien', 
        x: 400, 
        y: 120, 
        width: 25, 
        height: 25, 
        color: '#ff4757',
        dialogue: 'El Sistema SVE lo ve todo. Pero hay formas de engañarlo... si sabes cómo.',
        hasMission: true,
        missionId: 'mission2'
    },
    { 
        name: 'Miembro de la Resistencia', 
        x: 150, 
        y: 320, 
        width: 25, 
        height: 25, 
        color: '#2ed573',
        dialogue: 'Nos reunimos aquí en secreto. Las palabras son nuestra arma contra el control.',
        hasMission: false
    }
];

// ===========================
// SISTEMA DE MISIONES
// ===========================

const missions = {
    mission1: {
        id: 'mission1',
        title: 'Palabras Prohibidas',
        description: 'Julia te ha pedido que encuentres las palabras prohibidas escondidas en la Biblioteca Antigua.',
        objectives: [
            'Ve a la Biblioteca Antigua',
            'Busca las palabras escondidas',
            'Regresa con Julia'
        ],
        rewards: '+20 Libertad Mental, Palabra: "LIBERTAD"',
        active: false,
        completed: false,
        progress: 0
    },
    mission2: {
        id: 'mission2',
        title: 'Infiltración al SVE',
        description: 'O\'Brien necesita que accedas a la Sala de Control SVE para obtener información crítica.',
        objectives: [
            'Llega a la Sala de Control SVE',
            'Hackea el sistema',
            'Escapa sin ser detectado'
        ],
        rewards: '+30 Libertad Mental, Palabra: "VERDAD"',
        active: false,
        completed: false,
        progress: 0
    }
};

let activeMissions = [];
let completedMissions = [];

// ===========================
// ENEMIGOS/DRONES
// ===========================

const drones = [
    { x: 650, y: 350, width: 20, height: 20, speed: 1, direction: 1, patrolStart: 550, patrolEnd: 750, axis: 'x' }
];

// ===========================
// INICIALIZACIÓN
// ===========================

function initGame() {
    console.log('🎮 Iniciando juego 2084...');
    gameRunning = true;
    setupControls();
    setupTouchControls();
    setupUI();
    gameLoop();
}

// ===========================
// CONTROLES DE TECLADO
// ===========================

function setupControls() {
    window.addEventListener('keydown', (e) => {
        if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
            keys.up = true;
            e.preventDefault();
        }
        if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
            keys.down = true;
            e.preventDefault();
        }
        if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
            keys.left = true;
            e.preventDefault();
        }
        if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
            keys.right = true;
            e.preventDefault();
        }
        if (e.key === ' ' || e.key === 'e' || e.key === 'E') {
            keys.interact = true;
            e.preventDefault();
        }
        if (e.key === 'm' || e.key === 'M') {
            toggleMissionsOverlay();
            e.preventDefault();
        }
        if (e.key === 'Escape') {
            togglePause();
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.up = false;
        if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.down = false;
        if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.left = false;
        if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.right = false;
        if (e.key === ' ' || e.key === 'e' || e.key === 'E') keys.interact = false;
    });

    console.log('⌨️ Controles de teclado configurados');
}

// ===========================
// CONTROLES TÁCTILES
// ===========================

function setupTouchControls() {
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnInteract = document.getElementById('btn-interact');
    const btnMissions = document.getElementById('btn-missions');
    const btnPause = document.getElementById('btn-pause');

    if (!btnUp) {
        console.warn('⚠️ Controles táctiles no encontrados en el DOM');
        return;
    }

    console.log('📱 Configurando controles táctiles...');

    // Función para vincular botones direccionales
    function bindDirectionalButton(button, keyName) {
        // Touch events
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            keys[keyName] = true;
            console.log(`🎮 Touch: ${keyName} = true`);
        }, { passive: false });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            keys[keyName] = false;
            console.log(`🎮 Touch: ${keyName} = false`);
        }, { passive: false });

        button.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            e.stopPropagation();
            keys[keyName] = false;
        }, { passive: false });

        // Mouse events (para probar en PC)
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            keys[keyName] = true;
            console.log(`🖱️ Mouse: ${keyName} = true`);
        });

        button.addEventListener('mouseup', (e) => {
            e.preventDefault();
            keys[keyName] = false;
            console.log(`🖱️ Mouse: ${keyName} = false`);
        });

        button.addEventListener('mouseleave', (e) => {
            keys[keyName] = false;
        });
    }

    // Vincular botones direccionales
    bindDirectionalButton(btnUp, 'up');
    bindDirectionalButton(btnDown, 'down');
    bindDirectionalButton(btnLeft, 'left');
    bindDirectionalButton(btnRight, 'right');

    // Botón INTERACTUAR
    btnInteract.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('⚡ Botón interactuar presionado (touch)');
        keys.interact = true;
        checkInteractions();
        setTimeout(() => { keys.interact = false; }, 200);
    }, { passive: false });

    btnInteract.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('⚡ Botón interactuar presionado (click)');
        keys.interact = true;
        checkInteractions();
        setTimeout(() => { keys.interact = false; }, 200);
    });

    // Botón MISIONES
    btnMissions.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('📋 Botón misiones presionado (touch)');
        toggleMissionsOverlay();
    }, { passive: false });

    btnMissions.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('📋 Botón misiones presionado (click)');
        toggleMissionsOverlay();
    });

    // Botón PAUSA
    btnPause.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('⏸ Botón pausa presionado (touch)');
        togglePause();
    }, { passive: false });

    btnPause.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('⏸ Botón pausa presionado (click)');
        togglePause();
    });

    console.log('✅ Controles táctiles configurados correctamente');
}

// ===========================
// CONFIGURACIÓN DE UI
// ===========================

function setupUI() {
    // Botón de misiones en el panel
    document.getElementById('show-missions-btn').addEventListener('click', toggleMissionsOverlay);

    // Cerrar diálogo
    document.getElementById('close-dialogue-btn').addEventListener('click', closeDialogue);

    // Cerrar panel de misiones
    document.getElementById('close-missions-btn').addEventListener('click', toggleMissionsOverlay);

    // Botones de misión
    document.getElementById('accept-mission-btn').addEventListener('click', acceptMission);
    document.getElementById('decline-mission-btn').addEventListener('click', declineMission);

    // Botones de pausa
    document.getElementById('resume-btn').addEventListener('click', togglePause);
    document.getElementById('save-btn').addEventListener('click', saveGame);
    document.getElementById('load-btn').addEventListener('click', loadGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('exit-btn').addEventListener('click', exitToMenu);

    updateUI();
}

// ===========================
// GAME LOOP
// ===========================

function gameLoop() {
    if (!gameRunning) return;

    if (!isPaused) {
        update();
        draw();
        drawMinimap();
    }

    requestAnimationFrame(gameLoop);
}

// ===========================
// UPDATE
// ===========================

function update() {
    updatePlayer();
    updateDrones();
    checkInteractions();
}

function updatePlayer() {
    let moving = false;

    if (keys.up) {
        player.y -= player.speed;
        moving = true;
    }
    if (keys.down) {
        player.y += player.speed;
        moving = true;
    }
    if (keys.left) {
        player.x -= player.speed;
        moving = true;
    }
    if (keys.right) {
        player.x += player.speed;
        moving = true;
    }

    // Límites del canvas
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    // Debug de movimiento
    if (moving) {
        console.log(`🏃 Jugador moviéndose: x=${Math.round(player.x)}, y=${Math.round(player.y)}`);
    }
}

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
        if (checkCollision(player, drone)) {
            player.mentalFreedom = Math.max(0, player.mentalFreedom - 5);
            showNotification('⚠️ ¡Detectado por un dron! -5 Libertad Mental');
            updateUI();
        }
    });
}

// ===========================
// INTERACCIONES
// ===========================

function checkInteractions() {
    if (!keys.interact) return;

    console.log('🔍 Verificando interacciones...');

    // Prioridad 1: NPCs
    for (let npc of npcs) {
        if (isNear(player, npc, 50)) {
            console.log(`💬 Interactuando con ${npc.name}`);
            keys.interact = false;
            showDialogue(npc);
            return;
        }
    }

    // Prioridad 2: Zonas interactivas
    for (let zone of zones) {
        if (isInside(player, zone)) {
            console.log(`📍 Interactuando con zona: ${zone.name}`);
            keys.interact = false;
            interactWithZone(zone);
            return;
        }
    }

    console.log('❌ No hay nada cerca para interactuar');
    keys.interact = false;
}

function interactWithZone(zone) {
    console.log(`🎯 Zona activada: ${zone.name}`);

    switch(zone.name) {
        case 'Biblioteca Antigua':
            if (missions.mission1.active && missions.mission1.progress === 0) {
                missions.mission1.progress = 1;
                player.mentalFreedom = Math.min(100, player.mentalFreedom + 20);
                unlockWord('LIBERTAD');
                showNotification('📚 ¡Has encontrado palabras prohibidas! +20 Libertad Mental');
                showNotification('📖 Palabra desbloqueada: LIBERTAD');
                updateUI();
            } else {
                showNotification('📚 Biblioteca Antigua: Libros polvorientos y olvidados');
            }
            break;

        case 'Sala de Control SVE':
            if (missions.mission2.active && missions.mission2.progress === 0) {
                missions.mission2.progress = 1;
                player.mentalFreedom = Math.min(100, player.mentalFreedom + 30);
                unlockWord('VERDAD');
                showNotification('💻 ¡Has hackeado el sistema SVE! +30 Libertad Mental');
                showNotification('📖 Palabra desbloqueada: VERDAD');
                updateUI();
            } else {
                showNotification('💻 Sala de Control SVE: El Gran Hermano te observa');
            }
            break;

        case 'Salón de Clases':
            showNotification('🏫 Salón de Clases: Estudiantes conectados a sus dispositivos');
            break;

        case 'Sala de Computadoras':
            showNotification('💾 Sala de Computadoras: Pantallas brillantes, mentes apagadas');
            break;

        case 'Patio':
            showNotification('🌳 Patio: Todos miran sus teléfonos en silencio');
            break;

        case 'Baño (Resistencia)':
            showNotification('🚪 Baño: Grafitis de resistencia en las paredes');
            break;

        case 'Exterior del Colegio':
            showNotification('🏛️ Exterior: El colegio rural bajo vigilancia constante');
            break;

        default:
            showNotification(`📍 Has entrado a: ${zone.name}`);
    }
}

// ===========================
// SISTEMA DE DIÁLOGO
// ===========================

let currentNPC = null;
let currentMissionOffer = null;

function showDialogue(npc) {
    currentNPC = npc;
    
    document.getElementById('npc-name').textContent = npc.name;
    document.getElementById('dialogue-text').textContent = npc.dialogue;
    
    const choicesContainer = document.getElementById('dialogue-choices');
    choicesContainer.innerHTML = '';

    if (npc.hasMission && npc.missionId) {
        const mission = missions[npc.missionId];
        if (!mission.active && !mission.completed) {
            const btn = document.createElement('button');
            btn.textContent = '¿Qué necesitas que haga?';
            btn.addEventListener('click', () => {
                closeDialogue();
                offerMission(mission);
            });
            choicesContainer.appendChild(btn);
        }
    }

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Adiós';
    closeBtn.addEventListener('click', closeDialogue);
    choicesContainer.appendChild(closeBtn);

    document.getElementById('dialogue-overlay').classList.add('active');
}

function closeDialogue() {
    document.getElementById('dialogue-overlay').classList.remove('active');
    currentNPC = null;
}

// ===========================
// SISTEMA DE MISIONES
// ===========================

function offerMission(mission) {
    currentMissionOffer = mission;
    
    document.getElementById('mission-title').textContent = mission.title;
    document.getElementById('mission-description').textContent = mission.description;
    
    const objectivesList = document.getElementById('mission-objectives-list');
    objectivesList.innerHTML = '';
    mission.objectives.forEach(obj => {
        const li = document.createElement('li');
        li.textContent = obj;
        objectivesList.appendChild(li);
    });
    
    document.getElementById('mission-rewards-text').textContent = mission.rewards;
    
    document.getElementById('mission-overlay').classList.add('active');
}

function acceptMission() {
    if (currentMissionOffer) {
        currentMissionOffer.active = true;
        activeMissions.push(currentMissionOffer);
        showNotification(`✅ Misión aceptada: ${currentMissionOffer.title}`);
        updateUI();
    }
    document.getElementById('mission-overlay').classList.remove('active');
    currentMissionOffer = null;
}

function declineMission() {
    showNotification('❌ Misión rechazada');
    document.getElementById('mission-overlay').classList.remove('active');
    currentMissionOffer = null;
}

function toggleMissionsOverlay() {
    const overlay = document.getElementById('missions-overlay');
    const isActive = overlay.classList.contains('active');
    
    if (isActive) {
        overlay.classList.remove('active');
    } else {
        updateMissionsPanel();
        overlay.classList.add('active');
    }
}

function updateMissionsPanel() {
    const activeList = document.getElementById('active-missions-list');
    const completedList = document.getElementById('completed-missions-list');
    
    activeList.innerHTML = '';
    completedList.innerHTML = '';
    
    const activeMissionsList = Object.values(missions).filter(m => m.active && !m.completed);
    const completedMissionsList = Object.values(missions).filter(m => m.completed);
    
    if (activeMissionsList.length === 0) {
        activeList.innerHTML = '<li class="empty-state">No tienes misiones activas</li>';
    } else {
        activeMissionsList.forEach(mission => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${mission.title}</strong><br>
                <small>${mission.description}</small>
            `;
            activeList.appendChild(li);
        });
    }
    
    if (completedMissionsList.length === 0) {
        completedList.innerHTML = '<li class="empty-state">No has completado misiones</li>';
    } else {
        completedMissionsList.forEach(mission => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>✓ ${mission.title}</strong>`;
            completedList.appendChild(li);
        });
    }
}

// ===========================
// SISTEMA DE PAUSA
// ===========================

function togglePause() {
    isPaused = !isPaused;
    const overlay = document.getElementById('pause-overlay');
    
    if (isPaused) {
        overlay.classList.add('active');
        console.log('⏸ Juego pausado');
    } else {
        overlay.classList.remove('active');
        console.log('▶ Juego reanudado');
    }
}

// ===========================
// GUARDAR/CARGAR
// ===========================

function saveGame() {
    const saveData = {
        player: player,
        missions: missions,
        activeMissions: activeMissions,
        completedMissions: completedMissions
    };
    
    localStorage.setItem('2084_save', JSON.stringify(saveData));
    showNotification('💾 Partida guardada');
    console.log('💾 Juego guardado');
}

function loadGame() {
    const saveData = localStorage.getItem('2084_save');
    
    if (saveData) {
        const data = JSON.parse(saveData);
        
        player.x = data.player.x;
        player.y = data.player.y;
        player.mentalFreedom = data.player.mentalFreedom;
        player.unlockedWords = data.player.unlockedWords;
        
        Object.assign(missions, data.missions);
        activeMissions = data.activeMissions;
        completedMissions = data.completedMissions;
        
        updateUI();
        showNotification('📂 Partida cargada');
        console.log('📂 Juego cargado');
        
        if (isPaused) togglePause();
    } else {
        showNotification('❌ No hay partida guardada');
    }
}

function restartGame() {
    if (confirm('¿Estás seguro de que quieres reiniciar el juego?')) {
        location.reload();
    }
}

function exitToMenu() {
    if (confirm('¿Salir al menú principal?')) {
        document.getElementById('game-container').style.display = 'none';
        document.getElementById('start-screen').style.display = 'flex';
        gameRunning = false;
        isPaused = false;
        document.getElementById('pause-overlay').classList.remove('active');
    }
}

// ===========================
// UTILIDADES
// ===========================

function unlockWord(word) {
    if (!player.unlockedWords.includes(word)) {
        player.unlockedWords.push(word);
    }
}

function showNotification(message) {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function updateUI() {
    // Libertad Mental
    document.getElementById('mental-freedom-value').textContent = player.mentalFreedom;
    document.getElementById('mental-freedom-fill').style.width = player.mentalFreedom + '%';
    
    // Palabras
    document.getElementById('words-count').textContent = player.unlockedWords.length;
    
    const wordsList = document.getElementById('words-list');
    wordsList.innerHTML = '';
    
    if (player.unlockedWords.length === 0) {
        wordsList.innerHTML = '<li class="empty-state">No has desbloqueado palabras</li>';
    } else {
        player.unlockedWords.forEach(word => {
            const li = document.createElement('li');
            li.textContent = word;
            wordsList.appendChild(li);
        });
    }
    
    // Misión actual
    const activeMission = Object.values(missions).find(m => m.active && !m.completed);
    const missionNameEl = document.getElementById('current-mission-name');
    
    if (activeMission) {
        missionNameEl.textContent = activeMission.title;
    } else {
        missionNameEl.textContent = 'Explora el colegio';
    }
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function isNear(obj1, obj2, distance) {
    const dx = (obj1.x + obj1.width / 2) - (obj2.x + obj2.width / 2);
    const dy = (obj1.y + obj1.height / 2) - (obj2.y + obj2.height / 2);
    return Math.sqrt(dx * dx + dy * dy) < distance;
}

function isInside(obj, zone) {
    return obj.x + obj.width / 2 > zone.x &&
           obj.x + obj.width / 2 < zone.x + zone.width &&
           obj.y + obj.height / 2 > zone.y &&
           obj.y + obj.height / 2 < zone.y + zone.height;
}

// ===========================
// DIBUJO
// ===========================

function draw() {
    // Limpiar canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar zonas
    zones.forEach(zone => {
        ctx.fillStyle = zone.color;
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px Rajdhani';
        ctx.textAlign = 'center';
        ctx.fillText(zone.name, zone.x + zone.width / 2, zone.y + zone.height / 2);
    });
    
    // Dibujar NPCs
    npcs.forEach(npc => {
        ctx.fillStyle = npc.color;
        ctx.fillRect(npc.x, npc.y, npc.width, npc.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '10px Rajdhani';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, npc.x + npc.width / 2, npc.y - 5);
        
        // Indicador de misión
        if (npc.hasMission && npc.missionId) {
            const mission = missions[npc.missionId];
            if (!mission.active && !mission.completed) {
                ctx.fillStyle = '#ffa502';
                ctx.font = 'bold 16px Rajdhani';
                ctx.fillText('!', npc.x + npc.width / 2, npc.y - 15);
            }
        }
    });
    
    // Dibujar drones
    drones.forEach(drone => {
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(drone.x, drone.y, drone.width, drone.height);
        
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(drone.x + drone.width / 2, drone.y + drone.height / 2, 40, 0, Math.PI * 2);
        ctx.stroke();
    });
    
    // Dibujar jugador
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.width, player.height);
    
    // Indicador de interacción
    let canInteract = false;
    
    for (let npc of npcs) {
        if (isNear(player, npc, 50)) {
            canInteract = true;
            break;
        }
    }
    
    if (!canInteract) {
        for (let zone of zones) {
            if (isInside(player, zone) && zone.interactive) {
                canInteract = true;
                break;
            }
        }
    }
    
    const indicator = document.getElementById('interaction-indicator');
    if (canInteract) {
        indicator.style.display = 'block';
    } else {
        indicator.style.display = 'none';
    }
}

function drawMinimap() {
    const scale = minimap.width / canvas.width;
    
    minimapCtx.fillStyle = '#000';
    minimapCtx.fillRect(0, 0, minimap.width, minimap.height);
    
    // Zonas
    zones.forEach(zone => {
        minimapCtx.fillStyle = zone.color;
        minimapCtx.fillRect(zone.x * scale, zone.y * scale, zone.width * scale, zone.height * scale);
    });
    
    // Jugador
    minimapCtx.fillStyle = '#00ffcc';
    minimapCtx.fillRect(player.x * scale, player.y * scale, 4, 4);
    
    // NPCs
    npcs.forEach(npc => {
        minimapCtx.fillStyle = npc.color;
        minimapCtx.fillRect(npc.x * scale, npc.y * scale, 3, 3);
    });
    
    // Drones
    drones.forEach(drone => {
        minimapCtx.fillStyle = '#ff4757';
        minimapCtx.fillRect(drone.x * scale, drone.y * scale, 2, 2);
    });
}

// ===========================
// INICIAR CUANDO CARGUE LA PÁGINA
// ===========================

console.log('📜 game.js cargado correctamente');