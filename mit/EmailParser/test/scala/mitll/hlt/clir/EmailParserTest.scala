/**
 * EmailParserTest.scala : Unit tests for EmailParser
 *
 * @author Michael A. Coury <BR>
 * <tt><a href=mailto:michael.coury@ll.mit.edu>michael.coury@ll.mit.edu</a></tt> <BR>
 * Copyright &copy; 2014 Massachusetts Institute of Technology, Lincoln Laboratory
 */
package mitll.hlt.clir

import tools.{UnitTester, TextLog}
import scala.collection.mutable.{HashMap, MultiMap, Set}
import scala.io.Source
import java.io.{File, PrintStream}

object EmailParserTest extends UnitTester {
  // It is necessary to specify which class loader to use because the make project does not use
  // the default class loader in the TestConfig class. Without this line, the log4j property file
  // will not be on the classpath. Also, this is necessary for TestConfig and JavaMail to work
  // nicely together. Details as follows...
  //
  // JavaMail relies on JavaBeans Activation Framework, which provides the javax.activation package
  // (included in jdk 1.6 and newer). JAF uses the context class loader to load classes. If that
  // fails, it uses the class loader that loaded the JAF classes.  When JAF is packaged with the
  // application, the JAF classes are loaded by the same class loader as the other application
  // classes, so even if the context class loader isn't set JAF can find the other application
  // classes.  When JAF is part of the JDK, the JAF classes are loaded by the system class loader.
  // Without the context class loader being set, JAF has no way to find the appropriate class loader
  // to load application classes.
  Thread.currentThread.setContextClassLoader(this.getClass.getClassLoader)

  tlog = TextLog(new PrintStream(System.err, true, "UTF-8"))
  val resourcesDir = "test/resources"
  val (emailDir, emailSuffix) = (resourcesDir+"/email", ".eml")
  val (textDir, textSuffix) = (resourcesDir+"/text", ".txt")
  val emailsToProcess = new File(emailDir).listFiles.filter(_.getName.endsWith(emailSuffix))
  val numEmails = emailsToProcess.size
  val defaultCharset = "UTF-8"

