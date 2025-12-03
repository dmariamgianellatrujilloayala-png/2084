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
let animationFrame = 0;

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
// META DEL JUEGO
// ===========================

const WORDS_TO_WIN = 10;
let gameEnded = false;

// ===========================
// SISTEMA DE SPRITES
// ===========================

class Sprite {
    constructor(x, y, width, height, color, type = 'player') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.type = type;
        this.frame = 0;
        this.animationSpeed = 0.15;
        this.direction = 'down';
    }

    draw(ctx) {
        if (this.type === 'player') {
            this.drawPlayer(ctx);
        } else if (this.type === 'npc') {
            this.drawNPC(ctx);
        } else if (this.type === 'drone') {
            this.drawDrone(ctx);
        }
    }

    drawPlayer(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 8, this.y + 5, 14, 20);
        
        ctx.fillStyle = '#ffcc99';
        ctx.beginPath();
        ctx.arc(this.x + 15, this.y + 8, 6, 0, Math.PI * 2);
        ctx.fill();
        
        const legOffset = Math.sin(this.frame) * 3;
        ctx.fillStyle = '#1a4d7a';
        ctx.fillRect(this.x + 9, this.y + 25, 4, 5 + legOffset);
        ctx.fillRect(this.x + 17, this.y + 25, 4, 5 - legOffset);
        
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 5, this.y + 10, 3, 8);
        ctx.fillRect(this.x + 22, this.y + 10, 3, 8);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x + 8, this.y + 5, 14, 20);
    }

    drawNPC(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 6, this.y + 4, 13, 17);
        
        ctx.fillStyle = '#ffcc99';
        ctx.beginPath();
        ctx.arc(this.x + 12.5, this.y + 7, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x + 8, this.y + 21, 3, 4);
        ctx.fillRect(this.x + 14, this.y + 21, 3, 4);
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x + 6, this.y + 4, 13, 17);
    }

    drawDrone(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y);
        ctx.lineTo(this.x + 20, this.y + 10);
        ctx.lineTo(this.x + 10, this.y + 20);
        ctx.lineTo(this.x, this.y + 10);
        ctx.closePath();
        ctx.fill();
        
        const eyeSize = 3 + Math.sin(this.frame * 2) * 1;
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 10, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        const rotation = this.frame * 0.5;
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i + rotation;
            const x1 = this.x + 10 + Math.cos(angle) * 8;
            const y1 = this.y + 10 + Math.sin(angle) * 8;
            const x2 = this.x + 10 + Math.cos(angle) * 12;
            const y2 = this.y + 10 + Math.sin(angle) * 12;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        ctx.strokeStyle = 'rgba(255, 71, 87, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 10, 40, 0, Math.PI * 2);
        ctx.stroke();
    }

    updateAnimation(isMoving = false) {
        if (isMoving) {
            this.frame += this.animationSpeed;
        } else {
            this.frame = 0;
        }
    }
}

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
    unlockedWords: [],
    sprite: null,
    isMoving: false
};

player.sprite = new Sprite(player.x, player.y, player.width, player.height, player.color, 'player');

// ===========================
// ZONAS DEL MAPA CON INTERACCIONES SECUENCIALES
// ===========================

