---
layout: page
title: Quick Start
permalink: /how-to/
---

Install [Vagrant](http://www.vagrantup.com/)  
Install [Virtual Box](https://www.virtualbox.org/wiki/Downloads)  
Download [XData-VM v0.2.1](http://goo.gl/5jCBem) to your home directory
{% highlight bash %}
$ vagrant box add xdata-0.2.1 ~/xdata-0.2.1.box  
{% endhighlight %}

Install Newman  
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

# Video Demonstration  

<iframe src="http://www.youtube.com/embed/E9zAR9Uoo3Q" width="964" height="723" allowfullscreen="" frameborder="0"></iframe>  


# GMail Download troubleshooting:  
Goto [Google Security](https://security.google.com)  
Make sure "2-Step Verification" is **Disabled**.  
Make sure "Access for less secure applications" is **Enabled**.  
<img class="expandable" alt="Google Security Pane" src="../img/google_security.png">
