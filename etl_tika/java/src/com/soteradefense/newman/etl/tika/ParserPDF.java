package com.soteradefense.newman.etl.tika;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.apache.tika.exception.TikaException;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.parser.pdf.PDFParser;
import org.apache.tika.sax.BodyContentHandler;
import org.apache.tika.sax.ToXMLContentHandler;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.xml.sax.ContentHandler;
import org.xml.sax.SAXException;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.soteradefense.newman.etl.data.model.Contact;
import com.soteradefense.newman.etl.data.model.Device;
import com.soteradefense.newman.etl.data.model.SIMCard;
import com.soteradefense.newman.etl.data.model.TextMessage;
import com.soteradefense.newman.etl.data.model.VoiceCall;


public class ParserPDF {

	public static void main(final String[] args) throws IOException,TikaException {

		if (args.length == 0) {
			System.exit( 1 );
		}
		
		String sourceFilePath = args[0];
		if (sourceFilePath == null || sourceFilePath.isEmpty()) {
			System.exit( 1 );
		}
		
		File file = new File( sourceFilePath );
		if (file.exists()) {
			System.out.println( "Source Data Path : '" +  sourceFilePath + "'\n" );
			
			String targetFilePath = sourceFilePath + ".json";
			if (args.length > 1 && args[1] != null) {
				targetFilePath = args[1];
			}
			
			System.out.println( "Target Data Path : '" +  targetFilePath + "'\n" );
			
			ParserPDF parserPDF = new ParserPDF();
			String text = parserPDF.parse( file );
			
			parserPDF.saveAs(targetFilePath, text);

			System.exit( 0 );
		}
		else {
			System.exit( 1 );
		}

	}
	
	public ParserPDF() {
		
	}
	
	public String parse( File file ) throws FileNotFoundException {
		
		String text = extractFromPDF( file ); 
		
		SIMCard simCard = new SIMCard();
		simCard.setDataFilePath( file.getAbsolutePath() );
		
		Device device = new Device();
		Set<String> unparsedContactSet = new HashSet<String>();
		Set<String> unparsedVoiceCallSet = new HashSet<String>();
		Set<String> unparsedTextMessageSet = new HashSet<String>();

		Document doc = Jsoup.parse( text );
		Elements elementSet = doc.select("p");
		String textContent;
		for (Element element : elementSet) {

			textContent = element.text();
			// get the device-related attribute

			if (textContent.startsWith("Device Name") ||
				textContent.startsWith("Phase") ||
				textContent.startsWith("Sub Model") ||
				textContent.startsWith("SIM Identification (ICCID)") ||
				textContent.startsWith("Language Preference") ||
				textContent.startsWith("Service Provider Name") ||
				textContent.startsWith("Subscriber Id (IMSI)") ||
				textContent.startsWith("Network Code (from IMSI)")) {
				device = parseDevice(textContent, device);
			}
			
			if (textContent.startsWith("Name")) {
				unparsedContactSet.add( textContent );
			}
			
			if (textContent.startsWith("Type")) {
				unparsedVoiceCallSet.add( textContent );
			}
			
			if (textContent.startsWith("Tel From")) {
				unparsedTextMessageSet.add( textContent );
			}
		}
		
		simCard.setDevice(device);
		
		List<Contact> parsedContactList = new ArrayList<Contact>();
		for (String element : unparsedContactSet) {
			Contact container = parseContact(element);
			parsedContactList.add(container);
		}
		Contact[] parsedContactArray = parsedContactList.toArray( new Contact[parsedContactList.size()] );
		simCard.setContacts(parsedContactArray);
		
		List<VoiceCall> parsedCallList = new ArrayList<VoiceCall>();
		for (String element : unparsedVoiceCallSet) {
			VoiceCall container = parseVoiceCall(element);
			parsedCallList.add(container);
		}
		VoiceCall[] parsedCallArray = parsedCallList.toArray( new VoiceCall[parsedCallList.size()] );
		simCard.setVoiceCalls(parsedCallArray);
		
		List<TextMessage> parsedTextList = new ArrayList<TextMessage>();
		for (String element : unparsedTextMessageSet) {
			TextMessage container = parseTextMessage(element);
			parsedTextList.add(container);
		}
		TextMessage[] parsedTextArray = parsedTextList.toArray( new TextMessage[parsedTextList.size()] );
		simCard.setTextMessages(parsedTextArray);
		
		String jsonText = toJSON( simCard );
		System.out.println( jsonText );
		
		return jsonText;
	}
	
