// ========================================
// 🎮 JUEGO 2084 - VERSIÓN 2D RPG MEJORADA
// ========================================

// ========== CONFIGURACIÓN GLOBAL ==========
const CONFIG = {
    canvasWidth: 1000,
    canvasHeight: 700,
    playerSpeed: 3,
    enemySpeed: 1.5,
    interactionDistance: 60,
    mentalFreedomMax: 100,
    mentalFreedomMin: 0
};

// ========== ESTADO DEL JUEGO ==========
const gameState = {
    currentMap: 'school',
    mentalFreedom: 50,
    unlockedWords: [],
    missions: [],
    completedMissions: [],
    dialogueActive: false,
    paused: false,
    flags: {
        metLibrarian: false,
        metJulia: false,
        metOBrien: false,
        joinedResistance: false,
        hackedSystem: false,
        foundBook: false
    }
};

// ========== JUGADOR ==========
const player = {
    x: 500,
    y: 350,
    width: 30,
    height: 30,
    speed: CONFIG.playerSpeed,
    color: '#00d4ff',
    direction: 'down'
};

// ========== CONTROLES ==========
const keys = {};

// Prevenir scroll con flechas
window.addEventListener('keydown', (e) => {
    if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
    keys[e.code] = true;
    
    // Interacción con ESPACIO o E
    if ((e.code === 'Space' || e.code === 'KeyE') && !gameState.dialogueActive && !gameState.paused) {
        console.log('Tecla de interacción presionada'); // Debug
        checkInteractions();
    }
    
    // Pausa con ESC
    if (e.code === 'Escape') {
        togglePause();
    }
    
    // Abrir panel de misiones con M
    if (e.code === 'KeyM' && !gameState.dialogueActive && !gameState.paused) {
        showMissionsPanel();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// ========== MAPAS ==========
const maps = {
    school: {
        name: 'Escuela Rural 2084',
        width: 1000,
        height: 700,
        background: '#2c3e50',
        zones: [
            // Paredes exteriores
            { x: 0, y: 0, width: 1000, height: 20, type: 'wall', color: '#34495e' },
            { x: 0, y: 0, width: 20, height: 700, type: 'wall', color: '#34495e' },
            { x: 980, y: 0, width: 20, height: 700, type: 'wall', color: '#34495e' },
            { x: 0, y: 680, width: 1000, height: 20, type: 'wall', color: '#34495e' },
            
            // Biblioteca (arriba izquierda) - INTERACTIVA
            { x: 50, y: 50, width: 200, height: 150, type: 'library', color: '#27ae60', label: '📚 BIBLIOTECA', interactive: true },
            
            // Baño de resistencia (arriba derecha) - INTERACTIVA
            { x: 750, y: 50, width: 200, height: 150, type: 'bathroom', color: '#3498db', label: '🚪 BAÑO', interactive: true },
            
            // Sala de computadores (abajo centro) - INTERACTIVA
            { x: 350, y: 500, width: 300, height: 150, type: 'computer_room', color: '#e74c3c', label: '💻 SALA PC', interactive: true },
            
            // Patio central - AHORA INTERACTIVA
            { x: 300, y: 250, width: 400, height: 200, type: 'courtyard', color: '#95a5a6', label: '🏫 PATIO', interactive: true },
            
            // Salón de clases (izquierda centro) - AHORA INTERACTIVA
            { x: 50, y: 300, width: 200, height: 150, type: 'classroom', color: '#e67e22', label: '🎓 SALÓN', interactive: true },
            
            // Oficina de O'Brien (derecha centro) - INTERACTIVA
            { x: 750, y: 300, width: 200, height: 150, type: 'office', color: '#9b59b6', label: '🏢 OFICINA', interactive: true }
        ],
        npcs: [
            {
                name: 'Julia',
                x: 850,
                y: 120,
                width: 25,
                height: 25,
                color: '#e91e63',
                dialogue: 'julia_intro',
                image: 'images/julia_student.jpg'
            },
            {
                name: 'O\'Brien',
                x: 850,
                y: 370,
                width: 25,
                height: 25,
                color: '#9c27b0',
                dialogue: 'obrien_intro',
                image: 'images/obrien_teacher.jpg'
            },
            {
                name: 'Bibliotecaria',
                x: 150,
                y: 120,
                width: 25,
                height: 25,
                color: '#4caf50',
                dialogue: 'librarian_intro',
                image: 'images/old_library.jpg'
            }
        ],
        enemies: [
            { x: 400, y: 100, width: 30, height: 30, speed: 1.2, patrolPath: [{x: 400, y: 100}, {x: 600, y: 100}], currentTarget: 0, type: 'drone' },
            { x: 500, y: 600, width: 30, height: 30, speed: 1, patrolPath: [{x: 300, y: 600}, {x: 700, y: 600}], currentTarget: 0, type: 'drone' }
        ]
    }
};

let currentMap = maps.school;

// ========== MISIONES DISPONIBLES ==========
const availableMissions = {
    findBook: {
        id: 'findBook',
        name: 'El Libro Prohibido',
        description: 'La bibliotecaria te ha pedido que encuentres un libro antiguo escondido en la biblioteca. Este libro contiene palabras que el SVE ha intentado borrar.',
        objectives: [
            'Busca en los estantes de la biblioteca',
            'Encuentra el libro "1984" de George Orwell',
            'Regresa con la bibliotecaria'
        ],
        rewards: {
            mentalFreedom: 20,
            words: ['LIBERTAD', 'PENSAMIENTO', 'REBELDÍA']
        },
        giver: 'Bibliotecaria',
        zone: 'library'
    },
    joinResistance: {
        id: 'joinResistance',
        name: 'Únete a la Resistencia',
        description: 'Julia te ha invitado a unirte a un grupo secreto que lucha contra el SVE. Debes demostrar tu compromiso con la causa.',
        objectives: [
            'Reúnete con Julia en el baño',
            'Aprende la señal secreta de la resistencia',
            'Encuentra a otros 3 miembros'
        ],
        rewards: {
            mentalFreedom: 30,
            words: ['RESISTENCIA', 'SOLIDARIDAD', 'ESPERANZA']
        },
        giver: 'Julia',
        zone: 'bathroom'
    },
    hackSystem: {
        id: 'hackSystem',
        name: 'Hackear el SVE',
        description: 'O\'Brien te ha dado acceso a la sala de computadores. Debes hackear el sistema de vigilancia para debilitar el control del SVE sobre la escuela.',
        objectives: [
            'Accede a la sala de computadores',
            'Encuentra la terminal principal',
            'Ejecuta el código de hackeo',
            'Escapa sin ser detectado'
        ],
        rewards: {
            mentalFreedom: 40,
            words: ['CÓDIGO', 'HACKEO', 'LIBERTAD DIGITAL']
        },
        giver: 'O\'Brien',
        zone: 'computer_room'
    },
    learnTruth: {
        id: 'learnTruth',
        name: 'La Verdad sobre O\'Brien',
        description: 'O\'Brien parece saber más de lo que dice. Investiga su verdadera lealtad: ¿está con la resistencia o con el SVE?',
        objectives: [
            'Habla con O\'Brien en su oficina',
            'Observa sus acciones',
            'Decide si confiar en él'
        ],
        rewards: {
            mentalFreedom: 25,
            words: ['VERDAD', 'TRAICIÓN', 'CONFIANZA']
        },
        giver: 'O\'Brien',
        zone: 'office'
    }
};

// ========== DIÁLOGOS ==========
const dialogues = {
    julia_intro: {
        npc: 'Julia',
        image: 'images/julia_student.jpg',
        text: 'Hola... ¿Eres nuevo aquí? Ten cuidado, el SVE nos vigila constantemente. Pero hay quienes resistimos. ¿Te gustaría saber más?',
        choices: [
            { text: '¿Qué es el SVE?', next: 'julia_sve' },
            { text: 'Quiero unirme a la resistencia', action: 'offerMission', mission: 'joinResistance' },
            { text: 'No me interesa', action: 'close' }
        ]
    },
    julia_sve: {
        npc: 'Julia',
        image: 'images/julia_student.jpg',
        text: 'El Sistema de Vigilancia Estudiantil. Controla todo: lo que leemos, lo que pensamos, incluso nuestras palabras. Pero podemos luchar contra él.',
        choices: [
            { text: '¿Cómo puedo ayudar?', action: 'offerMission', mission: 'joinResistance' },
            { text: 'Es demasiado peligroso', action: 'close' }
        ]
    },
    obrien_intro: {
        npc: 'O\'Brien',
        image: 'images/obrien_teacher.jpg',
        text: 'Bienvenido, estudiante. Soy el profesor O\'Brien. He notado que tienes... curiosidad. Eso es peligroso, pero también valioso. ¿Quieres conocer la verdad?',
        choices: [
            { text: 'Sí, quiero saber la verdad', next: 'obrien_truth' },
            { text: '¿Eres parte de la resistencia?', next: 'obrien_resistance' },
            { text: 'Prefiero no involucrarme', action: 'close' }
        ]
    },
    obrien_truth: {
        npc: 'O\'Brien',
        image: 'images/obrien_teacher.jpg',
        text: 'La verdad es que el SVE no es invencible. Tiene puntos débiles. Yo puedo ayudarte a encontrarlos... pero necesito saber si puedo confiar en ti.',
        choices: [
            { text: 'Puedes confiar en mí', action: 'offerMission', mission: 'hackSystem' },
            { text: 'Necesito pensarlo', action: 'close' }
        ]
    },
    obrien_resistance: {
        npc: 'O\'Brien',
        image: 'images/obrien_teacher.jpg',
        text: 'Esa es una pregunta peligrosa. Digamos que... tengo mis propios métodos. Si quieres ayudar, tengo una tarea para ti.',
        choices: [
            { text: '¿Qué necesitas que haga?', action: 'offerMission', mission: 'learnTruth' },
            { text: 'No estoy seguro de ti', action: 'close' }
        ]
    },
    librarian_intro: {
        npc: 'Bibliotecaria',
        image: 'images/old_library.jpg',
        text: 'Shh... Las paredes tienen oídos. Soy la guardiana de los libros prohibidos. El SVE ha intentado quemar todo el conocimiento, pero yo he salvado algunos. ¿Buscas algo en particular?',
        choices: [
            { text: 'Busco libros prohibidos', action: 'offerMission', mission: 'findBook' },
            { text: '¿Qué libros tienes?', next: 'librarian_books' },
            { text: 'Solo estoy mirando', action: 'close' }
        ]
    },
    librarian_books: {
        npc: 'Bibliotecaria',
        image: 'images/old_library.jpg',
        text: 'Tengo clásicos: Orwell, Huxley, Bradbury... Todos prohibidos por el SVE. Pero hay uno en particular que podría cambiar todo. ¿Te atreves a buscarlo?',
        choices: [
            { text: 'Sí, lo buscaré', action: 'offerMission', mission: 'findBook' },
            { text: 'Es muy arriesgado', action: 'close' }
        ]
    }
};

// ========== CANVAS Y CONTEXTO ==========
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.canvasWidth;
canvas.height = CONFIG.canvasHeight;

// Minimapa
const minimap = document.getElementById('minimap');
const minimapCtx = minimap.getContext('2d');

// ========== INICIALIZACIÓN ==========
function init() {
    console.log('🎮 Juego 2084 iniciado');
    updateUI();
    showNotification('🎮 Bienvenido a 2084. Usa WASD o flechas para moverte. ESPACIO para interactuar.', 7000);
    gameLoop();
}

// ========== BUCLE PRINCIPAL ==========
function gameLoop() {
    if (!gameState.paused && !gameState.dialogueActive) {
        updatePlayer();
        updateEnemies();
    }
    draw();
    drawMinimap();
    requestAnimationFrame(gameLoop);
}

// ========== ACTUALIZAR JUGADOR ==========
function updatePlayer() {
    const prevX = player.x;
    const prevY = player.y;
    
    // Movimiento
    if (keys['KeyW'] || keys['ArrowUp']) {
        player.y -= player.speed;
        player.direction = 'up';
    }
    if (keys['KeyS'] || keys['ArrowDown']) {
        player.y += player.speed;
        player.direction = 'down';
    }
    if (keys['KeyA'] || keys['ArrowLeft']) {
        player.x -= player.speed;
        player.direction = 'left';
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
        player.x += player.speed;
        player.direction = 'right';
    }
    
    // Colisiones con paredes
    for (let zone of currentMap.zones) {
        if (zone.type === 'wall' && checkCollision(player, zone)) {
            player.x = prevX;
            player.y = prevY;
            break;
        }
    }
    
    // Límites del mapa
    player.x = Math.max(20, Math.min(player.x, currentMap.width - player.width - 20));
    player.y = Math.max(20, Math.min(player.y, currentMap.height - player.height - 20));
    
    // Colisiones con enemigos
    for (let enemy of currentMap.enemies) {
        if (checkCollision(player, enemy)) {
            changeMentalFreedom(-10);
            showNotification('⚠️ ¡Un dron te ha detectado! Libertad mental -10', 4000);
            // Empujar al jugador
            player.x = prevX;
            player.y = prevY;
        }
    }
}

// ========== ACTUALIZAR ENEMIGOS ==========
function updateEnemies() {
    for (let enemy of currentMap.enemies) {
        if (enemy.patrolPath && enemy.patrolPath.length > 0) {
            const target = enemy.patrolPath[enemy.currentTarget];
            const dx = target.x - enemy.x;
            const dy = target.y - enemy.y;
            const distance = Math.hypot(dx, dy);
            
            if (distance < 5) {
                enemy.currentTarget = (enemy.currentTarget + 1) % enemy.patrolPath.length;
            } else {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }
        }
    }
}

// ========== DIBUJAR ==========
function draw() {
    // Fondo
    ctx.fillStyle = currentMap.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Zonas
    for (let zone of currentMap.zones) {
        ctx.fillStyle = zone.color;
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        
        // Etiquetas
        if (zone.label) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(zone.x, zone.y, zone.width, 25);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(zone.label, zone.x + zone.width / 2, zone.y + 17);
        }
    }
    
    // NPCs
    for (let npc of currentMap.npcs) {
        ctx.fillStyle = npc.color;
        ctx.fillRect(npc.x, npc.y, npc.width, npc.height);
        
        // Nombre del NPC
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, npc.x + npc.width / 2, npc.y - 5);
    }
    
    // Enemigos (drones)
    for (let enemy of currentMap.enemies) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Ojo del dron
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Rango de detección
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 80, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Jugador
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Dirección del jugador
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    if (player.direction === 'up') {
        ctx.moveTo(player.x + player.width / 2, player.y);
        ctx.lineTo(player.x + player.width / 2 - 5, player.y + 10);
        ctx.lineTo(player.x + player.width / 2 + 5, player.y + 10);
    } else if (player.direction === 'down') {
        ctx.moveTo(player.x + player.width / 2, player.y + player.height);
        ctx.lineTo(player.x + player.width / 2 - 5, player.y + player.height - 10);
        ctx.lineTo(player.x + player.width / 2 + 5, player.y + player.height - 10);
    } else if (player.direction === 'left') {
        ctx.moveTo(player.x, player.y + player.height / 2);
        ctx.lineTo(player.x + 10, player.y + player.height / 2 - 5);
        ctx.lineTo(player.x + 10, player.y + player.height / 2 + 5);
    } else if (player.direction === 'right') {
        ctx.moveTo(player.x + player.width, player.y + player.height / 2);
        ctx.lineTo(player.x + player.width - 10, player.y + player.height / 2 - 5);
        ctx.lineTo(player.x + player.width - 10, player.y + player.height / 2 + 5);
    }
    ctx.closePath();
    ctx.fill();
    
    // ===== INDICADOR DE INTERACCIÓN DISPONIBLE =====
    let canInteract = false;
    let interactionText = '';
    
    // Verificar si hay NPCs cerca
    for (let npc of currentMap.npcs) {
        const distance = Math.hypot(player.x - npc.x, player.y - npc.y);
        if (distance < CONFIG.interactionDistance) {
            canInteract = true;
            interactionText = `Hablar con ${npc.name}`;
            break;
        }
    }
    
    // Verificar si está en zona interactiva
    if (!canInteract) {
        for (let zone of currentMap.zones) {
            if (zone.interactive && checkCollision(player, zone)) {
                canInteract = true;
                interactionText = `Explorar ${zone.label}`;
                break;
            }
        }
    }
    
    // Verificar zonas no interactivas
    if (!canInteract) {
        for (let zone of currentMap.zones) {
            if (!zone.interactive && zone.type !== 'wall' && checkCollision(player, zone)) {
                canInteract = true;
                interactionText = `Observar ${zone.label || zone.type}`;
                break;
            }
        }
    }
    
    // Mostrar indicador si puede interactuar
    if (canInteract && !gameState.dialogueActive) {
        // Fondo del texto
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(player.x + player.width / 2 - 150, player.y + player.height + 15, 300, 35);
        
        // Borde
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(player.x + player.width / 2 - 150, player.y + player.height + 15, 300, 35);
        
        // Texto
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 14px Arial';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 5;
        ctx.textAlign = 'center';
        ctx.fillText('[ESPACIO] ' + interactionText, player.x + player.width / 2, player.y + player.height + 38);
        ctx.shadowBlur = 0;
    }
}

// ========== MINIMAPA ==========
function drawMinimap() {
    const scale = 0.15;
    minimapCtx.clearRect(0, 0, minimap.width, minimap.height);
    
    // Fondo
    minimapCtx.fillStyle = currentMap.background;
    minimapCtx.fillRect(0, 0, minimap.width, minimap.height);
    
    // Zonas
    for (let zone of currentMap.zones) {
        minimapCtx.fillStyle = zone.color;
        minimapCtx.fillRect(zone.x * scale, zone.y * scale, zone.width * scale, zone.height * scale);
    }
    
    // NPCs
    for (let npc of currentMap.npcs) {
        minimapCtx.fillStyle = npc.color;
        minimapCtx.fillRect(npc.x * scale, npc.y * scale, 5, 5);
    }
    
    // Enemigos
    for (let enemy of currentMap.enemies) {
        minimapCtx.fillStyle = '#ff0000';
        minimapCtx.fillRect(enemy.x * scale, enemy.y * scale, 5, 5);
    }
    
    // Jugador
    minimapCtx.fillStyle = player.color;
    minimapCtx.fillRect(player.x * scale, player.y * scale, 6, 6);
}

// ========== COLISIONES ==========
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// ========== INTERACCIONES ==========
function checkInteractions() {
    console.log('Verificando interacciones...'); // Debug
    
    // PRIORIDAD 1: Verificar NPCs cercanos
    for (let npc of currentMap.npcs) {
        const distance = Math.hypot(player.x - npc.x, player.y - npc.y);
        console.log(`Distancia a ${npc.name}: ${distance}`); // Debug
        if (distance < CONFIG.interactionDistance) {
            console.log(`Interactuando con ${npc.name}`); // Debug
            interactWithNPC(npc);
            return; // Salir después de interactuar
        }
    }
    
    // PRIORIDAD 2: Verificar zonas interactivas (con colisión directa)
    for (let zone of currentMap.zones) {
        if (zone.interactive && checkCollision(player, zone)) {
            console.log(`Interactuando con zona interactiva: ${zone.type}`); // Debug
            interactWithZone(zone);
            return; // Salir después de interactuar
        }
    }
    
    // PRIORIDAD 3: Verificar zonas NO interactivas (solo para información)
    for (let zone of currentMap.zones) {
        if (!zone.interactive && checkCollision(player, zone)) {
            console.log(`Dentro de zona: ${zone.type}`); // Debug
            interactWithZone(zone);
            return; // Salir después de interactuar
        }
    }
    
    console.log('No hay nada cerca para interactuar'); // Debug
    showNotification('No hay nada cerca para interactuar', 3000);
}

// ========== INTERACCIÓN CON NPCs ==========
function interactWithNPC(npc) {
    if (dialogues[npc.dialogue]) {
        showDialogue(dialogues[npc.dialogue]);
    }
}

// ========== INTERACCIÓN CON ZONAS ==========
function interactWithZone(zone) {
    console.log('Interactuando con zona:', zone.type); // Debug
    
    switch(zone.type) {
        case 'library':
            showNotification('📚 BIBLIOTECA: Lugar de conocimiento prohibido. Busca a la bibliotecaria.', 6000);
            // Si no ha conocido a la bibliotecaria, mostrar misión
            if (!gameState.flags.metLibrarian && !isMissionActive('findBook')) {
                setTimeout(() => {
                    showMissionOffer(availableMissions.findBook);
                }, 1000);
            }
            break;
            
        case 'bathroom':
            showNotification('🚪 BAÑO DE LA RESISTENCIA: Grafitis cubren las paredes. "LA LECTURA ES LIBERTAD"', 6000);
            // Si no se ha unido a la resistencia
            if (!gameState.flags.joinedResistance && !isMissionActive('joinResistance')) {
                setTimeout(() => {
                    showNotification('Escuchas voces susurrando. Busca a Julia aquí.', 5000);
                }, 2000);
            }
            break;
            
        case 'computer_room':
            if (isMissionActive('hackSystem')) {
                showNotification('💻 Iniciando hackeo del SVE...', 3000);
                setTimeout(() => {
                    completeMission('hackSystem');
                    playCinematic('computer_room.mp4');
                }, 1500);
            } else if (gameState.flags.hackedSystem) {
                showNotification('💻 Sistema ya hackeado. El SVE está debilitado.', 5000);
            } else {
                showNotification('💻 SALA DE COMPUTADORES: El SVE te vigila desde cada pantalla.', 6000);
                changeMentalFreedom(-5);
                setTimeout(() => {
                    showNotification('⚠️ Tu libertad mental disminuye bajo la vigilancia constante.', 5000);
                }, 2000);
            }
            break;
            
        case 'classroom':
            showNotification('🎓 SALÓN DE CLASES: Estudiantes hipnotizados miran sus pantallas.', 6000);
            setTimeout(() => {
                showNotification('Nadie lee. Nadie piensa. Solo obedecen.', 5000);
            }, 2500);
            changeMentalFreedom(-3);
            break;
            
        case 'office':
            showNotification('🏢 OFICINA DE O\'BRIEN: ¿Aliado o enemigo?', 6000);
            // Si no ha conocido a O'Brien, mostrar misión
            if (!gameState.flags.metOBrien && !isMissionActive('learnTruth')) {
                setTimeout(() => {
                    showNotification('O\'Brien está dentro. Tal vez deberías hablar con él.', 5000);
                }, 2000);
            }
            break;
            
        case 'courtyard':
            showNotification('🏫 PATIO CENTRAL: Zona de encuentro. Todos están conectados a sus dispositivos.', 6000);
            setTimeout(() => {
                showNotification('El silencio es ensordecedor. Nadie habla, solo escriben.', 5000);
            }, 2500);
            break;
            
        default:
            showNotification('No hay nada especial aquí.', 4000);
            break;
    }
}

// ========== SISTEMA DE DIÁLOGOS ==========
function showDialogue(dialogue) {
    gameState.dialogueActive = true;
    
    const overlay = document.getElementById('dialogue-overlay');
    const npcName = document.getElementById('npc-name');
    const npcPortrait = document.getElementById('npc-portrait');
    const dialogueText = document.getElementById('dialogue-text');
    const dialogueChoices = document.getElementById('dialogue-choices');
    
    npcName.textContent = dialogue.npc;
    npcPortrait.style.backgroundImage = `url('${dialogue.image}')`;
    dialogueText.textContent = '';
    dialogueChoices.innerHTML = '';
    
    overlay.style.display = 'flex';
    
    // Efecto de escritura
    let i = 0;
    const typingSpeed = 30;
    function typeWriter() {
        if (i < dialogue.text.length) {
            dialogueText.textContent += dialogue.text.charAt(i);
            i++;
            setTimeout(typeWriter, typingSpeed);
        } else {
            // Mostrar opciones después de terminar de escribir
            dialogue.choices.forEach(choice => {
                const button = document.createElement('button');
                button.className = 'dialogue-choice';
                button.textContent = choice.text;
                button.onclick = () => handleDialogueChoice(choice);
                dialogueChoices.appendChild(button);
            });
        }
    }
    typeWriter();
}

function handleDialogueChoice(choice) {
    if (choice.action === 'close') {
        closeDialogue();
    } else if (choice.action === 'offerMission') {
        closeDialogue();
        setTimeout(() => {
            showMissionOffer(availableMissions[choice.mission]);
        }, 500);
    } else if (choice.next) {
        showDialogue(dialogues[choice.next]);
    }
}

function closeDialogue() {
    gameState.dialogueActive = false;
    document.getElementById('dialogue-overlay').style.display = 'none';
}

// ========== SISTEMA DE MISIONES ==========
function showMissionOffer(mission) {
    const overlay = document.getElementById('mission-overlay');
    document.getElementById('mission-title').textContent = mission.name;
    document.getElementById('mission-description').textContent = mission.description;
    
    const objectivesList = document.getElementById('mission-objectives-list');
    objectivesList.innerHTML = '';
    mission.objectives.forEach(obj => {
        const li = document.createElement('li');
        li.textContent = obj;
        objectivesList.appendChild(li);
    });
    
    const rewardsText = document.getElementById('mission-rewards-text');
    rewardsText.innerHTML = `
        <p>🧠 Libertad Mental: +${mission.rewards.mentalFreedom}</p>
        <p>📖 Palabras: ${mission.rewards.words.join(', ')}</p>
    `;
    
    document.getElementById('accept-mission-btn').onclick = () => {
        acceptMission(mission);
        overlay.style.display = 'none';
    };
    
    document.getElementById('decline-mission-btn').onclick = () => {
        overlay.style.display = 'none';
        showNotification('Misión rechazada', 3000);
    };
    
    overlay.style.display = 'flex';
}

function acceptMission(mission) {
    gameState.missions.push(mission);
    updateUI();
    showNotification(`✅ Misión aceptada: ${mission.name}`, 5000);
    
    // Actualizar flags
    if (mission.id === 'findBook') gameState.flags.metLibrarian = true;
    if (mission.id === 'joinResistance') gameState.flags.metJulia = true;
    if (mission.id === 'hackSystem' || mission.id === 'learnTruth') gameState.flags.metOBrien = true;
}

function completeMission(missionId) {
    const mission = gameState.missions.find(m => m.id === missionId);
    if (!mission) return;
    
    // Remover de misiones activas
    gameState.missions = gameState.missions.filter(m => m.id !== missionId);
    gameState.completedMissions.push(mission);
    
    // Dar recompensas
    changeMentalFreedom(mission.rewards.mentalFreedom);
    mission.rewards.words.forEach(word => {
        if (!gameState.unlockedWords.includes(word)) {
            gameState.unlockedWords.push(word);
        }
    });
    
    // Actualizar flags
    if (missionId === 'hackSystem') gameState.flags.hackedSystem = true;
    if (missionId === 'joinResistance') gameState.flags.joinedResistance = true;
    if (missionId === 'findBook') gameState.flags.foundBook = true;
    
    updateUI();
    showNotification(`🎉 ¡Misión completada! ${mission.name}`, 6000);
    
    setTimeout(() => {
        showNotification(`📖 Nuevas palabras desbloqueadas: ${mission.rewards.words.join(', ')}`, 6000);
    }, 2000);
}

function isMissionActive(missionId) {
    return gameState.missions.some(m => m.id === missionId);
}

// ========== PANEL DE MISIONES ==========
function showMissionsPanel() {
    const overlay = document.getElementById('missions-overlay');
    const activeList = document.getElementById('active-missions-list');
    const completedList = document.getElementById('completed-missions-list');
    
    activeList.innerHTML = '';
    completedList.innerHTML = '';
    
    if (gameState.missions.length === 0) {
        activeList.innerHTML = '<li class="empty-state">No tienes misiones activas</li>';
    } else {
        gameState.missions.forEach(mission => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${mission.name}</strong><br>
                ${mission.description}
            `;
            activeList.appendChild(li);
        });
    }
    
    if (gameState.completedMissions.length === 0) {
        completedList.innerHTML = '<li class="empty-state">No has completado misiones aún</li>';
    } else {
        gameState.completedMissions.forEach(mission => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>✅ ${mission.name}</strong><br>
                Completada
            `;
            completedList.appendChild(li);
        });
    }
    
    overlay.style.display = 'flex';
}

