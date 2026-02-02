cmake_minimum_required(VERSION 3.15)
project(OriginX-VPN-Engine)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find required packages
find_package(nlohmann_json 3.2.0 QUIET)

# If nlohmann_json is not found, fetch it from GitHub
if(NOT nlohmann_json_FOUND)
    include(FetchContent)
    FetchContent_Declare(json URL https://github.com/nlohmann/json/releases/download/v3.11.2/json.tar.xz)
    FetchContent_MakeAvailable(json)
endif()

# VPN Engine Library
add_library(vpn_engine STATIC
    src/vpn_engine.cpp
    src/ipc_bridge.cpp
)

target_include_directories(vpn_engine PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

target_link_libraries(vpn_engine
    nlohmann_json::nlohmann_json
)

# Main executable for testing
add_executable(vpn_engine_test
    src/main.cpp
)

target_link_libraries(vpn_engine_test
    vpn_engine
    nlohmann_json::nlohmann_json
)

# Platform-specific settings
if(APPLE)
    target_compile_options(vpn_engine PRIVATE -Wall -Wextra -Wpedantic)
    target_compile_options(vpn_engine_test PRIVATE -Wall -Wextra -Wpedantic)
elseif(WIN32)
    target_compile_options(vpn_engine PRIVATE /W4)
    target_compile_options(vpn_engine_test PRIVATE /W4)
elseif(UNIX)
    target_compile_options(vpn_engine PRIVATE -Wall -Wextra -Wpedantic)
    target_compile_options(vpn_engine_test PRIVATE -Wall -Wextra -Wpedantic)
endif()

# Build options
option(BUILD_SHARED_LIBS "Build shared libraries" OFF)
option(ENABLE_TESTS "Enable testing" ON)

# Installation
install(TARGETS vpn_engine
    ARCHIVE DESTINATION lib
    LIBRARY DESTINATION lib
    RUNTIME DESTINATION bin
)

install(DIRECTORY include/ DESTINATION include)