const zones = [
    { 
        name: 'Salón de Clases', 
        x: 50, 
        y: 50, 
        width: 200, 
        height: 150, 
        color: '#1a4d7a', 
        interactive: true,
        interactionCount: 0,
        interactions: [
            {
                text: 'Todos los estudiantes están mirando sus pantallas. Nadie levanta la vista.',
                video: 'classroom_phones.jpg',
                reward: null
            },
            {
                text: 'Observas las pantallas más de cerca. Todas muestran el mismo contenido: "El SVE cuida de ti".',
                video: null,
                reward: { word: 'CONFORMIDAD', freedom: -5 }
            },
            {
                text: 'Encuentras un libro escondido debajo de un pupitre. Tiene la palabra "PENSAR" escrita.',
                video: null,
                reward: { word: 'PENSAR', freedom: 10 }
            }
        ]
    },
    { 
        name: 'Sala de Computadoras', 
        x: 300, 
        y: 50, 
        width: 200, 
        height: 150, 
        color: '#4a1a7a', 
        interactive: true,
        interactionCount: 0,
        interactions: [
            {
                text: 'Las computadoras están conectadas al SVE. Cada tecla que presionan es monitoreada.',
                video: 'computer_room2.mp4',
                reward: null
            },
            {
                text: 'Intentas acceder a sitios bloqueados. El sistema te advierte: "Contenido no autorizado".',
                video: null,
                reward: { word: 'CENSURA', freedom: -5 }
            },
            {
                text: 'Encuentras un código oculto en el sistema. Desbloqueas acceso a archivos prohibidos.',
                video: 'computer_room.mp4',
                reward: { word: 'HACKEAR', freedom: 15 }
            }
        ]
    },
    { 
        name: 'Patio', 
        x: 550, 
        y: 50, 
        width: 200, 
        height: 150, 
        color: '#1a7a4d', 
        interactive: true,
        interactionCount: 0,
        interactions: [
            {
                text: 'El patio está lleno de estudiantes, pero nadie habla. Solo miran sus teléfonos.',
                video: 'courtyard_phones.jpg',
                reward: null
            },
            {
                text: 'Intentas hablar con alguien, pero te ignoran. Están absortos en sus pantallas.',
                video: null,
                reward: { word: 'AISLAMIENTO', freedom: -5 }
            },
            {
                text: 'Ves a un estudiante leyendo un libro en secreto. Te guiña el ojo y te pasa una nota: "RESISTIR".',
                video: null,
                reward: { word: 'RESISTIR', freedom: 15 }
            }
        ]
    },
    { 
        name: 'Baño (Resistencia)', 
        x: 50, 
        y: 250, 
        width: 200, 
        height: 150, 
        color: '#7a4d1a', 
        interactive: true,
        interactionCount: 0,
        interactions: [
            {
                text: 'Las paredes están llenas de grafitis. Mensajes de resistencia contra el SVE.',
                video: 'bathroom_resistance.mp4',
                reward: null
            },
            {
                text: 'Lees los mensajes: "No olvides quién eres", "Las palabras son poder", "Lee y serás libre".',
                video: 'bathroom_resistance.jpg',
                reward: { word: 'REBELIÓN', freedom: 10 }
            },
            {
                text: 'Encuentras un mapa escondido detrás de un azulejo. Marca ubicaciones de libros prohibidos.',
                video: null,
                reward: { word: 'CONSPIRAR', freedom: 15 }
            }
        ]
    },
    { 
        name: 'Biblioteca Antigua', 
        x: 300, 
        y: 250, 
        width: 200, 
        height: 150, 
        color: '#7a1a4d', 
        interactive: true,
        interactionCount: 0,
        interactions: [
            {
                text: 'La biblioteca está abandonada. El polvo cubre los libros olvidados.',
                video: 'library_old.mp4',
                reward: null
            },
            {
                text: 'Abres un libro al azar. Las páginas hablan de libertad, democracia y pensamiento crítico.',
                video: 'old_library.jpg',
                reward: { word: 'LIBERTAD', freedom: 20 }
            },
            {
                text: 'Encuentras una sección secreta con libros prohibidos: Orwell, Huxley, Bradbury.',
                video: null,
                reward: { word: 'CONOCIMIENTO', freedom: 25 }
            }
        ]
    },
    { 
        name: 'Sala de Control SVE', 
        x: 550, 
        y: 250, 
        width: 200, 
        height: 300, 
        color: '#7a1a1a', 
        interactive: true,
        interactionCount: 0,
        interactions: [
            {
                text: 'Pantallas gigantes muestran cada rincón del colegio. El SVE lo ve todo.',
                video: 'Sistema_SVA2.mp4',
                reward: null
            },
            {
                text: 'Accedes a los archivos del sistema. Descubres que el SVE manipula lo que ven los estudiantes.',
                video: 'control_room2.mp4',
                reward: { word: 'MANIPULACIÓN', freedom: 15 }
            },
            {
                text: 'Hackeas el sistema y desactivas temporalmente la vigilancia. ¡Libertad momentánea!',
                video: 'Sistema_SVA.mp4',
                reward: { word: 'VERDAD', freedom: 30 }
            }
        ]
    },
    { 
        name: 'Exterior del Colegio', 
        x: 50, 
        y: 450, 
        width: 450, 
        height: 100, 
        color: '#2a4a2a', 
        interactive: true,
        interactionCount: 0,
        interactions: [
            {
                text: 'Desde afuera, el colegio parece normal. Pero sabes la verdad.',
                video: 'exterior_school.mp4',
                reward: null
            },
            {
                text: 'Ves cámaras de vigilancia en cada esquina. El control es total.',
                video: 'exterior_school.jpg',
                reward: { word: 'VIGILANCIA', freedom: -5 }
            },
            {
                text: 'Decides que es hora de actuar. La resistencia comienza aquí.',
                video: null,
                reward: { word: 'ACCIÓN', freedom: 20 }
            }
        ]
    }
];

