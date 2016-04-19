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

### Search Criteria

![Free Text Search](../img/search_free_text.png)

The search text box is backed by [elasticsearch](http://www.elasticsearch.org) 
and will return results for all the emails and attachments ingested. For a detailed 
guide, navigate to [Elastic Search Guide](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html#query-dsl-query-string-query)
This query string is parsed into a series of terms and operators. A term can be a 
single word like `quick` or `brown` or a phrase, surrounded by double quotes
`"quick brown"` which searches for all the words in the phrase, in the same 
order. Operators allow the analyst to customize the search. Operations that are 
supported include field names, wildcards, fuzziness, proximity searches, ranges, 
Boolean operators, and grouping. Elastic Search has a list of reserved characters 
that need a leading backslash to escape them. The reserved characters are: `+ - = && || > < ! ( ) { } [ ] 
^ " ~ * ? : \ /`

####**Field Names**
When no fields are specified, every field is by default searched. 
The fields available for searching depend on the dataset and how it was ingested. Most 
datasets based on email will include the following fields:

   `body`     |		`body_lang`     |	`body_translated`     | 
   `subject`  |		`subject_lang`  |	`subject_translated`  | 
   `senders`  | 	`bccs`   |	`ccs`   |  `tos`  | 
   `addrs` (this is an aggregated field that includes searches senders, bccs, ccs, tos)  |
   `attachments.extension`  |  `attachments.exif.gps`  |   `attachments.content`  |
   `attachments.filesize`   |	 `attachments.filename`  |

Example searches

|  `subject:quick`           |	where subject field contains quick
|  `subject:quick OR brown`  |	where subject field contains quick or brown
|  `subject:quick brown`     |	where subject field contains quick or brown. If you omit 
the OR operator the default operator will be used and for most datasets this is the 
OR operator.
|  `body:”quick brown”`      |	where body field contains the exact phrase “quick brown”
|  `_missing_:subject`       |	where the field subject has no value
|  `_exists_:attachments.exif.gps`  |	where the field attachments.exif.gps has a value (i.e. has location)

Note: capitalization does not matter for search terms (i.e. a search for `quick` `Quick` 
or `QUICK` will return the same results). The operators (`OR AND NOT`) must be 
capitalized and the field names must be all lowercase.

####**Wildcards**
Wildcard searches can be run on individual terms, using ? to replace a single character, and * to replace zero or more characters:

		`jo?n`	`john*`

Be aware that wildcard queries can take longer to execute; in particular, searches with a wildcard at the beginning of a word (`*ing`).

####**Fuzziness**
Search for terms that are similar to, but not exactly like our search terms. Using the “fuzzy” operator will find all terms with a maximum of two changes, where a change is the insertion, deletion or substitution of a single character or transposition of two adjacent characters. Different edit distances can be specified by including a number (~1). Using a distance of 1 is usually sufficient to catch 80% of all human misspellings.
 
		`Jon~`		`tomato~`

####**Proximity searches**
While a phrase query (`“john smith”`) expects all of the terms inexactly the same order, a proximity query allows the specified words to be further apart or in a different order. In the same way that fuzzy queries can specify a maximum edit distance for characters in a word, a proximity search allows the analyst to specify a maximum edit distance of words in a phrase. 

		`“john smith”~5`       finds John Smith, John Adams Smith, Smith, John

####**Ranges**
Can be specified for date, numeric, or string fields. Inclusive ranges are specified with square brackets [min TO max] and exclusive ranges with curly brackets {min TO max}

   `Attachments.filesize:[100 TO 500]`	
   `Attachments.filesize:[10000 TO *]`	
   `Attachments:filesize [1000 TO 5000}`
   `Attachment:filesize:>10000`
   `Attachments:filesize:>=10000`
   `Attachments:filesize:<10000`
   `Attachments:filesize:<=10000`

####**Boolean operators**
By default, all terms are optional, as long as one term matches. A search for foo bar baz will find any document that contains one or more of foo or bar or baz.  There are also boolean operators which can be used in the query string itself to provide more control.
The preferred operators are + (this term must be present) and - (this term must not be present). All other terms are optional. For example, this query:

		`quick brown +fox -news`

states that:
•	fox must be present
•	news must not be present
•	quick and brown are optional — their presence increases the relevance

The familiar operators `AND`, `OR` and `NOT` (also written &&, || and !) are also supported. However, the effects of these operators can be more complicated than is obvious at first glance. `NOT` takes precedence over `AND`, which takes precedence over `OR`. While the `+` and `-` only affect the term to the right of the operator, `AND` and `OR` can affect the terms to the left and right.

####**Grouping**
Multiple terms or clauses can be grouped together with parenthesis to form sub queries.
		`subject:(quick OR brown) AND body:fox`

###Filtering

By default, the only active filter is the Date range control. The initial dates picked are maximized to include as many emails as possible. 

![Date Filter](../img/date_filter.png)

The filter dropdown is defaulted to ![All filter](../img/all_filter.png) which means nothing is filtered and searches are against all the data in the dataset selected. This includes all email sections (from, to, cc, bcc, subject, body) and all attachments. The dropdown list includes an option to filter the search to return just the search text and its results ![Test filter](../img/text_filter.png) and an option to search just the email address (from, to, cc, bcc) ![Email filter](../img/email_filter.png) .

### Search Results

![Search Results](../img/search_results.png)

Each search populates the dashboard list that includes the search term and the top 20 email addresses that contain email/attachments containing the search term. Counts are provided for the number of Emails Sent, Emails Received, File Attachments, Search Matched, and Accounts Associated. Note: the Search Matched count will often not equal all the values added below because the Date range filter control has filtered out some emails from Search Matched and only the top 20 emails are included.

Each Search performed also updates the Analysis widgets in the right hand panel. By default this includes all email addresses but can be filtered by using the last column in this view named Aggregate. Selecting the checkboxes in this column will filter the data sent to the analysis widgets which updates the display.

Selecting the search term or a specific email address populates a social graph and email/attachments list. 

##**Analysis Widgets**

###**Email Distribution**

This widget shows the distribution of emails and attachments sent and received. The email addresses shown are selected by the analyst or include the top four email addresses with the most traffic if no email addresses have been selected.

![Email Distribution](../img/email_distribution.png)

###**Entities/Topics**

The entities tab shows the highest occurring entities extracted by
[MITIE](https://github.com/mitll/MITIE) . Clicking on one of the
entities will requery for emails which contain that entity.

![Entities](../img/entities.png)

The topics tab shows the topics among all of the emails. Clicking on one of the topics will re-query for all of the emails that score greater than 75% on that topic.

![Topics](../img/topics_tab.png)

###**Ranks/Domains/Communities/Attach Types

Rank uses a custom algorithm to determine _important_ email addresses in the data set. Clicking on one of the Ranks will re-query for all the emails for that email address.

![Rank](../img/rank.png)

Domains listed are the top 10 domains of all the emails in the dataset selected. 

![Email Domains](../img/domains.png)

Communities listed are the top 10 communities in the dataset selected. A community is determined by an algorithm run on the server. Currently, the Community is arbitrarily named by one of the email addresses. A better name will be provided in the future with either the top topic in that community and/or number of entities in that community.

![Email Communities](../img/communities.png)

Attach Types provides the top 10 types of attachments for the dataset selected.

![Attach Types](../img/attach_types.png)

##**Graph**

The graph shows all of the communications between email addresses in
the current view.  It is built by directing the **From** to each
**To/Cc/Bcc**.  The thickness of the line shows more communications
between the two nodes. As mentioned previously, the graph gets generated 
based off of email address selected, search result selected, or record in one 
of the analysis widgets.

###**Graph Display**

The graph can be colored by Domain or Community. The display can also show the Rank and Labels by toggling them on/off. Toggle the dropdown arrow for Legend to show a list of all of the visible Communities (or Domains) on the screen with the count for each along with the color. Hovering over one of the rows will highlight all of the emails for that Community (or Domain) in the graph. Hovering over a node will provide a count for Inbound and Outbound for that email address.

![Community Graph](../img/graph_community.png)

##**Geo Display**

The geo display (map) shows all of the emails and attachments that have location data. The location from emails is a simple geo-lookup against the IP address and is just an approximate geographic location of the message sender. Attachments (in particular photos) may contain exif data which is more accurate. 

The analyst can pan the map, zoom in, zoom out, and plot all the email that have location data. Selecting a location pin provides a list of emails associated with that location. The analyst can scroll through this list and display the email contents.

![Geo Display](../img/geo_display.png)

##**Email Table**

The email table is populated by the same actions that populate the graph (selecting search term, email address, or record in analysis widget). This table contains a list of all the emails that matched the search criteria (including date range filter). The data can be sorted by each column.  Selecting one of the rows displays the contents of that email in the Email View pane.

Selecting View Starred will list all the emails that have been marked as pertinent.

![Email Table](../img/email_table_01.png)

##**Attachments**

The attachments table is populated by the same actions that populate the graph and email table (selecting search term, email address, or record in analysis widget). This table is populated with all of the attachments ever sent or received by that email address. Images are shown as previews and clicking on the title of the attachment will allow you to download it. You can also click the record to take you to that email.

![Attachments](../img/attachments.png)

##**Email View**

###**Entity Highlighting**

Each email has entities extracted by
[MITIE](https://github.com/mitll/MITIE) highlighted in the body of the
text.  Clicking on one of the tagged entities will requery for all of
the emails that contain that entity. The terms highlighted in yellow italics are not entities but the search term used. If a search term is also an entity then the entity highlighting takes precedence. 

![Email Entities](../img/email_entities.png)

###**Mark Pertinent**

At the top right of the [Email View](#email-view) you can mark email pertinent (starred) by clicking the star. This action updates the Email List.  These starred emails are the emails that can be exported. The list of marked emails can be viewed in Export.

![Pertinent Star](../img/email_star.png)

###**Mark Read**

Selecting checkbox for Read updates the Email List to grey out the record to indicate that the email has been read.

###**Topic Scores**

At the top of each email view is a bar chart showing the topic scores
from
[MIT-LL Topic Clustering](https://github.com/mitll/topic-clustering)
each bar shows the percentage the current email scored in that topic.
Mouse over each bar to see the top 10 terms that make up that topic. 
Clicking on one of the bars will re-query the dataset for that topic. 

![Email Topics](../img/email_topics.png)

###**Email Conversation Intersection**

For any email displayed, the analyst can get all the emails to a particular recipient. First select the recipient (from the To, Cc, or Bcc line) and then the Conversation button. This action updates the Email list to include only those emails from/to the selected addresses from that point forward or backward in time.

![Conversation](../img/conversation.png)

###**Email Translation**

Email translation is provided for emails in another language using the ![Translation Button](../img/translation_button.png) button. Currently, at this time only translations for Spanish is implemented. 

##**Export**

Export creates an export.tar.gz file in the Download folder of all the emails that the user marked as pertinent (starred). The analyst can see a list of emails that have been marked by selecting View Starred in the Email View pane.  The zipped file contains a separate folder for each email selected for export that contains a Chrome HTML Document with a summary of the email, a text information with the same information but without the graphics, the raw data in JSON file format and all the attachments.

![Export](../img/export.png)
![Export](../img/export_files.png)

Below is an example of the HTML summary.

![Export](../img/export_html_summary.png)
