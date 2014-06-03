/**
 * EmailParserTest.scala : Unit tests for EmailParser
 *
 * @author Michael A. Coury <BR>
 * <tt><a href=mailto:michael.coury@ll.mit.edu>michael.coury@ll.mit.edu</a></tt> <BR>
 * Copyright &copy; 2014 Massachusetts Institute of Technology, Lincoln Laboratory
 */
package mitll.hlt.clir

import scala.collection.JavaConversions._
import scala.collection.mutable.{ListBuffer, Map, HashMap, MultiMap, Set}
import scala.io.Source
import java.io.{File, OutputStreamWriter, InputStream, BufferedWriter, ByteArrayInputStream, ByteArrayOutputStream, FileInputStream, FileOutputStream, PrintWriter, StringWriter}
import java.nio.ByteBuffer
import java.nio.charset.Charset
import java.text.Normalizer
import java.text.Normalizer.Form
import java.util.{ArrayList, Properties}
import javax.activation.DataSource
import javax.mail.{Address, Multipart, Part, Session}
import javax.mail.internet.{MimeMessage, MimePart, MimeBodyPart}
import org.apache.commons.codec.binary.Base64
import org.apache.commons.codec.net._
import org.apache.commons.io.IOUtils
import org.apache.commons.mail.util.MimeMessageParser
import org.apache.logging.log4j.{Logger, LogManager}
import org.apache.tika.metadata.Metadata
import org.apache.tika.parser.{AutoDetectParser, ParseContext}
import org.apache.tika.parser.html.{BoilerpipeContentHandler, HtmlParser}
import org.apache.tika.sax.{WriteOutContentHandler, BodyContentHandler}
import org.docopt.Docopt
import org.xml.sax.ContentHandler

case class Usage(conf : Map[String, Any]) extends Exception { override def toString = s"Usage(${conf})" }
case class MissingPositionals(conf : Map[String, Any]) extends Exception { override def toString = s"MissingPositionals(${conf})" }
object EmailParserLog { val log = LogManager.getLogger(classOf[EmailParser]) }

/**
 * Parses a MimeMessage and stores the individual parts such a plain text, HTML text, and attachments.
 * 
 * This code extends the functionality of the MimeMessageParser by extracting the charset for plain
 * text, HTML text, and attachments.
 */
class MyMimeMessageParser(mimeMessage: MimeMessage) extends MimeMessageParser(mimeMessage) {
  import EmailParserLog._
  
  var isMultiPart : Boolean = false
  var plainContent : String = null
  var htmlContent : String = null
  var attachments = Vector[DataSource]()
  var plainContentCharset : String = null
  var htmlContentCharset : String = null
  var attachmentCharsets = Vector[String]()
  
  val charsetRegex = """(?s).*\scharset="?([\w-]+)"?[\s;]*.*""".r
  def getCharset(contentTypeString : String) : String = {
    contentTypeString match {
      case charsetRegex(charset) => charset // TODO: Should I normalize the charset name? toLower?
      case _ => "" // TODO: Should I set this to a default value?
    }
  }
  
  override def hasPlainContent = if(plainContent == null) false else true
  override def hasHtmlContent = if(htmlContent == null) false else true
  override def hasAttachments = if(attachments.size > 0) true else false
  
