# newman

<img src="http://www.seinfeldscripts.com/images/newman1.jpg" height="400" align="left" />
<div style="float:left;padding-left: 10px;">When you control the mail, you control...information.</div>


Look at the fullrun.bat/sh file to understand how to get the tangelo web app up and running initially.


Get raw Scott Walker data to work with at: [https://www.dropbox.com/s/7eq6or39ttbes3l/sw_emails.zip](https://www.dropbox.com/s/7eq6or39ttbes3l/sw_emails.zip)



<div style="clear:both;" />

<h3>Dependencies</h3>

MySQL [http://dev.mysql.com/downloads/mysql/](http://dev.mysql.com/downloads/mysql/)
<br/>
> admin set as u: root p: root

Python 2.7.x
```
pip install mysql-connector-python
pip install tangelo
```

Perl - (Only for ingest of ActiveSearch)
- DBI
- DBD:mysql 

http://search.cpan.org/~capttofu/DBD-mysql-4.027/lib/DBD/mysql.pm#Manual_Installation

Downloads:
- https://metacpan.org/pod/DBI
- https://metacpan.org/pod/DBD::mysql



MITIE: MIT Information Extraction - [https://github.com/mit-nlp/MITIE](https://github.com/mit-nlp/MITIE)<br/>
Topic Clustering - [https://github.com/mitll/topic-clustering](https://github.com/mitll/topic-clustering)<br/>
ActiveSearch - [https://github.com/AutonlabCMU/ActiveSearch](https://github.com/AutonlabCMU/ActiveSearch)
