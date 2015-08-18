package com.soteradefense.newman.etl.data.model;

public class Device {

	private String deviceName;
	private String devicePhase;
	private String deviceModel;
	private String deviceUID;
	private String[] languages;
	private String serviceProvider;
	private String serviceSubscriber;
	private String serviceNetworkCode;
	
	public String getDeviceName() {
		return deviceName;
	}
	
	public void setDeviceName(String deviceName) {
		this.deviceName = deviceName;
	}
	
	public String getDevicePhase() {
		return devicePhase;
	}
	
	public void setDevicePhase(String devicePhase) {
		this.devicePhase = devicePhase;
	}
	
	public String getDeviceModel() {
		return deviceModel;
	}
	
	public void setDeviceModel(String deviceModel) {
		this.deviceModel = deviceModel;
	}
	
	public String getDeviceUID() {
		return deviceUID;
	}
	
	public void setDeviceUID(String deviceUID) {
		this.deviceUID = deviceUID;
	}
	
	public String[] getLanguages() {
		return languages;
	}
	
	public void setLanguages(String[] languages) {
		this.languages = languages;
	}
	
	public String getServiceProvider() {
		return serviceProvider;
	}
	
	public void setServiceProvider(String serviceProvider) {
		this.serviceProvider = serviceProvider;
	}
	
	public String getServiceSubscriber() {
		return serviceSubscriber;
	}
	
	public void setServiceSubscriber(String serviceSubscriber) {
		this.serviceSubscriber = serviceSubscriber;
	}
	
	public String getServiceNetworkCode() {
		return serviceNetworkCode;
	}
	
	public void setServiceNetworkCode(String serviceNetworkCode) {
		this.serviceNetworkCode = serviceNetworkCode;
	}
	
}