// ===========================
// NPCs CON DIÁLOGOS SECUENCIALES
// ===========================

const npcs = [
    { 
        name: 'Julia', 
        x: 150, 
        y: 120, 
        width: 25, 
        height: 25, 
        color: '#ff6b9d',
        sprite: null,
        dialogueStage: 0,
        dialogues: [
            {
                text: 'Winston... ¿tú también sientes que algo no está bien aquí?',
                choices: [
                    { text: 'Sí, el SVE nos controla', next: 1 },
                    { text: 'No sé de qué hablas', next: -1 }
                ]
            },
            {
                text: 'Sabía que no estaba sola. He encontrado libros prohibidos en la biblioteca antigua. ¿Me ayudas a recuperarlos?',
                choices: [
                    { text: 'Cuenta conmigo', next: 2, mission: 'mission1' },
                    { text: 'Es muy peligroso', next: -1 }
                ]
            },
            {
                text: '¡Gracias! Juntos podemos despertar a los demás. La lectura es nuestra arma.',
                choices: [
                    { text: 'Vamos a hacerlo', next: 3 }
                ]
            },
            {
                text: '¿Ya encontraste las palabras en la biblioteca? Necesitamos más personas que piensen por sí mismas.',
                choices: [
                    { text: 'Sigo buscando', next: -1 }
                ]
            }
        ]
    },
    { 
        name: 'O\'Brien', 
        x: 400, 
        y: 120, 
        width: 25, 
        height: 25, 
        color: '#ff4757',
        sprite: null,
        dialogueStage: 0,
        dialogues: [
            {
                text: 'Veo que eres curioso. Eso es... peligroso en estos tiempos.',
                choices: [
                    { text: '¿Quién eres realmente?', next: 1 },
                    { text: 'Solo paso por aquí', next: -1 }
                ]
            },
            {
                text: 'Trabajo para el SVE, pero... digamos que tengo mis dudas. Hay formas de engañar al sistema.',
                choices: [
                    { text: '¿Puedes enseñarme?', next: 2 },
                    { text: 'No confío en ti', next: -1 }
                ]
            },
            {
                text: 'Necesito que accedas a la Sala de Control. Obtén información sobre cómo el SVE manipula a los estudiantes.',
                choices: [
                    { text: 'Lo haré', next: 3, mission: 'mission2' },
                    { text: 'Es una trampa', next: -1 }
                ]
            },
            {
                text: '¿Conseguiste la información? Cada dato que obtengas nos acerca más a la verdad.',
                choices: [
                    { text: 'Estoy en ello', next: -1 }
                ]
            }
        ]
    },
    { 
        name: 'Miembro de la Resistencia', 
        x: 150, 
        y: 320, 
        width: 25, 
        height: 25, 
        color: '#2ed573',
        sprite: null,
        dialogueStage: 0,
        dialogues: [
            {
                text: 'Psst... ¿Eres de los nuestros? ¿O trabajas para el SVE?',
                choices: [
                    { text: 'Quiero unirme a la resistencia', next: 1 },
                    { text: '¿Qué resistencia?', next: -1 }
                ]
            },
            {
                text: 'Bien. Nos reunimos aquí en secreto. Compartimos libros, ideas, palabras prohibidas. ¿Cuántas palabras has desbloqueado?',
                choices: [
                    { text: `Llevo ${player.unlockedWords.length} palabras`, next: 2 }
                ]
            },
            {
                text: `${player.unlockedWords.length >= 5 ? '¡Impresionante! Estás listo para la revolución.' : 'Sigue buscando. Necesitas al menos 10 palabras para cambiar las cosas.'}`,
                choices: [
                    { text: 'Seguiré luchando', next: 3 }
                ]
            },
            {
                text: 'Recuerda: cada palabra que desbloqueas es un golpe contra el sistema. No te rindas.',
                choices: [
                    { text: 'Nunca', next: -1 }
                ]
            }
        ]
    }
];