  /**
   * Extracts the content of a MimeMessage recursively.
   *
   * @param parent               The parent Multipart
   * @param part                 The current MimePart
   * @throws MessagingException  Parsing the MimeMessage failed
   * @throws IOException         Parsing the MimeMessage failed
   */
  override def parse(parent: Multipart, part: MimePart) = {
    if (part.isMimeType("text/plain") && (plainContent == null) && (!Part.ATTACHMENT.equalsIgnoreCase(part.getDisposition))) {
      plainContent = part.getContent.asInstanceOf[String]
      plainContentCharset = getCharset(part.getContentType)
    } else if (part.isMimeType("text/html") && (htmlContent == null) && (!Part.ATTACHMENT.equalsIgnoreCase(part.getDisposition))) {
      htmlContent = part.getContent.asInstanceOf[String]
      htmlContentCharset = getCharset(part.getContentType)
    } else if (part.isMimeType("multipart/*")) {
      isMultiPart = true
      val mp = part.getContent.asInstanceOf[Multipart]
      val count = mp.getCount

      // iterate over all MimeBodyPart
      for (i <- 0 until count)
        parse(mp, mp.getBodyPart(i).asInstanceOf[MimeBodyPart])
    } else {
      attachments = attachments :+ createDataSource(parent, part)
      attachmentCharsets = attachmentCharsets :+ getCharset(part.getContentType)
    }
  }

  /**
   * Does the actual extraction.
   *
   * @return this instance
   * @throws Exception       Parsing the mime message failed
   */
  override def parse() : MyMimeMessageParser = {
    this.parse(null, mimeMessage)
    return this
  }
}

/**
 * Extract text from an email and its attachments if they match a type specified by the caller.
 * @param fn                 Path to raw email text in MIME format
 * @param attachmentTypes    The types of attachments to process
 * @param defaultCharset     The default charset to use if not specified in the MIME header
 */
class EmailParser(fn:String, attachmentTypes:Set[String], defaultCharset:String = "UTF-8") {
  import EmailParserLog._  

  val props = new Properties()
  props.put("mail.mime.parameters.strict", "false")
  props.put("mail.mime.address.strict", "false")
  props.put("mail.mime.base64.ignoreerrors", "true")
  props.put("mail.mime.charset", defaultCharset)
  props.put("mail.mime.ignoreunknownencoding", "true")

  val session = Session.getDefaultInstance(props, null)
  val emailInputStream = new FileInputStream(fn)
  val email = new MimeMessage(session, emailInputStream)
  val emailParser = new MyMimeMessageParser(email)
  
  // The following is a note on the charset field from the MIME standard:
  //   NOTE: The term "character set" was originally to describe such
  //   straightforward schemes as US-ASCII and ISO-8859-1 which have a
  //   simple one-to-one mapping from single octets to single characters.
  //   Multi-octet coded character sets and switching techniques make the
  //   situation more complex. For example, some communities use the term
  //   "character encoding" for what MIME calls a "character set", while
  //   using the phrase "coded character set" to denote an abstract mapping
  //   from integers (not octets) to characters.
  //
  //   Three transformations are currently defined: identity, the "quoted-
  //   printable" encoding, and the "base64" encoding.  The domains are
  //   "binary", "8bit" and "7bit".
  //
  //   The Content-Transfer-Encoding values "7bit", "8bit", and "binary" all
  //   mean that the identity (i.e. NO) encoding transformation has been
  //   performed.  As such, they serve simply as indicators of the domain of
  //   the body data, and provide useful information about the sort of
  //   encoding that might be needed for transmission in a given transport
  //   system.
  //
  //   The quoted-printable and base64 encodings transform their input from
  //   an arbitrary domain into material in the "7bit" range, thus making it
  //   safe to carry over restricted transports.  The specific definition of
  //   the transformations are given below.
  //
  //
  //   Suppose an entity has header fields such as:
  //      Content-Type: text/plain; charset=ISO-8859-1
  //      Content-transfer-encoding: base64
  //   This must be interpreted to mean that the body is a base64 US-ASCII
  //   encoding of data that was originally in ISO-8859-1, and will be in
  //   that character set again after decoding.
  //
  //  6.5.  Translating Encodings
  //   The quoted-printable and base64 encodings are designed so that
  //   conversion between them is possible.  The only issue that arises in
  //   such a conversion is the handling of hard line breaks in quoted-
  //   printable encoding output. When converting from quoted-printable to
  //   base64 a hard line break in the quoted-printable form represents a
  //   CRLF sequence in the canonical form of the data. It must therefore be
  //   converted to a corresponding encoded CRLF in the base64 form of the
  //   data.  Similarly, a CRLF sequence in the canonical form of the data
  //   obtained after base64 decoding must be converted to a quoted-
  //   printable hard line break, but ONLY when converting text data.

