/**
 * mk.scala : Build script for EmailParser
 *
 * @author Michael A. Coury <BR>
 * <tt><a href=mailto:michael.coury@ll.mit.edu>michael.coury@ll.mit.edu</a></tt> <BR>
 * Copyright &copy; 2014 Massachusetts Institute of Technology, Lincoln Laboratory
 */
import make._;

case class EmailParserBuild(path : String = ".") extends Build {
  // ------------------------------------------------------------------------------------------------------------------
  // Setup
  // ------------------------------------------------------------------------------------------------------------------
  implicit val cwd = path;
  val libs          = files("lib", "jar")
  val quickLibs     = libs.filter(_.getName != "scala-tools-wo-deps.jar")
  val scalaLibs     = Array("tools" / "scala-library.jar", "tools" / "scala-compiler.jar", "tools" / "scala-reflect.jar")
  val srcs          = files("src", "scala", true)
  val fullSrcs      = srcs ++ files("test", "scala", true)
  val finaltgt      = "EmailParser.jar"
  val quicktgt      = "EmailParser-wo-deps.jar"
  val mainClass     = "mitll.hlt.clir.EmailParser"
  val mainClassTest = "mitll.hlt.clir.EmailParserTest"
  val settings      = scSettings.copy
  settings.optimise.value = true
  
  // ------------------------------------------------------------------------------------------------------------------
  // Targets
  // ------------------------------------------------------------------------------------------------------------------
  val compile = { (srcs : Array[File], libs : Array[File]) =>
    zinc("build", settings, libs, srcs : _*)
    touch("build-track/compile")
  } -> File("build-track/compile")

  def fulljar(target : File) = { (dir : File, compile : File, libs : Seq[File]) =>
    pack(target, dir, main = mainClass, jars = libs)
  } -> File(target)
  
  def full = {
    mkdir("build", "build-track")
    fulljar(finaltgt)("build", compile(fullSrcs, libs), libs ++ scalaLibs)
  }
  
  def quick = {
    mkdir("build", "build-track")
    fulljar(quicktgt)("build", compile(srcs, quickLibs), quickLibs)
  }
  
  publicTargets("emailParser") = full
  publicTargets("ep") = full
  publicTargets("quick") = quick
  publicTargets("clean") = rm(finaltgt, quicktgt, "build", "build-track")
  
  // ------------------------------------------------------------------------------------------------------------------
  // Tests
  // ------------------------------------------------------------------------------------------------------------------
  publicTargets("test-emailParser") = Test(new TestConfig(full, mainClassTest).run)
  publicTargets("test") = {
    for (clazz <- Seq(mainClassTest))
      new TestConfig(full, clazz).run
  }

  // ------------------------------------------------------------------------------------------------------------------
  // Default Build
  // ------------------------------------------------------------------------------------------------------------------
  val defaultTarget = "quick"
}
