#ifndef IPC_BRIDGE_H
#define IPC_BRIDGE_H

#include "vpn_engine.h"
#include <string>
#include <functional>
#include <memory>
#include <nlohmann/json.hpp>

namespace OriginX {

using json = nlohmann::json;

// Callback for IPC messages sent to UI
using IPCMessageCallback = std::function<void(const std::string& channel, const json& data)>;

class IPCBridge {
public:
    IPCBridge(std::shared_ptr<VPNEngine> engine);
    ~IPCBridge();

    // Register callback for sending messages back to UI
    void registerIPCCallback(IPCMessageCallback callback);

    // Handle incoming IPC messages from UI
    json handleMessage(const std::string& channel, const json& data);

    // Send async events to UI
    void sendStatusUpdate(const VPNStatus& status);
    void sendLogUpdate(const std::string& log);
    void sendErrorEvent(const std::string& error);

private:
    std::shared_ptr<VPNEngine> vpnEngine;
    IPCMessageCallback ipcCallback;

    // Message handlers
    json handleConnect(const json& data);
    json handleDisconnect();
    json handleGetStatus();
    json handleSetSettings(const json& data);
    json handleGetServers();
    json handleGetLogs(const json& data);
    json handleEnableKillSwitch();
    json handleTestConnection();

    // Helper methods
    json serverToJson(const VPNServer& server);
    json statusToJson(const VPNStatus& status);
    VPNSettings jsonToSettings(const json& data);
};

} // namespace OriginX

#endif // IPC_BRIDGE_H
