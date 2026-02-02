import Foundation
import NetworkExtension

@objc(VPNModule)
class VPNModule: RCTEventEmitter {
  private var vpnManager: NEVPNManager = NEVPNManager.shared()
  
  override func supportedEvents() -> [String]! {
    return ["vpn-status-changed", "vpn-error", "vpn-log"]
  }
  
  @objc(connect:withResolver:withRejecter:)
  func connect(serverId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      do {
        let settings = NEVPNProtocolIKEv2 ()
        settings.username = serverId
        settings.serverAddress = "vpn.server.com"
        settings.disableLocalAuthentication = false
        settings.useExtendedAuthentication = true
        
        let configuration = NEVPNConfiguration()
        configuration.protocolConfiguration = settings
        configuration.isOnDemandEnabled = false
        
        try NEVPNManager.shared().loadFromPreferences { [weak self] error in
          if let error = error {
            reject("CONNECTION_ERROR", error.localizedDescription, nil)
            return
          }
          
          self?.vpnManager.protocolConfiguration = settings
          self?.vpnManager.isEnabled = true
          
          try? self?.vpnManager.saveToPreferences()
          try? self?.vpnManager.loadFromPreferences()
          
          do {
            try self?.vpnManager.connection.startVPNTunnel()
            resolve(["success": true, "message": "VPN Connected"])
          } catch {
            reject("CONNECTION_ERROR", error.localizedDescription, nil)
          }
        }
      } catch {
        reject("CONNECTION_ERROR", error.localizedDescription, nil)
      }
    }
  }
  
  @objc(disconnect:withRejecter:)
  func disconnect(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      self.vpnManager.connection.stopVPNTunnel()
      resolve(["success": true, "message": "VPN Disconnected"])
    }
  }
  
  @objc(getStatus:withRejecter:)
  func getStatus(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      let status: [String: Any] = [
        "connected": self.vpnManager.connection.status == .connected,
        "status": self.vpnManager.connection.status.rawValue
      ]
      resolve(status)
    }
  }
  
  @objc(setSettings:withResolver:withRejecter:)
  func setSettings(_ settings: [String: Any], resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    resolve(["success": true])
  }
  
  @objc(getServers:withRejecter:)
  func getServers(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // Return list of available VPN servers
    resolve(["servers": []])
  }
  
  @objc(getLogs:withResolver:withRejecter:)
  func getLogs(_ count: Int, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    resolve(["logs": []])
  }
}
