---
layout: page
title: Features
permalink: /features/
---
Update in progress April 18, 2016

![Newman Home Page](../img/newman_home.png)

## Login

Currently, all the analyst has to do is navigate to the instance 
(IP address and port). Future revisions may require a 
username/password combination.

## Search

The first step in an investigation is usually to initiate a search. 
Before that can happen, the data must be loaded into Newman and is 
currently done outside of the Newman GUI. Multiple data sets (mailboxes, 
mbox, pst files) can be loaded; however, at this time only one dataset 
can be searched against. So, the analyst has to choose which dataset to 
search against to begin. In this example, the shiavo dataset was 
selected from the dropdown list. After selection, the Newman GUI updates 
to show the top 20 email addresses based on traffic (sent/received email).

# Search Criteria

![Free Text Search](../img/search_free_text.png)

The search text box is backed by [elasticsearch](http://www.elasticsearch.org) 
and will return results for all the emails and attachments ingested. For a detailed 
guide, navigate to [Elastic Search Guide](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html#query-dsl-query-string-query)
This query string is parsed into a series of terms and operators. A term can be a 
single word like **quick** or **brown** or a phrase, surrounded by double quotes
"**quick brown**" which searches for all the words in the phrase, in the same 
order. Operators allow the analyst to customize the search. Operations that are 
supported include field names, wildcards, fuzziness, proximity searches, ranges, 
Boolean operators, and grouping. Elastic Search has a list of reserved characters 
that need a leading backslash to escape them. For instance to search for **(1+1)=2**, 
enter **\(1\+1\)\=2**.  The reserved characters are: + - = && || > < ! ( ) { } [ ] 
^ " ~ * ? : \ /

**Field Names** - When no fields are specified, every field is by default searched. 
The fields available for searching depend on the dataset and how it was ingested. Most 
datasets based on email will include the following fields:

**body				body_lang   			body_translated 
subject		  	subject_lang  		subject_translated 
senders 			bccs			      	ccs 			         	tos 
addrs** (this is an aggregated field that includes searches senders, bccs, ccs, tos)
**attachments.extension	   attachments.exif.gps   	attachments.content
attachments.filesize	   attachments.filename**

Example searches

**subject:quick**				where subject field contains quick
**subject:quick OR brown**		where subject field contains quick or brown
**subject:quick brown**	where subject field contains quick or brown. If you omit 
the OR operator the default operator will be used and for most datasets this is the 
OR operator.
**body:”quick brown”**			where body field contains the exact phrase “quick brown”
**_missing_:subject**			where the field subject has no value
**_exists_:attachments.exif.gps**	where the field attachments.exif.gps has a value (i.e. has location)

Note: capitalization does not matter for search terms (i.e. a search for **quick Quick** 
or **QUICK** will return the same results). The operators (OR AND NOT) must be 
capitalized and the field names must be all lowercase.

# Email Address
Email Address search allows the user to search for a specific email
address. This will filter the emails where this email address is in
either the **From/To/Cc/Bcc**.  

![Email Address Search](../img/search_email_addr.png)

# Domains  
With **Domains** selected all of the nodes are colored by domain.  

![Domain Graph](../img/graph_domain.png)

# Domains Legend
Email Domains shows a list of all of the visible domains on the screen
with the count for each along with the color. Hovering over one of the
rows will highlight all of the emails for that domain in the graph.

![Email Domains](../img/email_domains_highlighted.png)


# Community

With **Community** selected all of the nodes are colored by domain.  

![Community Graph](../img/graph_community.png)

## Email Table

The tab at the bottom of the window can be expanded and collapsed.
This shows a meta data view of the emails and can be sorted by each
column. It also can be sorted in to conversations by the icon. By
selecting one of the rows the contents of that email will be displayed
in the [Email View](#email-view) pane.

![Email Table](../img/email_table_01.png)



## Rank

Rank uses a custom algorithm to determine _important_ email addresses
in the data set.

![Rank](../img/rank.png)

Checking the **Rank** option in the graph will highlight the ranked
nodes in red on the graph.  Hovering over an email address will
highlight that node in the graph in yellow.

![Rank](../img/rank_graph.png)

## Entities

The entities tab shows the highest occurring entities extracted by
[MITIE](https://github.com/mitll/MITIE) Clicking on one of the
entities will requery for emails which contain that entity.

![Entities](../img/entities.png)

## Topics

The topics tab shows the topics among all of the emails. Clicking on
one of the topics will requery for all of the emails that score
greater than 50% on that topic.


![Topics](../img/topics_tab.png)

## Email View

# ActiveSearch Recommendation

Seeding [ActiveSearch](https://github.com/AutonlabCMU/ActiveSearch) by
clicking the **Seed Active Search** button. This will start the
recommendation by using the current email as the seed.

![active_search](../img/activesearch.png)

**Interested**/**Not Interested** - clicking the _thumbs up_ icon will
  tell ActiveSearch the current email is interesting and to show more
  emails like this.  The _thumbs down_ says the current email is not
  interesting and to not show emails similar to it.

# Email Body Entities

Each email has entities extracted by
[MITIE](https://github.com/mitll/MITIE) highlighted in the body of the
text.  Clicking on one of the tagged entities will requery for all of
the emails that contain that entity.

![Email Entities](../img/email_entities.png)

# Mark Pertinent

At the top right of the [Email View](#email-view) you can mark and
email pertinent by clicking the star

![Pertinent Star](../img/email_star.png)

The list of marked emails can be viewed in [Export](#export)

# Email Topics

At the top of each email view is a bar chart showing the topic scores
from
[MIT-LL Topic Clustering](https://github.com/mitll/topic-clustering)
each bar shows the percentage the current email scored in that topic.
Clicking on one of the bars will take you back to the
[Topics](#topics) view and highlight the specific topic clicked.

![Email Topics](../img/email_topics.png)

## Attachments

In the [Email View](#email-view) you can click on the senders name
this will populate the attachments tab with all of the attachments
ever sent by that email address. Images are shown as previews and
clicking on the title of the attachment will allow you to download it.
You can also click the arrow to take you to that email.

![Attachments](../img/attachments.png)

## Graph

The graph shows all of the communications between email addresses in
the current view.  It is built by directing the **From** to each
**To/Cc/Bcc**.  The thickness of the line shows more communications
between the two nodes.

## Export

Export lists all of the emails [marked pertinent](#mark-pertinent).
Each email is listed with their id and the subject of the email.  The
user can click on the id of an email to [view](#email-view) that
email.  Also by clicking the create export a tarball of the original
emails and their attachments will be bundled and made available to download.  

![Export](../img/export.png)
