#ifndef VPN_ENGINE_H
#define VPN_ENGINE_H

#include <string>
#include <vector>
#include <map>
#include <functional>
#include <memory>

namespace OriginX {

// VPN Server structure
struct VPNServer {
    std::string id;
    std::string name;
    std::string country;
    std::string city;
    std::string protocol;
    std::string ip;
    double load;
    int ping;
};

// VPN Settings structure
struct VPNSettings {
    bool killSwitch;
    std::string encryptionLevel; // "low", "medium", "high"
    std::string protocol;         // "UDP", "TCP"
    std::string dns;
    bool autoConnect;
};

// VPN Status structure
struct VPNStatus {
    bool connected;
    VPNServer* currentServer;
    std::string ipAddress;
    double uploadSpeed;
    double downloadSpeed;
    long uptime;
};

// IPC Command types
enum class IPCCommand {
    CONNECT,
    DISCONNECT,
    GET_STATUS,
    SET_SETTINGS,
    GET_SERVERS,
    GET_LOGS,
    KILL_SWITCH_ENABLE,
    TEST_CONNECTION
};

// Callback for status updates
using StatusCallback = std::function<void(const VPNStatus&)>;
using LogCallback = std::function<void(const std::string&)>;

class VPNEngine {
public:
    VPNEngine();
    ~VPNEngine();

    // Connection management
    bool connect(const std::string& serverId);
    bool disconnect();
    bool isConnected() const;

    // Settings management
    void setSettings(const VPNSettings& settings);
    VPNSettings getSettings() const;

    // Server management
    std::vector<VPNServer> getAvailableServers();
    VPNServer* getCurrentServer();

    // Status and monitoring
    VPNStatus getStatus();
    void registerStatusCallback(StatusCallback callback);

    // Logging
    void registerLogCallback(LogCallback callback);
    std::vector<std::string> getLogs(int count = 100);

    // Speed testing
    double testSpeed();

    // Kill switch
    void enableKillSwitch();
    void disableKillSwitch();

    // Configuration
    bool loadOpenVPNConfig(const std::string& configPath);
    bool validateOpenVPNBinary();

private:
    VPNSettings settings;
    VPNStatus currentStatus;
    std::vector<std::string> logs;
    std::vector<VPNServer> servers;
    VPNServer* currentServer;
    StatusCallback statusCallback;
    LogCallback logCallback;

    // Internal methods
    void log(const std::string& message);
    void updateStatus();
    bool executeOpenVPN(const std::string& configPath);
    bool terminateOpenVPN();
    std::string fetchPublicIP();
};

} // namespace OriginX

#endif // VPN_ENGINE_H