  /**
   * Convert a string from one encoding to another.
   * @param from    The original encoding of the string
   * @param to      The desired encoding
   * @param text    The string to transcode
   */
  def transcode(from: String, to: String, text: String) : String = {
    val inputBuffer = ByteBuffer.wrap(text.getBytes(from))
    val decodedInput = Charset.forName(from).decode(inputBuffer) // decode original charset
    val outputBuffer = Charset.forName(to).encode(decodedInput) // encode new charset
    var outputData = Array[Byte]()
    while (outputBuffer.remaining > 0) { outputData :+= outputBuffer.get }
    new String(outputData, to)
  }
  
  /**
   * Returns the header field represented as a UTF-8 String.  Sometimes the encoding and charset will be
   * specified in the String as quoted printable.  For example,
   *   - This subject line: por qué tienen que próximos cincos años
   *   - Will look like this: =?iso-8859-1?Q?por_qu=E9_tienen_que_pr=F3ximos_cincos_a=F1os?=
   * It is also possible for the header field to be represented as base64.
   * 
   * @param h    The header field that will be decoded into a UTF-8 String
   */
  def decodeHeader(h: String) : String = {
    // TODO: I am assuming the entire line to be encoded, however it is possible for this special formatting to be embedded into other text
    val encRegex = """=\?(.*)\?(.*)\?(.*)\?=""".r
    h match {
      case encRegex(charset, encoding, encodedHeader) =>
        encoding match {
          case "B"|"b" => // transcode(charset, "UTF-8", decodeBase64(encodedHeader, charset))
            val bCodec = new BCodec(charset)
            val decodedHeader = bCodec.decode(h)
            transcode(charset, "UTF-8", decodedHeader)
          case "Q"|"q" =>
            val qCodec = new QCodec(charset)
            val decodedHeader = qCodec.decode(h)
            transcode(charset, "UTF-8", decodedHeader)
          case _ =>
            log.warn("Unknown encoding: " + encoding)
            encodedHeader
        }
      case _ => h
    }
  }

  final val newline = System.getProperty("line.separator")
  def charNorm(s: String) = Normalizer.normalize(s, Form.NFKC) // TODO: instead of normalizing nbsp characters, what if I used them to help decide how to unwrap text?
  def decodeBase64(stringToDecode: String, charset: String = defaultCharset) = new String(Base64.decodeBase64(stringToDecode), charset)
  def fixEOL(stringToFix: String) = stringToFix.replaceAll("""\r?\n""", newline)
  def rmNewline(s: String) = s.replaceAll("""\r?\n""", "")
  def trNewline(s: String) = s.replaceAll("("+newline+"""){2,}""", newline+newline)
  
