
;;
;; How To Run
;; tail -n +2 output.csv | java -cp .:lib/* clojure.main tika.clj $EMAIL_TARGET $DIR -
;;

(ns tika)

(import
 '(java.io InputStream File FileInputStream StringWriter)
 '(org.apache.tika Tika)
 '(org.apache.tika.metadata Metadata)
 '(org.apache.tika.language LanguageIdentifier)
 '(org.apache.tika.parser Parser AutoDetectParser ParseContext)
 '(org.apache.tika.sax BodyContentHandler))

(require '[clojure.data.json :as json])

;; Magic Numbers
(def CHUNK-SIZE 200)

;; Command Line Args
(def email-target (first *command-line-args*))
(def out-directory (second *command-line-args*))

(def FILE-SEP (System/getProperty "file.separator"))

;; left pad with 0s
(defn zero-pad [i]
  (format "%07d" i))

;; print to STDERR
(defn prn-err [s]
  (binding [*out* *err*]
    (println s)))

;; configured json writer
(defn write-json [o]
  (json/write-str o :escape-slash false ))

;; clean string 
(defn escape-body [body]
  (let [clean_body
        (reduce #(clojure.string/replace %1 %2 " ") body
                (list #"\[:newline:\]"
                      #"\["
                      #"\]"
                      #"mailto:"
                      #"[^\x00-\x7F]"))]
    clean_body))

;;tika extract text contents from file path
;;using auto detect parser
(defn extract-text [fp]
  (let [p (AutoDetectParser.)
        is (FileInputStream. (File. fp))
        t (BodyContentHandler. -1)]
    (doto p
      (.parse is t (Metadata.)))
    (.toString t)))

;; process attachments to map
(defn process-attachments [email_id dir attach-str]
  (let [files (clojure.string/split attach-str #";")
        id (fn [i] (str "attach_" email_id "_" i))
        attach_json (fn [f i]
                      (let [fp (str "demail/emails/" email-target "/" dir "/" f)]
                        (hash-map
                         :id (id i)
                         :email_id email_id
                         :file_path fp
                         :contents (if (.exists (clojure.java.io/as-file fp))
                                     (try
                                       (extract-text fp)
                                       (catch Exception e
                                         ""))
                                     (do
                                       (prn-err (str "FILE NOT FOUND - " fp))
                                       "")))))]
    (map attach_json files (iterate inc 1))))

(defn extract-phone-numbers [body]
  (let [r (re-pattern "(\\d{3})\\D*(\\d{3})\\D*(\\d{4})\\D*(\\d*)$")
        matches (re-seq r body)
        ;; take match groups index 1,2,3 and concatenate them as string
        normalize (fn [arr] (apply str (take 3 (rest arr))))]
    (map normalize matches)))

;; process line to json
(defn process-line [l]
  (let [items (clojure.string/split l #"\t")
        attach (nth items 10 "")
        id (nth items 0)
        dir (nth items 1)
        froms (nth items 5 "")
        tos (clojure.string/split (nth items 6 "") #";") 
        ccs (clojure.string/split (nth items 7 "") #";")
        bccs (clojure.string/split (nth items 8 "") #";")
        body (escape-body (nth items 15 ""))
        m (hash-map :id id
                    :dir dir
                    :attach attach
                    :attachments (if (clojure.string/blank? attach)
                                   []
                                   (process-attachments id dir attach))
                    :phone-numbers (extract-phone-numbers body)
                    :from froms
                    :to tos
                    :cc ccs
                    :bcc bccs
                    :subject (nth items 14 "")
                    :body body)]
    (list (write-json { :index { :_id (:id m) }}) (write-json m))))

;; write lines to file 
(defn write-chunk [i text-seq]
  (spit
   (str out-directory FILE-SEP "ingest.part_" (zero-pad i))
   (clojure.string/join \newline text-seq)))


;; main read from <STDIN>
(doseq [chunk (map
               #(list %1 %2)
               (iterate inc 1)
               (partition-all CHUNK-SIZE
                              (line-seq (java.io.BufferedReader. *in*))))]
  (let [[i parts] chunk]
    (write-chunk i (mapcat #(process-line %) parts))))