	public String extractFromPDF( File file ) throws FileNotFoundException {
		
		FileInputStream inputstream = new FileInputStream( file );
		
		//BodyContentHandler handler = new BodyContentHandler();
		ToXMLContentHandler handler = new ToXMLContentHandler();
		
		Metadata metadata = new Metadata();

		ParseContext parseContext = new ParseContext();

		//parsing the document using PDF parser
		PDFParser pdfparser = new PDFParser(); 
		
		String text;
		
		try {
			try {
				pdfparser.parse(inputstream, handler, metadata, parseContext);				
			}
			finally {
				inputstream.close();
			}
		}
		catch (SAXException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		} catch (TikaException e) {
			e.printStackTrace();
		}

		//getting the content of the document
		text = filter( handler.toString() );

		//System.out.println("Contents of the PDF :" + text);
		
		
		//getting meta-data of the document
		/*
		System.out.println("Metadata of the PDF:");
		String[] metadataNames = metadata.names();

		for(String name : metadataNames) {
			System.out.println(name+ " : " + metadata.get(name));
		}
		*/
		
		return text;
	}
	
	
	public String filter( String rawText ) {
		if(rawText == null || rawText.isEmpty()) {
			return rawText;
		}
		
		Document doc = Jsoup.parse( rawText );
		Elements elementSet = doc.select("p");
		String elementContent;
		for (Element element : elementSet) {
			elementContent = element.text();
			if (elementContent.isEmpty()) {
				element.remove();
			}
			if (elementContent.startsWith("Back to top")) {
				element.remove();
			}
			if (elementContent.indexOf("Page") != -1 && elementContent.indexOf("of") != -1 ) {
				element.remove();
			}
		}
		
		
		String filteredText = doc.toString();
		filteredText = filteredText.replace( "<div class=\"page\">", "" );
		filteredText = filteredText.replace( "</div>", "" );
		filteredText = filteredText.replaceAll("(?m)^[ \t]*\r?\n", "");
				
		System.out.println( filteredText );
		return filteredText;
	}
	
	public Device parseDevice( String text, Device device ) {
		if (text== null || text.isEmpty()) {
			return null;
		}
		
		if (device == null) {
			device = new Device();
		}
		
		String keyOfDeviceName = "Device Name";
		String keyOfDevicePhase = "Phase";
		String keyOfDeviceSubModel = "Sub Model";
		String keyOfDeviceSIMID = "SIM Identification (ICCID)";
	    String keyOfDeviceLangPref = "Language Preference";
		String keyOfDeviceServiceProvider = "Service Provider Name";
		String keyOfDeviceSubscriberID = "Subscriber Id (IMSI)";
		String keyOfDeviceNetworkCode = "Network Code (from IMSI)";
		
		if (text.startsWith( keyOfDeviceName )) {
			int index = text.indexOf( keyOfDeviceName );
			String value = text.substring((index + keyOfDeviceName.length()), text.length()).trim();
			System.out.println( "\t" + keyOfDeviceName + " '" + value + "'" );
			device.setDeviceName( value );
		}
		
		if (text.startsWith( keyOfDevicePhase )) {
			int index = text.indexOf( keyOfDevicePhase );
			String value = text.substring((index + keyOfDevicePhase.length()), text.length()).trim();
			System.out.println( "\t" + keyOfDevicePhase + " '" + value + "'" );
			device.setDevicePhase( value );
		}
		
		if (text.startsWith( keyOfDeviceSubModel )) {
			int index = text.indexOf( keyOfDeviceSubModel );
			String value = text.substring((index + keyOfDeviceSubModel.length()), text.length()).trim();
			System.out.println( "\t" + keyOfDeviceSubModel + " '" + value + "'" );
			device.setDeviceModel( value );
		}
		
		if (text.startsWith( keyOfDeviceSIMID )) {
			int indexStart = text.indexOf( keyOfDeviceSIMID );
			int indexEnd = text.lastIndexOf( "SIM" );
			if (indexEnd == -1) {
				indexEnd = text.length();
			}
			String value = text.substring((indexStart + keyOfDeviceSIMID.length()), indexEnd).trim();
			System.out.println( "\t" + keyOfDeviceSIMID + " '" + value + "'" );
			device.setDeviceUID( value );
		}
		
		if (text.startsWith( keyOfDeviceLangPref )) {
			int indexStart = text.indexOf( keyOfDeviceLangPref );
			int indexEnd = text.lastIndexOf( "SIM" );
			if (indexEnd == -1) {
				indexEnd = text.length();
			}
			String value = text.substring((indexStart + keyOfDeviceLangPref.length()), indexEnd).trim();
			value = value.replace(" ", "");
			System.out.println( "\t" + keyOfDeviceLangPref + " '" + value + "'" );
			String[] langArray = value.split(";");
			device.setLanguages(langArray);
		}
		
		if (text.startsWith( keyOfDeviceServiceProvider )) {
			int indexStart = text.indexOf( keyOfDeviceServiceProvider );
			int indexEnd = text.lastIndexOf( "SIM" );
			if (indexEnd == -1) {
				indexEnd = text.length();
			}
			String value = text.substring((indexStart + keyOfDeviceServiceProvider.length()), indexEnd).trim();
			System.out.println( "\t" + keyOfDeviceServiceProvider + " '" + value + "'" );
			device.setServiceProvider( value );
		}
		
		if (text.startsWith( keyOfDeviceSubscriberID )) {
			int indexStart = text.indexOf( keyOfDeviceSubscriberID );
			int indexEnd = text.lastIndexOf( "SIM" );
			if (indexEnd == -1) {
				indexEnd = text.length();
			}
			String value = text.substring((indexStart + keyOfDeviceSubscriberID.length()), indexEnd).trim();
			System.out.println( "\t" + keyOfDeviceSubscriberID + " '" + value + "'" );
			device.setServiceProvider( value );
		}
		
		if (text.startsWith( keyOfDeviceNetworkCode )) {
			int indexStart = text.indexOf( keyOfDeviceNetworkCode );
			String value = text.substring((indexStart + keyOfDeviceNetworkCode.length()), text.length()).trim();
			System.out.println( "\t" + keyOfDeviceNetworkCode + " '" + value + "'" );
			device.setServiceNetworkCode( value );
		}
		
		return device;
	}
	
