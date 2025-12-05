const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
// Usar la variable de entorno PORT proporcionada por Render, o 3000 por defecto.
const PORT = process.env.PORT || 3000; 

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
// 4. RUTA API PARA EL CÁLCULO (LÓGICA CORREGIDA PARA SALIDA ETIQUETADA)
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
            const errorMessage = stderr.trim() || error.message;
            console.error('[C++] Fallo de ejecución:', errorMessage);
            
            // Devolvemos el error en formato JSON para evitar el fallo de JSON.parse en el frontend
            return res.status(500).json({ 
                status: 'error', 
                message: `Fallo en el motor C++ (código ${error.code}): ${errorMessage}` 
            });
        }
        
        // 2. EXTRACCIÓN Y MANEJO DE SALIDA C++ (C++ DEVUELVE EL NÚMERO Y UN JSON ETIQUETADO)
        const stdoutFull = stdout.trim();

        // Usamos una expresión regular para encontrar el bloque JSON entre las etiquetas.
        // La bandera 's' permite que '.' coincida con saltos de línea, necesario por el formato.
        // Captura el contenido ({...}) entre JSON_DATA_START y JSON_DATA_END.
        const jsonBlockRegex = /JSON_DATA_START\s*(\{[\s\S]*?\})\s*JSON_DATA_END/;
        const match = stdoutFull.match(jsonBlockRegex);
        
        let jsonString = '';

        if (match && match[1]) {
            jsonString = match[1].trim();
        } else {
            console.error("[Backend] Error: No se encontraron las etiquetas JSON_DATA_START/END.");
            // Si las etiquetas no están, la salida no es la esperada.
            return res.status(500).json({ 
                status: 'error', 
                message: 'El motor C++ devolvió datos, pero no se encontró el bloque JSON esperado (JSON_DATA_START/END).',
                rawOutput: stdoutFull
            });
        }

        try {
            // Intentamos parsear el JSON extraído
            const resultData = JSON.parse(jsonString); 

            // 3. Éxito: Devolver el resultado y los puntos
            // Se usa resultData.sumatoria porque ese es el campo que usas en el JSON de C++.
            res.json({ 
                status: 'success', 
                resultado: parseFloat(resultData.sumatoria), // *** Usa el campo 'sumatoria' del C++ ***
                puntos: resultData.puntos || [] 
            });

        } catch (e) {
            // 4. FALLO DE PARSEO DE JSON (El contenido extraído no era JSON válido)
            console.error("[Backend] Error al parsear el JSON de C++:", e.message);
            console.error("[Backend] JSON extraído para parseo:", jsonString);
            
            // Devolvemos el error en formato JSON para debug
            res.status(500).json({ 
                status: 'error', 
                message: 'El contenido extraído del C++ no es un JSON válido.',
                rawOutput: jsonString
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