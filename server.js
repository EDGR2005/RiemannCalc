const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000; //puerto

// =======================================================
// MIDDLEWARES GLOBALES
// =======================================================

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); 
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); 
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// =======================================================
// 4. RUTA API PARA EL CÁLCULO (LÓGICA ACTUALIZADA)
// =======================================================

app.post('/api/riemann', (req, res) => {
    const inputString = req.body.entrada; 

    if (!inputString) {
        return res.status(400).send({ status: 'error', message: 'Falta la cadena de entrada.' });
    }

    const executablePath = path.join(__dirname, 'Riemann');
    const command = `${executablePath} "${inputString}"`; 

    console.log(`[Backend] Ejecutando: ${command}`);

    // Ejecutar el programa C++
    exec(command, (error, stdout, stderr) => {
        
        // El error de ejecución es un fallo del sistema o del C++
        if (error) {
            console.error('[C++] Error de ejecución:', error.message);
            return res.status(500).send({ status: 'error', message: `Fallo del motor C++: ${error.message}` });
        }
        
        const stdoutTrimmed = stdout.trim();
        const stderrTrimmed = stderr.trim(); // Contiene las etiquetas JSON_DATA_START/END

        // 1. Extraer el resultado numérico (Siempre es la primera línea de stdout)
        const stdoutLines = stdoutTrimmed.split('\n');
        const resultadoNumerico = stdoutLines[0] ? stdoutLines[0].trim() : '0'; 
        
        // Verificación de número
        if (isNaN(parseFloat(resultadoNumerico))) {
             console.error('[C++] Salida no numérica:', resultadoNumerico);
             return res.status(500).send({ status: 'error', message: 'El C++ no devolvió un número válido.' });
        }

        // 2. LÓGICA PARA CAPTURAR EL JSON DE PUNTOS
        const jsonStartIndex = stderrTrimmed.indexOf('JSON_DATA_START');
        const jsonEndIndex = stderrTrimmed.indexOf('JSON_DATA_END');
        
        let puntosArray = [];
        let jsonString = '';

        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            // Si las etiquetas están en stderr, el JSON estará en la segunda línea de stdout
            jsonString = stdoutLines[1] ? stdoutLines[1].trim() : ''; 
        }

        try {
            if (jsonString) {
                const puntosData = JSON.parse(jsonString); 
                // Asumimos que el JSON contiene un campo "puntos"
                puntosArray = puntosData.puntos || []; 
            }
        } catch (e) {
            console.error("[Backend] Error al parsear el JSON de puntos:", e);
        }

        // 3. Éxito: Devolver el resultado numérico y el array de puntos
        res.send({ 
            status: 'success', 
            resultado: parseFloat(resultadoNumerico),
            puntos: puntosArray // Array de puntos para la gráfica
        });
    });
});

// =======================================================
// 5. INICIAR EL SERVIDOR
// =======================================================
app.listen(PORT, () => {
    console.log(`Servidor de cálculo (Node.js) escuchando en http://localhost:${PORT}`);
    console.log(`Accede a la aplicación en: http://localhost:${PORT}`);
});