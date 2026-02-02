#include "../include/ipc_bridge.h"
#include <iostream>

namespace OriginX {

IPCBridge::IPCBridge(std::shared_ptr<VPNEngine> engine)
    : vpnEngine(engine) {
    // Register callbacks from VPN engine
    vpnEngine->registerStatusCallback([this](const VPNStatus& status) {
        sendStatusUpdate(status);
    });

    vpnEngine->registerLogCallback([this](const std::string& log) {
        sendLogUpdate(log);
    });
}

IPCBridge::~IPCBridge() = default;

void IPCBridge::registerIPCCallback(IPCMessageCallback callback) {
    ipcCallback = callback;
}

json IPCBridge::handleMessage(const std::string& channel, const json& data) {
    try {
        if (channel == "vpn:connect") {
            return handleConnect(data);
        } else if (channel == "vpn:disconnect") {
            return handleDisconnect();
        } else if (channel == "vpn:status") {
            return handleGetStatus();
        } else if (channel == "vpn:settings") {
            return handleSetSettings(data);
        } else if (channel == "vpn:servers") {
            return handleGetServers();
        } else if (channel == "vpn:logs") {
            return handleGetLogs(data);
        } else if (channel == "vpn:killswitch") {
            return handleEnableKillSwitch();
        } else if (channel == "vpn:test") {
            return handleTestConnection();
        }

        return json{{"error", "Unknown channel: " + channel}};
    } catch (const std::exception& e) {
        return json{{"error", e.what()}};
    }
}

void IPCBridge::sendStatusUpdate(const VPNStatus& status) {
    if (ipcCallback) {
        ipcCallback("vpn:status-update", statusToJson(status));
    }
}

void IPCBridge::sendLogUpdate(const std::string& log) {
    if (ipcCallback) {
        ipcCallback("vpn:log-update", json{{"log", log}});
    }
}

void IPCBridge::sendErrorEvent(const std::string& error) {
    if (ipcCallback) {
        ipcCallback("vpn:error", json{{"error", error}});
    }
}

json IPCBridge::handleConnect(const json& data) {
    std::string serverId = data["serverId"];
    bool success = vpnEngine->connect(serverId);
    
    return json{
        {"success", success},
        {"message", success ? "Connected" : "Connection failed"},
        {"status", statusToJson(vpnEngine->getStatus())}
    };
}

json IPCBridge::handleDisconnect() {
    bool success = vpnEngine->disconnect();
    
    return json{
        {"success", success},
        {"message", success ? "Disconnected" : "Disconnection failed"},
        {"status", statusToJson(vpnEngine->getStatus())}
    };
}

json IPCBridge::handleGetStatus() {
    return statusToJson(vpnEngine->getStatus());
}

json IPCBridge::handleSetSettings(const json& data) {
    VPNSettings settings = jsonToSettings(data);
    vpnEngine->setSettings(settings);
    
    return json{
        {"success", true},
        {"message", "Settings updated"}
    };
}

json IPCBridge::handleGetServers() {
    json servers = json::array();
    for (const auto& server : vpnEngine->getAvailableServers()) {
        servers.push_back(serverToJson(server));
    }
    
    return json{{"servers", servers}};
}

json IPCBridge::handleGetLogs(const json& data) {
    int count = data.value("count", 100);
    json logs = json::array();
    
    for (const auto& log : vpnEngine->getLogs(count)) {
        logs.push_back(log);
    }
    
    return json{{"logs", logs}};
}

json IPCBridge::handleEnableKillSwitch() {
    vpnEngine->enableKillSwitch();
    return json{{"success", true}};
}

json IPCBridge::handleTestConnection() {
    double speed = vpnEngine->testSpeed();
    return json{
        {"success", true},
        {"speed", speed}
    };
}

json IPCBridge::serverToJson(const VPNServer& server) {
    return json{
        {"id", server.id},
        {"name", server.name},
        {"country", server.country},
        {"city", server.city},
        {"protocol", server.protocol},
        {"ip", server.ip},
        {"load", server.load},
        {"ping", server.ping}
    };
}

json IPCBridge::statusToJson(const VPNStatus& status) {
    json result{
        {"connected", status.connected},
        {"ipAddress", status.ipAddress},
        {"uploadSpeed", status.uploadSpeed},
        {"downloadSpeed", status.downloadSpeed},
        {"uptime", status.uptime}
    };

    if (status.currentServer) {
        result["currentServer"] = serverToJson(*status.currentServer);
    }

    return result;
}

VPNSettings IPCBridge::jsonToSettings(const json& data) {
    return {
        data.value("killSwitch", false),
        data.value("encryptionLevel", "high"),
        data.value("protocol", "UDP"),
        data.value("dns", "8.8.8.8"),
        data.value("autoConnect", false)
    };
}

} // namespace OriginX