	public Contact parseContact( String text ) {
		if (text== null || text.isEmpty()) {
			return null;
		}
		
		System.out.println("parseContact(" + text + ")");
		
		String keyOfName = "Name";
		String keyOfPhone = "Tel";
		String keyOfStorage = "Storage";
		
		int indexOfName = text.indexOf( keyOfName );
		int indexOfPhone = text.indexOf( keyOfPhone );
		int indexOfStorage = text.indexOf( keyOfStorage );
		
		Contact container = new Contact();
		
		String name = text.substring((indexOfName + keyOfName.length()), indexOfPhone).trim();
		System.out.println( "\t" + keyOfName + " '" + name + "'" );
		container.setName( name );
		
		if (indexOfStorage > -1) {
			String phone = text.substring((indexOfPhone + keyOfPhone.length()), indexOfStorage).trim();
			System.out.println( "\t" + keyOfPhone + " '" + phone + "'" );
			container.setPhone( phone );
		}
		else {
			String phone = text.substring((indexOfPhone + keyOfPhone.length())).trim();
			System.out.println( "\t" + keyOfPhone + " '" + phone + "'" );
			container.setPhone( phone );
		}
		
		return container;
	}
	
	public VoiceCall parseVoiceCall( String text ) {
		if (text== null || text.isEmpty()) {
			return null;
		}
		
		System.out.println("parseVoiceCall(" + text + ")");
		
		String keyOfCallType = "Type";
		String keyOfPhone = "Tel To";
		String keyOfNameMatch = "To (Matched)";
		String keyOfStorage = "Storage";
		
		int indexOfCallType = text.indexOf( keyOfCallType );
		int indexOfPhone = text.indexOf( keyOfPhone );
		int indexOfNameMatch = text.indexOf( keyOfNameMatch );
		int indexOfStorage = text.indexOf( keyOfStorage );
		
		VoiceCall container = new VoiceCall();
		
		String callType = text.substring((indexOfCallType + keyOfCallType.length()), indexOfPhone).trim();
		System.out.println( "\t" + keyOfCallType + " '" + callType + "'" );
		container.setCallType( callType );
		
		int indexOfPhoneEnd = text.length();
		String name = "";
		if (indexOfNameMatch > -1) {
			
			indexOfPhoneEnd = indexOfNameMatch;
			
			if (indexOfStorage > -1) {
				name = text.substring((indexOfNameMatch + keyOfNameMatch.length()), indexOfStorage).trim();
				container.setName( name );
			}
		}
		else {
			if (indexOfStorage > -1) {
				indexOfPhoneEnd = indexOfStorage;
			}
		}
		
		String phone = text.substring((indexOfPhone + keyOfPhone.length()), indexOfPhoneEnd).trim();
		System.out.println( "\t" + keyOfPhone + " '" + phone + "'" );
		container.setPhone( phone );
		
		
		return container;
	}
	