  def unwrap(src : Iterable[String]) : Iterable[String] = { 
    val out = ListBuffer[String]()
    var (isWrapped, isWordBreak, foundBlank) = (false, false, false)
    def append(s: String) = if(isWrapped) out(out.indices.last) += {if(isWordBreak) s else " " + s} else out += s

    /* Don't unwrap if any of the following conditions are met:
     *   - Lines that start with one or more tabs or two or more spaces
     *   - Lines that end with .?!: followed by one or more tabs or 3 or more spaces
     *   - Lines are tab-delimited
     *   - Lines that follow an empty line
     */
    val notWrappedRegex = """^((\t+)|( {2,}))?(.+[\.\?!:])?((\t+)|( {3,}))?$""".r
    val headerRegex = """^\w+:.*$""".r
    val blankLineRegex = """^\s*$""".r
    val tabDelimRegex = """^([\w\s]+\t)+[\w\s]*$""".r
    val wordBreakRegex = """^.*-\s*$""".r
    //val nbspRegex = """\u00a0""".r  // must run 'scala -Dfile.encoding=utf8' and not charNorm in order for this to work
                                    
    src.foreach { line =>
      val normLine = charNorm(line) // this replaces nbsp with regular space
      if(foundBlank) append(normLine.trim)
      normLine match {
        //case nbspRegex() => println("nbsp: ["+normLine+"]")
        case headerRegex() =>
          isWrapped = false
          isWordBreak = false
          if(!foundBlank) append(normLine.trim)
          foundBlank = false
        case blankLineRegex(_*) =>
          isWrapped = false
          isWordBreak = false
          foundBlank = true
        case tabDelimRegex(_*) =>
          isWrapped = false
          isWordBreak = false
          if(!foundBlank) append(normLine.trim)
          foundBlank = false
        case wordBreakRegex() =>
          if(!foundBlank) append(normLine.trim.dropRight(1)) else out(out.indices.last) = out(out.indices.last).dropRight(1)
          isWordBreak = true
          isWrapped = true
          foundBlank = false
        case notWrappedRegex(_*) =>
          if(!foundBlank) append(normLine.trim)
          isWrapped = false
          isWordBreak = false
          foundBlank = false
        case _ =>
          if(!foundBlank) append(normLine.trim)
          isWrapped = if(normLine.trim.size > 50) true else false
          isWordBreak = false
          foundBlank = false
      }
    }
    out 
  }

  /**
   * Extract text from an attachment.
   * @param attachment    The attachment to parse
   * @param charset       The character set defined in the Content-Type MIME header field
   */
  def parse(attachment: DataSource, charset: String) : String = {
    val attachmentType = attachment.getContentType
    attachmentType match {
      case _ @ ("text/plain" | "text/rtf" | "application/rtf" | "text/html") =>
        // These parsers do not handle \r\n properly.  Pre-process attachments to use line.separator
        // TODO: The need to pre-process the EOL character could be an artifact of the MIME encoding.  The MIME standard talks about
        //       a known issue with EOL characters, and that extra care must be taken when parsing.
        val content = fixEOL(new String(IOUtils.toByteArray(attachment.getInputStream), charset))
        parse(content, attachmentType, charset)
      case _ => parse(attachment.getInputStream, attachmentType)
    }
  }

  /**
   * Extract text from content.
   * @param content        The content to parse
   * @param contentType    The type of data to parse
   * @param contentCharset The character set of the content to parse
   */
  def parse(content: String, contentType: String, contentCharset: String) : String = {
    contentType match {
      case _ @ "text/plain" =>
        // Some character sets like Chinese, Arabic, and Russian are encoded as Base64
        trNewline(charNorm(fixEOL(if (Base64.isBase64(content)) decodeBase64(content, contentCharset) else content))).trim
      case _ =>
        val inputStream = new ByteArrayInputStream(fixEOL(content).getBytes(contentCharset))
        parse(inputStream, contentType)
    }
  }

  /** 
   * Extract text from an InputStream using Apache Tika's AutoDetectParser.
   * @param inputStream    The stream of data to parse. This method closes the stream.
   * @param contentType    The type of data to parse
   */
  def parse(inputStream: InputStream, contentType: String) : String = {
    val (parser, metadata, context) = (new AutoDetectParser, new Metadata, new ParseContext)
    val writer = new StringWriter
    val disableWriteLimit = -1
    val handler = contentType match {
      case _ @ "text/html" => new BodyContentHandler(writer)
      case _ => new WriteOutContentHandler(writer, disableWriteLimit)
    }

    try parser.parse(inputStream, handler, metadata, context) finally inputStream.close
    
    // Note: Microsoft Word documents are saved as unicode by default.
    //       PDFParser only handles unicode and ascii.  In order to parse other encodings, you need help from OCR.
    // TODO: if not word or pdf, check metadata for Content-Encoding or Content-Type charset. else utf8
    //metadata.names.foreach{ n => log.debug("Metadata [name; value]: [" + n + "; "+ metadata.get(n) + "]") }
    trNewline(charNorm(fixEOL(new String(writer.getBuffer)))).trim
  }

