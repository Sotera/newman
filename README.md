# newman

<img src="http://www.seinfeldscripts.com/images/newman1.jpg" height="400" align="right" />

<div>
When you control the mail, you control...information.

Look at the fullrun.bat/sh file to understand how to get the tangelo web app up and running initially.

Get raw Scott Walker data to work with at: https://www.dropbox.com/s/7eq6or39ttbes3l/sw_emails.zip
</div>

<h3>Dependencies</h3>

**MySQL** [http://dev.mysql.com/downloads/mysql/](http://dev.mysql.com/downloads/mysql/)
<br/>
> admin set as u: root p: root

**Python 2.7.x**
```
pip install mysql-connector-python
pip install tangelo
```

**Perl** - (Only for ingest of ActiveSearch)
- DBI
- DBD:mysql 

_Perl Manual Dependency Install_ <br/>
http://search.cpan.org/~capttofu/DBD-mysql-4.027/lib/DBD/mysql.pm#Manual_Installation

_Perl Dependency Downloads_:
- https://metacpan.org/pod/DBI
- https://metacpan.org/pod/DBD::mysql

**jblas** - (For ActiveSearch)
- make sure fortran compiler is installed
  https://github.com/mikiobraun/jblas/wiki/Missing-Libraries
    - `sudo apt-get install libgfortran3`
    
- download jblas 1.2.3.jar http://mikiobraun.github.io/jblas/
- install in m2 `mvn install:install-file -Dfile=jblas-1.2.3.jar -DgroupId=org.jblas -DartifactId=jblas -Dversion=1.2.3 -Dpackaging=jar`
      


**MITIE: MIT Information Extraction** - [https://github.com/mit-nlp/MITIE](https://github.com/mit-nlp/MITIE)<br/>
**Topic Clustering** - [https://github.com/mitll/topic-clustering](https://github.com/mitll/topic-clustering)<br/>
**ActiveSearch** - [https://github.com/AutonlabCMU/ActiveSearch](https://github.com/AutonlabCMU/ActiveSearch)
