---
layout: page
title: Quick Start
permalink: /quick-start/
---

# Newman Pre-requisites
1. Install [Vagrant](http://www.vagrantup.com/)  
2. Install [Virtual Box](https://www.virtualbox.org/wiki/Downloads) 
3. Install SSH client - If you have Git, just add it to your Path System variable. Select **Start** button , right-click on Computer, select **Properties**, select **Advanced system settings** link, select **Environment Variables…** button, scroll to System Variables **Path** and then select it, select the **Edit…** button, scroll to the end of the text field and add **C:\Program Files (x86)\Git;C:\Program Files (x86)\Git\bin**. Git is not required but a SSH client is. Other options include installing Cygwin, MinGW or your personal favorite SSH client.

# Newman Setup
1. Download the latest Newman release. Note: The latest version as of 8/23/2016 is [Newman-VM-2.1.3](https://www.dropbox.com/s/8moepdqfiqpuvhf/newman-vm-v2.1.3.box?dl=0).
2. Copy from Download directory to a known location like C:\Users\jsmith\virtualboxvms\
3. Open a CMD terminal - select Windows **Start** icon, type **cmd**, select **cmd.exe**.
4. Change directory to **cd virtualboxvms**. The prompt should now be **C:\Users\jsmith\virtualboxvms>**.
5. Type in the following commands at the **C:\Users\jsmith\virtualboxvms\** prompt:
{% highlight bash %}
vagrant init newman-vm-v2.1.3 newman-vm-v2.1.3.box
vagrant up
vagrant ssh
vagrant@vagrant-ubuntu-trusty-64:/$tangelo restart
{% endhighlight %}

Notes: during this setup process, if you get an error stating a Vagrantfile exists. Just delete or rename the Vagrantfile and the .vagrant folder and all its contents and re-run command. The vagrant up command takes approximately 15 minutes the first time it is initiated.

In Chrome browser, navigate to **http://localhost:8787** to initiate Newman.

# Ingest Process
1.	See [Features](http://sotera.github.io/newman/features/) for the steps to ingest data.  
2.	A progress indicator for ingest is in work that will eventually be located under the Tasks tab. For now, you can check http://localhost:8787/ingester/status. The time it takes to ingest a file is dependent on the system environment and size of file of being ingested. It takes about 10 minutes to ingest a 180MB pst file with an 8GB base memory vm.

# Creating PST File in Outlook 2010
1. On the Home tab, in the New Items group, navigate to More Items | Outlook Data File.
2. In the Create or Open Outlook Data File dialog box, in the File name box, type the name as you want it to appear in the Outlook Navigation Pane, and then click OK.
3. In Outlook Navigation Pane, copy specific email or entire email folders to the pst folder just created.
4. Right-click on pst folder and Close before ingesting into Newman.

# Elastic Search Notes
•	Elastic Search tool: navigate to http://localhost:9200/_plugin/head to see the metadata and structure of what is being indexed.<br />
•	Elastic Search query syntax can be found [here](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html#query-dsl-query-string-query)



