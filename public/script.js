// =======================================================
// 1. CONFIGURACIÓN DE FIREBASE
// =======================================================

const firebaseConfig = {
  apiKey: "AIzaSyBqt_s517Lhr47XUJVBogfwIWtZ2Hyq5-0",
  authDomain: "riemanncalc.firebaseapp.com",
  projectId: "riemanncalc",
  storageBucket: "riemanncalc.firebasestorage.app",
  messagingSenderId: "783698654778",
  appId: "1:783698654778:web:d54a2f213755feeec3a703",
  measurementId: "G-F7PZDX69GC"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); // Inicializa la base de datos

// Variable global para mantener la instancia del gráfico y destruirla si es necesario
let riemannChartInstance = null;

// =======================================================
// 2. LÓGICA PRINCIPAL (DOMContentLoaded)
// =======================================================

document.addEventListener("DOMContentLoaded", function () {

    // === ELEMENTOS DEL DOM ===
    const loginContainer = document.getElementById("login-container");
    const signupContainer = document.getElementById("signup-container");
    const mainApp = document.getElementById("main-app");

    // LOGIN / SIGNUP
    const loginForm = document.getElementById("login-form");
    const loginEmail = document.getElementById("login-email");
    const loginPassword = document.getElementById("login-password");
    const signupForm = document.getElementById("signup-form");
    const signupEmail = document.getElementById("signup-email");
    const signupPassword = document.getElementById("signup-password");
    const registerLink = document.getElementById("register-link");
    const loginLink = document.getElementById("login-link");
    const logoutBtn = document.getElementById("logout-btn");

    // CÁLCULO
    const calcForm = document.getElementById("calc-form");
    const functionInput = document.getElementById("function");
    const aLimitInput = document.getElementById("a-limit");
    const bLimitInput = document.getElementById("b-limit");
    const partitionsInput = document.getElementById("partitions");

    // Resultados
    const resultSpan = document.getElementById("riemann-result");
    const integralSpan = document.getElementById("integral-result");
    const deltaXSpan = document.getElementById("delta-x");

    // Historial
    const historyList = document.getElementById("history-list");
    const clearHistoryBtn = document.getElementById("clear-history-btn");

    const exportImageBtn = document.getElementById("exportImageBtn"); 
    const exportPdfBtn = document.getElementById("exportPdfBtn");


    // =======================================================
    // 3. FUNCIONES AUXILIARES
    // =======================================================

    function showLogin() {
        loginContainer.classList.remove("hidden");
        signupContainer.classList.add("hidden");
        mainApp.classList.add("hidden");
    }

    function showSignup() {
        signupContainer.classList.remove("hidden");
        loginContainer.classList.add("hidden");
        mainApp.classList.add("hidden");
    }

    function showApp() {
        mainApp.classList.remove("hidden");
        loginContainer.classList.add("hidden");
        signupContainer.classList.add("hidden");
    }

    /**
     * Restablece el formulario de cálculo y borra los resultados mostrados.
     */
    function resetCalculationForm() {
        const calcForm = document.getElementById("calc-form");
        const resultSpan = document.getElementById("riemann-result");
        const integralSpan = document.getElementById("integral-result");
        const deltaXSpan = document.getElementById("delta-x");

        if (calcForm) {
            calcForm.reset();
        }
        
        // Restablecer valores por defecto del HTML
        document.getElementById("function").value = "sin(x)";
        document.getElementById("a-limit").value = 0;
        document.getElementById("b-limit").value = 3.14;
        document.getElementById("partitions").value = 20;

        // Limpiar los resultados
        if (resultSpan) resultSpan.textContent = "—";
        if (integralSpan) integralSpan.textContent = "—";
        if (deltaXSpan) deltaXSpan.textContent = "—";
    }
    
    // --- LÓGICA DE GRÁFICOS ---

    /**
     * Dibuja la función y los rectángulos de Riemann usando Chart.js
     * @param {Array<Object>} puntos - Array de objetos con {x, fx}
     */
    function drawRiemannChart(puntos) {
        const ctx = document.getElementById('riemannChart').getContext('2d');
        
        if (riemannChartInstance) {
            riemannChartInstance.destroy();
        }

        const lineData = [];
        const barData = [];

        puntos.forEach(p => {
            lineData.push({ x: p.x, y: p.fx });
            barData.push({ x: p.x, y: p.fx }); 
        });

        // Configuración del Gráfico
        riemannChartInstance = new Chart(ctx, {
            type: 'scatter', 
            data: {
                datasets: [
                    // 1. LÍNEA de la función
                    {
                        label: functionInput.value,
                        data: lineData,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        showLine: true,
                        pointRadius: 0,
                        tension: 0.4
                    },
                    // 2. RECTÁNGULOS
                    {
                        label: 'Suma de Riemann (Rectángulos)',
                        data: barData,
                        type: 'bar',
                        backgroundColor: 'rgba(255, 99, 132, 0.4)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        barPercentage: 1.0, 
                        categoryPercentage: 1.0, 
                        pointRadius: 0,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    // ... (configuración de ejes X/Y) ...
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    },
                    legend: {
                        display: true
                    },
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true, // Zoom con rueda del ratón
                            },
                            pinch: {
                                enabled: true // Zoom con pellizco
                            },
                            // 🎯 ESTO DEBE SER 'xy'
                            mode: 'xy', 
                        },
                        pan: {
                            enabled: true, // Desplazamiento
                            // 🎯 ESTO TAMBIÉN DEBE SER 'xy'
                            mode: 'xy', 
                        },
                        // 🎯 LIMITES PARA AMBOS EJES
                        limits: {
                            x: { min: 'original', max: 'original' },
                            y: { min: 'original', max: 'original' }
                        },
                        // Opcional: Esto habilita la función de doble clic/toque para restablecer la vista.
                        // chartjs-plugin-zoom v2 lo tiene habilitado por defecto, pero es bueno ser explícito.
                        // reset: {
                        //    mode: 'auto' 
                        // }
                    }
                }
            }
        });
    }


    // --- LÓGICA DE HISTORIAL ---

    /**
    * Lee los cálculos de Firestore para el usuario actual y los renderiza en el DOM.
    * @param {string} userId - El UID del usuario autenticado.
    */
    function loadAndRenderHistory(userId) {
        if (!historyList) return;

        historyList.innerHTML = '<li class="muted small">Cargando historial...</li>';
        
        db.collection("users").doc(userId).collection("calculations")
        .orderBy("timestamp", "desc")
        .limit(10)
        .get()
        .then(snapshot => {
            let html = '';
            const calculations = [];
            
            if (snapshot.empty) {
                historyList.innerHTML = '<li class="muted small">Aún no hay cálculos guardados.</li>';
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                calculations.push({ id: doc.id, ...data });

                html += `
                    <li class="history-item" data-id="${doc.id}">
                        <div class="history-data">
                            <strong class="history-func">f(x): ${data.function}</strong> | [${data.a}, ${data.b}] n=${data.n}
                            <div class="small">Resultado: ${data.result.toFixed(6)}</div>
                        </div>
                        <div class="actions">
                            <button class="load-btn primary small" data-id="${doc.id}">Cargar</button>
                            <button class="delete-btn secondary small" data-id="${doc.id}">❌</button>
                        </div>
                    </li>
                `;
            });
            
            historyList.innerHTML = html;
            attachHistoryEventListeners(calculations);
        })
        .catch(error => {
            console.error("Error al cargar el historial:", error);
            historyList.innerHTML = '<li class="muted small">Error al cargar el historial.</li>';
        });
    }


    /** Adjunta eventos a los botones de Cargar y Eliminar. */
    function attachHistoryEventListeners(calculations) {
        const userId = firebase.auth().currentUser.uid;
        
        // Evento de Cargar
        document.querySelectorAll('.load-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const calcId = btn.getAttribute('data-id');
                const item = calculations.find(c => c.id === calcId);
                
                if (item) {
                    functionInput.value = item.function;
                    aLimitInput.value = item.a;
                    bLimitInput.value = item.b;
                    partitionsInput.value = item.n;
                    
                    Swal.fire({ icon: "info", title: "Cargado", text: "Parámetros cargados al formulario." });
                }
            });
        });

        // Evento de Eliminar
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const calcId = btn.getAttribute('data-id');
                
                db.collection("users").doc(userId)
                .collection("calculations").doc(calcId).delete()
                .then(() => {
                    console.log("Documento eliminado:", calcId);
                    Swal.fire({ icon: "success", title: "Eliminado", text: "El cálculo ha sido borrado." });
                    loadAndRenderHistory(userId); 
                })
                .catch(error => {
                    console.error("Error al eliminar:", error);
                    Swal.fire({ icon: "error", title: "Error", text: "No se pudo eliminar el cálculo." });
                });
            });
        });
        
        // Evento de Limpiar Todo
        clearHistoryBtn.addEventListener('click', () => {
            if (!confirm("¿Estás seguro de que quieres borrar todo el historial de cálculos?")) return;
            
            db.collection("users").doc(userId).collection("calculations").get()
            .then(snapshot => {
                const batch = db.batch();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                return batch.commit();
            })
            .then(() => {
                Swal.fire({ icon: "success", title: "Historial Limpio", text: "Todo el historial ha sido borrado." });
                loadAndRenderHistory(userId);
            })
            .catch(error => {
                console.error("Error al limpiar historial:", error);
                Swal.fire({ icon: "error", title: "Error", text: "Fallo al borrar el historial." });
            });
        });
    }


    // =======================================================
    // 4. EVENTOS DE AUTENTICACIÓN
    // =======================================================

    registerLink.addEventListener("click", (e) => {
        e.preventDefault();
        showSignup();
    });

    loginLink.addEventListener("click", (e) => {
        e.preventDefault();
        showLogin();
    });

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        firebase.auth()
            .signInWithEmailAndPassword(loginEmail.value, loginPassword.value)
            .then(() => showApp())
            .catch(err => {
                        Swal.fire({
                            icon: "error",
                            title: "Credenciales incorrectas",
                            confirmButtonText: "Aceptar"
                        });
                    });
    });

    signupForm.addEventListener("submit", function (event) {
        event.preventDefault();

        firebase.auth()
            .createUserWithEmailAndPassword(signupEmail.value, signupPassword.value)
            .then(() => showApp())
            .catch(err => {
                            Swal.fire({
                                icon: "error",
                                title: "Error al registrarse",
                                html: `<pre style="text-align:left; white-space:pre-wrap; font-size:0.85rem;">${JSON.stringify(err, null, 2)}</pre>`,
                                confirmButtonText: "Aceptar",
                            });
                        });
    });

    logoutBtn.addEventListener("click", () => {
        resetCalculationForm();
        firebase.auth().signOut().then(() => showLogin());
    });


    // =======================================================
    // 5. EVENTO DE CÁLCULO DE RIEMANN
    // =======================================================

    if (calcForm) {
        calcForm.addEventListener("submit", function (event) {
            event.preventDefault();

            if (!firebase.auth().currentUser) {
                Swal.fire({ icon: "warning", title: "Sesión expirada", text: "Por favor, vuelve a iniciar sesión." });
                showLogin();
                return;
            }

            // 1. Obtención y Validación de Datos
            const funcStr = functionInput.value.trim();
            const a = parseFloat(aLimitInput.value);
            const b = parseFloat(bLimitInput.value);
            const n = parseInt(partitionsInput.value);
            
            if (isNaN(a) || isNaN(b) || b <= a || isNaN(n) || n <= 0 || !funcStr) {
                Swal.fire({ icon: "warning", title: "Datos Inválidos", text: "Verifica la función, que a < b y que las particiones (n > 0) sean válidas." });
                return;
            }

            // Preparación del String para C++
            const inputStringForCpp = `(${funcStr}, ${a}, ${b}, ${n})`; 
            const jsonPayload = JSON.stringify({ entrada: inputStringForCpp }); 
            
            // Mostrar estado de carga
            const deltaX = (b - a) / n;
            if (deltaXSpan) deltaXSpan.textContent = deltaX.toFixed(6);
            if (resultSpan) resultSpan.textContent = "Calculando...";
            if (integralSpan) integralSpan.textContent = "Cargando...";

            // ENVÍO AL SERVIDOR BACKEND (Node.js)
            fetch('http://localhost:3000/api/riemann', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: jsonPayload 
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => { throw new Error(errorData.message || `Error HTTP: ${response.status}`); });
                }
                return response.json();
            })
            .then(data => {
                // MANEJO DE LA RESPUESTA EXITOSA
                if (data.status === 'success' && data.resultado !== undefined) {
                    const resultado = parseFloat(data.resultado);
                    const user = firebase.auth().currentUser;

                    try {
                        // 4a. Actualización de la interfaz
                        if (resultSpan) resultSpan.textContent = resultado.toFixed(6);
                        if (integralSpan) integralSpan.textContent = "Cálculo en C++";
                        
                        // 4b. DIBUJAR GRÁFICA INTERACTIVA
                        if (data.puntos && data.puntos.length > 0) {
                            drawRiemannChart(data.puntos); 
                            



                        } else {
                            console.warn("Node.js no devolvió puntos para graficar.");
                        }

                        // 4c. Guardar en Firestore
                        if (user) {
                            db.collection("users").doc(user.uid)
                            .collection("calculations").add({
                                function: funcStr,              
                                a: a,
                                b: b,
                                n: n,
                                result: resultado,
                                timestamp: firebase.firestore.FieldValue.serverTimestamp() 
                            })
                            .then(() => {
                                console.log("Cálculo guardado en Firestore.");
                                loadAndRenderHistory(user.uid); 
                            })
                            .catch(error => console.error("Error al guardar:", error));
                        }
                    } catch (updateError) {
                        console.error("Error al actualizar la interfaz o guardar:", updateError);
                    }
                } else {
                    // Manejo de error lógico (si data.status != 'success')
                    Swal.fire({ icon: "error", title: "Fallo del Motor", text: data.message || 'El resultado no es válido.' });
                }

                // 5. Mantenimiento de Vista (Post-Cálculo)
                if (firebase.auth().currentUser) showApp();
                else showLogin();
            })
            .catch(error => {
                // Manejo de errores de red o errores lanzados desde Node.js/C++
                if (resultSpan) resultSpan.textContent = "FALLO";
                if (integralSpan) integralSpan.textContent = "SIN CONEXIÓN";
                console.error('Error al ejecutar fetch:', error);
                
                Swal.fire({ 
                    icon: "error", 
                    title: "Error de Conexión", 
                    text: `No se pudo obtener el resultado. ${error.message}` 
                });

                // Mantenimiento de Vista (Post-Error)
                if (firebase.auth().currentUser) showApp();
            });
        });
    }

    // =======================================================
    // 6. EVENTO DE EXPORTACIÓN DE IMAGEN (PNG)
    // =======================================================

    if (exportImageBtn) {
        exportImageBtn.addEventListener('click', function() {
            const chartCanvas = document.getElementById('riemannChart');
            
            // 1. Verificar que el gráfico haya sido dibujado
            if (!riemannChartInstance) {
                Swal.fire({ icon: "warning", title: "Gráfico vacío", text: "Primero realiza un cálculo para dibujar el gráfico." });
                return;
            }

            // 2. Obtener la URL de la imagen (PNG por defecto)
            // Usamos chartCanvas.toDataURL() que es un método nativo del canvas.
            const imageURL = chartCanvas.toDataURL('image/png', 1.0); // 1.0 es la calidad

            // 3. Crear un enlace temporal para forzar la descarga
            const link = document.createElement('a');
            link.href = imageURL;
            link.download = 'SumaRiemann_' + new Date().toISOString().slice(0, 10) + '.png'; 
            
            // 4. Simular un clic para descargar el archivo
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            Swal.fire({ icon: "success", title: "Descarga iniciada", text: "La imagen ha sido exportada como PNG." });
        });
    }
    
    // =======================================================
    // 7. INICIALIZACIÓN
    // =======================================================

    // Mantener sesión
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            showApp();
            resetCalculationForm(); // Limpiamos campos
            loadAndRenderHistory(user.uid); 
        }
        else showLogin();
    });

});