function closeMissionsPanel() {
    document.getElementById('missions-overlay').style.display = 'none';
}

// ========== SISTEMA DE LIBERTAD MENTAL ==========
function changeMentalFreedom(amount) {
    gameState.mentalFreedom = Math.max(
        CONFIG.mentalFreedomMin,
        Math.min(CONFIG.mentalFreedomMax, gameState.mentalFreedom + amount)
    );
    updateUI();
    
    // Verificar estado crítico
    if (gameState.mentalFreedom <= 10) {
        showNotification('⚠️ ALERTA: Tu libertad mental está en nivel crítico', 5000);
    } else if (gameState.mentalFreedom >= 90) {
        showNotification('✨ ¡Tu mente está casi completamente libre!', 5000);
    }
}

// ========== ACTUALIZAR UI ==========
function updateUI() {
    // Libertad mental
    document.getElementById('mental-freedom-value').textContent = gameState.mentalFreedom;
    document.getElementById('mental-freedom-fill').style.width = gameState.mentalFreedom + '%';
    
    // Palabras desbloqueadas
    document.getElementById('words-count').textContent = gameState.unlockedWords.length;
    const wordsList = document.getElementById('words-list');
    wordsList.innerHTML = '';
    if (gameState.unlockedWords.length === 0) {
        wordsList.innerHTML = '<li class="empty-state">No has desbloqueado palabras</li>';
    } else {
        gameState.unlockedWords.forEach(word => {
            const li = document.createElement('li');
            li.textContent = word;
            wordsList.appendChild(li);
        });
    }
    
    // Misión actual
    const currentMissionDiv = document.getElementById('current-mission-name');
    if (gameState.missions.length > 0) {
        currentMissionDiv.textContent = gameState.missions[0].name;
    } else {
        currentMissionDiv.textContent = 'No hay misión activa. Explora y habla con NPCs.';
    }
}