  /**
   * Extract text from the email body and many common attachment types that contain text.
   * @ret textContent   A List that contains extracted text and an output filename for each MIME part.
   */
  def extractText() : List[(String, String)] = {
    val textContent = ListBuffer[(String, String)]()

    try {
      val parser : MyMimeMessageParser = emailParser.parse
      val from = decodeHeader(parser.getFrom)
      log.info("from: " + rmNewline(from))

      val to: Seq[Address] = parser.getTo
      to.foreach(a => log.info("to: " + rmNewline(decodeHeader(a.toString))))

      val cc: Seq[Address] = parser.getCc
      cc.foreach(b => log.info("cc: " + rmNewline(decodeHeader(b.toString))))

      // The subject could contain some important text
      val subject = decodeHeader(parser.getSubject)
      log.info("subject: " + subject)
      if (!subject.isEmpty) textContent += ((subject, "subject.txt"))
      
      // HTML content takes priority over plain content because sometimes email text shows up as
      // a "text/html" attachment, like the email signature.  For example, if the sender puts an
      // attachment in the middle of the email body, the first half of the email body will show
      // up as plain text and html content, and the second half will show up as an html
      // attachment. For this reason, it makes sense to give higher priority to the HTML content.
      //
      // Content-Transfer-Encoding is handled by MimeMessage when the email object is created
      if (parser.hasHtmlContent) {
        val htmlCharset = parser.htmlContentCharset
        log.debug("htmlCharset: " + htmlCharset)
        val htmlText = parse(parser.htmlContent, "text/html", htmlCharset)
        log.debug("htmlContent: " + htmlText)
        if (!htmlText.isEmpty) textContent += ((htmlText, "htmlContent.txt"))
      } else if (parser.hasPlainContent) {
        val plainCharset = parser.plainContentCharset
        log.debug("plainContentCharset: " + plainCharset)
        val plainText = parse(parser.plainContent, "text/plain", plainCharset)
        log.debug("plainContent: " + plainText)
        if (!plainText.isEmpty) textContent += ((plainText, "plainContent.txt"))
      } else if(parser.hasAttachments) {
        log.warn("Email contains neither plain text content nor html content, but has attachments.")
      } else {
        log.warn("Email contains neither plain text content nor html content, and has no attachments.")
      } 

      // Extract text from attachments, but skip the attachment if it's type is one we don't care about.
      if (!attachmentTypes.isEmpty && parser.hasAttachments) {
        val (attachments, attachmentCharsets) = (parser.attachments, parser.attachmentCharsets)
        log.info("numAttachments: " + attachments.size)

        for (((attachment, attachmentCharset), idx) <- (attachments zip attachmentCharsets).zipWithIndex) {
          val attachmentType = attachment.getContentType
          val attachmentName = if(attachment.getName != null) attachment.getName else "attachment_"+idx+".txt"
          if (attachmentTypes contains attachmentType) {
            log.info("Extracting text from [attachment;type;charset]: [" + attachmentName + ";" + attachmentType + ";" + attachmentCharset + "]")
            val attachmentContent = parse(attachment, "UTF-8"); // TODO: temporarily set to UTF-8 to get rid of errors.  Need to verify this is the right thing to do.
            log.debug("attachment content: " + attachmentContent)
            if(!attachmentContent.isEmpty) textContent += ((attachmentContent, attachmentName))
          } else {
            log.info("Skipping [attachment;type;charset]: [" + attachmentName + ";" + attachmentType + ";" + attachmentCharset + "]")
          }
        }
      }
    } catch {
      case e : Throwable =>
        log.warn("Unable to process " + fn + " because: " + e.getMessage)
        e.printStackTrace
    }

    log.debug("-----------------------------------------------------")
    textContent.toList
  }
}