npcs.forEach(npc => {
    npc.sprite = new Sprite(npc.x, npc.y, npc.width, npc.height, npc.color, 'npc');
});

// ===========================
// SISTEMA DE MISIONES MEJORADO
// ===========================

const missions = {
    mission1: {
        id: 'mission1',
        title: 'Palabras Prohibidas',
        description: 'Julia te ha pedido que encuentres las palabras prohibidas escondidas en la Biblioteca Antigua.',
        objectives: [
            { text: 'Habla con Julia', completed: false },
            { text: 'Ve a la Biblioteca Antigua', completed: false },
            { text: 'Interactúa 3 veces con la biblioteca', completed: false },
            { text: 'Regresa con Julia', completed: false }
        ],
        rewards: 'Palabra: LIBERTAD, +20 Libertad Mental',
        active: false,
        completed: false,
        progress: 0
    },
    mission2: {
        id: 'mission2',
        title: 'Infiltración al SVE',
        description: 'O\'Brien necesita que accedas a la Sala de Control SVE para obtener información crítica.',
        objectives: [
            { text: 'Habla con O\'Brien', completed: false },
            { text: 'Llega a la Sala de Control SVE', completed: false },
            { text: 'Hackea el sistema (3 interacciones)', completed: false },
            { text: 'Regresa con O\'Brien', completed: false }
        ],
        rewards: 'Palabra: VERDAD, +30 Libertad Mental',
        active: false,
        completed: false,
        progress: 0
    },
    mission3: {
        id: 'mission3',
        title: 'Despertar a los Estudiantes',
        description: 'La resistencia necesita que desbloquees 10 palabras para iniciar la revolución.',
        objectives: [
            { text: 'Desbloquea 10 palabras', completed: false },
            { text: 'Habla con el Miembro de la Resistencia', completed: false }
        ],
        rewards: 'Final del juego desbloqueado',
        active: true,
        completed: false,
        progress: 0
    }
};

let activeMissions = [missions.mission3];
let completedMissions = [];

// ===========================
// ENEMIGOS/DRONES
// ===========================

const drones = [
    { x: 350, y: 100, width: 20, height: 20, speed: 1.5, direction: 1, patrolStart: 310, patrolEnd: 490, axis: 'x', sprite: null },
    { x: 650, y: 80, width: 20, height: 20, speed: 1.2, direction: 1, patrolStart: 60, patrolEnd: 190, axis: 'y', sprite: null },
    { x: 320, y: 320, width: 20, height: 20, speed: 1, direction: 1, patrolStart: 310, patrolEnd: 490, axis: 'x', sprite: null },
    { x: 650, y: 280, width: 20, height: 20, speed: 1.8, direction: 1, patrolStart: 260, patrolEnd: 540, axis: 'y', sprite: null },
    { x: 100, y: 480, width: 20, height: 20, speed: 1.3, direction: 1, patrolStart: 60, patrolEnd: 480, axis: 'x', sprite: null },
    { x: 150, y: 80, width: 20, height: 20, speed: 1.4, direction: 1, patrolStart: 60, patrolEnd: 190, axis: 'y', sprite: null }
];

