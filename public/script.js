
// Variable global para mantener la instancia del gráfico
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
    const guestLoginBtn = document.getElementById("guest-login-btn"); 

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
    const historyCard = document.getElementById("historyCard"); 
    
    // Exportación
    const exportImageBtn = document.getElementById("exportImageBtn"); 
    const exportPdfBtn = document.getElementById("exportPdfBtn");

    // Display
    const signupName = document.getElementById("signup-name");
    const userNameLabel = document.getElementById("user-name-label"); 


    // =======================================================
    // 3. FUNCIONES AUXILIARES
    // =======================================================

    /**
     * Carga el nombre del usuario de Firestore y actualiza el label.
     * @param {string} userId - El UID del usuario autenticado.
     */
    function updateUserNameLabel(userId) {
        if (!userId || !userNameLabel) {
            userNameLabel.textContent = "";
            return;
        }

        db.collection("users").doc(userId).get()
            .then(doc => {
                if (doc.exists && doc.data().name) {
                    // Muestra el nombre, o un saludo general si no hay nombre
                    userNameLabel.textContent = `Hola, ${doc.data().name} 👋`;
                } else {
                    userNameLabel.textContent = "Bienvenido";
                }
            })
            .catch(error => {
                console.error("Error al cargar el nombre:", error);
                userNameLabel.textContent = "Usuario"; 
            });
    }

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

        const lineData = puntos.map(p => ({ x: p.x, y: p.fx }));
        const barData = puntos.map(p => ({ x: p.x, y: p.fx }));

        riemannChartInstance = new Chart(ctx, {
            type: 'scatter', 
            data: {
                datasets: [
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
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: { display: true, text: 'Eje X' },
                        suggestedMin: parseFloat(aLimitInput.value), 
                        suggestedMax: parseFloat(bLimitInput.value)
                    },
                    y: {
                        beginAtZero: false,
                        title: { display: true, text: 'Eje Y (f(x))' }
                    }
                },
                plugins: {
                    tooltip: { mode: 'index', intersect: false },
                    legend: { display: true },
                    zoom: {
                        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' },
                        pan: { enabled: true, mode: 'xy' },
                        limits: { x: { min: 'original', max: 'original' }, y: { min: 'original', max: 'original' } }
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
        if (!userId || !historyList) return; // Salir si no hay ID o elemento de lista

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
                            ${data.nombreRegistrador ? `<div class="muted small">Por: ${data.nombreRegistrador}</div>` : ''}
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
        const user = firebase.auth().currentUser;
        if (!user) return; 

        const userId = user.uid;
        
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
            .then(response => {
                const user = response.user;
                const name = signupName.value.trim();
                
                return db.collection("users").doc(user.uid).set({
                    name: name,
                    email: user.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
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


    // EVENTO PARA INVITADO
    if (guestLoginBtn) {
        guestLoginBtn.addEventListener("click", () => {
            // 1. Muestra la aplicación principal
            showApp(); 
            
            // 2. Limpia el formulario por si acaso
            resetCalculationForm();

            // 3. Oculta las funcionalidades de usuario (historial, nombre)
            if (userNameLabel) userNameLabel.textContent = "Modo Invitado";
            if (historyCard) historyCard.classList.add('hidden');
            if (clearHistoryBtn) clearHistoryBtn.style.display = 'none';

            // 4. Muestra un mensaje de bienvenida
            Swal.fire({
                icon: "info",
                title: "Modo Invitado",
                text: "Puedes calcular, pero los resultados no se guardarán en el historial.",
                showConfirmButton: false,
                timer: 3000
            });
        });
    }


    // =======================================================
    // 5. EVENTO DE CÁLCULO DE RIEMANN (CORREGIDO PARA INVITADO)
    // =======================================================

    if (calcForm) {
        calcForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const user = firebase.auth().currentUser;

            if (!user) {
                // PERMITIR CÁLCULO EN MODO INVITADO PERO NO GUARDAR
                console.warn("Cálculo realizado en modo invitado. No se guardará el historial.");
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
            fetch('https://riemanncalc.onrender.com/api/riemann', {
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

                        // 4c. Guardar en Firestore (SOLO SI HAY USUARIO)
                        if (user) { 
                            // Accedemos a user.uid SÓLO si user existe.
                            db.collection("users").doc(user.uid).get()
                            .then(userDoc => {
                                const nameToSave = userDoc.exists && userDoc.data().name ? userDoc.data().name : "Anónimo";

                                db.collection("users").doc(user.uid)
                                .collection("calculations").add({
                                    function: funcStr, a: a, b: b, n: n, result: resultado,
                                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                                    nombreRegistrador: nameToSave
                                })
                                .then(() => loadAndRenderHistory(user.uid))
                                .catch(error => console.error("Error al guardar:", error));
                            })
                            .catch(error => console.error("Error al obtener nombre:", error)); 
                        }
                    } catch (updateError) {
                        console.error("Error al actualizar la interfaz o guardar:", updateError);
                    }
                } else {
                    // Manejo de error lógico (si data.status != 'success')
                    Swal.fire({ icon: "error", title: "Fallo del Motor", text: data.message || 'El resultado no es válido.' });
                }
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
            const imageURL = chartCanvas.toDataURL('image/png', 1.0); 

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
    // 7. EVENTO DE EXPORTACIÓN DE REPORTE COMPLETO (PDF ESTRUCTURADO)
    // =======================================================

    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', function() {
            const chartCanvas = document.getElementById('riemannChart');
            
            if (!riemannChartInstance) {
                Swal.fire({ icon: "warning", title: "Gráfico vacío", text: "Primero realiza un cálculo para dibujar el gráfico." });
                return;
            }

            Swal.fire({
                title: 'Generando Reporte PDF...',
                text: 'Construyendo el documento.',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading() }
            });
            
            // 1. OBTENER LOS DATOS DEL DOM
            const funcStr = functionInput.value.trim();
            const a = aLimitInput.value;
            const b = bLimitInput.value;
            const n = partitionsInput.value;
            const deltaX = deltaXSpan.textContent;
            const resultadoRiemann = resultSpan.textContent;
            const resultadoIntegral = integralSpan.textContent;
            const nombreUsuario = userNameLabel.textContent;
            const fecha = new Date().toLocaleDateString('es-ES');
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4'); // Retrato, mm, A4
            const margin = 15;
            let y = margin; // Posición Y actual

            // ----------------------------------------------------
            // 2. CONSTRUIR CABECERA Y DATOS GENERALES
            // ----------------------------------------------------
            
            pdf.setFontSize(16);
            pdf.text("Reporte de Sumatoria de Riemann", margin, y);
            y += 8;

            pdf.setFontSize(10);
            pdf.text(`Generado por: ${nombreUsuario}`, margin, y);
            y += 5;
            pdf.text(`Fecha: ${fecha}`, margin, y);
            y += 10;
            
            // ----------------------------------------------------
            // 3. PARÁMETROS DEL CÁLCULO
            // ----------------------------------------------------
            
            pdf.setFontSize(12);
            pdf.text("— Parámetros de la Operación —", margin, y);
            y += 8;

            pdf.setFontSize(10);
            pdf.text(`Función f(x): ${funcStr}`, margin, y); y += 5;
            pdf.text(`Intervalo [a, b]: [${a}, ${b}]`, margin, y); y += 5;
            pdf.text(`Número de Rectángulos (n): ${n}`, margin, y); y += 5;
            pdf.text(`Δx (Ancho de rectángulo): ${deltaX}`, margin, y); y += 10;
            
            // ----------------------------------------------------
            // 4. RESULTADOS
            // ----------------------------------------------------
            
            pdf.setFontSize(12);
            pdf.text("— Resultados —", margin, y);
            y += 8;

            pdf.setFontSize(10);
            pdf.text(`Resultado de Suma de Riemann: ${resultadoRiemann}`, margin, y); y += 5;
            pdf.text(`Integral de Referencia: ${resultadoIntegral}`, margin, y); y += 10;
            
            // ----------------------------------------------------
            // 5. ADJUNTAR LA GRÁFICA (Canvas a Imagen)
            // ----------------------------------------------------
            
            const imgData = chartCanvas.toDataURL('image/png');
            const imgWidth = 180; // Ancho en mm (casi el ancho de la página A4)
            const imgHeight = (chartCanvas.height * imgWidth) / chartCanvas.width;
            
            // Verificar si hay espacio y, si no, agregar una nueva página
            if (y + imgHeight + margin > pdf.internal.pageSize.getHeight()) {
                pdf.addPage();
                y = margin;
            }

            pdf.text("— Visualización —", margin, y);
            y += 5;
            pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
            
            // ----------------------------------------------------
            // 6. FINALIZAR Y GUARDAR
            // ----------------------------------------------------

            pdf.save('ReporteEstructuradoRiemann_' + new Date().toISOString().slice(0, 10) + '.pdf');
            
            Swal.close();
            Swal.fire({ icon: "success", title: "Descarga exitosa", text: "El reporte estructurado ha sido exportado como PDF." });
        });
    }

    // =======================================================
    // 8. EVENTO LIMPIAR HISTORIAL COMPLETO
    // =======================================================

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            const user = firebase.auth().currentUser;
            if (!user) {
                Swal.fire({ icon: "warning", title: "Sesión expirada", text: "Inicia sesión para limpiar tu historial." });
                return;
            }

            const userId = user.uid;

            Swal.fire({
                title: "¿Estás seguro?", text: "¡Esto borrará permanentemente todo tu historial!",
                icon: "warning", showCancelButton: true, confirmButtonText: "Sí, borrar todo", cancelButtonText: "Cancelar"
            }).then((result) => {
                if (result.isConfirmed) {
                    
                    db.collection("users").doc(userId).collection("calculations").get()
                    .then(snapshot => {
                        const batch = db.batch();
                        snapshot.docs.forEach(doc => { batch.delete(doc.ref); });
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
                }
            });
        });
    }


    // =======================================================
    // 9. INICIALIZACIÓN
    // =======================================================

    // Mantener sesión
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // Usuario logueado
            showApp();
            resetCalculationForm();
            loadAndRenderHistory(user.uid); 
            updateUserNameLabel(user.uid); 
            
            if (historyCard) historyCard.classList.remove('hidden');
            if (clearHistoryBtn) clearHistoryBtn.style.display = '';
        }
        else {
            // Usuario invitado o sin sesión
            showLogin();
            
            if (historyCard) historyCard.classList.add('hidden');
            if (clearHistoryBtn) clearHistoryBtn.style.display = 'none';
            if (userNameLabel) userNameLabel.textContent = ""; 
        }
    });

});