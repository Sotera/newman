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
1. Download the latest Newman release. Note: The latest version as of 8/23/2016 is [Newman-VM-2.1.3](https://www.dropbox.com/s/h0pyxjj3rlhodv0/newman-vm-v1.1.2.box?dl=0).
2. Copy from Download directory to a known location like C:\Users\jsmith\virtualboxvms\
3. Open a CMD terminal - select Windows **Start** icon, type **cmd**, select **cmd.exe**.
4. Change directory to **cd virtualboxvms. The prompt should now be **C:\Users\jsmith\virtualboxvms>**.
5. Type in the following commands at the **C:\Users\jsmith\virtualboxvms\** prompt:
{% highlight bash %}
vagrant init newman-vm-v2.1.3 newman-vm-v2.1.3.box
vagrant up
vagrant ssh
vagrant@vagrant-ubuntu-trusty-64:/$tangelo restart
{% endhighlight %}
6. In Chrome browser, navigate to **http://localhost:8787**

Note: if you have already executed a vagrant init, then you will get an error stating a Vagrantfile exists. Just delete or rename the Vagrantfile and the .vagrant folder and all its contents and re-run command. The vagrant up command takes approximately 15 minutes the first time it is initiated.

# Ingest Process
1.	Select the **Database Icon** and **New Dataset…** to start the ingest process. 
2.	Enter the name of the pst file or mbox file. Note: the pst or mbox file needs to be located in the vagrant root directory. If you followed the setup steps above, this would be C:\Users\jsmith\virtualboxvms. Eventually, the file picker will be activated and you would then just navigate to the file.
3.	Enter a label. The label does not have to be the same name as the file being ingested.
4.	Select the dataset type. Note: Only pst and mbox files are supported at this time; eventually, eml files/directories will be supported.
5.	Optional: add additional labels for Case ID and Alt Ref ID.
6.	Select **Confirm** to start the process. Currently there is no status on the ingest progress. A status feature is in work that will eventually be located under the Tasks tab. For now, you can check http://localhost:8787/ingester/status. The time it takes to ingest a file is dependent on the system environment and size of file of being ingested. It takes about 10 minutes to ingest a 180MB pst file with an 8GB base memory vm.

## Creating PST File in Outlook 2010
You can create a pst file from Outlook 2010 by following these steps:
1.	On the Home tab, in the New Items group, navigate to More Items | Outlook Data File<br />
2.	In the Create or Open Outlook Data File dialog box, in the File name box, type the name as you want it to appear in the Outlook Navigation Pane, and then click OK<br />
3.	In Outlooks Navigation Pane, copy specific emails or entire email folders to the pst folder just created<br />
4.	Right-click on pst folder and Close before using ingesting into Newman<br />

# Elastic Search Notes
•	Elastic Search tool: navigate to http://localhost:9200/_plugin/head to see the metadata and structure of what is being indexed.<br />
•	Elastic Search query syntax can be found [here](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html#query-dsl-query-string-query)



