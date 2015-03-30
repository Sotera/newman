---
layout: page
title: Quick Start
permalink: /quick-start/
---

Install [Vagrant](http://www.vagrantup.com/)  
Install [Virtual Box](https://www.virtualbox.org/wiki/Downloads)  
Download [Newman-VM-1.1.2](https://www.dropbox.com/s/h0pyxjj3rlhodv0/newman-vm-v1.1.2.box?dl=0) to your home directory
{% highlight bash %}
$ vagrant init newman-vm-v1.1.2 ~/newman-vm-v1.1.2.box  
$ vagrant up  
$ vagrant ssh  
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