object EmailParser extends App {
  import EmailParserLog._  
  log.info("Launching EmailParser")
  
  val usage =
    """|Usage:
       |  EmailParser [options] (--no-attachments | --some-attachments | --more-attachments | --extra-attachments)
       |  EmailParser --help | -h
       |
       |Options:
       |  -h --help                          Show this message.
       |  -c CHARSET --charset=CHARSET       The default charset to use if not specified in the MIME header [default: UTF-8]
       |  -e PATH --email-dir=PATH           Path to email directory [default: ./test/resources/email]
       |  -t PATH --text-dir=PATH            Path to text directory [default: ./output/text]
       |  -u PATH --unprocessed-dir=PATH     Path to unprocessed directory [default: ./output/unprocessed]
       |  -s SUFFIX --email-suffix=SUFFIX    Suffix of email file names [default: .eml]
       |  -U --unwrap                        Undo line wrap
       |  -S --split-parts                   Splits text parts into individual files under one directory for each email
       |  --no-attachments                   Process no attachments (technically this will only process .html attachments to get the signature)
       |  --some-attachments                 Process some attachments (.eml, .txt, .rtf, .html)
       |  --more-attachments                 Process more attachments (.eml, .txt, .rtf, .html, .pdf, .doc)
       |  --extra-attachments                Process extra attachments (.eml, .txt, .rtf, .html, .pdf, .doc, .xls, .ppt, octet-stream)
       |""".stripMargin

  // Command line processor (code copied from scala-tools config.scala)
  val Positional = """^<.*>$""".r
  def printUsage(usage : String, errors : String*) {
    for (e <- errors) System.err.println(e)
    for (l <- usage.split("""\n""")) System.err.println(l)
  }

  def parseArgs(usage : String, args : Array[String]) = {
    val parsed  = try { Docopt(usage, args, help = true) } 
                  catch { 
                    case x : org.docopt.utils.DocoptExitException =>
                      printUsage(usage, s"ERROR: Invalid command line: ${args.mkString(" ")}")
                      throw Usage(Map[String, Any]())
                    case x : org.docopt.utils.UnconsumedTokensException =>
                      printUsage(usage, s"ERROR: Left over data after parsing command line ${x.getMessage}")
                      throw Usage(Map[String, Any]())
                  }
    val res = parsed.map { case (k, v) => k.replaceAll("^--", "").replaceAll("^-", "").replaceAll("^<", "").replaceAll(">$", "") -> v }
    
    // BUG: the following code should be handled in docopt
    // 1. help should exit
    // 2. null positionals should fail
    val nullPositional = (for ((Positional(k), v) <- parsed; if v == null) yield k).toSeq
    if ((parsed.isDefinedAt("--help") && parsed("--help").asInstanceOf[Boolean]) ||
        (nullPositional.length != 0)) {
      printUsage(usage, (for (k <- nullPositional) yield s"ERROR: $k is required but was not specified") : _*)
      if (nullPositional.length > 0) throw MissingPositionals(res)
      else sys.exit() //throw Usage(res)
    }
    res
  } // end of copied code
  
  val config = parseArgs(usage, args)
  val charset = config("charset").asInstanceOf[String]
  val doUnwrap = config("unwrap").asInstanceOf[Boolean]
  val doSplit = config("split-parts").asInstanceOf[Boolean]
  val (emailDir, emailSuffix) = (config("email-dir").asInstanceOf[String], config("email-suffix").asInstanceOf[String])
  val (textDir, textSuffix) = (config("text-dir").asInstanceOf[String], ".txt")
  val unprocessedDir = config("unprocessed-dir").asInstanceOf[String]
  new File(textDir).mkdirs()
  new File(unprocessedDir).mkdirs()
    
