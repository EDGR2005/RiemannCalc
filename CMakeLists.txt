cmake_minimum_required(VERSION 3.30)
project(Riemann_3_04)

set(CMAKE_CXX_STANDARD 14)

# Rutas de GLEW y GLFW (ajústalas según tu estructura exacta)
set(GLEW_DIR "glew-2.1.0-win32")
set(GLFW_DIR "glfw-3.4.bin.WIN64")  # Asumo que es GLFW

# Incluir headers de GLEW y GLFW
include_directories(
        ${GLEW_DIR}/include
        ${GLFW_DIR}/include
)

# Archivos fuente del proyecto
add_executable(Riemann_3_04
        cutIntegral.cpp
        cutIntegral.h
        ExpressionParser.cpp
        ExpressionParser.h
        main.cpp
        node.h
        toPostFix.cpp
        toPostFix.h
        Utils.cpp
        Utils.h
)


