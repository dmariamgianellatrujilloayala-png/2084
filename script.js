const gameData = {
    scenes: {
        start: {
            text: "Bienvenido a 2084. En la Colombia rural, el colegio 'La Esperanza Conectiva' está rodeado de desierto y drones. El 'Gran Algoritmo' controla todo. Eres Winston, un estudiante que siente que algo no está bien.",
            image: "images/exterior_school.mp4",
            choices: [
                { text: "Entrar al salón de clase", nextScene: "classroom_control" },
                { text: "Quedarte mirando el cielo y los drones", nextScene: "courtyard_drones" }
            ]
        },
        classroom_control: {
            text: "En el salón, todos miran sus celulares. El profesor O'Brien revisa desde su tableta quién obedece al Programa de Atención Total.",
            image: "images/classroom_phones.jpg",
            choices: [
                { text: "Simular que sigues las instrucciones", nextScene: "follow_program" },
                { text: "Desviar la mirada y observar a tus compañeros", nextScene: "notice_courtyard" }
            ]
        },
        follow_program: {
            text: "Abres la app obligatoria. La pantalla repite: 'OBEDECE. NO LEAS. DESLIZA.' Sientes que tu mente se adormece.",
            image: "images/control_room.mp4",
            effect: { mentalFreedom: -10 },
            choices: [
                { text: "Resistir y cerrar la app en secreto", nextScene: "secret_resist" },
                { text: "Seguir deslizando sin pensar", nextScene: "almost_lost" }
            ]
        },
        notice_courtyard: {
            text: "Miras por la ventana: en el patio, todos los estudiantes están sentados mirando sus teléfonos. El balón en el centro parece pedir ayuda.",
            image: "images/courtyard_phones.jpg",
            choices: [
                { text: "Recordar cómo era jugar sin pantallas", nextScene: "memory_play" },
                { text: "Volver a centrarte en la clase", nextScene: "follow_program" }
            ]
        },
        secret_resist: {
            text: "Cierras la app y finges que tu celular está bloqueado. Por un momento, el murmullo del Gran Algoritmo se silencia en tu cabeza.",
            image: "images/winston_student.jpg",
            effect: { mentalFreedom: +15, unlockedWords: ["silencio", "duda"] },
            choices: [
                { text: "Buscar a alguien más que parezca inquieto", nextScene: "find_julia" }
            ]
        },
        almost_lost: {
            text: "Pasas varios minutos deslizando sin pensar. Sientes que tus ideas se vuelven más lentas. El Gran Algoritmo gana terreno en tu mente.",
            image: "images/students_matrix_room.jpg",
            effect: { mentalFreedom: -20 },
            choices: [
                { text: "Despertar y dejar de deslizar", nextScene: "secret_resist" }
            ]
        },
        memory_play: {
            text: "Imaginas el patio lleno de risas, juegos y libros. Una palabra resuena en tu mente: 'libertad'.",
            image: "images/courtyard_phones.jpg",
            effect: { mentalFreedom: +10, unlockedWords: ["libertad"] },
            choices: [
                { text: "Decidir que no quieres vivir hipnotizado", nextScene: "secret_resist" }
            ]
        },
        courtyard_drones: {
            text: "Los drones patrullan sobre el colegio. En las pantallas de los muros, aparece la figura del Gran Algoritmo: el Sistema SVA.",
            image: "images/Sistema_SVA.mp4",
            effect: { unlockedWords: ["algoritmo"] },
            choices: [
                { text: "Entrar al colegio antes de llamar la atención", nextScene: "classroom_control" }
            ]
        },
        find_julia: {
            text: "Notas a una chica que no mira su celular. Está seria, con los brazos cruzados, como si estuviera peleando por dentro. Es Julia.",
            image: "images/julia_student.jpg",
            choices: [
                { text: "Acercarte a hablar con Julia", nextScene: "talk_to_julia" },
                { text: "Solo observarla por ahora", nextScene: "observe_julia" }
            ]
        },
        observe_julia: {
            text: "Julia mira de reojo a todos los demás. Aprietas el puño: sabes que ella también sospecha. Pero el miedo te impide moverte.",
            image: "images/winston_girl.mp4",
            choices: [
                { text: "Reunir valor para hablarle", nextScene: "talk_to_julia" }
            ]
        },
        talk_to_julia: {
            text: "—¿No te cansas de esto? —le dices en voz baja. Julia sonríe apenas. —Pensé que todos estaban dormidos. Hay un grupo… Nos vemos en el baño del bloque viejo en el descanso.",
            image: "images/winston_girl2.mp4",
            effect: { mentalFreedom: +15, unlockedWords: ["confianza"] },
            choices: [
                { text: "Aceptar ir al baño del bloque viejo", nextScene: "go_bathroom_resistance" }
            ]
        },
        go_bathroom_resistance: {
            text: "En el descanso, te escabulles hasta el baño del bloque viejo. Las paredes están llenas de grafitis: 'RESISTENCIA', 'LIBERATE', 'LEE'. Un grupo de estudiantes te mira en silencio.",
            image: "images/bathroom_resistance.mp4",
            choices: [
                { text: "Presentarte ante el grupo", nextScene: "resistance_intro" }
            ]
        },
        resistance_intro: {
            text: "Julia te presenta: —Este es Winston. Despertó. Los demás asienten. En el centro, sobre un cuaderno, hay un libro viejo y doblado.",
            image: "images/resistance_group.jpg",
            effect: { unlockedWords: ["resistencia"] },
            choices: [
                { text: "Abrir el libro prohibido", nextScene: "open_book" },
                { text: "Preguntar quién lidera la resistencia", nextScene: "ask_leader" }
            ]
        },
        open_book: {
            text: "Abres el libro. Es una novela latinoamericana, llena de palabras que describen pueblos, ríos y recuerdos. Cada frase te despierta.",
            image: "images/old_library.jpg",
            effect: { mentalFreedom: +20, unlockedWords: ["memoria", "historia"] },
            choices: [
                { text: "Leer en voz alta un fragmento", nextScene: "read_aloud" }
            ]
        },
        read_aloud: {
            text: "Mientras lees en voz alta, las miradas de tus compañeros se iluminan. Por un momento, el baño se llena más de imaginación que de grafiti.",
            image: "images/resistance_group.jpg",
            effect: { mentalFreedom: +20 },
            choices: [
                { text: "Preguntar de dónde salió el libro", nextScene: "book_origin" }
            ]
        },
        ask_leader: {
            text: "—¿Quién empezó todo esto? —preguntas. Uno de los chicos señala una pared donde hay pintado un ojo azul. —O'Brien… el profe. Pero no sabemos si está con nosotros o con ellos.",
            image: "images/obrien_teacher.mp4",
            choices: [
                { text: "Investigar más sobre O'Brien", nextScene: "find_obrien" },
                { text: "Volver al libro prohibido", nextScene: "open_book" }
            ]
        },
        book_origin: {
            text: "—Lo trajo la bibliotecaria del colegio —dice Julia—. Ella recuerda cómo era estudiar con libros, no con pantallas. Pero la quieren despedir.",
            image: "images/library_old.mp4",
            choices: [
                { text: "Ir a la biblioteca a conocerla", nextScene: "go_library" }
            ]
        },
        go_library: {
            text: "La biblioteca está casi vacía. Polvo, telarañas, y una mujer mayor leyendo a la luz que entra por las ventanas. Te mira con una mezcla de sorpresa y esperanza.",
            image: "images/old_library.jpg",
            effect: { mentalFreedom: +10, unlockedWords: ["biblioteca"] },
            choices: [
                { text: "Hablar con la bibliotecaria sobre los libros", nextScene: "talk_librarian" }
            ]
        },
        talk_librarian: {
            text: "—Pensé que ya nadie venía por aquí —dice ella—. Los libros son peligrosos para quienes quieren controlar lo que piensas. Pero para ti pueden ser alas.",
            image: "images/old_library.jpg",
            effect: { mentalFreedom: +20, unlockedWords: ["alas", "pensar"] },
            choices: [
                { text: "Pedirle que te recomiende un libro", nextScene: "librarian_recommends" },
                { text: "Preguntarle por O'Brien", nextScene: "find_obrien" }
            ]
        },
        librarian_recommends: {
            text: "Te entrega un libro delgado. —Empieza por aquí. Léelo y luego compártelo en voz alta. La lectura es un virus hermoso.",
            image: "images/old_library.jpg",
            effect: { mentalFreedom: +15, unlockedWords: ["lectura"] },
            choices: [
                { text: "Llevar el libro a la resistencia en el baño", nextScene: "go_bathroom_resistance" }
            ]
        },
        find_obrien: {
            text: "Buscas a O'Brien. Lo ves en el patio, sonriendo mientras los drones lo rodean. En su solapa, el símbolo del ojo azul del sistema… pero en su mirada hay algo más.",
            image: "images/obrien_teacher.jpg",
            choices: [
                { text: "Hablar con O'Brien en privado", nextScene: "talk_obrien_private" },
                { text: "Desconfiar y observarlo desde lejos", nextScene: "watch_obrien" }
            ]
        },
        watch_obrien: {
            text: "O'Brien habla sobre obediencia y disciplina frente a todos, pero por un segundo te mira y hace un pequeño gesto con la cabeza hacia la biblioteca.",
            image: "images/obrien_teacher2.mp4",
            choices: [
                { text: "Seguir esa pista e ir a la biblioteca", nextScene: "go_library" }
            ]
        },
        talk_obrien_private: {
            text: "En un pasillo vacío, O'Brien baja la voz: —El sistema cree que trabajo para él. Pero yo sé algo que él no: que los libros no se pueden apagar.",
            image: "images/obrien_teacher.jpg",
            effect: { mentalFreedom: +20, unlockedWords: ["secreto"] },
            choices: [
                { text: "Preguntar cómo derrotar al Gran Algoritmo", nextScene: "how_defeat_algorithm" }
            ]
        },
        how_defeat_algorithm: {
            text: "—No se derrota con fuerza —dice O'Brien—, sino con imaginación. Si suficientes estudiantes leen y piensan por sí mismos, el Algoritmo se vuelve inútil. Necesitas encender lecturas en todo el colegio.",
            image: "images/Sistema_SVA.jpg",
            choices: [
                { text: "Organizar una lectura secreta masiva", nextScene: "plan_mass_reading" }
            ]
        },
        plan_mass_reading: {
            text: "Julia, la resistencia, la bibliotecaria y tú hacen un plan: en la próxima hora de 'Conexión Total', hackearás el sistema para que en todas las pantallas aparezca… un texto para leer.",
            image: "images/winston_hacker.jpg",
            effect: { unlockedWords: ["plan", "hackear"] },
            choices: [
                { text: "Prepararte para hackear el sistema", nextScene: "hack_room" }
            ]
        },
        hack_room: {
            text: "Te llevan a un salón lleno de computadores donde el sistema controla todo. Es la sala matriz de la escuela.",
            image: "images/computer_room.mp4",
            choices: [
                { text: "Sentarte frente al computador central", nextScene: "hack_start" }
            ]
        },
        hack_start: {
            text: "Te conectas al sistema. Códigos verdes pasan frente a tus ojos. El Gran Algoritmo intenta bloquearte.",
            image: "images/winston_hacker.mp4",
            effect: { mentalFreedom: +10 },
            choices: [
                { text: "Inyectar un texto literario en el sistema", nextScene: "inject_text" },
                { text: "Apagar todas las pantallas", nextScene: "turn_off_screens" }
            ]
        },
        inject_text: {
            text: "En lugar de órdenes, mandas un fragmento de una novela a todas las pantallas del colegio. Los estudiantes dejan de deslizar y empiezan a LEER.",
            image: "images/control_room2.mp4",
            effect: { mentalFreedom: +30, unlockedWords: ["lectores", "despertar"] },
            choices: [
                { text: "Ver la reacción en el patio", nextScene: "ending_good" }
            ]
        },
        turn_off_screens: {
            text: "Apagas todas las pantallas. Silencio total. Algunos estudiantes se asustan, otros levantan la mirada y, por primera vez, se miran entre sí.",
            image: "images/courtyard_phones.jpg",
            effect: { mentalFreedom: +20 },
            choices: [
                { text: "Invitarlos a leer en voz alta", nextScene: "ending_good" }
            ]
        },
        ending_good: {
            text: "Días después, un grupo de estudiantes se reúne frente al colegio con carteles: 'Menos pantallas, más vida', 'Libera tu mente con libros'. La resistencia ya no es secreta.",
            image: "images/resistance_signs.jpg",
            effect: { mentalFreedom: +20, unlockedWords: ["esperanza"] },
            choices: [
                { text: "Fin del Capítulo 1: La chispa de la lectura", nextScene: "end_game" }
            ]
        },
        end_game: {
            text: "Has iniciado una revolución silenciosa: la de la lectura. La historia puede continuar con más capítulos y más retos, pero por ahora… has demostrado que leer es resistir.",
            image: "images/resistance_signs.jpg",
            choices: []
        }
    },
    inventory: [],
    mentalFreedom: 100
};

