#include "../include/vpn_engine.h"
#include <iostream>
#include <sstream>
#include <ctime>
#include <chrono>

namespace OriginX {

VPNEngine::VPNEngine() 
    : currentServer(nullptr) {
    settings = {
        true,        // killSwitch
        "high",      // encryptionLevel
        "UDP",       // protocol
        "8.8.8.8",   // dns
        false        // autoConnect
    };

    currentStatus = {
        false,           // connected
        nullptr,         // currentServer
        "",              // ipAddress
        0.0,             // uploadSpeed
        0.0,             // downloadSpeed
        0                // uptime
    };

    log("VPN Engine initialized");
}

VPNEngine::~VPNEngine() {
    if (isConnected()) {
        disconnect();
    }
}

bool VPNEngine::connect(const std::string& serverId) {
    log("Attempting to connect to server: " + serverId);
    
    // Find server in list
    auto it = std::find_if(servers.begin(), servers.end(),
        [&serverId](const VPNServer& s) { return s.id == serverId; });

    if (it == servers.end()) {
        log("Error: Server not found: " + serverId);
        return false;
    }

    currentServer = &(*it);
    
    // Execute OpenVPN with appropriate config
    std::string configPath = "openvpn-configs/" + serverId + ".ovpn";
    if (!executeOpenVPN(configPath)) {
        log("Error: Failed to execute OpenVPN");
        return false;
    }

    currentStatus.connected = true;
    currentStatus.currentServer = currentServer;
    currentStatus.ipAddress = currentServer->ip;

    if (statusCallback) {
        statusCallback(currentStatus);
    }

    log("Successfully connected to " + currentServer->name);
    return true;
}

bool VPNEngine::disconnect() {
    if (!isConnected()) {
        return false;
    }

    log("Disconnecting from VPN");
    if (!terminateOpenVPN()) {
        log("Error: Failed to terminate OpenVPN");
        return false;
    }

    currentStatus.connected = false;
    currentStatus.currentServer = nullptr;
    currentStatus.ipAddress = "";
    currentServer = nullptr;

    if (statusCallback) {
        statusCallback(currentStatus);
    }

    log("Successfully disconnected");
    return true;
}

bool VPNEngine::isConnected() const {
    return currentStatus.connected;
}

void VPNEngine::setSettings(const VPNSettings& newSettings) {
    settings = newSettings;
    log("VPN Settings updated - Encryption: " + settings.encryptionLevel + 
        ", Protocol: " + settings.protocol);
}

VPNSettings VPNEngine::getSettings() const {
    return settings;
}

std::vector<VPNServer> VPNEngine::getAvailableServers() {
    return servers;
}

VPNServer* VPNEngine::getCurrentServer() {
    return currentServer;
}

VPNStatus VPNEngine::getStatus() {
    updateStatus();
    return currentStatus;
}

void VPNEngine::registerStatusCallback(StatusCallback callback) {
    statusCallback = callback;
}

void VPNEngine::registerLogCallback(LogCallback callback) {
    logCallback = callback;
}

std::vector<std::string> VPNEngine::getLogs(int count) {
    if (logs.size() <= count) {
        return logs;
    }
    return std::vector<std::string>(logs.end() - count, logs.end());
}

double VPNEngine::testSpeed() {
    log("Testing connection speed...");
    // Placeholder for speed test implementation
    return 0.0;
}

void VPNEngine::enableKillSwitch() {
    settings.killSwitch = true;
    log("Kill switch enabled");
}

void VPNEngine::disableKillSwitch() {
    settings.killSwitch = false;
    log("Kill switch disabled");
}

bool VPNEngine::loadOpenVPNConfig(const std::string& configPath) {
    log("Loading OpenVPN config: " + configPath);
    // Placeholder for config loading
    return true;
}

bool VPNEngine::validateOpenVPNBinary() {
    log("Validating OpenVPN binary");
    // Placeholder for OpenVPN binary validation
    return true;
}

void VPNEngine::log(const std::string& message) {
    auto now = std::chrono::system_clock::now();
    auto time = std::chrono::system_clock::to_time_t(now);
    
    std::stringstream ss;
    ss << "[" << std::ctime(&time) << "] " << message;
    std::string logEntry = ss.str();

    logs.push_back(logEntry);

    if (logs.size() > 1000) {
        logs.erase(logs.begin(), logs.begin() + 500);
    }

    if (logCallback) {
        logCallback(logEntry);
    }

    std::cout << logEntry << std::endl;
}

void VPNEngine::updateStatus() {
    // Update uptime if connected
    if (currentStatus.connected) {
        // Calculate uptime from connection start time
    }
}

bool VPNEngine::executeOpenVPN(const std::string& configPath) {
    log("Executing OpenVPN with config: " + configPath);
    // Placeholder for OpenVPN process execution
    return true;
}

bool VPNEngine::terminateOpenVPN() {
    log("Terminating OpenVPN process");
    // Placeholder for OpenVPN process termination
    return true;
}

std::string VPNEngine::fetchPublicIP() {
    log("Fetching public IP address");
    // Placeholder for IP fetching
    return "";
}

} // namespace OriginX