  // TODO: I shouldn't have to redefine attachmentTypes
  val attachmentTypes = new HashMap[String, Set[String]] with MultiMap[String, String]
  attachmentTypes.addBinding("none", "text/html")
  attachmentTypes.addBinding("some", "message/rfc822")
  attachmentTypes.addBinding("some", "text/plain")
  attachmentTypes.addBinding("some", "text/rtf")
  attachmentTypes.addBinding("some", "application/rtf")
  attachmentTypes.addBinding("more", "application/pdf")
  attachmentTypes.addBinding("more", "application/msword")
  attachmentTypes.addBinding("more", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
  attachmentTypes.addBinding("extra", "application/vnd.ms-excel")
  attachmentTypes.addBinding("extra", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  attachmentTypes.addBinding("extra", "application/vnd.ms-powerpoint")
  attachmentTypes.addBinding("extra", "application/vnd.openxmlformats-officedocument.presentationml.presentation")
  attachmentTypes.addBinding("extra", "application/octet-stream")

  test("attachmentTypes: none, some, more, extra") {
    val attachmentsToProcess = Set[String]()
    val attachmentGroups = List("none", "some", "more", "extra")
    for (group <- attachmentGroups) {
      attachmentsToProcess ++= attachmentTypes(group)
      val textDir = resourcesDir+"/text."+group+"_attachments"
      var numProcessed = 0
      for (email <- emailsToProcess) {
        numProcessed += 1
        val emailFn = email.getName
        tlog.unit("["+group+"] Processing email ("+numProcessed+" of "+numEmails+"): "+emailFn)
        val ep = new EmailParser(email.getPath, attachmentsToProcess, defaultCharset)
        //val text = ep.extractText.mkString("\n").trim
        val text = ep.extractText.map{ case (part, fn) => part}.mkString("\n").replaceAll("\n{2,}", "\n").trim
        text shouldBe Source.fromFile(textDir+"/"+emailFn.dropRight(4)+textSuffix, defaultCharset).mkString.trim
      }
    }
  }

  test("Decode header field") {
    val qpHeader = "=?iso-8859-1?Q?por_qu=E9_tienen_que_pr=F3ximos_cincos_a=F1os?="
    val plainHeader = "this is a plain text header"
    val base64Header1 = "=?ISO-8859-1?B?SWYgeW91IGNhbiByZWFkIHRoaXMgeW8=?="
    val base64Header2 = "=?ISO-8859-2?B?dSB1bmRlcnN0YW5kIHRoZSBleGFtcGxlLg==?="
    val unknownEncodingHeader = "=?iso-8859-1?Z?por_qu=E9_tienen_que_pr=F3ximos_cincos_a=F1os?="
    
    val ep = new EmailParser(emailsToProcess.head.getPath, attachmentTypes("none"), defaultCharset)
    ep.decodeHeader(qpHeader) shouldBe "por qué tienen que próximos cincos años"
    ep.decodeHeader(plainHeader) shouldBe plainHeader
    ep.decodeHeader(base64Header1) shouldBe "If you can read this yo"
    ep.decodeHeader(base64Header2) shouldBe "u understand the example."
    ep.decodeHeader(unknownEncodingHeader) shouldBe "por_qu=E9_tienen_que_pr=F3ximos_cincos_a=F1os"
  }

  test("Transcode") {
    val ep = new EmailParser(emailsToProcess.head.getPath, attachmentTypes("none"), defaultCharset) //TODO: I shouldn't have to instantiate EmailParser to use transcode
    def hexToBytes(hex: String) : Array[Byte] = hex.replaceAll("[^0-9A-Fa-f]", "").sliding(2, 2).toArray.map(Integer.parseInt(_, 16).toByte)
    
    // Raw hex values and their corresponding characters
    val iso88591Hex = "E8 EC F2 A1 BF C1 C5 C7 E9 ED F1 FD" // èìò¡¿ÁÅÇéíñý
    val iso88596Hex = "61 62 63 64 D0 D1 D2 D3 D4 D5 C8 C9 CA CB CC E6 E7 E8 E9 EA" // abcdذرزسشصبةتثجنهوىي
    val big5Hex = "A1 D3 A1 50 A1 D1 71 72 C7 52 A4 43 B0 AF B3 C7 D8 5D B0 B0" // ±·×qrズ七偺傑傒偽
    val koi8uHex = "C0 C1 C2 CD CE DD DE E2 E3 E4 EA F0 F1 F2 F3 FE FF" // юабмнщчБЦДЙПЯРСЧЪ
    
    // Convert raw hex values to bytes
    val iso88591Bytes = hexToBytes(iso88591Hex)
    val iso88596Bytes = hexToBytes(iso88596Hex)
    val big5Bytes = hexToBytes(big5Hex)
    val koi8uBytes = hexToBytes(koi8uHex)
    iso88591Bytes.deep shouldBe Array(-24, -20, -14, -95, -65, -63, -59, -57, -23, -19, -15, -3).deep
    iso88596Bytes.deep shouldBe Array(97, 98, 99, 100, -48, -47, -46, -45, -44, -43, -56, -55, -54, -53, -52, -26, -25, -24, -23, -22).deep
    big5Bytes.deep shouldBe Array(-95, -45, -95, 80, -95, -47, 113, 114, -57, 82, -92, 67, -80, -81, -77, -57, -40, 93, -80, -80).deep
    koi8uBytes.deep shouldBe Array(-64, -63, -62, -51, -50, -35, -34, -30, -29, -28, -22, -16, -15, -14, -13, -2, -1).deep
    
    // Convert bytes to encoded string
    val iso88591String = new String(iso88591Bytes, "ISO-8859-1")
    val iso88596String = new String(iso88596Bytes, "ISO-8859-6")
    val big5String = new String(big5Bytes, "Big5")
    val koi8uString = new String(koi8uBytes, "KOI8-U")
    iso88591String.getBytes("ISO-8859-1").map("%02X" format _).mkString(" ") shouldBe iso88591Hex
    iso88596String.getBytes("ISO-8859-6").map("%02X" format _).mkString(" ") shouldBe iso88596Hex
    big5String.getBytes("Big5").map("%02X" format _).mkString(" ") shouldBe big5Hex
    koi8uString.getBytes("KOI8-U").map("%02X" format _).mkString(" ") shouldBe koi8uHex
    
    // Transcode the string from whatever encoding to utf8
    val utf8StringFromIso88591 = ep.transcode("ISO-8859-1", "UTF-8", iso88591String)
    val utf8StringFromIso88596 = ep.transcode("ISO-8859-6", "UTF-8", iso88596String)
    val utf8StringFromBig5 = ep.transcode("Big5", "UTF-8", big5String)
    val utf8StringFromKoi8u = ep.transcode("KOI8-U", "UTF-8", koi8uString)
    utf8StringFromIso88591.getBytes("UTF-8").map("%02X" format _).mkString(" ") shouldBe "C3 A8 C3 AC C3 B2 C2 A1 C2 BF C3 81 C3 85 C3 87 C3 A9 C3 AD C3 B1 C3 BD"
    utf8StringFromIso88596.getBytes("UTF-8").map("%02X" format _).mkString(" ") shouldBe "61 62 63 64 D8 B0 D8 B1 D8 B2 D8 B3 D8 B4 D8 B5 D8 A8 D8 A9 D8 AA D8 AB D8 AC D9 86 D9 87 D9 88 D9 89 D9 8A"
    utf8StringFromBig5.getBytes("UTF-8").map("%02X" format _).mkString(" ") shouldBe "C2 B1 C2 B7 C3 97 71 72 E3 82 BA E4 B8 83 E5 81 BA E5 82 91 E5 82 92 E5 81 BD"
    utf8StringFromKoi8u.getBytes("UTF-8").map("%02X" format _).mkString(" ") shouldBe "D1 8E D0 B0 D0 B1 D0 BC D0 BD D1 89 D1 87 D0 91 D0 A6 D0 94 D0 99 D0 9F D0 AF D0 A0 D0 A1 D0 A7 D0 AA"
  }
  
  test("Unwrap") {
    val unwrapDir = "test/resources/unwrap"
    val unwrapFn = "test_unwrap.eml"
    val attachmentsToProcess : Set[String] = attachmentTypes("none")
    val ep = new EmailParser(unwrapDir+"/"+unwrapFn, attachmentsToProcess, defaultCharset)
    val text = ep.extractText
    val unwrapped = text.map{ case (part, fn) => ep.unwrap(part.split("\n")).mkString("\n")}.mkString("\n").replaceAll("\n{2,}", "\n").trim
    unwrapped shouldBe Source.fromFile(unwrapDir+"/"+unwrapFn.dropRight(4)+textSuffix, defaultCharset).mkString.trim
  }
}
