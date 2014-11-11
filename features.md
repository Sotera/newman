---
layout: page
title: Features
permalink: /features/
---

## Graph

The graph shows all of the communications between email addresses in
the current view.  It is built by directing the **From** to each
**To/Cc/Bcc**.  The thickness of the line shows more communications
between the two nodes. 

# Domains  
With **Domains** selected all of the nodes are colored by domain.  

<img class="expandable" alt="Domain Graph" src="../img/graph_domain.png">

# Domains Legend
Email Domains shows a list of all of the visible domains on the screen
with the count for each along with the color. Hovering over one of the
rows will highlight all of the emails for that domain in the graph.   

<img class="expandable" alt="Email Domains" src="../img/email_domains_highlighted.png">


# Community

With **Community** selected all of the nodes are colored by domain.  

<img class="expandable" alt="Community Graph" src="../img/graph_community.png">

## Email Table

The tab at the bottom of the window can be expanded and collapsed.
This shows a meta data view of the emails and can be sorted by each
column. It also can be sorted in to conversations by the icon. By
selecting one of the rows the contents of that email will be displayed
in the [Email View](#email-view) pane.

<img class="expandable" alt="Email Table" src="../img/email_table_01.png">

## Search

# Free Text

Free text allows the user to search all emails and attachments for
text.  The search is backed by
[elasticsearch](http://www.elasticsearch.org) and will result all
of the matching emails.

<img class="expandable" alt="Free Text Search" src="../img/search_free_text.png">

# Email Address
Email Address search allows the user to search for a specific email
address. This will filter the emails where this email address is in
either the **From/To/Cc/Bcc**.  

<img class="expandable" alt="Email Address Search" src="../img/search_email_addr.png">

## Rank

Rank uses a custom algorithm to determine _important_ email addresses
in the data set. 

<img class="expandable" alt="Rank" src="../img/rank.png">

Checking the **Rank** option in the graph will highlight the ranked
nodes in red on the graph.  Hovering over an email address will
highlight that node in the graph in yellow.

<img class="expandable" alt="Rank" src="../img/rank_graph.png">

## Entities

The entities tab shows the highest occurring entities extracted by
[MITIE](https://github.com/mitll/MITIE) Clicking on one of the
entities will requery for emails which contain that entity.

<img class="expandable" alt="Entities" src="../img/entities.png">

## Topics

The topics tab shows the topics among all of the emails. Clicking on
one of the topics will requery for all of the emails that score
greater than 50% on that topic.


<img class="expandable" alt="Topics" src="../img/topics_tab.png">

## Email View 

# ActiveSearch Recommendation

Seeding [ActiveSearch](https://github.com/AutonlabCMU/ActiveSearch) by
clicking the **Seed Active Search** button. This will start the
recommendation by using the current email as the seed. 

<img class="expandable" alt="active_search" src="../img/activesearch.png">

**Interested**/**Not Interested** - clicking the _thumbs up_ icon will
  tell ActiveSearch the current email is interesting and to show more
  emails like this.  The _thumbs down_ says the current email is not
  interesting and to not show emails similar to it.

# Email Body Entities

Each email has entities extracted by
[MITIE](https://github.com/mitll/MITIE) highlighted in the body of the
text.  Clicking on one of the tagged entities will requery for all of
the emails that contain that entity.

<img class="expandable" alt="Email Entities" src="../img/email_entities.png">

# Mark Pertinent

At the top right of the [Email View](#email-view) you can mark and
email pertinent by clicking the star

<img class="expandable" alt="Pertinent Star" src="../img/email_star.png">

The list of marked emails can be viewed in [Export](#export)

# Email Topics

At the top of each email view is a bar chart showing the topic scores
from
[MIT-LL Topic Clustering](https://github.com/mitll/topic-clustering)
each bar shows the percentage the current email scored in that topic.
Clicking on one of the bars will take you back to the
[Topics](#topics) view and highlight the specific topic clicked.

<img class="expandable" alt="Email Topics" src="../img/email_topics.png">

## Attachments

In the [Email View](#email-view) you can click on the senders name
this will populate the attachments tab with all of the attachments
ever sent by that email address. Images are shown as previews and
clicking on the title of the attachment will allow you to download it.
You can also click the arrow to take you to that email. 

<img class="expandable" alt="Attachments" src="../img/attachments.png">

## Export

Export lists all of the emails [marked pertinent](#mark-pertinent).
Each email is listed with their id and the subject of the email.  The
user can click on the id of an email to [view](#email-view) that
email.  Also by clicking the create export a tarball of the original
emails and their attachments will be bundled and made available to download.  

<img class="expandable" alt="Export" src="../img/export.png">