  // will not parse xml, py
  // TODO: My implementation handles attached emails, but for some reason it prints the output twice.
  //       I think Apache Tika is parsing both plain text and html text in the attached email. Since
  //       this won't happen as often, I'll let it slide for now.
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

  val attachmentsToProcess : Set[String] = {
    if (config("no-attachments").asInstanceOf[Boolean]) { 
      log.info("EmailParser will not process attachments")
      attachmentTypes("none")
    }
    else if (config("some-attachments").asInstanceOf[Boolean]) {
      log.info("EmailParser will process some attachments")
      attachmentTypes("none") ++ attachmentTypes("some")
    }
    else if (config("more-attachments").asInstanceOf[Boolean]) {
      log.info("EmailParser will process more attachments")
      attachmentTypes("none") ++ attachmentTypes("some") ++ attachmentTypes("more")
    }
    else if (config("extra-attachments").asInstanceOf[Boolean]) {
      log.info("EmailParser will process extra attachments")
      attachmentTypes("none") ++ attachmentTypes("some") ++ attachmentTypes("more") ++ attachmentTypes("extra")
    }
    else { 
      printUsage(usage, s"ERROR: Invalid config")
      sys.exit() //throw Usage(config)
    }
  }
  
  val emailsToProcess = new File(emailDir).listFiles.filter(_.getName.endsWith(emailSuffix))
  val numEmails = emailsToProcess.size

  var numProcessed = 0
  for (email <- emailsToProcess) {
    numProcessed += 1
    val emailFn = email.getName
    log.info("Processing email ("+numProcessed+" of "+numEmails+"): "+emailFn)
    val ep = new EmailParser(email.getPath, attachmentsToProcess, charset)
    val text = ep.extractText()

    if(text.size > 0) {
      val textFn = emailFn.replaceAll("\\.[^.]*$", textSuffix)
      def textWriter(fn: String) = new PrintWriter(new OutputStreamWriter(new FileOutputStream(fn, false), "UTF-8"))
      val splitDir = new File(textDir+"/"+emailFn.replaceAll("\\.[^.]*$", ""))
      if(doSplit) splitDir.mkdir()
      (doUnwrap, doSplit) match {
        case (true, true) =>
          text.map{ case (part,fn) =>
            val writer = textWriter(splitDir+"/"+fn.replaceAll("\\.[^.]*$", textSuffix))
            // append empty string to end of split part will ensure unwrapped parts don't overlap
            try ep.unwrap(part.split("\n"):+"").foreach(writer.println) finally writer.close
          }
        case (true, false) =>
          val writer = textWriter(textDir+"/"+textFn)
          try ep.unwrap(text.map{case (part, fn) => part}.mkString("\n").split("\n"):+"").foreach(writer.println) finally writer.close
        case (false, true) =>
          text.map{ case (part,fn) =>
            val writer = textWriter(splitDir+"/"+fn.replaceAll("\\.[^.]*$", textSuffix))
            try writer.println(part.replaceAll("\n{2,}", "\n")) finally writer.close
          }
        case (false, false) =>
          val writer = textWriter(textDir+"/"+textFn)
          try text.foreach{ case (part, fn) => writer.println(part.replaceAll("\n{2,}", "\n")) } finally writer.close
        case _ => log.error("Expected a tuple of Boolean values")
      }
    } else {
      val unprocessedFn = unprocessedDir+"/"+emailFn
      val emailReader = Source.fromInputStream(new FileInputStream(new File(email.getPath)))
      val unprocessedWriter = new PrintWriter(new OutputStreamWriter(new FileOutputStream(unprocessedFn, false)))
      emailReader.getLines.foreach(unprocessedWriter.println)
      emailReader.close
      unprocessedWriter.close
    }
  }
  log.info("Finished processing " + numProcessed + " emails.")
}