drones.forEach(drone => {
    drone.sprite = new Sprite(drone.x, drone.y, drone.width, drone.height, '#ff4757', 'drone');
});

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

    setTimeout(() => {
        showCinematic({
            title: '2084 - Introducción',
            text: 'En un colegio rural colombiano, el Sistema de Vigilancia Escolar (SVE) controla cada pantalla, cada palabra y cada pensamiento.\n\nPero algunos estudiantes han descubierto que la lectura puede romper el control.\n\n🎯 META: Desbloquea 10 palabras para ganar.',
            video: 'exterior_school.mp4',
            autoplay: true,
            loop: false
        });
    }, 500);
}

// ===========================
// CONTROLES
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

    document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    function bindDirectionalButton(button, keyName) {
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            keys[keyName] = true;
            button.style.transform = 'scale(0.9)';
        }, { passive: false });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            keys[keyName] = false;
            button.style.transform = 'scale(1)';
        }, { passive: false });

        button.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            e.stopPropagation();
            keys[keyName] = false;
            button.style.transform = 'scale(1)';
        }, { passive: false });

        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            keys[keyName] = true;
            button.style.transform = 'scale(0.9)';
        });

        button.addEventListener('mouseup', (e) => {
            e.preventDefault();
            keys[keyName] = false;
            button.style.transform = 'scale(1)';
        });

        button.addEventListener('mouseleave', (e) => {
            keys[keyName] = false;
            button.style.transform = 'scale(1)';
        });
    }

    bindDirectionalButton(btnUp, 'up');
    bindDirectionalButton(btnDown, 'down');
    bindDirectionalButton(btnLeft, 'left');
    bindDirectionalButton(btnRight, 'right');

    btnInteract.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        btnInteract.style.transform = 'scale(0.9)';
        keys.interact = true;
        checkInteractions();
        setTimeout(() => { 
            keys.interact = false;
            btnInteract.style.transform = 'scale(1)';
        }, 200);
    }, { passive: false });

    btnInteract.addEventListener('click', (e) => {
        e.preventDefault();
        keys.interact = true;
        checkInteractions();
        setTimeout(() => { keys.interact = false; }, 200);
    });

    btnMissions.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        btnMissions.style.transform = 'scale(0.9)';
        toggleMissionsOverlay();
        setTimeout(() => { btnMissions.style.transform = 'scale(1)'; }, 200);
    }, { passive: false });

    btnMissions.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMissionsOverlay();
    });

    btnPause.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        btnPause.style.transform = 'scale(0.9)';
        togglePause();
        setTimeout(() => { btnPause.style.transform = 'scale(1)'; }, 200);
    }, { passive: false });

    btnPause.addEventListener('click', (e) => {
        e.preventDefault();
        togglePause();
    });

    console.log('✅ Controles táctiles configurados correctamente');
}

function setupUI() {
    document.getElementById('show-missions-btn').addEventListener('click', toggleMissionsOverlay);
    document.getElementById('close-dialogue-btn').addEventListener('click', closeDialogue);
    document.getElementById('close-missions-btn').addEventListener('click', toggleMissionsOverlay);
    document.getElementById('resume-btn').addEventListener('click', togglePause);
    document.getElementById('save-btn').addEventListener('click', saveGame);
    document.getElementById('load-btn').addEventListener('click', loadGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('exit-btn').addEventListener('click', exitToMenu);
    document.getElementById('close-cinematic-btn').addEventListener('click', closeCinematic);

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
        animationFrame++;
    }

    requestAnimationFrame(gameLoop);
}

function update() {
    updatePlayer();
    updateDrones();
    checkInteractions();
    checkWinCondition();
}