let currentScene = "start";

const dialogueTextElement = document.getElementById("dialogue-text");
const choicesElement = document.getElementById("choices");
const sceneImageElement = document.getElementById("scene-image");
const sceneVideoElement = document.getElementById("scene-video");
const mentalFreedomElement = document.getElementById("mental-freedom");
const unlockedWordsElement = document.getElementById("unlocked-words");
const wordListElement = document.getElementById("word-list");

function updateGame() {
    const scene = gameData.scenes[currentScene];
    dialogueTextElement.textContent = scene.text;

    // Detectar si es imagen o video
    const mediaPath = scene.image;
    const isVideo = mediaPath.endsWith(".mp4") || mediaPath.endsWith(".webm") || mediaPath.endsWith(".mov");

    if (isVideo) {
        // Mostrar video
        sceneVideoElement.src = mediaPath;
        sceneVideoElement.style.display = "block";
        sceneImageElement.style.display = "none";
        sceneVideoElement.load();
        sceneVideoElement.play();
    } else {
        // Mostrar imagen
        sceneImageElement.src = mediaPath;
        sceneImageElement.style.display = "block";
        sceneVideoElement.style.display = "none";
        sceneVideoElement.pause();
        sceneVideoElement.removeAttribute("src");
    }

    choicesElement.innerHTML = "";
    scene.choices.forEach(choice => {
        const button = document.createElement("button");
        button.classList.add("choice-button");
        button.textContent = choice.text;
        button.onclick = () => makeChoice(choice.nextScene, scene.effect);
        choicesElement.appendChild(button);
    });

    mentalFreedomElement.textContent = `${gameData.mentalFreedom}%`;
    unlockedWordsElement.textContent = gameData.inventory.length;
    updateWordList();
}

function makeChoice(nextScene, effect) {
    if (effect) {
        if (effect.mentalFreedom) {
            gameData.mentalFreedom += effect.mentalFreedom;
            if (gameData.mentalFreedom > 100) gameData.mentalFreedom = 100;
            if (gameData.mentalFreedom < 0) gameData.mentalFreedom = 0;
        }
        if (effect.unlockedWords) {
            effect.unlockedWords.forEach(word => {
                if (!gameData.inventory.includes(word)) {
                    gameData.inventory.push(word);
                }
            });
        }
    }
    currentScene = nextScene;
    updateGame();
}

function updateWordList() {
    wordListElement.innerHTML = "";
    gameData.inventory.forEach(word => {
        const listItem = document.createElement("li");
        listItem.textContent = word;
        wordListElement.appendChild(listItem);
    });
}

// Iniciar juego
updateGame();