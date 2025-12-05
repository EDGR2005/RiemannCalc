#include<iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <utility>
#include <iomanip>
#include <cmath> // Para operaciones matemáticas adicionales (aunque no estrictamente necesario aquí)

// Bibliotecas personalizadas (se asume que están definidas en tu proyecto)
#include"node.h"
#include"ExpressionParser.h"
#include"toPostFix.h"
#include"Utils.h"
#include"cutIntegral.h"

#include <fstream>  // para manejo de archivos (ifstream, ofstream)
#include <string>   // para usar std::string
#include <nlohmann/json.hpp>

using json = nlohmann::json;
using namespace std;

// Variables globales para almacenar puntos (usadas para el JSON y la gráfica)
vector<double> xs;
vector<double> ys;

int main(int argc, char* argv[])
{
    cortarIntegral integral;

    // 1. VERIFICACIÓN DE ARGUMENTOS
    if (argc < 2) {
        std::cerr << "ERROR: Falta el argumento de entrada. Uso: ./riemann_solver \"(funcion, a, b, n)\"" << std::endl;
        return 1;
    }

    // 2. RECEPCIÓN Y PARSEO DE LA ENTRADA
    std::string entrada = argv[1];
    integral.cortar(entrada);

    string expresion = integral.getArg();
    string& r_expresion = expresion;

    double sumatoria = 0.0;
    double limInferior = stod(integral.getLimI());
    double limSuperior = stod(integral.getLimS());
    double deltaDeX = stod(integral.getDeltaX());
    
    // El número de rectángulos N, aunque no se usa directamente en el bucle, 
    // se infiere por la iteración y deltaDeX.

    // ⭐️ BUCLE CORREGIDO PARA EL CÁLCULO DE LA SUMA DE RIEMANN ⭐️
    // La condición i < limSuperior asegura que solo se evalúen N puntos.
    // El punto de inicio del intervalo es 'i'.
    for (double i = limInferior; i < limSuperior; i += deltaDeX)
    {
        // 1. CÁLCULO DEL PUNTO DE EVALUACIÓN (PUNTO MEDIO)
        // c_i = punto_izquierdo + (delta_x / 2)
        double punto_evaluacion = i + (deltaDeX / 2.0);
        
        string limite = to_string(punto_evaluacion);
        string& r_limite = limite;

        // 2. EVALUACIÓN DE f(x) EN EL PUNTO MEDIO
        toPostFix x(getMathExpression(r_expresion, r_limite));
        Expression_Parser myTree(x.getPostFixExpression());
        std::shared_ptr<node> tree = myTree.toTree();

        double fx = myTree.evaluateExpressionTree(tree);      // f(c_i)
        double rect = fx * deltaDeX;                          // f(c_i) * dx

        // 3. GUARDAR DATOS PARA GRAFICAR
        // Para la gráfica de rectángulos, guardamos la esquina inferior izquierda del rectángulo (i) 
        // y la altura calculada (fx).
        xs.push_back(i); 
        ys.push_back(fx);

        // 4. ACUMULAR LA SUMATORIA
        sumatoria += rect;
    }

    // 3. GENERACIÓN DE LA SALIDA JSON
    json j;
    for (int k = 0; k < xs.size(); k++) {
        j["puntos"].push_back({
            {"x", xs[k]}, // Punto de inicio del intervalo
            {"fx", ys[k]}  // Altura (evaluada en el punto medio)
        });
    }

    j["lim_inf"] = limInferior;
    j["lim_sup"] = limSuperior;
    j["delta_x"] = deltaDeX;
    j["sumatoria"] = sumatoria;

    // Guardar el JSON en un archivo para que el front-end lo lea
    std::ofstream file("datos.json");
    file << j.dump(4);
    file.close();

    // 4. IMPRIMIR RESULTADOS A LA SALIDA ESTÁNDAR (STDOUT) Y ERROR (STDERR)
    // 1. IMPRIMIR SOLO EL RESULTADO NUMÉRICO LIMPIO (para ser capturado por el script padre)
    std::cout << std::fixed << std::setprecision(15) << sumatoria << std::endl;

    // 2. IMPRIMIR EL JSON DEL HISTORIAL Y PUNTOS CON DELIMITADORES (a STDERR o STDOUT si es necesario)
    std::cerr << "JSON_DATA_START" << std::endl;
    std::cout << j.dump() << std::endl; 
    std::cerr << "JSON_DATA_END" << std::endl;

    return 0;
}