	public TextMessage parseTextMessage( String text ) {
		if (text== null || text.isEmpty()) {
			return null;
		}
		
		System.out.println("parseTextMessage(" + text + ")");
		
		String keyOfPhone = "Tel From";
		String keyOfText = "Text";
		String keyOfTime = "Time";
		String keyOfStatus = "Status";
		String keyOfStorage = "Storage";
		String keyOfTextType = "Type";
		String keyOfServiceCenter = "Service Center";
		
		int indexOfPhone = text.indexOf( keyOfPhone );
		int indexOfText = text.indexOf( keyOfText );
		int indexOfTime = text.indexOf( keyOfTime );
		int indexOfStatus = text.indexOf( keyOfStatus );
		int indexOfStorage = text.indexOf( keyOfStorage );
		int indexOfTextType = text.indexOf( keyOfTextType );
		int indexOfServiceCenter = text.indexOf( keyOfServiceCenter );
		
		TextMessage container = new TextMessage();
		
		String phone = text.substring((indexOfPhone + keyOfPhone.length()), indexOfText).trim();
		System.out.println( "\t" + keyOfPhone + " '" + phone + "'" );
		container.setPhone( phone );
		
		if (indexOfTime > -1) {
			String messageText = text.substring((indexOfText + keyOfText.length()), indexOfTime).trim();
			System.out.println( "\t" + keyOfText + " '" + messageText + "'" );
			container.setText(messageText);

			String time = text.substring((indexOfTime + keyOfTime.length()), indexOfStatus).trim();
			System.out.println( "\t" + keyOfTime + " '" + time + "'" );
			container.setTime(time);

			if (indexOfStorage > -1) {

				String status = text.substring((indexOfStatus + keyOfStatus.length()), indexOfStorage).trim();
				System.out.println( "\t" + keyOfStatus + " '" + status + "'" );
				container.setStatus(status);

				String textType = text.substring((indexOfTextType + keyOfTextType.length()), indexOfServiceCenter).trim();
				System.out.println( "\t" + keyOfTextType + " '" + textType + "'" );
				container.setMessageType(textType);

				String serviceCenter = text.substring((indexOfServiceCenter + keyOfServiceCenter.length())).trim();
				System.out.println( "\t" + keyOfServiceCenter + " '" + serviceCenter + "'" );
				container.setServiceCenter(serviceCenter);

			}
			else {

				String status = text.substring((indexOfStatus + keyOfStatus.length())).trim();
				System.out.println( "\t" + keyOfStatus + " '" + status + "'" );
				container.setStatus(status);

			}
		}
	

		return container;
	}
	
	String toJSON( Object object ) {
		String jsonText = null;
		
		if (object instanceof SIMCard) {
			//Gson gson = new Gson();
			Gson gson = new GsonBuilder().setPrettyPrinting().create();
			
			jsonText = gson.toJson((SIMCard)object);
		}
		
		return jsonText;
	}
	
	public void saveAs( String filePath, String content ) {
		if (filePath == null || filePath.isEmpty()) {
			return;
		}
		
		File file = new File( filePath );
        FileOutputStream fileOutStream = null;
        OutputStreamWriter fileOutWriter = null;
        
        try {
        	try {
        		file.createNewFile();
        		fileOutStream = new FileOutputStream( file );
        		fileOutWriter =new OutputStreamWriter(fileOutStream);
        		fileOutWriter.append( content );
        	}
        	finally {
        		if (fileOutWriter != null) {
        			fileOutWriter.close();
        		}
        		if (fileOutStream != null) {
        			fileOutStream.close();
        		}
        	}
        }
        catch (IOException e) {
			e.printStackTrace();
		}


	}
}
