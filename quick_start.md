---
layout: page
title: Quick Start
permalink: /quick-start/
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


# Setting Up Your Gmail Account:  

## Enable IMAP in your Gmail settings.  
  1. Sign in to Gmail.
  1. Click the gear in the top right corner.
  1. Select Settings.
  1. Click Forwarding and POP/IMAP.
  1. Select Enable IMAP.
  1. Click Save Changes.  

## Update your Google Security settings:  
Goto [Google Security](https://security.google.com)  
Make sure "2-Step Verification" is **Disabled**.  
Make sure "Access for less secure applications" is **Enabled**.  
![Google Security Pane](../img/google_security.png)
