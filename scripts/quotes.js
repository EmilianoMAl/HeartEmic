// Espera a que todo el contenido del HTML se cargue
document.addEventListener('DOMContentLoaded', () => {

    const quoteElement = document.getElementById('quote-display');
    const apiUrl = 'https://positive-api.online/phrase/esp';
    let quotesShown = 0;
    const totalQuotes = 5; // Cambia este número si quieres mostrar más o menos frases

    // Función para obtener una frase del API
    async function fetchQuote() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('La respuesta de la red no fue correcta');
            }
            const data = await response.json();
            return data.text; // Solo nos interesa el texto de la frase
        } catch (error) {
            console.error('Hubo un problema al obtener la frase:', error);
            return "No se pudo cargar una frase."; // Mensaje de error
        }
    }

    // Función principal que controla el ciclo de frases
    async function showQuotesCycle() {
        if (quotesShown < totalQuotes) {
            // Muestra una frase
            const quoteText = await fetchQuote();
            quoteElement.textContent = `"${quoteText}"`;
            quotesShown++;

            // Espera 4 segundos (4000 milisegundos) y vuelve a llamar a la función
            setTimeout(showQuotesCycle, 4000);

        } else {
            // Cuando se hayan mostrado todas las frases, muestra el mensaje final
            quoteElement.textContent = 'Prueba The Positive API gratis...';
        }
    }

    // Inicia el ciclo
    showQuotesCycle();

});