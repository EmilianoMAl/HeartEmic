document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURACIÓN DE DATOS ---
    
    // Rutas de las imágenes de las mascotas
    // IMPORTANTE: Asegúrate de tener estas imágenes en tu carpeta images/
    const petImages = {
        '1': 'images/mascota_1.png', // Mishi
        '2': 'images/mascota_2.png', // Perrito
        '3': 'images/mascota_3.png'  // Espíritu
    };

    // Colores de fondo para el círculo de la mascota según elección (opcional, por estética)
    const petBgColors = {
        '1': '#d6ffcaff', // Verde suave
        '2': '#c2eaff', // Azul suave
        '3': '#ffd1dc'  // Rosa suave
    };

    // Datos de respiración (en segundos)
    const breathData = {
        'corto': {
            name: 'Respiraciones: Cortas',
            in: 3,
            hold: 2,
            out: 3,
            rest: 1
        },
        'medio': {
            name: 'Respiraciones: Medias',
            in: 4,
            hold: 3,
            out: 4,
            rest: 1.5
        },
        'largo': {
            name: 'Respiraciones: Largas',
            in: 5,
            hold: 4,
            out: 5,
            rest: 2
        }
    };

    // Estado actual (valores por defecto)
    let currentPetId = '1';
    let currentBreathId = 'corto';

    // --- REFERENCIAS AL DOM ---
    const petImgElement = document.getElementById('pet-image');
    const petBgElement = document.querySelector('.pet-display');
    
    const breathTitle = document.getElementById('breath-title-display');
    const valIn = document.getElementById('val-inhale');
    const valHold = document.getElementById('val-hold');
    const valOut = document.getElementById('val-exhale');
    const valRest = document.getElementById('val-rest');

    const petButtons = document.querySelectorAll('.pet-btn');
    const breathButtons = document.querySelectorAll('.breath-btn');
    const flashBtn = document.getElementById('btn-flash');

    // --- FUNCIONES ---

    // Función para actualizar la UI basada en el estado actual
    function updateUI() {
        // 1. Actualizar imagen mascota con transición suave
        petImgElement.style.opacity = '0'; // Fade out
        
        setTimeout(() => {
            petImgElement.src = petImages[currentPetId];
            petBgElement.style.backgroundColor = petBgColors[currentPetId];
            petImgElement.style.opacity = '1'; // Fade in
        }, 200);

        // 2. Actualizar datos de respiración
        const data = breathData[currentBreathId];
        breathTitle.textContent = data.name;
        valIn.textContent = data.in + 's';
        valHold.textContent = data.hold + 's';
        valOut.textContent = data.out + 's';
        valRest.textContent = data.rest + 's';
    }

    // --- EVENT LISTENERS ---

    // Click en botones de Mascota
    petButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover clase active de todos
            petButtons.forEach(b => b.classList.remove('active'));
            // Añadir active al clickeado
            btn.classList.add('active');
            
            // Actualizar estado
            currentPetId = btn.getAttribute('data-pet');
            updateUI();
        });
    });

    // Click en botones de Respiración
    breathButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover clase active de todos
            breathButtons.forEach(b => b.classList.remove('active'));
            // Añadir active al clickeado
            btn.classList.add('active');
            
            // Actualizar estado
            currentBreathId = btn.getAttribute('data-breath');
            updateUI();
        });
    });

    // Simulación del botón Flash
    flashBtn.addEventListener('click', () => {
        flashBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';
        setTimeout(() => {
            flashBtn.innerHTML = '<i class="fas fa-check"></i> ¡Listo!';
            flashBtn.style.backgroundColor = '#4caf50'; // Verde éxito
            
            setTimeout(() => {
                flashBtn.innerHTML = '<i class="fas fa-bolt"></i> Cargar al Dispositivo';
                flashBtn.style.backgroundColor = ''; // Reset color
            }, 3000);
        }, 1500);
    });

    // Inicializar UI
    updateUI();
});