// ========== NOTIFICACIONES ==========
function showNotification(message, duration = 5000) {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(50px)';
        setTimeout(() => {
            if (container.contains(notification)) {
                container.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// ========== CINEMÁTICAS ==========
function playCinematic(videoFile) {
    showNotification(`🎬 Reproduciendo cinemática: ${videoFile}`, 4000);
    // Aquí podrías implementar un reproductor de video
    console.log('Cinemática:', videoFile);
}

// ========== PAUSA ==========
function togglePause() {
    gameState.paused = !gameState.paused;
    const overlay = document.getElementById('pause-overlay');
    overlay.style.display = gameState.paused ? 'flex' : 'none';
}

function resumeGame() {
    gameState.paused = false;
    document.getElementById('pause-overlay').style.display = 'none';
}

function restartGame() {
    location.reload();
}

function exitGame() {
    if (confirm('¿Seguro que quieres salir del juego?')) {
        window.close();
    }
}

// ========== SISTEMA DE GUARDADO ==========
function saveGame() {
    const saveData = {
        player: player,
        gameState: gameState,
        timestamp: Date.now()
    };
    localStorage.setItem('2084_save', JSON.stringify(saveData));
    showNotification('💾 Juego guardado exitosamente', 4000);
}

function loadGame() {
    const saveData = localStorage.getItem('2084_save');
    if (saveData) {
        const data = JSON.parse(saveData);
        Object.assign(player, data.player);
        Object.assign(gameState, data.gameState);
        updateUI();
        showNotification('📂 Juego cargado exitosamente', 4000);
        resumeGame();
    } else {
        showNotification('❌ No hay partida guardada', 4000);
    }
}

// ========== EVENT LISTENERS ==========
document.getElementById('close-dialogue-btn').addEventListener('click', closeDialogue);
document.getElementById('close-missions-btn').addEventListener('click', closeMissionsPanel);
document.getElementById('show-missions-btn').addEventListener('click', showMissionsPanel);
document.getElementById('resume-btn').addEventListener('click', resumeGame);
document.getElementById('save-btn').addEventListener('click', saveGame);
document.getElementById('load-btn').addEventListener('click', loadGame);
document.getElementById('restart-btn').addEventListener('click', restartGame);
document.getElementById('exit-btn').addEventListener('click', exitGame);

// ========== INICIAR JUEGO ==========
window.addEventListener('load', init);