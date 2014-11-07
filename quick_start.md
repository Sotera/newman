---
layout: page
title: Quick Start
permalink: /how-to/
---

## Quick Start
Install [Vagrant](http://www.vagrantup.com/)  
Install [Virtual Box] (https://www.virtualbox.org/wiki/Downloads)  
Download [XData-VM v0.2.1] (http://goo.gl/5jCBem) to your home directory
    $ vagrant box add xdata-0.2.1 xdata-0.2.1.box  

Download Newman-VM  

{% highlight bash %}  
$ git clone https://github.com/Sotera/newman-vm  
$ cd newman-vm  
$ vagrant up  
$ vagrant ssh  
$ cd /srv/software  
$ git clone https://github.com/Sotera/newman  
$ tangelo restart  
{% endhighlight %}

In a browser goto [http://localhost:8787/ingest.html](http://localhost:8787/ingest.html)  
Enter your gmail username and password and click download  
Once download has completed, click ingest  
Once ingest has completed, goto [http://localhost:8787/](http://localhost:8787/)  

#GMail Download troubleshooting:  
Make sure that Google 2-Step authentication is turned off  
    GMail-> Account-> Security-> 2-Step Verification  
Make sure Access for less secure applications is turned on.  
    GMail-> Account-> Security-> Access for less secure apps.  