function updatePlayer() {
    let moving = false;
    const oldX = player.x;
    const oldY = player.y;

    if (keys.up) {
        player.y -= player.speed;
        player.sprite.direction = 'up';
        moving = true;
    }
    if (keys.down) {
        player.y += player.speed;
        player.sprite.direction = 'down';
        moving = true;
    }
    if (keys.left) {
        player.x -= player.speed;
        player.sprite.direction = 'left';
        moving = true;
    }
    if (keys.right) {
        player.x += player.speed;
        player.sprite.direction = 'right';
        moving = true;
    }

    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    player.sprite.x = player.x;
    player.sprite.y = player.y;
    player.sprite.updateAnimation(moving);
    player.isMoving = moving;
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

        drone.sprite.x = drone.x;
        drone.sprite.y = drone.y;
        drone.sprite.frame = animationFrame * 0.1;

        if (checkCollision(player, drone)) {
            player.mentalFreedom = Math.max(0, player.mentalFreedom - 5);
            showNotification('⚠️ ¡Detectado por un dron! -5 Libertad Mental');
            updateUI();
            
            if (drone.axis === 'x') {
                player.y += drone.direction * 20;
            } else {
                player.x += drone.direction * 20;
            }
        }
    });
}

// ===========================
// INTERACCIONES MEJORADAS
// ===========================

function checkInteractions() {
    if (!keys.interact) return;

    console.log('🔍 Verificando interacciones...');

    for (let npc of npcs) {
        if (isNear(player, npc, 50)) {
            console.log(`💬 Interactuando con ${npc.name}`);
            keys.interact = false;
            showDialogue(npc);
            return;
        }
    }

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
    if (!zone.interactive || !zone.interactions) return;

    const interaction = zone.interactions[zone.interactionCount];
    
    if (!interaction) {
        showNotification(`Ya has explorado todo en ${zone.name}`);
        return;
    }

    console.log(`🎯 Interacción ${zone.interactionCount + 1}/${zone.interactions.length} en ${zone.name}`);

    if (interaction.video) {
        showCinematic({
            title: zone.name,
            text: interaction.text,
            video: interaction.video.endsWith('.mp4') ? interaction.video : null,
            image: interaction.video.endsWith('.jpg') ? interaction.video : null,
            autoplay: true,
            loop: false
        });
    } else {
        showNotification(`📍 ${zone.name}: ${interaction.text}`);
    }

    if (interaction.reward) {
        if (interaction.reward.word) {
            unlockWord(interaction.reward.word);
            showNotification(`📖 Palabra desbloqueada: ${interaction.reward.word}`);
        }
        if (interaction.reward.freedom) {
            player.mentalFreedom = Math.max(0, Math.min(100, player.mentalFreedom + interaction.reward.freedom));
            if (interaction.reward.freedom > 0) {
                showNotification(`✨ +${interaction.reward.freedom} Libertad Mental`);
            } else {
                showNotification(`⚠️ ${interaction.reward.freedom} Libertad Mental`);
            }
        }
    }

    zone.interactionCount++;
    updateUI();
    checkMissionProgress(zone);
}

function checkMissionProgress(zone) {
    if (zone.name === 'Biblioteca Antigua' && missions.mission1.active) {
        if (zone.interactionCount >= 3 && !missions.mission1.objectives[2].completed) {
            missions.mission1.objectives[2].completed = true;
            showNotification('✅ Objetivo completado: Interactúa 3 veces con la biblioteca');
        }
    }

    if (zone.name === 'Sala de Control SVE' && missions.mission2.active) {
        if (zone.interactionCount >= 3 && !missions.mission2.objectives[2].completed) {
            missions.mission2.objectives[2].completed = true;
            showNotification('✅ Objetivo completado: Hackea el sistema');
        }
    }
}

// ===========================
// SISTEMA DE DIÁLOGO MEJORADO
// ===========================

let currentNPC = null;
let currentDialogueChoices = [];

