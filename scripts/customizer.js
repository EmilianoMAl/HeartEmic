
import { ESPLoader, Transport } from './esptool.bundle.js';

// DOM Elements
const btnConnect = document.getElementById('btn-connect'); // Changed ID to match HTML
const statusBadge = document.getElementById('connection-status');
const groupProfile = document.getElementById('group-profile');
const groupFlash = document.getElementById('group-flash');
const btnFlash = document.getElementById('btn-flash');
const progressFill = document.getElementById('progress-fill');
const statusText = document.getElementById('status-text');
const logContainer = document.getElementById('log-container');
const toggleLogBtn = document.getElementById('toggle-log');
const profileBtns = document.querySelectorAll('.profile-btn');

// State
let device = null;
let transport = null;
let esploader = null;
let connected = false;
let selectedProfile = 'a'; // Default to A

// --- Logging Helper ---
function log(msg, type = 'info') {
    const ts = new Date().toLocaleTimeString();
    const color = type === 'error' ? '#ff5555' : (type === 'success' ? '#55ff55' : '#aaaaaa');
    logContainer.innerHTML += `<div style="color:${color}">[${ts}] ${msg}</div>`;
    logContainer.scrollTop = logContainer.scrollHeight;
    console.log(`[${type}] ${msg}`);
}

// --- Toggle Log Visibility ---
toggleLogBtn.addEventListener('click', () => {
    if (logContainer.style.display === 'none') {
        logContainer.style.display = 'block';
        toggleLogBtn.textContent = 'Ocultar detalles ▲';
    } else {
        logContainer.style.display = 'none';
        toggleLogBtn.textContent = 'Ver detalles técnicos ▼';
    }
});

// --- Profile Selection ---
profileBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        profileBtns.forEach(b => b.classList.remove('active'));
        // Add active to clicked
        btn.classList.add('active');
        // Update state
        selectedProfile = btn.dataset.profile;
        log(`Perfil seleccionado: ${selectedProfile.toUpperCase()}`);
    });
});

// --- Connection Logic ---
btnConnect.addEventListener('click', async () => {
    if (connected) return; // Already connected

    if (!navigator.serial) {
        alert('Tu navegador no soporta Web Serial API. Por favor usa Chrome, Edge o Opera.');
        return;
    }

    try {
        device = await navigator.serial.requestPort();
        transport = new Transport(device, true); // true for debug tracing if needed

        log('Abriendo puerto serial...', 'info');

        // Try to connect/detect
        esploader = new ESPLoader({
            transport,
            baudrate: 115200, // Standard baudrate
            romBaudrate: 115200,
            terminal: {
                clean: () => { /* no-op or clear log */ },
                write: (data) => log(data.trim(), 'info'),
                writeLine: (data) => log(data.trim(), 'info')
            }
        });

        // Initialize connection
        await esploader.main();

        // Update UI State
        connected = true;
        statusBadge.textContent = 'Conectado';
        statusBadge.className = 'status-badge status-connected';
        statusBadge.innerHTML = '<i class="fas fa-check-circle"></i> Conectado';

        // Enable other groups
        groupProfile.style.opacity = '1';
        groupProfile.style.pointerEvents = 'auto';
        groupFlash.style.opacity = '1';
        groupFlash.style.pointerEvents = 'auto';

        // Hide connect button to keep UI clean or change text
        btnConnect.style.display = 'none';

        log('¡Conexión exitosa! Chip detectado.', 'success');

    } catch (e) {
        console.error(e);
        log(`Error de conexión: ${e.message}`, 'error');
        alert('No se pudo conectar al dispositivo. Asegúrate de que no esté en uso por otra aplicación.');
    }
});

// --- Flashing Logic ---
btnFlash.addEventListener('click', async () => {
    if (!connected) return;

    // Disable button to prevent double click
    btnFlash.disabled = true;
    statusText.textContent = "Preparando...";
    progressFill.style.width = '0%';

    try {
        const firmwareFile = `firmwares/profile_${selectedProfile}.bin`;
        log(`Descargando firmware: ${firmwareFile}...`);

        // 1. Fetch binary file
        const response = await fetch(firmwareFile);
        if (!response.ok) throw new Error(`No se encontró el archivo ${firmwareFile}`);

        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const fileData = new Uint8Array(arrayBuffer); // Convert to Uint8Str/Array

        // ESPTool-JS requires binary string for some versions, or Uint8Array. 
        // Let's check the imported library version behavior. The code in meditador-panel used:
        // const binStr = atob(data.firmware_b64);
        // const fileArray = [{ data: binStr, address: 0x0 }];
        // It seems it expects a "binary string" (latin1).

        // Convert Uint8Array to Binary String
        let binaryString = "";
        for (let i = 0; i < fileData.length; i++) {
            binaryString += String.fromCharCode(fileData[i]);
        }

        log(`Firmware descargado. Tamaño: ${fileData.length} bytes.`, 'success');

        // 2. Prepare File Array
        // Address 0x0 for C6 merged binaries (bootloader + partition + app)
        const fileArray = [{ data: binaryString, address: 0x0000 }];

        statusText.textContent = "Borrando flash (puede tardar)...";
        statusBadge.className = 'status-badge status-busy';
        statusBadge.textContent = 'Ocupado...';

        // 3. Write Flash
        await esploader.writeFlash({
            fileArray: fileArray,
            flashSize: 'keep',
            flashMode: 'dio', // Standard for ESP32
            flashFreq: '40m',
            eraseAll: false, // Don't erase entire chip, just necessary sectors
            compress: true,
            reportProgress: (fileIndex, written, total) => {
                const percent = Math.round((written / total) * 100);
                progressFill.style.width = `${percent}%`;
                statusText.textContent = `Escribiendo: ${percent}%`;
            }
        });

        statusText.textContent = "¡Flasheo Completado!";
        log('Flasheo completado con éxito.', 'success');

        // 4. Reset Device
        log('Reiniciando dispositivo...');
        await transport.setDTR(false);
        await transport.setRTS(true);
        await new Promise(r => setTimeout(r, 100));
        await transport.setRTS(false);

        statusBadge.className = 'status-badge status-connected';
        statusBadge.textContent = 'Conectado';
        alert('¡Tu Meditador ha sido actualizado con éxito!');

    } catch (e) {
        console.error(e);
        log(`Error al flashear: ${e.message}`, 'error');
        statusText.textContent = "Error al flashear";
        statusBadge.className = 'status-badge status-disconnected';
        statusBadge.textContent = 'Error';
        alert(`Ocurrió un error: ${e.message}`);
    } finally {
        btnFlash.disabled = false;
    }
});