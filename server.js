const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000; // Puerto por defecto para Render

// =======================================================
// MIDDLEWARES GLOBALES
// =======================================================
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); 
app.use((req, res, next) => {
    // Permitir CORS, necesario si el frontend se carga desde una URL diferente (como en Render)
    res.header('Access-Control-Allow-Origin', '*'); 
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// =======================================================
// 4. RUTA API PARA EL CÁLCULO (LÓGICA CORREGIDA)
// =======================================================

app.post('/api/riemann', (req, res) => {
    const inputString = req.body.entrada; 

    if (!inputString) {
        return res.status(400).send({ status: 'error', message: 'Falta la cadena de entrada.' });
    }

    // Usamos el nombre del ejecutable que compila Render: 'Riemann'
    const executablePath = path.join(__dirname, 'Riemann'); 
    const command = `${executablePath} "${inputString}"`; 

    console.log(`[Backend] Ejecutando: ${command}`);

    // Ejecutar el programa C++
    exec(command, (error, stdout, stderr) => {
        
        // 1. MANEJO DE ERROR CRÍTICO DEL SISTEMA/C++
        if (error) {
            // Si el C++ arroja un error (y sale con código != 0), esto lo atrapa.
            // Si hay algo en stderr, lo devolvemos como error para el debug.
            const errorMessage = stderr.trim() || error.message;
            console.error('[C++] Fallo de ejecución:', errorMessage);
            
            // Devolvemos el error en formato JSON para evitar el fallo de JSON.parse en el frontend
            return res.status(500).json({ 
                status: 'error', 
                message: `Fallo en el motor C++ (código ${error.code}): ${errorMessage}` 
            });
        }
        
        // 2. MANEJO DE SALIDA C++ (ASUME QUE C++ DEVUELVE UN SOLO JSON A STDOUT)
        const stdoutTrimmed = stdout.trim();

        try {
            // Intentamos parsear toda la salida stdout como UN ÚNICO JSON
            const resultData = JSON.parse(stdoutTrimmed); 

            // 3. Éxito: Devolver el resultado y los puntos
            res.json({ 
                status: 'success', 
                resultado: parseFloat(resultData.resultado), // Usamos 'resultado' del JSON
                puntos: resultData.puntos || [] // Usamos 'puntos' del JSON
            });

        } catch (e) {
            // 4. FALLO DE PARSEO DE JSON (El C++ imprimió algo que no era JSON)
            console.error("[Backend] Error al parsear el JSON de C++:", e.message);
            console.error("[Backend] Salida cruda de C++ (stdout):", stdoutTrimmed);
            
            // Devolvemos el error en formato JSON, incluyendo la salida cruda para debug
            res.status(500).json({ 
                status: 'error', 
                message: 'El motor C++ no devolvió un JSON válido.',
                rawOutput: stdoutTrimmed
            });
        }
    });
});

// =======================================================
// 5. INICIAR EL SERVIDOR
// =======================================================
app.listen(PORT, () => {
    console.log(`Servidor de cálculo (Node.js) escuchando en http://localhost:${PORT}`);
    console.log(`Accede a la aplicación en: http://localhost:${PORT}`);
});