function showDialogue(npc) {
    currentNPC = npc;

    const dialogue = npc.dialogues[npc.dialogueStage];
    
    if (!dialogue) {
        showNotification(`${npc.name} no tiene más que decir por ahora.`);
        return;
    }

    if (npc.name === 'Julia') {
        showCinematic({
            title: 'Julia',
            text: 'Julia ha empezado a cuestionar lo que le muestran las pantallas del SVE.',
            video: 'winston_girl2.mp4',
            autoplay: true,
            loop: false
        });
    } else if (npc.name === "O'Brien") {
        showCinematic({
            title: 'O\'Brien',
            text: 'O\'Brien parece formar parte del sistema... pero sus palabras insinúan algo más.',
            video: 'obrien_teacher2.mp4',
            autoplay: true,
            loop: false
        });
    } else if (npc.name === 'Miembro de la Resistencia') {
        showCinematic({
            title: 'Resistencia',
            text: 'En los lugares más inesperados, la resistencia deja señales.',
            image: 'resistance_signs.jpg',
            autoplay: false
        });
    }
    
    document.getElementById('npc-name').textContent = npc.name;
    document.getElementById('dialogue-text').textContent = dialogue.text;
    
    const choicesContainer = document.getElementById('dialogue-choices');
    choicesContainer.innerHTML = '';

    dialogue.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.textContent = choice.text;
        btn.addEventListener('click', () => {
            handleDialogueChoice(npc, choice);
        });
        choicesContainer.appendChild(btn);
    });

    document.getElementById('dialogue-overlay').classList.add('active');
}

function handleDialogueChoice(npc, choice) {
    console.log(`💬 Elección: ${choice.text}`);

    if (choice.mission) {
        const mission = missions[choice.mission];
        if (mission && !mission.active) {
            mission.active = true;
            mission.objectives[0].completed = true;
            activeMissions.push(mission);
            showNotification(`✅ Misión aceptada: ${mission.title}`);
        }
    }

    if (choice.next >= 0) {
        npc.dialogueStage = choice.next;
    }

    closeDialogue();
    updateUI();
}

function closeDialogue() {
    document.getElementById('dialogue-overlay').classList.remove('active');
    currentNPC = null;
}

