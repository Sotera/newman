package com.soteradefense.newman.etl.data.model;

public class SIMCard {

	private String dataFilePath;
	private Device device;
	private Contact[] contacts;
	private VoiceCall[] voiceCalls;
	private TextMessage[] textMessages;
	
	public String getDataFilePath() {
		return dataFilePath;
	}
	
	public void setDataFilePath(String dataFilePath) {
		this.dataFilePath = dataFilePath;
	}
	
	public Device getDevice() {
		return device;
	}
	
	public void setDevice(Device device) {
		this.device = device;
	}
	
	public Contact[] getContacts() {
		return contacts;
	}
	
	public void setContacts(Contact[] contacts) {
		this.contacts = contacts;
	}
	
	public VoiceCall[] getVoiceCalls() {
		return voiceCalls;
	}
	
	public void setVoiceCalls(VoiceCall[] voiceCalls) {
		this.voiceCalls = voiceCalls;
	}
	
	public TextMessage[] getTextMessages() {
		return textMessages;
	}
	
	public void setTextMessages(TextMessage[] textMessages) {
		this.textMessages = textMessages;
	}
	
	
	
}
