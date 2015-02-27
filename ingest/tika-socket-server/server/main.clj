(ns socket_server)

(import '(java.net ServerSocket)
        '(java.io InputStream File FileInputStream StringWriter)
        '(org.apache.tika Tika)
        '(org.apache.tika.metadata Metadata)
        '(org.apache.tika.language LanguageIdentifier)
        '(org.apache.tika.parser Parser AutoDetectParser ParseContext)
        '(org.apache.tika.sax BodyContentHandler))

(require '[clojure.java.io :as io])

(defn prn-err [s]
  (binding [*out* *err*]
        (println s)))

(defn socket-receive
  "read a line of textual data from the given socket"
  [socket]
  (let [msg (.readLine (io/reader socket))]
    msg))

(defn socket-send
  "send the given string message out over the given socket"
  [socket msg]
  (let [writer (io/writer socket)]
    (.write writer msg)
    (.flush writer)))

(defn serve-persistent [port handler]
  (let [running (atom true)]
    (future
      (with-open [server-sock (ServerSocket. port)]
        (while @running
          (with-open [sock (.accept server-sock)]
            (let [msg-in (socket-receive sock)
                  msg-out (handler msg-in)]
              (socket-send sock msg-out))))))
    running))

(defn extract-text [fp]
  (let [p (AutoDetectParser.)
        is (FileInputStream. (File. fp))
        t (BodyContentHandler. -1)]
    (doto p
      (.parse is t (Metadata.)))
    (.toString t)))

;;instructions
(def RUOK (char 0x2))
(def TEXT (char 0x4))
(def META (char 0x8))
(def TERMINATE (char 0x3))

;;return code that command was successful
(def SUCCESS (char 0x1))
(def FAIL (char 0x2))

;;end of stream
(def EOS (char 0))

(defn file_request_handler [fp]
  (do
    (println "recv " fp)
    (if (.exists (clojure.java.io/as-file fp))
      (try
        [true (extract-text fp)]
        (catch Exception e
          (do
            (prn-err (str "ERROR - " fp "\n" e))
            [false (str "ERROR - " fp "\n" e)])))
      (do
        (prn-err (str "FILE NOT FOUND - " fp))
        [false "FILE NOT FOUND - " fp]))))

(defn shutdown-server []
  (future
    (Thread/sleep 500)
    (println "--- shutdown ---")
    (System/exit 0)))


;; response is a byte leading byte of success/fail, string of message
;; followed by \x00 terminating byte 
(defn response [[successful? msg]]
  (str (if successful? SUCCESS FAIL) msg EOS))

(defn route [msg]
  (let [r (get msg 0)]
    (condp = r
      ;; to test if services is running
      RUOK (do
             (println "server check")
             (response [true "ok"]))
      ;; extract text from file path
      TEXT (do
             (println "file extract")
             (response (file_request_handler (subs msg 1))))
      ;; get meta data of a document
      META (response [false "not implemented"])
      ;;stop server
      TERMINATE (do
                  (println "shutdown command")                  
                  (shutdown-server)
                  (response [true "stopped"])) 
      (do
        (prn-err (str "ERROR UNKNOWN ROUTE : " (str (int r))))
        (response [false (str "UNKNOWN ROUTE : " (str (int r)))])))))

;; Start server
;;(serve-persistent 9999 route)
(def srv (serve-persistent 9999 route))
(println "--- server started ---")