// ===========================
// SISTEMA DE MISIONES
// ===========================

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
            let objectivesHTML = '<ul>';
            mission.objectives.forEach(obj => {
                const status = obj.completed ? '✅' : '⬜';
                objectivesHTML += `<li>${status} ${obj.text}</li>`;
            });
            objectivesHTML += '</ul>';
            
            li.innerHTML = `
                <strong>${mission.title}</strong><br>
                <small>${mission.description}</small>
                ${objectivesHTML}
                <small><strong>Recompensa:</strong> ${mission.rewards}</small>
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
// CONDICIÓN DE VICTORIA
// ===========================

function checkWinCondition() {
    if (gameEnded) return;

    if (player.unlockedWords.length >= WORDS_TO_WIN) {
        gameEnded = true;
        missions.mission3.completed = true;
        missions.mission3.objectives[0].completed = true;
        
        showCinematic({
            title: '¡VICTORIA!',
            text: `Has desbloqueado ${player.unlockedWords.length} palabras.\n\nLa resistencia ha comenzado. Los estudiantes empiezan a despertar.\n\nEl SVE ya no puede controlar las mentes que han aprendido a pensar por sí mismas.\n\n🎉 ¡HAS GANADO!`,
            video: 'resistance_group.jpg',
            autoplay: false
        });

        showNotification('🎉 ¡HAS COMPLETADO EL JUEGO!');
        setTimeout(() => {
            if (confirm('¿Quieres jugar de nuevo?')) {
                restartGame();
            }
        }, 5000);
    }
}

// ===========================
// PAUSA Y GUARDADO
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

function saveGame() {
    const saveData = {
        player: player,
        missions: missions,
        zones: zones.map(z => ({ name: z.name, interactionCount: z.interactionCount })),
        npcs: npcs.map(n => ({ name: n.name, dialogueStage: n.dialogueStage })),
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
        
        data.zones.forEach(savedZone => {
            const zone = zones.find(z => z.name === savedZone.name);
            if (zone) zone.interactionCount = savedZone.interactionCount;
        });
        
        data.npcs.forEach(savedNPC => {
            const npc = npcs.find(n => n.name === savedNPC.name);
            if (npc) npc.dialogueStage = savedNPC.dialogueStage;
        });
        
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
// CINEMÁTICAS
// ===========================

let wasPausedByCinematic = false;

function showCinematic({ 
    title = '2084', 
    text = '', 
    image = null, 
    video = null, 
    autoplay = true, 
    loop = false 
}) {
    const overlay = document.getElementById('cinematic-overlay');
    const titleEl = document.getElementById('cinematic-title');
    const textEl = document.getElementById('cinematic-text');
    const imgEl = document.getElementById('cinematic-image');
    const videoEl = document.getElementById('cinematic-video');

    if (!isPaused) {
        wasPausedByCinematic = true;
        isPaused = true;
    } else {
        wasPausedByCinematic = false;
    }

    titleEl.textContent = title;
    textEl.textContent = text || '';

    imgEl.style.display = 'none';
    videoEl.style.display = 'none';
    videoEl.pause();
    videoEl.src = '';

    if (video) {
        videoEl.src = video;
        videoEl.style.display = 'block';
        videoEl.loop = loop;
        if (autoplay) {
            videoEl.play().catch(err => console.warn('No se pudo reproducir el video:', err));
        }
    } else if (image) {
        imgEl.src = image;
        imgEl.style.display = 'block';
    }

    overlay.classList.add('active');
    console.log(`🎬 Cinemática: ${title}`);
}

function closeCinematic() {
    const overlay = document.getElementById('cinematic-overlay');
    const videoEl = document.getElementById('cinematic-video');
    
    overlay.classList.remove('active');
    videoEl.pause();
    videoEl.src = '';

    if (wasPausedByCinematic) {
        isPaused = false;
        wasPausedByCinematic = false;
    }

    console.log('🎬 Cinemática cerrada');
}

// ===========================
// UTILIDADES
// ===========================

function unlockWord(word) {
    if (!player.unlockedWords.includes(word)) {
        player.unlockedWords.push(word);
        console.log(`📖 Palabra desbloqueada: ${word} (${player.unlockedWords.length}/${WORDS_TO_WIN})`);
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
    document.getElementById('mental-freedom-value').textContent = player.mentalFreedom;
    document.getElementById('mental-freedom-fill').style.width = player.mentalFreedom + '%';
    
    document.getElementById('words-count').textContent = `${player.unlockedWords.length}/${WORDS_TO_WIN}`;
    
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
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
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
        
        if (zone.interactions && zone.interactionCount < zone.interactions.length) {
            ctx.fillStyle = '#ffa502';
            ctx.font = 'bold 10px Rajdhani';
            ctx.fillText(`[${zone.interactionCount}/${zone.interactions.length}]`, zone.x + zone.width / 2, zone.y + zone.height / 2 + 15);
        }
    });
    
    npcs.forEach(npc => {
        npc.sprite.draw(ctx);
        
        ctx.fillStyle = '#fff';
        ctx.font = '10px Rajdhani';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, npc.x + npc.width / 2, npc.y - 5);
        
        if (npc.dialogues && npc.dialogueStage < npc.dialogues.length) {
            ctx.fillStyle = '#ffa502';
            ctx.font = 'bold 16px Rajdhani';
            ctx.fillText('!', npc.x + npc.width / 2, npc.y - 15);
        }
    });
    
    drones.forEach(drone => {
        drone.sprite.draw(ctx);
    });
    
    player.sprite.draw(ctx);
    
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
    
    zones.forEach(zone => {
        minimapCtx.fillStyle = zone.color;
        minimapCtx.fillRect(zone.x * scale, zone.y * scale, zone.width * scale, zone.height * scale);
    });
    
    minimapCtx.fillStyle = '#00ffcc';
    minimapCtx.fillRect(player.x * scale, player.y * scale, 4, 4);
    
    npcs.forEach(npc => {
        minimapCtx.fillStyle = npc.color;
        minimapCtx.fillRect(npc.x * scale, npc.y * scale, 3, 3);
    });
    
    drones.forEach(drone => {
        minimapCtx.fillStyle = '#ff4757';
        minimapCtx.fillRect(drone.x * scale, drone.y * scale, 2, 2);
    });
}

console.log('📜 game.js cargado correctamente');